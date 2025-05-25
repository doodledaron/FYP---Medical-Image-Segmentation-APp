#segmenttation view

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from .models import SegmentationTask
from .serializers import SegmentationTaskSerializer, SegmentationTaskDetailSerializer
from .tasks import process_segmentation_task
import logging
from django.conf import settings
import os
from nibabel.processing import resample_to_output
import nibabel as nib 
import traceback

logger = logging.getLogger(__name__)

class SegmentationTaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing lung segmentation tasks
    """
    queryset = SegmentationTask.objects.all()
    serializer_class = SegmentationTaskSerializer
    parser_classes = (MultiPartParser, FormParser)
    
    def get_serializer_class(self):
        if self.action == 'retrieve' or self.action == 'status':
            return SegmentationTaskDetailSerializer
        return SegmentationTaskSerializer
    
    def create(self, request, *args, **kwargs):
        print(f"=== SEGMENTATION TASK CREATE REQUEST ===")
        print(f"Request method: {request.method}")
        print(f"Request files: {list(request.FILES.keys())}")
        print(f"Request data keys: {list(request.data.keys())}")
        
        nifti_file = request.FILES.get("nifti_file")
        print(f"NIFTI file received: {nifti_file}")
        
        if not nifti_file:
            print(f"❌ ERROR: No file uploaded in request")
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        print(f"✓ File details:")
        print(f"  - Name: {nifti_file.name}")
        print(f"  - Size: {nifti_file.size} bytes")
        print(f"  - Content type: {getattr(nifti_file, 'content_type', 'Unknown')}")

        # 1) Save the uploaded file
        print(f"=== CREATING SEGMENTATION TASK ===")
        try:
            task = SegmentationTask.objects.create(
                file_name=nifti_file.name,
                nifti_file=nifti_file,
                status="queued"
            )
            print(f"✓ Task created successfully:")
            print(f"  - Task ID: {task.id}")
            print(f"  - Task status: {task.status}")
            print(f"  - File name: {task.file_name}")
            print(f"  - File path: {task.nifti_file.path}")
            print(f"  - File exists: {os.path.exists(task.nifti_file.path)}")
        except Exception as e:
            print(f"❌ ERROR: Failed to create task: {str(e)}")
            import traceback
            print(f"Task creation error traceback:\n{traceback.format_exc()}")
            return Response({"error": f"Failed to create task: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 2) Down‐sample in place to 2 mm³ voxels
        print(f"=== DOWNSAMPLING NIFTI FILE ===")
        input_path = task.nifti_file.path
        print(f"Input path for downsampling: {input_path}")
        
        try:
            print(f"Loading original image for downsampling...")
            # Load full‑resolution image
            img = nib.load(input_path)
            original_shape = img.shape
            original_voxel_sizes = img.header.get_zooms()
            print(f"Original image shape: {original_shape}")
            print(f"Original voxel sizes: {original_voxel_sizes}")
            
            print(f"Resampling to 1.0x1.0x1.0 mm voxels...")
            # Resample to 2×2×2 mm voxels
            img_ds = resample_to_output(img, voxel_sizes=(1.0,1.0,1.0))
            new_shape = img_ds.shape
            new_voxel_sizes = img_ds.header.get_zooms()
            print(f"Resampled image shape: {new_shape}")
            print(f"New voxel sizes: {new_voxel_sizes}")
            
            print(f"Saving downsampled image to: {input_path}")
            # Overwrite the original file with the smaller one
            nib.save(img_ds, input_path)
            
            # Verify the saved file
            if os.path.exists(input_path):
                new_file_size = os.path.getsize(input_path)
                print(f"✓ Downsampled file saved successfully, new size: {new_file_size} bytes")
                
                # Try to reload to verify integrity
                test_img = nib.load(input_path)
                print(f"✓ Downsampled file verification successful, shape: {test_img.shape}")
            else:
                print(f"❌ ERROR: Downsampled file not found after saving")
                
        except Exception as e:
            # If something goes wrong, log and continue with full‑res
            print(f"⚠️  WARNING: Down-sampling failed for task {task.id}: {str(e)}")
            import traceback
            print(f"Downsampling error traceback:\n{traceback.format_exc()}")
            print(f"Continuing with original resolution file...")

        # 3) Now kick off the async segmentation on the (now reduced) file
        print(f"=== STARTING ASYNC SEGMENTATION TASK ===")
        try:
            print(f"Calling process_segmentation_task.delay('{task.id}')...")
            print(f"Task ID type: {type(task.id)}")
            print(f"Task ID value: {task.id}")
            
            # Convert to string to ensure compatibility
            task_id_str = str(task.id)
            print(f"Task ID as string: {task_id_str}")
            
            celery_result = process_segmentation_task.delay(task_id_str)
            print(f"✓ Celery task dispatched successfully")
            print(f"Celery task ID: {celery_result.id}")
            print(f"Celery task state: {celery_result.state}")
            
        except Exception as e:
            print(f"❌ ERROR: Failed to dispatch celery task: {str(e)}")
            import traceback
            print(f"Celery dispatch error traceback:\n{traceback.format_exc()}")
            
            # Update task status to failed
            try:
                task.status = 'failed'
                task.error = f"Failed to start processing: {str(e)}"
                task.save()
                print(f"Task status updated to 'failed'")
            except Exception as save_error:
                print(f"Failed to update task status: {str(save_error)}")
            
            return Response(
                {"error": f"Failed to start processing: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        print(f"=== TASK CREATION COMPLETED ===")
        response_data = {"task_id": task.id, "status": task.status}
        print(f"Returning response: {response_data}")
        
        return Response(
            response_data,
            status=status.HTTP_201_CREATED
        )
    
    def retrieve(self, request, *args, **kwargs):
        print(f"=== RETRIEVE SEGMENTATION TASK ===")
        print(f"Request kwargs: {kwargs}")
        print(f"Request path: {request.path}")
        
        try:
            logger.info(f"Retrieving task with kwargs: {kwargs}")
            print(f"Getting task object...")
            instance = self.get_object()
            print(f"✓ Task retrieved: ID={instance.id}, Status={instance.status}")
            print(f"Task details:")
            print(f"  - File name: {instance.file_name}")
            print(f"  - Created: {instance.created_at}")
            print(f"  - Updated: {instance.updated_at}")
            print(f"  - Has tumor segmentation: {bool(instance.tumor_segmentation)}")
            print(f"  - Has lung segmentation: {bool(instance.lung_segmentation)}")
            
            # Debug FileField details
            if instance.tumor_segmentation:
                print(f"  - Tumor segmentation name: {instance.tumor_segmentation.name}")
                print(f"  - Tumor segmentation name bool: {bool(instance.tumor_segmentation.name)}")
            else:
                print(f"  - Tumor segmentation is None/empty")
                
            if instance.lung_segmentation:
                print(f"  - Lung segmentation name: {instance.lung_segmentation.name}")
                print(f"  - Lung segmentation name bool: {bool(instance.lung_segmentation.name)}")
            else:
                print(f"  - Lung segmentation is None/empty")
            
            serializer = self.get_serializer(instance, context={'request': request})
            
            # Debug: print the serialized data to check URLs
            serialized_data = serializer.data
            print(f"Serialized response data for retrieve:")
            print(f"  - tumor_segmentation_url: {serialized_data.get('tumor_segmentation_url')}")
            print(f"  - lung_segmentation_url: {serialized_data.get('lung_segmentation_url')}")
            print(f"  - nifti_file_url: {serialized_data.get('nifti_file_url')}")
            
            print(f"✓ Task serialized successfully")
            return Response(serialized_data)
        except Exception as e:
            print(f"❌ ERROR: Failed to retrieve task: {str(e)}")
            logger.error(f"Error retrieving task: {e}")
            logger.error(traceback.format_exc())
            print(f"Retrieve error traceback:\n{traceback.format_exc()}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """
        Get the status of a segmentation task
        """
        print(f"=== SEGMENTATION TASK STATUS CHECK ===")
        print(f"Request pk: {pk}")
        print(f"Request path: {request.path}")
        
        try:
            print(f"Getting task object for pk={pk}...")
            task = self.get_object()
            print(f"✓ Task found: ID={task.id}, Status={task.status}")
            print(f"Task details:")
            print(f"  - File name: {task.file_name}")
            print(f"  - Created: {task.created_at}")
            print(f"  - Updated: {task.updated_at}")
            print(f"  - Error: {task.error if hasattr(task, 'error') else 'None'}")
            
            # Debug FileField details
            if task.tumor_segmentation:
                print(f"  - Tumor segmentation name: {task.tumor_segmentation.name}")
                print(f"  - Tumor segmentation name bool: {bool(task.tumor_segmentation.name)}")
            else:
                print(f"  - Tumor segmentation is None/empty")
                
            if task.lung_segmentation:
                print(f"  - Lung segmentation name: {task.lung_segmentation.name}")
                print(f"  - Lung segmentation name bool: {bool(task.lung_segmentation.name)}")
            else:
                print(f"  - Lung segmentation is None/empty")
            
            # Check if both segmentation files exist when the task is completed
            if task.status == 'completed':
                print(f"Task is completed, checking segmentation files...")
                files_to_check = []
                
                if task.tumor_segmentation:
                    tumor_path = task.tumor_segmentation.path
                    print(f"Tumor segmentation path: {tumor_path}")
                    files_to_check.append(('tumor_segmentation', tumor_path))
                else:
                    print(f"⚠️  No tumor segmentation file reference")
                
                if task.lung_segmentation:
                    lung_path = task.lung_segmentation.path
                    print(f"Lung segmentation path: {lung_path}")
                    files_to_check.append(('lung_segmentation', lung_path))
                else:
                    print(f"⚠️  No lung segmentation file reference")
                
                # Verify files exist
                print(f"Verifying {len(files_to_check)} segmentation files...")
                missing_files = []
                for file_type, file_path in files_to_check:
                    print(f"Checking {file_type}: {file_path}")
                    if not os.path.exists(file_path):
                        print(f"❌ Missing: {file_type} at {file_path}")
                        missing_files.append(file_type)
                    else:
                        file_size = os.path.getsize(file_path)
                        print(f"✓ Found: {file_type}, size: {file_size} bytes")
                
                if missing_files:
                    print(f"❌ ERROR: Missing segmentation files: {missing_files}")
                    return Response(
                        {"error": f"The following segmentation files are missing: {', '.join(missing_files)}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                else:
                    print(f"✓ All segmentation files verified")
            else:
                print(f"Task status is '{task.status}', skipping file verification")
            
            # Add context={'request': request} to pass the request to the serializer
            print(f"Serializing task for response...")
            serializer = self.get_serializer(task, context={'request': request})
            
            # Debug: print the serialized data to check URLs
            serialized_data = serializer.data
            print(f"Serialized response data:")
            print(f"  - tumor_segmentation_url: {serialized_data.get('tumor_segmentation_url')}")
            print(f"  - lung_segmentation_url: {serialized_data.get('lung_segmentation_url')}")
            print(f"  - nifti_file_url: {serialized_data.get('nifti_file_url')}")
            
            print(f"✓ Status check completed successfully")
            return Response(serialized_data)
        except SegmentationTask.DoesNotExist:
            print(f"❌ ERROR: Task {pk} not found in database")
            return Response(
                {"error": "Task not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ ERROR: Status check failed: {str(e)}")
            logger.error(f"Error in status action: {e}")
            logger.error(traceback.format_exc())
            print(f"Status check error traceback:\n{traceback.format_exc()}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
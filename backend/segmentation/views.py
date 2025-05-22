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
        nifti_file = request.FILES.get("nifti_file")
        if not nifti_file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        # 1) Save the uploaded file
        task = SegmentationTask.objects.create(
            file_name=nifti_file.name,
            nifti_file=nifti_file,
            status="queued"
        )

        # 2) Down‐sample in place to 2 mm³ voxels
        input_path = task.nifti_file.path
        try:
            # Load full‑resolution image
            img = nib.load(input_path)
            # Resample to 2×2×2 mm voxels
            img_ds = resample_to_output(img, voxel_sizes=(1.0,1.0,1.0))
            # Overwrite the original file with the smaller one
            nib.save(img_ds, input_path)
        except Exception as e:
            # If something goes wrong, log and continue with full‑res
            print(f"Warning: down‐sampling failed for task {task.id}: {e}")

        # 3) Now kick off the async segmentation on the (now reduced) file
        process_segmentation_task.delay(str(task.id))

        return Response(
            {"task_id": task.id, "status": task.status},
            status=status.HTTP_201_CREATED
        )
    
    def retrieve(self, request, *args, **kwargs):
        try:
            logger.info(f"Retrieving task with kwargs: {kwargs}")
            instance = self.get_object()
            serializer = self.get_serializer(instance, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error retrieving task: {e}")
            logger.error(traceback.format_exc())
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """
        Get the status of a segmentation task
        """
        try:
            task = self.get_object()
            
            # Check if both segmentation files exist when the task is completed
            if task.status == 'completed':
                files_to_check = []
                
                if task.tumor_segmentation:
                    tumor_path = task.tumor_segmentation.path
                    files_to_check.append(('tumor_segmentation', tumor_path))
                
                if task.lung_segmentation:
                    lung_path = task.lung_segmentation.path
                    files_to_check.append(('lung_segmentation', lung_path))
                
                # Verify files exist
                missing_files = []
                for file_type, file_path in files_to_check:
                    if not os.path.exists(file_path):
                        missing_files.append(file_type)
                
                if missing_files:
                    return Response(
                        {"error": f"The following segmentation files are missing: {', '.join(missing_files)}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            
            # Add context={'request': request} to pass the request to the serializer
            serializer = self.get_serializer(task, context={'request': request})
            return Response(serializer.data)
        except SegmentationTask.DoesNotExist:
            return Response(
                {"error": "Task not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error in status action: {e}")
            logger.error(traceback.format_exc())
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
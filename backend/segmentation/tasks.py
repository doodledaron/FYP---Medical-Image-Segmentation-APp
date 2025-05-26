from celery import shared_task
from django.core.files import File
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from pathlib import Path
import os
import time
import nibabel as nib
import shutil
import logging

# Get logger
logger = logging.getLogger(__name__)

@shared_task
def dummy_log_test():
    print(">>> Logging works in Celery task <<<")

@shared_task
def process_segmentation_task(task_id):
    """Process a segmentation task asynchronously"""
    from .models import SegmentationTask
    from .nnunet_handler import NNUNetHandler
    
    print(f"=== STARTING SEGMENTATION TASK {task_id} ===")
    print(f"Task ID type: {type(task_id)}")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Python path: {os.environ.get('PYTHONPATH', 'Not set')}")
    
    # Setup a handler to capture all logging and print it
    class CeleryLogHandler(logging.Handler):
        def emit(self, record):
            msg = self.format(record)
            # Print to console so it shows up in Celery logs
            print(f"[NNUNET] {msg}")
    
    # Add the handler to the root logger to capture all logs
    celery_handler = CeleryLogHandler()
    celery_handler.setLevel(logging.INFO)
    logging.getLogger().addHandler(celery_handler)
    print(f"Added celery log handler")
    
    try:
        print(f"Attempting to get task {task_id} from database...")
        # Get the task
        task = SegmentationTask.objects.get(id=task_id)
        print(f"Successfully retrieved task: {task}")
        print(f"Task file name: {task.file_name}")
        print(f"Task status before processing: {task.status}")
        
        print(f"Updating task status to 'processing'...")
        task.status = 'processing'
        task.save(update_fields=['status', 'updated_at'])
        print(f"Task status updated to: {task.status}")

        print(f"Getting input file path...")
        input_file_path = task.nifti_file.path
        print(f"Input NIFTI file path: {input_file_path}")
        print(f"File exists: {os.path.exists(input_file_path)}")
        if os.path.exists(input_file_path):
            file_size = os.path.getsize(input_file_path)
            print(f"File size: {file_size} bytes")
        else:
            print(f"ERROR: Input file does not exist at {input_file_path}")
            raise FileNotFoundError(f"Input file not found: {input_file_path}")

        # Initialize handler and get input path
        print(f"Initializing NNUNetHandler...")
        try:
            nnunet_handler = NNUNetHandler()
            print(f"NNUNetHandler initialized successfully")
        except Exception as e:
            print(f"ERROR: Failed to initialize NNUNetHandler: {str(e)}")
            import traceback
            print(f"NNUNetHandler initialization error traceback:\n{traceback.format_exc()}")
            raise
        
        # Run segmentation
        print(f"=== STARTING SEGMENTATION PREDICTION ===")
        try:
            print(f"Calling nnunet_handler.predict({input_file_path})...")
            result_files = nnunet_handler.predict(input_file_path)
            print(f"nnUNet prediction completed successfully")
            print(f"Result files: {result_files}")
        except Exception as e:
            print(f"nnUNet prediction failed with error: {str(e)}")
            print(f"Exception type: {type(e)}")
            import traceback
            print(f"Prediction error traceback:\n{traceback.format_exc()}")
            print(f"Attempting fallback segmentation...")
            try:
                result_files = nnunet_handler.fallback_inference(input_file_path)
                print(f"Fallback segmentation completed")
                print(f"Fallback result files: {result_files}")
            except Exception as fallback_error:
                print(f"Fallback segmentation also failed: {str(fallback_error)}")
                import traceback
                print(f"Fallback error traceback:\n{traceback.format_exc()}")
                raise
        
        print(f"=== VERIFYING RESULT FILES ===")
        # Verify both result files exist
        for seg_type, file_path in result_files.items():
            print(f"Checking {seg_type} file at: {file_path}")
            if not os.path.exists(file_path):
                print(f"ERROR: Result file not found at {file_path}")
                raise FileNotFoundError(f"Result file not found at {file_path}")
            else:
                file_size = os.path.getsize(file_path)
                print(f"✓ {seg_type} file exists, size: {file_size} bytes")
        
        print(f"=== UPDATING DATABASE REFERENCES ===")
        # Update database references
        media_relative_paths = {
            'tumor_segmentation': os.path.relpath(result_files['tumor_segmentation'], settings.MEDIA_ROOT),
            'lung_segmentation': os.path.relpath(result_files['lung_segmentation'], settings.MEDIA_ROOT)
        }
        print(f"Media relative paths: {media_relative_paths}")
        
        # Clear any existing file references
        print(f"Clearing old file references...")
        for field_name in ['tumor_segmentation', 'lung_segmentation']:
            print(f"Processing {field_name}...")
            old_file = getattr(task, field_name)
            if old_file:
                old_file_path = old_file.path
                print(f"Found old {field_name} file: {old_file_path}")
                old_file.delete(save=False)
                # Only delete the old file if it's different from the new one
                if os.path.exists(old_file_path) and old_file_path != result_files[field_name]:
                    try:
                        os.remove(old_file_path)
                        print(f"✓ Removed old {field_name} file: {old_file_path}")
                    except OSError as e:
                        print(f"Failed to remove old file {old_file_path}: {e}")
            else:
                print(f"No old {field_name} file to remove")
        
        # Update the task with the file paths
        print(f"Updating task with new file paths...")
        
        # Calculate relative paths from MEDIA_ROOT
        tumor_relative_path = os.path.relpath(result_files['tumor_segmentation'], settings.MEDIA_ROOT)
        lung_relative_path = os.path.relpath(result_files['lung_segmentation'], settings.MEDIA_ROOT)
        
        print(f"Tumor relative path: {tumor_relative_path}")
        print(f"Lung relative path: {lung_relative_path}")
        
        # Directly assign the relative paths to the FileField name attributes
        # This tells Django where the files are located relative to MEDIA_ROOT
        task.tumor_segmentation.name = tumor_relative_path
        task.lung_segmentation.name = lung_relative_path
        
        # Save the task with updated file references
        task.save(update_fields=['tumor_segmentation', 'lung_segmentation', 'updated_at'])
        print(f"✓ Task updated with new file paths")
        
        # Verify the FileField names are set correctly
        print(f"Final tumor_segmentation.name: '{task.tumor_segmentation.name}'")
        print(f"Final lung_segmentation.name: '{task.lung_segmentation.name}'")
        print(f"Tumor segmentation file exists: {os.path.exists(task.tumor_segmentation.path)}")
        print(f"Lung segmentation file exists: {os.path.exists(task.lung_segmentation.path)}")
        
        print(f"=== VERIFYING SAVED FILES ===")
        # Verify the saved files can be loaded with nibabel
        for seg_type, file_path in result_files.items():
            print(f"Verifying {seg_type} file: {file_path}")
            try:
                test_load = nib.load(file_path)
                test_shape = test_load.shape
                test_datatype = test_load.get_data_dtype()
                print(f"✓ {seg_type} NIFTI verification successful - shape: {test_shape}, datatype: {test_datatype}")
            except Exception as e:
                print(f"⚠️  {seg_type} file verification failed: {str(e)}")
        
        print(f"=== COMPUTING METRICS ===")
        # Set task to completed with metrics
        try:
            print(f"Analyzing tumor segmentation...")
            # Analyze both segmentations
            tumor_metrics = nnunet_handler.analyze_segmentation(task.tumor_segmentation.path)
            print(f"Tumor metrics: {tumor_metrics}")
            
            print(f"Analyzing lung segmentation...")
            lung_metrics = nnunet_handler.analyze_segmentation(task.lung_segmentation.path)
            print(f"Lung metrics: {lung_metrics}")
            
            # Update task with combined metrics
            print(f"Updating task with metrics...")
            task.tumor_volume = tumor_metrics.get('tumor_volume')
            task.lung_volume = lung_metrics.get('lung_volume')
            task.lesion_count = tumor_metrics.get('lesion_count')
            task.confidence_score = tumor_metrics.get('confidence_score')
            print(f"✓ Metrics updated - Tumor={tumor_metrics}, Lung={lung_metrics}")
        except Exception as e:
            print(f"⚠️  Failed to compute metrics: {str(e)}")
            import traceback
            print(f"Metrics computation error traceback:\n{traceback.format_exc()}")
        
        print(f"=== FINALIZING TASK ===")
        task.status = 'completed'
        task.save(update_fields=['status', 'updated_at',
                                 'tumor_volume', 'lung_volume',
                                 'lesion_count', 'confidence_score'])
        print(f"✓ Task {task_id} completed successfully")
        print(f"=== SEGMENTATION TASK {task_id} COMPLETED ===")
        
    except SegmentationTask.DoesNotExist:
        print(f"❌ ERROR: Task {task_id} not found in database")
    except Exception as e:
        print(f"❌ ERROR: Failed to process segmentation task {task_id}: {str(e)}")
        print(f"Exception type: {type(e)}")
        import traceback
        print(f"Full error traceback:\n{traceback.format_exc()}")
        
        try:
            print(f"Attempting to update task status to 'failed'...")
            task = SegmentationTask.objects.get(id=task_id)
            task.status = 'failed'
            task.error = str(e)
            task.save(update_fields=['status', 'error', 'updated_at'])
            print(f"✓ Task status updated to 'failed'")
        except Exception as update_error:
            print(f"❌ Failed to update task status: {str(update_error)}")
            import traceback
            print(f"Status update error traceback:\n{traceback.format_exc()}")
    finally:
        print(f"Removing celery log handler...")
        # Remove the logging handler
        logging.getLogger().removeHandler(celery_handler)
        print(f"=== EXITING SEGMENTATION TASK {task_id} ===")

@shared_task
def cleanup_old_tasks(days=30):
    """
    Cleanup old segmentation tasks that are older than the specified number of days
    
    Args:
        days: Number of days before tasks are considered old (default: 30)
    """
    from .models import SegmentationTask
    cutoff_date = timezone.now() - timedelta(days=days)
    old_tasks = SegmentationTask.objects.filter(created_at__lt=cutoff_date)
    print(f"Cleaning up {old_tasks.count()} segmentation tasks older than {days} days")
    old_tasks.delete()
    print(f"Cleanup complete - removed tasks older than {cutoff_date}")
    return old_tasks.count()
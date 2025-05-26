from celery import shared_task
from django.core.files import File
from django.core.files.base import ContentFile
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
        
        # Update the task with the file paths
        print(f"Updating task with new file paths...")
        
        # Calculate relative paths from MEDIA_ROOT
        tumor_relative_path = os.path.relpath(result_files['tumor_segmentation'], settings.MEDIA_ROOT)
        lung_relative_path = os.path.relpath(result_files['lung_segmentation'], settings.MEDIA_ROOT)
        
        print(f"Tumor relative path: {tumor_relative_path}")
        print(f"Lung relative path: {lung_relative_path}")
        print(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
        print(f"Tumor absolute path: {result_files['tumor_segmentation']}")
        print(f"Lung absolute path: {result_files['lung_segmentation']}")
        
        # Verify files exist before assignment
        print(f"Tumor file exists: {os.path.exists(result_files['tumor_segmentation'])}")
        print(f"Lung file exists: {os.path.exists(result_files['lung_segmentation'])}")
        
        # Clear any existing file references first
        print(f"Clearing existing file references...")
        if task.tumor_segmentation:
            print(f"Clearing existing tumor segmentation: {task.tumor_segmentation.name}")
            task.tumor_segmentation.delete(save=False)
        if task.lung_segmentation:
            print(f"Clearing existing lung segmentation: {task.lung_segmentation.name}")
            task.lung_segmentation.delete(save=False)
        
        # Directly assign the relative paths to the FileField name attributes
        print(f"Assigning file paths to FileFields...")
        task.tumor_segmentation.name = tumor_relative_path
        task.lung_segmentation.name = lung_relative_path
        
        print(f"After assignment - tumor_segmentation.name: '{task.tumor_segmentation.name}'")
        print(f"After assignment - lung_segmentation.name: '{task.lung_segmentation.name}'")
        print(f"After assignment - tumor_segmentation bool: {bool(task.tumor_segmentation)}")
        print(f"After assignment - lung_segmentation bool: {bool(task.lung_segmentation)}")
        
        # Save the task with updated file references
        print(f"=== SAVING TASK TO DATABASE ===")
        try:
            task.save(update_fields=['tumor_segmentation', 'lung_segmentation', 'updated_at'])
            print(f"✓ Task saved to database successfully")
        except Exception as save_error:
            print(f"❌ ERROR saving task to database: {str(save_error)}")
            import traceback
            print(f"Task save error traceback:\n{traceback.format_exc()}")
        
        # Reload the task from database to verify the save worked
        print(f"=== RELOADING TASK FROM DATABASE ===")
        try:
            task.refresh_from_db()
            print(f"After reload - tumor_segmentation.name: '{task.tumor_segmentation.name}'")
            print(f"After reload - lung_segmentation.name: '{task.lung_segmentation.name}'")
            print(f"After reload - tumor_segmentation bool: {bool(task.tumor_segmentation)}")
            print(f"After reload - lung_segmentation bool: {bool(task.lung_segmentation)}")
        except Exception as reload_error:
            print(f"❌ ERROR reloading task from database: {str(reload_error)}")
            import traceback
            print(f"Task reload error traceback:\n{traceback.format_exc()}")
        
        # Verify the FileField names are set correctly
        print(f"=== FINAL VERIFICATION ===")
        print(f"Final tumor_segmentation.name: '{task.tumor_segmentation.name}'")
        print(f"Final lung_segmentation.name: '{task.lung_segmentation.name}'")
        print(f"Final tumor_segmentation bool: {bool(task.tumor_segmentation)}")
        print(f"Final lung_segmentation bool: {bool(task.lung_segmentation)}")
        
        if task.tumor_segmentation.name and task.tumor_segmentation.name != 'None':
            try:
                tumor_path = task.tumor_segmentation.path
                print(f"Tumor segmentation path: {tumor_path}")
                print(f"Tumor segmentation file exists: {os.path.exists(tumor_path)}")
            except Exception as e:
                print(f"Error getting tumor segmentation path: {e}")
        else:
            print(f"Tumor segmentation name is empty or None - cannot check file existence")
            
        if task.lung_segmentation.name and task.lung_segmentation.name != 'None':
            try:
                lung_path = task.lung_segmentation.path
                print(f"Lung segmentation path: {lung_path}")
                print(f"Lung segmentation file exists: {os.path.exists(lung_path)}")
            except Exception as e:
                print(f"Error getting lung segmentation path: {e}")
        else:
            print(f"Lung segmentation name is empty or None - cannot check file existence")
        
        # Don't clean up the original files since we're referencing them directly
        print(f"=== SKIPPING FILE CLEANUP (using files in place) ===")
        
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
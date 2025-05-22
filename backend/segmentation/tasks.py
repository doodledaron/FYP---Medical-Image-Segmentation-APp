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

@shared_task
def dummy_log_test():
    print(">>> Logging works in Celery task <<<")

@shared_task
def process_segmentation_task(task_id):
    """Process a segmentation task asynchronously"""
    from .models import SegmentationTask
    from .nnunet_handler_mock import NNUNetHandlerMock as NNUNetHandler
    
    print(f"Starting segmentation task {task_id}")
    
    try:
        # Get the task
        task = SegmentationTask.objects.get(id=task_id)
        task.status = 'processing'
        task.save(update_fields=['status', 'updated_at'])

        # Initialize handler and get input path
        nnunet_handler = NNUNetHandler()
        input_file_path = task.nifti_file.path
        print(f"Input NIFTI file path: {input_file_path}")
        
        # Run segmentation
        try:
            print(f"Running nnUNet segmentation on {input_file_path}")
            result_files = nnunet_handler.predict(input_file_path)
        except Exception as e:
            print(f"Using fallback segmentation due to error: {str(e)}")
            result_files = nnunet_handler.fallback_inference(input_file_path)
        
        # Verify both result files exist
        for seg_type, file_path in result_files.items():
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Result file not found at {file_path}")
            print(f"{seg_type} file generated at: {file_path}")
        
        # Update database references
        media_relative_paths = {
            'tumor_segmentation': os.path.relpath(result_files['tumor_segmentation'], settings.MEDIA_ROOT),
            'lung_segmentation': os.path.relpath(result_files['lung_segmentation'], settings.MEDIA_ROOT)
        }
        
        # Clear any existing file references
        for field_name in ['tumor_segmentation', 'lung_segmentation']:
            old_file = getattr(task, field_name)
            if old_file:
                old_file_path = old_file.path
                old_file.delete(save=False)
                # Only delete the old file if it's different from the new one
                if os.path.exists(old_file_path) and old_file_path != result_files[field_name]:
                    try:
                        os.remove(old_file_path)
                        print(f"Removed old {field_name} file: {old_file_path}")
                    except OSError as e:
                        print(f"Failed to remove old file {old_file_path}: {e}")
        
        # Update the task with the file paths
        task.tumor_segmentation.name = media_relative_paths['tumor_segmentation']
        task.lung_segmentation.name = media_relative_paths['lung_segmentation']
        task.save(update_fields=['tumor_segmentation', 'lung_segmentation'])
        
        # Verify the saved files can be loaded with nibabel
        for seg_type, file_path in result_files.items():
            try:
                test_load = nib.load(file_path)
                test_shape = test_load.shape
                test_datatype = test_load.get_data_dtype()
                print(f"Verification successful - Saved {seg_type} NIFTI shape: {test_shape}, datatype: {test_datatype}")
            except Exception as e:
                print(f"WARNING - Saved {seg_type} file verification failed: {str(e)}")
        
        # Set task to completed with metrics
        try:
            # Analyze both segmentations
            tumor_metrics = nnunet_handler.analyze_segmentation(task.tumor_segmentation.path)
            lung_metrics = nnunet_handler.analyze_segmentation(task.lung_segmentation.path)
            
            # Update task with combined metrics
            task.tumor_volume = tumor_metrics.get('tumor_volume')
            task.lung_volume = lung_metrics.get('lung_volume')
            task.lesion_count = tumor_metrics.get('lesion_count')
            task.confidence_score = tumor_metrics.get('confidence_score')
            print(f"Analysis complete with metrics: Tumor={tumor_metrics}, Lung={lung_metrics}")
        except Exception as e:
            print(f"WARNING - Failed to compute metrics: {str(e)}")
        
        task.status = 'completed'
        task.save()
        print(f"Completed segmentation task {task_id}")
        
    except SegmentationTask.DoesNotExist:
        print(f"Task {task_id} not found")
    except Exception as e:
        print(f"Error processing segmentation task {task_id}: {str(e)}")
        import traceback
        print(traceback.format_exc())
        
        try:
            task = SegmentationTask.objects.get(id=task_id)
            task.status = 'failed'
            task.error = str(e)
            task.save(update_fields=['status', 'error', 'updated_at'])
        except Exception as update_error:
            print(f"Failed to update task status: {str(update_error)}")

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
from celery import shared_task
from django.core.files import File
from django.utils import timezone
from datetime import timedelta
from pathlib import Path
import os
import time

#testing    
@shared_task
def dummy_log_test():
    print(">>> Logging works in Celery task <<<")

@shared_task
def process_segmentation_task(task_id):
    """
    Process a segmentation task asynchronously
    
    Args:
        task_id: ID of the segmentation task to process
    """
    from .models import SegmentationTask
    from .nnunet_handler_mock import NNUNetHandlerMock as NNUNetHandler
    
    print(f"Starting segmentation task {task_id}")
    
    try:
        task = SegmentationTask.objects.get(id=task_id)
        task.status = 'processing'
        task.save(update_fields=['status', 'updated_at'])

        nnunet_handler = NNUNetHandler()
        input_file_path = task.nifti_file.path
        print(f"Input NIFTI file path: {input_file_path}")
        
        result_file_path = None
        
        try:
            print(f"Running nnUNet segmentation on {input_file_path}")
            result_file_path = nnunet_handler.predict(input_file_path)
        except Exception as e:
            print(f"Using fallback segmentation due to error: {str(e)}")
            result_file_path = nnunet_handler.fallback_inference(input_file_path)
            print(f"Fallback segmentation file: {result_file_path}")
        
        if not os.path.exists(result_file_path):
            print(f"Result file path doesn't exist: {result_file_path}")
            raise FileNotFoundError(f"Result file not found at {result_file_path}")
            
        print(f"Result file generated at: {result_file_path}")
        result_filename = os.path.basename(result_file_path)
        
        with open(result_file_path, 'rb') as f:
            print(f"Saving file {result_filename} to task {task.id}")
            task.result_file.save(result_filename, File(f), save=True)
        
        task.refresh_from_db()
        print(f"Saved result file: {task.result_file.name if task.result_file else 'None'}")
        print(f"Result file path: {task.result_file.path if task.result_file else 'None'}")
        print(f"Result file exists: {task.result_file_exists() if hasattr(task, 'result_file_exists') else 'Not checked'}")
        
        if task.result_file:
            metrics = nnunet_handler.analyze_segmentation(result_file_path)
            task.lung_volume = metrics.get('lung_volume')
            task.lesion_volume = metrics.get('lesion_volume')
            task.lesion_count = metrics.get('lesion_count')
            task.confidence_score = metrics.get('confidence_score')
            task.status = 'completed'
            task.save()
            print(f"Task completed successfully with metrics: {metrics}")
        else:
            print("Result file was not saved to the task")
            task.status = 'failed'
            task.error = "Result file could not be saved to the database"
            task.save()
        
        print(f"Completed segmentation task {task_id}")
        
    except SegmentationTask.DoesNotExist:
        print(f"Task {task_id} not found")
    except Exception as e:
        print(f"Error processing segmentation task {task_id}: {str(e)}")
        
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

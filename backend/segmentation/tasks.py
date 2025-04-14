# task.py execute the task

from celery import shared_task
from django.core.files import File
from django.utils import timezone
from datetime import timedelta
from pathlib import Path
import os
import logging
import time

logger = logging.getLogger(__name__)

#testing    
@shared_task
def dummy_log_test():
    logger.info(">>> Logging works in Celery task <<<")

@shared_task
def process_segmentation_task(task_id):
    """
    Process a segmentation task asynchronously
    
    Args:
        task_id: ID of the segmentation task to process
    """
    from .models import SegmentationTask
    from .nnunet_handler_mock import NNUNetHandlerMock as NNUNetHandler
    
    logger.info(f"Starting segmentation task {task_id}")
    
    try:
        # Get the task from the database
        task = SegmentationTask.objects.get(id=task_id)
        
        # Update status to processing
        task.status = 'processing'
        task.save(update_fields=['status', 'updated_at'])
        
        # Initialize the nnUNet handler
        nnunet_handler = NNUNetHandler()
        
        # Get the path to the input file
        input_file_path = task.nifti_file.path
        logger.info(f"Input NIFTI file path: {input_file_path}")
        
        try:
            # Try to use the real nnUNet model
            logger.info(f"Running nnUNet segmentation on {input_file_path}")
            result_file_path = nnunet_handler.predict(input_file_path)
        except Exception as e:
            # If the real model fails or isn't available, use the fallback
            logger.warning(f"Using fallback segmentation due to error: {str(e)}")
            result_file_path = nnunet_handler.fallback_inference(input_file_path)
            logger.info(f"Fallback segmentation file: {result_file_path}")
        
        # Update task with the result file
        with open(result_file_path, 'rb') as f:
            task.result_file.save(
                os.path.basename(result_file_path),
                File(f),
                save=False
            )
            logger.info(f"Saved result file: {os.path.basename(result_file_path)} to task {task.id}")
        
        # Analyze the segmentation to get metrics
        metrics = nnunet_handler.analyze_segmentation(result_file_path)
        
        # Update task with metrics
        task.lung_volume = metrics.get('lung_volume')
        task.lesion_volume = metrics.get('lesion_volume')
        task.lesion_count = metrics.get('lesion_count')
        task.confidence_score = metrics.get('confidence_score')
        
        # Mark task as completed
        task.status = 'completed'
        task.save()
        
        logger.info(f"Completed segmentation task {task_id}")
        
    except SegmentationTask.DoesNotExist:
        logger.error(f"Task {task_id} not found")
    except Exception as e:
        logger.exception(f"Error processing segmentation task {task_id}: {str(e)}")
        
        # Update task with error
        try:
            task = SegmentationTask.objects.get(id=task_id)
            task.status = 'failed'
            task.error = str(e)
            task.save(update_fields=['status', 'error', 'updated_at'])
        except Exception as update_error:
            logger.error(f"Failed to update task status: {str(update_error)}")


@shared_task
def cleanup_old_tasks(days=30):
    """
    Cleanup old segmentation tasks that are older than the specified number of days
    
    Args:
        days: Number of days before tasks are considered old (default: 30)
    """
    # Import here to avoid circular import
    from .models import SegmentationTask
    
    # Calculate the cutoff date
    cutoff_date = timezone.now() - timedelta(days=days)
    
    # Find old tasks
    old_tasks = SegmentationTask.objects.filter(created_at__lt=cutoff_date)
    
    # Log how many tasks will be deleted
    logger.info(f"Cleaning up {old_tasks.count()} segmentation tasks older than {days} days")
    
    # Delete the tasks (this will also delete associated files thanks to Django's file handling)
    old_tasks.delete()
    
    logger.info(f"Cleanup complete - removed tasks older than {cutoff_date}")
    
    return old_tasks.count()
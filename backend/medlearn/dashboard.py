from datetime import timedelta
from django.db.models import Count
from django.db.models.functions import TruncDay
from django.utils import timezone
from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
import os
import nibabel as nib
import numpy as np
import json
import base64
from io import BytesIO

# Set matplotlib to use non-interactive backend
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from segmentation.models import SegmentationTask

def generate_segmentation_preview(segmentation_path):
    """Generate a preview image from a binary segmentation NIFTI file"""
    try:
        # Check if file exists
        if not os.path.exists(segmentation_path):
            return None
            
        # Load the segmentation file
        seg_img = nib.load(segmentation_path)
        seg_data = seg_img.get_fdata()
        
        # Find middle slice for each dimension
        middle_slice_z = seg_data.shape[2] // 2
        
        # Create a figure
        plt.figure(figsize=(4, 4), dpi=75)
        
        # Create an axial view (slicing along z-axis)
        axial_slice = seg_data[:, :, middle_slice_z].T
        
        # Look for a non-empty slice if middle slice is empty
        if np.max(axial_slice) == 0:
            # Find any non-zero slice by checking sum of each slice
            non_zero_slices = []
            for z in range(seg_data.shape[2]):
                if np.sum(seg_data[:, :, z]) > 0:
                    non_zero_slices.append(z)
            
            # If we found any non-zero slices, use the middle one
            if non_zero_slices:
                middle_slice_z = non_zero_slices[len(non_zero_slices) // 2]
                axial_slice = seg_data[:, :, middle_slice_z].T
        
        # Display background in grayscale
        plt.imshow(np.zeros_like(axial_slice), cmap='gray', alpha=0.5)
        
        # Overlay the segmentation in red
        mask = axial_slice > 0
        plt.imshow(mask, cmap='Reds', alpha=0.7)
        
        plt.axis('off')
        plt.tight_layout(pad=0)
        
        # Save the figure to a BytesIO object
        buf = BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
        plt.close()
        
        # Convert to base64 for embedding in HTML
        buf.seek(0)
        image_base64 = base64.b64encode(buf.read()).decode('utf-8')
        
        return image_base64
    except Exception as e:
        print(f"Error generating preview: {str(e)}")
        return None

@staff_member_required
def admin_dashboard(request):
    """
    Custom admin dashboard with segmentation tasks and metrics
    """
    # Date ranges
    today = timezone.now().date()
    last_7_days = today - timedelta(days=7)
    last_30_days = today - timedelta(days=30)
    
    # Segmentation stats
    task_count = SegmentationTask.objects.count()
    recent_tasks_count = SegmentationTask.objects.filter(created_at__date__gte=last_7_days).count()
    
    # Tasks over time
    tasks_over_time = list(SegmentationTask.objects
                         .filter(created_at__date__gte=last_30_days)
                         .annotate(day=TruncDay('created_at'))
                         .values('day')
                         .annotate(count=Count('id'))
                         .order_by('day'))
    
    # Prepare time labels and data for the chart
    time_labels = [item['day'].strftime('%b %d') for item in tasks_over_time]
    time_data = [item['count'] for item in tasks_over_time]
    
    # Latest segmentation tasks
    latest_tasks = list(SegmentationTask.objects
                       .order_by('-created_at')[:10]
                       .values('id', 'file_name', 'status', 'created_at', 
                              'lesion_volume', 'lesion_count', 'confidence_score'))
    
    # Add preview images to latest tasks
    for task in latest_tasks:
        # Get the task object to access the file path
        task_obj = SegmentationTask.objects.get(id=task['id'])
        if task_obj.result_file and hasattr(task_obj.result_file, 'path') and task_obj.result_file.path:
            task['preview_image'] = generate_segmentation_preview(task_obj.result_file.path)
        else:
            task['preview_image'] = None
        
        # Format confidence score as percentage
        if task['confidence_score'] is not None:
            task['confidence_score'] = task['confidence_score'] * 100
    
    context = {
        'task_count': task_count,
        'recent_tasks_count': recent_tasks_count,
        'time_labels': json.dumps(time_labels),
        'time_data': json.dumps(time_data),
        'latest_tasks': latest_tasks,
    }
    
    return render(request, 'admin/index.html', context)
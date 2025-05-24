from datetime import timedelta
from django.db.models import Count, Sum, Avg, F, Q, Max
from django.db.models.functions import TruncDay, TruncMonth
from django.utils import timezone
from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib import admin
import os
import nibabel as nib
import numpy as np
import json
import base64
from io import BytesIO
import traceback

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
            print(f"Preview generation failed: File not found at {segmentation_path}")
            return None
            
        # Load the segmentation file
        try:
            seg_img = nib.load(segmentation_path)
            seg_data = seg_img.get_fdata()
            print(f"Successfully loaded segmentation with shape: {seg_data.shape}, unique values: {np.unique(seg_data)}")
        except Exception as e:
            print(f"Error loading NIFTI file: {str(e)}")
            return None
        
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
                print(f"Using non-empty slice {middle_slice_z} with max value {np.max(axial_slice)}")
            else:
                print("No non-empty slices found in segmentation")
        
        # Display background in grayscale
        plt.imshow(np.zeros_like(axial_slice), cmap='gray', alpha=0.5)
        
        # Overlay the segmentation in red - handle non-binary segmentation
        if np.max(axial_slice) > 1:
            mask = axial_slice > 0  # Convert to binary if multiple labels
        else:
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
        print(traceback.format_exc())
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
    completed_tasks = SegmentationTask.objects.filter(status='completed').count()
    failed_tasks = SegmentationTask.objects.filter(status='failed').count()
    
    # Calculate success rate
    processing_total = completed_tasks + failed_tasks
    success_rate = (completed_tasks / processing_total * 100) if processing_total > 0 else 0
    
    # Get average statistics
    avg_tumor_volume = SegmentationTask.objects.filter(
        status='completed', 
        tumor_volume__isnull=False
    ).aggregate(Avg('tumor_volume'))['tumor_volume__avg'] or 0
    
    avg_lung_volume = SegmentationTask.objects.filter(
        status='completed',
        lung_volume__isnull=False
    ).aggregate(Avg('lung_volume'))['lung_volume__avg'] or 0
    
    avg_lesion_count = SegmentationTask.objects.filter(
        status='completed',
        lesion_count__isnull=False
    ).aggregate(Avg('lesion_count'))['lesion_count__avg'] or 0
    
    # Tasks over time
    tasks_over_time = list(SegmentationTask.objects
                         .filter(created_at__date__gte=last_30_days)
                         .annotate(day=TruncDay('created_at'))
                         .values('day')
                         .annotate(count=Count('id'))
                         .order_by('day'))
    
    # Status breakdown
    status_counts = SegmentationTask.objects.values('status').annotate(count=Count('id')).order_by('status')
    status_labels = [item['status'].title() for item in status_counts]
    status_data = [item['count'] for item in status_counts]
    
    # Generate date-based labels even if there's no data
    date_labels = []
    date_counts = []
    
    # Generate all dates for the last 30 days
    for i in range(30, 0, -1):
        current_date = today - timedelta(days=i)
        date_labels.append(current_date.strftime('%b %d'))
        
        # Find matching count or use 0
        matching_day = next((item for item in tasks_over_time if item['day'].date() == current_date), None)
        date_counts.append(matching_day['count'] if matching_day else 0)
    
    # Latest segmentation tasks
    latest_tasks = list(SegmentationTask.objects
                       .order_by('-created_at')[:10]
                       .values('id', 'file_name', 'status', 'created_at', 
                              'tumor_volume', 'lung_volume', 'lesion_count', 'confidence_score'))
    
    # Add preview images to latest tasks
    for task in latest_tasks:
        try:
            # Get the task object to access the file paths
            task_obj = SegmentationTask.objects.get(id=task['id'])
            
            # Generate preview for tumor segmentation
            if task_obj.tumor_segmentation and hasattr(task_obj.tumor_segmentation, 'path'):
                print(f"Generating tumor preview for {task_obj.file_name}")
                task['tumor_preview'] = generate_segmentation_preview(task_obj.tumor_segmentation.path)
            else:
                task['tumor_preview'] = None
                
            # Generate preview for lung segmentation
            if task_obj.lung_segmentation and hasattr(task_obj.lung_segmentation, 'path'):
                print(f"Generating lung preview for {task_obj.file_name}")
                task['lung_preview'] = generate_segmentation_preview(task_obj.lung_segmentation.path)
            else:
                task['lung_preview'] = None
            
            # Format confidence score as percentage
            if task['confidence_score'] is not None:
                task['confidence_score'] = task['confidence_score'] * 100
        except Exception as e:
            print(f"Error processing task {task['id']}: {str(e)}")
            print(traceback.format_exc())
            task['tumor_preview'] = None
            task['lung_preview'] = None
    
    context = {
        'task_count': task_count,
        'recent_tasks_count': recent_tasks_count,
        'completed_tasks': completed_tasks,
        'failed_tasks': failed_tasks,
        'success_rate': round(success_rate, 1),
        'avg_tumor_volume': round(avg_tumor_volume, 2),
        'avg_lung_volume': round(avg_lung_volume, 2),
        'avg_lesion_count': round(avg_lesion_count, 1),
        'time_labels': json.dumps(date_labels),
        'time_data': json.dumps(date_counts),
        'status_labels': json.dumps(status_labels),
        'status_data': json.dumps(status_data),
        'latest_tasks': latest_tasks,
    }
    
    print(f"Dashboard data: {task_count} tasks, {completed_tasks} completed, {failed_tasks} failed")
    print(f"Chart data: {len(date_labels)} data points")
    if latest_tasks:
        print(f"First task previews: Tumor={latest_tasks[0].get('tumor_preview') is not None}, Lung={latest_tasks[0].get('lung_preview') is not None}")
    
    return render(request, 'admin/index.html', context)

# Register the SegmentationTask model with the admin
class SegmentationTaskAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'status', 'created_at', 'tumor_volume', 'lung_volume', 'lesion_count', 'confidence_score')
    list_filter = ('status', 'created_at')
    search_fields = ('file_name', 'user__username')
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    def get_queryset(self, request):
        """Override to prefetch related user data"""
        return super().get_queryset(request).select_related('user')

admin.site.register(SegmentationTask, SegmentationTaskAdmin)

# Override the admin index
admin.site.index_template = 'admin/index.html'
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
    Optimized admin dashboard with segmentation tasks and metrics
    """
    start_time = timezone.now()
    
    # Date ranges
    today = timezone.now().date()
    last_7_days = today - timedelta(days=7)
    last_30_days = today - timedelta(days=30)
    
    # OPTIMIZATION 1: Use single aggregation query for all counts
    from django.db.models import Q
    stats = SegmentationTask.objects.aggregate(
        total_count=Count('id'),
        recent_count=Count('id', filter=Q(created_at__date__gte=last_7_days)),
        completed_count=Count('id', filter=Q(status='completed')),
        failed_count=Count('id', filter=Q(status='failed')),
        avg_tumor_volume=Avg('tumor_volume', filter=Q(status='completed', tumor_volume__isnull=False)),
        avg_lung_volume=Avg('lung_volume', filter=Q(status='completed', lung_volume__isnull=False)),
        avg_lesion_count=Avg('lesion_count', filter=Q(status='completed', lesion_count__isnull=False))
    )
    
    task_count = stats['total_count'] or 0
    recent_tasks_count = stats['recent_count'] or 0
    completed_tasks = stats['completed_count'] or 0
    failed_tasks = stats['failed_count'] or 0
    avg_tumor_volume = stats['avg_tumor_volume'] or 0
    avg_lung_volume = stats['avg_lung_volume'] or 0
    avg_lesion_count = stats['avg_lesion_count'] or 0
    
    # Calculate completion rate (completed tasks / total tasks)
    completion_rate = (completed_tasks / task_count * 100) if task_count > 0 else 0
    
    # OPTIMIZATION 2: Simplified time series data (last 7 days only for faster loading)
    tasks_over_time = list(SegmentationTask.objects
                         .filter(created_at__date__gte=last_7_days)
                         .annotate(day=TruncDay('created_at'))
                         .values('day')
                         .annotate(count=Count('id'))
                         .order_by('day'))
    
    # Status breakdown (unchanged - already efficient)
    status_counts = SegmentationTask.objects.values('status').annotate(count=Count('id')).order_by('status')
    status_labels = [item['status'].title() for item in status_counts]
    status_data = [item['count'] for item in status_counts]
    
    # Generate simplified date labels (last 7 days only)
    date_labels = []
    date_counts = []
    for i in range(7, 0, -1):
        current_date = today - timedelta(days=i)
        date_labels.append(current_date.strftime('%b %d'))
        matching_day = next((item for item in tasks_over_time if item['day'].date() == current_date), None)
        date_counts.append(matching_day['count'] if matching_day else 0)
    
    # OPTIMIZATION 3: Limit segmentation tasks for history table and remove preview generation
    segmentation_tasks = SegmentationTask.objects.select_related('user').order_by('-created_at')[:20]
    
    # OPTIMIZATION 4: Remove slow preview generation for faster loading
    # Preview generation is moved to a separate view/endpoint if needed
    
    context = {
        # Simple dashboard data as requested
        'total_segmentations': task_count,
        'completed_segmentations': completed_tasks,
        'completion_rate': round(completion_rate, 1),
        'segmentation_tasks': segmentation_tasks,
        
        # Keep existing context for backward compatibility
        'task_count': task_count,
        'recent_tasks_count': recent_tasks_count,
        'completed_tasks': completed_tasks,
        'failed_tasks': failed_tasks,
        'success_rate': round(completion_rate, 1),
        'avg_tumor_volume': round(avg_tumor_volume, 2),
        'avg_lung_volume': round(avg_lung_volume, 2),
        'avg_lesion_count': round(avg_lesion_count, 1),
        'time_labels': json.dumps(date_labels),
        'time_data': json.dumps(date_counts),
        'status_labels': json.dumps(status_labels),
        'status_data': json.dumps(status_data),
        'latest_tasks': [],  # Removed slow preview generation
    }
    
    # Performance logging
    end_time = timezone.now()
    duration = (end_time - start_time).total_seconds()
    print(f"=== DASHBOARD PERFORMANCE ===")
    print(f"Load time: {duration:.3f} seconds")
    print(f"Dashboard data: {task_count} tasks, {completed_tasks} completed, {failed_tasks} failed")
    print(f"Completion rate: {completion_rate:.1f}%")
    print(f"History table: {len(segmentation_tasks)} recent tasks")
    print(f"=== END PERFORMANCE ===")
    
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

# Configure the default admin site
admin.site.site_header = 'MedLearnAdministration'
admin.site.site_title = 'MedLearnAdmin'
admin.site.index_title = 'Welcome to MedLearn'

# Override the admin index view to use our custom dashboard
def custom_admin_index(request, extra_context=None):
    """Custom admin index that shows our dashboard while preserving admin functionality"""
    return admin_dashboard(request)

# Replace the default admin index view
admin.site.index = custom_admin_index
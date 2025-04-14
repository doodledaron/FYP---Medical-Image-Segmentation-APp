from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import SegmentationTask

@admin.register(SegmentationTask)
class SegmentationTaskAdmin(ModelAdmin):
    list_display = ('id', 'file_name', 'user', 'status_badge', 'created_at', 'lung_info', 'view_files')
    list_filter = ('status', 'created_at')
    search_fields = ('file_name', 'user__username')
    readonly_fields = ('id', 'created_at', 'updated_at', 'result_preview')
    
    fieldsets = (
        (None, {
            'fields': ('id', 'user', 'file_name', 'status')
        }),
        ('Files', {
            'fields': ('nifti_file', 'result_file', 'result_preview'),
        }),
        ('Segmentation Results', {
            'fields': ('lung_volume', 'lesion_volume', 'lesion_count', 'confidence_score'),
        }),
        ('Error Information', {
            'fields': ('error',),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    def status_badge(self, obj):
        """Display status as a colored badge"""
        status_colors = {
            'queued': 'bg-gray-200 text-gray-800',
            'processing': 'bg-blue-200 text-blue-800',
            'completed': 'bg-green-200 text-green-800',
            'failed': 'bg-red-200 text-red-800',
        }
        color_class = status_colors.get(obj.status, 'bg-gray-200 text-gray-800')
        return format_html(
            '<span class="px-2 py-1 rounded-full text-xs font-medium {}">{}</span>',
            color_class, obj.status.capitalize()
        )
    status_badge.short_description = 'Status'
    
    def view_files(self, obj):
        """Generate links to view the files"""
        links = []
        if obj.nifti_file:
            links.append(format_html('<a href="{}" target="_blank" class="text-blue-500 hover:underline">Input File</a>', obj.nifti_file.url))
        if obj.result_file:
            links.append(format_html('<a href="{}" target="_blank" class="text-green-500 hover:underline">Result File</a>', obj.result_file.url))
        
        return format_html(' | '.join(links)) if links else '-'
    view_files.short_description = 'Files'
    
    def lung_info(self, obj):
        """Display lung segmentation information"""
        if obj.lung_volume is not None and obj.lesion_volume is not None:
            return format_html(
                '<div class="grid grid-cols-2 gap-2 text-sm">'
                '<div class="px-2 py-1 bg-blue-100 rounded">Lung: <span class="font-medium">{:.1f} cc</span></div>'
                '<div class="px-2 py-1 bg-red-100 rounded">Lesion: <span class="font-medium">{:.1f} cc</span></div>'
                '<div class="px-2 py-1 bg-purple-100 rounded">Count: <span class="font-medium">{}</span></div>'
                '<div class="px-2 py-1 bg-green-100 rounded">Conf: <span class="font-medium">{:.0f}%</span></div>'
                '</div>',
                obj.lung_volume,
                obj.lesion_volume,
                obj.lesion_count or 0,
                (obj.confidence_score or 0) * 100
            )
        return '-'
    lung_info.short_description = 'Lung Data'
    
    def result_preview(self, obj):
        """Display a preview of the segmentation result if available"""
        if obj.result_file:
            return format_html(
                '<div class="border border-gray-200 rounded p-2">'
                '<img src="{}" width="400" height="auto" alt="Segmentation Preview">'
                '<p class="text-gray-500 text-sm mt-2">Segmentation overlay (placeholder image)</p>'
                '</div>',
                '/static/img/segmentation_placeholder.png'  # Replace with actual image generation
            )
        return "No result file available"
    result_preview.short_description = 'Result Preview'
    
    def has_add_permission(self, request):
        # Allow adding tasks manually for testing
        return request.user.is_superuser
    
    # Custom action to reprocess a failed segmentation
    actions = ['reprocess_segmentation']
    
    def reprocess_segmentation(self, request, queryset):
        from .tasks import process_segmentation_task
        count = 0
        for task in queryset.filter(status='failed'):
            process_segmentation_task.delay(str(task.id))
            task.status = 'queued'
            task.error = None
            task.save(update_fields=['status', 'error', 'updated_at'])
            count += 1
        
        self.message_user(request, f"Requeued {count} segmentation tasks for processing.")
    reprocess_segmentation.short_description = "Reprocess failed segmentation tasks"
    
    # Custom sidebar icon and color
    icon = "biotech"
    unfold_icon_color = "text-teal-600"
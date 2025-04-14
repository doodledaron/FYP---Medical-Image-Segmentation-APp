from django.db import models
from django.contrib.auth.models import User
import uuid
import os
from django.conf import settings

def nifti_file_path(instance, filename):
    """Generate file path for uploaded NIFTI files"""
    ext = filename.split('.')[-1]
    if ext != 'gz' and ext != 'nii':
        filename = f"{filename}.nii.gz"
    return os.path.join('uploads', f"{instance.id}_{filename}")

def segmentation_result_path(instance, filename):
    """Generate file path for segmentation results"""
    return os.path.join('segmentations', f"{instance.id}_seg_{filename}")

class SegmentationTask(models.Model):
    """Model for tracking lung image segmentation tasks"""
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                            related_name='segmentation_tasks')
    file_name = models.CharField(max_length=255)
    nifti_file = models.FileField(upload_to=nifti_file_path)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    result_file = models.FileField(upload_to=segmentation_result_path, null=True, blank=True)
    error = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Lung-specific segmentation metadata
    lung_volume = models.FloatField(null=True, blank=True, help_text="Total lung volume in cubic centimeters")
    lesion_volume = models.FloatField(null=True, blank=True, help_text="Total lesion volume in cubic centimeters")
    lesion_count = models.IntegerField(null=True, blank=True, help_text="Number of distinct lesions")
    confidence_score = models.FloatField(null=True, blank=True, help_text="Model confidence score (0-1)")
    
    def __str__(self):
        return f"{self.file_name} - {self.status}"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Segmentation Task'
        verbose_name_plural = 'Segmentation Tasks'
    
    def get_absolute_url(self):
        from django.urls import reverse
        return reverse('segmentation-detail', kwargs={'pk': self.pk})
# src/yourapp/models.py
import os
import uuid
from django.conf import settings
from django.db import models
from django.contrib.auth.models import User

def nifti_file_path(instance, filename):
    """Generate file path for uploaded NIFTI files (ensuring .nii.gz)."""
    base, ext = os.path.splitext(filename)
    if ext.lower() not in ('.nii', '.gz'):
        ext = '.nii.gz'
    else:
        # handle .nii.gz case
        if filename.lower().endswith('.nii'):
            ext = '.nii'
        else:
            ext = '.nii.gz'
    filename = f"{instance.id}_{base}{ext}"
    return os.path.join('uploads', filename)

def preview_file_path(instance, filename):
    """Path for the downsampled preview NIfTI."""
    # always name it preview_<taskid>.nii.gz
    return os.path.join('previews', f"preview_{instance.id}.nii.gz")

def segmentation_result_path(instance, filename):
    """Generate file path for segmentation results."""
    return os.path.join('segmentations', f"seg_{instance.id}.nii.gz")


class SegmentationTask(models.Model):
    """Model for tracking lung image segmentation tasks."""
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user           = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                       related_name='segmentation_tasks')
    file_name      = models.CharField(max_length=255)
    nifti_file     = models.FileField(upload_to=nifti_file_path)
    # preview_file   = models.FileField(upload_to=preview_file_path,
    #                                   max_length=255, null=True, blank=True,
    #                                   help_text="Downsampled NIfTI preview for fast viewing")
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    result_file    = models.FileField(upload_to=segmentation_result_path,
                                      max_length=255, null=True, blank=True)
    error          = models.TextField(null=True, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)
    # Metrics
    lesion_volume    = models.FloatField(null=True, blank=True,
                                         help_text="Total lesion volume in cubic centimeters")
    lesion_count     = models.IntegerField(null=True, blank=True,
                                           help_text="Number of distinct lesions")
    confidence_score = models.FloatField(null=True, blank=True,
                                         help_text="Model confidence score (0–1)")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Segmentation Task'
        verbose_name_plural = 'Segmentation Tasks'
    
    def __str__(self):
        return f"{self.file_name} – {self.status}"
    
    def get_absolute_url(self):
        from django.urls import reverse
        return reverse('segmentation-detail', kwargs={'pk': self.pk})

import pytest
import os
from django.test import override_settings
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from segmentation.models import (
    SegmentationTask, 
    nifti_file_path, 
    preview_file_path,
    segmentation_result_path,
    tumor_segmentation_path,
    lung_segmentation_path
)

@pytest.mark.django_db
class TestSegmentationTask:
    """Test cases for SegmentationTask model"""
    
    def test_create_segmentation_task(self, test_user, test_nifti_file):
        """Test creating a segmentation task"""
        task = SegmentationTask.objects.create(
            user=test_user,
            file_name="test_scan.nii.gz",
            nifti_file=test_nifti_file,
            status="queued"
        )
        
        assert task.user == test_user
        assert task.file_name == "test_scan.nii.gz"
        assert task.status == "queued"
        assert task.tumor_volume is None
        assert task.lung_volume is None
        assert task.lesion_count is None
        assert task.confidence_score is None
        assert str(task) == "test_scan.nii.gz – queued"
    
    def test_segmentation_task_defaults(self, test_user, test_nifti_file):
        """Test default values for segmentation task"""
        task = SegmentationTask.objects.create(
            user=test_user,
            file_name="test.nii.gz",
            nifti_file=test_nifti_file
        )
        
        assert task.status == "queued"
        assert task.error is None
        assert task.created_at is not None
        assert task.updated_at is not None
    
    def test_segmentation_task_status_choices(self, test_user, test_nifti_file):
        """Test valid status choices"""
        task = SegmentationTask.objects.create(
            user=test_user,
            file_name="test.nii.gz",
            nifti_file=test_nifti_file,
            status="processing"
        )
        
        assert task.status == "processing"
        
        # Test all valid statuses
        valid_statuses = ['queued', 'processing', 'completed', 'failed']
        for status in valid_statuses:
            task.status = status
            task.save()
            task.refresh_from_db()
            assert task.status == status
    
    def test_segmentation_task_with_metrics(self, test_user, test_nifti_file):
        """Test segmentation task with computed metrics"""
        task = SegmentationTask.objects.create(
            user=test_user,
            file_name="test.nii.gz",
            nifti_file=test_nifti_file,
            status="completed",
            tumor_volume=45.6,
            lung_volume=2100.5,
            lesion_count=3,
            confidence_score=0.85
        )
        
        assert task.tumor_volume == 45.6
        assert task.lung_volume == 2100.5
        assert task.lesion_count == 3
        assert task.confidence_score == 0.85
    
    def test_segmentation_task_ordering(self, test_user, test_nifti_file):
        """Test that tasks are ordered by creation date (newest first)"""
        task1 = SegmentationTask.objects.create(
            user=test_user,
            file_name="task1.nii.gz",
            nifti_file=test_nifti_file
        )
        task2 = SegmentationTask.objects.create(
            user=test_user,
            file_name="task2.nii.gz",
            nifti_file=test_nifti_file
        )
        
        tasks = list(SegmentationTask.objects.all())
        assert tasks[0] == task2  # Newest first
        assert tasks[1] == task1


class TestFilePathFunctions:
    """Test file path generation functions"""
    
    def test_nifti_file_path(self):
        """Test NIFTI file path generation"""
        class MockInstance:
            id = "test-uuid"
        
        instance = MockInstance()
        
        # Test with .nii.gz extension
        path = nifti_file_path(instance, "scan.nii.gz")
        assert path == "uploads/test-uuid_scan.nii.gz"
        
        # Test with .nii extension
        path = nifti_file_path(instance, "scan.nii")
        assert path == "uploads/test-uuid_scan.nii"
        
        # Test with other extension (should default to .nii.gz)
        path = nifti_file_path(instance, "scan.dcm")
        assert path == "uploads/test-uuid_scan.nii.gz"
    
    def test_preview_file_path(self):
        """Test preview file path generation"""
        class MockInstance:
            id = "test-uuid"
        
        instance = MockInstance()
        path = preview_file_path(instance, "anything.nii.gz")
        assert path == "previews/preview_test-uuid.nii.gz"
    
    def test_segmentation_result_path(self):
        """Test segmentation result path generation"""
        class MockInstance:
            id = "test-uuid"
        
        instance = MockInstance()
        path = segmentation_result_path(instance, "result.nii.gz")
        assert path == "segmentations/seg_test-uuid.nii.gz"
    
    def test_tumor_segmentation_path(self):
        """Test tumor segmentation path generation"""
        class MockInstance:
            id = "test-uuid"
        
        instance = MockInstance()
        path = tumor_segmentation_path(instance, "tumor.nii.gz")
        assert path == "segmentations/tumor_seg_test-uuid.nii.gz"
    
    def test_lung_segmentation_path(self):
        """Test lung segmentation path generation"""
        class MockInstance:
            id = "test-uuid"
        
        instance = MockInstance()
        path = lung_segmentation_path(instance, "lung.nii.gz")
        assert path == "segmentations/lung_seg_test-uuid.nii.gz"


@pytest.mark.django_db
class TestSegmentationTaskRelationships:
    """Test relationships and foreign keys"""
    
    def test_user_relationship(self, test_user, test_nifti_file):
        """Test user-task relationship"""
        task = SegmentationTask.objects.create(
            user=test_user,
            file_name="test.nii.gz",
            nifti_file=test_nifti_file
        )
        
        # Test forward relationship
        assert task.user == test_user
        
        # Test reverse relationship
        user_tasks = test_user.segmentation_tasks.all()
        assert task in user_tasks
    
    def test_user_deletion_behavior(self, test_user, test_nifti_file):
        """Test that task remains when user is deleted (SET_NULL)"""
        task = SegmentationTask.objects.create(
            user=test_user,
            file_name="test.nii.gz",
            nifti_file=test_nifti_file
        )
        
        user_id = test_user.id
        test_user.delete()
        
        task.refresh_from_db()
        assert task.user is None
        assert task.file_name == "test.nii.gz"  # Task still exists
    
    def test_task_without_user(self, test_nifti_file):
        """Test creating task without user (anonymous upload)"""
        task = SegmentationTask.objects.create(
            file_name="anonymous.nii.gz",
            nifti_file=test_nifti_file
        )
        
        assert task.user is None
        assert task.file_name == "anonymous.nii.gz" 
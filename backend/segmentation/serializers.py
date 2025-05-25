from rest_framework import serializers
from .models import SegmentationTask
import os
import logging

# Set up logger for this file
logger = logging.getLogger(__name__)

class SegmentationTaskSerializer(serializers.ModelSerializer):
    """Serializer for segmentation tasks"""
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = SegmentationTask
        fields = ['id', 'user', 'file_name', 'status', 'created_at']
        read_only_fields = ['id', 'user', 'status', 'created_at']

class SegmentationTaskDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for segmentation tasks"""
    user = serializers.StringRelatedField(read_only=True)
    tumor_segmentation_url = serializers.SerializerMethodField()
    lung_segmentation_url = serializers.SerializerMethodField()
    nifti_file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = SegmentationTask
        fields = [
            'id', 'user', 'file_name', 'status',
            'tumor_volume', 'lung_volume', 'lesion_count', 'confidence_score',
            'tumor_segmentation_url', 'lung_segmentation_url',
            'nifti_file_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'status', 'tumor_segmentation_url', 'lung_segmentation_url',
            'nifti_file_url',
            'lesion_count', 'confidence_score',
            'error', 'created_at', 'updated_at'
        ]
    
    def get_tumor_segmentation_url(self, obj):
        logger.info(f"Getting tumor segmentation URL for task {obj.id}")
        logger.info(f"  tumor_segmentation field: {obj.tumor_segmentation}")
        if obj.tumor_segmentation:
            request = self.context.get('request')
            url = obj.tumor_segmentation.url
            logger.info(f"  raw URL: {url}")
            absolute_url = request.build_absolute_uri(url) if request else url
            logger.info(f"  absolute URL: {absolute_url}")
            return absolute_url
        logger.warning(f"  No tumor segmentation file for task {obj.id}")
        return None
    
    def get_lung_segmentation_url(self, obj):
        logger.info(f"Getting lung segmentation URL for task {obj.id}")
        logger.info(f"  lung_segmentation field: {obj.lung_segmentation}")
        if obj.lung_segmentation:
            request = self.context.get('request')
            url = obj.lung_segmentation.url
            logger.info(f"  raw URL: {url}")
            absolute_url = request.build_absolute_uri(url) if request else url
            logger.info(f"  absolute URL: {absolute_url}")
            return absolute_url
        logger.warning(f"  No lung segmentation file for task {obj.id}")
        return None
    
    def get_nifti_file_url(self, obj):
        logger.info(f"Getting NIFTI file URL for task {obj.id}")
        logger.info(f"  nifti_file field: {obj.nifti_file}")
        if obj.nifti_file:
            request = self.context.get('request')
            url = obj.nifti_file.url
            logger.info(f"  raw URL: {url}")
            absolute_url = request.build_absolute_uri(url) if request else url
            logger.info(f"  absolute URL: {absolute_url}")
            return absolute_url
        logger.warning(f"  No NIFTI file for task {obj.id}")
        return None
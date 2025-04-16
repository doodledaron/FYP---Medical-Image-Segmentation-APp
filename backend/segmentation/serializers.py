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
    nifti_file_url = serializers.SerializerMethodField()
    result_file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = SegmentationTask
        fields = [
            'id', 'user', 'file_name', 'status', 'nifti_file_url', 'result_file_url',
            'lung_volume', 'lesion_volume', 'lesion_count', 'confidence_score',
            'error', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'status', 'nifti_file_url', 'result_file_url',
            'lung_volume', 'lesion_volume', 'lesion_count', 'confidence_score',
            'error', 'created_at', 'updated_at'
        ]
    
    def get_nifti_file_url(self, obj):
        if obj.nifti_file:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.nifti_file.url)
            return obj.nifti_file.url
        return None
    
    def get_result_file_url(self, obj):
        if obj.result_file:
            url = obj.result_file.url
            logger.debug(f"Result file URL: {url}")
            logger.debug(f"Result file path: {obj.result_file.path}")
            logger.debug(f"Result file exists: {os.path.exists(obj.result_file.path)}")
            
            request = self.context.get('request')
            if request is not None:
                full_url = request.build_absolute_uri(url)
                logger.debug(f"Full URL: {full_url}")
                return full_url
            return url
        logger.debug(f"result_file is None or empty for task {obj.id}")
        return None
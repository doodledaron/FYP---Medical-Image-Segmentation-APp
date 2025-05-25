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
        if obj.tumor_segmentation and obj.tumor_segmentation.name:
            request = self.context.get('request')
            try:
                # Debug info
                print(f"DEBUG: Tumor segmentation field exists")
                print(f"DEBUG: Tumor segmentation name: {obj.tumor_segmentation.name}")
                print(f"DEBUG: Tumor segmentation field type: {type(obj.tumor_segmentation)}")
                
                url = obj.tumor_segmentation.url
                absolute_url = request.build_absolute_uri(url) if request else url
                print(f"DEBUG: Tumor segmentation URL generated: {absolute_url}")
                logger.info(f"Tumor segmentation URL generated: {absolute_url}")
                return absolute_url
            except Exception as e:
                print(f"DEBUG: Error generating tumor segmentation URL: {e}")
                print(f"DEBUG: File name: {obj.tumor_segmentation.name}")
                logger.error(f"Error generating tumor segmentation URL: {e}")
                logger.error(f"File name: {obj.tumor_segmentation.name}")
                return None
        else:
            print(f"DEBUG: Tumor segmentation field is empty or None")
            print(f"DEBUG: obj.tumor_segmentation: {obj.tumor_segmentation}")
            print(f"DEBUG: obj.tumor_segmentation.name: {getattr(obj.tumor_segmentation, 'name', 'NO NAME ATTR')}")
        return None
    
    def get_lung_segmentation_url(self, obj):
        if obj.lung_segmentation and obj.lung_segmentation.name:
            request = self.context.get('request')
            try:
                # Debug info
                print(f"DEBUG: Lung segmentation field exists")
                print(f"DEBUG: Lung segmentation name: {obj.lung_segmentation.name}")
                print(f"DEBUG: Lung segmentation field type: {type(obj.lung_segmentation)}")
                
                url = obj.lung_segmentation.url
                absolute_url = request.build_absolute_uri(url) if request else url
                print(f"DEBUG: Lung segmentation URL generated: {absolute_url}")
                logger.info(f"Lung segmentation URL generated: {absolute_url}")
                return absolute_url
            except Exception as e:
                print(f"DEBUG: Error generating lung segmentation URL: {e}")
                print(f"DEBUG: File name: {obj.lung_segmentation.name}")
                logger.error(f"Error generating lung segmentation URL: {e}")
                logger.error(f"File name: {obj.lung_segmentation.name}")
                return None
        else:
            print(f"DEBUG: Lung segmentation field is empty or None")
            print(f"DEBUG: obj.lung_segmentation: {obj.lung_segmentation}")
            print(f"DEBUG: obj.lung_segmentation.name: {getattr(obj.lung_segmentation, 'name', 'NO NAME ATTR')}")
        return None
    
    def get_nifti_file_url(self, obj):
        if obj.nifti_file:
            request = self.context.get('request')
            try:
                url = obj.nifti_file.url
                absolute_url = request.build_absolute_uri(url) if request else url
                logger.info(f"Original NIFTI file URL generated: {absolute_url}")
                return absolute_url
            except Exception as e:
                logger.error(f"Error generating NIFTI file URL: {e}")
                logger.error(f"File name: {obj.nifti_file.name}")
                return None
        return None
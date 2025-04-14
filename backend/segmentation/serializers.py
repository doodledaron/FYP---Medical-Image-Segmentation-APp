from rest_framework import serializers
from .models import SegmentationTask

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
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.result_file.url)
            return obj.result_file.url
        return None
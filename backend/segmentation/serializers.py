from rest_framework import serializers
from .models import SegmentationTask
import os

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
        print(f"=== TUMOR SEGMENTATION URL DEBUG for Task {obj.id} ===")
        print(f"Task {obj.id} - tumor_segmentation field type: {type(obj.tumor_segmentation)}")
        print(f"Task {obj.id} - tumor_segmentation.name: '{obj.tumor_segmentation.name if obj.tumor_segmentation else None}'")
        print(f"Task {obj.id} - tumor_segmentation bool: {bool(obj.tumor_segmentation)}")
        print(f"Task {obj.id} - tumor_segmentation.name bool: {bool(obj.tumor_segmentation.name) if obj.tumor_segmentation else False}")
        
        if obj.tumor_segmentation and obj.tumor_segmentation.name:
            try:
                request = self.context.get('request')
                print(f"Task {obj.id} - Request context available: {bool(request)}")
                
                url = obj.tumor_segmentation.url
                print(f"Task {obj.id} - tumor_segmentation.url: '{url}'")
                
                if request:
                    absolute_url = request.build_absolute_uri(url)
                    print(f"Task {obj.id} - Final absolute URL: '{absolute_url}'")
                    return absolute_url
                else:
                    print(f"Task {obj.id} - No request context, returning relative URL: '{url}'")
                    return url
            except Exception as e:
                print(f"Task {obj.id} - Error generating tumor segmentation URL: {str(e)}")
                import traceback
                print(f"Traceback: {traceback.format_exc()}")
                return None
        else:
            print(f"Task {obj.id} - tumor_segmentation field is empty or name is empty")
            return None
    
    def get_lung_segmentation_url(self, obj):
        print(f"=== LUNG SEGMENTATION URL DEBUG for Task {obj.id} ===")
        print(f"Task {obj.id} - lung_segmentation field type: {type(obj.lung_segmentation)}")
        print(f"Task {obj.id} - lung_segmentation.name: '{obj.lung_segmentation.name if obj.lung_segmentation else None}'")
        print(f"Task {obj.id} - lung_segmentation bool: {bool(obj.lung_segmentation)}")
        print(f"Task {obj.id} - lung_segmentation.name bool: {bool(obj.lung_segmentation.name) if obj.lung_segmentation else False}")
        
        if obj.lung_segmentation and obj.lung_segmentation.name:
            try:
                request = self.context.get('request')
                print(f"Task {obj.id} - Request context available: {bool(request)}")
                
                url = obj.lung_segmentation.url
                print(f"Task {obj.id} - lung_segmentation.url: '{url}'")
                
                if request:
                    absolute_url = request.build_absolute_uri(url)
                    print(f"Task {obj.id} - Final absolute URL: '{absolute_url}'")
                    return absolute_url
                else:
                    print(f"Task {obj.id} - No request context, returning relative URL: '{url}'")
                    return url
            except Exception as e:
                print(f"Task {obj.id} - Error generating lung segmentation URL: {str(e)}")
                import traceback
                print(f"Traceback: {traceback.format_exc()}")
                return None
        else:
            print(f"Task {obj.id} - lung_segmentation field is empty or name is empty")
            return None
    
    def get_nifti_file_url(self, obj):
        print(f"=== NIFTI FILE URL DEBUG for Task {obj.id} ===")
        print(f"Task {obj.id} - nifti_file field type: {type(obj.nifti_file)}")
        print(f"Task {obj.id} - nifti_file.name: '{obj.nifti_file.name if obj.nifti_file else None}'")
        print(f"Task {obj.id} - nifti_file bool: {bool(obj.nifti_file)}")
        print(f"Task {obj.id} - nifti_file.name bool: {bool(obj.nifti_file.name) if obj.nifti_file else False}")
        
        if obj.nifti_file and obj.nifti_file.name:
            try:
                request = self.context.get('request')
                print(f"Task {obj.id} - Request context available: {bool(request)}")
                
                url = obj.nifti_file.url
                print(f"Task {obj.id} - nifti_file.url: '{url}'")
                
                if request:
                    absolute_url = request.build_absolute_uri(url)
                    print(f"Task {obj.id} - Final absolute URL: '{absolute_url}'")
                    return absolute_url
                else:
                    print(f"Task {obj.id} - No request context, returning relative URL: '{url}'")
                    return url
            except Exception as e:
                print(f"Task {obj.id} - Error generating nifti file URL: {str(e)}")
                import traceback
                print(f"Traceback: {traceback.format_exc()}")
                return None
        else:
            print(f"Task {obj.id} - nifti_file field is empty or name is empty")
            return None
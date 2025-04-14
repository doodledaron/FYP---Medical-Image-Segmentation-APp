#segmenttation view

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from .models import SegmentationTask
from .serializers import SegmentationTaskSerializer, SegmentationTaskDetailSerializer
from .tasks import process_segmentation_task
import logging

logger = logging.getLogger(__name__)

class SegmentationTaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing lung segmentation tasks
    """
    queryset = SegmentationTask.objects.all()
    serializer_class = SegmentationTaskSerializer
    parser_classes = (MultiPartParser, FormParser)
    
    def get_serializer_class(self):
        if self.action == 'retrieve' or self.action == 'status':
            return SegmentationTaskDetailSerializer
        return SegmentationTaskSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Upload a NIFTI file for lung segmentation
        """
        file_obj = request.FILES.get('nifti_file')
        if not file_obj:
            return Response(
                {"error": "No file was uploaded"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file extension
        file_name = file_obj.name
        if not (file_name.endswith('.nii') or file_name.endswith('.nii.gz')):
            return Response(
                {"error": "File must be in NIFTI format (.nii or .nii.gz)"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create segmentation task
        task = SegmentationTask(
            file_name=file_name,
            nifti_file=file_obj,
            status='queued'
        )
        
        # Associate with user if authenticated
        if request.user.is_authenticated:
            task.user = request.user
        
        task.save()
        
        # Process task asynchronously
        process_segmentation_task.delay(str(task.id))
        
        return Response(
            {"task_id": task.id, "status": task.status},
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """
        Get the status of a segmentation task
        """
        try:
            task = self.get_object()
            serializer = self.get_serializer(task)
            return Response(serializer.data)
        except SegmentationTask.DoesNotExist:
            return Response(
                {"error": "Task not found"},
                status=status.HTTP_404_NOT_FOUND
            )
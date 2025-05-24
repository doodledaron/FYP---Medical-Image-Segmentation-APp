from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse

@api_view(['GET'])
def api_root(request, format=None):
    """
    Root endpoint listing available API endpoints.
    """
    return Response({
        'segmentation': {
            'tasks': reverse('segmentation-task-list', request=request, format=format),
        },
        'learning': {
            'tutorials': reverse('tutorial-list', request=request, format=format),
            'quiz_results': reverse('quiz-result-list', request=request, format=format),
            'progress': reverse('user-progress', request=request, format=format),
        }
    })
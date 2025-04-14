# The API URLs are determined automatically by the router
"""
Here is a summary of the URLs that are automatically determined by the DefaultRouter:

GET /tasks/ -> Calls list() to retrieve all tasks.

POST /tasks/ -> Calls create() to create a new task.

GET /tasks/<pk>/ -> Calls retrieve() to get details of a specific task.

PUT/PATCH /tasks/<pk>/ -> Calls update() to update a specific task.

DELETE /tasks/<pk>/ -> Calls destroy() to delete a specific task.

GET /tasks/<pk>/status/ -> Calls status() because it is a custom action with the @action decorator.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SegmentationTaskViewSet

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'tasks', SegmentationTaskViewSet, basename='segmentation-task')

# The API URLs are determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
]

# Add custom endpoints not handled by the router
urlpatterns += [
    # If you need additional custom endpoints, add them here
    # For example: path('tasks/<uuid:pk>/reprocess/', reprocess_task, name='reprocess-task'),
]
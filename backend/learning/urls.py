from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LearningViewSet

router = DefaultRouter()
# Mount all LearningViewSet routes at the root of this app,
# so they appear under /api/learning/…
router.register(r'', LearningViewSet, basename='learning')

urlpatterns = [
    path('', include(router.urls)),
]

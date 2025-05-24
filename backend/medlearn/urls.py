from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from segmentation.admin import admin_dashboard

# API Documentation setup
schema_view = get_schema_view(
    openapi.Info(
        title="MedLearn AI API",
        default_version='v1',
        description="API for MedLearn AI medical image segmentation platform",
        contact=openapi.Contact(email="doodleedaronnn03@gmail.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    # Admin panel
    path('admin/', admin.site.urls),
    # Custom admin dashboard
    path('admin/dashboard/', admin_dashboard, name='admin-dashboard'),
    
    # API endpoints
    path('api/', include('api.urls')),
    path('api/segmentation/', include('segmentation.urls')),
    path('api/learning/', include('learning.urls')),
    
    # API documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
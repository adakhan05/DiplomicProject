from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from jobs.views import SavedJobViewSet
from users.views import ResumeViewSet

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/jobs/', include('jobs.urls')),
    path('api/saved-jobs/', SavedJobViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('api/resumes/', ResumeViewSet.as_view({
        'get': 'list',
        'post': 'create'
    })),
    path('api/resumes/<int:pk>/', ResumeViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    })),
    path('api/resumes/<int:pk>/toggle_active/', ResumeViewSet.as_view({
        'post': 'toggle_active'
    })),
    path('api/resumes/<int:pk>/remove_resume_file/', ResumeViewSet.as_view({
        'post': 'remove_resume_file'
    })),
    path('api/public-resumes/', ResumeViewSet.as_view({
        'get': 'public_resumes'
    })),
] 

# Добавляем шаблоны URL для статических и медиа файлов в режиме разработки
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
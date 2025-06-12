from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'jobs'

router = DefaultRouter()
router.register(r'applications', views.JobApplicationViewSet, basename='job-application')
router.register(r'saved', views.SavedJobViewSet, basename='saved-job')
router.register(r'conversations', views.ConversationViewSet, basename='conversation')
router.register(r'messages', views.ChatMessageViewSet, basename='chat-message')
router.register(r'', views.JobViewSet, basename='job')

urlpatterns = [
    path('', include(router.urls)),
    path('check-redis/', views.check_redis, name='check-redis'),
    path('my-applications/', views.JobApplicationViewSet.as_view({'get': 'my_applications'}), name='my-applications'),
    path('<int:job_id>/chat/', views.JobApplicationViewSet.as_view({'post': 'start_chat'}), name='job-chat'),
    path('<int:pk>/applications/', views.JobViewSet.as_view({'get': 'applications'}), name='job-applications'),
] 
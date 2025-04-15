from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'jobs'

router = DefaultRouter()
router.register(r'', views.JobViewSet, basename='job')
router.register(r'applications', views.JobApplicationViewSet, basename='job-application')
router.register(r'saved', views.SavedJobViewSet, basename='saved-job')
router.register(r'messages', views.ChatMessageViewSet, basename='chat-message')

urlpatterns = [
    path('', include(router.urls)),
] 
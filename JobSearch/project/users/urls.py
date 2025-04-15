from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)
from . import views

app_name = 'users'

router = DefaultRouter()
# Register viewsets with explicit URL prefixes
router.register(r'resumes', views.ResumeViewSet, basename='resume')
router.register(r'experiences', views.ExperienceViewSet, basename='experience')
router.register(r'education', views.EducationViewSet, basename='education')
router.register(r'portfolio', views.PortfolioViewSet, basename='portfolio')
router.register(r'profile', views.UserViewSet, basename='user')

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('', include(router.urls)),
] 
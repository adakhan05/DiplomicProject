from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, generics, permissions, status
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from .serializers import UserSerializer, RegisterSerializer, ResumeSerializer, ExperienceSerializer, EducationSerializer, PortfolioSerializer
from .models import Resume, Experience, Education, Portfolio
from jobs.models import ChatMessage
from rest_framework.decorators import action
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.contrib.auth.hashers import make_password
from rest_framework import serializers
import traceback

User = get_user_model()

def profile(request):
    return render(request, 'users/profile.html')

class RegisterView(APIView):
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def post(self, request):
        try:
            print("Registration data received:", request.data)
            
            password = request.data.get('password')
            if not password:
                return Response(
                    {'error': 'Password is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid():
                print("Serializer is valid, creating user")
                
                user = serializer.save()
                
                refresh = RefreshToken.for_user(user)
                response_data = {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                }
                print("User created successfully:", user.username)
                return Response(response_data, status=status.HTTP_201_CREATED)
            
            print("Serializer errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print(f"Registration error: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class LoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            
            print(f"Login attempt for username: {username}")
            
            if not username or not password:
                return Response(
                    {'error': 'Username and password are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = authenticate(username=username, password=password)
            
            if user is None:
                try:
                    user_obj = User.objects.get(email=username)
                    user = authenticate(username=user_obj.username, password=password)
                except User.DoesNotExist:
                    pass
            
            if user is not None:
                if not user.is_active:
                    return Response(
                        {'error': 'Account is inactive'},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                
                refresh = RefreshToken.for_user(user)
                response_data = {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                }
                print(f"Login successful for user: {username}")
                return Response(response_data)
            else:
                print(f"Invalid credentials for user: {username}")
                try:
                    User.objects.get(username=username)
                    error_message = 'Invalid password'
                except User.DoesNotExist:
                    try:
                        User.objects.get(email=username)
                        error_message = 'Invalid password'
                    except User.DoesNotExist:
                        error_message = 'User not found'
                
                return Response(
                    {'error': 'Invalid credentials', 'detail': error_message},
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
        except Exception as e:
            print(f"Login error: {str(e)}")
            return Response(
                {'error': 'An error occurred during login', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class LoginDebugView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            
            debug_info = {
                'username_provided': username,
                'password_provided': bool(password),
                'user_exists_by_username': False,
                'user_exists_by_email': False,
                'user_details': None,
                'authentication_attempt': None,
                'request_headers': dict(request.headers),
                'request_data': request.data,
            }
            
            try:
                user = User.objects.get(username=username)
                debug_info['user_exists_by_username'] = True
                debug_info['user_details'] = {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_active': user.is_active,
                    'last_login': str(user.last_login),
                    'date_joined': str(user.date_joined),
                }
            except User.DoesNotExist:
                debug_info['user_exists_by_username'] = False
            
            try:
                user = User.objects.get(email=username)
                debug_info['user_exists_by_email'] = True
                if not debug_info['user_details']:
                    debug_info['user_details'] = {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'is_active': user.is_active,
                        'last_login': str(user.last_login),
                        'date_joined': str(user.date_joined),
                    }
            except User.DoesNotExist:
                debug_info['user_exists_by_email'] = False
            
            user = authenticate(username=username, password=password)
            if user is not None:
                debug_info['authentication_attempt'] = {
                    'success': True,
                    'user_id': user.id,
                    'username': user.username,
                }
                
                refresh = RefreshToken.for_user(user)
                debug_info['authentication_tokens'] = {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
                
                debug_info['user_serialized'] = UserSerializer(user).data
            else:
                debug_info['authentication_attempt'] = {
                    'success': False,
                }
                
                if debug_info['user_exists_by_username'] or debug_info['user_exists_by_email']:
                    try:
                        from django.contrib.auth.hashers import check_password
                        if debug_info['user_details']:
                            user_obj = User.objects.get(id=debug_info['user_details']['id'])
                            debug_info['password_check'] = check_password(password, user_obj.password)
                    except Exception as e:
                        debug_info['password_check_error'] = str(e)
            
            return Response(debug_info)
                
        except Exception as e:
            return Response({
                'error': str(e),
                'traceback': str(traceback.format_exc())
            })

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['put', 'patch'])
    def update_me(self, request):
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def messages_unread_count(self, request):
        unread_count = ChatMessage.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        return Response({'unread_count': unread_count})

class ResumeViewSet(viewsets.ModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user).prefetch_related(
            'experiences', 'education', 'portfolio'
        )

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
        except Exception as e:
            raise serializers.ValidationError(str(e))

    def create(self, request, *args, **kwargs):
        try:
            print(f"Resume Create Request Data: {request.data}")
            
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                print(f"Resume Validation Errors: {serializer.errors}")
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED,
                headers=headers
            )
        except serializers.ValidationError as e:
            print(f"Resume ValidationError: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(f"Resume Exception: {str(e)}")
            return Response(
                {"error": "Произошла ошибка при создании резюме"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        resume = self.get_object()
        resume.is_active = not resume.is_active
        resume.save()
        return Response({
            'status': 'success',
            'is_active': resume.is_active
        })

    @action(detail=True, methods=['post'])
    def add_experience(self, request, pk=None):
        resume = self.get_object()
        serializer = ExperienceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(resume=resume)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_education(self, request, pk=None):
        resume = self.get_object()
        serializer = EducationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(resume=resume)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_portfolio(self, request, pk=None):
        resume = self.get_object()
        serializer = PortfolioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(resume=resume)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def full_details(self, request, pk=None):
        resume = self.get_object()
        serializer = self.get_serializer(resume)
        return Response(serializer.data)

class ExperienceViewSet(viewsets.ModelViewSet):
    serializer_class = ExperienceSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = Experience.objects.all()

    def get_queryset(self):
        return Experience.objects.filter(resume__user=self.request.user)

    def perform_create(self, serializer):
        resume_id = self.request.data.get('resume')
        resume = get_object_or_404(Resume, id=resume_id, user=self.request.user)
        serializer.save(resume=resume)

class EducationViewSet(viewsets.ModelViewSet):
    serializer_class = EducationSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = Education.objects.all()

    def get_queryset(self):
        return Education.objects.filter(resume__user=self.request.user)

    def perform_create(self, serializer):
        resume_id = self.request.data.get('resume')
        resume = get_object_or_404(Resume, id=resume_id, user=self.request.user)
        serializer.save(resume=resume)

class PortfolioViewSet(viewsets.ModelViewSet):
    serializer_class = PortfolioSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = Portfolio.objects.all()

    def get_queryset(self):
        return Portfolio.objects.filter(resume__user=self.request.user)

    def perform_create(self, serializer):
        resume_id = self.request.data.get('resume')
        resume = get_object_or_404(Resume, id=resume_id, user=self.request.user)
        serializer.save(resume=resume) 
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
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import os

User = get_user_model()

def profile(request):
    return render(request, 'users/profile.html')

class RegisterView(APIView):
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def post(self, request):
        try:
            print("Данные регистрации получены:", request.data)
            
            password = request.data.get('password')
            if not password:
                return Response(
                    {'error': 'Пароль обязателен'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid():
                print("Serializer действителен, создание пользователя")
                
                user = serializer.save()
                
                refresh = RefreshToken.for_user(user)
                response_data = {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                }
                print("Пользователь успешно создан:", user.username)
                return Response(response_data, status=status.HTTP_201_CREATED)
            
            print("Ошибки сериализатора:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print(f"Ошибка регистрации: {str(e)}")
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
            
            print(f"Попытка входа для пользователя: {username}")
            
            if not username or not password:
                return Response(
                    {'error': 'Имя пользователя и пароль обязательны'},
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
                        {'error': 'Аккаунт не активен'},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                
                refresh = RefreshToken.for_user(user)
                response_data = {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                }
                print(f"Вход успешно выполнен для пользователя: {username}")
                return Response(response_data)
            else:
                print(f"Неверные учетные данные для пользователя: {username}")
                try:
                    User.objects.get(username=username)
                    error_message = 'Неверный пароль'
                except User.DoesNotExist:
                    try:
                        User.objects.get(email=username)
                        error_message = 'Неверный пароль'
                    except User.DoesNotExist:
                        error_message = 'Пользователь не найден'
                
                return Response(
                    {'error': 'Неверные учетные данные', 'detail': error_message},
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
        except Exception as e:
            print(f"Ошибка входа: {str(e)}")
            return Response(
                {'error': 'Произошла ошибка при входе', 'detail': str(e)},
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
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user).prefetch_related(
            'experiences', 'education', 'portfolio'
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context
        
    def retrieve(self, request, *args, **kwargs):
        """
        Кастомный метод для получения резюме работодателем
        """
        try:
            # Получаем ID резюме из URL
            resume_id = kwargs.get('pk')
            user = request.user
            
            # Логируем для отладки
            print(f"[ResumeViewSet.retrieve] Получение резюме ID: {resume_id}, Роль пользователя: {user.role}")
            
            # Если пользователь работодатель, мы используем другой подход
            if user.role == 'employer':
                print(f"[ResumeViewSet.retrieve] Работодатель {user.username} получает резюме ID: {resume_id}")
                try:
                    # Ищем резюме в публичных резюме (is_active=True)
                    resume = Resume.objects.filter(
                        id=resume_id, 
                        is_active=True,
                        user__role='jobseeker'
                    ).select_related('user').prefetch_related(
                        'experiences', 'education', 'portfolio'
                    ).first()
                    
                    if resume:
                        print(f"[ResumeViewSet.retrieve] Найдено резюме для работодателя: {resume.title}")
                        serializer = self.get_serializer(resume)
                        return Response(serializer.data)
                    else:
                        print(f"[ResumeViewSet.retrieve] Резюме не найдено или недоступно для работодателя")
                        return Response({"error": "Резюме не найдено или недоступно"}, status=status.HTTP_404_NOT_FOUND)
                except Exception as e:
                    print(f"[ResumeViewSet.retrieve] Ошибка при получении резюме для работодателя: {str(e)}")
                    return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Для соискателей, используем стандартное поведение - только доступ к своим резюме
            return super().retrieve(request, *args, **kwargs)
            
        except Exception as e:
            print(f"[ResumeViewSet.retrieve] Непредвиденная ошибка: {str(e)}")
            return Response({"error": "Произошла ошибка при получении резюме"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
        except Exception as e:
            raise serializers.ValidationError(str(e))

    def create(self, request, *args, **kwargs):
        try:
            print(f"Данные создания резюме: {request.data}")
            print(f"Файлы создания резюме: {request.FILES}")
            
            # Проверка наличия файла резюме
            if 'resume_file' in request.FILES:
                print(f"Найден файл резюме: {request.FILES['resume_file'].name}, размер: {request.FILES['resume_file'].size}")
            
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                print(f"Ошибки валидации резюме: {serializer.errors}")
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            
            response_data = serializer.data
            print(f"Данные ответа на создание резюме: {response_data}")
            
            return Response(
                response_data,
                status=status.HTTP_201_CREATED,
                headers=headers
            )
        except serializers.ValidationError as e:
            print(f"Ошибка валидации резюме: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(f"Ошибка при создании резюме: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"error": "Произошла ошибка при создании резюме"},
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        print(f"Данные обновления резюме: {request.data}")
        print(f"Файлы обновления резюме: {request.FILES}")
        
        # Проверка наличия файла резюме
        if 'resume_file' in request.FILES:
            old_file = instance.resume_file
            print(f"Найден файл резюме: {request.FILES['resume_file'].name}, размер: {request.FILES['resume_file'].size}")
            print(f"Старый файл резюме: {old_file}")
            # Временная логика для проверки - добавляем явное присваивание файла
            instance.resume_file = request.FILES['resume_file']
            instance.save(update_fields=['resume_file'])
            print(f"Обновленный путь файла резюме: {instance.resume_file.path if instance.resume_file else 'None'}")
            
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            self.perform_update(serializer)
            
            response_data = serializer.data
            print(f"Данные ответа на обновление резюме: {response_data}")
            
            return Response(response_data)
        
        print(f"Ошибки валидации обновления резюме: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

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

    @action(detail=True, methods=['post'])
    def remove_resume_file(self, request, pk=None):
        """Удаляет PDF-файл из резюме"""
        resume = self.get_object()
        
        # Проверяем, есть ли файл
        if resume.resume_file:
            # Сохраняем путь для логирования
            file_path = resume.resume_file.path if hasattr(resume.resume_file, 'path') else None
            
            # Удаляем файл
            try:
                if file_path and os.path.isfile(file_path):
                    os.remove(file_path)
                    print(f"Физически удален файл: {file_path}")
                
                # Очищаем поле в модели
                resume.resume_file = None
                resume.save(update_fields=['resume_file'])
                print(f"Поле resume_file очищено для резюме id={resume.id}")
                
                # Возвращаем обновленные данные
                serializer = self.get_serializer(resume)
                return Response({
                    'status': 'success',
                    'message': 'Файл резюме успешно удален',
                    'resume': serializer.data
                })
            except Exception as e:
                print(f"Ошибка при удалении файла резюме: {str(e)}")
                return Response({
                    'status': 'error',
                    'message': f'Ошибка при удалении файла: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response({
                'status': 'info',
                'message': 'PDF-файл резюме отсутствует'
            })

    @action(detail=False, methods=['get'])
    def public_resumes(self, request):
        """
        Получить список всех активных резюме для работодателей
        """
        queryset = Resume.objects.filter(
            is_active=True,
            user__role='jobseeker'
        ).exclude(
            user=request.user
        ).select_related('user').prefetch_related(
            'experiences', 'education', 'portfolio'
        ).order_by('-updated_at')

        search_term = request.query_params.get('search', None)
        location = request.query_params.get('location', None)
        position = request.query_params.get('position', None)
        employment_type = request.query_params.get('employment_type', None)

        if search_term:
            queryset = queryset.filter(
                Q(user__username__icontains=search_term) |
                Q(title__icontains=search_term) |
                Q(desired_position__icontains=search_term)
            ).distinct()

        if location:
            queryset = queryset.filter(Q(user__location_city__icontains=location) | Q(city__icontains=location)).distinct()

        if position:
            queryset = queryset.filter(Q(title__icontains=position) | Q(desired_position__icontains=position)).distinct()

        if employment_type:
            queryset = queryset.filter(preferred_employment__icontains=employment_type)
        
        context = self.get_serializer_context()
        serializer = self.get_serializer(queryset, many=True, context=context)
        
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

class UnreadMessageCountView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        unread_count = ChatMessage.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        return Response({'unread_count': unread_count}) 
from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status, serializers, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Count, Max
from django.db import transaction
from .models import Job, JobApplication, SavedJob, ChatMessage, Conversation
from .serializers import (
    JobSerializer, JobApplicationSerializer,
    SavedJobSerializer, ChatMessageSerializer, ConversationSerializer
)
from django.utils import timezone
from django.contrib.auth import get_user_model
from users.models import Resume
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import redis
from django.http import Http404
import json

User = get_user_model()

class IsEmployerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'employer'
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.company == request.user

class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    permission_classes = [IsEmployerOrReadOnly]
    
    def get_queryset(self):
        queryset = Job.objects.all().select_related('company')
        
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
            
        title = self.request.query_params.get('title', None)
        location = self.request.query_params.get('location', None)
        experience = self.request.query_params.get('experience', None)
        employment_type = self.request.query_params.get('employment_type', None)
        min_salary = self.request.query_params.get('min_salary', None)
        
        if title:
            queryset = queryset.filter(title__icontains=title)
        if location:
            queryset = queryset.filter(location__icontains=location)
        if experience:
            queryset = queryset.filter(experience=experience)
        if employment_type:
            queryset = queryset.filter(employment_type=employment_type)
        if min_salary:
            queryset = queryset.filter(salary_min__gte=min_salary)
            
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(company=self.request.user)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my(self, request):
        if request.user.role != 'employer':
            return Response(
                {"error": "Только работодатели могут просматривать свои вакансии"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        queryset = Job.objects.filter(company=request.user)\
            .select_related('company')\
            .annotate(applications_count=Count('applications'))
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_active(self, request, pk=None):
        job = self.get_object()
        
        if job.company != request.user:
            return Response(
                {"error": "Вы не можете изменять статус этой вакансии"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        job.is_active = not job.is_active
        job.save()
        
        return Response({
            "status": "success",
            "is_active": job.is_active
        })
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def applications(self, request, pk=None):
        job = self.get_object()
        # Работодатели видят все заявки, соискатели только свои
        if request.user.role == 'employer':
            if job.company != request.user:
                return Response({"error": "Вы не можете просматривать отклики на эту вакансию"}, status=status.HTTP_403_FORBIDDEN)
            queryset = JobApplication.objects.filter(job=job).select_related('resume', 'applicant')
        elif request.user.role == 'jobseeker':
            queryset = JobApplication.objects.filter(job=job, applicant=request.user).select_related('resume', 'applicant')
        else:
            return Response({"error": "Недостаточно прав"}, status=status.HTTP_403_FORBIDDEN)

        serializer = JobApplicationSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def apply(self, request, pk=None):
        """
        Позволяет соискателю отправить отклик на вакансию.
        """
        job = self.get_object()
        user = request.user

        # Проверяем, что пользователь не является работодателем
        if user.role == 'employer':
            return Response({"error": "Работодатели не могут откликаться на вакансии"}, status=status.HTTP_403_FORBIDDEN)

        # Проверяем, что вакансия активна
        if not job.is_active:
            return Response({"error": "Вакансия неактивна"}, status=status.HTTP_400_BAD_REQUEST)

        force_reapply = request.data.get('force', False)
        existing_application = JobApplication.objects.filter(job=job, applicant=user)
        
        if existing_application.exists() and not force_reapply:
            return Response({"error": "Вы уже откликнулись на эту вакансию"}, status=status.HTTP_400_BAD_REQUEST)
        elif existing_application.exists() and force_reapply:
            # Если есть force параметр и существующий отклик, удаляем предыдущий отклик
            existing_application.delete()
            # Добавим лог для отладки
            print(f"Пользователь {user.username} удалил предыдущий отклик на вакансию {job.id} через force параметр")

        # Получаем резюме
        resume = None
        resume_id = request.data.get('resume')
        if resume_id:
            try:
                resume = Resume.objects.get(id=resume_id, user=user)
            except Resume.DoesNotExist:
                return Response({"error": "Резюме не найдено"}, status=status.HTTP_400_BAD_REQUEST)

        # Создаем отклик
        application = JobApplication.objects.create(
            job=job,
            applicant=user,
            cover_letter=request.data.get('cover_letter', ''),
            resume=resume,
            status='pending'
        )
        
        # Проверяем флаг создания чата из разных параметров
        conversation_id = None
        create_flag = request.data.get('create_conversation', True) or request.data.get('create_chat', True) or request.data.get('start_chat', True)
        if True:
            from django.db import transaction
            try:
                with transaction.atomic():
                    employer = job.company
                    print(f"CHAT DEBUG: Начинаем создание чата для отклика на вакансию {job.id}")
                    print(f"CHAT DEBUG: Соискатель: {user.id}, Работодатель: {employer.id}")
                    
                    # Ищем существующий диалог
                    conv_qs = Conversation.objects.filter(participants=user).filter(participants=employer).filter(job=job)
                    
                    if conv_qs.exists():
                        conv = conv_qs.first()
                        print(f"CHAT DEBUG: Найден существующий диалог с ID {conv.id}")
                    else:
                        # Создаем новый диалог в транзакции
                        print(f"CHAT DEBUG: Создаем новый диалог")
                        conv = Conversation.objects.create(job=job)
                        print(f"CHAT DEBUG: Диалог создан с ID {conv.id}")
                        
                        # Добавляем участников
                        conv.participants.add(user, employer)
                        print(f"CHAT DEBUG: Добавлены участники: соискатель {user.id} и работодатель {employer.id}")
                        
                        # Сохраняем явно для уверенности
                        conv.save()
                        print(f"CHAT DEBUG: Диалог сохранен в базе данных")
                    
                    # Отправляем начальное сообщение, если задано
                    initial_msg = request.data.get('message', '')
                    if initial_msg:
                        print(f"CHAT DEBUG: Создаем начальное сообщение в диалоге {conv.id}")
                        msg = ChatMessage.objects.create(
                            conversation=conv,
                            sender=user,
                            recipient=employer,
                            job=job,
                            content=initial_msg
                        )
                        print(f"CHAT DEBUG: Сообщение создано с ID {msg.id}")
                    else:
                        # Создаем стандартное сообщение, если не было указано
                        default_msg = f"Здравствуйте! Я отправил(а) отклик на вакансию \"{job.title}\"."
                        print(f"CHAT DEBUG: Создаем стандартное сообщение: {default_msg}")
                        msg = ChatMessage.objects.create(
                            conversation=conv,
                            sender=user,
                            recipient=employer,
                            job=job,
                            content=default_msg
                        )
                        print(f"CHAT DEBUG: Стандартное сообщение создано с ID {msg.id}")

                    # Добавляем сообщение о резюме, если оно есть
                    if resume:
                        # Готовим расширенные данные о резюме
                        applicant_name = f"{user.first_name} {user.last_name}".strip() or user.username
                        
                        # Получаем навыки из резюме
                        skills = resume.skills if hasattr(resume, 'skills') else []
                        
                        # Формируем данные для сообщения о резюме
                        resume_message_data = {
                            "type": "resume_attached",
                            "resume_id": resume.id,
                            "resume_title": resume.title,
                            "applicant_name": applicant_name,
                            "desired_position": resume.desired_position if hasattr(resume, 'desired_position') else "",
                            "skills": skills[:10],  # Ограничиваем до 10 навыков
                            "professional_summary": resume.professional_summary[:200] if hasattr(resume, 'professional_summary') else "",
                            "salary_expectation": resume.salary_expectation if hasattr(resume, 'salary_expectation') else None,
                            "preferred_employment": resume.preferred_employment if hasattr(resume, 'preferred_employment') else "",
                            "cover_letter": request.data.get('cover_letter', '')[:300]  # Добавляем сопроводительное письмо с ограничением длины
                        }
                        
                        resume_info_msg_content = json.dumps(resume_message_data)
                        
                        print(f"CHAT DEBUG: Создаем JSON-сообщение о прикрепленном резюме: {resume_info_msg_content}")
                        resume_msg = ChatMessage.objects.create(
                            conversation=conv,
                            sender=user, # От имени соискателя
                            recipient=employer,
                            job=job,
                            content=resume_info_msg_content, # Сохраняем JSON как строку
                            is_read=False
                        )
                        print(f"CHAT DEBUG: Сообщение о резюме создано с ID {resume_msg.id}")
                    
                    # Получаем идентификатор для WebSocket
                    conversation_id = conv.conversation_id
                    print(f"CHAT DEBUG: Сформирован conversation_id для WebSocket: {conversation_id}")
                    
                    # Проверяем, что диалог реально создан в базе данных
                    check_conv = Conversation.objects.get(id=conv.id)
                    print(f"CHAT DEBUG: Верификация диалога успешна, найден в БД: {check_conv.id}")
                    
                    # Отправляем уведомление о новом диалоге через WebSocket
                    try:
                        from channels.layers import get_channel_layer
                        from asgiref.sync import async_to_sync
                        
                        channel_layer = get_channel_layer()
                        
                        # Формируем данные уведомления
                        notification_data = {
                            "type": "new_application",
                            "conversation_id": conv.conversation_id,
                            "job_id": job.id,
                            "job_title": job.title,
                            "applicant": {
                                    "id": user.id,
                                "name": f"{user.first_name} {user.last_name}".strip() or user.username,
                                "has_resume": resume is not None
                            }
                            }
                        
                        # Отправляем работодателю
                        employer_group = f"notifications_{employer.id}"
                        print(f"CHAT DEBUG: Отправляем уведомление работодателю через {employer_group}")
                        
                        async_to_sync(channel_layer.group_send)(
                            employer_group,
                            {
                                "type": "chat_message",
                                "message": notification_data
                            }
                        )
                        
                        print(f"CHAT DEBUG: Уведомление работодателю отправлено")
                    except Exception as e:
                        print(f"CHAT DEBUG: Ошибка отправки уведомления через WebSocket: {str(e)}")
            
                    # Возвращаем успешный ответ с данными о созданном отклике и чате
                    response_data = {
                        "status": "success",
                        "message": "Отклик успешно отправлен",
                        "application_id": application.id,
                        "conversation_id": conversation_id
                    }
                    
                    return Response(response_data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                print(f"CHAT ERROR: Ошибка при создании чата: {str(e)}")
                # В случае ошибки чата все равно возвращаем успешный статус для отклика
                return Response({
                    "status": "success",
                    "message": "Отклик успешно отправлен, но возникла проблема с созданием чата",
                    "application_id": application.id
                }, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        """
        Returns a job or, if pk contains '_', a conversation lookup by conversation_id.
        """
        pk = kwargs.get('pk')
        if pk and '_' in str(pk):
            qs = Conversation.objects.filter(participants=request.user)
            for conv in qs:
                if conv.conversation_id == str(pk):
                    serializer = ConversationSerializer(conv, context={'request': request})
                    return Response(serializer.data)
            raise Http404
        return super().retrieve(request, *args, **kwargs)

class JobApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        job_id = self.request.query_params.get('job')
        
        if job_id:
            job = Job.objects.filter(id=job_id).first()
            
            if not job:
                return JobApplication.objects.none()
                
            # Если пользователь является работодателем для этой вакансии
            if job.company == user:
                return JobApplication.objects.filter(job=job)
                
            # Если пользователь подал заявку на эту вакансию
            elif JobApplication.objects.filter(job=job, applicant=user).exists():
                return JobApplication.objects.filter(job=job, applicant=user)
                
            # У пользователя нет прав для просмотра заявок на эту вакансию
            return JobApplication.objects.none()
        
        # Стандартное поведение без job_id
        if user.role == 'employer':
            return JobApplication.objects.filter(
                job__company=user
            ).select_related('job', 'applicant')
        
        return JobApplication.objects.filter(
            applicant=user
        ).select_related('job')
    
    def perform_create(self, serializer):
        if self.request.user.role != 'jobseeker':
            raise serializers.ValidationError(
                {"error": "Только соискатели могут откликаться на вакансии"}
            )
            
        job_id = serializer.validated_data.get('job').id
        try:
            job = Job.objects.get(id=job_id, is_active=True)
        except Job.DoesNotExist:
            raise serializers.ValidationError(
                {"job": "Вакансия не найдена или неактивна"}
            )
            
        if JobApplication.objects.filter(applicant=self.request.user, job=job).exists():
            raise serializers.ValidationError(
                {"error": "Вы уже откликнулись на эту вакансию"}
            )
            
        serializer.save(applicant=self.request.user, status='pending')
    
    @action(detail=False, methods=['get'])
    def my(self, request):
        applications = JobApplication.objects.filter(
            applicant=request.user
        ).select_related('job').order_by('-created_at')
        
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        application = self.get_object()
        
        if request.user.role != 'employer' or application.job.company != request.user:
            return Response(
                {"error": "У вас нет прав для выполнения этого действия"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        status_value = request.data.get('status')
        if status_value not in ['pending', 'reviewed', 'interviewing', 'accepted', 'rejected']:
            return Response(
                {"error": "Неверный статус"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        application.status = status_value
        application.save()
        
        serializer = self.get_serializer(application)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def start_chat(self, request, job_id=None):
        # Получаем job_id из запроса или URL параметра 
        if not job_id:
            job_id = request.data.get('job_id')
            
        if not job_id:
            return Response(
                {"error": "Не указан ID вакансии"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            from django.db import transaction
            
            with transaction.atomic():
                job = Job.objects.get(id=job_id, is_active=True)
                employer = job.company
                
                # Подробное логирование
                print(f"START_CHAT DEBUG: Начинаем создание чата для вакансии {job.id}")
                print(f"START_CHAT DEBUG: Соискатель: {request.user.id}, Работодатель: {employer.id}")
                
                # Убедитесь, что оба пользователя существуют
                if not employer or not request.user:
                    print(f"START_CHAT ERROR: Employer ({employer}) or job seeker ({request.user}) not found")
                    return Response(
                        {"error": "User error - could not identify both parties for chat"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                initial_message = request.data.get('initial_message', f"Здравствуйте! Я заинтересован(а) в вакансии \"{job.title}\".")
                
                # Создаём или получаем диалог между соискателем и работодателем
                conversation_qs = Conversation.objects.filter(participants=request.user).filter(participants=employer).filter(job=job)
                
                if conversation_qs.exists():
                    conversation = conversation_qs.first()
                    print(f"START_CHAT DEBUG: Найден существующий диалог с ID {conversation.id}")
                else:
                    # Создаем новый диалог
                    print(f"START_CHAT DEBUG: Создаем новый диалог")
                    conversation = Conversation.objects.create(job=job)
                    print(f"START_CHAT DEBUG: Диалог создан с ID {conversation.id}")
                    
                    # Добавляем участников
                    conversation.participants.add(request.user, employer)
                    print(f"START_CHAT DEBUG: Добавлены участники в диалог")
                    
                    # Сохраняем диалог (для уверенности)
                    conversation.save()
                    print(f"START_CHAT DEBUG: Диалог сохранен в БД")
                
                conversation_id = conversation.conversation_id
                group_name = f"chat_{conversation_id}"
                print(f"START_CHAT DEBUG: ID диалога для WebSocket: {conversation_id}")
    
                # Создаём сообщение в диалоге
                message = ChatMessage.objects.create(
                    conversation=conversation,
                    sender=request.user,
                    recipient=employer,
                    job=job,
                    content=initial_message
                )
                print(f"START_CHAT DEBUG: Создано начальное сообщение с ID {message.id}")
                
                # Проверяем, что все создалось корректно
                check_conv = Conversation.objects.get(id=conversation.id)
                check_msg = ChatMessage.objects.filter(conversation=conversation).exists()
                print(f"START_CHAT DEBUG: Проверка успешна - диалог: {check_conv.id}, сообщение: {check_msg}")
                
                # Broadcast initial message via WebSocket using sorted participant IDs and job ID
                try:
                    from channels.layers import get_channel_layer
                    from asgiref.sync import async_to_sync
                    
                    channel_layer = get_channel_layer()
                    
                    # Отправляем сообщение в группу чата
                    print(f"START_CHAT DEBUG: Отправка сообщения в WebSocket группу: {group_name}")
                    async_to_sync(channel_layer.group_send)(
                        group_name,
                        {
                            "type": "chat_message",
                            "message": message.content,
                            "sender_id": message.sender.id,
                            "sender_name": message.sender.get_full_name(),
                            "message_id": message.id,
                            "created_at": message.created_at.isoformat(),
                        }
                    )
                    print(f"START_CHAT DEBUG: Сообщение отправлено в WebSocket")
                    
                    # Отправляем уведомление работодателю о новом чате
                    print(f"START_CHAT DEBUG: Отправка уведомления работодателю")
                    notification_layer = get_channel_layer()
                    notification_group = f"notifications_{employer.id}"
                    
                    async_to_sync(notification_layer.group_send)(
                        notification_group,
                        {
                            "type": "new_conversation",
                            "conversation_id": conversation_id,
                            "other_user": {
                                "id": request.user.id, 
                                "first_name": request.user.first_name, 
                                "last_name": request.user.last_name
                            },
                            "job": {"id": job.id, "title": job.title}
                        }
                    )
                    print(f"START_CHAT DEBUG: Уведомление отправлено работодателю")
                    
                    # Также отправляем уведомление соискателю
                    seeker_notification_group = f"notifications_{request.user.id}"
                    print(f"START_CHAT DEBUG: Отправка уведомления соискателю: {seeker_notification_group}")
                    
                    async_to_sync(notification_layer.group_send)(
                        seeker_notification_group,
                        {
                            "type": "new_conversation",
                            "conversation_id": conversation_id,
                            "other_user": {
                                "id": employer.id,
                                "first_name": employer.first_name,
                                "last_name": employer.last_name
                            },
                            "job": {"id": job.id, "title": job.title}
                        }
                    )
                    print(f"START_CHAT DEBUG: Уведомление отправлено соискателю")
                    
                except Exception as e:
                    print(f"START_CHAT DEBUG: Ошибка отправки WebSocket: {e}")
                    # Continue execution even if WebSocket notification fails
                
                # Получаем resume_id из запроса
                resume_id = request.data.get('resume')
                
                # Если resume_id предоставлен, отправляем второе сообщение с информацией о резюме
                if resume_id:
                    try:
                        resume = Resume.objects.filter(id=resume_id, user=request.user).first()
                        
                        if resume:
                            # Форматируем сообщение с информацией о резюме
                            resume_text = f"📄 Моё резюме: {resume.title}\n"
                            
                            # Добавляем навыки, если они доступны
                            if resume.skills:
                                skills_text = ", ".join(resume.skills) if isinstance(resume.skills, list) else str(resume.skills)
                                resume_text += f"Навыки: {skills_text}\n"
                                
                            # Добавляем предпочитаемый тип занятости
                            if resume.preferred_employment:
                                resume_text += f"Занятость: {resume.get_preferred_employment_display()}\n"
                                
                            # Добавляем ожидаемую зарплату, если она указана
                            if resume.salary_expectation:
                                resume_text += f"Ожидаемая зарплата: {resume.salary_expectation} руб.\n"
                                
                            # Добавляем ссылку на полное резюме
                            resume_text += f"\n👉 Открыть полное резюме: /resumes/{resume_id}"
                            
                            # Отправляем сообщение с резюме
                            resume_message = ChatMessage.objects.create(
                                conversation=conversation,
                                sender=request.user,
                                recipient=employer,
                                job=job,
                                content=resume_text
                            )
                            print(f"START_CHAT DEBUG: Создано сообщение с резюме: {resume_message.id}")
                            
                            # Отправляем уведомление через WebSocket о сообщении с резюме
                            try:
                                channel_layer = get_channel_layer()
                                async_to_sync(channel_layer.group_send)(
                                    group_name,
                                    {
                                        "type": "chat_message",
                                        "message": resume_message.content,
                                        "sender_id": resume_message.sender.id,
                                        "sender_name": resume_message.sender.get_full_name(),
                                        "message_id": resume_message.id,
                                        "created_at": resume_message.created_at.isoformat(),
                                    }
                                )
                                print(f"START_CHAT DEBUG: Сообщение с резюме отправлено в WebSocket")
                            except Exception as e:
                                print(f"START_CHAT DEBUG: Ошибка отправки сообщения с резюме: {e}")
                        else:
                            print(f"START_CHAT DEBUG: Резюме не найдено: id={resume_id}, user={request.user.id}")
                    except Exception as resume_error:
                        # Записываем ошибку в лог, но не прерываем основной процесс
                        print(f"START_CHAT DEBUG: Ошибка при отправке резюме: {str(resume_error)}")
                
                # Успешный ответ
                return Response({
                    "status": "success", 
                    "message": "Чат с работодателем создан",
                    "conversation_id": conversation_id,
                    "resume_sent": bool(resume_id)
                })
                
        except Job.DoesNotExist:
            print(f"START_CHAT ERROR: Job not found: id={job_id}")
            return Response(
                {"error": "Вакансия не найдена или неактивна"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"START_CHAT ERROR: Unexpected error: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path='my-applications')
    def my_applications(self, request):
        """
        Возвращает все заявки текущего пользователя
        """
        applications = JobApplication.objects.filter(applicant=request.user).select_related('job')
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        applications = JobApplication.objects.filter(applicant=request.user)
        total_applications = applications.count()
        
        employment_counts = {}
        for job_type in ['full_time', 'part_time', 'remote', 'contract', 'internship']:
            count = applications.filter(job__employment_type=job_type).count()
            if count > 0:
                employment_counts[job_type] = count
        
        experience_counts = {}
        for exp_level in ['no_experience', 'junior', 'middle', 'senior', 'lead']:
            count = applications.filter(job__experience=exp_level).count()
            if count > 0:
                experience_counts[exp_level] = count
        
        return Response({
            'total_applications': total_applications,
            'by_employment_type': employment_counts,
            'by_experience': experience_counts
        })

    @action(detail=True, methods=['delete', 'post'])
    def withdraw(self, request, pk=None):
        """
        Позволяет соискателю отменить свою заявку.
        """
        try:
            application = self.get_object()
            
            # Проверяем, является ли пользователь соискателем
            if application.applicant != request.user:
                return Response(
                    {"error": "Вы не можете отменить чужой отклик"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Сохраняем job ID перед удалением для ответа
            job_id = application.job.id
            
            # Удаляем заявку
            application.delete()
            
            return Response({
                "status": "success",
                "message": "Отклик успешно отменен",
                "job_id": job_id
            }, status=status.HTTP_200_OK)
            
        except JobApplication.DoesNotExist:
            return Response(
                {"error": "Отклик не найден"},
                status=status.HTTP_404_NOT_FOUND
            )

class SavedJobViewSet(viewsets.ModelViewSet):
    """
    API endpoint для управления сохраненными вакансиями пользователя.
    Строго ограничен только для аутентифицированного пользователя, чтобы предотвратить передачу данных между пользователями.
    """
    serializer_class = SavedJobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Строгая фильтрация по аутентифицированному пользователю, чтобы обеспечить правильную изоляцию данных
        user_id = self.request.user.id
        print(f"DEBUG SavedJobViewSet.get_queryset: Filtering saved jobs for user_id={user_id}")
        queryset = SavedJob.objects.filter(user_id=user_id).select_related('job', 'job__company')
        count = queryset.count()
        print(f"DEBUG SavedJobViewSet.get_queryset: Found {count} saved jobs for user_id={user_id}")
        return queryset

    def perform_create(self, serializer):
        # Сначала проверяем, что пользователь аутентифицирован - это критически важно для правильной изоляции
        if not self.request.user.is_authenticated:
            raise serializers.ValidationError(
                {"error": "Авторизуйтесь чтобы сохранить вакансию"}
            )
            
        job_id = self.request.data.get('job')
        try:
            job = Job.objects.get(id=job_id, is_active=True)
        except Job.DoesNotExist:
            raise serializers.ValidationError(
                {"job": "Вакансия не найдена или неактивна"}
            )
        
        # Используем явный user_id для проверки, чтобы предотвратить проблемы с авторизацией
        user_id = self.request.user.id
        if SavedJob.objects.filter(user_id=user_id, job=job).exists():
            raise serializers.ValidationError(
                {"job": "Эта вакансия уже сохранена"}
            )
            
        # Явно устанавливаем пользователя, чтобы избежать любых потенциальных проблем
        serializer.save(user_id=user_id)
        return Response({"status": "Вакансия успешно сохранена"}, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_saved(self, request):
        # Убеждаемся, что пользователь аутентифицирован
        if not request.user.is_authenticated:
            return Response(
                {"error": "Авторизуйтесь для сохранения вакансий"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Явно получаем user ID для строгой изоляции
        user_id = request.user.id
        
        job_id = request.data.get('job')
        if not job_id:
            return Response(
                {"error": "Не указан ID вакансии"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response(
                {"error": "Вакансия не найдена"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Получаем сохраненную вакансию только для текущего аутентифицированного пользователя с явным user_id (строго изолированный)
        saved_job = SavedJob.objects.filter(user_id=user_id, job=job).first()
        
        if saved_job:
            saved_job.delete()
            return Response({
                "status": "Вакансия удалена из сохраненных",
                "is_saved": False,
                "job_id": job_id
            })
        else:
            # Проверяем, активна ли вакансия перед сохранением
            if not job.is_active:
                return Response(
                    {"error": "Нельзя сохранить неактивную вакансию"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Явно создаем с user_id для правильной изоляции
            saved_job = SavedJob.objects.create(user_id=user_id, job=job)
            serializer = self.get_serializer(saved_job)
            return Response({
                "status": "Вакансия добавлена в сохраненных",
                "is_saved": True,
                "job_id": job_id,
                "saved_job": serializer.data
            }, status=status.HTTP_201_CREATED)

class ConversationViewSet(viewsets.ModelViewSet):
    """
    Представление для работы с моделью Conversation (диалоги).
    Обеспечивает API для списка диалогов, создания новых и получения сообщений.
    """
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Возвращает диалоги, в которых участвует текущий пользователь.
        Сортирует по времени последнего сообщения.
        """
        print(f"DEBUG ConversationViewSet.get_queryset: запрос для пользователя {self.request.user.id}")
        queryset = Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants').order_by('-last_message_time', '-updated_at')
        
        # Добавляем логи для диагностики
        conversation_count = queryset.count()
        print(f"DEBUG ConversationViewSet.get_queryset: найдено {conversation_count} диалогов")
        if conversation_count > 0:
            for i, conv in enumerate(queryset[:3]):
                print(f"DEBUG Диалог {i+1}: id={conv.id}, participants={[p.id for p in conv.participants.all()]}")
                
        return queryset
    
    def perform_create(self, serializer):
        """
        Создаёт новый диалог и добавляет текущего пользователя как участника.
        """
        conversation = serializer.save()
        conversation.participants.add(self.request.user)
        
    def get_object(self):
        """
        Поддерживает поиск по числовому pk или строковому conversation_id.
        """
        lookup = self.kwargs.get('pk')
        print(f"DEBUG ConversationViewSet.get_object: получение диалога по ключу: {lookup}")

        # Сначала пробуем найти по числовому PK, если lookup - число
        if lookup.isdigit():
            try:
                print(f"DEBUG ConversationViewSet.get_object: попытка получить по numeric pk: {lookup}")
                obj = self.get_queryset().get(pk=int(lookup))
                print(f"DEBUG ConversationViewSet.get_object: диалог найден по pk: {obj.id} в диалогах пользователя")
                return obj
            except (ValueError, Conversation.DoesNotExist, TypeError):
                print(f"DEBUG ConversationViewSet.get_object: диалог с pk={lookup} не найден в диалогах пользователя или lookup не число.")
        
        # Далее пробуем найти по conversation_id
        print(f"DEBUG ConversationViewSet.get_object: попытка найти по строковому conversation_id '{lookup}' в диалогах пользователя")
        queryset = self.get_queryset() # Диалоги, где пользователь участник
        for conv in queryset:
            if conv.conversation_id == lookup:
                print(f"DEBUG ConversationViewSet.get_object: диалог найден по conversation_id: {conv.id} (строковый id: {lookup})")
                return conv

        print(f"DEBUG ConversationViewSet.get_object: диалог не найден ни по pk, ни по conversation_id: {lookup}")
        raise Http404
    
    @action(detail=False, methods=['post'])
    def create_or_get(self, request):
        """
        Создаёт новый диалог или возвращает существующий между указанными пользователями.
        Принимает: user_id, job_id (опционально)
        """
        other_user_id = request.data.get('user_id')
        job_id = request.data.get('job_id')
        
        print(f"CREATE_OR_GET DEBUG: Запрос на создание/получение диалога: user_id={other_user_id}, job_id={job_id}")
        
        if not other_user_id:
            print(f"CREATE_OR_GET ERROR: Не указан ID собеседника")
            return Response(
                {"error": "Не указан ID собеседника"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            from django.db import transaction
            
            with transaction.atomic():
                print(f"CREATE_OR_GET DEBUG: Начало транзакции")
                
                # Находим второго участника чата
                other_user = User.objects.get(id=other_user_id)
                print(f"CREATE_OR_GET DEBUG: Найден пользователь с ID {other_user.id}")
                
                job = None
                if job_id:
                    job = Job.objects.get(id=job_id)
                    print(f"CREATE_OR_GET DEBUG: Найдена вакансия с ID {job.id}")
                
                # Поиск существующего диалога
                print(f"CREATE_OR_GET DEBUG: Поиск существующего диалога")
                conversations = Conversation.objects.filter(participants=request.user)
                conversations = conversations.filter(participants=other_user)
                
                if job:
                    conversations = conversations.filter(job=job)
                    print(f"CREATE_OR_GET DEBUG: Применен фильтр по вакансии {job.id}")
                else:
                    conversations = conversations.filter(job__isnull=True)
                    print(f"CREATE_OR_GET DEBUG: Применен фильтр по отсутствию вакансии")
                
                # Проверяем существование диалога
                if conversations.exists():
                    # Берём первый найденный диалог
                    conversation = conversations.first()
                    created = False
                    print(f"CREATE_OR_GET DEBUG: Найден существующий диалог с ID {conversation.id}")
                else:
                    # Создаём новый диалог
                    print(f"CREATE_OR_GET DEBUG: Создание нового диалога")
                    conversation = Conversation.objects.create(job=None)
                    conversation.participants.add(request.user, other_user)
                    # Нет необходимости вызывать conversation.save() сразу после create, если участники добавляются сразу
                    # и last_message_time будет обновлено методом save() нового сообщения.
                    created_new_conversation = True
                    print(f"DEBUG [create_or_get]: Created new direct conversation with ID: {conversation.id}.")
                
                # Проверяем, что все создалось корректно
                check_conv = Conversation.objects.get(id=conversation.id)
                has_participants = check_conv.participants.filter(id=request.user.id).exists() and check_conv.participants.filter(id=other_user.id).exists()
                print(f"CREATE_OR_GET DEBUG: Проверка успешна - диалог существует: {check_conv.id}, участники присутствуют: {has_participants}")
                
                # Обновляем время последнего сообщения, если его нет
                if not conversation.last_message_time:
                    conversation.last_message_time = timezone.now()
                    conversation.save(update_fields=['last_message_time'])
                    print(f"CREATE_OR_GET DEBUG: Обновлено время последнего сообщения")
                
                # Создаем ответ с данными
                serializer = self.get_serializer(conversation)
                response_data = serializer.data
                response_data['created'] = created
                
                # Отправляем уведомления через WebSocket
                if created:
                    try:
                        from channels.layers import get_channel_layer
                        from asgiref.sync import async_to_sync
                        
                        channel_layer = get_channel_layer()
                        
                        # Уведомление для другого пользователя
                        other_user_group = f"notifications_{other_user.id}"
                        print(f"CREATE_OR_GET DEBUG: Отправка уведомления другому пользователю через {other_user_group}")
                        
                        async_to_sync(channel_layer.group_send)(
                            other_user_group,
                            {
                                "type": "new_conversation",
                                "conversation_id": conversation.conversation_id,
                                "other_user": {
                                    "id": request.user.id,
                                    "first_name": request.user.first_name,
                                    "last_name": request.user.last_name
                                },
                                "job": {"id": job.id, "title": job.title} if job else None
                            }
                        )
                        print(f"CREATE_OR_GET DEBUG: Уведомление отправлено")
                        
                        # Уведомление для текущего пользователя
                        current_user_group = f"notifications_{request.user.id}"
                        print(f"CREATE_OR_GET DEBUG: Отправка уведомления текущему пользователю через {current_user_group}")
                        
                        async_to_sync(channel_layer.group_send)(
                            current_user_group,
                            {
                                "type": "new_conversation",
                                "conversation_id": conversation.conversation_id,
                                "other_user": {
                                    "id": other_user.id,
                                    "first_name": other_user.first_name,
                                    "last_name": other_user.last_name
                                },
                                "job": {"id": job.id, "title": job.title} if job else None
                            }
                        )
                        print(f"CREATE_OR_GET DEBUG: Уведомление отправлено")
                        
                    except Exception as ws_error:
                        print(f"CREATE_OR_GET DEBUG: Ошибка отправки WebSocket-уведомления: {str(ws_error)}")
                
                print(f"CREATE_OR_GET DEBUG: Возвращаем ответ: created={created}, conversation_id={conversation.id}")
                return Response(response_data)
                
        except User.DoesNotExist:
            print(f"CREATE_OR_GET ERROR: Пользователь с ID {other_user_id} не найден")
            return Response(
                {"error": "Пользователь не найден"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Job.DoesNotExist:
            print(f"CREATE_OR_GET ERROR: Вакансия с ID {job_id} не найдена")
            return Response(
                {"error": "Вакансия не найдена"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"CREATE_OR_GET ERROR: Неожиданная ошибка: {str(e)}")
            return Response(
                {"error": f"Ошибка при создании/получении диалога: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """
        Возвращает сообщения для указанного диалога и помечает их как прочитанные.
        """
        print(f"DEBUG ConversationViewSet.messages: запрос сообщений для диалога {pk} от пользователя {request.user.id}")
        try:
            conversation = self.get_object()
            print(f"DEBUG ConversationViewSet.messages: получен диалог id={conversation.id}, conversation_id={conversation.conversation_id}")
            
            # Проверка доступа
            participants = list(conversation.participants.all().values_list('id', flat=True))
            print(f"DEBUG ConversationViewSet.messages: участники диалога: {participants}")
            
            if request.user not in conversation.participants.all():
                print(f"DEBUG ConversationViewSet.messages: отказ в доступе - пользователь {request.user.id} не является участником")
                return Response(
                    {"error": "У вас нет доступа к этому диалогу"},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Получаем сообщения
            messages = conversation.messages.all().order_by('created_at')
            msg_count = messages.count()
            print(f"DEBUG ConversationViewSet.messages: найдено {msg_count} сообщений в диалоге")
            
            # Отмечаем непрочитанные сообщения как прочитанные
            unread_messages = messages.filter(recipient=request.user, is_read=False)
            unread_count = unread_messages.count()
            print(f"DEBUG ConversationViewSet.messages: отмечаем {unread_count} непрочитанных сообщений")
            unread_messages.update(is_read=True)
                
            serializer = ChatMessageSerializer(messages, many=True)
            print(f"DEBUG ConversationViewSet.messages: возвращаем {len(serializer.data)} сериализованных сообщений")
            return Response(serializer.data)
            
        except Conversation.DoesNotExist:
            return Response(
                {"error": "Диалог не найден"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        user = request.user
        count = Conversation.objects.filter(participants=user, messages__is_read=False, messages__recipient=user).distinct().count()
        return Response({'unread_count': count})

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def initiate_chat(self, request):
        """
        Работодатель инициирует чат с соискателем.
        Требует recipient_id (ID соискателя).
        Сообщения не привязаны к конкретной вакансии (job=None).
        """
        employer = request.user
        recipient_id = request.data.get('recipient_id')
        initial_message_content = request.data.get('message', "Здравствуйте, я хотел бы обсудить с вами сотрудничество.")

        if not recipient_id:
            print("ERROR [initiate_chat]: recipient_id не указан.")
            return Response({"error": "Не указан ID получателя (recipient_id)."}, status=status.HTTP_400_BAD_REQUEST)

        if str(employer.id) == str(recipient_id):
            print(f"ERROR [initiate_chat]: Работодатель {employer.id} пытается начать чат с самим собой.")
            return Response({"error": "Нельзя начать чат с самим собой."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            print(f"ERROR [initiate_chat]: Получатель с id {recipient_id} не найден.")
            return Response({"error": "Получатель не найден."}, status=status.HTTP_404_NOT_FOUND)

        if recipient.role == 'employer':
            print(f"ERROR [initiate_chat]: Работодатель {employer.id} пытается начать чат с другим работодателем {recipient_id}.")
            return Response({"error": "Нельзя начать прямой чат с другим работодателем через этот эндпоинт."}, status=status.HTTP_400_BAD_REQUEST)
        
        if employer.role != 'employer':
            print(f"ERROR [initiate_chat]: Не работодатель {employer.id} (role: {employer.role}) пытается начать чат.")
            return Response({"error": "Только работодатели могут инициировать прямой чат."}, status=status.HTTP_403_FORBIDDEN)

        conversation = None
        created_new_conversation = False

        try:
            with transaction.atomic():
                # Ищем существующий "прямой" диалог (job=None) между этими двумя участниками
                # Участники могут быть в любом порядке в M2M
                existing_conversations = Conversation.objects.annotate(
                    num_participants=Count('participants')
                ).filter(
                    participants=employer
                ).filter(
                    participants=recipient
                ).filter(
                    job__isnull=True,
                    num_participants=2 # Убедимся, что в диалоге только эти два участника
                )

                if existing_conversations.exists():
                    conversation = existing_conversations.first()
                    print(f"DEBUG [initiate_chat]: Найден существующий прямой диалог ID: {conversation.id} между Работодателем {employer.id} и Получателем {recipient_id}.")
                else:
                    print(f"DEBUG [initiate_chat]: Не найден существующий прямой диалог. Создаем новый между Работодателем {employer.id} и Получателем {recipient_id}.")
                    conversation = Conversation.objects.create(job=None) # вакансия явно указана как None
                    conversation.participants.add(employer, recipient)
                    # Нет необходимости вызывать conversation.save() сразу после create, если участники добавляются сразу
                    # и last_message_time будет обновлено методом save() нового сообщения.
                    created_new_conversation = True
                    print(f"DEBUG [initiate_chat]: Создан новый прямой диалог с ID: {conversation.id}.")

                if not conversation or not conversation.id: # Дополнительная проверка
                    print(f"CRITICAL ERROR [initiate_chat]: Объект диалога None или не имеет ID после попытки создания/получения. Работодатель: {employer.id}, Получатель: {recipient.id}")
                    # Эта ошибка не должна произойти, если транзакция работает правильно
                    raise Exception("Диалог не может быть установлен.")

                # Создаем начальное сообщение от работодателя, если оно есть
                if initial_message_content:
                    message = ChatMessage.objects.create(
                        conversation=conversation,
                        sender=employer,
                        recipient=recipient,
                        job=None, # Сообщение в прямом диалоге также не привязано к вакансии
                        content=initial_message_content
                    )
                    print(f"DEBUG [initiate_chat]: Создано начальное сообщение ID: {message.id} в диалоге {conversation.id}.")
                else: # Если вдруг сообщение пустое, создадим дефолтное или просто пропустим, в зависимости от логики
                    print(f"DEBUG [initiate_chat]: Нет содержимого начального сообщения для диалога {conversation.id}. Может быть отправлено дефолтное сообщение или пропущено.")
                    # Можно создать дефолтное, если это требуется:
                    # ChatMessage.objects.create(conversation=conversation, sender=employer, recipient=recipient, job=None, content="Здравствуйте!")


        except Exception as e:
            print(f"ERROR [initiate_chat]: Ошибка при создании диалога/сообщения: {str(e)}. Работодатель: {employer.id}, Получатель: {recipient.id}")
            # Здесь можно добавить более детальное логирование ошибки `e` при необходимости
            return Response({"error": f"Ошибка на сервере при попытке создать диалог: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # WebSocket уведомления
        try:
            channel_layer = get_channel_layer()
            conversation_id_ws = conversation.conversation_id # Используем conversation_id для WS

            # Уведомление для соискателя о новом диалоге/сообщении
            recipient_group = f"notifications_{recipient.id}"
            async_to_sync(channel_layer.group_send)(
                recipient_group,
                {
                    "type": "new_conversation", # или "new_message" если диалог мог существовать
                    "conversation_id": conversation_id_ws,
                    "other_user": {"id": employer.id, "first_name": employer.first_name, "last_name": employer.last_name, "company_name": getattr(employer, 'company_name', None)},
                    "job": None, # Прямой чат, нет привязки к вакансии
                    "initial_message": initial_message_content if initial_message_content else "Вам новое сообщение от работодателя."
                }
            )
            print(f"DEBUG [initiate_chat]: Отправлено WebSocket уведомление в группу {recipient_group}.")

            # Уведомление для самого работодателя, чтобы чат появился/обновился в списке
            if created_new_conversation: # Только если это новый диалог
                employer_group = f"notifications_{employer.id}"
                async_to_sync(channel_layer.group_send)(
                    employer_group,
                    {
                        "type": "new_conversation",
                        "conversation_id": conversation_id_ws,
                        "other_user": {"id": recipient.id, "first_name": recipient.first_name, "last_name": recipient.last_name},
                        "job": None,
                    }
                )
                print(f"DEBUG [initiate_chat]: Отправлено WebSocket уведомление в группу {employer_group} для нового диалога.")

        except Exception as ws_error:
            print(f"WARNING [initiate_chat]: Не удалось отправить WebSocket уведомление: {str(ws_error)}. Диалог {conversation.id} все равно создан.")
            # Не прерываем выполнение, если WebSocket уведомление не удалось

        try:
            serializer = ConversationSerializer(conversation, context={'request': request})
            serialized_data = serializer.data
        except Exception as serial_err:
            print(f"CRITICAL ERROR [initiate_chat]: Не удалось сериализовать диалог ID {conversation.id if conversation else 'UnknownConvoID'}. Ошибка: {str(serial_err)}")
            # Также можно логировать полный traceback ошибки serial_err здесь для большей детализации
            # import traceback; print(traceback.format_exc())
            return Response({
                "error": f"Ошибка сервера: не удалось подготовить данные диалога из-за ошибки сериализации: {str(serial_err)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        if not serialized_data or not serialized_data.get('id'):
            print(f"CRITICAL ERROR [initiate_chat]: Сериализованные данные диалога отсутствуют ID или данные пусты. ID диалога: {conversation.id if conversation else 'UnknownConvoID'}. Сериализованные данные: {serialized_data}")
            return Response({
                "error": f"Ошибка сервера: не удалось подготовить данные диалога из-за ошибки сериализации: {str(serial_err)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        print(f"SUCCESS [initiate_chat]: Успешно инициирован/получен прямой диалог. ID: {serialized_data.get('id')}. Работодатель: {employer.id}, Получатель: {recipient.id}")
        return Response(serialized_data, status=status.HTTP_201_CREATED)

class ChatMessageViewSet(viewsets.ModelViewSet):
    """
    Представление для работы с моделью ChatMessage (сообщения чата).
    """
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Возвращает сообщения, в которых пользователь является отправителем или получателем.
        """
        return ChatMessage.objects.filter(
            Q(sender=self.request.user) | Q(recipient=self.request.user)
        ).select_related('conversation', 'sender', 'recipient', 'job').order_by('created_at')
    
    def perform_create(self, serializer):
        print(f"[CHAT_MSG_CREATE] perform_create вызван. Данные запроса: {self.request.data}")
        conversation_id_from_request = self.request.data.get('conversation_id')
        print(f"[CHAT_MSG_CREATE] Получен conversation_identifier: '{conversation_id_from_request}' (type: {type(conversation_id_from_request)})")
            
        try:
            if conversation_id_from_request is None:
                print("[CHAT_MSG_CREATE] Ошибка: conversation_id_from_request is None.")
                raise serializers.ValidationError(
                    {"conversation_id": "ID диалога не предоставлен."}
                )
                
            conversation = None
            try:
                print(f"[CHAT_MSG_CREATE] Попытка преобразовать '{conversation_id_from_request}' в int для поиска по PK.")
                conv_pk = int(conversation_id_from_request)
                print(f"[CHAT_MSG_CREATE] Попытка Conversation.objects.get(id={conv_pk})")
                conversation = Conversation.objects.get(id=conv_pk)
                print(f"[CHAT_MSG_CREATE] Найден диалог по числовому PK: {conversation.id}")
            except ValueError:
                print(f"[CHAT_MSG_CREATE] ValueError: Не удалось преобразовать '{conversation_id_from_request}' в int. Будет попытка поиска по строковому ID.")
            except Conversation.DoesNotExist:
                print(f"[CHAT_MSG_CREATE] Conversation.DoesNotExist для PK '{conversation_id_from_request}'. Будет попытка поиска по строковому ID.")

            if not conversation and isinstance(conversation_id_from_request, str):
                print(f"[CHAT_MSG_CREATE] Попытка Conversation.find_by_conversation_id('{conversation_id_from_request}')")
                found_by_string_id = None
                for c in Conversation.objects.all(): 
                    if c.conversation_id == conversation_id_from_request:
                        found_by_string_id = c
                        break
                conversation = found_by_string_id
                if conversation:
                    print(f"[CHAT_MSG_CREATE] Найден диалог по строковому conversation_id: {conversation.id} (string_id: '{conversation.conversation_id}')")
                else:
                    print(f"[CHAT_MSG_CREATE] Диалог не найден по строковому conversation_id '{conversation_id_from_request}'.")
            
            if not conversation:
                print(f"[CHAT_MSG_CREATE] Ошибка: Диалог не найден ни одним методом для идентификатора '{conversation_id_from_request}'.")
                raise serializers.ValidationError(
                    {"conversation_id": f"Диалог с идентификатором '{conversation_id_from_request}' не найден."}
                )
                
            message = serializer.save(
                sender=self.request.user,
                recipient=conversation.participants.exclude(id=self.request.user.id).first(),
                conversation=conversation,
                job=conversation.job
            )
            print(f"[CHAT_MSG_CREATE] Сообщение сохранено: {message.id} в диалоге {conversation.id}")
        except Conversation.DoesNotExist:
            print(f"[CHAT_MSG_CREATE] Outer Conversation.DoesNotExist для идентификатора '{conversation_id_from_request}'. Это должно быть обработано ранее.")
            raise serializers.ValidationError(
                {"conversation_id": "Диалог не найден (outer exception)."}
            )
        except serializers.ValidationError as e:
            print(f"[CHAT_MSG_CREATE] ValidationError: {e.detail}")
            raise 
        except Exception as e:
            print(f"[CHAT_MSG_CREATE] Unexpected Exception: {type(e).__name__} - {str(e)}")
            raise serializers.ValidationError({"detail": f"Неожиданная ошибка сервера: {str(e)}"})
    def mark_read(self, request):
        conversation_id = request.data.get('conversation_id')
        
        if not conversation_id:
            return Response(
                {"error": "Не указан ID диалога"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            
            if request.user not in conversation.participants.all():
                return Response(
                    {"error": "У вас нет доступа к этому диалогу"},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            count = ChatMessage.objects.filter(
                conversation=conversation,
                recipient=request.user,
                is_read=False
            ).update(is_read=True)
            
            return Response({"marked_read": count})
            
        except Conversation.DoesNotExist:
            return Response(
                {"error": "Диалог не найден"},
                status=status.HTTP_404_NOT_FOUND
            )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_redis(request):
    try:
        channel_layer = get_channel_layer()
        redis_client = redis.Redis(host='localhost', port=6379, db=0)
        redis_available = redis_client.ping()
        
        return Response({
            'redis_available': bool(redis_available),
            'channel_layer_type': getattr(channel_layer, 'channel_layer_type', 'unknown')
        })
    except Exception as e:
        return Response({
            'redis_available': False,
            'error': str(e)
        }) 
from rest_framework import viewsets, status, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count
from .models import Job, JobApplication, SavedJob, ChatMessage
from .serializers import (
    JobSerializer, JobApplicationSerializer,
    SavedJobSerializer, ChatMessageSerializer
)
from django.utils import timezone
from django.contrib.auth.models import User

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
        
        if job.company != request.user:
            return Response(
                {"error": "Вы не можете просматривать отклики на эту вакансию"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        applications = JobApplication.objects.filter(job=job).select_related('resume', 'user')
        serializer = JobApplicationSerializer(applications, many=True)
        return Response(serializer.data)

class JobApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.profile.role == 'employer':
            return JobApplication.objects.filter(
                job__company=user.profile.company
            ).select_related('job', 'resume', 'user')
        
        return JobApplication.objects.filter(
            user=user
        ).select_related('job', 'resume', 'user')
    
    def perform_create(self, serializer):
        if self.request.user.profile.role != 'jobseeker':
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
            
        if JobApplication.objects.filter(user=self.request.user, job=job).exists():
            raise serializers.ValidationError(
                {"error": "Вы уже откликнулись на эту вакансию"}
            )
            
        serializer.save(user=self.request.user, status='pending')
    
    @action(detail=False, methods=['get'])
    def my(self, request):
        applications = JobApplication.objects.filter(
            user=request.user
        ).select_related('job', 'resume').order_by('-created_at')
        
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        application = self.get_object()
        
        if request.user.profile.role != 'employer' or application.job.company != request.user.profile.company:
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
    def start_chat(self, request):
        job_id = request.data.get('job_id')
        if not job_id:
            return Response(
                {"error": "Не указан ID вакансии"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            job = Job.objects.get(id=job_id, is_active=True)
            employer = job.company.user
            
            message = ChatMessage.objects.create(
                sender=request.user,
                recipient=employer,
                job=job,
                content=f"Здравствуйте! Я заинтересован(а) в вакансии \"{job.title}\"."
            )
            
            conversation_id = f"{employer.id}_{job.id}"
            
            return Response({
                "status": "success", 
                "message": "Чат с работодателем создан",
                "conversation_id": conversation_id
            })
        except Job.DoesNotExist:
            return Response(
                {"error": "Вакансия не найдена или неактивна"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class SavedJobViewSet(viewsets.ModelViewSet):
    serializer_class = SavedJobSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SavedJob.objects.filter(user=self.request.user).select_related(
            'job', 'job__company'
        )
    
    def perform_create(self, serializer):
        job_id = self.request.data.get('job')
        try:
            job = Job.objects.get(id=job_id, is_active=True)
        except Job.DoesNotExist:
            raise serializers.ValidationError(
                {"job": "Вакансия не найдена или неактивна"}
            )
        
        if SavedJob.objects.filter(user=self.request.user, job=job).exists():
            raise serializers.ValidationError(
                {"job": "Эта вакансия уже сохранена"}
            )
        
        serializer.save(user=self.request.user)
        return Response({"status": "Вакансия успешно сохранена"}, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle(self, request):
        job_id = request.data.get('job')
        if not job_id:
            return Response(
                {"error": "Не указан ID вакансии"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            job_id = int(job_id)
            job = Job.objects.get(id=job_id)
        except (ValueError, TypeError):
            return Response(
                {"error": "Некорректный ID вакансии"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Job.DoesNotExist:
            return Response(
                {"error": "Вакансия не найдена"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        saved_job = SavedJob.objects.filter(user=request.user, job=job).first()
        
        if saved_job:
            saved_job.delete()
            return Response({
                "status": "Вакансия удалена из сохраненных",
                "is_saved": False,
                "job_id": job_id
            })
        else:
            if not job.is_active:
                return Response(
                    {"error": "Нельзя сохранить неактивную вакансию"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            saved_job = SavedJob.objects.create(user=request.user, job=job)
            serializer = self.get_serializer(saved_job)
            return Response({
                "status": "Вакансия добавлена в сохраненных",
                "is_saved": True,
                "job_id": job_id,
                "saved_job": serializer.data
            })
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def stats(self, request):
        saved_jobs = SavedJob.objects.filter(user=request.user)
        total_saved = saved_jobs.count()
        
        employment_counts = {}
        for job_type in ['full_time', 'part_time', 'remote', 'contract', 'internship']:
            count = saved_jobs.filter(job__employment_type=job_type).count()
            if count > 0:
                employment_counts[job_type] = count
        
        experience_counts = {}
        for exp_level in ['no_experience', 'junior', 'middle', 'senior', 'lead']:
            count = saved_jobs.filter(job__experience=exp_level).count()
            if count > 0:
                experience_counts[exp_level] = count
        
        return Response({
            'total_saved': total_saved,
            'by_employment_type': employment_counts,
            'by_experience': experience_counts
        })

class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ChatMessage.objects.filter(
            Q(sender=self.request.user) | Q(recipient=self.request.user)
        ).order_by('created_at')
    
    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
        
    @action(detail=False, methods=['get'])
    def conversations(self, request):
        messages = ChatMessage.objects.filter(
            Q(sender=request.user) | Q(recipient=request.user)
        ).select_related('job', 'sender', 'recipient')
        
        conversations = {}
        for msg in messages:
            other_user = msg.recipient if msg.sender == request.user else msg.sender
            
            key = f"{other_user.id}_{msg.job.id if msg.job else 'none'}"
            
            if key not in conversations:
                job_title = msg.job.title if msg.job else None
                
                if other_user.profile.role == 'employer':
                    name = f"{other_user.first_name} {other_user.last_name} ({other_user.profile.company.name})"
                else:
                    name = f"{other_user.first_name} {other_user.last_name}"
                
                conversations[key] = {
                    'id': key,
                    'recipient_id': other_user.id,
                    'recipient_name': name,
                    'job_id': msg.job.id if msg.job else None,
                    'job_title': job_title,
                    'last_message': None,
                    'last_message_date': None,
                    'unread_count': 0
                }
            
            if not conversations[key]['last_message_date'] or msg.created_at > conversations[key]['last_message_date']:
                conversations[key]['last_message'] = msg.content
                conversations[key]['last_message_date'] = msg.created_at
                
            if msg.recipient == request.user and not msg.is_read:
                conversations[key]['unread_count'] += 1
        
        conversation_list = list(conversations.values())
        conversation_list.sort(key=lambda x: x['last_message_date'] or timezone.now(), reverse=True)
        
        return Response(conversation_list)
        
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        try:
            parts = pk.split('_')
            other_user_id = int(parts[0])
            job_id = None if parts[1] == 'none' else int(parts[1])
            
            other_user = User.objects.get(id=other_user_id)
            
            job = None
            if job_id:
                job = Job.objects.get(id=job_id)
                
            messages = ChatMessage.objects.filter(
                ((Q(sender=request.user) & Q(recipient=other_user)) |
                 (Q(sender=other_user) & Q(recipient=request.user))) &
                (Q(job=job) if job else Q(job__isnull=True))
            ).order_by('created_at')
            
            unread_messages = messages.filter(recipient=request.user, is_read=False)
            for msg in unread_messages:
                msg.is_read = True
                msg.save()
                
            serializer = self.get_serializer(messages, many=True)
            return Response(serializer.data)
            
        except (ValueError, User.DoesNotExist, Job.DoesNotExist):
            return Response(
                {"error": "Неверный формат идентификатора диалога"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        user_id = request.data.get('user_id')
        job_id = request.data.get('job_id')
        
        if not user_id:
            return Response(
                {"error": "Не указан ID отправителя"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            query = Q(sender_id=user_id, recipient=request.user, is_read=False)
            
            if job_id:
                query &= Q(job_id=job_id)
                
            count = ChatMessage.objects.filter(query).update(is_read=True)
            
            return Response({"marked_read": count})
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = ChatMessage.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        
        return Response({"unread_count": count}) 
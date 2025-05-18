from rest_framework import serializers
from .models import Job, JobApplication, SavedJob, ChatMessage, Conversation
from django.contrib.auth import get_user_model
from django.db.models import Count, Max, Q

User = get_user_model()

class JobSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    is_saved = serializers.SerializerMethodField()
    applications_count = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ('company', 'created_at', 'updated_at')

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return SavedJob.objects.filter(user=request.user, job=obj).exists()
        return False

    def get_applications_count(self, obj):
        return obj.applications.count()

    def validate(self, data):
        if data.get('salary_min') and data.get('salary_max'):
            if data['salary_min'] > data['salary_max']:
                raise serializers.ValidationError({
                    "salary": "Минимальная зарплата не может быть больше максимальной"
                })
        return data

class JobApplicationSerializer(serializers.ModelSerializer):
    applicant_name = serializers.CharField(source='applicant.get_full_name', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company.company_name', read_only=True)

    class Meta:
        model = JobApplication
        fields = '__all__'
        read_only_fields = ('applicant', 'status', 'created_at', 'updated_at')

    def validate(self, data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if request.user.is_employer():
                raise serializers.ValidationError("Employers cannot apply for jobs")
            if JobApplication.objects.filter(job=data['job'], applicant=request.user).exists():
                raise serializers.ValidationError("You have already applied for this job")
        return data

class SavedJobSerializer(serializers.ModelSerializer):
    job_details = JobSerializer(source='job', read_only=True)

    class Meta:
        model = SavedJob
        fields = ('id', 'user', 'job', 'job_details', 'saved_at')
        read_only_fields = ('user', 'saved_at')

class ConversationSerializer(serializers.ModelSerializer):
    participants_info = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    job_title = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'conversation_id', 'participants', 'participants_info', 
                  'job', 'job_title', 'created_at', 'updated_at', 
                  'last_message_time', 'last_message', 'unread_count']
        read_only_fields = ['conversation_id', 'last_message_time']
    
    def get_participants_info(self, obj):
        request = self.context.get('request')
        current_user = request.user if request else None
        
        # Если нет текущего пользователя, возвращаем информацию о всех участниках
        if not current_user:
            return [{
                'id': user.id,
                'name': f"{user.first_name} {user.last_name}",
                'username': user.username,
                'company_name': getattr(user, 'company_name', None),
                'role': user.role
            } for user in obj.participants.all()]
        
        # Иначе возвращаем информацию только о других участниках
        return [{
            'id': user.id,
            'name': f"{user.first_name} {user.last_name}",
            'username': user.username,
            'company_name': getattr(user, 'company_name', None),
            'role': user.role
        } for user in obj.participants.exclude(id=current_user.id)]
    
    def get_last_message(self, obj):
        message = obj.messages.order_by('-created_at').first()
        if not message:
            return None
            
        return {
            'content': message.content,
            'sender_id': message.sender_id,
            'created_at': message.created_at,
            'is_read': message.is_read
        }
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
            
        return obj.messages.filter(recipient=request.user, is_read=False).count()
    
    def get_job_title(self, obj):
        if not obj.job:
            return None
            
        return obj.job.title

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)

    class Meta:
        model = ChatMessage
        fields = '__all__'
        read_only_fields = ('sender', 'recipient', 'conversation', 'job', 'is_read', 'created_at', 'updated_at') 
from rest_framework import serializers
from .models import Job, JobApplication, SavedJob, ChatMessage
from django.contrib.auth import get_user_model

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
                    "salary": "Minimum salary cannot be greater than maximum salary"
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

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)

    class Meta:
        model = ChatMessage
        fields = '__all__'
        read_only_fields = ('sender', 'is_read', 'created_at', 'updated_at') 
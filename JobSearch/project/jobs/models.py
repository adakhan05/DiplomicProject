from django.db import models
from django.conf import settings
import re

def sanitize_id(name):
    if not name:
        return "default_id"
    
    # Заменяем недопустимые символы на подчеркивания
    sanitized = re.sub(r'[^a-zA-Z0-9\-_\.]', '_', str(name))
    
    # Проверяем, что строка не слишком длинная
    if len(sanitized) > 99:
        sanitized = sanitized[:99]
        
    return sanitized

class Job(models.Model):
    EMPLOYMENT_TYPE_CHOICES = (
        ('full_time', 'Full time'),
        ('part_time', 'Part time'),
        ('remote', 'Remote'),
        ('contract', 'Contract'),
    )
    
    EXPERIENCE_CHOICES = (
        ('no_experience', 'No experience'),
        ('1-3', '1-3 years'),
        ('3-5', '3-5 years'),
        ('5+', '5+ years'),
    )
    
    title = models.CharField(max_length=200)
    company = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posted_jobs')
    location = models.CharField(max_length=100)
    salary_min = models.IntegerField()
    salary_max = models.IntegerField()
    description = models.TextField()
    requirements = models.TextField()
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES)
    experience = models.CharField(max_length=20, choices=EXPERIENCE_CHOICES)
    skills = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} at {self.company.company_name}"

class JobApplication(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('interview', 'Interview'),
    )
    
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    applicant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='job_applications')
    cover_letter = models.TextField()
    resume = models.ForeignKey('users.Resume', on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('job', 'applicant')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Application for {self.job.title} by {self.applicant.username}"

class SavedJob(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_jobs')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='saved_by')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'job')
        ordering = ['-saved_at']

    def __str__(self):
        return f"{self.user.username} saved {self.job.title}"

class Conversation(models.Model):
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')
    job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_message_time = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-last_message_time', '-updated_at']
    
    def __str__(self):
        participants_str = ", ".join([str(user) for user in self.participants.all()])
        job_str = f" about {self.job.title}" if self.job else ""
        return f"диалог между {participants_str}{job_str}"
    
    @property
    def conversation_id(self):
        participants = sorted(list(self.participants.values_list('id', flat=True)))
        if len(participants) != 2:
            return sanitize_id(f"conv_{self.id}")
        
        job_part = self.job.id if self.job else 'none'
        raw_id = f"{participants[0]}_{participants[1]}_{job_part}"
        result = sanitize_id(raw_id)
        print(f"DEBUG Conversation.conversation_id: {self.id} сгенерировал conversation_id={result}")
        return result

class ChatMessage(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='chat_messages', null=True, blank=True)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Message from {self.sender} to {self.recipient}"
    
    def save(self, *args, **kwargs):
        # Обновляем время последнего сообщения в диалоге при сохранении сообщения
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new and self.conversation:
            self.conversation.last_message_time = self.created_at
            self.conversation.save(update_fields=['last_message_time', 'updated_at'])
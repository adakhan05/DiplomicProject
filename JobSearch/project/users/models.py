from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('jobseeker', 'Jobseeker'),
        ('employer', 'Employer'),
    )
    
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='jobseeker')
    company_name = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'role']

    def is_employer(self):
        return self.role == 'employer'
    
    def is_jobseeker(self):
        return self.role == 'jobseeker'

    def __str__(self):
        return self.email

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        db_table = 'auth_user'

class Company(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    employees_count = models.IntegerField(null=True, blank=True)
    founded_year = models.IntegerField(null=True, blank=True)
    location = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'

class Resume(models.Model):
    LANGUAGE_LEVELS = (
        ('beginner', 'Начальный'),
        ('intermediate', 'Средний'),
        ('advanced', 'Продвинутый'),
        ('native', 'Родной'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resumes')
    title = models.CharField(max_length=200, verbose_name='Название резюме')
    desired_position = models.CharField(max_length=200, verbose_name='Желаемая должность')
    professional_summary = models.TextField(verbose_name='Профессиональное резюме')
    skills = models.JSONField(default=list, verbose_name='Навыки')
    languages = models.JSONField(default=list, verbose_name='Языки')
    salary_expectation = models.IntegerField(null=True, blank=True, verbose_name='Ожидаемая зарплата')
    preferred_employment = models.CharField(
        max_length=20,
        choices=(
            ('full_time', 'Полная занятость'),
            ('part_time', 'Частичная занятость'),
            ('remote', 'Удаленная работа'),
            ('contract', 'Контракт'),
        ),
        default='full_time',
        verbose_name='Предпочитаемый тип занятости'
    )
    is_active = models.BooleanField(default=True, verbose_name='Активно')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.user.email}"

    class Meta:
        verbose_name = 'Резюме'
        verbose_name_plural = 'Резюме'
        ordering = ['-updated_at']

class Experience(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='experiences')
    company_name = models.CharField(max_length=100)
    position = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    description = models.TextField()
    
    class Meta:
        ordering = ['-start_date']

class Education(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='education')
    institution = models.CharField(max_length=100)
    degree = models.CharField(max_length=100)
    field_of_study = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    class Meta:
        ordering = ['-start_date']

class Portfolio(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='portfolio')
    title = models.CharField(max_length=100)
    description = models.TextField()
    url = models.URLField(blank=True)
    image = models.ImageField(upload_to='portfolio/', blank=True)
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Resume, Experience, Education, Portfolio

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role',
                 'company_name', 'position', 'phone', 'bio', 'avatar')
        read_only_fields = ('id',)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name',
                 'role', 'company_name', 'position', 'phone')
        extra_kwargs = {
            'email': {'required': True},
            'role': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False},
            'company_name': {'required': False},
            'position': {'required': False},
            'phone': {'required': False},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        attrs.pop('password2', None)
        return attrs

    def create(self, validated_data):
        try:
            user = User.objects.create_user(**validated_data)
            return user
        except Exception as e:
            print(f"Error creating user: {str(e)}")
            raise serializers.ValidationError({"error": "Error creating user"})

class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = ('id', 'company_name', 'position', 'start_date', 'end_date', 'description')

class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ('id', 'institution', 'degree', 'field_of_study', 'start_date', 'end_date')

class PortfolioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Portfolio
        fields = ('id', 'title', 'description', 'url', 'image')

class ResumeSerializer(serializers.ModelSerializer):
    experiences = ExperienceSerializer(many=True, read_only=True)
    education = EducationSerializer(many=True, read_only=True)
    portfolio = PortfolioSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)
    resume_file_url = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = (
            'id', 'user', 'title', 'desired_position', 'professional_summary',
            'skills', 'languages', 'salary_expectation', 'preferred_employment',
            'is_active', 'created_at', 'updated_at', 'experiences', 'education',
            'portfolio', 'resume_file_url', 'resume_file'
        )
        read_only_fields = ('user', 'created_at', 'updated_at', 'resume_file_url')

    def get_resume_file_url(self, obj):
        if obj.resume_file and hasattr(obj.resume_file, 'url'):
            request = self.context.get('request')
            base_url = ''
            
            if request:
                # Получаем хост из запроса (работает для любого IP или hostname)
                host = request.get_host()
                protocol = 'https' if request.is_secure() else 'http'
                base_url = f"{protocol}://{host}"
            else:
                # Запасной вариант, если request недоступен
                base_url = "http://localhost:8000"
            
            # Удаляем trailing slash из базового URL
            base_url = base_url.rstrip('/')
            
            # Добавляем временную метку для предотвращения кэширования браузером
            timestamp = obj.updated_at.timestamp() if obj.updated_at else ''
            file_url = obj.resume_file.url
            url = f"{file_url}?v={timestamp}"
            
            # Формируем абсолютный URL
            absolute_url = f"{base_url}{url}"
            print(f"Generated resume file URL with timestamp: {absolute_url}")
            
            return absolute_url
        return None

    def validate_skills(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Навыки должны быть списком")
        return value

    def validate_languages(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Языки должны быть списком")
        valid_levels = dict(Resume.LANGUAGE_LEVELS).keys()
        for lang in value:
            if not isinstance(lang, dict) or 'language' not in lang or 'level' not in lang:
                raise serializers.ValidationError("Каждый язык должен содержать 'language' и 'level'")
            if lang['level'] not in valid_levels:
                raise serializers.ValidationError(f"Недопустимый уровень языка: {lang['level']}")
        return value 
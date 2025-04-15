from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from jobs.models import Job

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates test data for the job board'

    def handle(self, *args, **kwargs):
        companies = [
            {
                'username': 'techcorp',
                'email': 'hr@techcorp.com',
                'password': 'testpass123',
                'company_name': 'TechCorp',
                'role': 'employer'
            },
            {
                'username': 'webstudio',
                'email': 'hr@webstudio.com',
                'password': 'testpass123',
                'company_name': 'WebStudio',
                'role': 'employer'
            },
            {
                'username': 'cloudsystems',
                'email': 'hr@cloudsystems.com',
                'password': 'testpass123',
                'company_name': 'CloudSystems',
                'role': 'employer'
            },
            {
                'username': 'innovatech',
                'email': 'hr@innovatech.com',
                'password': 'testpass123',
                'company_name': 'InnovaTech',
                'role': 'employer'
            },
            {
                'username': 'digitalminds',
                'email': 'hr@digitalminds.com',
                'password': 'testpass123',
                'company_name': 'Digital Minds',
                'role': 'employer'
            }
        ]

        created_companies = []
        for company_data in companies:
            company, created = User.objects.get_or_create(
                username=company_data['username'],
                defaults={
                    'email': company_data['email'],
                    'company_name': company_data['company_name'],
                    'role': company_data['role']
                }
            )
            if created:
                company.set_password(company_data['password'])
                company.save()
            created_companies.append(company)

        jobs_data = [
            {
                'title': 'Senior Python Developer',
                'company': created_companies[0],
                'location': 'Moscow',
                'salary_min': 200000,
                'salary_max': 300000,
                'description': 'Development of high-load web applications using Python/Django',
                'requirements': 'Python, Django, PostgreSQL, Redis',
                'employment_type': 'full_time',
                'experience': '3-5',
                'skills': ['Python', 'Django', 'PostgreSQL', 'Redis', 'Docker']
            },
            {
                'title': 'Frontend Developer',
                'company': created_companies[1],
                'location': 'Saint Petersburg',
                'salary_min': 150000,
                'salary_max': 180000,
                'description': 'Development of modern web interfaces',
                'requirements': 'JavaScript, React, TypeScript',
                'employment_type': 'full_time',
                'experience': '1-3',
                'skills': ['JavaScript', 'React', 'TypeScript', 'HTML', 'CSS']
            },
            {
                'title': 'DevOps Engineer',
                'company': created_companies[2],
                'location': 'Remote',
                'salary_min': 220000,
                'salary_max': 280000,
                'description': 'Setting up and maintaining infrastructure',
                'requirements': 'Docker, Kubernetes, AWS',
                'employment_type': 'remote',
                'experience': '3-5',
                'skills': ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform']
            },
            {
                'title': 'UI/UX Designer',
                'company': created_companies[3],
                'location': 'Moscow',
                'salary_min': 160000,
                'salary_max': 220000,
                'description': 'Creating beautiful and user-friendly interfaces',
                'requirements': 'Figma, Adobe XD, User Research',
                'employment_type': 'full_time',
                'experience': '1-3',
                'skills': ['Figma', 'Adobe XD', 'UI Design', 'UX Research', 'Prototyping']
            },
            {
                'title': 'Full Stack Developer',
                'company': created_companies[4],
                'location': 'Remote',
                'salary_min': 180000,
                'salary_max': 250000,
                'description': 'Development of full-stack web applications',
                'requirements': 'React, Node.js, MongoDB',
                'employment_type': 'remote',
                'experience': '3-5',
                'skills': ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS']
            },
            {
                'title': 'Mobile Developer',
                'company': created_companies[0],
                'location': 'Saint Petersburg',
                'salary_min': 170000,
                'salary_max': 240000,
                'description': 'Development of mobile applications for iOS and Android',
                'requirements': 'React Native, iOS, Android',
                'employment_type': 'full_time',
                'experience': '1-3',
                'skills': ['React Native', 'iOS', 'Android', 'Mobile Development']
            }
        ]

        for job_data in jobs_data:
            Job.objects.get_or_create(
                title=job_data['title'],
                company=job_data['company'],
                defaults={
                    'location': job_data['location'],
                    'salary_min': job_data['salary_min'],
                    'salary_max': job_data['salary_max'],
                    'description': job_data['description'],
                    'requirements': job_data['requirements'],
                    'employment_type': job_data['employment_type'],
                    'experience': job_data['experience'],
                    'skills': job_data['skills']
                }
            )

        self.stdout.write(self.style.SUCCESS('Successfully created test data')) 
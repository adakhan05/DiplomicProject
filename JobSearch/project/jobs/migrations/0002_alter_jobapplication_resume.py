import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("jobs", "0001_initial"),
        ("users", "0003_alter_resume_options_resume_desired_position_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="jobapplication",
            name="resume",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="users.resume",
            ),
        ),
    ]

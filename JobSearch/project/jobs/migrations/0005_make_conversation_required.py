from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0004_create_conversations_from_messages'),
    ]

    operations = [
        migrations.AlterField(
            model_name='chatmessage',
            name='conversation',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='jobs.conversation'),
        ),
    ] 
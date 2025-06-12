from django.db import migrations
from django.db.models import Q
from django.apps import apps
from django.conf import settings

def create_conversations_from_messages(apps, schema_editor):
    """
    Создаёт диалоги из существующих сообщений и связывает сообщения с этими диалогами.
    """
    ChatMessage = apps.get_model('jobs', 'ChatMessage')
    Conversation = apps.get_model('jobs', 'Conversation')
    
    # Определяем модель пользователя динамически из настроек
    user_app, user_model = settings.AUTH_USER_MODEL.split('.')
    User = apps.get_model(user_app, user_model)
    
    # Группируем сообщения по участникам и вакансиям
    conversation_keys = {}
    
    # Получаем все сообщения, которые не связаны с диалогами
    messages = ChatMessage.objects.filter(conversation__isnull=True)
    
    print(f"Найдено {messages.count()} сообщений без диалогов")
    
    for message in messages:
        sender_id = message.sender_id
        recipient_id = message.recipient_id
        job_id = message.job_id
        
        # Создаём уникальный ключ для разговора на основе отсортированных ID участников и ID вакансии
        participant_ids = sorted([sender_id, recipient_id])
        key = f"{participant_ids[0]}_{participant_ids[1]}_{job_id or 'none'}"
        
        if key not in conversation_keys:
            # Создаём новый диалог
            conversation = Conversation.objects.create(
                last_message_time=message.created_at
            )
            
            # Добавляем участников
            try:
                sender = User.objects.get(id=sender_id)
                recipient = User.objects.get(id=recipient_id)
                conversation.participants.add(sender, recipient)
                
                # Если сообщение связано с вакансией, связываем и диалог
                if job_id:
                    conversation.job_id = job_id
                    conversation.save(update_fields=['job'])
                
                # Сохраняем диалог в словаре
                conversation_keys[key] = conversation
                print(f"Создан диалог {conversation.id} между пользователями {sender_id} и {recipient_id}")
            except User.DoesNotExist as e:
                print(f"Ошибка при создании диалога: {e}")
                continue
        
        # Связываем сообщение с диалогом
        message.conversation = conversation_keys.get(key)
        message.save(update_fields=['conversation'])
    
    # Логируем результаты
    print(f"Создано {len(conversation_keys)} диалогов из существующих сообщений")

def reverse_func(apps, schema_editor):
    ChatMessage = apps.get_model('jobs', 'ChatMessage')
    Conversation = apps.get_model('jobs', 'Conversation')
    
    # Отвязываем сообщения от диалогов
    ChatMessage.objects.all().update(conversation=None)
    print("Отвязаны все сообщения от диалогов")
    
    # Удаляем все диалоги
    count = Conversation.objects.all().count()
    Conversation.objects.all().delete()
    print(f"Удалены все диалоги ({count})")

class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0003_conversation_chatmessage_conversation'),
    ]

    operations = [
        migrations.RunPython(create_conversations_from_messages, reverse_func),
    ] 
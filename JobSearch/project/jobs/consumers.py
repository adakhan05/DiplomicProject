import json
import re
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatMessage, Job, Conversation
from django.utils import timezone
from asgiref.sync import sync_to_async

User = get_user_model()

def sanitize_group_name(name):
    """
    Очищает строку, чтобы обеспечить её валидность для имен групп WebSocket.
    - Разрешает только ASCII буквы и цифры, дефисы, подчеркивания или точки
    - Ограничивает длину до 99 символов
    """
    if not name:
        return "default_group"
    
    # Заменяем недопустимые символы на подчеркивания
    sanitized = re.sub(r'[^a-zA-Z0-9\-_\.]', '_', str(name))
    
    # Проверяем, что строка не слишком длинная
    if len(sanitized) > 99:
        sanitized = sanitized[:99]
        
    return sanitized

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """
        Обрабатывает подключение к WebSocket.
        Может обрабатывать два типа подключений:
        1. Канал уведомлений (notifications_{user_id})
        2. Канал конкретного диалога (chat_{conversation_id})
        """
        # Начальные установки
        self.room_group_name = None
        self.is_authenticated = self.scope["user"].is_authenticated

        if not self.is_authenticated:
            # Отклоняем подключение если пользователь не авторизован
            await self.close(code=4001)
            return

        # Получаем идентификатор разговора из URL
        self.conversation_id = self.scope["url_route"]["kwargs"].get("conversation_id")
        if not self.conversation_id:
            # Это подключение только для уведомлений (не привязано к конкретному разговору)
            self.user_id = self.scope["user"].id
            self.room_group_name = sanitize_group_name(f"notifications_{self.user_id}")
            
            # Присоединяемся к группе уведомлений для этого пользователя
            try:
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
                print(f"Пользователь {self.user_id} присоединился к группе уведомлений: {self.room_group_name}")
                
                # Принимаем WebSocket соединение
                await self.accept()
                
                # Уведомляем клиента об успешном подключении к каналу уведомлений
                await self.send(text_data=json.dumps({
                    "type": "connection_established",
                    "message": "Подключено к каналу уведомлений",
                    "user_id": self.user_id,
                    "timestamp": timezone.now().isoformat()
                }))
                
                print(f"Пользователь {self.user_id} успешно подключен к каналу уведомлений")
            except Exception as e:
                print(f"Ошибка при подключении пользователя {self.user_id} к каналу уведомлений: {str(e)}")
                await self.close(code=4002)
            
            return

        # Если у нас есть conversation_id, это подключение к конкретному чату
        # Получаем информацию о разговоре из базы данных
        conversation_info = await self.get_conversation_info(self.conversation_id)
        if not conversation_info:
            # Разговор не найден или пользователь не имеет доступа
            await self.close(code=4003)
            return
            
        # Используем канонический идентификатор группы из базы данных
        self.room_group_name = sanitize_group_name(f"chat_{conversation_info['conversation_id']}")
        self.db_conversation_id = conversation_info['id']

        # Присоединяемся к группе чата
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Сохраняем информацию о пользователе для дальнейшего использования
        self.user_id = self.scope["user"].id
        self.username = f"{self.scope['user'].first_name} {self.scope['user'].last_name}"
        
        # Принимаем соединение
        await self.accept()
        
        # Уведомляем клиента об успешном подключении
        await self.send(text_data=json.dumps({
            "type": "connection_established",
            "message": "Подключено к серверу чата"
        }))

        # Отмечаем сообщения как прочитанные при подключении пользователя к чату
        await self.mark_messages_as_read()

    async def disconnect(self, close_code):
        """
        Обрабатывает отключение от WebSocket.
        Выходит из группы чата.
        """
        # Выходим из группы, если она существует и правильно сформирована
        if hasattr(self, 'room_group_name') and self.room_group_name:
            try:
                # Убедимся, что имя группы валидно перед дисконнектом
                group_name = sanitize_group_name(self.room_group_name)
                await self.channel_layer.group_discard(
                    group_name,
                    self.channel_name
                )
                print(f"Пользователь {getattr(self, 'user_id', 'unknown')} отключился от группы {group_name}")
            except Exception as e:
                print(f"Ошибка при выходе из группы: {str(e)}")

    # Получаем сообщение от WebSocket
    async def receive(self, text_data):
        """
        Обрабатывает входящие сообщения от клиента.
        Поддерживает разные типы сообщений:
        - chat_message: обычное сообщение чата
        - mark_read: отметка о прочтении сообщений
        - heartbeat: проверка соединения
        """
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get("type", "chat_message")
            
            if message_type == "chat_message":
                message = text_data_json.get("message")
                if not message:
                    return
                
                # Сохраняем сообщение в базе данных
                saved_message = await self.save_message(message)
                
                # Отправляем сообщение в группу чата
                group_name = sanitize_group_name(self.room_group_name)
                await self.channel_layer.group_send(
                    group_name,
                    {
                        "type": "chat_message",
                        "message": message,
                        "sender_id": self.user_id,
                        "sender_name": self.username,
                        "message_id": saved_message["id"],
                        "conversation_id": self.db_conversation_id,  # Добавляем ID диалога
                        "created_at": saved_message["created_at"].isoformat()
                    }
                )
            
            elif message_type == "mark_read":
                # Отмечаем сообщения как прочитанные
                await self.mark_messages_as_read()
                
                # Уведомляем группу чата о прочтении сообщений
                group_name = sanitize_group_name(self.room_group_name)
                await self.channel_layer.group_send(
                    group_name,
                    {
                        "type": "messages_read",
                        "reader_id": self.user_id
                    }
                )
                
            elif message_type == "heartbeat":
                # Обрабатываем сообщение проверки соединения - просто отправляем простой ответ
                await self.send(text_data=json.dumps({
                    "type": "heartbeat_response",
                    "timestamp": timezone.now().isoformat()
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Неверный формат JSON"
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": str(e)
            }))

    # Получаем сообщение от группы чата
    async def chat_message(self, event):
        """
        Принимает сообщение от группы чата и отправляет его клиенту.
        """
        message = event["message"]
        sender_id = event["sender_id"]
        sender_name = event["sender_name"]
        message_id = event["message_id"]
        created_at = event["created_at"]
        conversation_id = event.get("conversation_id")
        
        # Отправляем сообщение в WebSocket
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "message": message,
            "sender_id": sender_id,
            "sender_name": sender_name,
            "message_id": message_id,
            "conversation_id": conversation_id,
            "created_at": created_at
        }))

    # Уведомляем о прочтении сообщений
    async def messages_read(self, event):
        """
        Принимает уведомление о прочтении сообщений и отправляет его клиенту.
        """
        reader_id = event["reader_id"]
        
        # Отправляем уведомление о прочтении в WebSocket
        await self.send(text_data=json.dumps({
            "type": "messages_read",
            "reader_id": reader_id
        }))

    # Обработчик уведомлений о новых диалогах
    async def new_conversation(self, event):
        """
        Отправляет уведомление о новом диалоге клиенту.
        Вызывается при создании нового диалога.
        """
        try:
            # Извлекаем данные из события
            conversation_id = event.get("conversation_id")
            other_user = event.get("other_user")
            job = event.get("job")
            
            # Логируем уведомление
            print(f"Отправка уведомления о новом диалоге пользователю {self.user_id}: conversation={conversation_id}")
            
            # Отправляем уведомление со всеми необходимыми данными клиенту
            await self.send(text_data=json.dumps({
                "type": "new_conversation",
                "conversation_id": conversation_id,
                "other_user": other_user,
                "job": job,
                "timestamp": timezone.now().isoformat()
            }))
            
            print(f"Успешно отправлено уведомление о новом диалоге пользователю {self.user_id}")
        except Exception as e:
            print(f"Ошибка в обработчике new_conversation для пользователя {self.user_id}: {str(e)}")
            # Пытаемся уведомить клиента об ошибке
            try:
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": f"Не удалось обработать уведомление о новом диалоге: {str(e)}"
                }))
            except Exception:
                # Если мы не можем даже отправить сообщение об ошибке, просто логируем
                print(f"Не удалось отправить уведомление об ошибке пользователю {self.user_id}")

    # Обработчик уведомлений о новых резюме
    async def new_application(self, event):
        """
        Отправляет уведомление о новом отклике с резюме клиенту.
        Вызывается при получении отклика на вакансию.
        """
        try:
            # Извлекаем данные из события
            message_data = event.get("message", {})
            
            # Логируем уведомление
            print(f"Отправка уведомления о новом отклике пользователю {self.user_id}")
            
            # Отправляем уведомление клиенту
            await self.send(text_data=json.dumps({
                "type": "new_application",
                "data": message_data,
                "timestamp": timezone.now().isoformat()
            }))
        except Exception as e:
            print(f"Ошибка при отправке уведомления о новом отклике: {str(e)}")
            # Отправляем сообщение об ошибке
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": f"Не удалось обработать уведомление о новом отклике: {str(e)}"
            }))

    @database_sync_to_async
    def get_conversation_info(self, conversation_id):
        """
        Получает информацию о диалоге из базы данных.
        Проверяет, имеет ли пользователь доступ к диалогу.
        """
        try:
            # Пытаемся найти диалог по ID
            if conversation_id.isdigit():
                # Если это числовой ID, ищем по первичному ключу
                conversation = Conversation.objects.filter(id=int(conversation_id)).first()
            else:
                # Иначе пытаемся найти по conversation_id
                parts = conversation_id.split('_')
                if len(parts) >= 3:
                    user_ids = [int(parts[0]), int(parts[1])]
                    job_id = None if parts[2] == 'none' else int(parts[2])
                    
                    # Ищем диалог с указанными участниками и вакансией
                    conversations = Conversation.objects.filter(participants__id__in=user_ids)
                    if job_id:
                        conversations = conversations.filter(job_id=job_id)
                    else:
                        conversations = conversations.filter(job__isnull=True)
                    
                    # Группируем по ID и выбираем диалоги, в которых участвуют оба пользователя
                    conversation_ids = conversations.values_list('id', flat=True)
                    for conv_id in conversation_ids:
                        conv = Conversation.objects.get(id=conv_id)
                        if conv.participants.filter(id__in=user_ids).count() == 2:
                            conversation = conv
                            break
                    else:
                        conversation = None
                else:
                    conversation = None
            
            # Проверяем, является ли текущий пользователь участником диалога
            if not conversation or self.scope["user"] not in conversation.participants.all():
                return None
                
            # Получаем conversation_id и возвращаем информацию, применяя санитизацию
            conv_id = str(conversation.conversation_id) if conversation.conversation_id else f"conv_{conversation.id}"
            
            return {
                'id': conversation.id,
                'conversation_id': sanitize_group_name(conv_id),  # Санитизируем ID для использования в WebSocket группах
                'participants': list(conversation.participants.values_list('id', flat=True)),
                'job_id': conversation.job_id if conversation.job else None
            }
        except Exception as e:
            print(f"Ошибка при получении информации о диалоге {conversation_id}: {str(e)}")
            return None

    @database_sync_to_async
    def save_message(self, message_text):
        """Сохраняет сообщение в базе данных и возвращает словарь с данными сообщения"""
        print(f"Сохранение сообщения: диалог_id={self.db_conversation_id}, отправитель={self.user_id}, сообщение={message_text[:20]}...")
        
        try:
            # Получаем диалог
            conversation = Conversation.objects.get(id=self.db_conversation_id)
            
            # Получаем получателя сообщения (другой участник диалога)
            recipient = conversation.participants.exclude(id=self.user_id).first()
            
            if not recipient:
                raise ValueError("Не удалось определить получателя сообщения")
                
            # Создаем сообщение
            message = ChatMessage.objects.create(
                conversation=conversation,
                sender_id=self.user_id,
                recipient=recipient,
                job=conversation.job,
                content=message_text
            )
            
            # Обновляем время последнего сообщения в диалоге
            conversation.last_message_time = message.created_at
            conversation.save(update_fields=['last_message_time', 'updated_at'])
            
            return {
                "id": message.id,
                "created_at": message.created_at
            }
        except Exception as e:
            print(f"Ошибка при сохранении сообщения: {str(e)}")
            raise

    @database_sync_to_async
    def mark_messages_as_read(self):
        """Отмечает все сообщения в текущем диалоге как прочитанные"""
        if not hasattr(self, 'db_conversation_id'):
            print("Невозможно отметить сообщения как прочитанные: отсутствует db_conversation_id")
            return 0
            
        try:
            # Отмечаем все непрочитанные сообщения как прочитанные
            count = ChatMessage.objects.filter(
                conversation_id=self.db_conversation_id,
                recipient_id=self.user_id,
                is_read=False
            ).update(is_read=True)
            
            print(f"Отмечено {count} сообщений как прочитанные для пользователя {self.user_id} в диалоге {self.db_conversation_id}")
            return count
        except Exception as e:
            print(f"Ошибка при отметке сообщений как прочитанные: {str(e)}")
            return 0 
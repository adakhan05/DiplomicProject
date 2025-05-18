from django.urls import path, re_path
from . import consumers

# Определяем маршруты для WebSocket
websocket_urlpatterns = [
    # Маршрут для чата с указанным conversation_id
    re_path(r'ws/chat/(?P<conversation_id>[^/]+)/$', consumers.ChatConsumer.as_asgi()),
    
    # Дополнительный маршрут для чата без указанного conversation_id
    path('ws/chat/', consumers.ChatConsumer.as_asgi()),
] 
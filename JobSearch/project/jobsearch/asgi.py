import os

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jobsearch.settings')

# Инициализируем Django ASGI приложение заранее, чтобы убедиться, что AppRegistry
# заполнен перед импортом кода, который может импортировать ORM модели.
django_asgi_app = get_asgi_application()

# Импортируем шаблоны URL для WebSocket
from jobs.routing import websocket_urlpatterns
from jobs.middleware import TokenAuthMiddlewareStack

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        TokenAuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
}) 
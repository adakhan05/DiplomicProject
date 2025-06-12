from urllib.parse import parse_qs
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()

class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_params = parse_qs(scope.get('query_string', b'').decode())
        
        token = query_params.get('token', [None])[0]
        
        scope['user'] = AnonymousUser()
        
        if token:
            try:
                access_token = AccessToken(token)
                
                user_id = access_token.get('user_id')
                
                if user_id:
                    scope['user'] = await get_user(user_id)
                    
            except (InvalidToken, TokenError) as e:
                print(f"Недействительный токен: {e}")
        
        return await super().__call__(scope, receive, send)

def TokenAuthMiddlewareStack(inner):
    return TokenAuthMiddleware(inner) 
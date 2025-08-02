from functools import wraps
from django.shortcuts import redirect
from .models import AppUser  # Replace with your actual user model path

def mongo_login_required(login_url='/signin/'):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            user_id = request.COOKIES.get('user_id')
            if not user_id:
                return redirect(login_url)
            user = AppUser.objects(id=user_id).first()
            if not user:
                return redirect(login_url)
            request.user = user
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator

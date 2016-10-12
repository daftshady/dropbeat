from dropbeat.models import User

from django.contrib.auth import SESSION_KEY
from django.core.exceptions import ObjectDoesNotExist


def auth_required(f):
    def wrap(self, request, *args, **kwargs):
        if SESSION_KEY not in request.session:
            # Malformed session detected.
            return self.on_unauthorized()

        try:
            request.user = User.objects.get(email=request.session['email'])
            return f(self, request, *args, **kwargs)
        except ObjectDoesNotExist:
            return self.on_unauthorized()
    return wrap


class AuthBackend(object):
    def authenticate(self, email=None, password=None):
        try:
            user = User.objects.get(email=email)
        except ObjectDoesNotExist:
            return None

        return user if user.check_password(password) else None

    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except ObjectDoesNotExist:
            return None

from dropbeat.auth import auth_required
from dropbeat.constants import ErrorCode
from dropbeat.exceptions import UserException
from dropbeat.models import User, Track, Playlist
from toolkit.resource import Resource, parameters

from django.db import IntegrityError
from django.contrib.auth import login, logout, authenticate


class DropbeatResource(Resource):
    def handle_get(self, request, *args, **kwargs):
        return self.on_error('You cannot access to this path directly')


class HealthCheckResource(DropbeatResource):
    """Checks whether this host is alive or not.

    """
    def handle_get(self, request, *args, **kwargs):
        # TODO: select 1
        return self.on_success()


class UserResource(DropbeatResource):
    def prepare_urls(self):
        self.add_path('signin')
        self.add_path('signout')

    @auth_required
    def handle_get(self, request, *args, **kwargs):
        return self.on_success(data={'user': request.user.to_dict()})

    @parameters(['email', 'password'])
    def handle_post(self, request, *args, **kwargs):
        try:
            User.objects.create_user(
                request.p['email'], request.p['password'])
        except IntegrityError:
            return self.on_error(error=ErrorCode.DUPLICATED_EMAIL)
        except UserException as e:
            return self.on_error(error=e.args[0])

        auth_user = authenticate(
            email=request.p['email'], password=request.p['password'])

        login(request, auth_user)
        request.session['email'] = request.p['email']

        return self.on_success(data={'user': auth_user.to_dict()})

    @parameters(['email', 'password'])
    def handle_post_signin(self, request, *args, **kwargs):
        if not User.objects.filter(email=request.p['email']).exists():
            return self.on_error(error=ErrorCode.EMAIL_NOT_EXIST)

        auth_user = authenticate(
            email=request.p['email'], password=request.p['password'])
        if auth_user is None:
            return self.on_error(error=ErrorCode.PASSWORD_MISMATCH)

        login(request, auth_user)
        request.session['email'] = request.p['email']

        return self.on_success(data={'user': auth_user.to_dict()})

    @auth_required
    def handle_post_signout(self, request, *args, **kwargs):
        logout(request)
        return self.on_success()


class PlaylistResource(DropbeatResource):
    @auth_required
    def handle_get(self, request, *args, **kwargs):
        pass

    @auth_required
    def handle_post(self, request, *args, **kwargs):
        pass

    @auth_required
    def handle_put(self, request, *args, **kwargs):
        pass

    @auth_required
    def handle_delete(self, request, *args, **kwargs):
        pass


class TrackResource(DropbeatResource):
    @auth_required
    def handle_post(self, request, *args, **kwargs):
        pass

    @auth_required
    def handle_delete(self, request, *args, **kwargs):
        pass


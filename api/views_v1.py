from dropbeat.auth import auth_required
from dropbeat.constants import ErrorCode
from dropbeat.exceptions import (
    UserException, TrackException, PlaylistException, DropbeatException)
from dropbeat.models import User, Track, Playlist
from dropbeat.youtube import youtube_search, Youtube
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
    def prepare_urls(self):
        self.add_path('list')

    @auth_required
    @parameters(['uid'])
    def handle_get(self, request, *args, **kwargs):
        """Retrieve data of a single playlist.

        """
        try:
            playlist = Playlist.objects. \
                fetch_playlist(request.user, request.p['uid'])
        except PlaylistException as e:
            return self.on_error(error=e.args[0])

        # One more query.
        tracks = [x.to_dict() for x in playlist.tracks.all()]

        playlist = playlist.to_dict()
        playlist['tracks'] = tracks
        return self.on_success(data={'playlist': playlist})

    @auth_required
    def handle_get_list(self, request, *args, **kwargs):
        return self.on_success(data={
            'list': Playlist.objects.fetch_all_uids(request.user)})

    @auth_required
    @parameters(['name'])
    def handle_post(self, request, *args, **kwargs):
        """Create a playlist.

        """
        try:
            playlist = Playlist.objects. \
                create_playlist(request.user, request.p['name'])
        except PlaylistException as e:
            return self.on_error(error=e.args[0])

        return self.on_success(data={'playlist': playlist.to_dict()})

    @auth_required
    @parameters(['uid', 'name'])
    def handle_put(self, request, *args, **kwargs):
        """Change a name of the playlist.

        """
        try:
            Playlist.objects.change_playlist_name(
                request.user, request.p['uid'], request.p['name'])
        except PlaylistException as e:
            return self.on_bad_request(e.args[0])

        return self.on_success()

    @auth_required
    @parameters(['uid'])
    def handle_delete(self, request, *args, **kwargs):
        """Delete a playlist.

        """
        try:
            Playlist.objects.remove_playlist(request.user, request.p['uid'])
        except PlaylistException as e:
            return self.on_bad_request(e.args[0])

        return self.on_success()


class TrackResource(DropbeatResource):
    @auth_required
    @parameters(['uid', 'name', 'playlist_uid'])
    def handle_post(self, request, *args, **kwargs):
        """Add track to playlist.

        """
        try:
            playlist = Playlist.objects. \
                fetch_playlist(request.user, request.p['playlist_uid'])
            track = Track.objects.create_track(
                request.p['name'], request.p['uid'], playlist)
        except DropbeatException as e:
            return self.on_error(error=e.args[0])

        return self.on_success(data={'track': track.to_dict()})

    @auth_required
    @parameters(['uid', 'playlist_uid'])
    def handle_delete(self, request, *args, **kwargs):
        """Remove track from playlist.

        """
        try:
            playlist = Playlist.objects. \
                fetch_playlist(request.user, request.p['playlist_uid'])
            Track.objects.remove_track(request.p['uid'], playlist)
        except DropbeatException as e:
            return self.on_error(error=e.args[0])

        return self.on_success()


class SearchResource(DropbeatResource):
    def prepare_urls(self):
        self.add_path('async')

    @parameters(['q'])
    def handle_get(self, request, *args, **kwargs):
        """This method blocks working thread while doing HTTP i/o
        XXX: Do not use this api in production env.

        """
        data = Youtube.search_from_html(request.p['q'])
        return self.on_success(data={'data': data})

    @parameters(['q'])
    def handle_post_async(self, request, *args, **kwargs):
        """Register async task.

        """
        task = youtube_search.delay(request.p['q'])
        return self.on_success(data={'data': str(task)})

    @parameters(['key'])
    def handle_get_async(self, request, *args, **kwargs):
        """Polls result of async task with provided key.

        """
        result = youtube_search.AsyncResult(request.p['key'])
        if result.ready():
            return self.on_success(data={'data': result.get()})
        else:
            return self.on_error(error=ErrorCode.RESULT_NOT_READY)

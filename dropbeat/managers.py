import hashlib
import datetime

from dropbeat.exceptions import (
    UserException, TrackException, PlaylistException)
from dropbeat.constants import ErrorCode, TrackSource

from django.db import models
from django.core.validators import validate_email
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.contrib.auth.models import BaseUserManager


class UserManager(BaseUserManager):
    def create_user(self, email, password):
        # 1. Validate email address.
        try:
            validate_email(email)
        except ValidationError:
            raise UserException(ErrorCode.INVALID_EMAIL)

        # 2. Validate password format.
        min_password_len = 8
        if len(password) < min_password_len:
            raise UserException(ErrorCode.PASSWORD_TOO_SHORT)

        try:
            user = self.model(email=email)
            user.set_password(password)
            user.save(using=self._db)
        except IntegrityError:
            raise UserException(ErrorCode.DUPLICATED_EMAIL)

        return user


class PlaylistManager(models.Manager):
    def fetch_all_uids(self, user):
        """Returns list of playlist uids.

        """
        return [x.uid for x in self.filter(user=user)]

    def fetch_playlist(self, user, uid):
        """This method only wraps django exception to ours.

        """
        try:
            return self.get(user=user, uid=uid)
        except ObjectDoesNotExist:
            raise PlaylistException(ErrorCode.PLAYLIST_NOT_EXIST)

    def create_playlist(self, user, name):
        # Hash email + current server time.
        if self.filter(user=user, name=name).exists():
            raise PlaylistException(ErrorCode.DUPLICATED_PLAYLIST_NAME)

        uid = hashlib.md5(
            user.email + str(datetime.datetime.now())).hexdigest()
        return self.create(user=user, name=name, uid=uid)

    def remove_playlist(self, user, uid):
        try:
            playlist = self.get(user=user, uid=uid)
            playlist.delete()
        except ObjectDoesNotExist:
            raise PlaylistException(ErrorCode.PLAYLIST_NOT_EXIST)

    def change_playlist_name(self, user, uid, name):
        try:
            # TODO: Check length of the new name.
            playlist = self.get(user=user, uid=uid)
            playlist.name = name
            playlist.save()
        except ObjectDoesNotExist:
            raise PlaylistException(ErrorCode.PLAYLIST_NOT_EXIST)


class TrackManager(models.Manager):
    def create_track(self, name, uid, playlist):
        if self.filter(uid=uid, playlist=playlist).exists():
            raise TrackException(ErrorCode.TRACK_ALREADY_EXIST)

        youtube_uid_len = 11
        source = TrackSource.youtube \
            if len(uid) == youtube_uid_len else TrackSource.soundcloud
        return self.create(
            name=name, uid=uid, source=source.value, playlist=playlist)

    def remove_track(self, uid, playlist):
        try:
            track = self.get(uid=uid, playlist=playlist)
            track.delete()
        except ObjectDoesNotExist:
            raise TrackException(ErrorCode.TRACK_NOT_EXIST)


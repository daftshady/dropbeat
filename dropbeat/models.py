"""Dropbeat database models.
@model: User
    Dropbeat users
@model: Playlist
    User created playlist.
@model: Track
    Track which belongs to specific playlist.

"""

import datetime

from dropbeat.constants import TrackSource
from dropbeat.managers import UserManager, PlaylistManager, TrackManager

from django.db import models
from django.contrib.auth.models import AbstractBaseUser


class SerializeMixins(object):
    def to_dict(self):
        """Parse model object to dict.
        Django models are hard to be serialized to string without such method.

        """
        try:
            fields = self._serializable
        except AttributeError:
            # If serializable fields are not defined, retrieve all table fields
            fields = [f.name for f in self._meta.get_fields()]

        dict_ = {}
        for field in fields:
            try:
                value = self.__getattribute__(field)
            except AttributeError:
                continue

            if isinstance(value, unicode):
                dict_[field] = value.encode('utf8')
            elif isinstance(value, datetime.datetime):
                # TODO: format date
                dict_[field] = str(value)
            elif isinstance(value, (int, long, float, complex)) \
                    or isinstance(value, str) or isinstance(value, bool):
                dict_[field] = value
            elif isinstance(value, models.Model):
                # NOTE that only prefetched child model *must* be serialized
                # here so that this method doesn't make any further queries.
                raise NotImplementedError
            elif value is None:
                dict_[field] = None

        return dict_


class User(AbstractBaseUser, SerializeMixins):
    USERNAME_FIELD = 'email'

    class Meta:
        db_table = 'user'

    objects = UserManager()

    # Email is an unique user identifier
    email = models.CharField(max_length=128, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    _serializable = ['email', 'created_at']

    def __repr__(self):
        return '<User %s:%s>' % (self.id, self.email)


class Playlist(models.Model, SerializeMixins):
    class Meta:
        db_table = 'playlist'

    objects = PlaylistManager()
    name = models.CharField(max_length=128, null=False)
    user = models.ForeignKey(
        'User', null=False, related_name='playlists')
    data = models.TextField(null=False, default='[]')
    created_at = models.DateTimeField(auto_now_add=True)

    def __repr__(self):
        return '<Playlist %s:%s>' % (self.id, self.name)


class Track(models.Model, SerializeMixins):
    """Track belongs to specific playlist.

    """
    class Meta:
        db_table = 'track'

    objects = TrackManager()

    # Track name from streaming sources.
    # This track is a string field which is not synchronized with there
    name = models.CharField(max_length=128, null=False)
    # Unique id which is used to identify track in each service
    uid = models.CharField(max_length=64, null=False)
    # Streaming sources
    source = models.CharField(max_length=16, choices=TrackSource.choices())
    # Date when this track is added to playlist
    created_at = models.DateTimeField(auto_now_add=True)
    playlist = models.ForeignKey(
        'Playlist', null=False, related_name='tracks')

    def __repr__(self):
        return '<Track %s:%s>' % (self.id, self.name)


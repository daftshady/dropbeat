from dropbeat.exceptions import UserException
from dropbeat.constants import ErrorCode

from django.db import models
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
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

        user = self.model(email=email)
        user.set_password(password)
        user.save(using=self._db)
        return user


class PlaylistManager(models.Manager):
    pass


class TrackManager(models.Manager):
    pass

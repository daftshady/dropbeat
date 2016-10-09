"""Class for redis session storage.

"""
import redis
from redis.sentinel import Sentinel
from redis.exceptions import ConnectionError
from django.conf import settings
from django.utils.encoding import force_unicode
from django.contrib.sessions.backends.base import SessionBase


# Settings
SESSION_REDIS_HOST = getattr(
    settings, 'SESSION_REDIS_HOST', 'localhost')
SESSION_REDIS_PORT = getattr(
    settings, 'SESSION_REDIS_PORT', 6379)
SESSION_REDIS_DB = getattr(
    settings, 'SESSION_REDIS_DB', 0)
SESSION_REDIS_PREFIX = getattr(
    settings, 'SESSION_REDIS_PREFIX', '')
SESSION_REDIS_PASSWORD = getattr(
    settings, 'SESSION_REDIS_PASSWORD', None)
SESSION_REDIS_UNIX_DOMAIN_SOCKET_PATH = getattr(
    settings, 'SESSION_REDIS_UNIX_DOMAIN_SOCKET_PATH', None)
SESSION_REDIS_URL = getattr(
    settings, 'SESSION_REDIS_URL', None)
SESSION_REDIS_SENTINEL_LIST = getattr(
    settings, 'SESSION_REDIS_SENTINEL_LIST', None)
SESSION_REDIS_SENTINEL_MASTER_ALIAS = getattr(
    settings, 'SESSION_REDIS_SENTINEL_MASTER_ALIAS', None)


if SESSION_REDIS_SENTINEL_LIST is not None:
    sentinel = \
        Sentinel(SESSION_REDIS_SENTINEL_LIST, socket_timeout=0.1)
    redis_server = \
        sentinel.master_for(
            SESSION_REDIS_SENTINEL_MASTER_ALIAS, socket_timeout=0.1)
elif SESSION_REDIS_URL is not None:
    redis_server = redis.StrictRedis.from_url(SESSION_REDIS_URL)
elif SESSION_REDIS_UNIX_DOMAIN_SOCKET_PATH is None:
    redis_server = redis.StrictRedis(
        host=SESSION_REDIS_HOST,
        port=SESSION_REDIS_PORT,
        db=SESSION_REDIS_DB,
        password=SESSION_REDIS_PASSWORD
    )
else:
    redis_server = redis.StrictRedis(
        unix_socket_path=SESSION_REDIS_UNIX_DOMAIN_SOCKET_PATH,
        db=SESSION_REDIS_DB,
        password=SESSION_REDIS_PASSWORD,
    )

try:
    if not redis_server.ping():
        raise ConnectionError
except ConnectionError:
    # TODO: Cannot access redis host.
    # Should prepare backoff session storage or Fix wrong configuration.
    pass


def create_short_session(user_id, email):
    """This method is used to create session apart from `request`.
    NOTE that this session has empty device_id.

    """
    session = SessionStore()
    session.create(short=True)
    session['email'] = email
    session['_auth_user_backend'] = 'app.auth.AuthBackend'
    session['_auth_user_id'] = user_id
    session.save()
    return session.session_key


class SessionStore(SessionBase):
    """Implements Redis database session store.

    """
    def __init__(self, session_key=None):
        super(SessionStore, self).__init__(session_key=session_key)
        self.server = redis_server

    def load(self):
        try:
            session_data = self.server.get(
                self.get_real_stored_key(self._get_or_create_session_key())
            )
            return self.decode(force_unicode(session_data))
        except:
            self.create()
            return {}

    def exists(self, session_key):
        return self.server.exists(self.get_real_stored_key(session_key))

    def create(self, short=False):
        # XXX: Is there a possibility for infinite loop?
        while True:
            self._session_key = self._get_new_session_key()

            success = self.save(must_create=True, short=short)
            if not success:
                continue
            self.modified = True
            return

    def save(self, must_create=False, short=False):
        if must_create and self.exists(self._get_or_create_session_key()):
            return False

        data = self.encode(self._get_session(no_load=must_create))
        # Make 1 year session in default.
        expire = 31536000 if not short else 600

        if redis.VERSION[0] >= 2:
            self.server.setex(
                self.get_real_stored_key(self._get_or_create_session_key()),
                expire,
                data
            )
        else:
            self.server.set(
                self.get_real_stored_key(self._get_or_create_session_key()),
                data
            )
            self.server.expire(
                self.get_real_stored_key(self._get_or_create_session_key()),
                expire
            )
        return True

    def delete(self, session_key=None):
        if session_key is None:
            if self.session_key is None:
                return
            session_key = self.session_key
        try:
            self.server.delete(self.get_real_stored_key(session_key))
        except:
            pass

    def get_real_stored_key(self, session_key):
        """Return the real key name in redis storage
        @return string
        """
        prefix = settings.SESSION_REDIS_PREFIX
        if not prefix:
            return session_key
        return ':'.join([prefix, session_key])

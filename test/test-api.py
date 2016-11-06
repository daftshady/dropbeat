"""Temporal integration test for dropbeat.
While admitting that globals are usually suck, it will not be a problem since
this code only runs in a single thread.

"""
import sys
import inspect
import datetime
import hashlib
import traceback

import requests


global_session = requests.Session()


class DotDict(dict):
    """Provides dot(.) accessor to `dict`.
    NOTE that this doesn't work properly in case of nested dict.

    """
    __getattr__ = dict.get
    __setattr__ = dict.__setitem__
    __delattr__ = dict.__delitem__


global_context = DotDict()
global_context.email = hashlib.md5(
    str(datetime.datetime.now())).hexdigest()[:8] + '@dropbeat.net'
global_context.password = '1' * 8
global_context.playlist_uid = None


class Router(object):
    """Api url router

    """
    def __init__(self):
        self._base = 'http://web:8000/api/'
        self._version = 'v1'
        self._url = lambda x: self._base + self._version  + '/' + x

    @property
    def user(self):
        return self._url('user')

    @property
    def user_signin(self):
        return self.user + '/signin'

    @property
    def playlist(self):
        return self._url('playlist')

    @property
    def playlist_all(self):
        return self.playlist + '/all'

    @property
    def track(self):
        return self._url('track')


global_router = Router()


class TestSuite(object):
    pass


class DropbeatTest(TestSuite):
    """This can be added to `TestRunner`.

    """
    @staticmethod
    def test_user_signup():
        resp = global_session.post(
            global_router.user,
            json={
                'email': global_context.email,
                'password': global_context.password
            }
        )
        assert resp.ok
        assert resp.json()['success']

    @staticmethod
    def test_user_signin():
        resp = global_session.post(
            global_router.user_signin,
            json={
                'email': global_context.email,
                'password': global_context.password
            }
        )
        assert resp.ok
        assert resp.json()['success']

    @staticmethod
    def test_user_get_self():
        resp = global_session.get(
            global_router.user
        )
        assert resp.ok
        assert resp.json()['user']['email'] == global_context.email

    @staticmethod
    def test_playlist_create():
        resp = global_session.post(
            global_router.playlist,
            json={'name': 'my-playlist'}
        )
        assert resp.ok
        assert resp.json()['playlist']['name'] == 'my-playlist'

        global_context.playlist_uid = resp.json()['playlist']['uid']

    @staticmethod
    def test_playlist_all():
        resp = global_session.get(
            global_router.playlist_all
        )
        assert resp.ok
        assert len(resp.json()['data']) == 1
        assert resp.json()['data'][0]['name'] == 'my-playlist'

    @staticmethod
    def test_playlist_rename():
        resp = global_session.put(
            global_router.playlist,
            json={'uid': global_context.playlist_uid, 'name': 'foobar'}
        )
        assert resp.ok
        assert resp.json()['success']

    @staticmethod
    def test_track_add():
        resp = global_session.post(
            global_router.track,
            json={
                'playlist_uid': global_context.playlist_uid,
                'name': 'hello',
                'uid': '1' * 11
            }
        )
        assert resp.ok
        assert resp.json()['success']

    @staticmethod
    def test_playlist_fetch():
        resp = global_session.get(
            global_router.playlist,
            params={
                'uid': global_context.playlist_uid
            }
        )
        assert resp.ok
        playlist = resp.json()['playlist']
        # Because we changed its name
        assert playlist['name'] == 'foobar'
        # One track should exist
        assert len(playlist['tracks']) == 1


    @staticmethod
    def test_track_remove():
        resp = global_session.delete(
            global_router.track,
            json={
                'playlist_uid': global_context.playlist_uid,
                'uid': '1' * 11
            }
        )
        assert resp.ok
        assert resp.json()['success']

    @staticmethod
    def test_playlist_remove():
        resp = global_session.delete(
            global_router.playlist,
            json={'uid': global_context.playlist_uid}
        )
        assert resp.ok
        assert resp.json()['success']


class TestRunner(object):
    """Base test runner for dropbeat.

    """
    def __init__(self, tests=None):
        self._testcases = tests or []
        self._success = 0
        self._failure = 0
        self._error = 0

    def add_testsuite(self, testsuite):
        """Parse testsuite to control the order of execution.
        Order matters here because testcases in `DropbeatTest` are not
        unittest which should be independent from order of execution.

        """
        # These methods are sorted in alphabetical order by default.
        methods = [x[0] for x in
            inspect.getmembers(testsuite) if x[0].startswith('test')]

        # Sort methods by the order of difinition in source code.
        source_code = inspect.getsource(testsuite)
        def _compare(a, b):
            prefix = 'def '
            pos_a, pos_b = \
                source_code.find(prefix + a), source_code.find(prefix + b)
            if pos_a < pos_b:
                return -1
            elif pos_a > pos_b:
                return 1
            else:
                return 0

        ordered_methods = sorted(methods, cmp=_compare)
        self._testcases.extend([getattr(testsuite, x) for x in ordered_methods])

    def run(self):
        print 'Start running tests'
        print

        bar = '-' * (1 << 5)
        for test in self._testcases:
            try:
                test()
                self._success += 1
            except AssertionError as e:
                _, _, tb = sys.exc_info()
                tb_info = traceback.extract_tb(tb)
                _, err_line, test_name, err_msg = tb_info[-1]
                print test_name
                print 'line %s, AssertionError: %s' % (err_line, err_msg)
                print bar
                self._failure += 1
            except Exception:
                self._error += 1
                traceback.print_exc()

        print
        print 'Success: %s' % self._success
        print 'Failure: %s' % self._failure
        print 'Error: %s' % self._error


if __name__ == '__main__':
    test = TestRunner()
    test.add_testsuite(DropbeatTest)
    test.run()

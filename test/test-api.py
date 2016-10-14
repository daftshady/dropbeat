"""Temporal integration test for dropbeat.
As `unittest` module is not designed for integration test, there are some
hacks such as passing context with global variables.
While admitting that globals are usually suck, it will not be a problem since
this code only runs in single thread.

"""

import Cookie
import unittest
import requests


class ReverseLoader(unittest.loader.TestLoader):
    def getTestCaseNames(self, testCaseClass):
        """Python default unittest executes tests in alphabetical order by
        default.
        Though official document says that setting `sortTestMethodsUsing`
        to `None` can disable sorting, it sorts methods in reverse order.
        As it's totally unexpected behavior, this method reverses it again.

        """
        def isTestMethod(
                attrname, testCaseClass=testCaseClass,
                prefix=self.testMethodPrefix):
            return attrname.startswith(prefix) and \
                hasattr(getattr(testCaseClass, attrname), '__call__')
        testFnNames = filter(isTestMethod, dir(testCaseClass))
        return sorted(testFnNames, reverse=True)


class Context(object):
    session = None


class DropbeatApiTest(unittest.TestCase):
    """Basic api test.

    """
    def setUp(self):
        self._base = 'http://web:8000/api/'
        self._version = 'v1'
        url = lambda x: self._base + self._version + x
        self._urls = {
            'signup': url('/user'),
            'signin': url('/user/signin'),
            'self': url('/user')
        }

    def test_signup(self):
        resp = requests.post(
            self._urls['signup'],
            json={'email': 'foo@bar.com', 'password': 'coroutine'}
        )
        self.assertTrue(resp.ok)
        self.assertEqual(resp.json()['success'], True)

    def test_signin(self):
        resp = requests.post(
            self._urls['signin'],
            json={'email': 'foo@bar.com', 'password': 'coroutine'}
        )
        self.assertTrue(resp.ok)
        self.assertEqual(resp.json()['success'], True)
        Context.session = Cookie.SimpleCookie(
            resp.headers['set-cookie'])['sessionid'].OutputString()

    def test_get_self(self):
        resp = requests.get(
            self._urls['self'],
            headers={'Cookie': Context.session}
        )
        self.assertTrue(resp.ok)
        self.assertEqual(resp.json()['user']['email'], 'foo@bar.com')


if __name__ == '__main__':
    unittest.main(testLoader=ReverseLoader())

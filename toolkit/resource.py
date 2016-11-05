"""Wrapper for dropbeat non-restful HTTP resources.

"""
import re
import sys
import json
import traceback
import collections

from django.conf.urls import url
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import (
    ObjectDoesNotExist, MultipleObjectsReturned, ValidationError
)
from django.http import (
    HttpResponse, HttpResponseNotFound, Http404, HttpResponseServerError,
    HttpResponseNotAllowed, HttpResponseRedirect
)


def parameters(list_, force=True):
    def wrap(f):
        def inner_wrap(self, request, *args, **kwargs):
            try:
                if force:
                    request.p = self._get_params(request, validate=list_)
                else:
                    request.p = self._get_params(request)
            except Exception as e:
                traceback.print_exc()
                return self.on_bad_request(e.args[0])
            return f(self, request, *args, **kwargs)
        return inner_wrap
    return wrap


class ResourceError(Exception):
    pass


class PathError(ResourceError):
    pass


class Resource(object):
    """Base resource class.
    Provides easy and straightforward interface to route paths.
    NOTE that all resources that inherits from this class must be named as
    `(resource_name)Resource`.

    """
    def __init__(self, api_name=None):
        self._api_name = api_name
        self._prepared = []

    @property
    def name(self):
        resource_name = type(self).__name__.lower()
        if 'resource' in resource_name:
            key = 'resource'
        elif 'handler' in resource_name:
            key = 'handler'

        return resource_name[:resource_name.find(key)]

    @property
    def urls(self):
        self.prepare_urls()
        urls = self._prepared[:]
        urls += self._base_urls()
        return urls

    def prepare_urls(self):
        """Override it to hook `urls` method.
        Call `add_path` here.

        """
        pass

    def add_path(self, path, matcher=None):
        """Custom resource returns 'url' object with appropriate
        url configuration and wrap

        """
        matcher = path if matcher is None else matcher
        api_name = 'api_%s_%s' % (self.name, path)

        self._prepared.append(url(
            r'^(?P<resource_name>%s)/%s$' % (self.name, matcher),
            self.wrap_dispatcher(),
            name=api_name
        ))

    def _base_urls(self):
        """The standard URLs this `Resource` should respond to.

        """
        alias = 'api_%s' % self.name
        return [
            url(r'^(?P<resource_name>%s)$' % (self.name),
                self.wrap_dispatcher(),
                name=alias
            ),
        ]

    def wrap_dispatcher(self):
        @csrf_exempt
        def wrapper(request, *args, **kwargs):
            # TODO: Handle exception in production level by checking debug flag.
            # TODO: Check content-type as we only want json request.
            try:
                handler = getattr(self, self._find_dispatcher(request))

                try:
                    response = handler(request, *args, **kwargs)
                except Exception as e:
                    traceback.print_exc()
                    raise ResourceError(e.args[0])
                return response
            except AttributeError as e:
                return self.on_not_allowed()
            except PathError as e:
                return self.on_not_found(e.args[0])
            except ResourceError as e:
                return self.on_server_error(e.args[0])
            except Exception as e:
                traceback.print_exc()
                return self.on_server_error(e.args[0])

        return wrapper

    def _find_dispatcher(self, request):
        """Find dispacher method.
        `/api/v1/user/` -> handle_get
        `/api/v1/user/signin/` -> handle_get_signin

        """
        m = re.search(r'\/v[0-9]*\/', request.path)
        if m is None:
            # Api does not have a name. (no versioning)
            full_name = request.path[request.path.find('/', 1) + 1:-1]
        else:
            full_name = request.path[m.end():]

        # XXX: Assume that trailing slash is not attached to request path.
        dispatcher_prefix = 'handle_' + request.method.lower()
        paths = full_name.split('/')
        if not paths or paths[0] != self.name:
            raise PathError('404')
        if len(paths) == 1:
            return dispatcher_prefix
        elif len(paths) > 1:
            return dispatcher_prefix + '_' + '_'.join(paths[1:])

    def _get_params(self, request, encode=True, validate=None):
        params = {}
        if request.method == 'GET':
            # Use only the first value of the param.
            for k, v in dict(request.GET).items():
                params[k] = v[0]
        else:
            if request.POST:
                params = request.POST
            else:
                try:
                    params = json.loads(request.body)
                except ValueError:
                    raise ResourceError('Invalid request body')

            def convert(data):
                if isinstance(data, basestring):
                    return data.encode('utf8')
                elif isinstance(data, collections.Mapping):
                    return dict(map(convert, data.iteritems()))
                elif isinstance(data, collections.Iterable):
                    return type(data)(map(convert, data))
                else:
                    return data

            if encode:
                params = convert(params)

        if validate is not None:
            for i in validate:
                if i not in params.keys():
                    raise ResourceError('Parameter validation failed: %s' % i)
        return params

    def on_success(self, data=None):
        resp = {'success': True}
        if data is not None:
            resp.update(data)
        return self.json_response(resp)

    def on_error(self, error=None):
        return self.json_response({
            'success': False, 'error': error
        })

    def on_created(self, obj, json_resp=True):
        if json_resp:
            resp = {'success': True}
            resp.update(obj)
            return self.json_response(resp, status=201)
        else:
            raise NotImplementedError

    def on_not_allowed(self):
        return HttpResponseNotAllowed('Method not allowed')

    def on_unauthorized(self, msg=None):
        return HttpResponse(msg or 'Authentication required', status=401)

    def on_not_found(self, msg):
        return HttpResponseNotFound(msg)

    def on_server_error(self, msg):
        return HttpResponseServerError(msg)

    def on_bad_request(self, msg):
        return self.json_response({
            'success': False, 'error': msg
        }, status=400)

    def on_redirect(self, url):
        return HttpResponseRedirect(url)

    def response(self, msg):
        return HttpResponse(msg)

    def json_response(self, data, status=200):
        """Render json response.
        @param data: Should be `dict` of response data.

        """
        return HttpResponse(
            json.dumps(data), status=status, content_type='application/json')

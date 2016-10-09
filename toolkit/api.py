"""Class for dropbeat app api custom extensions

"""
from django.conf import settings
from django.conf.urls import url, include
from django.core.exceptions import ImproperlyConfigured
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseBadRequest


class ApiError(Exception):
    pass


class Api(object):
    """Implements a registry which ties together the various resources making
    up an API.
    Optionally supplying `api_name` allows you to name the API.
    Usually, version numbers are used as the name. (i.e. `v1`, `v2`, etc.)

    """
    def __init__(self, api_name=None):
        self.api_name = api_name
        self._registry = {}
        self._additional_urls = []

    def register(self, resource):
        """Registers an instance of a `Resource` subclass with the API.

        """
        resource_name = getattr(resource, 'name', None)

        if resource_name is None:
            raise ImproperlyConfigured(
                "Resource %r must define a 'resource_name'." % resource)

        self._registry[resource_name] = resource

        return self

    def unregister(self, resource_name):
        """If present, unregisters a resource from the API.

        """
        if resource_name in self._registry:
            del(self._registry[resource_name])

    def wrap_dispatcher(self, view):
        def wrapper(request, *args, **kwargs):
            try:
                return getattr(self, view)(request, *args, **kwargs)
            except Exception as e:
                return HttpResponseBadRequest(e)
        return wrapper

    def prepare_urls(self):
        """A hook for adding your own URLs or matching before the default URLs.

        """
        return []

    def top_level(self, request, api_name=None):
        return HttpResponse('You are looking under the hood')

    @property
    def urls(self):
        """Provides URLconf details for the `Api` and all registered
        `Resources` beneath it.

        """
        if self.api_name is not None:
            pattern_list = [
                url(r"^(?P<api_name>%s)$" % (self.api_name),
                    self.wrap_dispatcher('top_level'),
                    name="api_%s_top_level" % self.api_name),
            ]

            for name in sorted(self._registry.keys()):
                self._registry[name].api_name = self.api_name
                pattern_list.append(
                    url(r"^(?P<api_name>%s)/" % self.api_name,
                        include(self._registry[name].urls)))
        else:
            pattern_list = [
                url(r'^$', self.wrap_dispatcher('top_level'))
            ]
            for name in sorted(self._registry.keys()):
                pattern_list.append(
                    url(r'', include(self._registry[name].urls)))


        urlpatterns = self.prepare_urls()
        urlpatterns += pattern_list
        return urlpatterns

    def _build_reverse_url(self, name, args=None, kwargs=None):
        """A convenience hook for overriding how URLs are built.

        """
        return reverse(name, args=args, kwargs=kwargs)

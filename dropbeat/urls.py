from dropbeat.urls_api_v1 import api_v1
from django.conf import settings
from django.conf.urls import url, include
from django.views.generic.base import RedirectView

urlpatterns = [
    url(r'^api/', include(api_v1.urls)),
    # Redirect for debug mode.
    url(r'^/?', RedirectView.as_view(url=settings.ROOT_HTML))
]

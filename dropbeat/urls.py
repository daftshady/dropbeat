from dropbeat.urls_api_v1 import api_v1
from django.conf.urls import url, include

urlpatterns = [
    url(r'^api/', include(api_v1.urls))
]

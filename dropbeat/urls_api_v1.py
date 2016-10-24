from api.views_v1 import (
    HealthCheckResource, UserResource, PlaylistResource, TrackResource,
    SearchResource)
from toolkit.api import Api

api_v1 = Api(api_name='v1')
api_v1 \
    .register(HealthCheckResource()) \
    .register(UserResource()) \
    .register(PlaylistResource()) \
    .register(TrackResource()) \
    .register(SearchResource())


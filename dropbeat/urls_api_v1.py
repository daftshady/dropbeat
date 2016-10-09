from api.views_v1 import HealthCheckResource
from toolkit.api import Api

api_v1 = Api(api_name='v1')
api_v1 \
    .register(HealthCheckResource())

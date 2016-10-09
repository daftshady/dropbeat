from toolkit.resource import Resource, parameters


class DropbeatResource(Resource):
    def handle_get(self, request, *args, **kwargs):
        return self.on_error('You cannot access to this path directly')


class HealthCheckResource(DropbeatResource):
    """Checks whether this host is alive or not.

    """
    def handle_get(self, request, *args, **kwargs):
        # TODO: select 1
        return self.on_success()

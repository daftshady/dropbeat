"""Custom exceptions.

"""

class DropbeatException(Exception):
    pass


class UserException(DropbeatException):
    pass


class PlaylistException(DropbeatException):
    pass


class TrackException(DropbeatException):
    pass

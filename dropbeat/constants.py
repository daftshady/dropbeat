from dropbeat.utils import ChoiceEnum


class ErrorCode:
    """Error codes for json response.

    """
    DUPLICATED_EMAIL = '100'
    INVALID_EMAIL = '101'
    PASSWORD_TOO_SHORT = '102'
    EMAIL_NOT_EXIST = '103'
    PASSWORD_MISMATCH = '104'
    DUPLICATED_PLAYLIST_NAME = '105'
    TRACK_ALREADY_EXIST = '106'
    PLAYLIST_NOT_EXIST = '107'
    TRACK_NOT_EXIST = '108'


class TrackSource(ChoiceEnum):
    """Streaming source of track.

    """
    youtube = 0
    soundcloud = 1


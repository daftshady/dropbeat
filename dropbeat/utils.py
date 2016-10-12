"""Defines utility things.

"""


import inspect
from enum import Enum

class ChoiceEnum(Enum):
    """Enum class which can be used in django field choices.

    """
    @classmethod
    def choices(cls):
        # get all members of the class
        members = inspect.getmembers(cls, lambda m: not inspect.isroutine(m))
        # filter down to just properties
        props = [m for m in members if m[0][:2] != '__']
        # format into django choice tuple
        return tuple([(str(p[1].value), p[0]) for p in props])

"""
v0.04 : OK
v0.03 : Bugfix / feature improvement
v0.02 : Delayed autocomplete implemented.

Code borrowed from:
    - https://github.com/gr2m/contenteditable-autocomplete
    - Editor Autocomplete add-on (https://ankiweb.net/shared/info/924298715)
"""

from aqt.editor import Editor
from anki.hooks import wrap
from aqt.utils import askUser

from .utils.resource import readResource
from .wordSet import createWordSet

import re
import os

def afterSetNote(self, note, hide=True, focusTo=None):
    wordSet = createWordSet(self.mw.col)

    wcAdapterJs = readResource('js/main.min.js')
    self.web.eval(wcAdapterJs)
    self.web.eval("wordSet = [" + ''.join('"%s", ' % w for w in wordSet) + "]")


Editor.setNote = wrap(Editor.setNote, afterSetNote, 'after')

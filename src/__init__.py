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

from .wordSet import createWordSet

import re
import os


def readResource(filename):
    scriptDir = os.path.dirname(os.path.realpath(__file__))
    inputFilePath = os.path.join(scriptDir, filename)
    return open(inputFilePath, 'r', encoding='utf-8').read()



def afterSetNote(self, note, hide=True, focusTo=None):
    wordSet = createWordSet(self.mw.col)

    wcAdapterJs = readResource('main.min.js')
    self.web.eval(wcAdapterJs)
    self.web.eval("wordSet = [" + ''.join('"%s", ' % w for w in wordSet) + "]")


Editor.setNote = wrap(Editor.setNote, afterSetNote, 'after')

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
from .utils.configrw import getConfig, setConfigEditor
from .wordSet import createWordSet
from .utils import openChangelog
from .utils import uuid  # duplicate UUID checked here
from .configUI import configEditor
import re
import os


setConfigEditor(configEditor)


def afterSetNote(self, note, hide=True, focusTo=None):
    if not self.web:
        # This can happen by other addon's fault. afterSetNote shouldn't
        # throw exception on this case, as with error user cannot close
        # Anki with editor open, losing all the progress he/she've made.
        return

    wordSet = createWordSet(self.mw.col)

    firstCommitHotkey = getConfig("firstCommitHotkey", "tab")
    numberedCommitHotkey = getConfig("numberedCommitHotkey", "ctrl+?")

    wcAdapterJs = readResource("js/main.min.js")
    self.web.eval(wcAdapterJs)
    self.web.eval('_wcInit("%s", "%s")' % (firstCommitHotkey, numberedCommitHotkey))
    self.web.eval("_wcInitWordset([" + "".join('"%s", ' % w for w in wordSet) + "])")


Editor.setNote = wrap(Editor.setNote, afterSetNote, "after")

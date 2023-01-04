# Copyright (C) 2020 Hyun Woo Park
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

"""
v0.04 : OK
v0.03 : Bugfix / feature improvement
v0.02 : Delayed autocomplete implemented.

Code borrowed from:
    - https://github.com/gr2m/contenteditable-autocomplete
    - Editor Autocomplete add-on (https://ankiweb.net/shared/info/924298715)
"""

from aqt.editor import Editor
from anki.hooks import addHook
from aqt.utils import askUser

from .utils.resource import readResource
from .utils.configrw import getConfig
from .wordSet import createWordSet
from .utils import openChangelog
from .utils import uuid  # duplicate UUID checked here
from .utils import debugLog  # debug log registered here


def afterLoadNote(self):
    if not self.web:
        # This can happen by other addon's fault. afterLoadNote shouldn't
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


addHook("loadNote", afterLoadNote)

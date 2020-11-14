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

import re
from .utils.configrw import getConfig
from anki.utils import splitFields, joinFields

alphaNumeric = re.compile("[a-zA-ZÀ-ú][a-zA-ZÀ-ú0-9]{4,}")


_lastMod = 0
_nidDidMap = {}
_nidWordsMap = {}


def createWordSet(col):
    """ Initialize wordSet from preexisting collections """
    global wordSetCache, alphaNumeric, _lastMod

    # Hack for image occlusion enhanced type model
    # ID field (first field) of io_occ addon note type should be
    # excluded from the search
    imgoccModel = col.models.byName("Image Occlusion Enhanced")
    if imgoccModel:
        iocc_mid = imgoccModel["id"]
    else:
        iocc_mid = None

    blacklistDecks = getConfig("blacklistDecks")

    def shouldIgnoreDid(did, cache={}):
        """Helper function for blacklisting decks in configurations"""
        try:
            return cache[did]
        except KeyError:
            deckName = col.decks.get(did)["name"]
            shouldIgnore = False
            for blacklist in blacklistDecks:
                if deckName == blacklist:
                    shouldIgnore = True
                elif deckName.startswith(blacklist + "::"):
                    shouldIgnore = True

            cache[did] = shouldIgnore
            return shouldIgnore

    # update _nidDidMap for updated cards
    nidDidList = col.db.all("select nid, did from cards where mod > ?", _lastMod)
    for nid, _ in nidDidList:
        _nidDidMap[nid] = set()

    for nid, did in nidDidList:
        _nidDidMap[nid].add(did)
        if shouldIgnoreDid(did):
            # Note newly on blacklisted set
            _nidWordsMap[nid] = set()

    # update _nidWordsMap for updated cards
    for (nid, field, mid) in col.db.execute(
        "select id, flds, mid from notes where mod > ?", _lastMod
    ):
        if any(shouldIgnoreDid(did) for did in _nidDidMap[nid]):
            # Blacklisted card
            _nidWordsMap[nid] = set()
            continue

        # Ignore first field of image occlusion enhanced note
        if mid == iocc_mid:
            field = joinFields(splitFields(field)[1:])

        field = re.sub(
            r"\[sound:.*?\]|"
            + r"<\w*script.*?>(.|\n)*?<\s*/script\s*>|"
            + r"\[latex\](.|\n)*?\[/latex\]|"
            + r"<.*?>",
            " ",
            field,
        )

        words = [w.lower() for w in alphaNumeric.findall(field)]
        _nidWordsMap[nid] = words

    _lastMod = col.mod

    # Collect wordset
    wordSet = set()
    for words in _nidWordsMap.values():
        wordSet.update(words)

    return wordSet


def invalidateWordSetCache():
    global _lastMod

    _nidDidMap.clear()
    _nidWordsMap.clear()
    _lastMod = 0

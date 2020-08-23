# Copyright 2020 phu54321
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import re
from .utils.configrw import getConfig
from anki.utils import splitFields, joinFields

wordSetCache = {}
blacklistedNoteIds = set()
alphaNumeric = re.compile("[a-zA-ZÀ-ú][a-zA-ZÀ-ú0-9]{4,}")


def createWordSet(col):
    """ Initialize wordSet from preexisting collections """
    global wordSetCache, alphaNumeric

    wordSet = set()

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

    for (nid, field, mid) in col.db.execute("select id, flds, mid from notes"):
        if nid in blacklistedNoteIds:
            continue

        try:
            wordSet.update(wordSetCache[field])
        except KeyError:
            if all(
                shouldIgnoreDid(did)
                for did in col.db.list(
                    "select did from cards where nid = ? order by ord", nid
                )
            ):
                blacklistedNoteIds.add(nid)
                continue

            rawField = field

            # Ignore first field of image occlusion enhanced note
            if mid == iocc_mid:
                field = joinFields(splitFields(field)[1:])

            field = re.sub(r"\[sound:.*?\]", " ", field)
            field = re.sub(r"<\w*script.*?>(.|\n)*?<\s*/script\s*>", " ", field)
            field = re.sub(r"\[latex\](.|\n)*?\[/latex\]", " ", field)
            field = re.sub(r"<.*?>", " ", field)
            words = [w.lower() for w in alphaNumeric.findall(field)]
            wordSetCache[rawField] = words
            wordSet.update(words)

    return wordSet


def invalidateWordSetCache():
    wordSetCache.clear()
    blacklistedNoteIds.clear()

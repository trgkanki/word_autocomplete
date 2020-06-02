import re
from .stripHTML import stripHTML

wordSetCache = {}
alphaNumeric = re.compile("[a-zA-Z][a-zA-Z0-9]{4,}")


def createWordSet(col):
    """ Initialize wordSet from preexisting collections """
    global wordSetCache, alphaNumeric

    wordSet = set()

    for (field,) in col.db.execute("select flds from notes"):
        try:
            wordSet.update(wordSetCache[field])
        except KeyError:
            rawField = field

            field = re.sub(r'\[sound:.*?\]', '', field)
            field = re.sub(r'<.*?>', '', field)
            words = [w.lower() for w in alphaNumeric.findall(field)]
            wordSetCache[rawField] = words
            wordSet.update(words)

    return wordSet

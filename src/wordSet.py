import re
from .stripHTML import stripHTML
from anki.utils import splitFields, joinFields

wordSetCache = {}
alphaNumeric = re.compile("[a-zA-Z][a-zA-Z0-9]{4,}")

def createWordSet(col):
    """ Initialize wordSet from preexisting collections """
    global wordSetCache, alphaNumeric

    wordSet = set()

    # Hack for image occlusion enhanced type model
    # ID field (first field) of io_occ addon note type should be
    # excluded from the search
    imgoccModel = col.models.byName('Image Occlusion Enhanced')
    if imgoccModel:
        iocc_mid = imgoccModel['id']
    else:
        iocc_mid = None


    for (field, mid) in col.db.execute("select flds, mid from notes"):
        try:
            wordSet.update(wordSetCache[field])
        except KeyError:
            rawField = field

            # Ignore first field of image occlusion enhanced note
            if mid == iocc_mid:
                field = joinFields(splitFields(field)[1:])

            field = re.sub(r'\[sound:.*?\]', '', field)
            field = re.sub(r'<.*?>', '', field)
            words = [w.lower() for w in alphaNumeric.findall(field)]
            wordSetCache[rawField] = words
            wordSet.update(words)

    return wordSet

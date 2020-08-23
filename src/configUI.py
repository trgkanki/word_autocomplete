from .utils.configrw import (
    getConfig,
    setConfig,
    getConfigAll,
    setConfigAll,
)
from .qdlg import (
    QDlg,
    Text,
    Button,
    ListBox,
    LineEdit,
    HStack,
    Table,
    Tr,
    Td,
    observable,
    unobserved,
)

from PyQt5.Qt import QAbstractItemView
from aqt import mw


@QDlg("Configure word_autocomplete", (400, 600))
def addonConfigWindow(dlg, allDecks, config):
    with Table():
        with Tr():
            with Td():
                Text("1st suggestion hotkey")
            with Td():
                LineEdit().model(config, index="firstCommitHotkey")

        with Tr():
            with Td():
                Text("ntt suggestion hotkey")
            with Td():
                LineEdit().model(config, index="numberedCommitHotkey")

        with Tr():
            with Td(colspan=2):
                Text("Deck blacklist")

        with Tr():
            with Td(colspan=2):
                (
                    ListBox(allDecks, renderer=lambda d: d["name"])
                    .multiselect(QAbstractItemView.MultiSelection)
                    .model(config, index="blacklistDecks")
                )

    with HStack():
        Button("OK").onClick(lambda: dlg.accept()).default()
        Button("Cancel").onClick(lambda: dlg.reject())


def configEditor():
    addonConfig = observable(getConfigAll())
    allDecks = [{"id": v["id"], "name": v["name"]} for v in mw.col.decks.all()]
    allDecksNameDict = {v["name"]: v for v in allDecks}
    addonConfig["blacklistDecks"] = [
        allDecksNameDict[i] for i in addonConfig["blacklistDecks"]
    ]
    if addonConfigWindow.run(allDecks, addonConfig):
        addonConfig = unobserved(addonConfig)
        addonConfig["blacklistDecks"] = [
            v["name"] for v in addonConfig["blacklistDecks"]
        ]
        setConfigAll(addonConfig)

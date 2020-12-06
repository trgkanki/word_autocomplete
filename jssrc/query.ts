// Copyright (C) 2020 Hyun Woo Park
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { getCaretParentElement, getCaretCharacterOffsetWithin, setCursorAt } from './caret'

const removeDiacritics = require('diacritics').remove

function getWordStart (text: string, from: number, allowTrailingSpaces = false): number[] | null {
  text = removeDiacritics(text)

  let endedWithAlphabet = false
  let j = from - 1
  let spaces = 0
  if (allowTrailingSpaces) {
    for (; j >= 0; j--) {
      if (text.charAt(j) !== ' ') break
    }
    spaces = (from - 1) - j
  }
  for (; j >= 0; j--) {
    const ch = text.charAt(j)
    if (
      (ch >= 'a' && ch <= 'z') ||
      (ch >= 'A' && ch <= 'Z')
    ) {
      endedWithAlphabet = true
      continue
    } else if (ch >= '0' && ch <= '9') {
      endedWithAlphabet = false
      continue
    } else break
  }
  if (!endedWithAlphabet) return null
  else if (allowTrailingSpaces) return [j + 1, spaces]
  else return [j + 1, -1]
}

// https://github.com/gr2m/contenteditable-autocomplete
export function getCurrentQuery (): string | null {
  const container = getCaretParentElement()
  if (!container) return null
  const cursorAt = getCaretCharacterOffsetWithin(container)
  const text = container.textContent || ''
  const wordStart = getWordStart(text, cursorAt)
  console.log(text, wordStart, cursorAt)
  if (wordStart == null) return null
  return text.substring(wordStart[0], cursorAt)
}

// https://github.com/gr2m/contenteditable-autocomplete
export function replaceCurrentQuery (newText: string): void {
  const container = getCaretParentElement()
  if (!container) return

  const cursorAt = getCaretCharacterOffsetWithin(container)
  const text = container.textContent || ''
  const ws = getWordStart(text, cursorAt, true)
  if (ws == null) return
  const [wordStart, spaces] = ws
  for (let i = 0; i < spaces; i++) newText += ' '

  // First of oldText is capital → Capitalize
  const oldText = text.substring(wordStart, cursorAt)
  if (oldText.charAt(0) === oldText.charAt(0).toUpperCase()) { // A-Z
    newText = newText.substring(0, 1).toUpperCase() + newText.substring(1)
  }
  const repText =
    text.substring(0, wordStart) +
    newText +
    text.substring(cursorAt)
  container.textContent = repText
  setCursorAt(container, wordStart + newText.length)
}

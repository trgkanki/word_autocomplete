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

import { getCaretParentElement, getCaretCharacterOffsetWithin, setCursorAt, getCurrentSelection } from './caret'
import { remove as removeDiacritics } from 'diacritics'

export interface GetWordStartResult {
  wordStartPos: number
  spaceCount: number
}

function getWordStart (text: string, from: number, allowTrailingSpaces = false): GetWordStartResult | null {
  text = removeDiacritics(text)

  let endedWithAlphabet = false
  let j = from - 1
  let spaceCount = 0

  // j := first non-space character
  if (allowTrailingSpaces) {
    for (; j >= 0; j--) {
      if (text.charAt(j) !== ' ') break
    }
    spaceCount = (from - 1) - j
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
  return { wordStartPos: j + 1, spaceCount }
}

/**
 * Normalizes DOM element so that adjacent text nodes are merged.
 * this makes sure that `textContent` stays the same.
 */
function normalizeTextContainer (target: HTMLElement) {
  if (target) {
    if (target.shadowRoot) {
      target.shadowRoot.normalize()
    } else {
      target.normalize()
    }
  }
}

// https://github.com/gr2m/contenteditable-autocomplete
export function getCurrentQuery (target: HTMLElement): string | null {
  normalizeTextContainer(target)

  const selection = getCurrentSelection(target)
  if (!selection) return null

  const container = getCaretParentElement(selection)
  if (!container) return null

  const cursorAt = getCaretCharacterOffsetWithin(selection, container)
  const text = container.textContent || ''
  const wordStart = getWordStart(text, cursorAt)
  if (wordStart == null) return null
  return text.substring(wordStart.wordStartPos, cursorAt)
}

// https://github.com/gr2m/contenteditable-autocomplete
export function replaceCurrentQuery (target: HTMLElement, newText: string): void {
  normalizeTextContainer(target)

  const selection = getCurrentSelection(target)
  if (!selection) return

  const container = getCaretParentElement(selection)
  if (!container) return
  // TODO: check if container is within target

  const cursorAt = getCaretCharacterOffsetWithin(selection, container)
  const text = container.textContent || ''
  const ws = getWordStart(text, cursorAt, true)
  if (ws == null) return
  const { wordStartPos, spaceCount } = ws
  for (let i = 0; i < spaceCount; i++) newText += ' '

  // First of oldText is capital → Capitalize
  const oldText = text.substring(wordStartPos, cursorAt)
  if (oldText.charAt(0) === oldText.charAt(0).toUpperCase()) { // A-Z
    newText = newText.substring(0, 1).toUpperCase() + newText.substring(1)
  }

  const prefix = text.substring(0, wordStartPos)
  const suffix = text.substring(cursorAt)

  // Replace trailing space with &nbsp; if needed
  if (suffix.length === 0 || suffix.startsWith(' ')) {
    if (newText.endsWith(' ')) {
      newText = newText.substring(0, newText.length - 1) + '\xa0'
    }
  }

  const repText = prefix + newText + suffix
  container.textContent = repText
  setCursorAt(container, wordStartPos + newText.length)
}

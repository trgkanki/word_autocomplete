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

import { ranker } from './ranker'
import { replaceCurrentQuery } from './query'
import config from './config'
import './style.scss'
import { getCaretPositionByViewport, getCurrentSelection } from './caret'
import { remove as removeDiacritics } from 'diacritics'

let lastAutocompleteIssuedField: HTMLElement | null = null
let wordSet: string[] = [] // Original word set
let normalizedWordSet: string[] = [] // One used for autocomplete matching

window._wcInitWordset = function (newWordset: string[]): void {
  wordSet = newWordset
  normalizedWordSet = newWordset.map(s => removeDiacritics(s))
}

export function isAutocompleteOngoing () {
  return lastAutocompleteIssuedField !== null
}

export function getAutocompleteList (needle: string, callback: (candidates: string[]) => void): void {
  const N = wordSet.length
  const acceptanceTable = new Array(N)
  const indirectSorter = new Array(N)

  const checkPerLoop = 1000
  let i = 0

  function checker (): void {
    for (let j = 0; j < checkPerLoop; j++) {
      if (i === wordSet.length) {
        indirectSorter.sort(function (a, b) {
          return acceptanceTable[b] - acceptanceTable[a]
        })

        const ret = []
        for (i = 0; i < Math.min(N, 5); i++) {
          const idx = indirectSorter[i]
          if (acceptanceTable[idx] < 0) break
          ret.push(wordSet[idx])
        }
        return callback(ret)
      }
      indirectSorter[i] = i
      acceptanceTable[i] = ranker(needle, normalizedWordSet[i])
      i++
    }
    setTimeout(checker, 1)
  }
  setTimeout(checker, 1)
}

export function getAutoCompleterSpan (): HTMLElement {
  const els = document.getElementsByClassName('wautocompleter')
  if (els.length === 0) {
    const el = document.createElement('span')
    el.classList.add('wautocompleter')
    document.body.append(el)
    return el
  } else {
    return els[0] as HTMLElement
  }
}

export function clearAutocompleteSpan (): void {
  const el = getAutoCompleterSpan()
  delete el.dataset.autocomplete
  el.classList.add('hidden')
  lastAutocompleteIssuedField = null
}

let isFindingAutocomplete = false
let anotherAutocompleteQueued: string | null = null
let issueAutocompleteQueued: number | null = null

export function issueAutocomplete (index: number): void {
  const el = getAutoCompleterSpan()
  const acData = el.dataset.autocomplete
  if (!acData) return // No autocomplete available.

  if (!lastAutocompleteIssuedField) return

  const candidates = JSON.parse(acData)
  const candidateIndex = index
  if (candidates.length > candidateIndex) {
    replaceCurrentQuery(lastAutocompleteIssuedField, candidates[candidateIndex] + ' ')
    clearAutocompleteSpan()
  }
}

export function queueAutocompleteIssue (index: number): void {
  if (!isFindingAutocomplete) issueAutocomplete(index)
  else issueAutocompleteQueued = index
}

const candidateTitleList = '123456789'

export function queueAutocomplete (target: HTMLElement, query: string | null): void {
  query = query ? removeDiacritics(query) : query

  if (isFindingAutocomplete) {
    anotherAutocompleteQueued = query
    return
  }

  function popTaskQueue (): void {
    if (issueAutocompleteQueued !== null) {
      // Wait for next autocomplete issue.
      if (issueAutocompleteQueued < 0) { // Already waited once.
        anotherAutocompleteQueued = null
        issueAutocompleteQueued += 1000 // Reset to positive
      }
      if (anotherAutocompleteQueued) {
        // Make negative → Wait for one more autocomplete query.
        issueAutocompleteQueued -= 1000
      } else {
        issueAutocomplete(issueAutocompleteQueued)
        issueAutocompleteQueued = null
      }
    }
    if (anotherAutocompleteQueued) {
      anotherAutocompleteQueued = null
      queueAutocomplete(target, anotherAutocompleteQueued)
    }
  }

  if (!(query && query.length >= 2)) {
    clearAutocompleteSpan()
    popTaskQueue()
    return
  }

  const el = getAutoCompleterSpan()
  isFindingAutocomplete = true
  lastAutocompleteIssuedField = target
  getAutocompleteList(query, function (autocomplete) {
    if (autocomplete.length === 0 || !lastAutocompleteIssuedField) {
      clearAutocompleteSpan()
    } else {
      let html = `
        <span class='candidate' title='Press ${config.firstCommitHotkey} or ${config.numberedCommitHotkey.replace('?', '1')}'>
          <span class='candidate-number'>${candidateTitleList[0]}</span>
          ${autocomplete[0]}
        </span>`
      for (let i = 1; i < autocomplete.length; i++) {
        html += ` /
          <span class='candidate' title='Press ${config.numberedCommitHotkey.replace('?', (i + 1).toString())}'>
            <span class='candidate-number'>${candidateTitleList[i]}</span>
            ${autocomplete[i]}
          </span>`
      }

      const selection = getCurrentSelection(lastAutocompleteIssuedField)
      const { x: caretX, y: caretY } = getCaretPositionByViewport(selection)
      const left = caretX + pageXOffset
      const top = pageYOffset + ((caretY < window.innerHeight - 100) ? caretY + 30 : Math.max(0, caretY - 30))
      el.innerHTML = html
      el.dataset.autocomplete = JSON.stringify(autocomplete)
      el.style.left = left + 'px'
      el.style.top = top + 'px'
      el.classList.remove('hidden')
    }
    isFindingAutocomplete = false
    popTaskQueue()
  })
}

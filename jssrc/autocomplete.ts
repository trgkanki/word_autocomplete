import { ranker } from './ranker'
import $ from 'jquery'
import { replaceCurrentQuery } from './query'
import config from './config'
import './style.scss'

const removeDiacritics = require('diacritics').remove

declare let currentField: Node | null
let wordSet: string[] = [] // Original word set
let normalizedWordSet: string[] = [] // One used for autocomplete matching

window._wcInitWordset = function (newWordset: string[]): void {
  wordSet = newWordset
  normalizedWordSet = newWordset.map(s => removeDiacritics(s))
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

export function getAutoCompleterSpan (): JQuery<HTMLElement> {
  let $el = $('.wautocompleter')
  if ($el.length === 0) {
    $el = $('<span></span>')
      .addClass('wautocompleter')
      .appendTo('body')
  }
  return $el
}

export function clearAutocompleteSpan (): void {
  const $el = getAutoCompleterSpan()
  $el.data('autocomplete', null)
  $el.html('-------')
}

let isFindingAutocomplete = false
let anotherAutocompleteQueued: string | null = null
let issueAutocompleteQueued: number | null = null

export function issueAutocomplete (index: number): void {
  const $el = getAutoCompleterSpan()
  const candidates = $el.data('autocomplete')
  if (candidates == null) return // No autocomplete available.
  const candidateIndex = index
  if (candidates.length > candidateIndex) {
    replaceCurrentQuery($el.data('autocomplete')[candidateIndex])
    clearAutocompleteSpan()
  }
}

export function queueAutocompleteIssue (index: number): void {
  if (!isFindingAutocomplete) issueAutocomplete(index)
  else issueAutocompleteQueued = index
}

const candidateTitleList = '123456789'

export function queueAutocomplete (query: string | null): void {
  query = removeDiacritics(query)
  console.log(query)

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
      queueAutocomplete(anotherAutocompleteQueued)
    }
  }

  if (!(query && query.length >= 2)) {
    clearAutocompleteSpan()
    popTaskQueue()
    return
  }

  const $el = getAutoCompleterSpan()
  isFindingAutocomplete = true
  getAutocompleteList(query, function (autocomplete) {
    if (autocomplete.length === 0 || !currentField) {
      clearAutocompleteSpan()
    } else {
      $el.css('display', 'inline-block')
      let html = `<b title='Press ${config.firstCommitHotkey}'>${autocomplete[0]}</b>`
      for (let i = 1; i < autocomplete.length; i++) {
        html += ` /
          <span title='Press ${config.numberedCommitHotkey.replace('?', (i + 1).toString())}'>
            <span class='candidate-number'>${candidateTitleList[i]}</span>
            ${autocomplete[i]}
          </span>`
      }
      $el.html(html)
      $el.data('autocomplete', autocomplete)
      $el.insertAfter(currentField)
    }
    isFindingAutocomplete = false
    popTaskQueue()
  })
}

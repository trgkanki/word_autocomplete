import { getAutoCompleterSpan, clearAutocompleteSpan, queueAutocompleteIssue, queueAutocomplete } from './autocomplete'
import { getCurrentQuery } from './query'
import $ from 'jquery'
import hotkeys from 'hotkeys-js'
import config from './config'

hotkeys.filter = (): boolean => true

window._wcInit = function (firstCommitHotkey: string, numberedCommitHotkey: string): void {
  if (window._wcInitialized) return
  window._wcInitialized = true

  config.firstCommitHotkey = firstCommitHotkey
  config.numberedCommitHotkey = numberedCommitHotkey

  // Hotkeys
  hotkeys(firstCommitHotkey, function (event) {
    event.preventDefault()
    queueAutocompleteIssue(0)
  })

  if (numberedCommitHotkey && numberedCommitHotkey.indexOf('?') !== -1) {
    for (let i = 1; i <= 9; i++) {
      (function (i): void {
        hotkeys(numberedCommitHotkey.replace('?', i.toString()), function (event) {
          event.preventDefault()
          queueAutocompleteIssue(i - 1)
        })
      })(i)
    }
  }

  hotkeys('esc', function (event) {
    const $el = getAutoCompleterSpan()
    if ($el.data('autocomplete')) {
      event.preventDefault()
      clearAutocompleteSpan()
    }
  })

  // Autocomplete candidate windows
  $(document).on('input', '[contenteditable]', function (_event) {
    const query = getCurrentQuery()
    queueAutocomplete(query)
  })

  $(document).on('blur', '[contenteditable]', function (_event) {
    clearAutocompleteSpan()
  })
}

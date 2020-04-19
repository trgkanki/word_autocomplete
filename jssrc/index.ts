import $ from 'jquery'
import { getAutoCompleterSpan, clearAutocompleteSpan, queueAutocompleteIssue, queueAutocomplete } from './autocomplete'
import { getCurrentQuery } from './query'
import * as KeyCode from './keyCode'

if (!window._wcInitialized) {
  let ctrlPressed = false

  window._wcInitialized = true
  $('body').on('keydown', '[contenteditable]', function (event) {
    const $el = getAutoCompleterSpan()
    let { keyCode } = event

    if (keyCode === KeyCode.CTRL) ctrlPressed = true

    // Bug #2. Numeric keypad and Number key have differeny keycode.
    if (KeyCode.NUMPAD_0 <= event.keyCode && event.keyCode <= KeyCode.NUMPAD_9) {
      keyCode = (keyCode - KeyCode.NUMPAD_0 + KeyCode.DIGIT_0)
    }

    //  Ctrl 1-9
    if (
      ctrlPressed &&
          (KeyCode.DIGIT_0 <= keyCode && keyCode <= KeyCode.DIGIT_9) &&
          $el.data('autocomplete')
    ) {
      queueAutocompleteIssue(keyCode - KeyCode.DIGIT_0)
      event.preventDefault()
      return
    }

    // ESC -> clear autocomplete
    if (keyCode === KeyCode.ESC && $el.data('autocomplete')) {
      clearAutocompleteSpan()
      event.preventDefault()
      return
    }

    // Tab
    if (keyCode === KeyCode.TAB && $el.data('autocomplete')) {
      queueAutocompleteIssue(0)
      event.preventDefault()
    }
  })

  $('body').on('input', '[contenteditable]', function (_event) {
    const query = getCurrentQuery()
    queueAutocomplete(query)
  })

  $('body').on('blur', '[contenteditable]', function (_event) {
    clearAutocompleteSpan()
  })

  $('body').on('keyup', '[contenteditable]', function (event) {
    if (event.keyCode === 17) {
      ctrlPressed = false
    }
  })
}

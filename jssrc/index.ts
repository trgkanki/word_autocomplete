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

import { getAutoCompleterSpan, clearAutocompleteSpan, queueAutocompleteIssue, queueAutocomplete } from './autocomplete'
import { getCurrentQuery } from './query'
import $ from 'jquery'
import Mousetrap from 'mousetrap'
import config from './config'

window._wcInit = function (firstCommitHotkey: string, numberedCommitHotkey: string): void {
  if (window._wcInitialized) return
  window._wcInitialized = true

  config.firstCommitHotkey = firstCommitHotkey
  config.numberedCommitHotkey = numberedCommitHotkey

  Mousetrap.prototype.stopCallback = function () {
    if (this.paused) {
      return true
    }
  }

  Mousetrap.bind(firstCommitHotkey, function (event) {
    event.preventDefault()
    queueAutocompleteIssue(0)
  })

  if (numberedCommitHotkey && numberedCommitHotkey.indexOf('?') !== -1) {
    for (let i = 1; i <= 9; i++) {
      (function (i): void {
        Mousetrap.bind(numberedCommitHotkey.replace('?', i.toString()), function (event) {
          event.preventDefault()
          queueAutocompleteIssue(i - 1)
        })
      })(i)
    }
  }

  Mousetrap.bind('esc', function (event) {
    const el = getAutoCompleterSpan()
    if (el.dataset.autocomplete) {
      event.preventDefault()
      clearAutocompleteSpan()
    }
  })

  // Autocomplete candidate windows
  $(document).on('keyup', '[contenteditable]', function (e) {
    const query = getCurrentQuery()
    queueAutocomplete(query)
  })

  $(document).on('blur', '[contenteditable]', function () {
    clearAutocompleteSpan()
  })
}

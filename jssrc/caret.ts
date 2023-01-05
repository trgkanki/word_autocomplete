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

export function getCurrentSelection (target: HTMLElement) {
  const selectionRoot = target.shadowRoot || document
  return selectionRoot.getSelection()
}

export function getCaretParentElement (selection: Selection): Node | undefined {
  const range = selection.getRangeAt(0)
  return range?.startContainer
}

export function getCaretCharacterOffsetWithin (selection: Selection, element: Node): number {
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    if (!range) return 0
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(element)
    preCaretRange.setEnd(range.endContainer, range.endOffset)
    return preCaretRange.toString().length
  } else {
    return 0
  }
}

export function getCaretPositionByViewport (selection: Selection | null) {
  if (!selection) return { x: 0, y: 0 }
  const el = document.createElement('span')
  selection.getRangeAt(0).insertNode(el)
  const rect = el.getBoundingClientRect()
  el.remove()
  return { x: rect.x, y: rect.y }
}

// https://github.com/gr2m/contenteditable-autocomplete
export function setCursorAt (node: Node, position: number): void {
  const range = document.createRange()
  const sel = window.getSelection()
  if (!sel) return
  const textNode = node.childNodes.length ? node.childNodes[0] : node
  position = Math.min(textNode.textContent?.length || 0, position)
  range.setStart(textNode, position)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}

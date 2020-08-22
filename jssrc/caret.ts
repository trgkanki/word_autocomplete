export function getCaretParentElement (): Node | undefined {
  const range = window.getSelection()?.getRangeAt(0)
  return range?.startContainer
}

export function getCaretCharacterOffsetWithin (element: Node): number {
  const selection = window.getSelection()
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

export function getCaretPositionByViewport () {
  const selection = window.getSelection()
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

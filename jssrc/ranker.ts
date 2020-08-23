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

const gapScoreHighCut = 3
const wordStartDistHighCut = 4

/**
 * Compute score of how probable `needle` would be candidate for fuzzy
 * matching of `haystack`
 */
export function ranker (needle: string, haystack: string): number {
  const haystackLength = haystack.length
  let inIndex = 0
  let score = 0

  needle = needle.toLowerCase()
  haystack = haystack.toLowerCase()

  for (let i = 0; i < needle.length; i++) {
    const ch = needle[i]
    const prevInIndex = inIndex

    // Find matching inIndex
    while (haystack[inIndex] !== ch) {
      inIndex++
      if (inIndex >= haystackLength) return -1 // Match failed
    }

    // Value smaller distance between match characters
    const gap = inIndex - prevInIndex
    const gapMul = Math.max(1, gapScoreHighCut - gap)
    const wsdMul = Math.max(1, wordStartDistHighCut - inIndex)
    score += 100 * gapMul * wsdMul
    inIndex++
  }

  if (haystackLength < 100) score += 100 - haystackLength

  return score
}

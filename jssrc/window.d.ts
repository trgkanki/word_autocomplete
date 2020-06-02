interface Window {
  _wcInitialized: boolean | undefined
  _wcInit: (firstCommitHotkey: string, numberedCommitHotkey: string) => void
  _wcInitWordset: (newWordset: string[]) => void
}

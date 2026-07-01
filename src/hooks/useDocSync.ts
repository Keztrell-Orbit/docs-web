// Syncing is now handled by EditorProvider's OnChangePlugin and EditorContentHandler.
// This hook is kept as a no-op for backwards compatibility.
export function useDocSync() {
  // Document sync is handled by the EditorProvider component
  // via OnChangePlugin (save) and EditorContentHandler (load).
}

// Auto page breaks are now handled via the DocumentEditor's PageBreakCounter
// and the custom PageBreakNode Lexical node.
// This hook is kept as a no-op for backwards compatibility.
export function useAutoPageBreaks() {
  // Page break tracking is handled by the DocumentEditor component
  // using the PageBreakCounter sub-component.
}

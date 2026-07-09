export function getClickCount(event: MouseEvent, lastClickTime: number, lastClickPosition: { x: number; y: number }, doubleClickDelay: number): number {
  const now = Date.now();
  const dt = now - lastClickTime;
  const dx = Math.abs(event.clientX - lastClickPosition.x);
  const dy = Math.abs(event.clientY - lastClickPosition.y);
  if (dt < doubleClickDelay && dx < 4 && dy < 4) {
    return 2;
  }
  return 1;
}

export function isTripleClick(event: MouseEvent, doubleClickTime: number, lastClickTime: number, lastClickPosition: { x: number; y: number }): boolean {
  const now = Date.now();
  const dt = now - lastClickTime;
  const dx = Math.abs(event.clientX - lastClickPosition.x);
  const dy = Math.abs(event.clientY - lastClickPosition.y);
  return dt < doubleClickTime * 2 && dx < 4 && dy < 4;
}

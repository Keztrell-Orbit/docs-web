export function isTrackpadWheel(event: WheelEvent): boolean {
  return Math.abs(event.deltaX) > 0 || (event.deltaMode === 0 && Math.abs(event.deltaY) < 50);
}

export function shouldSuppressWheel(event: WheelEvent): boolean {
  return event.ctrlKey || event.metaKey;
}

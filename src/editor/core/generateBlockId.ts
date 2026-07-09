let counter = 0;

export function generateBlockId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `block-${Date.now()}-${counter++}`;
  }
}

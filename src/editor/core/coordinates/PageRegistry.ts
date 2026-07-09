export interface PageMetrics {
  id: string;
  viewportX: number;
  viewportY: number;
}

export class PageRegistry {
  private pages = new Map<string, PageMetrics>();
  private version = 0;
  private listeners = new Set<() => void>();

  register(id: string, viewportX: number, viewportY: number): void {
    this.pages.set(id, { id, viewportX, viewportY });
    this.version++;
    this.notify();
  }

  unregister(id: string): void {
    this.pages.delete(id);
    this.version++;
    this.notify();
  }

  updatePosition(id: string, viewportX: number, viewportY: number): void {
    const existing = this.pages.get(id);
    if (existing) {
      existing.viewportX = viewportX;
      existing.viewportY = viewportY;
      this.version++;
      this.notify();
    }
  }

  getVersion(): number {
    return this.version;
  }

  get(id: string): PageMetrics | undefined {
    return this.pages.get(id);
  }

  getAllPages(): PageMetrics[] {
    return Array.from(this.pages.values());
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

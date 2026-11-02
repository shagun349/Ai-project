/**
 * Min-heap priority queue for search algorithms.
 * Items are ordered by priority (lowest first).
 */
export class MinPriorityQueue<T> {
  private heap: Array<{ item: T; priority: number }> = [];

  push(item: T, priority: number): void {
    this.heap.push({ item, priority });
    this._bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.isEmpty()) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return min.item;
  }

  peek(): T | undefined {
    return this.heap[0]?.item;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  size(): number {
    return this.heap.length;
  }

  contains(predicate: (item: T) => boolean): boolean {
    return this.heap.some(entry => predicate(entry.item));
  }

  toArray(): T[] {
    return this.heap.map(entry => entry.item);
  }

  updatePriority(predicate: (item: T) => boolean, newPriority: number): boolean {
    const index = this.heap.findIndex(entry => predicate(entry.item));
    if (index === -1) return false;
    const oldPriority = this.heap[index].priority;
    this.heap[index].priority = newPriority;
    if (newPriority < oldPriority) {
      this._bubbleUp(index);
    } else {
      this._sinkDown(index);
    }
    return true;
  }

  private _bubbleUp(n: number): void {
    const element = this.heap[n];
    while (n > 0) {
      const parentN = Math.floor((n - 1) / 2);
      const parent = this.heap[parentN];
      if (element.priority >= parent.priority) break;
      this.heap[n] = parent;
      this.heap[parentN] = element;
      n = parentN;
    }
  }

  private _sinkDown(n: number): void {
    const length = this.heap.length;
    const element = this.heap[n];
    while (true) {
      const leftChildN = 2 * n + 1;
      const rightChildN = 2 * n + 2;
      let smallest = n;

      if (leftChildN < length && this.heap[leftChildN].priority < this.heap[smallest].priority) {
        smallest = leftChildN;
      }
      if (rightChildN < length && this.heap[rightChildN].priority < this.heap[smallest].priority) {
        smallest = rightChildN;
      }
      if (smallest === n) break;

      this.heap[n] = this.heap[smallest];
      this.heap[smallest] = element;
      n = smallest;
    }
  }
}

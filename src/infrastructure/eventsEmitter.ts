import type { DomainEventMap } from "../domain/events.js";

type EventHandler<T> = (event: T) => void;

export class EventEmitter {
  private handlers: Map<string, Set<EventHandler<unknown>>> = new Map();
  subscribe<K extends keyof DomainEventMap>(
  eventType: K,
  handler: EventHandler<DomainEventMap[K]>
): void {
  if (!this.handlers.has(eventType)) {
    this.handlers.set(eventType, new Set());
  }
  this.handlers.get(eventType)!.add(handler as unknown as EventHandler<unknown>);
}

unsubscribe<K extends keyof DomainEventMap>(
  eventType: K,
  handler: EventHandler<DomainEventMap[K]>
): void {
  this.handlers.get(eventType)?.delete(handler as unknown as EventHandler<unknown>);
}

  emit<K extends keyof DomainEventMap>(
    eventType: K,
    payload: DomainEventMap[K]
  ): void {
    const set = this.handlers.get(eventType);
    if (set) {
      for (const handler of set) {
        handler(payload);
      }
    }
  }
}
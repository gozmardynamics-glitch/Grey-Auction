/**
 * Abstraction over the settlement job queue.
 *
 * The settlement service depends on this port rather than BullMQ directly: the
 * @nestjs/bullmq package is ESM-only, and importing it from a service makes that
 * service untestable under Jest's CJS runtime. It also keeps the "queue may be
 * absent" case explicit — when no implementation is registered (dev box without
 * Redis) settlement falls back to inline processing.
 */
export const SETTLEMENT_QUEUE = Symbol('SETTLEMENT_QUEUE');

export interface SettlementQueuePort {
  /** Resolves true when the backing broker is reachable within the timeout. */
  isReady(timeoutMs: number): Promise<boolean>;
  /** Enqueues one lot for settlement. Rejects if the broker is unavailable. */
  enqueue(productId: string): Promise<void>;
}

export interface StoredObject {
  /** Object key (path) inside the bucket, e.g. "images/2024/abc.webp". */
  key: string;
  /** Public or signed URL for the object. */
  url: string;
  /** Byte size. */
  size: number;
  /** Content type. */
  contentType: string;
}

/**
 * Storage driver abstraction. Implementations:
 *  - LocalStorageDriver   (zero-config disk store for dev)
 *  - S3StorageDriver      (MinIO / Cloudflare R2 / AWS S3 — any S3-compatible endpoint)
 *
 * Switching MinIO → Cloudflare R2 later is a pure config change (endpoint +
 * credentials + bucket), not a code change.
 */
export interface StorageDriver {
  /** Upload a buffer and return its public URL + metadata. */
  put(key: string, buffer: Buffer, contentType: string): Promise<StoredObject>;
  /** Delete an object by key. */
  delete(key: string): Promise<void>;
  /** Build a public URL for a key (used when constructing variant URLs). */
  getUrl(key: string): string;
  /**
   * Extract the object key from a URL produced by getUrl(). Used by delete
   * so callers can pass back the exact URL they were given.
   */
  keyFromUrl(url: string): string;
}

/** DI token for the active StorageDriver (interface can't be a value token). */
export const STORAGE_DRIVER = Symbol('STORAGE_DRIVER');
import { FileEntry, FilesMap, RouterOptions, RouteHandler } from "./types";

export { FileEntry, FilesMap, RouterOptions, RouteHandler };

// Note: `browser.d.ts` describes the `./browser` entry point (`browser.mjs`),
// not the main `.` entry (see `types.d.ts` for that). `createRouter` is the
// exact same implementation as the `.` entry's (both import
// `./lib/create-router.mjs`), so its types are reused unchanged. `toArchive`
// and `fromArchive`, however, are a *separate* implementation from the Node
// entry's (`lib/to-archive.mjs`/`lib/from-archive.mjs`) -- same wire format,
// but different runtime types, because there is no `Buffer` in a browser:
//
// - `toArchive()`'s options key is `compressed` here, not `compress` (the
//   Node entry's key) -- a real, pre-existing naming inconsistency between
//   the two entrypoints, not a typo introduced by this file. There is also
//   no `compressionLevel` option here (browser.mjs's own comment notes
//   `CompressionStream` has no level parameter to plumb one through to).
// - `toArchive()` returns a `Uint8Array` when called with
//   `{ compressed: false }` (the raw, uncompressed Web Bundle from
//   `wbn`'s `BundleBuilder.createBundle()`), and an `ArrayBuffer` when
//   compression runs (the default): `compressObject()`
//   (`lib/compression.browser.mjs`) pipes through `CompressionStream` and
//   resolves via `Response#arrayBuffer()`. The Node entry's `toArchive()`,
//   by contrast, always returns a `Buffer`. Don't assume this matches the
//   Node types -- confirmed by reading both implementations, not guessed.
// - `fromArchive()`'s `buffer` parameter is `ArrayBuffer | Uint8Array`, not
//   `Buffer | ArrayBuffer | Uint8Array` like the Node entry -- there is no
//   `Buffer` global to accept in a browser build.

export type BrowserToArchiveOptions = {
  /** Default `true`. When `false`, skips compression and returns the raw
   * Web Bundle bytes as a `Uint8Array` instead of an `ArrayBuffer`. */
  compressed?: boolean;
};

export type BrowserFromArchiveOptions = {
  /** Default `true`. Set `false` if `buffer` is an uncompressed Web Bundle. */
  compressed?: boolean;
};

/**
 * Serializes a file Map to a (by default gzip-compressed) Web Bundle.
 * Returns an `ArrayBuffer` when compressed (the default); returns the raw
 * `Uint8Array` bundle directly when called with `{ compressed: false }`.
 * Same wire format as the Node `.` entry's `toArchive()`, which always
 * returns a `Buffer` -- the two are readable by each other regardless.
 *
 * Declared as overloads (rather than a single `Promise<ArrayBuffer |
 * Uint8Array>` signature) so a literal `{ compressed: false }` narrows the
 * return type precisely instead of forcing every caller to deal with the
 * union.
 */
export function toArchive(
  map: Map<string, FileEntry>,
  options?: { compressed?: true }
): Promise<ArrayBuffer>;
export function toArchive(
  map: Map<string, FileEntry>,
  options: { compressed: false }
): Promise<Uint8Array>;
export function toArchive(
  map: Map<string, FileEntry>,
  options?: BrowserToArchiveOptions
): Promise<ArrayBuffer | Uint8Array>;

/**
 * Deserializes a (by default gzip-compressed) Web Bundle back into a
 * `Map<string, FileEntry>`. Accepts an `ArrayBuffer` or `Uint8Array` --
 * there is no `Buffer` global in a browser build.
 */
export function fromArchive(
  buffer: ArrayBuffer | Uint8Array,
  options?: BrowserFromArchiveOptions
): Promise<Map<string, FileEntry>>;

/**
 * Returns a `(input, ctx?) => Promise<Response>` handler that serves files
 * from a `Map`/`LazyFileMap`. `input` may be a path string or a `Request`.
 * The returned function also has itself assigned to `.fetch`. Identical
 * implementation to the `.` entry's `createRouter` (both import
 * `./lib/create-router.mjs`).
 */
export function createRouter(
  files: FilesMap,
  options?: RouterOptions
): RouteHandler;

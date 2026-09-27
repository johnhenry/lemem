// Regression fixture for https://github.com/johnhenry/packfile/issues/5:
// `@johnhenry/packfile/browser` had no `types` condition and no `.d.ts` on
// disk, so this import used to fail with TS7016 ("implicitly has an 'any'
// type") under `moduleResolution: "nodenext"`/`"bundler"` (any resolver that
// actually consults the `exports` map). Imported by the *published package
// name*, not a relative path, so this only passes if the `exports` map's
// `types` condition is wired up correctly -- a relative import would bypass
// the exact thing this fixture exists to check.
import {
  toArchive,
  fromArchive,
  createRouter,
  type FileEntry,
} from "@johnhenry/packfile/browser";

async function assertBrowserTypes(): Promise<void> {
  const files: Map<string, FileEntry> = new Map([
    ["index.html", { data: new Uint8Array([1, 2, 3]), size: 3, hash: "abc" }],
  ]);

  // Default (`compressed: true`) resolves to an `ArrayBuffer`, not a
  // `Uint8Array` -- the exact divergence from the Node `.` entry's
  // `toArchive()` (which always returns a `Buffer`) that issue #5 flagged.
  const compressed: ArrayBuffer = await toArchive(files);

  // `{ compressed: false }` resolves to the raw `Uint8Array` bundle
  // instead -- both must type-check, since the return type is a union.
  const uncompressed: Uint8Array = await toArchive(files, {
    compressed: false,
  });

  const roundTripped: Map<string, FileEntry> = await fromArchive(compressed);
  await fromArchive(uncompressed, { compressed: false });

  // Also accepts a plain `ArrayBuffer`/`Uint8Array` from e.g. `fetch(...).
  // then(r => r.arrayBuffer())`, with no `Buffer` involved anywhere.
  const fromNetwork: ArrayBuffer = new ArrayBuffer(0);
  await fromArchive(fromNetwork);

  const router = createRouter(roundTripped);
  const response: Response = await router("/index.html");
  void response;
  void uncompressed;
}

void assertBrowserTypes;

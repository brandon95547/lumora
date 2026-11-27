// Just enough of the zip format to open a compressed MusicXML score (.mxl): stored and deflated
// files, inflated by the browser's own DecompressionStream, so no library is needed.

const END_OF_DIRECTORY = 0x06054b50;
const DIRECTORY_ENTRY = 0x02014b50;
const LOCAL_HEADER = 0x04034b50;

/** The files in a zip, by name, each read only when asked for: `await files.get(name)()` gives its bytes. */
export function unzip(buffer) {
  const view = new DataView(buffer);
  let end = buffer.byteLength - 22;
  while (end >= 0 && view.getUint32(end, true) !== END_OF_DIRECTORY) end--;
  if (end < 0) throw new Error('not a zip file');
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const decoder = new TextDecoder();
  const files = new Map();
  for (let i = 0; i < count; i++) {
    if (view.getUint32(at, true) !== DIRECTORY_ENTRY) throw new Error('damaged zip directory');
    const method = view.getUint16(at + 10, true);
    const size = view.getUint32(at + 20, true);
    const nameLength = view.getUint16(at + 28, true);
    const skip = nameLength + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
    const local = view.getUint32(at + 42, true);
    const name = decoder.decode(new Uint8Array(buffer, at + 46, nameLength));
    files.set(name, () => {
      if (view.getUint32(local, true) !== LOCAL_HEADER) throw new Error('damaged zip entry');
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
      const bytes = new Uint8Array(buffer, start, size);
      if (method === 0) return Promise.resolve(bytes);
      if (method !== 8) throw new Error(`zip compression ${method} is not supported`);
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return new Response(stream).arrayBuffer().then((out) => new Uint8Array(out));
    });
    at += 46 + skip;
  }
  return files;
}

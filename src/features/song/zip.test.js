import { Buffer } from 'node:buffer';
import { deflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { unzip } from './zip.js';

/** A minimal zip: one stored file and one deflated one. */
function makeZip(files) {
  const parts = [];
  const directory = [];
  let offset = 0;
  for (const [name, text, method] of files) {
    const raw = Buffer.from(text);
    const data = method === 8 ? deflateRawSync(raw) : raw;
    const nameBytes = Buffer.from(name);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(method, 10);
    entry.writeUInt32LE(data.length, 20);
    entry.writeUInt32LE(raw.length, 24);
    entry.writeUInt16LE(nameBytes.length, 28);
    entry.writeUInt32LE(offset, 42);
    parts.push(local, nameBytes, data);
    directory.push(entry, nameBytes);
    offset += 30 + nameBytes.length + data.length;
  }
  const dir = Buffer.concat(directory);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(dir.length, 12);
  end.writeUInt32LE(offset, 16);
  const all = Buffer.concat([...parts, dir, end]);
  return all.buffer.slice(all.byteOffset, all.byteOffset + all.length);
}

describe('unzip', () => {
  it('reads stored and deflated files', async () => {
    const files = unzip(
      makeZip([
        ['META-INF/container.xml', '<container/>', 0],
        ['score.xml', '<score-partwise>' + 'x'.repeat(500) + '</score-partwise>', 8],
      ]),
    );
    expect([...files.keys()]).toEqual(['META-INF/container.xml', 'score.xml']);
    const text = new TextDecoder().decode(await files.get('score.xml')());
    expect(text.startsWith('<score-partwise>')).toBe(true);
    expect(text.length).toBe(16 + 500 + 17);
  });

  it('refuses a file that is not a zip', () => {
    expect(() => unzip(new ArrayBuffer(40))).toThrow();
  });
});

/**
 * Minimal ustar writer: the worker sends the submission and test inputs to
 * the sandbox on stdin, because the sandbox has no mounts.
 */

/**
 * @param {Array<{ name: string, data: string | Buffer }>} files
 * @returns {Buffer}
 */
export function createTar(files) {
  /** @type {Buffer[]} */
  const parts = [];
  for (const file of files) {
    const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data, 'utf8');
    if (Buffer.byteLength(file.name) > 99) throw new Error(`tar: name too long: ${file.name}`);
    const header = Buffer.alloc(512, 0);
    header.write(file.name, 0, 'utf8');
    header.write('0000644\0', 100, 'ascii'); // mode
    header.write('0000000\0', 108, 'ascii'); // uid
    header.write('0000000\0', 116, 'ascii'); // gid
    header.write(`${data.length.toString(8).padStart(11, '0')}\0`, 124, 'ascii');
    header.write('00000000000\0', 136, 'ascii'); // mtime
    header.write('        ', 148, 'ascii'); // checksum placeholder
    header.write('0', 156, 'ascii'); // regular file
    header.write('ustar\0', 257, 'ascii');
    header.write('00', 263, 'ascii');
    let sum = 0;
    for (const byte of header) sum += byte;
    header.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148, 'ascii');
    parts.push(header, data, Buffer.alloc((512 - (data.length % 512)) % 512, 0));
  }
  parts.push(Buffer.alloc(1024, 0));
  return Buffer.concat(parts);
}

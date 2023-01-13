import { test } from 'uvu';
import assert from 'uvu/assert';

import { Codec } from './codec';
import { randomUintN } from './codec/bitstream';

test('Codec estimates compressed size', _ => {
  const codec = new Codec();

  // all numbers fit in a 1-byte bitmap + codec ID
  assert.equal(codec.estimateSize([1n, 2n, 4n, 5n, 7n]), 2);

  // each number is encoded as 1 byte + 1 byte representing width + codec ID
  assert.equal(codec.estimateSize([1n, 255n]), 4);
});

test('Packs and unpacks 1 to 256-bit numbers', _ => {
  // test these widths: 1, 2, 3, ..36, 46, 56, .. 246, 256
  for (let n = 1; n <= 256; n += n < 36 ? 1 : 10) {
    const set: Set<bigint> = new Set();
    const max_count = 1 << Math.min(n - 1, 12);

    // test various counts
    for (let count = 1; count <= max_count; count = Math.ceil(count * 1.5)) {
      for (let i = 0; i < count; i++) {
        set.add(randomUintN(n));
      }

      count = set.size;

      const numbers = Array.from(set);

      numbers.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);

      const codec = new Codec();
      const bytes = codec.encode(numbers);
      const unpacked = codec.decode(bytes);

      assert.equal(unpacked, numbers);
    }
  }
});

test.run();

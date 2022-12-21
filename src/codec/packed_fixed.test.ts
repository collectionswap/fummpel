import { test } from "uvu";
import * as assert from "uvu/assert";

import { PackedFixed } from "./packed_fixed";
import { randomUintN } from "./bitstream";

test("Packs and unpacks 5 3-bit numbers into 2 bytes", (_) => {
  const numbers = [1n, 2n, 4n, 5n, 7n];
  const codec = new PackedFixed();

  assert.is(codec.estimateSize(numbers), 3);

  const bytes = codec.encode(numbers);

  assert.is(bytes.length, 3);

  const unpacked = codec.decode(bytes);

  assert.equal(unpacked, numbers);
});

test("Packs and unpacks 1 to 256-bit numbers", (_) => {
  // 1, 2, 3, ..36, 46, 56, .. 246, 256
  for (let n = 1; n <= 256; n += n < 36 ? 1 : 10) {
    const set: Set<bigint> = new Set();

    let count = 1 << Math.min(n - 1, 12);

    for (let i = 0; i < count; i++) {
      set.add(randomUintN(n));
    }

    count = set.size;

    const numbers = Array.from(set);

    numbers.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    const codec = new PackedFixed();
    const bytes = codec.encode(numbers);
    const unpacked = codec.decode(bytes);

    assert.equal(unpacked, numbers);
  }
});

test.run();

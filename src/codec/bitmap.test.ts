import { test } from "uvu";
import * as assert from "uvu/assert";

const { Bitmap } = require("./bitmap");
const { randomUintN } = require("./bitstream");

test("Packs and unpacks numbers up to 22n into a 3 byte bitmap", (_) => {
  const numbers = [1n, 2n, 4n, 5n, 7n, 16n];
  const codec = new Bitmap();

  assert.is(codec.estimateSize(numbers), 3);

  const bytes = codec.encode(numbers);

  assert.is(bytes.length, 3);
  assert.is(bytes[0], Number("0b01101101"));
  assert.is(bytes[1], Number("0b00000000"));
  assert.is(bytes[2], Number("0b10000000"));

  const unpacked = codec.decode(bytes);

  assert.equal(unpacked, numbers);
});

test("Packs and unpacks 1 to 24-bit numbers", (_) => {
  const nn = [1, 2, 3, 5, 8, 12, 15, 18, 21, 24];

  for (const n of nn) {
    const set: Set<bigint> = new Set();

    let count = 1 << Math.min(n - 1, 12);

    for (let i = 0; i < count; i++) {
      set.add(randomUintN(n));
    }

    count = set.size;

    const numbers = Array.from(set);

    numbers.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    const codec = new Bitmap();
    const bytes = codec.encode(numbers);
    const unpacked = codec.decode(bytes);

    assert.equal(unpacked, numbers);
  }
});

test.run();

import { test } from "uvu";
import * as assert from "uvu/assert";

const {
  BitStreamReader,
  BitStreamWriter,
  bitWidth,
  randomUintN,
} = require("./bitstream");

test("BitStreamReader packs bits", (_) => {
  const bytes = "0b10111011 0b11001010 0b10101010 0b10111111"
    .split(" ")
    .map(Number);
  const reader = new BitStreamReader(new Uint8Array(bytes));
  // @ts-ignore
  assert.throws((_) => reader.read(0));
  // @ts-ignore
  assert.throws((_) => reader.read(257));
  assert.is(reader.read(3), 5n);
  assert.is(reader.read(5), 27n);
  assert.is(reader.read(10), 810n);
  assert.is(reader.read(1), 1n);
  assert.is(reader.read(1), 0n);
  assert.is(reader.read(3), 5n);
  assert.is(reader.read(3), 2n);
  assert.is(reader.read(6), 63n);
  // @ts-ignore
  assert.throws((_) => reader.read(1));
});

test("BitStreamWriter writes bits", (_) => {
  const writer = new BitStreamWriter();

  // @ts-ignore
  assert.throws((_) => writer.write(0, 0n));
  // @ts-ignore
  assert.throws((_) => writer.write(-1, 0n));
  // @ts-ignore
  assert.throws((_) => writer.write(0.1, 0n));
  // @ts-ignore
  assert.throws((_) => writer.write(8, -1n));
  // @ts-ignore
  assert.throws((_) => writer.write(257, 1n));
  // @ts-ignore
  assert.throws((_) => writer.write(2, 4n));

  writer.write(3, BigInt("0b101"));
  writer.write(4, BigInt("0b101"));
  writer.write(8, BigInt("0b11000011"));
  writer.write(1, BigInt("0b1"));
  assert.is(writer.dump().substr(0, 18), "10101011 10000111 ");

  writer.write(1, BigInt("0b0"));
  writer.write(9, BigInt("0b1010"));
  writer.write(25, BigInt("0b1100000000000000000000011"));

  assert.is(
    writer.dump().substr(18, 45),
    "00000010 10110000 00000000 00000000 01100000 "
  );

  writer.write(14, BigInt("0b1")); // should expand with default initial 8 bytes
  assert.is(writer.dump().substr(72, 9), "10000000 ");
});

test("BitStreamReader throws if reading past end", (_) => {
  const bytes = "0b10111011 0b11001010".split(" ").map(Number);
  const reader = new BitStreamReader(new Uint8Array(bytes));
  assert.is(reader.read(9), 375n);
  assert.is(reader.read(7), 74n);
  // @ts-ignore
  assert.throws((_) => reader.read(1));

  const reader2 = new BitStreamReader(new Uint8Array(bytes));
  // @ts-ignore
  assert.throws((_) => reader2.read(17));
});

test("Round-trip random fuzzing", (_) => {
  const numbers = [];
  let bits = new BitStreamWriter();

  for (let i = 0; i < 100000; i++) {
    // pick random bit length of integer
    const n = Math.floor(256 * Math.random()) + 1;
    const x = randomUintN(n);

    bits.write(n, x);
    // @ts-ignore
    numbers.push({ n, x });
  }

  const verify = new BitStreamReader(bits.bytes());

  const output = numbers.map(({ n, x }) => ({ n, x: verify.read(n) }));
  assert.equal(output, numbers);
});

test("BigInt bitWidth fuzzing", (_) => {
  for (let i = 0; i < 100000; i++) {
    // pick random bit length of integer
    const n = Math.floor(256 * Math.random()) + 1;
    const x = randomUintN(n);
    const width = bitWidth(x);

    assert.ok(x >= 1n << BigInt(width - 1));
    assert.ok(x < 1n << BigInt(width));
  }
});

test.run();

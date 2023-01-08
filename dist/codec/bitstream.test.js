"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uvu_1 = require("uvu");
const assert_1 = __importDefault(require("uvu/assert"));
const bitstream_1 = require("./bitstream");
(0, uvu_1.test)('BitStreamReader packs bits', _ => {
    const bytes = '0b10111011 0b11001010 0b10101010 0b10111111'.split(' ').map(Number);
    const reader = new bitstream_1.BitStreamReader(new Uint8Array(bytes));
    assert_1.default.throws(_ => reader.read(0));
    assert_1.default.throws(_ => reader.read(257));
    assert_1.default.is(reader.read(3), 5n);
    assert_1.default.is(reader.read(5), 27n);
    assert_1.default.is(reader.read(10), 810n);
    assert_1.default.is(reader.read(1), 1n);
    assert_1.default.is(reader.read(1), 0n);
    assert_1.default.is(reader.read(3), 5n);
    assert_1.default.is(reader.read(3), 2n);
    assert_1.default.is(reader.read(6), 63n);
    assert_1.default.throws(_ => reader.read(1));
});
(0, uvu_1.test)('BitStreamWriter writes bits', _ => {
    const writer = new bitstream_1.BitStreamWriter();
    assert_1.default.throws(_ => writer.write(0, 0n));
    assert_1.default.throws(_ => writer.write(-1, 0n));
    assert_1.default.throws(_ => writer.write(0.1, 0n));
    assert_1.default.throws(_ => writer.write(8, -1n));
    assert_1.default.throws(_ => writer.write(257, 1n));
    assert_1.default.throws(_ => writer.write(2, 4n));
    writer.write(3, BigInt('0b101'));
    writer.write(4, BigInt('0b101'));
    writer.write(8, BigInt('0b11000011'));
    writer.write(1, BigInt('0b1'));
    assert_1.default.is(writer.dump().substr(0, 18), '10101011 10000111 ');
    writer.write(1, BigInt('0b0'));
    writer.write(9, BigInt('0b1010'));
    writer.write(25, BigInt('0b1100000000000000000000011'));
    assert_1.default.is(writer.dump().substr(18, 45), '00000010 10110000 00000000 00000000 01100000 ');
    writer.write(14, BigInt('0b1')); // should expand with default initial 8 bytes
    assert_1.default.is(writer.dump().substr(72, 9), '10000000 ');
});
(0, uvu_1.test)("BitStreamReader throws if reading past end", _ => {
    const bytes = '0b10111011 0b11001010'.split(' ').map(Number);
    const reader = new bitstream_1.BitStreamReader(new Uint8Array(bytes));
    assert_1.default.is(reader.read(9), 375n);
    assert_1.default.is(reader.read(7), 74n);
    assert_1.default.throws(_ => reader.read(1));
    const reader2 = new bitstream_1.BitStreamReader(new Uint8Array(bytes));
    assert_1.default.throws(_ => reader2.read(17));
});
(0, uvu_1.test)('Round-trip random fuzzing', _ => {
    const numbers = [];
    let bits = new bitstream_1.BitStreamWriter();
    for (let i = 0; i < 100000; i++) {
        // pick random bit length of integer
        const n = Math.floor(256 * Math.random()) + 1;
        const x = (0, bitstream_1.randomUintN)(n);
        bits.write(n, x);
        numbers.push({ n, x });
    }
    const verify = new bitstream_1.BitStreamReader(bits.bytes());
    const output = numbers.map(({ n, x }) => ({ n, x: verify.read(n) }));
    assert_1.default.equal(output, numbers);
});
(0, uvu_1.test)('BigInt bitWidth fuzzing', _ => {
    for (let i = 0; i < 100000; i++) {
        // pick random bit length of integer
        const n = Math.floor(256 * Math.random()) + 1;
        const x = (0, bitstream_1.randomUintN)(n);
        const width = (0, bitstream_1.bitWidth)(x);
        assert_1.default.ok(x >= 1n << BigInt(width - 1));
        assert_1.default.ok(x < 1n << BigInt(width));
    }
});
uvu_1.test.run();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uvu_1 = require("uvu");
const assert_1 = __importDefault(require("uvu/assert"));
const bitmap_1 = __importDefault(require("./bitmap"));
const bitstream_1 = require("./bitstream");
(0, uvu_1.test)('Packs and unpacks numbers up to 22n into a 3 byte bitmap', _ => {
    const numbers = [1n, 2n, 4n, 5n, 7n, 16n];
    const codec = new bitmap_1.default();
    assert_1.default.is(codec.estimateSize(numbers), 3);
    const bytes = codec.encode(numbers);
    assert_1.default.is(bytes.length, 3);
    assert_1.default.is(bytes[0], Number('0b01101101'));
    assert_1.default.is(bytes[1], Number('0b00000000'));
    assert_1.default.is(bytes[2], Number('0b10000000'));
    const unpacked = codec.decode(bytes);
    assert_1.default.equal(unpacked, numbers);
});
(0, uvu_1.test)('Packs and unpacks 1 to 24-bit numbers', _ => {
    const nn = [1, 2, 3, 5, 8, 12, 15, 18, 21, 24];
    for (const n of nn) {
        const set = new Set();
        let count = 1 << Math.min(n - 1, 12);
        for (let i = 0; i < count; i++) {
            set.add((0, bitstream_1.randomUintN)(n));
        }
        count = set.size;
        const numbers = Array.from(set);
        numbers.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
        const codec = new bitmap_1.default();
        const bytes = codec.encode(numbers);
        const unpacked = codec.decode(bytes);
        assert_1.default.equal(unpacked, numbers);
    }
});
uvu_1.test.run();

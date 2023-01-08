"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uvu_1 = require("uvu");
const assert_1 = __importDefault(require("uvu/assert"));
const packed_fixed_1 = __importDefault(require("./packed_fixed"));
const bitstream_1 = require("./bitstream");
(0, uvu_1.test)('Packs and unpacks 5 3-bit numbers into 2 bytes', _ => {
    const numbers = [1n, 2n, 4n, 5n, 7n];
    const codec = new packed_fixed_1.default();
    assert_1.default.is(codec.estimateSize(numbers), 3);
    const bytes = codec.encode(numbers);
    assert_1.default.is(bytes.length, 3);
    const unpacked = codec.decode(bytes);
    assert_1.default.equal(unpacked, numbers);
});
(0, uvu_1.test)('Packs and unpacks 1 to 256-bit numbers', _ => {
    // 1, 2, 3, ..36, 46, 56, .. 246, 256
    for (let n = 1; n <= 256; n += n < 36 ? 1 : 10) {
        const set = new Set();
        let count = 1 << Math.min(n - 1, 12);
        for (let i = 0; i < count; i++) {
            set.add((0, bitstream_1.randomUintN)(n));
        }
        count = set.size;
        const numbers = Array.from(set);
        numbers.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
        const codec = new packed_fixed_1.default();
        const bytes = codec.encode(numbers);
        const unpacked = codec.decode(bytes);
        assert_1.default.equal(unpacked, numbers);
    }
});
uvu_1.test.run();

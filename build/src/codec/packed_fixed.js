"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackedFixed = void 0;
const bitstream_1 = require("./bitstream");
class PackedFixed {
    decode(bytes) {
        const reader = new bitstream_1.BitStreamReader(bytes);
        const width = Number(reader.read(8)) + 1;
        const numbers = [];
        let last = -1n;
        while (true) {
            let n;
            try {
                n = reader.read(width);
            }
            catch (_) {
                break; // end of stream
            }
            if (n <= last) {
                break; // numbers are sorted, must have read partial bits at end
            }
            numbers.push(n);
            last = n;
        }
        return numbers;
    }
    estimateSize(numbers) {
        const width = Math.max((0, bitstream_1.bitWidth)(numbers[numbers.length - 1]), 1);
        // 1 byte for bit width and count * width rounded up to next byte
        return 1 + Math.ceil((numbers.length * width) / 8);
    }
    encode(numbers) {
        const writer = new bitstream_1.BitStreamWriter();
        const width = Math.max((0, bitstream_1.bitWidth)(numbers[numbers.length - 1]), 1);
        writer.write(8, BigInt(width - 1));
        for (let i = 0; i < numbers.length; i++) {
            writer.write(width, numbers[i]);
        }
        return writer.bytes();
    }
}
exports.PackedFixed = PackedFixed;

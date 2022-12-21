"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bitmap = void 0;
// Bitmap stores numbers with the 0th item starting in the most-significant bit of byte 0
class Bitmap {
    decode(bytes) {
        const numbers = [];
        for (let i = 0; i < bytes.length; i++) {
            let n = bytes[i] << 24; // align left to 32-bits
            let s = 0; // how much we have shifted for this byte
            while (true) {
                // find next 1-bit from left
                const clz = Math.clz32(n);
                if (clz > 7) {
                    break;
                }
                numbers.push(BigInt((i << 3) + s + clz));
                // throw away leftmost 1-bit
                n <<= clz + 1;
                s += clz + 1;
            }
        }
        return numbers;
    }
    // numbers must be sorted
    estimateSize(numbers) {
        // Bitmap is encoded only up to largest number. There is precision
        // loss above 2^53 but that's already a stupid amount of memory.
        // + 1n because numbers are zero-indexed
        return Math.ceil(Number(numbers[numbers.length - 1] + 1n) / 8);
    }
    // numbers must be sorted
    encode(numbers) {
        const size = this.estimateSize(numbers);
        // limit max to 2^32 / 4GB(!) bitmap so we can use bitwise ops
        if (size >= Math.pow(2, 32)) {
            throw "Bitmap too large";
        }
        const bytes = new Uint8Array(size);
        for (let i = 0; i < numbers.length; i++) {
            const n = Number(numbers[i]);
            bytes[Math.floor(n / 8)] |= 128 >> (n & 7);
        }
        return bytes;
    }
}
exports.Bitmap = Bitmap;

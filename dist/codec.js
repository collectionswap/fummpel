"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Codec = void 0;
const bitmap_1 = __importDefault(require("./codec/bitmap"));
const packed_fixed_1 = __importDefault(require("./codec/packed_fixed"));
const CODECS = {
    // Simple bitmap where LSb..MSb of first byte stores the number 0..7 etc.
    1: bitmap_1.default,
    // Packed as fixed-width IDs, starting from MSb
    8: packed_fixed_1.default,
    // Each ID is prefixed with 1 byte indicating length (bits) of ID
    // 9: VarPacked,
    // Fixed-wdth deltas between IDs
    //10: DeltaFixedPacked,
    // Delta encoded, then each delta prefixed with 1 byte indicating length in bits
    //12: DeltaVarPacked,
};
/**
 * Encodes / decodes 256-bit numbers as compactly as possible
 */
class Codec {
    constructor() {
        this.codecs = Object.fromEntries(Object.entries(CODECS).map(([id, codec]) => [id, new codec()]));
    }
    decode(bytes) {
        const codec = this.codecs[bytes[0]];
        if (!codec) {
            throw 'Unknown codec: ' + bytes[0];
        }
        const numbers = codec.decode(bytes.slice(1));
        return numbers;
    }
    estimateSize(numbers) {
        const estimates = Object.values(this.codecs).map(c => c.estimateSize(numbers));
        // 1 byte for codec ID
        return 1 + Math.min(...estimates);
    }
    encode(numbers) {
        let minSize = Infinity;
        let best;
        ;
        for (const _id in this.codecs) {
            const id = +_id;
            const codec = this.codecs[id];
            const estimatedSize = codec.estimateSize(numbers);
            if (isNaN(estimatedSize) || estimatedSize <= 0 || estimatedSize == Infinity) {
                // could not estimate size, actually encode to get size
                const encoded = codec.encode(numbers);
                if (encoded.length < minSize) {
                    minSize = encoded.length;
                    best = { codec, id, encoded };
                }
                continue;
            }
            if (estimatedSize < minSize) {
                minSize = estimatedSize;
                best = { codec, id, encoded: null };
            }
        }
        if (!best) {
            throw 'no codec found';
        }
        if (best.encoded == null) {
            best.encoded = best.codec.encode(numbers);
        }
        // have to copy bytes to prepend codec ID header, sad
        const output = new Uint8Array(best.encoded.length + 1);
        output[0] = best.id;
        output.set(best.encoded, 1);
        return output;
    }
}
exports.Codec = Codec;

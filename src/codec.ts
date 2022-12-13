import { Bitmap } from "./codec/bitmap";
import { PackedFixed } from "./codec/packed_fixed";

export interface ICodec {
  /**
   * Decodes given bytestream
   */
  decode(bytes: Uint8Array): Array<bigint>;

  /**
   * Estimates encoded output size in bytes, numbers MUST sorted
   */
  estimateSize(numbers: Array<bigint>): number;

  /**
   * Encodes numbers, MUST be sorted
   */
  encode(numbers: Array<bigint>): Uint8Array;
}

const CODECS: { [index: number]: new () => ICodec } = {
  // Simple bitmap where LSb..MSb of first byte stores the number 0..7 etc.
  1: Bitmap,

  // Packed as fixed-width IDs, starting from MSb
  8: PackedFixed,

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
export class Codec implements ICodec {
  codecs: { [index: number]: ICodec };

  constructor() {
    this.codecs = Object.fromEntries(
      Object.entries(CODECS).map(([id, codec]) => [id, new codec()])
    );
  }

  decode(bytes: Uint8Array): Array<bigint> {
    const codec = this.codecs[bytes[0]];

    if (!codec) {
      throw "Unknown codec: " + bytes[0];
    }

    const numbers = codec.decode(bytes.slice(1));

    return numbers;
  }

  estimateSize(numbers: Array<bigint>): number {
    const estimates = Object.values(this.codecs).map((c) =>
      c.estimateSize(numbers)
    );

    // 1 byte for codec ID
    return 1 + Math.min(...estimates);
  }

  encode(numbers: Array<bigint>): Uint8Array {
    let minSize = Infinity;
    let best: { codec: ICodec; id: number; encoded: Uint8Array };

    for (const _id in this.codecs) {
      const id = +_id;
      const codec = this.codecs[id];
      const estimatedSize = codec.estimateSize(numbers);

      if (
        isNaN(estimatedSize) ||
        estimatedSize <= 0 ||
        estimatedSize == Infinity
      ) {
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
        // @ts-ignore
        best = { codec, id, encoded: null };
      }
    }

    // @ts-ignore
    if (!best) {
      throw "no codec found";
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

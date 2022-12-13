const TWO_POW: Array<bigint> = [];

for (let b = 0, t = 1n; b <= 256; b++, t <<= 1n) {
  TWO_POW.push(t);
}

/**
 * Reads arbitrary width bits by treating a Uint8Array as a byte stream starting from first byte
 * and reading from the most-significant bits (MSb) in the same bit order
 */
export class BitStreamReader {
  bits: Uint8Array;
  cursor: number;

  constructor(bytes: Uint8Array) {
    this.bits = bytes;
    this.cursor = 0; // in bits
  }

  /**
   * Reads n-bit bigint and advance cursor
   * @param {number} n - Number of bits to read
   * @returns {bigint} n-bit number read
   */
  read(n: number): bigint {
    assert(Number.isInteger(n) && n > 0 && n <= 256);
    assert(Math.ceil((this.cursor + n) / 8) <= this.bits.length);

    // byte index to start reading MSb from
    let i = Math.floor(this.cursor / 8);

    // initial partial bits to write if remaining space in cursor is less than a byte
    const partialBits = (8 - this.cursor) & 7;

    this.cursor += n;

    let output = 0n;

    if (partialBits > 0) {
      output = BigInt(this.bits[i++] & ((1 << partialBits) - 1));
      n -= partialBits;

      if (n < 0) {
        output >>= BigInt(-n);
        n = 0;
      }
    }

    // read full bytes
    while (n >= 8) {
      output <<= 8n;
      output |= BigInt(this.bits[i++]);
      n -= 8;
    }

    // read remaining partial bits
    if (n > 0) {
      output <<= BigInt(n);
      output |= BigInt(this.bits[i] >> (8 - n));
    }

    return output;
  }
}

export class BitStreamWriter {
  bits: Uint8Array;
  lengthBits: number;

  constructor(bytes: Uint8Array = new Uint8Array(8)) {
    this.bits = bytes;
    this.lengthBits = 0;
  }

  write(lengthBits: number, bits: bigint) {
    assert(
      Number.isInteger(lengthBits) && lengthBits > 0 && lengthBits <= 256,
      "bad width"
    );
    assert(bits >= 0n && bits < TWO_POW[lengthBits], "bad data range");

    // byte index where we start writing the MSb
    const startByte = Math.floor(this.lengthBits / 8);
    this.lengthBits += lengthBits;

    // last byte index we write a full byte (least-significant)
    const endFullByte = Math.floor(this.lengthBits / 8) - 1;

    // last byte index we will touch
    const endByte = Math.ceil(this.lengthBits / 8) - 1;

    // if not ending on a byte boundary, endByte + 1 has this number of bits
    const endPartialBits = this.lengthBits & 7;

    // ensure buffer is big enough
    if (this.bits.length < endByte + 1) {
      const moreBits = new Uint8Array((endByte + 1) * 2);

      moreBits.set(this.bits);

      this.bits = moreBits;
    }

    // note that we start writing from the end to reduce math operations on bits

    if (endPartialBits > 0) {
      // wrte partial LSb first
      const lsb = Number(BigInt.asUintN(endPartialBits, bits));
      this.bits[endByte] |= lsb << (8 - endPartialBits);
      bits >>= BigInt(endPartialBits);
    }

    for (let i = endFullByte; i >= startByte; i--) {
      this.bits[i] |= Number(BigInt.asUintN(8, bits));
      bits >>= 8n;
    }
  }

  bytes() {
    const lastByte = Math.ceil(this.lengthBits / 8);

    return this.bits.subarray(0, lastByte);
  }

  dump() {
    return Array.from(this.bits, (x) =>
      ("0000000" + x.toString(2)).substr(-8)
    ).join(" ");
  }
}

function assert(test: boolean, msg: string = "failed") {
  if (!test) {
    throw msg;
  }
}

// returns minimum number of bits needed to represent n
export function bitWidth(n: bigint) {
  for (let log2 = 0; ; log2 += 32) {
    const n32 = n >> 32n;

    if (n32 == 0n) {
      return log2 + 32 - Math.clz32(Number(n));
    }

    n = n32;
  }
}

const TWO_POW_32 = Math.pow(2, 32);

export function randomUintN(n: number) {
  let x = 0n,
    nn = n;

  while (nn >= 32) {
    x <<= 32n;
    x |= BigInt(Math.floor(TWO_POW_32 * Math.random()));
    nn -= 32;
  }

  if (nn > 0) {
    x <<= BigInt(nn);
    x |= BigInt(Math.floor(TWO_POW_32 * Math.random()) >>> (32 - nn));
  }

  return x;
}

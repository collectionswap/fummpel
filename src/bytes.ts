/**
 * Helper functions for 32-byte/256-bit bytes. Some functions have no length restriction.
 *
 * Bytes can be represented as:
 *   * Uint8Array
 *   * string (hex, with or without leading '0x')
 *   * bigint (typically fixed-length)
 *
 *   bigints are right-aligned, effectively big-endian
 */

const HEX = [];

for (let i = 0; i < 256; i++) {
  HEX[i] = i.toString(16).padStart(2, '0');
}

/**
 * Converts Uint8Array to hex string without leading '0x'. Arbitrary length.
 */
export function hex(input: Uint8Array): string {
  let hex = '';

  for (let byte of input) {
    hex += HEX[byte];
  }

  return hex;
}

/**
 * Sort function for Array.sort for Uint8Arrays, 32-byte only.
 */
export function compareBytes32(a: Uint8Array, b: Uint8Array): number {
  for (let i = 0; i < 32; i++) {
    if (a[i] !== b[i]) {
      return a[i]! - b[i]!;
    }
  }

  return 0;
}

/**
 * > for Uint8Array, 32-byte only.
 */
export function gt32(a: Uint8Array, b: Uint8Array): boolean {
  for (let i = 0; i < 32; i++) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }

  return false;
}

/*
 * Converts 32 bytes to a bigint representation.
 * Allows use of bytes as keys in Maps, which is faster than by converting to strings.
 */
export function bigint256(bytes: Uint8Array): bigint {
  let b = 0n;

  for (let i = 0; i < 32; i += 4) {
    // unrolled for performance + reduce calls to BigInt
    const bits32 =
      (bytes[i    ] << 24) +
      (bytes[i + 1] << 16) +
      (bytes[i + 2] <<  8) +
      (bytes[i + 3]);

    b = (b << 32n) + BigInt(bits32);
  }

  return b;
}

/**
 * Convert bigint to 32 byte Uint8Array
 */
export function uint8array32(input: bigint): Uint8Array {
  const bytes = new Uint8Array(32);

  for (let i = 31; i >= 0; i -= 4) {
    let n32 = Number(BigInt.asUintN(32, input));
    bytes[i    ] = (n32      ) & 255;
    bytes[i - 1] = (n32 >>  8) & 255;
    bytes[i - 2] = (n32 >> 16) & 255;
    bytes[i - 3] = (n32 >> 24) & 255;
    input >>= 32n;
  }

  return bytes;
}

/**
 * Convert to 32 byte hex string from 256-bit bigint or Uint8Array
 */
export function bytes32(input: bigint|Uint8Array): string {
  if (typeof input == 'bigint') {
    if (input >= 1n << 256n) {
      throw 'larger than 256-bit'
    }

    return '0x' + input.toString(16).padStart(64, '0');
  }

  if (input.length != 32) {
    throw 'only 32 bytes accepted'
  }

  return '0x' + hex(input);
}

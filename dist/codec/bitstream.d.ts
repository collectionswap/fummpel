/**
 * Reads arbitrary width bits by treating a Uint8Array as a byte stream starting from first byte
 * and reading from the most-significant bits (MSb) in the same bit order
 */
export declare class BitStreamReader {
    bits: Uint8Array;
    cursor: number;
    constructor(bytes: Uint8Array);
    /**
     * Reads n-bit bigint and advance cursor
     * @param {number} n - Number of bits to read
     * @returns {bigint} n-bit number read
     */
    read(n: number): bigint;
}
export declare class BitStreamWriter {
    bits: Uint8Array;
    lengthBits: number;
    constructor(bytes?: Uint8Array);
    write(lengthBits: number, bits: bigint): void;
    bytes(): Uint8Array;
    dump(): string;
}
export declare function bitWidth(n: bigint): number;
export declare function randomUintN(n: number): bigint;

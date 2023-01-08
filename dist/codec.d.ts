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
/**
 * Encodes / decodes 256-bit numbers as compactly as possible
 */
export declare class Codec implements ICodec {
    codecs: {
        [index: number]: ICodec;
    };
    constructor();
    decode(bytes: Uint8Array): Array<bigint>;
    estimateSize(numbers: Array<bigint>): number;
    encode(numbers: Array<bigint>): Uint8Array;
}

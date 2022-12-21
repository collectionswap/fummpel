export declare class Bitmap {
    decode(bytes: Uint8Array): Array<bigint>;
    estimateSize(numbers: Array<bigint>): number;
    encode(numbers: Array<bigint>): Uint8Array;
}

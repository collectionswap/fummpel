export declare class PackedFixed {
    decode(bytes: Uint8Array): Array<bigint>;
    estimateSize(numbers: Array<bigint>): number;
    encode(numbers: Array<bigint>): Uint8Array;
}

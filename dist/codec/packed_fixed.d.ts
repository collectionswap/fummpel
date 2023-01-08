import { ICodec } from '../codec';
export default class PackedFixed implements ICodec {
    decode(bytes: Uint8Array): Array<bigint>;
    estimateSize(numbers: Array<bigint>): number;
    encode(numbers: Array<bigint>): Uint8Array;
}

export declare function makeMerkleTree(leaves: Uint8Array[]): Uint8Array[];
export interface MultiProof {
    leaves: Uint8Array[];
    proof: Uint8Array[];
    proofFlags: boolean[];
}
export declare function getMultiProof(tree: Uint8Array[], indices: number[]): MultiProof;
export declare class MerkleTree {
    private readonly hashLookup;
    private readonly tree;
    private readonly values;
    private readonly treeIndex;
    constructor(values: Uint8Array[]);
    static init(): Promise<void>;
    get root(): string;
    leafHash(leaf: Uint8Array): bigint;
    leafLookup(leaf: Uint8Array): number;
    getMultiProof(leaves: (number | Uint8Array)[]): MultiProof;
    private validateValue;
}
/**
 * Convert Uint8Array to 32 byte hex string without leading '0x'
 */
export declare function hex(input: Uint8Array): string;
export declare function compareBytes32(a: Uint8Array, b: Uint8Array): number;
export declare function gt(a: Uint8Array, b: Uint8Array): boolean;
export declare function checkBounds(array: unknown[], index: number): void;
export declare function throwError(message?: string): never;

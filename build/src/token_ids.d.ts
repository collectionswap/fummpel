import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
/**
 * TokenIDs
 */
export declare class TokenIDs {
    tokenIDs: Set<bigint>;
    encoded: Uint8Array;
    _tree: StandardMerkleTree<Array<string>>;
    constructor(tokenIDs: Iterable<bigint>);
    /**
     * Decode tokens from a compressed byte stream.
     */
    static decode(bytes: Uint8Array): TokenIDs;
    /**
     * Gets compressed binary representation of all token IDs
     */
    encode(): Uint8Array;
    /**
     * Generates Merkle multi-proof for subset of token IDs
     */
    proof(subset: Iterable<bigint>): import("@openzeppelin/merkle-tree/dist/core").MultiProof<string, string[]>;
    /**
     * Gets Merkle tree root hash
     */
    root(): string;
    /**
     * Gets list of token IDs represented by this TokenIDs instance as a sorted array
     */
    tokens(): bigint[];
    /**
     * Verify multiproof using essentially the same algo in OpenZeppelin's smart contract
     */
    verify(proof: string[], flags: boolean[], leaves: string[][]): boolean;
    private tree;
}
/**
 * returns a 256-bit number n as a full 32-byte hex string starting with 0x
 */
export declare function bytes32(n: bigint): string;

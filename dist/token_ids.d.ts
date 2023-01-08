import { MerkleTree } from './merkle';
/**
 * TokenIDs
 */
export default class TokenIDs {
    tokenIDs: Set<bigint>;
    encoded: Uint8Array;
    _tree: MerkleTree;
    static init(): Promise<void>;
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
    proof(subset: Iterable<bigint>): {
        leaves: bigint[];
        proof: string[];
        proofFlags: boolean[];
    };
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
    verify(proof: string[], flags: boolean[], leaves: bigint[]): boolean;
    private tree;
}
/**
 * Convert to 32 byte hex string from 256-bit bigint or Uint8Array
 */
export declare function bytes32(input: bigint | Uint8Array): string;

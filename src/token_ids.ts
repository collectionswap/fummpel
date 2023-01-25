import { bigint256, hex, uint8array32 } from './bytes';
import { Codec } from './codec';
import { MerkleTree, verify } from './merkle';

/**
 * TokenIDs
 */
export default class TokenIDs {
  tokenIDs: Set<bigint>;
  encoded: Uint8Array;
  _tree: MerkleTree;

  static async init() {
    await MerkleTree.init();
  }

  constructor(tokenIDs: Iterable<bigint>) {
    this.tokenIDs = new Set(tokenIDs);
  }

  /**
   * Decode tokens from a compressed byte stream.
   */
  static decode(bytes: Uint8Array): TokenIDs {
    const decoder = new Codec();
    const tokens = decoder.decode(bytes.slice(2));
    const tokenIDs = new TokenIDs(tokens);

    return tokenIDs;
  }

  /**
   * Verify multiproof for given root. Note that leaves order is significant.
   */
  static verify(root: string, proof: string[], proofFlags: boolean[], leaves: bigint[]): boolean {
    return verify(hexToBytes(root), {
      proof: proof.map(hexToBytes),
      proofFlags,
      leaves: leaves.map(uint8array32),
    });
  }

  /**
   * Gets compressed binary representation of all token IDs
   */
  encode() {
    if (!this.encoded) {
      const sorted = Array.from(this.tokenIDs);
      sorted.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);

      const bytes = new Codec().encode(sorted);

      // have to copy bytes to prepend 2 byte format header, sad
      const encoded = new Uint8Array(bytes.length + 2);

      // header is currently unused
      encoded.set(bytes, 2);

      this.encoded = encoded;
    }

    return this.encoded;
  }

  /**
   * Generates Merkle multi-proof for subset of token IDs
   */
  proof(subset: Iterable<bigint>) {
    const uint8s = Array.from(new Set(subset), uint8array32);
    const { proof, proofFlags, leaves } = this.tree().getMultiProof(uint8s);

    const ids = leaves.map(bigint256);

    return { leaves: ids, proof: proof.map(b => '0x' + hex(b)), proofFlags };
  }

  /**
   * Gets Merkle tree root hash
   */
  root() {
    return '0x' + hex(this.tree().root);
  }

  /**
   * Gets list of token IDs represented by this TokenIDs instance as a sorted array
   */
  tokens() {
    return Array.from(this.tokenIDs).sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  }

  /**
   * Verify multiproof for this tree. Note that leaves order is significant.
   */
  verify(proof: string[], proofFlags: boolean[], leaves: bigint[]): boolean {
    return verify(hexToBytes(this.root()), {
      proof: proof.map(hexToBytes),
      proofFlags,
      leaves: leaves.map(uint8array32),
    });
  }

  private tree() {
    if (!this._tree) {
      const tokensUint8array = Array.from(this.tokenIDs, uint8array32);
      this._tree = new MerkleTree(tokensUint8array);
    }

    return this._tree;
  }
}

/**
 * Convert 0x hex string to 32 byte Uint8Array
 */
export function hexToBytes(input: string): Uint8Array {
  if (input[0] != '0' && input[1] != 'x') {
    throw 'not hex';
  }

  const hex = input.substr(2);
  const digits = hex.match(/[0-9a-fA-F]{2}/g);

  if (digits.length * 2 != hex.length) {
    throw 'not hex';
  }

  return new Uint8Array(digits.map(h => parseInt(h, 16)));
}

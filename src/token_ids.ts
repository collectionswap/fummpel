//import { StandardMerkleTree } from "@openzeppelin/merkle-tree';
//import { keccak256 } from 'ethereum-cryptography/keccak';

import { Codec } from './codec';
import { keccak256 } from './keccak';
import { MerkleTree } from './merkle';

/**
 * TokenIDs
 */
export default class TokenIDs {
  tokenIDs: Set<bigint>;
  encoded: Uint8Array;
  //_tree: StandardMerkleTree<Array<string>>;
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
  static decode(bytes: Uint8Array) {
    const decoder = new Codec();
    const tokens = decoder.decode(bytes.slice(2));
    const tokenIDs = new TokenIDs(tokens);

    return tokenIDs;
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
    //const subsetBytes32 = Array.from(new Set(subset), s => [bytes32(s)]);
    const uint8s = Array.from(new Set(subset), uint8array);
    const { proof, proofFlags, leaves } = this.tree().getMultiProof(uint8s);

    console.log('llllllllllllllllllllll', leaves);

    const ids = leaves.map(bytes32).map(BigInt);//l => BigInt(l[0]));
    //const ids = leaves.map(bigint);

    return { leaves: ids, proof: proof.map(bytes32), proofFlags };
  }

  /**
   * Gets Merkle tree root hash
   */
  root() {
    return this.tree().root;
  }

  /**
   * Gets list of token IDs represented by this TokenIDs instance as a sorted array
   */
  tokens() {
    return Array.from(this.tokenIDs).sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  }

  /**
   * Verify multiproof using essentially the same algo in OpenZeppelin's smart contract
   */
  verify(proof: string[], flags: boolean[], leaves: bigint[]): boolean {

    if (leaves.length + proof.length - 1 != flags.length) {
      throw 'wrong number of proofs / flags';
    }

    const hashes = [];
    const p = proof.values();
    const l = leaves.map(l => bytes32(keccak256(keccak256(uint8array(l))))).values();
    const h = hashes.values();

    // reconstruct root using instructions from flags to consume from leaves or proof
    for (const f of flags) {
      const a = l.next().value ?? h.next().value;
      const b = f ? l.next().value ?? h.next().value : p.next().value;

      hashes.push(hashPair(a, b));
    }

    const root = hashes[hashes.length - 1] ?? leaves[0] ?? proof[0];

    return root == this._tree.root;
  }

  private tree() {
    if (!this._tree) {
      //const tokensBytes32 = Array.from(this.tokenIDs).map(t => [bytes32(t)]);
      //this._tree = StandardMerkleTree.of(tokensBytes32, ["bytes32']);
      const tokensUint8array = Array.from(this.tokenIDs, bigint2uint8array);
let start = +new Date;
      this._tree = new MerkleTree(tokensUint8array);
console.log('FFFFFF',  +new Date - start);
    }

    return this._tree;
  }
}

/**
 * Combines 2 child nodes to a parent as in a Merkle tree
 */
function hashPair(a: string, b: string): string {
  if (b < a) { // always encode smaller value first
    [a, b] = [b, a];
  }

  const concatenated = new Uint8Array(64);

  concatenated.set(uint8array(a));
  concatenated.set(uint8array(b), 32);

  return bytes32(keccak256(concatenated));
}

/**
 * Convert to 32 byte Uint8Array from hex string or 256-bit bigint
 */
function uint8array(input: bigint|string): Uint8Array {
  let hex;

  if (typeof input == 'bigint') {
    hex = input.toString(16).padStart(64, '0');
  }
  else {
    if (input[0] != '0' && input[1] != 'x') {
      throw 'not hex';
    }

    hex = input.substr(2);
  }

  const digits = hex.match(/[0-9a-fA-F]{2}/g);

  if (digits.length * 2 != hex.length) {
    throw 'not hex';
  }

  return new Uint8Array(digits.map(h => parseInt(h, 16)));
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

  return '0x' + Array.from(input, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert bigint to 32 byte Uint8Array
 */
function bigint2uint8array(input: bigint): Uint8Array {
  const bytes = new Uint8Array(32);

  /*
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(BigInt.asUintN(8, input));
    input >>= 8n;
  }
 */

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

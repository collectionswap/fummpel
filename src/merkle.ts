import { keccak256 } from './keccak';

function hashPair(a: Uint8Array, b: Uint8Array): Uint8Array {
  if (gt(a, b)) {
    [a, b] = [b, a];
  }

  const concatenated = new Uint8Array(64);

  concatenated.set(a);
  concatenated.set(b, 32);

  return keccak256(concatenated);
}

function left(i: number): number { return 2 * i + 1 }
function right(i: number): number { return 2 * i + 2 }

function parent(i: number): number {
  return i > 0 ?
    Math.floor((i - 1) / 2) :
  throwError('Root has no parent');
}

function siblingIndex(i: number): number {
  return i > 0 ?
    i - (-1) ** (i % 2) :
    throwError('Root has no siblings');
}

function isTreeNode(tree: Uint8Array[], i: number): boolean {
  return i >= 0 && i < tree.length;
}

function isInternalNode(tree: Uint8Array[], i: number) {
  return isTreeNode(tree, left(i));
}

function isLeafNode(tree: Uint8Array[], i: number):boolean {
  return isTreeNode(tree, i) && !isInternalNode(tree, i);
}

function checkLeafNode(tree: Uint8Array[], i: number) {
  if (!isLeafNode(tree, i)) {
    throwError('Index is not a leaf');
  }
}

export function makeMerkleTree(leaves: Uint8Array[]): Uint8Array[] {
  if (leaves.length === 0) {
    throw new Error('Expected non-zero number of leaves');
  }

  const tree = new Array<Uint8Array>(2 * leaves.length - 1);

  for (const [i, leaf] of leaves.entries()) {
    tree[tree.length - 1 - i] = leaf;
  }

  for (let i = tree.length - 1 - leaves.length; i >= 0; i--) {
    tree[i] = hashPair(tree[left(i)]!, tree[right(i)]!);
  }

  return tree;
}

export interface MultiProof {
  leaves: Uint8Array[];
  proof: Uint8Array[];
  proofFlags: boolean[];
}

export function getMultiProof(tree: Uint8Array[], indices: number[]): MultiProof {
  indices.forEach(i => checkLeafNode(tree, i));
  indices.sort((a, b) => b - a);

  if (indices.slice(1).some((i, p) => i === indices[p])) {
    throw new Error('Cannot prove duplicated index');
  }

  const stack = indices.concat(); // copy
  const proof = [];
  const proofFlags = [];

  while (stack.length > 0 && stack[0]! > 0) {
    const j = stack.shift()!; // take from the beginning
    const s = siblingIndex(j);
    const p = parent(j);

    if (s === stack[0]) {
      proofFlags.push(true);
      stack.shift(); // consume from the stack
    } else {
      proofFlags.push(false);
      proof.push(tree[s]!);
    }
    stack.push(p);
  }

  if (indices.length === 0) {
    proof.push(tree[0]!);
  }

  return {
    leaves: indices.map(i => tree[i]!),
    proof,
    proofFlags,
  };
}

function standardLeafHash(value: Uint8Array): Uint8Array {
  return keccak256(keccak256(value));
}

export class MerkleTree {
  // Given a hash, find the index in `values`. Hash must be converted to bigint so we can use a Map
  private readonly hashLookup: Map<bigint, number>;

  // Our merkle tree, root is at 0 and leaves are filled in reverse from the end
  private readonly tree: Uint8Array[];

  // Values that are encodeded into the tree
  private readonly values: Uint8Array[];

  // For each value in `values`, corresponding index of node in `tree` (leaves are sorted by hash)
  private readonly treeIndex: number[];

  constructor(values: Uint8Array[]) {
    const hashedValues = [];
    const hashLookup = new Map();

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const hash = standardLeafHash(value);

      hashedValues.push({ valueIndex: i, hash });
      hashLookup.set(bigint(hash), i);
    }

    hashedValues.sort((_a, _b) => {
      const a = _a.hash;
      const b = _b.hash;

      for (let i = 0; i < 32; i++) {
        if (a[i] != b[i]) {
          return a[i]! - b[i]!;
        }
      }

      return 0;
    });

    const valuesLength = values.length;
    const treeLength = 2 * valuesLength - 1;

    const tree = new Array<Uint8Array>(treeLength);


    const treeIndex = [];

    for (const [i, { hash, valueIndex }] of hashedValues.entries()) {
      const j = treeLength - 1 - i;

      tree[j] = hash;
      treeIndex[valueIndex] = j;
    }

    for (let i = treeLength - 1 - valuesLength; i >= 0; i--) {
      tree[i] = hashPair(tree[left(i)]!, tree[right(i)]!);
    }

    this.values = values;
    this.treeIndex = treeIndex;

    this.tree = tree;
    this.hashLookup = hashLookup;
  }

  static async init() {
    await keccak256.init();
  }

  get root(): string {
    return '0x' + hex(this.tree[0]!);
  }

  leafHash(leaf: Uint8Array): bigint {
    return bigint(standardLeafHash(leaf));
  }

  leafLookup(leaf: Uint8Array): number {
    return this.hashLookup.get(this.leafHash(leaf)) ?? throwError('Leaf is not in tree');
  }

  getMultiProof(leaves: (number | Uint8Array)[]): MultiProof {
    // input validity
    const valueIndices = leaves.map(leaf => typeof(leaf) === 'number' ? leaf : this.leafLookup(leaf));

    for (const valueIndex of valueIndices)
      this.validateValue(valueIndex);

    // rebuild tree indices and generate proof
    const indices = valueIndices.map(i => this.treeIndex[i]!);
    const proof = getMultiProof(this.tree, indices);

    // check proof
    //const impliedRoot = processMultiProof(proof);
    //if (!equalsBytes(impliedRoot, this.tree[0]!)) {
      //throw new Error('Unable to prove values');
    //}

    // return multiproof in ?hex? format
    proof.leaves = proof.leaves.map(hash => this.values[this.hashLookup.get(bigint(hash))!]!);

    return proof;
  }

  private validateValue(valueIndex: number) {
    checkBounds(this.values, valueIndex);

    const value = this.values[valueIndex];
    const treeIndex = this.treeIndex[valueIndex];

    checkBounds(this.tree, treeIndex);

    const leaf = standardLeafHash(value);

    if (compareBytes32(leaf, this.tree[treeIndex]!) != 0) {
      throw new Error('Merkle tree does not contain the expected value');
    }
  }
}

const HEX = [];

for (let i = 0; i < 256; i++) {
  HEX[i] = i.toString(16).padStart(2, '0');
}

/**
 * Convert Uint8Array to 32 byte hex string without leading '0x'
 */
export function hex(input: Uint8Array): string {
  if (input.length != 32) {
    throwError('only 32 bytes accepted');
  }

  let hex = '';

  for (let byte of input) {
    hex += HEX[byte];
  }

  return hex;
}

export function compareBytes32(a: Uint8Array, b: Uint8Array): number {
  for (let i = 0; i < 32; i++) {
    if (a[i] !== b[i]) {
      return a[i]! - b[i]!;
    }
  }

  return 0;
}

export function gt(a: Uint8Array, b: Uint8Array): boolean {
  for (let i = 0; i < 32; i++) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }

  return false;
}

export function checkBounds(array: unknown[], index: number) {
  if (index < 0 || index >= array.length) {
    throw new Error('Index out of bounds');
  }
}

export function throwError(message?: string): never {
  throw new Error(message);
}

/*
 * Convert 32 bytes to a bigint representation to enable use as keys in maps
 */
function bigint(bytes: Uint8Array): bigint {
  let b = 0n;

  for (let i = 0; i < 32; i += 4) {
    const bits32 =
      (bytes[i    ] << 24) +
      (bytes[i + 1] << 16) +
      (bytes[i + 2] <<  8) +
      (bytes[i + 3]);

    b = (b << 32n) + BigInt(bits32);
  }

  return b;
}

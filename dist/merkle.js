"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = exports.checkBounds = exports.gt = exports.compareBytes32 = exports.hex = exports.MerkleTree = exports.getMultiProof = exports.makeMerkleTree = void 0;
const keccak_1 = require("./keccak");
function hashPair(a, b) {
    if (gt(a, b)) {
        [a, b] = [b, a];
    }
    const concatenated = new Uint8Array(64);
    concatenated.set(a);
    concatenated.set(b, 32);
    return (0, keccak_1.keccak256)(concatenated);
}
function left(i) { return 2 * i + 1; }
function right(i) { return 2 * i + 2; }
function parent(i) {
    return (i > 0) ?
        Math.floor((i - 1) / 2) :
        throwError('Root has no parent');
}
const siblingIndex = (i) => i > 0 ? i - (-1) ** (i % 2) : throwError('Root has no siblings');
const isTreeNode = (tree, i) => i >= 0 && i < tree.length;
const isInternalNode = (tree, i) => isTreeNode(tree, left(i));
const isLeafNode = (tree, i) => isTreeNode(tree, i) && !isInternalNode(tree, i);
const isValidMerkleNode = (node) => node instanceof Uint8Array && node.length === 32;
const checkLeafNode = (tree, i) => void (isLeafNode(tree, i) || throwError('Index is not a leaf'));
const checkValidMerkleNode = (node) => void (isValidMerkleNode(node) || throwError('Merkle tree nodes must be Uint8Array of length 32'));
function makeMerkleTree(leaves) {
    //leaves.forEach(checkValidMerkleNode);
    if (leaves.length === 0) {
        throw new Error('Expected non-zero number of leaves');
    }
    const tree = new Array(2 * leaves.length - 1);
    for (const [i, leaf] of leaves.entries()) {
        tree[tree.length - 1 - i] = leaf;
    }
    for (let i = tree.length - 1 - leaves.length; i >= 0; i--) {
        tree[i] = hashPair(tree[left(i)], tree[right(i)]);
    }
    return tree;
}
exports.makeMerkleTree = makeMerkleTree;
function getMultiProof(tree, indices) {
    indices.forEach(i => checkLeafNode(tree, i));
    indices.sort((a, b) => b - a);
    if (indices.slice(1).some((i, p) => i === indices[p])) {
        throw new Error('Cannot prove duplicated index');
    }
    const stack = indices.concat(); // copy
    const proof = [];
    const proofFlags = [];
    while (stack.length > 0 && stack[0] > 0) {
        const j = stack.shift(); // take from the beginning
        const s = siblingIndex(j);
        const p = parent(j);
        if (s === stack[0]) {
            proofFlags.push(true);
            stack.shift(); // consume from the stack
        }
        else {
            proofFlags.push(false);
            proof.push(tree[s]);
        }
        stack.push(p);
    }
    if (indices.length === 0) {
        proof.push(tree[0]);
    }
    return {
        leaves: indices.map(i => tree[i]),
        proof,
        proofFlags,
    };
}
exports.getMultiProof = getMultiProof;
function standardLeafHash(value) {
    return (0, keccak_1.keccak256)((0, keccak_1.keccak256)(value));
}
class MerkleTree {
    constructor(values) {
        let start = +new Date;
        const hashedValues = [];
        const hashLookup = new Map();
        for (let i = 0; i < values.length; i++) {
            const value = values[i];
            const hash = standardLeafHash(value);
            hashedValues.push({ valueIndex: i, hash });
            hashLookup.set(bigint(hash), i);
        }
        console.log(`+${+new Date - start}ms => hashed`);
        hashedValues.sort((_a, _b) => {
            const a = _a.hash;
            const b = _b.hash;
            for (let i = 0; i < 32; i++) {
                if (a[i] != b[i]) {
                    return a[i] - b[i];
                }
            }
            return 0;
        });
        console.log(`+${+new Date - start}ms => sorted`);
        const valuesLength = values.length;
        const treeLength = 2 * valuesLength - 1;
        //const tree = makeMerkleTree(hashedValues.map(v => v.hash));
        const tree = new Array(treeLength);
        //if (leaves.length === 0) {
        //throw new Error('Expected non-zero number of leaves');
        //}
        const treeIndex = [];
        //for (const [i, leaf] of leaves.entries()) {
        for (const [i, { hash, valueIndex }] of hashedValues.entries()) {
            const j = treeLength - 1 - i;
            tree[j] = hash;
            treeIndex[valueIndex] = j;
        }
        console.log(`+${+new Date - start}ms => tree leaves filled`);
        for (let i = treeLength - 1 - valuesLength; i >= 0; i--) {
            tree[i] = hashPair(tree[left(i)], tree[right(i)]);
        }
        console.log(`+${+new Date - start}ms => tree made`);
        /*
        for (const [leafIndex, { valueIndex }] of hashedValues.entries()) {
          //indexedValues[valueIndex]!.treeIndex = tree.length - leafIndex - 1;
    
          treeIndex[valueIndex] = tree.length - leafIndex - 1;
        }
        */
        /*
         for (let leafIndex = 0; leafIndex < hashedValues.length; leafIndex++) {
           const valueIndex = hashedValues[leafIndex]!.valueIndex;
           treeIndex[valueIndex] = tree.length - leafIndex - 1;
         }
        */
        //console.log(`+${+new Date - start}ms => tree indexed`);
        this.values = values;
        this.treeIndex = treeIndex;
        this.tree = tree;
        this.hashLookup = hashLookup;
    }
    static async init() {
        await keccak_1.keccak256.init();
    }
    get root() {
        return '0x' + hex(this.tree[0]);
    }
    leafHash(leaf) {
        return bigint(standardLeafHash(leaf));
    }
    leafLookup(leaf) {
        return this.hashLookup.get(this.leafHash(leaf)) ?? throwError('Leaf is not in tree');
    }
    getMultiProof(leaves) {
        // input validity
        const valueIndices = leaves.map(leaf => typeof (leaf) === 'number' ? leaf : this.leafLookup(leaf));
        for (const valueIndex of valueIndices)
            this.validateValue(valueIndex);
        // rebuild tree indices and generate proof
        //const indices = valueIndices.map(i => this.values[i]!.treeIndex);
        const indices = valueIndices.map(i => this.treeIndex[i]);
        const proof = getMultiProof(this.tree, indices);
        // check proof
        //const impliedRoot = processMultiProof(proof);
        //if (!equalsBytes(impliedRoot, this.tree[0]!)) {
        //throw new Error('Unable to prove values');
        //}
        // return multiproof in ?hex? format
        proof.leaves = proof.leaves.map(hash => this.values[this.hashLookup.get(bigint(hash))]);
        return proof;
    }
    validateValue(valueIndex) {
        checkBounds(this.values, valueIndex);
        const value = this.values[valueIndex];
        const treeIndex = this.treeIndex[valueIndex];
        checkBounds(this.tree, treeIndex);
        const leaf = standardLeafHash(value);
        if (compareBytes32(leaf, this.tree[treeIndex]) != 0) {
            throw new Error('Merkle tree does not contain the expected value');
        }
        //if (!equalsBytes(leaf, this.tree[treeIndex]!)) {
        //throw new Error('Merkle tree does not contain the expected value');
        //}
    }
}
exports.MerkleTree = MerkleTree;
const HEX = [];
for (let i = 0; i < 256; i++) {
    HEX[i] = i.toString(16).padStart(2, '0');
}
/**
 * Convert Uint8Array to 32 byte hex string without leading '0x'
 */
function hex(input) {
    if (input.length != 32) {
        throwError('only 32 bytes accepted');
    }
    let hex = '';
    for (let byte of input) {
        hex += HEX[byte];
    }
    return hex;
}
exports.hex = hex;
function compareBytes32(a, b) {
    for (let i = 0; i < 32; i++) {
        if (a[i] !== b[i]) {
            return a[i] - b[i];
        }
    }
    return 0;
}
exports.compareBytes32 = compareBytes32;
function gt(a, b) {
    for (let i = 0; i < 32; i++) {
        if (a[i] > b[i])
            return true;
        if (a[i] < b[i])
            return false;
    }
    return false;
}
exports.gt = gt;
function checkBounds(array, index) {
    if (index < 0 || index >= array.length) {
        throw new Error('Index out of bounds');
    }
}
exports.checkBounds = checkBounds;
function throwError(message) {
    throw new Error(message);
}
exports.throwError = throwError;
/*
 * Convert 32 bytes to a bigint representation to enable use as keys in maps
 */
function bigint(bytes) {
    let b = 0n;
    for (let i = 0; i < 32; i += 4) {
        const bits32 = (bytes[i] << 24) +
            (bytes[i + 1] << 16) +
            (bytes[i + 2] << 8) +
            (bytes[i + 3]);
        b = (b << 32n) + BigInt(bits32);
    }
    return b;
}

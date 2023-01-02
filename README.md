# Usage

## API

### TokenIDs
Main class representing a set of token IDs as `BigInts`. Construct either with a list / set of
`BigInts` or decode from compressed bytes.

Generate Merkle tree roots / multi-proofs with `root()` and `proof(...)` and retrieve a compact
binary representation with 'encode()`

#### `new TokenIDs(tokenIDs: Iterable<bigint>)`
Create a new list of tokens from any Iterable, e.g. `Set` / `Array`. Token IDs must be 256-bit `BigInts`

#### `TokenIDs.decode(bytes: Uint8Array): TokenIDs`
Decode tokens from a compressed byte stream.

#### `encode()`
Gets compressed binary representation of all token IDs

#### `proof(subset: Iterable<bigint>)`
Generates Merkle multi-proof for subset of token IDs

#### `root()`
Gets Merkle tree root hash

#### `tokens()`
Gets list of token IDs represented by this TokenIDs instance as a sorted array

#### `verify(proof: string[], flags: boolean[], leaves: string[][]): boolean`
Verify multiproof using essentially the same algo in OpenZeppelin's smart contract

## Example
```ts
import { TokenIDs } from 'fummpel';

const tokens = new TokenIDs([2n,3n,5n,7n])

// Merkle root for these 4 tokens
const root = tokens.root();
// '0xc97e9e1eb896293c19f2649c796c9a276d997cfa58164c5f25d9a3f29b894cc9'

// Merkle multiproof for 2 of the tokens
const proof = tokens.proof([2n, 5n]);
// {
//   leaves: [ 5n, 2n ],
//   proof: [
//     '0xcff8e1781584200105067c0684580a1524c9539de52c1f9889e2cf73830cfccc'
//   ],
//   proofFlags: [ true, false ]
// }

// Leaf error if token is not in tree
const bad = tokens.proof([1n]);
// Error: Leaf is not in tree

// Verify multiproof
const verified = tokens.verify(proof.proof, proof.proofFlags, proof.leaves);
// true

// Get encoded tokens list
const encoded = tokens.encoded();
// Uint8Array(2) [ ... ]

// Decode encoded tokens list
const decoded_tokens = TokenIDs.decode(encoded);
// TokenIDs { ... }

const decoded_token_ids = decoded_tokens.tokens();
// [ 2n, 3n, 5n, 7n ]
```

# Development
`yarn install`

## Test
`uvu` is used for testing.

### All
`npm test`

### Single test
`npx ts-node src/token_ids.test.ts`

## Build / Publish

`npm run build` and then `npm publish --access public`

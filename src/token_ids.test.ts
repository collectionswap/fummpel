import { test } from 'uvu';
import assert from 'uvu/assert';

import TokenIDs from './token_ids';

test('Generates merkle roots and proofs', async _ => {
  await TokenIDs.init();

  const ids: Set<bigint> = new Set([1n, 100n, 10000n]);
  const tokens = new TokenIDs(ids);

  assert.throws(_ => tokens.proof([1n, 2n, 3n]));

  const proof = tokens.proof([1n, 100n]);

  assert.ok(tokens.verify(proof.proof, proof.proofFlags, proof.leaves));
  assert.ok(TokenIDs.verify(tokens.root(), proof.proof, proof.proofFlags, proof.leaves));
});

test('Encodes and decodes tokens', async _ => {
  await TokenIDs.init();

  const ids = [];

  for (let i = 1; i < 1000000; i *= 2) {
    ids.push(BigInt(i));
  }

  const original = new TokenIDs(ids);
  const decoded = TokenIDs.decode(original.encode());

  assert.equal(ids, decoded.tokens());
  assert.equal(original.tokens(), decoded.tokens());
  assert.equal(original.root(), decoded.root());
});

test('Tree generation for 100k IDs takes a "reasonable" amount of time', async _ => {
  await TokenIDs.init();

  const ids = [];

  for (let i = 1; i < 100000; i++) {
    ids.push(BigInt(i * 42));
  }

  const tokens = new TokenIDs(ids);
  const start = +new Date;
  const root = tokens.root();

  assert.equal(root, '0x8e994a69be0f72def84cbd189b9a16cf2ac3acebbafb04cd5d9f7d4ba8f81e43');

  const t = +new Date - start;
  assert.ok(t < 1000);
});

test.run();


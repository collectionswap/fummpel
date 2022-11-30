import { test } from "uvu";
import * as assert from "uvu/assert";

const { TokenIDs } = require("./token_ids");

test("Generates merkle roots and proofs", (_) => {
  const ids: Set<bigint> = new Set([1n, 100n, 10000n]);
  const tokens = new TokenIDs(ids);

  // @ts-ignore
  assert.throws((_) => tokens.proof([1n, 2n, 3n]));

  const proof = tokens.proof([1n, 100n]);

  assert.ok(tokens.verify(proof.proof, proof.proofFlags, proof.leaves));
});

test("Encodes and decodes tokens", (_) => {
  const ids = [];

  for (let i = 1; i < 1000000; i *= 2) {
    // @ts-ignore
    ids.push(BigInt(i));
  }

  const original = new TokenIDs(ids);
  const decoded = TokenIDs.decode(original.encode());

  assert.equal(ids, decoded.tokens());
  assert.equal(original.tokens(), decoded.tokens());
  assert.equal(original.root(), decoded.root());
});

test.run();

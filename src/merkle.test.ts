import { test } from 'uvu';
import assert from 'uvu/assert';

import { uint8array32 as b } from './bytes';
import { MerkleTree, verify } from './merkle';

test('Verifies multi-proofs', async _ => {
  await MerkleTree.init();

  assert.ok(verify(b(0x3e6c4b615e1c29dd6c02090cd26edcfc1f3ff44f1a3e2493c97ff45df19fdf41n), {
    leaves: [ b(10000n), b(100000000n), b(1n) ],
    proof: [
      b(0x77f592bc17b20433aeae743b94966faa037e16a70ad7c488cf44b90a1e8bbaccn),
      b(0x6018aa26c1d237bf0d550845d50afe01326f1fce28dbefe46b3f91b71454f3f0n),
    ],
    proofFlags: [ false, true, false, true ]
  }));
});

test.run();

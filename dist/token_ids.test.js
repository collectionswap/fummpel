"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uvu_1 = require("uvu");
const assert_1 = __importDefault(require("uvu/assert"));
const token_ids_1 = __importDefault(require("./token_ids"));
(0, uvu_1.test)('Generates merkle roots and proofs', async (_) => {
    await token_ids_1.default.init();
    const ids = new Set([1n, 100n, 10000n]);
    const tokens = new token_ids_1.default(ids);
    assert_1.default.throws(_ => tokens.proof([1n, 2n, 3n]));
    const proof = tokens.proof([1n, 100n]);
    console.log('ppppppppppppppppp', proof);
    assert_1.default.ok(tokens.verify(proof.proof, proof.proofFlags, proof.leaves));
});
(0, uvu_1.test)('Encodes and decodes tokens', async (_) => {
    await token_ids_1.default.init();
    const ids = [];
    for (let i = 1; i < 1000000; i *= 2) {
        ids.push(BigInt(i));
    }
    const original = new token_ids_1.default(ids);
    const decoded = token_ids_1.default.decode(original.encode());
    assert_1.default.equal(ids, decoded.tokens());
    assert_1.default.equal(original.tokens(), decoded.tokens());
    assert_1.default.equal(original.root(), decoded.root());
});
(0, uvu_1.test)('Tree generation for 100k IDs takes a "reasonable" amount of time', async (_) => {
    await token_ids_1.default.init();
    const ids = [];
    for (let i = 1; i < 100000; i++) {
        ids.push(BigInt(i * 42));
    }
    const tokens = new token_ids_1.default(ids);
    const start = +new Date;
    const root = tokens.root();
    console.log(root);
    assert_1.default.equal(root, '0x8e994a69be0f72def84cbd189b9a16cf2ac3acebbafb04cd5d9f7d4ba8f81e43');
    const t = +new Date - start;
    console.log(t);
    assert_1.default.ok(t < 1000);
    // OZ takes 5.3s
});
uvu_1.test.run();

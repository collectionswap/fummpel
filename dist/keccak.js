"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keccak256 = void 0;
const hash_wasm_1 = require("hash-wasm");
let keccak;
async function init() {
    console.log('keccak init');
    if (!keccak) {
        console.log('keccak really init');
        keccak = await (0, hash_wasm_1.createKeccak)(256);
    }
}
function keccak256(value) {
    keccak.init();
    keccak.update(value);
    return keccak.digest('binary');
}
exports.keccak256 = keccak256;
keccak256.init = init;
init();

import { createKeccak } from 'hash-wasm';

let keccak;

async function init() {
  console.log('keccak init');

  if (!keccak) {
    console.log('keccak really init');
    keccak = await createKeccak(256);
  }
}

export function keccak256(value: Uint8Array): Uint8Array {
  keccak.init();
  keccak.update(value);

  return keccak.digest('binary');
}

keccak256.init = init;

init();

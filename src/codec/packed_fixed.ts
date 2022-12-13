import { BitStreamReader, bitWidth, BitStreamWriter } from "./bitstream";

export class PackedFixed {
  decode(bytes: Uint8Array): Array<bigint> {
    const reader = new BitStreamReader(bytes);
    const width = Number(reader.read(8)) + 1;
    const numbers: bigint[] = [];
    let last = -1n;

    while (true) {
      let n;

      try {
        n = reader.read(width);
      } catch (_) {
        break; // end of stream
      }

      if (n <= last) {
        break; // numbers are sorted, must have read partial bits at end
      }

      numbers.push(n);
      last = n;
    }

    return numbers;
  }

  estimateSize(numbers: Array<bigint>): number {
    const width = Math.max(bitWidth(numbers[numbers.length - 1]), 1);

    // 1 byte for bit width and count * width rounded up to next byte
    return 1 + Math.ceil((numbers.length * width) / 8);
  }

  encode(numbers: Array<bigint>): Uint8Array {
    const writer = new BitStreamWriter();

    const width = Math.max(bitWidth(numbers[numbers.length - 1]), 1);
    writer.write(8, BigInt(width - 1));

    for (let i = 0; i < numbers.length; i++) {
      writer.write(width, numbers[i]);
    }

    return writer.bytes();
  }
}

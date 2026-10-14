import { describe, expect, it } from "vitest";
import { PayloadTooLargeError, readBodyWithLimit } from "@/lib/read-limited-body";

function streamOf(chunks: Uint8Array[], onPull?: () => void) {
  let index = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      onPull?.();
      if (index < chunks.length) controller.enqueue(chunks[index++]);
      else controller.close();
    },
  });
}

const chunk = (size: number, fill = 1) => new Uint8Array(size).fill(fill);

describe("readBodyWithLimit", () => {
  it("returns an empty array for a request without a body", async () => {
    await expect(readBodyWithLimit(null, 10)).resolves.toHaveLength(0);
  });

  it("concatenates every chunk in order", async () => {
    const bytes = await readBodyWithLimit(streamOf([chunk(2, 1), chunk(3, 2)]), 10);

    expect(Array.from(bytes)).toEqual([1, 1, 2, 2, 2]);
  });

  it("accepts a body exactly at the limit", async () => {
    await expect(readBodyWithLimit(streamOf([chunk(10)]), 10)).resolves.toHaveLength(10);
  });

  it("rejects a body one byte over the limit", async () => {
    await expect(readBodyWithLimit(streamOf([chunk(11)]), 10)).rejects.toBeInstanceOf(
      PayloadTooLargeError,
    );
  });

  it("stops pulling from the stream once the limit is passed", async () => {
    let pulls = 0;
    const endless = streamOf(Array.from({ length: 1000 }, () => chunk(4)), () => (pulls += 1));

    await expect(readBodyWithLimit(endless, 10)).rejects.toBeInstanceOf(PayloadTooLargeError);

    expect(pulls).toBeLessThan(10);
  });
});

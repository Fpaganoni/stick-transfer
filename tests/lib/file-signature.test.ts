import { describe, expect, it } from "vitest";
import { detectFileType } from "@/lib/file-signature";

const bytes = (...values: number[]) => new Uint8Array(values);
const ascii = (text: string) => Uint8Array.from(Buffer.from(text, "latin1"));

describe("detectFileType", () => {
  it.each([
    ["PDF", bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34), "application/pdf"],
    ["PNG", bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00), "image/png"],
    ["JPEG", bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10), "image/jpeg"],
    ["WebP", Uint8Array.from([...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WEBP")]), "image/webp"],
    [
      "DOC (OLE2)",
      bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1),
      "application/msword",
    ],
    [
      "DOCX (zip)",
      bytes(0x50, 0x4b, 0x03, 0x04, 0x14, 0x00),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  ])("recognizes %s", (_name, header, expected) => {
    expect(detectFileType(header)).toBe(expected);
  });

  it.each([
    ["an HTML page", ascii("<!DOCTYPE html>")],
    ["a script", ascii("<script>alert(1)</script>")],
    ["a Windows executable", ascii("MZ\u0090\u0000\u0003")],
    ["a WAV file (RIFF but not WebP)", Uint8Array.from([...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WAVE")])],
    ["an empty file", new Uint8Array(0)],
  ])("rejects %s", (_name, header) => {
    expect(detectFileType(header)).toBeNull();
  });
});

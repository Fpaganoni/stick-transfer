import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { buildSchema, parse, validate } from "graphql";
import * as operations from "@/graphql";

// The backend loads every *.graphql under src/ (typePaths glob), so the real
// schema is their union, not src/schema.graphql alone.
const BACKEND_SRC =
  process.env.BACKEND_SRC_DIR ??
  path.resolve(__dirname, "../../../stick-transfer-app-DB/src");

function collectSdlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return collectSdlFiles(full);
    return full.endsWith(".graphql") ? [full] : [];
  });
}

const OPERATION_START = /^\s*(query|mutation|subscription)\b/;

const documents = Object.entries(operations).filter(
  (entry): entry is [string, string] =>
    typeof entry[1] === "string" && OPERATION_START.test(entry[1]),
);

describe.skipIf(!existsSync(BACKEND_SRC))("GraphQL contract: front operations vs backend schema", () => {
  const schema = buildSchema(
    collectSdlFiles(BACKEND_SRC)
      .map((file) => readFileSync(file, "utf8"))
      .join("\n"),
  );

  it("finds operations to validate", () => {
    expect(documents.length).toBeGreaterThan(40);
  });

  it.each(documents)("%s validates against the backend schema", (_name, source) => {
    const errors = validate(schema, parse(source));
    expect(errors.map((e) => e.message)).toEqual([]);
  });
});

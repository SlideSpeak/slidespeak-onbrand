import { describe, expect, test } from "vitest";
import { encodeRfc5987 } from "./rfc5987";

describe("encodeRfc5987", () => {
  test("percent-encodes characters that are unsafe in extended header parameters", () => {
    expect(encodeRfc5987("hero's (orb).png")).toBe("hero%27s%20%28orb%29.png");
  });
});

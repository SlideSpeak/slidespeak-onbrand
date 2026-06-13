import { describe, expect, test } from "vitest";
import { contentDisposition } from "./content-disposition";

describe("contentDisposition", () => {
  test("builds safe ASCII and RFC 5987 filenames", () => {
    expect(contentDisposition('hero "orb".png')).toBe(
      "attachment; filename=\"hero _orb_.png\"; filename*=UTF-8''hero%20%22orb%22.png",
    );
  });
});

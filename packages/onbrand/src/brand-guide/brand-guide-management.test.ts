import { describe, expect, test } from "vitest";
import { brandGuideSlugFromName, colorTokenIdFromName } from "./management-identifiers";

describe("Brand Guide management identifiers", () => {
  test("derives stable URL-safe Brand Guide slugs from names", () => {
    expect(brandGuideSlugFromName("ACME Corp Brand Guide")).toBe("acme-corp-brand-guide");
  });

  test("derives Color Token ids from user-facing names", () => {
    expect(colorTokenIdFromName("Primary Blue")).toBe("primary-blue");
  });
});

import { describe, expect, it } from "vitest";

import { createDashboardRefreshCookie, verifyDashboardRefreshCookie } from "./dashboard-session";

const SECRET = "test-dashboard-session-secret";

describe("dashboard refresh cookie", () => {
  it("encrypts refresh tokens instead of storing them as readable cookie payload", async () => {
    const refreshToken = "slidespeak-refresh-token-secret";

    const cookie = await createDashboardRefreshCookie(refreshToken, SECRET);

    expect(cookie).not.toContain(refreshToken);
    await expect(verifyDashboardRefreshCookie(cookie, SECRET)).resolves.toBe(refreshToken);
  });
});

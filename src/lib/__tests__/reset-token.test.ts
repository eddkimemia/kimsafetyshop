import { describe, it, expect } from "vitest";
import { createPasswordResetToken, verifyResetTokenWithFingerprint } from "@/lib/reset-token";

// Ensure NEXTAUTH_SECRET is set for token HMAC
process.env.NEXTAUTH_SECRET ??= "test-secret-for-vitest-please-change-in-prod-123456";

describe("reset-token HMAC", () => {
  it("tampered payload fails", () => {
    const token = createPasswordResetToken("uid-123", "hash-abc", 60_000);
    const tampered = token.slice(0, -2) + "ab";
    expect(verifyResetTokenWithFingerprint(tampered)).toBeNull();
  });

  it("expired token returns null", async () => {
    const token = createPasswordResetToken("uid-123", "hash-abc", 1);
    await new Promise((r) => setTimeout(r, 10));
    expect(verifyResetTokenWithFingerprint(token)).toBeNull();
  });
});

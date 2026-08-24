import { describe, it, expect } from "vitest";
import { bulkUnitPrice, discountPercent, slugify } from "@/lib/utils";
import { verifyResetTokenWithFingerprint, createPasswordResetToken, isResetTokenFingerprintValid } from "@/lib/reset-token";

describe("bulkUnitPrice", () => {
  const prod = {
    price: 1000,
    bulk: [
      { qty: "1 – 9", price: "1,000", savings: "Standard" },
      { qty: "10 – 49", price: "950", savings: "5% off" },
      { qty: "50 – 199", price: "910", savings: "9% off" },
      { qty: "200+", price: "870", savings: "13% off" },
    ],
  };

  it("ignores 1–9 tier and returns base for small qty", () => {
    expect(bulkUnitPrice(prod, 1)).toBe(1000);
    expect(bulkUnitPrice(prod, 9)).toBe(1000);
  });

  it("applies tier from 10", () => {
    expect(bulkUnitPrice(prod, 10)).toBe(950);
    expect(bulkUnitPrice(prod, 49)).toBe(950);
    expect(bulkUnitPrice(prod, 50)).toBe(910);
    expect(bulkUnitPrice(prod, 200)).toBe(870);
  });

  it("handles missing bulk", () => {
    expect(bulkUnitPrice({ price: 500 }, 100)).toBe(500);
  });
});

describe("discountPercent", () => {
  it("computes correctly", () => {
    expect(discountPercent(900, 1000)).toBe(10);
    expect(discountPercent(1000, 1000)).toBeNull();
    expect(discountPercent(1100, 1000)).toBeNull();
  });
});

describe("slugify", () => {
  it("slugifies", () => {
    expect(slugify("3M Safety Helmet & Gloves")).toBe("3m-safety-helmet-and-gloves");
  });
});

describe("password-reset single-use", () => {
  it("token validates with current hash, fails after hash change", () => {
    const uid = "test-user-id";
    const hash1 = "salt1:hash1";
    const token = createPasswordResetToken(uid, hash1, 60_000);
    const parsed = verifyResetTokenWithFingerprint(token);
    expect(parsed).not.toBeNull();
    expect(parsed!.uid).toBe(uid);
    expect(isResetTokenFingerprintValid(parsed!.ph, hash1)).toBe(true);
    // after password change, fingerprint mismatches
    expect(isResetTokenFingerprintValid(parsed!.ph, "salt2:hash2")).toBe(false);
  });

  it("old token without fingerprint is rejected", () => {
    expect(isResetTokenFingerprintValid(undefined, "salt:hash")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { newPasswordError, PASSWORD_MAX } from "./password";

describe("newPasswordError", () => {
  it("menerima kata sandi yang valid dan cocok", () => {
    expect(newPasswordError("tanahliat123", "tanahliat123")).toBeNull();
    expect(newPasswordError("tanahliat123", "tanahliat123", "lamaLama99")).toBeNull();
  });

  it("menolak kata sandi yang terlalu pendek atau terlalu panjang", () => {
    expect(newPasswordError("pendek", "pendek")).toMatch(/minimal 8/);
    const panjang = "a".repeat(PASSWORD_MAX + 1);
    expect(newPasswordError(panjang, panjang)).toMatch(/maksimal 72/);
  });

  it("menolak konfirmasi yang kosong atau berbeda", () => {
    expect(newPasswordError("tanahliat123", "")).toMatch(/Ulangi/);
    expect(newPasswordError("tanahliat123", "tanahliat124")).toMatch(/tidak sama/);
  });

  it("menolak kata sandi baru yang sama dengan yang lama", () => {
    expect(newPasswordError("tanahliat123", "tanahliat123", "tanahliat123")).toMatch(/tidak boleh sama/);
  });
});

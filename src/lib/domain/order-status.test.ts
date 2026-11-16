import { describe, expect, it } from "vitest";
import { canChangeOrderStatus, isOrderOpen, nextOrderStatus } from "./order-status";

describe("alur status pesanan", () => {
  it("langkah berikutnya", () => {
    expect(nextOrderStatus("New")).toBe("Confirmed");
    expect(nextOrderStatus("Ready")).toBe("Completed");
    expect(nextOrderStatus("Completed")).toBeNull();
    expect(nextOrderStatus("Cancelled")).toBeNull();
  });

  it("hanya boleh maju atau dibatalkan selama terbuka", () => {
    expect(canChangeOrderStatus("New", "Confirmed")).toBe(true);
    expect(canChangeOrderStatus("New", "Completed")).toBe(true);
    expect(canChangeOrderStatus("Processing", "Cancelled")).toBe(true);
    expect(canChangeOrderStatus("Ready", "New")).toBe(false);
    expect(canChangeOrderStatus("New", "Ngawur")).toBe(false);
  });

  it("pesanan selesai/dibatalkan sudah final (stok tidak berkurang dua kali)", () => {
    expect(canChangeOrderStatus("Completed", "Completed")).toBe(false);
    expect(canChangeOrderStatus("Completed", "Cancelled")).toBe(false);
    expect(canChangeOrderStatus("Cancelled", "Completed")).toBe(false);
    expect(isOrderOpen("Completed")).toBe(false);
    expect(isOrderOpen("Ready")).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { customerOwed, effectiveUnitPrice, orderPayment, paymentStatusFor, salePayment, totals } from "./payment";

describe("customerOwed", () => {
  it("pesanan Selesai tidak dihitung dua kali (tagihannya sudah ada di penjualan)", () => {
    const sales = [{ outstandingBalance: 300_000 }]; // penjualan hasil pesanan yang selesai
    const orders = [
      { remainingPayment: 300_000, status: "Completed" }, // sama dengan penjualan di atas
      { remainingPayment: 50_000, status: "In Production" },
      { remainingPayment: 90_000, status: "Cancelled" },
    ];
    expect(customerOwed(sales, orders)).toBe(350_000);
  });
});

describe("paymentStatusFor", () => {
  it("dihitung dari angka", () => {
    expect(paymentStatusFor(100, 100)).toBe("Paid");
    expect(paymentStatusFor(100, 40)).toBe("Partially Paid");
    expect(paymentStatusFor(100, 0)).toBe("Unpaid");
    expect(paymentStatusFor(0, 0)).toBe("Paid"); // gratis = lunas
  });
});

describe("totals", () => {
  it("diskon dipotong dari subtotal", () => {
    expect(totals([{ quantity: 2, unitPrice: 50_000 }], 10_000)).toEqual({ subtotal: 100_000, discount: 10_000, total: 90_000 });
  });
  it("diskon tidak boleh melebihi subtotal atau minus", () => {
    expect(totals([{ quantity: 1, unitPrice: 30_000 }], 50_000)).toEqual({ subtotal: 30_000, discount: 30_000, total: 0 });
    expect(totals([{ quantity: 1, unitPrice: 30_000 }], -5)).toMatchObject({ discount: 0, total: 30_000 });
  });
});

describe("effectiveUnitPrice", () => {
  it("harga kosong memakai harga jual", () => {
    expect(effectiveUnitPrice(0, 75_000)).toBe(75_000);
    expect(effectiveUnitPrice(60_000, 75_000)).toBe(60_000);
  });
});

describe("salePayment", () => {
  it("Lunas & Belum mengabaikan jumlah yang diketik", () => {
    expect(salePayment(100_000, "Paid", 5)).toEqual({ amountPaid: 100_000, outstandingBalance: 0, paymentStatus: "Paid" });
    expect(salePayment(100_000, "Unpaid", 5)).toEqual({ amountPaid: 0, outstandingBalance: 100_000, paymentStatus: "Unpaid" });
  });
  it("Sebagian: status mengikuti angka, bukan pilihan", () => {
    expect(salePayment(100_000, "Partially Paid", 40_000).paymentStatus).toBe("Partially Paid");
    expect(salePayment(100_000, "Partially Paid", 0).paymentStatus).toBe("Unpaid");
    expect(salePayment(100_000, "Partially Paid", 250_000)).toEqual({
      amountPaid: 100_000,
      outstandingBalance: 0,
      paymentStatus: "Paid",
    });
  });
  it("status asing dari form diperlakukan sebagai Sebagian", () => {
    expect(salePayment(100_000, "Hack", 10_000).amountPaid).toBe(10_000);
  });
});

describe("orderPayment", () => {
  it("DP dibatasi maksimal total", () => {
    expect(orderPayment(100_000, 150_000)).toEqual({ downPayment: 100_000, remainingPayment: 0, paymentStatus: "Paid" });
    expect(orderPayment(100_000, 30_000)).toEqual({
      downPayment: 30_000,
      remainingPayment: 70_000,
      paymentStatus: "Partially Paid",
    });
    expect(orderPayment(100_000, 0).paymentStatus).toBe("Unpaid");
  });
});

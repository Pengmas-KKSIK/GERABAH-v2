"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { flash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";
import { formatIDRPlain } from "@/lib/format";
import { adjustStock, productStatusForStock } from "@/lib/stock";
import { productHasHistory } from "@/lib/products";
import {
  type FormState,
  UserError,
  run,
  requireBusiness,
  requireContext,
  requireOwner,
  findOrCreateProductCategory,
  findOrCreateProductOtherCostCategory,
  parseAmount,
  parseIntField,
  parseMaterials,
  text,
  logActivity,
} from "./_helpers";

/** Kemasan + Lain-lain (Bahan Baku ada di ProductMaterial, Tenaga Kerja di FixedCost bulanan). */
async function readCostComponents(businessId: string, formData: FormData) {
  const rows: { label: string; amount: number; otherCategoryId?: string }[] = [];

  const packagingCost = parseAmount(formData.get("packagingCost"));
  if (packagingCost > 0) rows.push({ label: "Packaging Cost", amount: packagingCost });

  const otherCost = parseAmount(formData.get("otherCost"));
  if (otherCost > 0) {
    const otherCategoryId = await findOrCreateProductOtherCostCategory(businessId, text(formData.get("otherCostCategory")));
    rows.push({ label: "Other Cost", amount: otherCost, otherCategoryId: otherCategoryId ?? undefined });
  }
  return rows;
}

/** Field yang sama di form tambah & ubah produk. */
function readProductFields(formData: FormData) {
  const name = text(formData.get("name")).slice(0, 120);
  if (!name) throw new UserError("Nama produk wajib diisi.");
  const sellingPrice = parseAmount(formData.get("sellingPrice"));
  if (sellingPrice <= 0) throw new UserError("Isi harga jualnya dulu.");
  return {
    name,
    sellingPrice,
    categoryName: text(formData.get("category")),
    description: text(formData.get("description")) || null,
    material: text(formData.get("material")) || null,
    minStock: parseIntField(formData.get("minStock")),
    materials: parseMaterials(formData.get("materials")),
  };
}

export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  let newId = "";

  const res = await run(async () => {
    const f = readProductFields(formData);
    const stock = parseIntField(formData.get("stock"));
    const [categoryId, photoUrl, costComponents] = await Promise.all([
      findOrCreateProductCategory(business.id, f.categoryName),
      saveUploadedFile(formData.get("photo") as File | null),
      readCostComponents(business.id, formData),
    ]);

    const product = await prisma.product.create({
      data: {
        businessId: business.id,
        name: f.name,
        categoryId,
        description: f.description,
        material: f.material,
        sellingPrice: f.sellingPrice,
        stock,
        minStock: f.minStock,
        photoUrl,
        status: productStatusForStock("active", stock),
        costComponents: { create: costComponents },
        materials: { create: f.materials },
      },
    });
    newId = product.id;
    await logActivity(
      business.id,
      "product.create",
      `Tambah produk ${f.name} (harga ${formatIDRPlain(f.sellingPrice)}, stok ${stock})`
    );
  });

  if (res.error) return res;
  revalidatePath("/products");
  await flash("Produk ditambahkan");
  redirect(`/products/${newId}`);
}

export async function updateProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business, role, user } = await requireContext();
  const id = text(formData.get("id"));
  let sentForApproval = false;

  const res = await run(async () => {
    const product = await prisma.product.findFirst({ where: { id, businessId: business.id } });
    if (!product) throw new UserError("Produk tidak ditemukan.");

    const f = readProductFields(formData);
    const priceChanged = f.sellingPrice !== product.sellingPrice;
    // Staf yang mengubah harga jual butuh persetujuan owner — harga lama dipakai sampai disetujui.
    const needsApproval = priceChanged && role === "staff";
    sentForApproval = needsApproval;
    const removePhoto = text(formData.get("removePhoto")) === "1";

    const [categoryId, uploadedUrl, costComponents] = await Promise.all([
      findOrCreateProductCategory(business.id, f.categoryName),
      saveUploadedFile(formData.get("photo") as File | null),
      readCostComponents(business.id, formData),
    ]);
    const photoUrl = uploadedUrl ?? (removePhoto ? null : product.photoUrl);

    await prisma.$transaction(async (tx) => {
      await tx.productCostComponent.deleteMany({ where: { productId: id } });
      await tx.productMaterial.deleteMany({ where: { productId: id } });
      await tx.product.update({
        where: { id },
        data: {
          name: f.name,
          categoryId,
          description: f.description,
          material: f.material,
          sellingPrice: needsApproval ? product.sellingPrice : f.sellingPrice,
          minStock: f.minStock,
          photoUrl,
          costComponents: { create: costComponents },
          materials: { create: f.materials },
        },
      });

      if (needsApproval) {
        const pending = await tx.productChangeRequest.findFirst({
          where: { productId: id, field: "sellingPrice", status: "pending" },
        });
        if (pending) {
          await tx.productChangeRequest.update({ where: { id: pending.id }, data: { newValue: f.sellingPrice } });
        } else {
          await tx.productChangeRequest.create({
            data: {
              businessId: business.id,
              productId: id,
              field: "sellingPrice",
              oldValue: product.sellingPrice,
              newValue: f.sellingPrice,
              requestedById: user.id,
              requestedByName: user.name,
            },
          });
        }
      }
    });

    await logActivity(
      business.id,
      "product.update",
      needsApproval
        ? `Ajukan perubahan harga ${f.name}: ${formatIDRPlain(product.sellingPrice)} → ${formatIDRPlain(f.sellingPrice)} (menunggu persetujuan pemilik)`
        : priceChanged
          ? `Ubah produk ${f.name} — harga jual ${formatIDRPlain(product.sellingPrice)} → ${formatIDRPlain(f.sellingPrice)}`
          : `Ubah data produk ${f.name}`
    );
  });

  if (res.error) return res;
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  revalidatePath("/approvals");
  await flash(sentForApproval ? "Harga baru dikirim ke pemilik untuk disetujui" : "Produk diperbarui");
  redirect(`/products/${id}`);
}

/** Pengajuan perubahan harga milik usaha ini. Status "pending" dicek atomik saat diproses. */
async function findChangeRequest(businessId: string, requestId: string) {
  const req = await prisma.productChangeRequest.findFirst({
    where: { id: requestId, businessId },
    include: { product: true },
  });
  if (!req) throw new UserError("Pengajuan tidak ditemukan.");
  return req;
}

export async function approveProductChange(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireOwner();
  const requestId = text(formData.get("requestId"));
  let productId = "";

  const res = await run(async () => {
    const req = await findChangeRequest(business.id, requestId);
    productId = req.productId;

    await prisma.$transaction(async (tx) => {
      const { count } = await tx.productChangeRequest.updateMany({
        where: { id: req.id, status: "pending" },
        data: { status: "approved", reviewedAt: new Date() },
      });
      if (count === 0) throw new UserError("Pengajuan ini sudah diproses.");
      await tx.product.update({ where: { id: req.productId }, data: { sellingPrice: req.newValue } });
    });
    await logActivity(
      business.id,
      "product.approve_price",
      `Setujui perubahan harga ${req.product.name}: ${formatIDRPlain(req.oldValue)} → ${formatIDRPlain(req.newValue)} (diajukan ${req.requestedByName})`
    );
  });

  if (res.error) return res;
  revalidatePath("/approvals");
  revalidatePath("/products");
  if (productId) revalidatePath(`/products/${productId}`);
  return { ok: true, message: "Perubahan harga disetujui." };
}

export async function rejectProductChange(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireOwner();
  const requestId = text(formData.get("requestId"));
  const note = text(formData.get("reviewNote")).slice(0, 500);

  const res = await run(async () => {
    const req = await findChangeRequest(business.id, requestId);
    const { count } = await prisma.productChangeRequest.updateMany({
      where: { id: req.id, status: "pending" },
      data: { status: "rejected", reviewedAt: new Date(), reviewNote: note || null },
    });
    if (count === 0) throw new UserError("Pengajuan ini sudah diproses.");
    await logActivity(
      business.id,
      "product.reject_price",
      `Tolak perubahan harga ${req.product.name} (diajukan ${req.requestedByName})`
    );
  });

  if (res.error) return res;
  revalidatePath("/approvals");
  revalidatePath("/products");
  return { ok: true, message: "Pengajuan ditolak." };
}

export async function adjustProductStock(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const productId = text(formData.get("productId"));

  const res = await run(async () => {
    const product = await prisma.product.findFirst({ where: { id: productId, businessId: business.id } });
    if (!product) throw new UserError("Produk tidak ditemukan.");

    const setMode = text(formData.get("mode")) === "set";
    const value = parseIntField(formData.get("value"), setMode ? {} : { min: -1_000_000, max: 1_000_000 });
    const { previous, product: after } = await prisma.$transaction((tx) =>
      adjustStock(tx, product.id, setMode ? { set: value } : { delta: value })
    );
    await logActivity(
      business.id,
      "stock.adjust",
      `Sesuaikan stok ${product.name}: ${previous ?? product.stock} → ${after.stock}`
    );
  });

  if (res.error) return res;
  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  return res;
}

export async function deleteProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const productId = text(formData.get("id"));
  let archived = false;

  const res = await run(async () => {
    const product = await prisma.product.findFirst({ where: { id: productId, businessId: business.id } });
    if (!product) throw new UserError("Produk tidak ditemukan.");

    const archive = await productHasHistory(product.id);
    archived = archive;
    if (archive) {
      await prisma.product.update({ where: { id: product.id }, data: { status: "inactive" } });
    } else {
      await prisma.product.delete({ where: { id: product.id } });
    }
    await logActivity(business.id, "product.delete", `${archive ? "Arsipkan" : "Hapus"} produk ${product.name}`);
  });

  if (res.error) return res;
  revalidatePath("/products");
  await flash(archived ? "Produk dipindah ke Arsip (sudah punya riwayat)" : "Produk dihapus");
  redirect("/products");
}

export async function restoreProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const productId = text(formData.get("id"));

  const res = await run(async () => {
    const product = await prisma.product.findFirst({ where: { id: productId, businessId: business.id } });
    if (!product) throw new UserError("Produk tidak ditemukan.");
    await prisma.product.update({
      where: { id: product.id },
      data: { status: productStatusForStock("active", product.stock) },
    });
    await logActivity(business.id, "product.restore", `Aktifkan kembali produk ${product.name}`);
  });

  if (res.error) return res;
  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  return res;
}

import { Badge } from "./ui";
import { IconBox, IconCheck, IconCheckCircle, IconFlame, IconHalfCircle, IconHourglass, IconPlusCircle, IconX } from "./icons";
import { orderStatusLabel, orderStatusTone, paymentStatusLabel, paymentStatusTone } from "@/lib/labels";

const cls = "h-4 w-4";

/** Status bayar: Lunas / Belum Lunas / Dibayar Sebagian. Selalu ikon + tulisan. */
export function PaymentBadge({ status }: { status: string }) {
  const icon =
    status === "Paid" ? (
      <IconCheckCircle className={cls} strokeWidth={2.2} />
    ) : status === "Partially Paid" ? (
      <IconHalfCircle className={cls} strokeWidth={2.2} />
    ) : status === "Cancelled" ? (
      <IconX className={cls} strokeWidth={2.2} />
    ) : (
      <IconHourglass className={cls} strokeWidth={2.2} />
    );
  return (
    <Badge tone={paymentStatusTone(status)} icon={icon}>
      {paymentStatusLabel(status)}
    </Badge>
  );
}

/** Tahap pesanan: Baru → Dikonfirmasi → Diproses → Siap Diambil → Selesai. */
export function OrderBadge({ status }: { status: string }) {
  const icon =
    status === "New" ? (
      <IconPlusCircle className={cls} strokeWidth={2.2} />
    ) : status === "Confirmed" ? (
      <IconCheckCircle className={cls} strokeWidth={2.2} />
    ) : status === "Processing" ? (
      <IconFlame className={cls} strokeWidth={2.2} />
    ) : status === "Ready" ? (
      <IconBox className={cls} strokeWidth={2.2} />
    ) : status === "Completed" ? (
      <IconCheck className={cls} strokeWidth={2.4} />
    ) : (
      <IconX className={cls} strokeWidth={2.2} />
    );
  return (
    <Badge tone={orderStatusTone(status)} icon={icon}>
      {orderStatusLabel(status)}
    </Badge>
  );
}

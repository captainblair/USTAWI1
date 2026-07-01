import { Check } from "lucide-react";

const RAYS = [
  { rotate: 0, color: "#FACC15" },
  { rotate: 45, color: "#60A5FA" },
  { rotate: 90, color: "#FB923C" },
  { rotate: 135, color: "#EF4444" },
  { rotate: 180, color: "#FACC15" },
  { rotate: 225, color: "#60A5FA" },
  { rotate: 270, color: "#FB923C" },
  { rotate: 315, color: "#EF4444" },
];

export function PaymentSuccessIcon() {
  return (
    <div className="relative mx-auto h-36 w-36 sm:h-40 sm:w-40">
      {RAYS.map((ray) => (
        <span
          key={ray.rotate}
          className="absolute left-1/2 top-1/2 h-14 w-1 origin-bottom rounded-full opacity-90 sm:h-16"
          style={{
            backgroundColor: ray.color,
            transform: `translate(-50%, -100%) rotate(${ray.rotate}deg)`,
          }}
          aria-hidden
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-[#1F2B6C] shadow-lg sm:h-20 sm:w-20">
          <Check className="h-9 w-9 text-white sm:h-10 sm:w-10" strokeWidth={3} />
        </div>
      </div>
    </div>
  );
}

function MpesaMark() {
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#4CAF50] text-[10px] font-extrabold text-white">
      M
    </span>
  );
}

export function PaymentDetailsCard({
  amount,
  phoneMasked,
  date,
  invoiceRef,
  confirmationNumber,
}: {
  amount: string;
  phoneMasked: string;
  date: string;
  invoiceRef: string;
  confirmationNumber: string;
}) {
  return (
    <div className="mt-8 rounded-2xl border border-[#E8EAF2] bg-white p-6 text-left shadow-sm sm:p-8">
      <h2 className="text-lg font-bold text-ustawi-navy">Payment Details</h2>

      <div className="mt-5 space-y-3 text-sm text-ustawi-navy">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">Amount:</span>
          <span className="font-bold">{amount}</span>
          <MpesaMark />
        </div>
        <p>
          <span className="font-medium">Paid With</span> {phoneMasked}
        </p>
        <p>
          <span className="font-medium">Date:</span> {date}
        </p>
        <p>
          <span className="font-medium">Property/Invoice Ref:</span> {invoiceRef}
        </p>
        <p>
          <span className="font-medium">Confirmation Number:</span>{" "}
          <span className="font-mono text-xs sm:text-sm">{confirmationNumber}</span>
        </p>
      </div>

      <p className="mt-6 text-sm text-ustawi-muted">
        A full receipt has been sent to your email.
      </p>
    </div>
  );
}

export function formatPaymentSuccessDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function maskMpesaPhone(phone: string | null | undefined) {
  if (!phone) return "M-Pesa";
  const digits = phone.replace(/\D/g, "");
  const last3 = digits.slice(-3) || "000";
  return `M-Pesa (***${last3})`;
}

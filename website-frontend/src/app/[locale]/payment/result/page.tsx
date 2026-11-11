import { redirect } from "next/navigation";

// payment-service sends the browser back here after VNPay / MoMo
// (app.frontend-result-url = http://localhost:3000/payment/result?paymentId=…&result=success|failed|invalid;
// next-intl adds the locale prefix). The redirect itself changes nothing: the
// in-app payment page polls GET /payments/{id} until the gateway's IPN lands.
export default async function PaymentResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";

  const q = new URLSearchParams({ page: "order-payment" });
  const paymentId = first(sp.paymentId);
  const result = first(sp.result);
  if (paymentId) q.set("paymentId", paymentId);
  if (result) q.set("result", result);
  // Without a paymentId (signature could not be verified) the client lands on Orders.
  if (!paymentId) q.set("page", "orders");

  redirect(`/${locale === "en" ? "en" : "vi"}?${q.toString()}`);
}

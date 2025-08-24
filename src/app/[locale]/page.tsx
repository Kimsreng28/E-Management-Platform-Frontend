// app/[locale]/page.tsx
import { redirect } from "next/navigation";

export default async function LocalePage({
  params,
}: {
  params: { locale: string };
}) {
  // Await params to satisfy Next 15 requirement
  const awaitedParams = await Promise.resolve(params);
  const locale = awaitedParams.locale;

  // Redirect to the default page
  redirect(`/${locale}/customer`);
}

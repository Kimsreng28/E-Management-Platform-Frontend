// app/[locale]/page.tsx
import { redirect } from "next/navigation";

export default function LocalePage({ params }: { params: { locale: string } }) {
  // Redirect to customer page by default
  redirect(`/${params.locale}/customer`);
}

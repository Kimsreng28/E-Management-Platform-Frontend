import { Inria_Sans } from "next/font/google";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "kh" }];
}

const inriaSans = Inria_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-inria-sans",
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!["en", "kh"].includes(params.locale)) notFound();

  return (
    <div
      className={`${inriaSans.variable} font-sans antialiased bg-white text-gray-900`}
    >
      {children}
    </div>
  );
}

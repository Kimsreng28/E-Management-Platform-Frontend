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

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  // Await params if the framework requires it
  const awaitedParams = await Promise.resolve(params); // Next 15 fix
  const locale = awaitedParams.locale;

  if (!locale || !["en", "kh"].includes(locale)) {
    notFound();
  }

  return (
    <div
      className={`${inriaSans.variable} font-sans antialiased bg-white text-gray-900`}
    >
      {children}
    </div>
  );
}

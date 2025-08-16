import Features from "@/components/ui/customer/Features";
import ShowCase from "@/components/ui/customer/ShowCase";
import { useTranslations } from "@/utils/useTranslations";
import { AiOutlineFileProtect } from "react-icons/ai";
import { BiSupport } from "react-icons/bi";
import { MdDeliveryDining } from "react-icons/md";

export default function CustomerHomePagee({
  params,
}: {
  params: { locale: "en" | "kh" };
}) {
  const language = params.locale || "en";
  const t = useTranslations(language);

  const featureItems = [
    {
      title: t.feature.qualityGuarantee,
      description: t.feature.authenticProducts,
      icon: <AiOutlineFileProtect className="h-8 w-8 text-primary" />,
    },
    {
      title: t.feature.fastDelivery,
      description: t.feature.delivery24h,
      icon: <MdDeliveryDining className="h-8 w-8 text-primary" />,
    },
    {
      title: t.feature.technicalSupport,
      description: t.feature.expertAssistance,
      icon: <BiSupport className="h-8 w-8 text-primary" />,
    },
  ];

  return (
    <main>
      <ShowCase language={language} />
      <Features features={featureItems} />
    </main>
  );
}

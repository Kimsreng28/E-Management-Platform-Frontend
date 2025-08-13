import en from "../../locales/en/common.json";
import kh from "../../locales/kh/common.json";

export function useTranslations(language: "en" | "kh") {
  return language === "kh" ? kh : en;
}

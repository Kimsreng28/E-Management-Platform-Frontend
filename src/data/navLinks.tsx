type TranslationKeys = "Home" | "Products" | "Categories" | "Contact";

export const navLinks: { href: string; label: TranslationKeys }[] = [
  { href: "/customer", label: "Home" },
  { href: "/customer/products", label: "Products" },
  { href: "/customer/categories", label: "Categories" },
  { href: "/customer/contact", label: "Contact" },
];

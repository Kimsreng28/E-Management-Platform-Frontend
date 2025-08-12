import clsx from "clsx";
import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline" | "black";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function Button({
  children,
  variant = "default",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const baseStyle =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    default: "bg-primary text-white hover:bg-primary-dark focus:ring-primary",
    ghost: "bg-transparent hover:bg-primary/10 focus:ring-primary",
    outline: "border border-border hover:bg-primary/5 focus:ring-primary",
    black: "bg-black text-white hover:bg-gray-900 focus:ring-black",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={clsx(baseStyle, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

import clsx from "clsx";
import React from "react";

export function Card({
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-gray-300 bg-white shadow-md font-inria-sans",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("flex flex-col space-y-2 p-6", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={clsx(
        "text-2xl font-semibold tracking-tight text-black",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={clsx("text-sm text-gray-600", className)}>{children}</p>;
}

export function CardContent({
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("p-6 pt-0", className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("flex items-center p-6 pt-0", className)}>
      {children}
    </div>
  );
}

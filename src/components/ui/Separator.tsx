import React from "react";

type SeparatorProps = React.HTMLAttributes<HTMLHRElement> & {
  className?: string;
};

export function Separator({ className, ...props }: SeparatorProps) {
  return (
    <hr
      className={`border-border border-t-1 my-4 ${className || ""}`}
      {...props}
    />
  );
}

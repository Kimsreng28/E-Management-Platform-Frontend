import React from "react";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  className?: string;
};

export function Label({ children, className, ...props }: LabelProps) {
  return (
    <label
      className={`block text-sm font-medium text-black font-inria-sans ${
        className || ""
      }`}
      {...props}
    >
      {children}
    </label>
  );
}

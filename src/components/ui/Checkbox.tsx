import clsx from "clsx";
import React from "react";

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  onCheckedChange?: (checked: boolean) => void;
  checked?: boolean;
  id?: string;
  className?: string;
};

export function Checkbox({
  checked,
  onCheckedChange,
  id,
  className,
  ...props
}: CheckboxProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckedChange) onCheckedChange(e.target.checked);
  };

  return (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={handleChange}
      className={clsx(
        "h-4 w-4 rounded border-black text-black  focus:ring-offset-white disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
      {...props}
    />
  );
}

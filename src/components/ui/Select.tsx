import clsx from "clsx";
import React, {
  HTMLAttributes,
  ReactNode,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";

type SelectContextType = {
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const SelectContext = React.createContext<SelectContextType | undefined>(
  undefined
);

type SelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
};

export function Select({ value, onValueChange, children }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown on outside click
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div ref={ref} className="relative inline-block w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

type SelectTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) {
      throw new Error("SelectTrigger must be used inside Select");
    }

    const { isOpen, setIsOpen } = context;

    return (
      <button
        type="button"
        ref={ref}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

SelectTrigger.displayName = "SelectTrigger";

type SelectValueProps = {
  placeholder?: string;
  className?: string;
};

export function SelectValue({ placeholder, className }: SelectValueProps) {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("SelectValue must be used inside Select");
  }
  const { value } = context;

  return (
    <span
      className={clsx(
        "block truncate text-sm text-gray-700",
        !value && "text-gray-400",
        className
      )}
    >
      {value || placeholder}
    </span>
  );
}

type SelectContentProps = HTMLAttributes<HTMLDivElement>;

export function SelectContent({
  className,
  children,
  ...props
}: SelectContentProps) {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("SelectContent must be used inside Select");
  }

  const { isOpen } = context;

  if (!isOpen) return null;

  return (
    <div
      className={clsx(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg",
        className
      )}
      role="listbox"
      tabIndex={-1}
      {...props}
    >
      {children}
    </div>
  );
}

type SelectItemProps = {
  value: string;
  children: ReactNode;
  className?: string;
};

export function SelectItem({ value, children, className }: SelectItemProps) {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("SelectItem must be used inside Select");
  }
  const { value: selectedValue, onValueChange, setIsOpen } = context;

  const isSelected = selectedValue === value;

  function onSelect() {
    if (onValueChange) onValueChange(value);
    setIsOpen(false);
  }

  return (
    <div
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={clsx(
        "cursor-pointer select-none px-3 py-2 text-sm text-gray-700 hover:bg-primary/20",
        isSelected && "bg-primary/30 font-semibold",
        className
      )}
    >
      {children}
    </div>
  );
}

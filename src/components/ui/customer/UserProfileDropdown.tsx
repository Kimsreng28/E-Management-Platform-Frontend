import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function UserProfileDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        aria-label="User account"
        title="User account"
        onClick={() => setOpen(!open)}
        className="bg-gray-200 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-black"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-600"
          viewBox="0 0 24 24"
        >
          <g fill="none">
            <path
              fill="currentColor"
              fillOpacity="0.16"
              d="M19.523 21.99H4.488c-1.503 0-2.663-1.134-2.466-2.624l.114-.869c.207-1.2 1.305-1.955 2.497-2.214L11.928 15h.144l7.295 1.283c1.212.28 2.29.993 2.497 2.214l.114.88c.197 1.49-.963 2.623-2.466 2.623z"
            />
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M19.523 21.99H4.488c-1.503 0-2.663-1.134-2.466-2.624l.114-.869c.207-1.2 1.305-1.955 2.497-2.214L11.928 15h.144l7.295 1.283c1.212.28 2.29.993 2.497 2.214l.114.88c.197 1.49-.963 2.623-2.466 2.623zM17 7A5 5 0 1 1 7 7a5 5 0 0 1 10 0"
            />
          </g>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <Link
            href="/auth/login"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            onClick={() => setOpen(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="inline mr-2 h-5 w-5"
              viewBox="0 0 24 24"
            >
              <g
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="1.5"
              >
                <path
                  stroke-linejoin="round"
                  d="M2.001 11.999h14m0 0l-3.5-3m3.5 3l-3.5 3"
                />
                <path d="M9.002 7c.012-2.175.109-3.353.877-4.121C10.758 2 12.172 2 15 2h1c2.829 0 4.243 0 5.122.879C22 3.757 22 5.172 22 8v8c0 2.828 0 4.243-.878 5.121c-.769.769-1.947.865-4.122.877M9.002 17c.012 2.175.109 3.353.877 4.121c.641.642 1.568.815 3.121.862" />
              </g>
            </svg>
            Login
          </Link>
          <Link
            href="/auth/register"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            onClick={() => setOpen(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="inline mr-2 h-5 w-5"
              viewBox="0 0 24 24"
            >
              <path
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0-8 0m8 12h6m-3-3v6M6 21v-2a4 4 0 0 1 4-4h4"
              />
            </svg>
            Register
          </Link>
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            onClick={() => setOpen(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 inline mr-2"
              viewBox="0 0 16 16"
            >
              <path
                fill="currentColor"
                d="M6.047 1H2.14A1.14 1.14 0 0 0 1 2.14v5.657a1.14 1.14 0 0 0 1.14 1.14h3.907a1.14 1.14 0 0 0 1.14-1.14V2.14A1.14 1.14 0 0 0 6.046 1m.162 6.797a.163.163 0 0 1-.162.162H2.14a.163.163 0 0 1-.163-.162V2.14a.163.163 0 0 1 .163-.163h3.907a.163.163 0 0 1 .162.163zm-.162 2.767H2.14A1.14 1.14 0 0 0 1 11.704v2.156A1.14 1.14 0 0 0 2.14 15h3.907a1.14 1.14 0 0 0 1.14-1.14v-2.156a1.14 1.14 0 0 0-1.14-1.14m.162 3.297a.163.163 0 0 1-.162.162H2.14a.163.163 0 0 1-.163-.162v-2.158a.163.163 0 0 1 .163-.162h3.907a.163.163 0 0 1 .162.162zM13.861 1H9.953a1.14 1.14 0 0 0-1.139 1.14v2.157a1.14 1.14 0 0 0 1.14 1.14h3.906A1.14 1.14 0 0 0 15 4.296V2.14A1.14 1.14 0 0 0 13.86 1m.162 3.297a.163.163 0 0 1-.162.162H9.953a.163.163 0 0 1-.162-.162V2.14a.163.163 0 0 1 .162-.163h3.908a.163.163 0 0 1 .162.163zm-.248 2.767H9.867a1.14 1.14 0 0 0-1.14 1.14v5.656A1.14 1.14 0 0 0 9.867 15h3.907a1.14 1.14 0 0 0 1.14-1.14V8.204a1.14 1.14 0 0 0-1.14-1.139m.163 6.797a.163.163 0 0 1-.163.162H9.867a.163.163 0 0 1-.163-.162V8.203a.163.163 0 0 1 .163-.162h3.907a.163.163 0 0 1 .163.162z"
              />
            </svg>
            Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}

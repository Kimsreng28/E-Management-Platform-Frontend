import { getCurrentUser, logoutUser } from "@/lib/api/auth";
import { API_BASE_URL } from "@/lib/config";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import LoadingOverlay from "../LoadingOverlay";
import initializeEcho from "@/lib/echo";
import _ from "lodash";

export function UserProfileDropdown() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([]);
  const echoRef = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const [isNavigating, startTransition] = useTransition();

  // get current locale from url
  const currentLocale = pathname.split("/")[1] || "en";

  // Fetch user data on component mount
  const fetchUser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const userData = await getCurrentUser();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveDeliveries = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/deliveries/active`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActiveDeliveries(data.deliveries || []);
      }
    } catch (error) {
      console.error("Failed to fetch active deliveries:", error);
      setActiveDeliveries([]);
    }
  };

  const debouncedFetchActiveDeliveries = useCallback(
    _.debounce(fetchActiveDeliveries, 2000),
    []
  );

  // Initialize Echo only once and manage it with ref
  const initializeRealTimeUpdates = useCallback(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !user) return;

      // Clean up existing Echo instance
      if (echoRef.current) {
        echoRef.current.disconnect();
        echoRef.current = null;
      }

      const echoInstance = initializeEcho(token);
      if (!echoInstance) return;

      echoRef.current = echoInstance;

      const channelName = `user.${user.id}`;
      const channel = echoInstance.channel(channelName);

      const handler = (e: any) => {
        debouncedFetchActiveDeliveries();
      };

      // Attach only once
      channel.listen(".active-deliveries.updated", handler);

      return () => {
        channel.stopListening(".active-deliveries.updated", handler);
        echoInstance.leave(channelName);
      };
    } catch (error) {
      console.error("Error initializing real-time updates:", error);
    }
  }, [user, debouncedFetchActiveDeliveries]);

  // Fetch user + deliveries on mount
  useEffect(() => {
    fetchUser();
    fetchActiveDeliveries();
  }, []);

  // Subscribe to real-time updates when user is ready
  useEffect(() => {
    if (!user) return;

    const cleanup = initializeRealTimeUpdates();

    return () => {
      if (cleanup) cleanup();
      if (echoRef.current) {
        echoRef.current.disconnect();
        echoRef.current = null;
      }
    };
  }, [user, initializeRealTimeUpdates]);

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

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setOpen(false);
      // remove token
      localStorage.removeItem("token");

      // refetch user data
      await fetchUser();

      router.push(`/${currentLocale}/customer`);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleClick = (href: string) => {
    setOpen(false);
    startTransition(() => {
      router.push(href);
    });
  };

  const handleTrackDelivery = (deliveryId: number) => {
    setOpen(false);
    startTransition(() => {
      router.push(`/${currentLocale}/customer/delivery-tracking/${deliveryId}`);
    });
  };

  if (loading) {
    return (
      <div className="relative">
        <button className="bg-gray-200 p-2 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-600"
            viewBox="0 0 24 24"
          >
            {/* Loading spinner icon */}
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
              d="M12 3v3m6.366-.366l-2.12 2.12M21 12h-3m.366 6.366l-2.12-2.12M12 21v-3m-6.366.366l2.12-2.12M3 12h3m-.366-6.366l2.12 2.12"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>

      {/* Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-700 mx-auto mb-4"></div>
          </div>
        </div>
      )}

      <button
        aria-label="User account"
        title="User account"
        onClick={() => setOpen(!open)}
        className="bg-gray-200 p-2 cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-black"
      >
        {user ? (
          user.avatar || user.photo_url ? (
            <img
              src={
                // If starts with "http", use directly; otherwise prepend API or public path
                user.avatar?.startsWith("http")
                  ? user.avatar
                  : `${API_BASE_URL}/storage/${user.avatar}` // or wherever your local avatars are served
              }
              alt={user.name || "User"}
              className="h-6 w-6 rounded-full object-cover"
              onError={(e) => {
                // fallback to photo_url if avatar fails
                const target = e.currentTarget as HTMLImageElement;
                if (user.photo_url && user.photo_url.startsWith("http")) {
                  target.src = user.photo_url;
                } else {
                  target.src = "/default-avatar.png"; // fallback image
                }
              }}
            />
          ) : (
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-500 text-white">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </span>
          )
        ) : (
          // Default icon for guest
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
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          {!user ? (
            <>
              <Link
                href={`/${currentLocale}/auth/login`}
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 "
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
                href={`/${currentLocale}/auth/register`}
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 "
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M15 4a4 4 0 0 0-4 4a4 4 0 0 0 4 4a4 4 0 0 0 4-4a4 4 0 0 0-4-4m0 1.9a2.1 2.1 0 1 1 0 4.2A2.1 2.1 0 0 1 12.9 8A2.1 2.1 0 0 1 15 5.9M4 7v3H1v2h3v3h2v-3h3v-2H6V7zm11 6c-2.67 0-8 1.33-8 4v3h16v-3c0-2.67-5.33-4-8-4m0 1.9c2.97 0 6.1 1.46 6.1 2.1v1.1H8.9V17c0-.64 3.1-2.1 6.1-2.1"
                  />
                </svg>
                Register
              </Link>
            </>
          ) : user.role?.name === "admin" ? (
            <>
              <div className="relative">
                <button
                  onClick={() => handleClick(`/${currentLocale}/dashboard`)}
                  className="flex cursor-pointer items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fill="currentColor"
                      d="M6.047 1H2.14A1.14 1.14 0 0 0 1 2.14v5.657a1.14 1.14 0 0 0 1.14 1.14h3.907a1.14 1.14 0 0 0 1.14-1.14V2.14A1.14 1.14 0 0 0 6.046 1m.162 6.797a.163.163 0 0 1-.162.162H2.14a.163.163 0 0 1-.163-.162V2.14a.163.163 0 0 1 .163-.163h3.907a.163.163 0 0 1 .162.163zm-.162 2.767H2.14A1.14 1.14 0 0 0 1 11.704v2.156A1.14 1.14 0 0 0 2.14 15h3.907a1.14 1.14 0 0 0 1.14-1.14v-2.156a1.14 1.14 0 0 0-1.14-1.14m.162 3.297a.163.163 0 0 1-.162.162H2.14a.163.163 0 0 1-.163-.162v-2.158a.163.163 0 0 1 .163-.162h3.907a.163.163 0 0 1 .162.162zM13.861 1H9.953a1.14 1.14 0 0 0-1.139 1.14v2.157a1.14 1.14 0 0 0 1.14 1.14h3.906A1.14 1.14 0 0 0 15 4.296V2.14A1.14 1.14 0 0 0 13.86 1m.162 3.297a.163.163 0 0 1-.162.162H9.953a.163.163 0 0 1-.162-.162V2.14a.163.163 0 0 1 .162-.163h3.908a.163.163 0 0 1 .162.163zm-.248 2.767H9.867a1.14 1.14 0 0 0-1.14 1.14v5.656A1.14 1.14 0 0 0 9.867 15h3.907a1.14 1.14 0 0 0 1.14-1.14V8.204a1.14 1.14 0 0 0-1.14-1.139m.163 6.797a.163.163 0 0 1-.163.162H9.867a.163.163 0 0 1-.163-.162V8.203a.163.163 0 0 1 .163-.162h3.907a.163.163 0 0 1 .163.162z"
                    />
                  </svg>
                  Dashboard
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="w-full cursor-pointer text-left flex items-center px-4 py-2 text-red-500 hover:bg-gray-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 "
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
                      d="M15 12H2m0 0l3.5-3M2 12l3.5 3"
                    />
                    <path d="M9.002 7c.012-2.175.109-3.353.877-4.121C10.758 2 12.172 2 15 2h1c2.829 0 4.243 0 5.122.879C22 3.757 22 5.172 22 8v8c0 2.828 0 4.243-.878 5.121c-.769.769-1.947.865-4.122.877M9.002 17c.012 2.175.109 3.353.877 4.121c.641.642 1.568.815 3.121.862" />
                  </g>
                </svg>
                Logout
              </button>
            </>
          ) : (
            <>
              {/* Active Deliveries Section */}
              {activeDeliveries.length > 0 && (
                <div className="border-b border-gray-200">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Active Deliveries
                  </div>
                  {activeDeliveries.map((delivery) => (
                    <button
                      key={delivery.id}
                      onClick={() => handleTrackDelivery(delivery.id)}
                      className="flex items-center cursor-pointer px-4 py-2 text-blue-600 hover:bg-gray-100 w-full text-left"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 24 24"
                      >
                        <g fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M2 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H2V3Z" />
                          <path d="M22 3h-4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4V3Z" />
                          <path d="M10 7h4m-4 4h4m-4 4h4" />
                        </g>
                      </svg>
                      Track Order #{delivery.order?.order_number || delivery.id}
                    </button>
                  ))}
                </div>
              )}

              <Link
                href={`/${currentLocale}/customer/order`}
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7.5 18a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3Zm9 0a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3Z" /><path stroke-linecap="round" stroke-linejoin="round" d="m11 10.8l1.143 1.2L15 9" /><path stroke-linecap="round" d="m2 3l.261.092c1.302.457 1.953.686 2.325 1.231s.372 1.268.372 2.715V9.76c0 2.942.063 3.912.93 4.826c.866.914 2.26.914 5.05.914H12m4.24 0c1.561 0 2.342 0 2.894-.45c.551-.45.709-1.214 1.024-2.743l.5-2.424c.347-1.74.52-2.609.076-3.186c-.443-.577-1.96-.577-3.645-.577h-6.065m-6.066 0H7" /></g></svg>
                Orders History
              </Link>

              <Link
                href={`/${currentLocale}/customer/profile`}
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2 h-5 w-5"
                  viewBox="0 0 24 24"
                >
                  <g fill="none" stroke="currentColor" stroke-width="1.5">
                    <path
                      stroke-linejoin="round"
                      d="M4 18a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"
                    />
                    <circle cx="12" cy="7" r="3" />
                  </g>
                </svg>
                Profile
              </Link>

              <button
                onClick={handleLogout}
                className="w-full cursor-pointer text-left flex items-center px-4 py-2 text-red-500 hover:bg-gray-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 "
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
                      d="M15 12H2m0 0l3.5-3M2 12l3.5 3"
                    />
                    <path d="M9.002 7c.012-2.175.109-3.353.877-4.121C10.758 2 12.172 2 15 2h1c2.829 0 4.243 0 5.122.879C22 3.757 22 5.172 22 8v8c0 2.828 0 4.243-.878 5.121c-.769.769-1.947.865-4.122.877M9.002 17c.012 2.175.109 3.353.877 4.121c.641.642 1.568.815 3.121.862" />
                  </g>
                </svg>
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function getDeliveryStatusColor(status: string) {
  switch (status) {
    case 'assigned': return 'bg-blue-100 text-blue-800';
    case 'picked_up': return 'bg-yellow-100 text-yellow-800';
    case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
    case 'delivered': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
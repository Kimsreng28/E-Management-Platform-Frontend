import { useTranslations } from "@/utils/useTranslations";
import { usePathname, useRouter } from "next/navigation";

interface Order {
  id: string;
  customer: string;
  product: string;
  amount: string;
  status: string;
}

interface RecentOrdersProps {
  orders: Order[];
  params?: { locale: "en" | "kh" };
}

export default function RecentOrders({ orders, params }: RecentOrdersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const language = params?.locale || "en";
  const currentLocale = pathname.split("/")[1] || "en";
  const t = useTranslations(language);

  // Function to get classes based on status
  const getStatusClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "shipped":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "delivered":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "refunded":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-200 text-black dark:bg-gray-700 dark:text-white";
    }
  };

  return (
    <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recent Orders
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            You have {orders.length} recent orders this{" "}
            {orders.length > 1 ? "week" : "day"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push(`/${language}/dashboard/orders`)}
          className="text-primary cursor-pointer transition hover:bg-gray-800 flex items-center text-sm font-semibold bg-black text-white py-2 px-4 rounded-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 24 24"
          >
            <g fill="none" stroke="currentColor" strokeWidth="1.5">
              <path
                strokeLinecap="round"
                d="M9 4.46A9.8 9.8 0 0 1 12 4c4.182 0 7.028 2.5 8.725 4.704C21.575 9.81 22 10.361 22 12c0 1.64-.425 2.191-1.275 3.296C19.028 17.5 16.182 20 12 20s-7.028-2.5-8.725-4.704C2.425 14.192 2 13.639 2 12c0-1.64.425-2.191 1.275-3.296A14.5 14.5 0 0 1 5 6.821"
              />
              <path d="M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0Z" />
            </g>
          </svg>
          View all
        </button>
      </div>

      {/* Responsive scrollable table */}
      {orders.length > 0 ? (
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm text-gray-900 dark:text-gray-200">
            <thead>
              <tr className="text-left font-bold border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 px-2">Order ID</th>
                <th className="px-2">Customer</th>
                <th className="px-2">Product</th>
                <th className="px-2">Amount</th>
                <th className="px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <td className="py-2 px-2">{order.id}</td>
                  <td className="px-2">{order.customer}</td>
                  <td className="px-2">{order.product}</td>
                  <td className="px-2">{order.amount}</td>
                  <td className="px-2">
                    <div
                      className={`inline-flex shadow-sm border border-gray-300 dark:border-gray-600 rounded-md font-semibold px-3 py-1 text-xs sm:text-sm ${getStatusClasses(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3h18v18H3V3z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v8m4-4H8"
            />
          </svg>
          <p className="text-lg font-semibold">No recent orders</p>
          <p className="text-sm text-gray-400">You haven’t placed any orders yet.</p>
        </div>
      )}
    </div>
  );
}

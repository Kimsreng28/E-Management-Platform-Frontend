interface Order {
  id: string;
  customer: string;
  product: string;
  total: string;
  status: string;
}

interface RecentOrdersProps {
  orders: Order[];
}

export default function RecentOrders({ orders }: RecentOrdersProps) {
  // Function to get classes based on status
  const getStatusClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-red-600 cursor-pointer text-white hover:bg-red-700";
      case "completed":
        return "bg-black text-white cursor-pointer  hover:bg-gray-900";
      case "processing":
        return "bg-white text-black cursor-pointer  border border-gray-300 hover:bg-gray-200";
      default:
        return "bg-gray-200 text-black";
    }
  };

  return (
    <div className="lg:col-span-2 bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold ">Recent Orders</h2>
          <p className="text-sm text-gray-600 mb-4">
            You have {orders.length} recent orders this{" "}
            {orders.length > 1 ? "week" : "day"}
          </p>
        </div>

        <button
          type="button"
          className="text-primary transition hover:bg-gray-900 flex items-center text-sm font-semibold bg-black text-white py-2 px-4 rounded-lg"
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
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left font-bold border-b">
            <th className="py-2">Order ID</th>
            <th>Customer</th>
            <th>Product</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b last:border-0">
              <td className="py-2">{order.id}</td>
              <td>{order.customer}</td>
              <td>{order.product}</td>
              <td>{order.total}</td>
              <td>
                <div
                  className={`inline-flex shadow-sm border border-gray-300 rounded-md font-semibold px-3 py-1 text-sm ${getStatusClasses(
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
  );
}

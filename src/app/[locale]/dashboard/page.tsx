import ProtectedRoute from "@/components/ProtectedRoute";
import LowStockAlert from "@/components/ui/dashboard/LowStockAlert";
import RecentOrders from "@/components/ui/dashboard/RecentOrders";
import StatCard from "@/components/ui/dashboard/StatCard";

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Revenue",
      value: "$24,500",
      change: "+10% from last month",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-600"
          viewBox="0 0 24 24"
        >
          <g
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-width="1.5"
          >
            <path d="M12 6v12m3-8.5C15 8.12 13.657 7 12 7S9 8.12 9 9.5s1.343 2.5 3 2.5s3 1.12 3 2.5s-1.343 2.5-3 2.5s-3-1.12-3-2.5" />
            <path d="M7 3.338A9.95 9.95 0 0 1 12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12c0-1.821.487-3.53 1.338-5" />
          </g>
        </svg>
      ),
    },

    {
      title: "Orders",
      value: "+1,230",
      change: "+180.1% from last month",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-600"
          viewBox="0 0 24 24"
        >
          <g fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M7.5 18a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3Zm9 0a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3Z" />
            <path
              stroke-linecap="round"
              d="M11 9H8M2 3l.265.088c1.32.44 1.98.66 2.357 1.184S5 5.492 5 6.883V9.5c0 2.828 0 4.243.879 5.121c.878.879 2.293.879 5.121.879h2m6 0h-2"
            />
            <path
              stroke-linecap="round"
              d="M5 6h3m-2.5 7h10.522c.96 0 1.439 0 1.815-.248s.564-.688.942-1.57l.429-1c.81-1.89 1.214-2.833.77-3.508C19.533 6 18.505 6 16.45 6H12"
            />
          </g>
        </svg>
      ),
    },
    {
      title: "Products",
      value: "320",
      change: "+19% from last month",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-600"
          viewBox="0 0 24 24"
        >
          <path
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-width="1.5"
            d="m15.578 3.382l2 1.05c2.151 1.129 3.227 1.693 3.825 2.708C22 8.154 22 9.417 22 11.942v.117c0 2.524 0 3.787-.597 4.801c-.598 1.015-1.674 1.58-3.825 2.709l-2 1.049C13.822 21.539 12.944 22 12 22s-1.822-.46-3.578-1.382l-2-1.05c-2.151-1.129-3.227-1.693-3.825-2.708C2 15.846 2 14.583 2 12.06v-.117c0-2.525 0-3.788.597-4.802c.598-1.015 1.674-1.58 3.825-2.708l2-1.05C10.178 2.461 11.056 2 12 2s1.822.46 3.578 1.382ZM21 7.5l-4 2M12 12L3 7.5m9 4.5v9.5m0-9.5l4.5-2.25l.5-.25m0 0V13m0-3.5l-9.5-5"
          />
        </svg>
      ),
    },
    {
      title: "Active Customers",
      value: "+890",
      change: "+201 since last hour",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-600"
          viewBox="0 0 24 24"
        >
          <path
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M21 19.75c0-2.09-1.67-5.068-4-5.727m-2 5.727c0-2.651-2.686-6-6-6s-6 3.349-6 6m9-12.5a3 3 0 1 1-6 0a3 3 0 0 1 6 0m3 3a3 3 0 1 0 0-6"
          />
        </svg>
      ),
    },
  ];

  const orders = [
    {
      id: "#001",
      customer: "John Doe",
      product: "Digital Multimeter DM-200",
      total: "$120.00",
      status: "Completed",
    },
    {
      id: "#002",
      customer: "Jane Smith",
      product: "Digital Multimeter DM-200",
      total: "$75.00",
      status: "Pending",
    },
    {
      id: "#003",
      customer: "Sam Wilson",
      product: "Digital Multimeter DM-200",
      total: "$210.00",
      status: "Shipped",
    },
  ];

  const lowStock = [
    { name: "USB-C Charger", stock: 3, status: "low" },
    { name: "Wireless Mouse", stock: 5, status: "low" },
    { name: "Laptop Stand", stock: 2, status: "low" },
  ];

  return (
    <ProtectedRoute role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        </div>
        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              icon={stat.icon}
            />
          ))}
        </div>

        {/* Recent Orders & Low Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders */}
          <RecentOrders orders={orders} />

          {/* Low Stock */}
          <LowStockAlert lowStock={lowStock} />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-4 w-full border border-gray-200">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <p className="text-sm text-gray-600 mb-2">
            Common tasks and shortcuts
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
            {/* Button Add Product */}
            <button
              type="button"
              className="text-primary transition hover:bg-gray-900 flex items-center justify-center w-full  text-sm font-semibold bg-black text-white py-2 px-4 rounded-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="1.5"
                  d="M15 12h-3m0 0H9m3 0V9m0 3v3M7 3.338A9.95 9.95 0 0 1 12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12c0-1.821.487-3.53 1.338-5"
                />
              </svg>
              Add Products
            </button>

            {/* Button View Orders */}
            <button
              type="button"
              className="text-primary transition border border-gray-300 hover:bg-gray-300 flex items-center justify-center w-full  text-sm font-semibold bg-gray-200 text-black py-2 px-4 rounded-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                viewBox="0 0 24 24"
              >
                <g fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M7.5 18a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3Zm9 0a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3Z" />
                  <path
                    stroke-linecap="round"
                    d="M11 9H8M2 3l.265.088c1.32.44 1.98.66 2.357 1.184S5 5.492 5 6.883V9.5c0 2.828 0 4.243.879 5.121c.878.879 2.293.879 5.121.879h2m6 0h-2"
                  />
                  <path
                    stroke-linecap="round"
                    d="M5 6h3m-2.5 7h10.522c.96 0 1.439 0 1.815-.248s.564-.688.942-1.57l.429-1c.81-1.89 1.214-2.833.77-3.508C19.533 6 18.505 6 16.45 6H12"
                  />
                </g>
              </svg>
              View Orders
            </button>

            {/* Button Manage Customer */}
            <button
              type="button"
              className="text-primary transition border border-gray-300 hover:bg-gray-300 flex items-center justify-center w-full  text-sm font-semibold bg-gray-200 text-black py-2 px-4 rounded-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M21 19.75c0-2.09-1.67-5.068-4-5.727m-2 5.727c0-2.651-2.686-6-6-6s-6 3.349-6 6m9-12.5a3 3 0 1 1-6 0a3 3 0 0 1 6 0m3 3a3 3 0 1 0 0-6"
                />
              </svg>
              Manage Customers
            </button>

            {/* Button View Reports */}
            <button
              type="button"
              className="text-primary transition border border-gray-300 hover:bg-gray-300 flex items-center justify-center w-full  text-sm font-semibold bg-gray-200 text-black py-2 px-4 rounded-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="1.5"
                  d="m19 15l-3.118-3.926c-.477-.602-.716-.903-.99-1.05a1.5 1.5 0 0 0-1.357-.029c-.28.135-.531.425-1.035 1.005s-.755.87-1.035 1.005a1.5 1.5 0 0 1-1.356-.03c-.274-.146-.513-.447-.99-1.048L6 7m16 15H12c-4.714 0-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12V9m0-7v3"
                />
              </svg>
              View Reports
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

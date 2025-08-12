interface LowStockItem {
  name: string;
  stock: number;
  status: string;
}

interface LowStockAlertProps {
  lowStock: LowStockItem[];
}

export default function LowStockAlert({ lowStock }: LowStockAlertProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <h2 className="text-lg font-semibold">Low Stock Alert</h2>
      <p className="text-sm text-gray-600 mb-2">
        Products running low on inventory
      </p>
      <ul className="space-y-2 mt-5">
        {lowStock.map((item) => (
          <li
            key={item.name}
            className="flex justify-between text-sm items-center"
          >
            <div className="flex flex-col">
              <span>{item.name}</span>
              <span className="text-red-500 font-medium">
                {item.stock} units left
              </span>
            </div>

            <div
              className={`inline-flex items-center justify-center px-3 py-1 rounded-md font-medium ${
                item.status === "low"
                  ? "bg-red-500 text-white"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {item.status}
            </div>
          </li>
        ))}
      </ul>

      {/* Restock */}
      <div className="w-full mt-5 ">
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
          Restock Products
        </button>
      </div>
    </div>
  );
}

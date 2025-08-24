"use client";
import { useState } from "react";

export interface LowStockItem {
  id: number;
  name: string;
  stock: number;
  low_stock_threshold: number;
  status: "low" | "ok";
}

interface LowStockAlertProps {
  lowStock: LowStockItem[];
  onRestock: (id: number, quantity: number) => void;
}

export default function LowStockAlert({
  lowStock,
  onRestock,
}: LowStockAlertProps) {
  const [topUp, setTopUp] = useState<Record<number, number>>({});
  const [selectedItem, setSelectedItem] = useState<LowStockItem | null>(null);

  const handleOpenModal = (item: LowStockItem) => {
    const stock = item.stock ?? 0;
    const threshold = item.low_stock_threshold ?? 1;
    const suggestedRestock = Math.max(threshold + 10 - stock, 1);

    setSelectedItem(item);
    setTopUp((prev) => ({ ...prev, [item.id]: suggestedRestock }));
  };

  const handleConfirmRestock = () => {
    if (selectedItem) {
      const quantity = topUp[selectedItem.id] || 0;
      if (quantity > 0) {
        onRestock(selectedItem.id, quantity);
      }
      setSelectedItem(null);
    }
  };

  const handleCloseModal = () => setSelectedItem(null);

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <h2 className="text-lg font-semibold">Low Stock Alert</h2>
      <p className="text-sm text-gray-600 mb-2">
        Products running low on inventory
      </p>
      {lowStock.length === 0 ? (
        <p className="text-sm flex items-center justify-center text-gray-600">
          No low stock items found.
        </p>
      ) : (
        <>
          <ul className="space-y-2 mt-5">
            {lowStock.map((item) => (
              <li key={item.id} className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span>{item.name}</span>
                  <span className="text-red-500 font-medium">
                    {item.stock ?? 0} units left
                  </span>
                </div>
                <button
                  onClick={() => handleOpenModal(item)}
                  className="bg-black text-white cursor-pointer px-3 py-1 rounded-md text-sm font-medium"
                >
                  Restock
                </button>
              </li>
            ))}
          </ul>
          {/* Modal */}
          {selectedItem && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ backdropFilter: "blur(1px)" }}
            >
              <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Restock Product</h3>
                <p className="mb-2">
                  Add inventory to <strong>{selectedItem.name}</strong>. Current
                  stock: {selectedItem.stock ?? 0} units.
                </p>

                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium">Top-up quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={topUp[selectedItem.id] || ""}
                    onChange={(e) =>
                      setTopUp((prev) => ({
                        ...prev,
                        [selectedItem.id]: Number(e.target.value),
                      }))
                    }
                    className="border border-gray-300 rounded-md px-2 py-1 w-24 text-sm"
                  />
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Suggested:{" "}
                  {Math.max(
                    (selectedItem.low_stock_threshold ?? 1) +
                      10 -
                      (selectedItem.stock ?? 0),
                    1
                  )}{" "}
                  units <br />
                  Low stock threshold: {selectedItem.low_stock_threshold ??
                    0}{" "}
                  units
                </p>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRestock}
                    className="px-4 py-2 rounded-md bg-black text-white cursor-pointer text-sm font-medium"
                  >
                    Restock Product
                  </button>
                </div>
              </div>
            </div>
          )}{" "}
        </>
      )}
    </div>
  );
}

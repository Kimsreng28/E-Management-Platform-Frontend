// contexts/CartContext.tsx
"use client";

import { API_BASE_URL } from "@/lib/config";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  options: any;
  product: Product;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: ProductImage[];
  category: { id: number; name: string };
  stock: number;
  discount?: number;
  discount_price?: number;
}

interface ProductImage {
  id: number;
  product_id: number;
  path: string;
  alt_text?: string | null;
  is_primary: boolean;
}

interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
}

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  addToCart: (
    productId: number,
    quantity: number,
    options?: any
  ) => Promise<void>;
  updateCartItem: (
    itemId: number,
    quantity: number,
    options?: any
  ) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Watch for token changes
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken || null);
  }, []);

  // Re-fetch cart whenever token changes
  useEffect(() => {
    if (token) {
      fetchCart(token);
    } else {
      setCart(null); // clear cart if logged out
    }
  }, [token]);

  const fetchCart = async (authToken: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const cartData = await response.json();
        setCart(cartData);
      } else {
        setCart(null);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (
    productId: number,
    quantity: number,
    options: any = {}
  ) => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/cart/items`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_id: productId, quantity, options }),
      });

      if (response.ok) {
        await fetchCart(token); // re-fetch after add
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (
    itemId: number,
    quantity: number,
    options: any = {}
  ) => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/cart/items/${itemId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity, options }),
      });

      if (response.ok) {
        await fetchCart(token); // re-fetch after update
      }
    } catch (error) {
      console.error("Error updating cart item:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: number) => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/cart/items/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        await fetchCart(token); // re-fetch after remove
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/cart/clear`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setCart(null);
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

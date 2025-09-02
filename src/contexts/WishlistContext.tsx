// contexts/WishlistContext.tsx
"use client";

import { API_BASE_URL } from "@/lib/config";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface WishlistItem {
  id: number;
  user_id: number;
  product_id: number;
  product: Product;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: ProductImage[];
  category: {
    id: number;
    name: string;
  };
  stock: number;
  is_featured?: boolean;
  is_new?: boolean;
  created_at: string;
  updated_at: string;
  low_stock_threshold: number;
  stock_status: string;
  discount?: number;
  average_rating?: number;
  total_ratings?: number;
}

interface ProductImage {
  id: number;
  product_id: number;
  path: string;
  alt_text?: string | null;
  is_primary: boolean;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  loading: boolean;
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Watch for token changes
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken || null);
  }, []);

  // Re-fetch wishlist whenever token changes
  useEffect(() => {
    if (token) {
      fetchWishlist(token);
    } else {
      setWishlist([]); // clear wishlist if logged out
    }
  }, [token]);

  const fetchWishlist = async (authToken: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const wishlistData = await response.json();
        setWishlist(wishlistData.wishlist);
      } else {
        setWishlist([]);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId: number) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_id: productId }),
      });

      if (response.ok) {
        await fetchWishlist(token); // re-fetch after add
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
    }
  };

  const removeFromWishlist = async (productId: number) => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/wishlist/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setWishlist((prev) =>
          prev.filter((item) => item.product_id !== productId)
        );
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    }
  };

  const isInWishlist = (productId: number) => {
    return wishlist.some((item) => item.product_id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

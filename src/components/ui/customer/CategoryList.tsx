"use client";

import React from "react";

interface Category {
  id: number;
  name: string;
  image: string | null;
  products_count?: number;
}

interface CategoryListProps {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  loading,
  error,
}) => {
  let content;

  if (loading) {
    content = (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-700"></div>
      </div>
    );
  } else if (error) {
    content = <p className="text-center text-red-500">{error}</p>;
  } else if (categories.length === 0) {
    content = <p className="text-center text-gray-500">No categories found.</p>;
  } else {
    content = (
      <div className="px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col items-center"
          >
            <div className="w-24 h-24 rounded-lg overflow-hidden mb-3">
              <img
                src={category.image || "/images/placeholder.png"}
                alt={category.name}
                className="object-contain w-full h-full"
              />
            </div>

            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-1 text-center line-clamp-1">
              {category.name}
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {category.products_count || 0} products
            </p>
          </div>
        ))}
      </div>
    );
  }

  return <div className="mt-6">{content}</div>;
};

export default CategoryList;

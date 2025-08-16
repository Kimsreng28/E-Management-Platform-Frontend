"use client";

import { JSX } from "react";

interface FeatureItem {
  title: string;
  description: string;
  icon: JSX.Element;
  bgColor?: string;
}

interface FeaturesProps {
  features: FeatureItem[];
}

export default function Features({ features }: FeaturesProps) {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10 justify-items-center">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 w-full max-w-xs sm:max-w-sm"
            >
              <div
                className={`p-4 sm:p-5 rounded-full mb-4 ${
                  feature.bgColor || "bg-primary/10 dark:bg-primary/20"
                }`}
              >
                {feature.icon}
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

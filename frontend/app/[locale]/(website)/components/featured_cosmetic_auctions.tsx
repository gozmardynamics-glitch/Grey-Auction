'use client';

import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { Button, Card, CardContent } from '@/shared/components/common';
import { cosmeticCategories } from '../models/data';

interface FeaturedCosmeticsAuctionsProps {
  onCategoryClick?: (categorySlug: string) => void;
  onSubCategoryClick?: (categorySlug: string, subCategorySlug: string) => void;
}

export default function FeaturedCosmeticsAuctions({
  onCategoryClick,
  onSubCategoryClick,
}: FeaturedCosmeticsAuctionsProps) {
  const handleViewAll = (categorySlug: string) => {
    if (onCategoryClick) {
      onCategoryClick(categorySlug);
    } else {
      
    }
  };

  const handleSubCategoryClick = (
    categorySlug: string,
    subCategorySlug: string
  ) => {
    if (onSubCategoryClick) {
      onSubCategoryClick(categorySlug, subCategorySlug);
    } else {
      
    }
  };

  return (
    <section>
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cosmeticCategories.map((category) => (
            <Card
              key={category.id}
              className={`${category.backgroundColor} rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300`}
            >
              <CardContent className="p-4 md:p-6">
                {/* 2-Column Grid: Text Left, Image Right */}
                <div className="grid grid-cols-2 gap-4 items-center min-h-[220px] md:min-h-[280px]">
                  {/* Left Side - Text Content */}
                  <div className="flex flex-col justify-between space-y-10">
                    {/* Title and Sub-categories */}
                    <div className="space-y-4">
                      <h3
                        className={`text-lg md:text-2xl font-bold ${category.textColor}`}
                      >
                        {category.title}
                      </h3>

                      {/* Sub-categories */}
                      <div className="space-y-2">
                        {category.subCategories.map((subCategory) => (
                          <Button
                            key={subCategory.id}
                            variant="ghost"
                            onClick={() =>
                              handleSubCategoryClick(
                                category.categorySlug,
                                subCategory.slug
                              )
                            }
                            className={`flex items-center gap-2 ${category.textColor} hover:text-primary transition-colors text-sm group p-0 h-auto`}
                          >
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-tertiary" />
                            <span className="text-sm md:text-xl font-semibold">
                              {subCategory.name}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* View All Button */}
                    <div className="mt-6">
                      <Button
                        variant="default"
                        size="xl"
                        onClick={() => handleViewAll(category.categorySlug)}
                        className="bg-primary hover:bg-primary-2 text-primary-foreground font-semibold"
                      >
                        View All
                      </Button>
                    </div>
                  </div>

                  {/* Right Side - Image */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Image
                        src={category.image}
                        alt={category.imageAlt}
                        fill
                        className="object-contain drop-shadow-lg"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

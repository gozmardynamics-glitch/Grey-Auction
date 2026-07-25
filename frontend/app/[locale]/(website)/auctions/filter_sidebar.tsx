'use client';

import {
  Button,
  Checkbox,
  Input,
  Label,
  Separator,
  Slider,
} from '@/shared/components/common';
import { ChevronLeft, Search } from 'lucide-react';
import { BRANDS, CATEGORIES, COUNTRIES } from '../models/data';
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import {
  setFilters,
  clearFilters as clearReduxFilters,
} from '@/redux/auctions/slices/auctions.slice';
import { setCurrentPage } from '@/redux/slices/ui.slice';
import ADsCard from '../components/ads_card';

export default function FilterSidebar() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.auctions.filters);
  const [brandSearch, setBrandSearch] = useState('');

  const activeFilterCount =
    filters.categories.length +
    filters.countries.length +
    filters.brands.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000000 ? 1 : 0);

  const toggleFilter = (
    key: 'categories' | 'countries' | 'brands',
    value: string
  ) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter((item: string) => item !== value)
      : [...current, value];
    dispatch(setFilters({ ...filters, [key]: updated }));
    dispatch(setCurrentPage(1));
  };

  const handleClearFilters = () => {
    dispatch(clearReduxFilters());
    dispatch(setCurrentPage(1));
  };

  const filteredBrands = BRANDS.filter((b) =>
    b.toLowerCase().includes(brandSearch.toLowerCase())
  );
  return (
    <div className="space-y-6">
      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-auto p-0 text-sm flex items-center gap-2 hover:text-destructive"
          >
            <ChevronLeft />
            Clear
          </Button>
        </div>
      )}

      {/* Categories */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Categories
        </h3>
        <div className="space-y-2.5">
          {CATEGORIES.map((category) => (
            <div key={category} className="flex items-center gap-2.5">
              <Checkbox
                id={`cat-${category}`}
                checked={filters.categories.includes(category)}
                onCheckedChange={() => toggleFilter('categories', category)}
              />
              <Label
                htmlFor={`cat-${category}`}
                className="cursor-pointer text-sm font-normal text-muted-foreground"
              >
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Countries */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Countries
        </h3>
        <div className="space-y-2.5">
          {COUNTRIES.map((country) => (
            <div key={country} className="flex items-center gap-2.5">
              <Checkbox
                id={`country-${country}`}
                checked={filters.countries.includes(country)}
                onCheckedChange={() => toggleFilter('countries', country)}
              />
              <Label
                htmlFor={`country-${country}`}
                className="cursor-pointer text-sm font-normal text-muted-foreground"
              >
                {country}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Brands */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Brands</h3>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for brand"
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="space-y-2.5">
          {filteredBrands.map((brand) => (
            <div key={brand} className="flex items-center gap-2.5">
              <Checkbox
                id={`brand-${brand}`}
                checked={filters.brands.includes(brand)}
                onCheckedChange={() => toggleFilter('brands', brand)}
              />
              <Label
                htmlFor={`brand-${brand}`}
                className="cursor-pointer text-sm font-normal text-muted-foreground"
              >
                {brand}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Price</h3>
        <Slider
          value={filters.priceRange}
          min={0}
          max={50000000}
          step={100000}
          onValueChange={(value) =>
            dispatch(
              setFilters({ ...filters, priceRange: value as [number, number] })
            )
          }
          className="mb-4"
        />
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={filters.priceRange[0]}
            onChange={(e) =>
              dispatch(
                setFilters({
                  ...filters,
                  priceRange: [Number(e.target.value), filters.priceRange[1]],
                })
              )
            }
            className="h-9 text-sm"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            value={filters.priceRange[1]}
            onChange={(e) =>
              dispatch(
                setFilters({
                  ...filters,
                  priceRange: [filters.priceRange[0], Number(e.target.value)],
                })
              )
            }
            className="h-9 text-sm"
          />
        </div>
      </div>

      <ADsCard />
    </div>
  );
}

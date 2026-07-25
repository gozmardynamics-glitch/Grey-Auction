'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  EmptyState,
  InputWithIcon,
} from '@/shared/components/common';
import { Card, CardContent } from '@/shared/components/common/card';
import type { FAQCategory } from '../models';

interface SearchableFaqProps {
  faqCategories: FAQCategory[];
}

export default function SearchableFaq({ faqCategories }: SearchableFaqProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = faqCategories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <>
      {/* Search */}
      <div className="relative mx-auto mb-8 max-w-md">
        <InputWithIcon
          type="search"
          placeholder="Search for a question"
          icon={Search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap justify-center gap-2">
        {faqCategories.map((cat) => (
          <div
            key={cat.name}
            className="flex items-center gap-1.5 rounded-md bg-card px-3 py-2.5 sm:px-6 sm:py-4 text-sm font-medium"
          >
            <span className="text-primary">{cat.emoji}</span>
            <span className="hidden sm:inline">{cat.name}</span>
          </div>
        ))}
      </div>

      {/* FAQ Sections */}
      <div className="mx-auto max-w-4xl space-y-12 mt-12">
        {filteredCategories.map((category) => (
          <div
            key={category.name}
            className="flex flex-col sm:flex-row gap-4 sm:gap-8"
          >
            {/* Category Label Card */}
            <div className="sm:w-[220px] shrink-0 sm:pt-2">
              <Card className="border-none bg-card shadow-none">
                <CardContent className="flex items-center gap-2 p-4 sm:justify-center sm:p-6">
                  <span className="text-lg text-primary">
                    {category.emoji}
                  </span>
                  <span className="text-sm font-semibold">
                    {category.name}
                  </span>
                </CardContent>
              </Card>
            </div>

            {/* Accordion */}
            <div className="min-w-0 flex-1">
              <Accordion type="single" collapsible className="w-full">
                {category.items.map((item, idx) => (
                  <AccordionItem key={idx} value={`${category.name}-${idx}`}>
                    <AccordionTrigger className="text-left text-sm font-medium text-primary hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        ))}

        {/* No results */}
        {filteredCategories.length === 0 && (
          <EmptyState
            title="No results found"
            description="Try a different search term or browse by category."
            action={
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            }
          />
        )}
      </div>
    </>
  );
}

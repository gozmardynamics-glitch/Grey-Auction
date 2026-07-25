'use client';

import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/common';

const FAQS = [
  {
    question: 'How do I become a seller?',
    answer:
      'Simply fill out the seller registration form on this page. Our team will review your application and get back to you within 24 hours.',
  },
  {
    question: 'Is seller verification required?',
    answer:
      'Yes, all sellers must go through a verification process to ensure trust and safety on the platform. This includes verifying your identity and business details.',
  },
  {
    question: 'How do I get paid?',
    answer:
      'Payments are processed securely once the auction ends and the transaction is complete. Funds are released directly to your registered bank account.',
  },
  {
    question: 'How long do auctions run?',
    answer:
      'Auction durations are flexible. You can set your preferred duration when creating a listing, typically ranging from 1 to 14 days.',
  },
  {
    question: 'Are there selling fees?',
    answer:
      'We charge a small commission on successful sales. There are no upfront listing fees — you only pay when your item sells.',
  },
  {
    question: 'When can I withdraw my funds?',
    answer:
      'Funds become available for withdrawal after the buyer confirms receipt of the item, typically within 3-5 business days after delivery.',
  },
];

export default function SellerFaq() {
  return (
    <section id="faq" className="py-20">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5">
          <HelpCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Need Help?</span>
        </div>
        <h2 className="text-3xl font-bold text-foreground md:text-4xl">
          Frequently Asked
          <br />
          Questions
        </h2>
      </div>

      {/* Accordion */}
      <div className="mx-auto max-w-7xl">
        <Accordion type="single" collapsible>
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-base font-medium text-primary hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

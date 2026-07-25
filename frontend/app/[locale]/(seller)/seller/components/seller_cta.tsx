import { Button } from '@/shared/components/common';

export default function SellerCta() {
  return (
    <section className="rounded-2xl bg-primary px-8 py-16 md:px-16">
      <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div>
          <h2 className="mb-3 text-3xl font-bold text-primary-foreground md:text-4xl">
            Ready to Start Listing your Items Today?
          </h2>
          <p className="text-primary-foreground/80">
            Join a trusted marketplace built for serious sellers and competitive
            results.
          </p>
        </div>
        <Button
          variant="default"
          size="xl"
          className="shrink-0 border-yellow-400 bg-yellow-400 text-foreground hover:bg-yellow-500 hover:text-foreground"
        >
          Get Started - with our experts
        </Button>
      </div>
    </section>
  );
}

import DirectSalesSection from '@/shared/components/direct_sales/direct_sales_section';

export default function DirectSalesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">Buy now</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        No bidding - purchase these lots outright at a fixed price.
      </p>
      <DirectSalesSection limit={16} />
    </div>
  );
}

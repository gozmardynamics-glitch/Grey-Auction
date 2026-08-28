import AdvisorDirectory from '@/shared/components/advisors/advisor_directory';

export default function AdvisorsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">Find a marketplace advisor</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Local experts, dealers and branches who can value, inspect or advise on lots before you bid.
      </p>
      <AdvisorDirectory />
    </div>
  );
}

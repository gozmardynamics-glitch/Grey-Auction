import { Logo } from '@/shared/components/common';
import PlanSelector from '../../../../../../_islands/plan_selector';

export default function SelectPlanPage() {
  return (
    <div className="min-h-screen w-full rounded-2xl shadow-xl px-6 md:px-16 py-20 bg-background">
      {/* Logo */}
      <div className="mb-8">
        <Logo />
      </div>

      <PlanSelector />
    </div>
  );
}

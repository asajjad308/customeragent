import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { OnboardingChecklist } from '@/app/components/OnboardingChecklist';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <>
      {children}
      <OnboardingChecklist />
    </>
  );
}

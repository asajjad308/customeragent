import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { LandingPage } from '@/components/landing/LandingPage';

export default async function RootPage() {
  const session = await auth();
  if (session) redirect('/dashboard');
  return <LandingPage />;
}

import Link from 'next/link';
import { Ban } from 'lucide-react';

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
            <Ban className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Account Suspended</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Your account has been suspended. Please contact{' '}
          <a href="mailto:support@supportai.app" className="text-indigo-500 underline underline-offset-2">
            support@supportai.app
          </a>{' '}
          to resolve this.
        </p>
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2">
          Sign in with a different account
        </Link>
      </div>
    </div>
  );
}

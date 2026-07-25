import type { Metadata } from 'next';
import AuthSidebar from './components/auth_sidebar';
import AuthBackButton from './components/auth_back_button';

export const metadata: Metadata = {
  title: 'Authentication - Auction',
  description: 'Sign in or create an account',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-cover bg-no-repeat p-8"
      style={{ backgroundImage: "url('/car.svg')" }}
    >
      <AuthSidebar />
      <div className="flex flex-col lg:flex-row items-center justify-center">
        <div className='lg:hidden  w-full'>
          <AuthBackButton />
        </div>
        {children}
      </div>
    </div>
  );
}

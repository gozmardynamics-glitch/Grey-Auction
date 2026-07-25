import Header from './header';
import Footer from './footer';
import MainContent from './main_content';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <div className="mx-auto max-w-[96%]">
      <Header />
      <MainContent>{children}</MainContent>
      <Footer />
    </div>
  );
}

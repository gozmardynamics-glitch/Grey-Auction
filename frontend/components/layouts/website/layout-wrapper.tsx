import Header from './header';
import Footer from './footer';
import MainContent from './main_content';
import ScrollRevealInit from './scroll-reveal-init';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <div className="mx-auto max-w-[96%]">
      <ScrollRevealInit />
      <Header />
      <MainContent>{children}</MainContent>
      <Footer />
    </div>
  );
}

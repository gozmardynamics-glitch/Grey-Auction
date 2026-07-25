import HowItWorks from './components/how_it_works';
import Hero from './components/hero';
import TrustedBrands from '@/app/[locale]/(website)/components/trusted_brands';
import CustomerStories from '@/app/[locale]/(website)/components/customer_stories';
import SellerCta from './components/seller_cta';
import SellerFaq from './components/seller_faq';

export default function SellerHomePage() {
  return (
    <div className='space-y-4'>
      {/* Hero Section - Split Layout */}
      <Hero />
      {/* How It Works Section */}
      <HowItWorks />
      <TrustedBrands />
      <CustomerStories />
      <SellerFaq />
      <SellerCta />
    </div>
  );
}

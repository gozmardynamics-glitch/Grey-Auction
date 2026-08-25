import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../../auth/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Product, ProductStatus, AuctionType } from '../../products/entities/product.entity';
import { Banner } from '../../banners/banner.entity';
import { Faq } from '../../faqs/faq.entity';
import { FeeConfig } from '../../fees/fee-config.entity';
import { Bid } from '../../bids/entities/bid.entity';
import { Seller, SellerBusinessType, SellerStatus, SellerVerificationStatus } from '../../seller/entities/seller.entity';

/**
 * Seeds a complete local demo dataset:
 *  - 8 categories with sub-categories
 *  - demo buyer + demo seller users (with seller profile, APPROVED + ACTIVE)
 *  - 8 active sample products with bids
 *  - 3 homepage banners, 6 FAQs, default fee config
 *
 * Usage: ts-node -r tsconfig-paths/register src/database/seeds/seed-demo.ts
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepo: Repository<User> = app.get(getRepositoryToken(User));
  const catRepo: Repository<Category> = app.get(getRepositoryToken(Category));
  const prodRepo: Repository<Product> = app.get(getRepositoryToken(Product));
  const bannerRepo: Repository<Banner> = app.get(getRepositoryToken(Banner));
  const faqRepo: Repository<Faq> = app.get(getRepositoryToken(Faq));
  const feeRepo: Repository<FeeConfig> = app.get(getRepositoryToken(FeeConfig));
  const bidRepo: Repository<Bid> = app.get(getRepositoryToken(Bid));
  const sellerRepo: Repository<Seller> = app.get(getRepositoryToken(Seller));

  console.log('🌱 Seeding demo dataset...');

  // ── Users ────────────────────────────────────────────────────────
  let buyer: User | null = await userRepo.findOne({ where: { email: 'demo@buyer.com' } });
  if (!buyer) {
    buyer = await userRepo.save(userRepo.create({
      email: 'demo@buyer.com',
      passwordHash: await bcrypt.hash('Buyer@12345', 12),
      name: 'Demo Buyer',
      role: UserRole.BIDDER,
      isEmailVerified: true,
    }));
    console.log('  ✅ demo buyer created');
  }

  let sellerUser: User | null = await userRepo.findOne({ where: { email: 'demo@seller.com' } });
  if (!sellerUser) {
    sellerUser = await userRepo.save(userRepo.create({
      email: 'demo@seller.com',
      passwordHash: await bcrypt.hash('Seller@12345', 12),
      name: 'Demo Seller',
      role: UserRole.SELLER,
      isEmailVerified: true,
    }));
    console.log('  ✅ demo seller user created');
  }

  // ── Seller profile (approved + active) ───────────────────────────
  let seller: Seller | null = await sellerRepo.findOne({ where: { user_id: sellerUser.id } });
  if (!seller) {
    const sellerRecord = sellerRepo.create({
      user_id: sellerUser.id,
      business_name: 'Demo Auctions Nigeria',
      business_type: SellerBusinessType.LLC,
      business_registration_number: 'RC-DEMO-001',
      tax_id: 'TIN-DEMO-001',
      business_description: 'Demo auction house for local development',
      email: 'demo@seller.com',
      phone: '+2348012345670',
      website: 'https://greyauction.com',
      address_line1: '12 Marina Road',
      city: 'Lagos',
      state: 'Lagos State',
      postal_code: '100001',
      country: 'NG',
      commission_rate: 10.0,
      currency: 'NGN',
      verification_status: SellerVerificationStatus.APPROVED,
      status: SellerStatus.ACTIVE,
    } as any) as unknown as Seller;
    seller = await sellerRepo.save(sellerRecord);
    console.log('  ✅ demo seller profile created');
  }

  // ── Categories ───────────────────────────────────────────────────
  const categoryDefs = [
    { name: 'Art', slug: 'art', imageUrl: '/placeholder.svg', subCategories: ['Paintings', 'Sculptures', 'Antiques'] },
    { name: 'Construction', slug: 'construction', imageUrl: '/placeholder.svg', subCategories: ['Heavy Machinery', 'Tools', 'Building Materials'] },
    { name: 'Electronics', slug: 'electronics', imageUrl: '/placeholder.svg', subCategories: ['Laptops', 'Phones', 'Cameras', 'Audio'] },
    { name: 'Fashion', slug: 'fashion', imageUrl: '/placeholder.svg', subCategories: ['Apparel', 'Accessories', 'Luxury'] },
    { name: 'Transport and Logistics', slug: 'transport-and-logistics', imageUrl: '/placeholder.svg', subCategories: ['Vehicles', 'Trucks', 'Motorcycles'] },
    { name: 'Agriculture', slug: 'agriculture', imageUrl: '/placeholder.svg', subCategories: ['Farm Equipment', 'Livestock', 'Produce'] },
    { name: 'Furniture', slug: 'furniture', imageUrl: '/placeholder.svg', subCategories: ['Office', 'Home', 'Outdoor'] },
    { name: 'Machinery', slug: 'machinery', imageUrl: '/placeholder.svg', subCategories: ['Industrial', 'Printing', 'Packaging'] },
  ];
  for (const c of categoryDefs) {
    const exists = await catRepo.findOne({ where: { slug: c.slug } });
    if (!exists) {
      await catRepo.save(catRepo.create({ ...c, productCount: 0, isActive: true }));
    }
  }
  console.log('  ✅ categories ready (8)');

  // ── Products ─────────────────────────────────────────────────────
  const now = new Date();
  const days = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

  const productDefs = [
    { title: '2022 Toyota Camry Hybrid', description: 'Excellent condition hybrid vehicle with low mileage. Full service history, single owner.', category: 'Transport and Logistics', subCategory: 'Vehicles', startingBid: 2000000, currentBid: 2500000, totalBids: 12, endTime: days(2), specifications: { Year: '2022', Mileage: '14,000 km', Engine: '2.5L Hybrid', Fuel: 'Hybrid' } },
    { title: 'MacBook Pro 16" M3 Pro', description: 'Latest MacBook Pro with M3 Pro chip, 18GB RAM, 512GB SSD. Like new condition.', category: 'Electronics', subCategory: 'Laptops', startingBid: 1500000, currentBid: 1850000, totalBids: 8, endTime: days(3), specifications: { Chip: 'M3 Pro', RAM: '18GB', Storage: '512GB SSD' } },
    { title: 'iPhone 15 Pro Max 256GB', description: 'Brand new iPhone 15 Pro Max, 256GB, Natural Titanium. Factory sealed.', category: 'Electronics', subCategory: 'Phones', startingBid: 850000, currentBid: 980000, totalBids: 15, endTime: days(5), specifications: { Storage: '256GB', Color: 'Natural Titanium' } },
    { title: 'Luxury Designer Chronograph Watch', description: 'Authentic designer chronograph watch, brand new with box and papers.', category: 'Fashion', subCategory: 'Accessories', startingBid: 350000, currentBid: 450000, totalBids: 6, endTime: days(7), specifications: { Movement: 'Swiss Automatic', Case: 'Stainless Steel' } },
    { title: 'Heavy Construction Equipment Bundle', description: 'Heavy duty construction equipment including excavator and bulldozer. Well maintained.', category: 'Construction', subCategory: 'Heavy Machinery', startingBid: 2800000, currentBid: 3200000, totalBids: 4, endTime: days(10), specifications: { Type: 'Excavator + Bulldozer', Year: '2021' } },
    { title: 'Professional Camera Kit', description: 'Complete photography kit with Sony A7IV camera, lenses, and accessories.', category: 'Electronics', subCategory: 'Cameras', startingBid: 650000, currentBid: 780000, totalBids: 9, endTime: days(14), specifications: { Body: 'Sony A7IV', Lenses: '24-70mm f/2.8 + 70-200mm f/4' } },
    { title: 'Modern Executive Office Desk Set', description: 'Premium executive office furniture set — desk, chair and bookcase in walnut finish.', category: 'Furniture', subCategory: 'Office', startingBid: 250000, currentBid: 320000, totalBids: 5, endTime: days(4), specifications: { Material: 'Walnut Wood', Condition: 'Mint' } },
    { title: 'Diesel Generator 100kVA', description: 'Industrial 100kVA diesel generator, low hours, serviced monthly.', category: 'Machinery', subCategory: 'Industrial', startingBid: 1500000, currentBid: 1650000, totalBids: 3, endTime: days(6), specifications: { Power: '100 kVA', Hours: '1,200' } },
  ];

  for (const p of productDefs) {
    const exists = await prodRepo.findOne({ where: { title: p.title } });
    if (exists) continue;
    const product = await prodRepo.save(prodRepo.create({
      title: p.title,
      description: p.description,
      startingBid: p.startingBid,
      currentBid: p.currentBid,
      category: p.category,
      subCategory: p.subCategory,
      images: ['/placeholder.svg', '/placeholder.svg'],
      specifications: p.specifications,
      endTime: p.endTime,
      totalBids: p.totalBids,
      status: ProductStatus.ACTIVE,
      auctionType: AuctionType.OPEN_AUCTION,
      sellerId: sellerUser.id,
      approvedBy: 'seed',
      approvedAt: new Date(),
    }));
    // A couple of historical bids for bid history
    if (buyer) {
      const bidAmounts = [p.startingBid, p.startingBid + 100000, p.currentBid];
      for (let i = 0; i < bidAmounts.length; i += 1) {
        const existingBid = await bidRepo.findOne({ where: { productId: product.id, amount: bidAmounts[i] } });
        if (!existingBid) {
          await bidRepo.save(bidRepo.create({
            productId: product.id,
            bidderId: buyer.id,
            amount: bidAmounts[i],
            isWinningBid: i === bidAmounts.length - 1,
          }));
        }
      }
    }
  }
  console.log('  ✅ products ready (8)');

  // ── Banners ──────────────────────────────────────────────────────
  const bannerDefs = [
    { title: 'Featured Vehicles Auction', imageUrl: '/banner_image.svg', link: '/auctions?category=Transport and Logistics', position: 1, type: 'featured', description: 'Bid on premium vehicles from verified sellers' },
    { title: 'Electronics Week', imageUrl: '/banner_image.svg', link: '/auctions?category=Electronics', position: 2, type: 'split', description: 'Up to 40% below retail on certified electronics' },
    { title: 'Join the Marketplace', imageUrl: '/banner_image.svg', link: '/seller', position: 3, type: 'category', description: 'Start selling in minutes — no listing fees' },
  ];
  for (const b of bannerDefs) {
    const exists = await bannerRepo.findOne({ where: { title: b.title } });
    if (!exists) {
      await bannerRepo.save(bannerRepo.create({ ...b, isActive: true }));
    }
  }
  console.log('  ✅ banners ready (3)');

  // ── FAQs ─────────────────────────────────────────────────────────
  const faqDefs = [
    { category: 'General', question: 'How do I place a bid?', answer: 'Create an account, browse the live auctions and click "Bid Now" on any lot. Enter your amount — it must be higher than the current bid.', order: 1 },
    { category: 'General', question: 'Is bidding free?', answer: 'Yes, bidding is completely free. You only pay if you win an auction, plus the applicable buyer premium, VAT and charges shown at checkout.', order: 2 },
    { category: 'Payments', question: 'Which payment methods do you accept?', answer: 'We accept card payments, bank transfers and direct debit through our secure payment partners (Flutterwave/Paystack).', order: 3 },
    { category: 'Selling', question: 'How do I become a seller?', answer: 'Register as a seller, complete your business profile and submit your KYC documents. Once approved, you can start listing items immediately.', order: 4 },
    { category: 'Selling', question: 'What fees do sellers pay?', answer: 'A platform commission of 10% on the final hammer price (configurable per category by the platform admin).', order: 5 },
    { category: 'Delivery', question: 'How do I collect my winnings?', answer: 'After payment, you can pick up your items at the seller’s location or arrange delivery through our transport partners.', order: 6 },
  ];
  for (const f of faqDefs) {
    const exists = await faqRepo.findOne({ where: { question: f.question } });
    if (!exists) {
      await faqRepo.save(faqRepo.create({ ...f, isActive: true }));
    }
  }
  console.log('  ✅ faqs ready (6)');

  // ── Fee config ───────────────────────────────────────────────────
  const fee = await feeRepo.findOne({ where: { category: 'default' } });
  if (!fee) {
    await feeRepo.save(feeRepo.create({
      category: 'default',
      displayName: 'Platform Default',
      commissionPct: 10.0,
      vatPct: 7.5,
      otherChargesPct: 0,
      fixedFee: 0,
      isActive: true,
    }));
    console.log('  ✅ default fee config created');
  }

  console.log('');
  console.log('✅ Demo seeding complete.');
  console.log('');
  console.log('Demo accounts:');
  console.log('  Buyer : demo@buyer.com / Buyer@12345');
  console.log('  Seller: demo@seller.com / Seller@12345');
  console.log('  Admin : admin@greyauction.com / Admin@12345');

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

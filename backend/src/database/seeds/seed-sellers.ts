import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SellerService } from '../seller/services/seller.service';
import {
  SellerBusinessType,
  SellerPayoutMethod,
} from '../seller/entities/seller.entity';

/**
 * Seed script to create test seller accounts
 * 
 * Usage:
 * ts-node -r tsconfig-paths/register src/database/seeds/seed-sellers.ts
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const sellerService = app.get(SellerService);

  console.log('🌱 Seeding test sellers...');

  const testSellers = [
    {
      userId: 'user-id-1', // Replace with actual user IDs
      data: {
        business_name: 'Tech Solutions Ltd',
        business_type: SellerBusinessType.LLC,
        business_registration_number: 'RC123456',
        tax_id: 'TIN123456789',
        business_description: 'Leading provider of technology solutions',
        email: 'seller1@techsolutions.com',
        phone: '+2348012345671',
        website: 'https://techsolutions.com',
        address_line1: '123 Tech Street',
        address_line2: 'Suite 100',
        city: 'Lagos',
        state: 'Lagos State',
        postal_code: '100001',
        country: 'NG',
        payout_method: SellerPayoutMethod.BANK_TRANSFER,
        bank_account_details: {
          bank_name: 'First Bank of Nigeria',
          account_number: '1234567890',
          account_name: 'Tech Solutions Ltd',
        },
      },
    },
    {
      userId: 'user-id-2',
      data: {
        business_name: 'Fashion Hub Nigeria',
        business_type: SellerBusinessType.SOLE_PROPRIETORSHIP,
        business_registration_number: 'RC234567',
        tax_id: 'TIN234567890',
        business_description: 'Premium fashion and accessories',
        email: 'seller2@fashionhub.ng',
        phone: '+2348012345672',
        website: 'https://fashionhub.ng',
        address_line1: '456 Fashion Avenue',
        city: 'Abuja',
        state: 'FCT',
        postal_code: '900001',
        country: 'NG',
        payout_method: SellerPayoutMethod.BANK_TRANSFER,
        bank_account_details: {
          bank_name: 'Access Bank',
          account_number: '2345678901',
          account_name: 'Fashion Hub Nigeria',
        },
      },
    },
    {
      userId: 'user-id-3',
      data: {
        business_name: 'Electronics World',
        business_type: SellerBusinessType.CORPORATION,
        business_registration_number: 'RC345678',
        tax_id: 'TIN345678901',
        business_description: 'Electronics and gadgets retailer',
        email: 'seller3@electronicsworld.ng',
        phone: '+2348012345673',
        website: 'https://electronicsworld.ng',
        address_line1: '789 Electronics Plaza',
        city: 'Port Harcourt',
        state: 'Rivers State',
        postal_code: '500001',
        country: 'NG',
        payout_method: SellerPayoutMethod.MOBILE_MONEY,
        bank_account_details: {
          bank_name: 'GTBank',
          account_number: '3456789012',
          account_name: 'Electronics World Ltd',
        },
      },
    },
  ];

  try {
    for (const { userId, data } of testSellers) {
      // Check if seller already exists
      const existing = await sellerService.findByEmail(data.email);

      if (existing) {
        console.log(`✅ Seller already exists: ${data.email}`);
        continue;
      }

      // Create seller
      const seller = await sellerService.register(userId, data);

      console.log(`✅ Created seller: ${seller.business_name}`);
      console.log(`   Email: ${seller.email}`);
      console.log(`   Status: ${seller.verification_status}`);
      console.log('');
    }

    console.log('🎉 Seller seeding completed!');
    console.log('');
    console.log('⚠️  NOTE: All sellers are in PENDING status.');
    console.log('   Use admin endpoints to approve them.');
    console.log('');
  } catch (error) {
    console.error('❌ Error seeding sellers:', error.message);
    process.exit(1);
  }

  await app.close();
  process.exit(0);
}

bootstrap();

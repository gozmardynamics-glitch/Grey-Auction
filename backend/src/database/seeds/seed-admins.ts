import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { AdminService } from '../../admin/admin.service';
import { AdminRole } from '../../admin/entities/admin.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../auth/entities/user.entity';
import * as bcrypt from 'bcryptjs';

/**
 * Seed script to create admin accounts in BOTH the users table (for JWT
 * login) and the admins table (for role resolution).
 *
 * Usage:
 *   ts-node -r tsconfig-paths/register src/database/seeds/seed-admins.ts
 */
async function bootstrap() {
  // This seed ships default admin credentials in source. It must NEVER touch
  // a production database — provision real admins with one-time passwords
  // through a manual, audited process instead.
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to seed admin accounts with NODE_ENV=production.');
    console.error('Provision real admin credentials manually instead.');
    process.exit(1);
  }
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminService = app.get(AdminService);
  const userRepo: Repository<User> = app.get(getRepositoryToken(User));

  console.log('🌱 Seeding admin accounts...');

  const admins = [
    {
      email: process.env.ADMIN_SEED_EMAIL || 'admin@greyauction.com',
      password: process.env.ADMIN_SEED_PASSWORD || 'Admin@12345',
      name: 'Super Admin',
      role: AdminRole.SUPER_ADMIN,
    },
    {
      email: 'platform@greyauction.com',
      password: 'Platform@12345',
      name: 'Platform Admin',
      role: AdminRole.PLATFORM_ADMIN,
    },
    {
      email: 'finance@greyauction.com',
      password: 'Finance@12345',
      name: 'Finance Admin',
      role: AdminRole.FINANCE_ADMIN,
    },
    {
      email: 'support@greyauction.com',
      password: 'Support@12345',
      name: 'Support Admin',
      role: AdminRole.SUPPORT_ADMIN,
    },
  ];

  for (const admin of admins) {
    // 1. Create/update the admin record (role resolution)
    try {
      await adminService.createAdmin(admin);
      console.log(`  ✅ admins table: ${admin.email} (${admin.role})`);
    } catch (err: any) {
      if (err?.message?.includes('already exists')) {
        console.log(`  ⏭️  admins table: ${admin.email} already exists`);
      } else {
        console.log(`  ❌ admins table: ${admin.email} — ${err.message}`);
      }
    }

    // 2. Create/update the user record (JWT login)
    const existing = await userRepo.findOne({ where: { email: admin.email } });
    if (existing) {
      if (existing.role !== UserRole.ADMIN) {
        existing.role = UserRole.ADMIN;
        await userRepo.save(existing);
      }
      console.log(`  ⏭️  users table: ${admin.email} already exists`);
      continue;
    }

    await userRepo.save(
      userRepo.create({
        email: admin.email,
        passwordHash: await bcrypt.hash(admin.password, 10),
        name: admin.name,
        role: UserRole.ADMIN,
        isEmailVerified: true,
      }),
    );
    console.log(`  ✅ users table: ${admin.email}`);
  }

  console.log('✅ Admin seeding complete.');
  console.log('\nLogin credentials:');
  for (const admin of admins) {
    console.log(`  ${admin.email} / ${admin.password} (${admin.role})`);
  }

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

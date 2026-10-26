import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductDocument } from './entities/product-document.entity';
import { KycModule } from '../kyc/kyc.module';
import { InvoiceModule } from '../invoices/invoice.module';
import { StorageModule } from '../common/storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/entities/user.entity';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ProductDocumentService } from './product-document.service';
import { ProductDocumentController } from './product-document.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductDocument, User]),
    KycModule,
    InvoiceModule,
    StorageModule,
    AuthModule,
  ],
  controllers: [ProductController, ProductDocumentController],
  providers: [ProductService, ProductDocumentService, OptionalJwtAuthGuard],
  exports: [ProductService, ProductDocumentService],
})
export class ProductModule {}

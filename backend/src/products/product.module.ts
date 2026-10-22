import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeSafeModule } from '../common/typesafe/typesafe.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), TypeSafeModule],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}

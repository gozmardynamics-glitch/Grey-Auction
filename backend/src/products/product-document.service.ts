import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Product } from './entities/product.entity';
import { ProductDocument, ProductDocumentType, ProductDocumentVerificationStatus } from './entities/product-document.entity';
import { CreateProductDocumentDto, UpdateProductDocumentDto, VerifyProductDocumentDto } from './dto/product-document.dto';

@Injectable()
export class ProductDocumentService {
  constructor(
    @InjectRepository(ProductDocument)
    private readonly documents: Repository<ProductDocument>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
  ) {}

  async findByProduct(
    productId: string,
    includeUnverified = false,
  ): Promise<ProductDocument[]> {
    const where: any = { productId };
    if (!includeUnverified) {
      where.verificationStatus = ProductDocumentVerificationStatus.VERIFIED;
    }
    return this.documents.find({
      where,
      order: { uploadedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ProductDocument> {
    const document = await this.documents.findOne({ where: { id } });
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async create(
    productId: string,
    userId: string,
    dto: CreateProductDocumentDto,
  ): Promise<ProductDocument> {
    const product = await this.products.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    // Only seller or admin can add documents
    if (product.sellerId !== userId) {
      throw new ForbiddenException('Only the seller can add documents to this lot');
    }

    const document = this.documents.create({
      ...dto,
      productId,
      verificationStatus: ProductDocumentVerificationStatus.PENDING,
    });

    return this.documents.save(document);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateProductDocumentDto,
  ): Promise<ProductDocument> {
    const document = await this.findOne(id);
    const product = await this.products.findOne({ where: { id: document.productId } });

    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerId !== userId) {
      throw new ForbiddenException('Only the seller can update this document');
    }

    Object.assign(document, dto);
    return this.documents.save(document);
  }

  async remove(id: string, userId: string): Promise<void> {
    const document = await this.findOne(id);
    const product = await this.products.findOne({ where: { id: document.productId } });

    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerId !== userId) {
      throw new ForbiddenException('Only the seller can remove this document');
    }

    await this.documents.softDelete(id);
  }

  async verify(id: string, userId: string, dto: VerifyProductDocumentDto): Promise<ProductDocument> {
    // Only admin can verify
    // TODO: Add proper admin check via guard
    const document = await this.findOne(id);
    document.verificationStatus =
      dto.status === 'VERIFIED'
        ? ProductDocumentVerificationStatus.VERIFIED
        : ProductDocumentVerificationStatus.REJECTED;
    document.verificationNotes = dto.notes;
    document.verifiedAt = new Date();
    document.verifiedById = userId;
    return this.documents.save(document);
  }

  async getDocumentTypes(): Promise<{ value: string; label: string }[]> {
    return Object.entries(ProductDocumentType).map(([key, value]) => ({
      value: value as string,
      label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
  }
}
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Product } from './entities/product.entity';
import { ProductDocument, ProductDocumentType, ProductDocumentVerificationStatus } from './entities/product-document.entity';
import {
  UpdateProductDocumentDto,
  UploadProductDocumentDto,
  VerifyProductDocumentDto,
} from './dto/product-document.dto';

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

  /**
   * Confirm the caller may upload to this lot BEFORE any bytes are stored, so a
   * refused upload never leaves an orphaned object behind.
   */
  async assertCanUpload(productId: string, userId: string): Promise<void> {
    const product = await this.products.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerId !== userId) {
      throw new ForbiddenException('Only the seller can add documents to this lot');
    }
  }

  /**
   * Record an uploaded lot document. File name, size, MIME type and URL all come
   * from the stored object, never from the request.
   */
  async createWithStoredFile(
    productId: string,
    userId: string,
    dto: UploadProductDocumentDto,
    stored: { url: string; fileName: string; size: number; mimeType: string },
  ): Promise<ProductDocument> {
    await this.assertCanUpload(productId, userId);

    const document = this.documents.create({
      productId,
      documentType: dto.documentType,
      title: dto.title,
      description: dto.description,
      fileUrl: stored.url,
      fileName: stored.fileName,
      fileSize: stored.size,
      mimeType: stored.mimeType,
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

  /**
   * Record an admin verification. Authorisation happens at the route
   * (JwtAuthGuard + AdminRolesGuard + @AdminRoles), which is the correct place
   * for it; `adminId` is the resolved admins row for attribution.
   */
  async verify(id: string, userId: string, dto: VerifyProductDocumentDto): Promise<ProductDocument> {
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
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from './invoice.entity';
import { User } from '../auth/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { EmailService } from '../common/email/email.service';

export interface GenerateInvoiceDto {
  auctionId: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  hammerPrice: number;
  commission: number;
  vat: number;
  fixedFee: number;
}

export interface MarkPaidDto {
  paymentMethod?: string;
  paymentReference?: string;
}

export interface InvoiceQuery {
  buyerId?: string;
  sellerId?: string;
}

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly repo: Repository<Invoice>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly emailService: EmailService,
  ) {}

  async generateInvoice(data: GenerateInvoiceDto): Promise<Invoice> {
    const count = await this.repo.count();
    const next = count + 1;
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(next).padStart(6, '0')}`;

    const total =
      Number(data.hammerPrice) +
      Number(data.commission) +
      Number(data.vat) +
      Number(data.fixedFee);

    const invoice = this.repo.create({
      invoice_number: invoiceNumber,
      auction_id: data.auctionId,
      product_id: data.productId,
      buyer_id: data.buyerId,
      seller_id: data.sellerId,
      hammer_price: data.hammerPrice,
      commission: data.commission,
      vat: data.vat,
      fixed_fee: data.fixedFee,
      total,
      status: InvoiceStatus.ISSUED,
      issued_at: new Date(),
    });

    const saved = await this.repo.save(invoice);

    await this.notifyBuyer(saved).catch((error) => {
      this.logger.warn(`Failed to email invoice ${invoiceNumber}: ${error.message}`);
    });

    return saved;
  }

  private async notifyBuyer(invoice: Invoice): Promise<void> {
    const buyer = await this.userRepo.findOne({
      where: { id: invoice.buyer_id },
    });
    if (!buyer || !buyer.email) return;

    const product = await this.productRepo.findOne({
      where: { id: invoice.product_id },
    });
    const pdfUrl = `${process.env.API_URL || 'http://localhost:3001/api'}/invoices/${invoice.id}/pdf`;

    await this.emailService.sendInvoiceEmail(buyer.email, {
      invoiceNumber: invoice.invoice_number,
      total: Number(invoice.total),
      pdfUrl,
      itemTitle: product?.title || 'Auction item',
    });
  }

  async findAll(query: InvoiceQuery = {}): Promise<Invoice[]> {
    const where: Record<string, string> = {};
    if (query.buyerId) where.buyer_id = query.buyerId;
    if (query.sellerId) where.seller_id = query.sellerId;
    return this.repo.find({ where, order: { issued_at: 'DESC' } });
  }

  async findById(id: string): Promise<Invoice> {
    const invoice = await this.repo.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  /** Targeted lookup by payment reference (avoids loading the whole table). */
  async findByPaymentReference(reference: string): Promise<Invoice | null> {
    return this.repo.findOne({
      where: { payment_reference: reference },
    });
  }

  async markPaid(id: string, dto: MarkPaidDto = {}): Promise<Invoice> {
    const invoice = await this.findById(id);
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already paid');
    }
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cannot pay a cancelled invoice');
    }

    invoice.status = InvoiceStatus.PAID;
    invoice.paid_at = new Date();
    invoice.payment_method = dto.paymentMethod || null;
    invoice.payment_reference = dto.paymentReference || null;

    const saved = await this.repo.save(invoice);

    const buyer = await this.userRepo.findOne({
      where: { id: saved.buyer_id },
    });
    if (buyer?.email) {
      await this.emailService
        .sendReceiptEmail(buyer.email, {
          invoiceNumber: saved.invoice_number,
          total: Number(saved.total),
          paymentMethod: saved.payment_method || 'Payment',
        })
        .catch((error) => {
          this.logger.warn(`Failed to email receipt for ${saved.invoice_number}: ${error.message}`);
        });
    }

    return saved;
  }

  async getPdfData(id: string): Promise<Record<string, unknown>> {
    const invoice = await this.findById(id);
    const product = await this.productRepo.findOne({
      where: { id: invoice.product_id },
    });

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      auctionId: invoice.auction_id,
      productId: invoice.product_id,
      buyerId: invoice.buyer_id,
      sellerId: invoice.seller_id,
      itemTitle: product?.title || 'Auction item',
      hammerPrice: Number(invoice.hammer_price),
      commission: Number(invoice.commission),
      vat: Number(invoice.vat),
      fixedFee: Number(invoice.fixed_fee),
      total: Number(invoice.total),
      status: invoice.status,
      issuedAt: invoice.issued_at,
      paidAt: invoice.paid_at,
      paymentMethod: invoice.payment_method,
      paymentReference: invoice.payment_reference,
    };
  }

  async getPdf(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const invoice = await this.findById(id);
    const product = await this.productRepo.findOne({
      where: { id: invoice.product_id },
    });
    const buyer = await this.userRepo.findOne({
      where: { id: invoice.buyer_id },
    });

    const money = (v: number) =>
      `₦${Number(v).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
    const date = (d: Date | null) =>
      d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';

    const buffer = await makeBrandedPdf({
      invoiceNumber: invoice.invoice_number,
      itemTitle: product?.title || 'Auction item',
      buyerName: buyer?.name || '—',
      hammerPrice: money(invoice.hammer_price),
      commission: money(invoice.commission),
      vat: money(invoice.vat),
      fixedFee: money(invoice.fixed_fee),
      total: money(invoice.total),
      status: invoice.status,
      issuedAt: date(invoice.issued_at),
      paidAt: date(invoice.paid_at),
      paymentMethod: invoice.payment_method || 'N/A',
    });

    return { buffer, filename: `${invoice.invoice_number}.pdf` };
  }

  async getSummary(): Promise<{
    count: number;
    totalIssued: number;
    totalPaid: number;
  }> {
    const invoices = await this.repo.find();
    let totalIssued = 0;
    let totalPaid = 0;

    for (const invoice of invoices) {
      if (invoice.status === InvoiceStatus.CANCELLED) continue;
      totalIssued += Number(invoice.total);
      if (invoice.status === InvoiceStatus.PAID) {
        totalPaid += Number(invoice.total);
      }
    }

    return {
      count: invoices.length,
      totalIssued,
      totalPaid,
    };
  }
}

/**
 * Branded invoice PDF rendered with pdfkit.
 * Layout: navy header band, item title, line-item table, highlighted total,
 * payment status block, footer note.
 */
async function makeBrandedPdf(data: {
  invoiceNumber: string;
  itemTitle: string;
  buyerName: string;
  hammerPrice: string;
  commission: string;
  vat: string;
  fixedFee: string;
  total: string;
  status: string;
  issuedAt: string;
  paidAt: string;
  paymentMethod: string;
}): Promise<Buffer> {
  const PDFDocument: any = (await import('pdfkit')) as any;
  const PDFKitCtor = PDFDocument.default || PDFDocument;
  const doc = new PDFKitCtor({ size: 'A4', margin: 0 });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const NAVY = '#1a1a2e';
  const ACCENT = '#e94560';
  const GRAY = '#6b7280';
  const LIGHT = '#f3f4f6';

  // Header band
  doc.rect(0, 0, 595.28, 110).fill(NAVY);
  doc.fill('#ffffff').fontSize(24).font('Helvetica-Bold').text('GREY AUCTION', 40, 30);
  doc.fill('#ffffff').fontSize(11).font('Helvetica').text('Bid smart, buy better.', 40, 60);
  doc.fill('#ffffff').fontSize(13).font('Helvetica-Bold').text('INVOICE', 40, 82, { width: 515, align: 'right' } as any);

  // Meta block
  doc.fill(GRAY).fontSize(9).font('Helvetica');
  doc.text(`Invoice Number: ${data.invoiceNumber}`, 40, 135);
  doc.text(`Issued: ${data.issuedAt}`, 40, 150);
  doc.text(`Buyer: ${data.buyerName}`, 40, 165);

  // Item
  doc.fill(NAVY).fontSize(11).font('Helvetica-Bold').text('ITEM', 40, 195);
  doc.fill('#111827').fontSize(12).font('Helvetica').text(data.itemTitle, 40, 212);

  // Line items table
  const tableTop = 250;
  const rowH = 26;
  const colValue = 460;

  const rows: [string, string][] = [
    ['Hammer Price', data.hammerPrice],
    ['Platform Commission', data.commission],
    ['VAT', data.vat],
    ['Fixed Fee', data.fixedFee],
  ];

  doc.rect(40, tableTop - 12, 515.28, 26).fill(LIGHT);
  doc.fill(NAVY).fontSize(9).font('Helvetica-Bold');
  doc.text('DESCRIPTION', 48, tableTop - 5);
  doc.text('AMOUNT', colValue, tableTop - 5, { width: 90, align: 'right' } as any);

  let y = tableTop + 22;
  rows.forEach(([label, value], idx) => {
    if (idx % 2 === 1) {
      doc.rect(40, y - 6, 515.28, rowH - 4).fill('#fafafa');
    }
    doc.fill('#374151').fontSize(10).font('Helvetica').text(label, 48, y);
    doc.text(value, colValue, y, { width: 90, align: 'right' } as any);
    y += rowH;
  });

  // Total band
  doc.rect(40, y + 4, 515.28, 32).fill(ACCENT);
  doc.fill('#ffffff').fontSize(12).font('Helvetica-Bold').text('TOTAL DUE', 48, y + 13);
  doc.text(data.total, colValue, y + 13, { width: 90, align: 'right' } as any);
  y += 50;

  // Payment status
  doc.fill(NAVY).fontSize(10).font('Helvetica-Bold').text('PAYMENT STATUS', 40, y);
  y += 16;
  doc.fill('#374151').fontSize(10).font('Helvetica');
  doc.text(`Status: ${data.status.toUpperCase()}`, 40, y);
  doc.text(`Paid: ${data.paidAt}`, 40, y + 16);
  doc.text(`Payment Method: ${data.paymentMethod}`, 40, y + 32);

  // Footer
  doc.fill(GRAY).fontSize(8).font('Helvetica');
  doc.text('This invoice was generated by the Grey Auction platform.', 40, 780);
  doc.text('For support contact support@greyauction.com', 40, 792);

  doc.end();
  return done;
}

import { Module } from '@nestjs/common';
import { InvoiceFactoryService } from './invoice-factory.service';

/**
 * Exposed on its own so OrderModule can issue invoices without importing
 * InvoiceModule (which imports OrderModule to settle payments).
 */
@Module({
  providers: [InvoiceFactoryService],
  exports: [InvoiceFactoryService],
})
export class InvoiceFactoryModule {}

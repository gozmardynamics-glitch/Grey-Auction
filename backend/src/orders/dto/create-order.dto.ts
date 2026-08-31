import { IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  invoiceId: string;
}

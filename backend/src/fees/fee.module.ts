import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeConfig } from './fee-config.entity';
import { FeeService } from './fee.service';
import { FeeController } from './fee.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FeeConfig])],
  controllers: [FeeController],
  providers: [FeeService],
  exports: [FeeService],
})
export class FeeModule implements OnModuleInit {
  constructor(private readonly feeService: FeeService) {}

  async onModuleInit(): Promise<void> {
    await this.feeService.seedDefaults();
  }
}

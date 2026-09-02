import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeConfig } from './fee-config.entity';
import { FeeOverride } from './fee-override.entity';
import { FeeService } from './fee.service';
import { FeeController } from './fee.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FeeConfig, FeeOverride])],
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
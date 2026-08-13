import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { CreateModelDto } from './dto/create-model.dto';
import { CreateFeatureConfigDto } from './dto/create-feature-config.dto';
import { UpdateFeatureConfigDto } from './dto/update-feature-config.dto';
import { PROVIDER_PRESETS } from './provider-presets';

@ApiTags('Admin - AI')
@Controller('admin/ai')
@UseGuards(JwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AIController {
  constructor(private readonly service: AIService) {}

  @Get('providers')
  @ApiOperation({ summary: 'List all LLM providers with model counts' })
  async findAllProviders() {
    const providers = await this.service.findAllProviders();
    return { success: true, data: providers };
  }

  @Get('providers/presets')
  @ApiOperation({ summary: 'List provider presets (base URLs)' })
  async getProviderPresets() {
    return { success: true, data: PROVIDER_PRESETS };
  }

  @Get('providers/health/summary')
  @ApiOperation({ summary: 'Get provider health summary' })
  async healthSummary() {
    const summary = await this.service.healthSummary();
    return { success: true, data: summary };
  }

  @Post('providers')
  @ApiOperation({ summary: 'Create new LLM provider' })
  async createProvider(@Body() dto: CreateProviderDto) {
    const provider = await this.service.createProvider(dto);
    return { success: true, message: 'Provider created', data: provider };
  }

  @Get('providers/:id')
  @ApiOperation({ summary: 'Get provider details with models' })
  async findProviderById(@Param('id') id: string) {
    const provider = await this.service.findProviderById(id);
    return { success: true, data: provider };
  }

  @Patch('providers/:id')
  @ApiOperation({ summary: 'Update provider' })
  async updateProvider(@Param('id') id: string, @Body() dto: UpdateProviderDto) {
    const provider = await this.service.updateProvider(id, dto);
    return { success: true, message: 'Provider updated', data: provider };
  }

  @Delete('providers/:id')
  @ApiOperation({ summary: 'Remove provider and cascade models' })
  async removeProvider(@Param('id') id: string) {
    await this.service.removeProvider(id);
    return { success: true, message: 'Provider removed' };
  }

  @Get('providers/:id/models')
  @ApiOperation({ summary: 'List models for a provider' })
  async findModelsByProvider(@Param('id') id: string) {
    const models = await this.service.findModelsByProvider(id);
    return { success: true, data: models };
  }

  @Post('providers/:id/models')
  @ApiOperation({ summary: 'Add model to provider' })
  async createModel(@Param('id') id: string, @Body() dto: CreateModelDto) {
    const model = await this.service.createModel(id, dto);
    return { success: true, message: 'Model created', data: model };
  }

  @Patch('providers/:id/models/:mid')
  @ApiOperation({ summary: 'Update model' })
  async updateModel(@Param('id') id: string, @Param('mid') mid: string, @Body() dto: Partial<CreateModelDto>) {
    const model = await this.service.updateModel(id, mid, dto);
    return { success: true, message: 'Model updated', data: model };
  }

  @Delete('providers/:id/models/:mid')
  @ApiOperation({ summary: 'Remove model' })
  async removeModel(@Param('id') id: string, @Param('mid') mid: string) {
    await this.service.removeModel(id, mid);
    return { success: true, message: 'Model removed' };
  }

  @Post('providers/:id/health')
  @ApiOperation({ summary: 'Test provider connection and record health' })
  async healthCheck(@Param('id') id: string) {
    const provider = await this.service.findProviderById(id);
    const startTime = Date.now();
    try {
      const url = provider.baseUrl.replace(/\/$/, '') + '/models';
      const resp = await fetch(url, {
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          ...(provider.headers || {}),
        },
        signal: AbortSignal.timeout(10000),
      });
      const data = await resp.json();
      const latencyMs = Date.now() - startTime;
      const modelCount = data?.data?.length || 0;
      const updated = await this.service.recordHealth(id, { success: resp.ok, latencyMs, modelCount });
      return {
        success: true,
        message: 'Connection successful',
        data: { status: updated.status, latency: latencyMs, modelCount },
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const updated = await this.service.recordHealth(id, { success: false, latencyMs });
      return {
        success: false,
        message: err.message || 'Connection failed',
        data: { status: updated.status, latency: latencyMs },
      };
    }
  }

  @Get('features')
  @ApiOperation({ summary: 'List all AI feature configs' })
  async findAllFeatures() {
    const features = await this.service.findAllFeatures();
    return { success: true, data: features };
  }

  @Get('features/:id')
  @ApiOperation({ summary: 'Get single feature config' })
  async findFeatureById(@Param('id') id: string) {
    const feature = await this.service.findFeatureById(id);
    return { success: true, data: feature };
  }

  @Post('features')
  @ApiOperation({ summary: 'Create new feature config' })
  async createFeatureConfig(@Body() dto: CreateFeatureConfigDto) {
    const feature = await this.service.createFeatureConfig(dto);
    return { success: true, message: 'Feature config created', data: feature };
  }

  @Patch('features/:id')
  @ApiOperation({ summary: 'Update feature config' })
  async updateFeatureConfig(@Param('id') id: string, @Body() dto: UpdateFeatureConfigDto) {
    const feature = await this.service.updateFeatureConfig(id, dto);
    return { success: true, message: 'Feature config updated', data: feature };
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get usage logs' })
  async findUsageLogs(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('feature') feature?: string,
  ) {
    const logs = await this.service.findUsageLogs({ dateFrom, dateTo, feature });
    return { success: true, data: logs };
  }

  @Get('usage/summary')
  @ApiOperation({ summary: 'Get aggregated usage summary' })
  async findUsageSummary() {
    const summary = await this.service.findUsageSummary();
    return { success: true, data: summary };
  }
}

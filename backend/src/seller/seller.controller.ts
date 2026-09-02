import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../common/storage/storage.service';
import { SellerService } from './services/seller.service';
import { SellerDocumentService } from './services/seller-document.service';
import { SellerPayoutService } from './services/seller-payout.service';
import { SellerReviewService } from './services/seller-review.service';
import { SellerStatisticsService } from './services/seller-statistics.service';
import {
  RegisterSellerDto,
  UpdateSellerDto,
  ApproveSellerDto,
  RejectSellerDto,
  SuspendSellerDto,
  UpdateCommissionRateDto,
  SellerQueryDto,
  UploadDocumentDto,
  VerifyDocumentDto,
  UpdateDocumentDto,
  RequestPayoutDto,
  ProcessPayoutDto,
  CancelPayoutDto,
  PayoutQueryDto,
  CreateReviewDto,
  RespondToReviewDto,
  FlagReviewDto,
  ReviewQueryDto,
  PayoutFrequencyDto,
  SellerFeeOverrideDto,
} from './dto';
import { FeeService } from '../fees/fee.service';
import { FeeOverrideScope } from '../fees/fee-override.entity';
import { VatBase } from '../fees/fee-breakdown';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import {
  SellerGuard,
  VerifiedSellerGuard,
  SellerOwnershipGuard,
} from './guards';
import {
  CurrentSeller,
  SellerOnly,
  RequireVerification,
} from './decorators';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { CurrentAdmin } from '../admin/decorators/current-admin.decorator';
import { Seller } from './entities/seller.entity';
import { Admin, AdminRole } from '../admin/entities/admin.entity';
import { EmailService } from '../common/email/email.service';
import { StatisticsPeriod } from './entities/seller-statistics.entity';

@ApiTags('Sellers')
@Controller('sellers')
export class SellerController {
  private readonly logger = new Logger(SellerController.name);

  constructor(
    private readonly sellerService: SellerService,
    private readonly documentService: SellerDocumentService,
    private readonly payoutService: SellerPayoutService,
    private readonly reviewService: SellerReviewService,
    private readonly statisticsService: SellerStatisticsService,
    private readonly storageService: StorageService,
    private readonly emailService: EmailService,
    private readonly feeService: FeeService,
  ) {}

  // ==========================================
  // SELLER REGISTRATION & PROFILE
  // ==========================================

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Register as a seller' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Seller registered successfully' })
  async register(
    @Body() registerDto: RegisterSellerDto,
    @CurrentUser() user: any,
  ) {
    const seller = await this.sellerService.register(user.id, registerDto);

    // Send confirmation email — organizations get a tailored email
    const orgTypes = ['AGENCY', 'GOVERNMENT', 'EMBASSY', 'NGO'];
    if (orgTypes.includes(registerDto.business_type)) {
      await this.emailService.sendOrganizationRegistrationEmail(
        registerDto.email,
        {
          agencyName: registerDto.business_name,
          agencyType: registerDto.business_type,
          contactPerson: registerDto.contact_person || registerDto.business_name,
        },
      );
    } else {
      await this.emailService.sendWelcomeEmail(
        registerDto.email,
        registerDto.business_name,
      ).catch(() => {});
    }

    return {
      success: true,
      message: 'Seller registration successful. Awaiting verification.',
      data: seller,
    };
  }

  @Get('profile/me')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @SellerOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current seller profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile retrieved successfully' })
  async getMyProfile(@CurrentSeller() seller: Seller) {
    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: seller,
    };
  }

  @Get('me/products')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @SellerOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current seller listings (products)' })
  async getMyListings(@CurrentSeller() seller: Seller) {
    const products = await this.sellerService.getMyListings(seller.user_id);
    return { success: true, data: { items: products, total: products.length } };
  }

  @Get('me/sales')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @SellerOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current seller sales' })
  async getMySales(@CurrentSeller() seller: Seller) {
    const sales = await this.sellerService.getMySales(seller.user_id);
    return { success: true, data: sales };
  }

  @Get('me/conversations')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @SellerOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current seller conversations' })
  async getMyConversations() {
    // Chat is client-side for now; the API contract returns an empty list
    return { success: true, data: [] };
  }

  @Patch('profile/me')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @SellerOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update seller profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentSeller() seller: Seller,
    @Body() updateDto: UpdateSellerDto,
  ) {
    const updated = await this.sellerService.update(seller.id, updateDto);

    return {
      success: true,
      message: 'Profile updated successfully',
      data: updated,
    };
  }

  /** U5 answer #3 — customizable payout schedule (per seller preference). */
  @Patch('settings/payout-frequency')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @SellerOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set payout schedule preference (instant | daily | weekly | monthly)' })
  async setPayoutFrequency(
    @CurrentSeller() seller: Seller,
    @Body() dto: PayoutFrequencyDto,
  ) {
    const updated = await this.sellerService.setPayoutFrequency(seller.id, dto.frequency);
    return {
      success: true,
      message: 'Payout frequency updated',
      data: updated,
    };
  }

  /** U5 answer #1 — the current seller's own fee override. */
  @Get('settings/fees')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @SellerOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the current seller's fee override (U5)" })
  async getMyFeeOverride(@CurrentSeller() seller: Seller) {
    const data = await this.feeService.getOverride(
      FeeOverrideScope.SELLER,
      seller.user_id,
    );
    return { success: true, data };
  }

  /** U5 answer #1 — upsert the current seller's own fee override. */
  @Put('settings/fees')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @SellerOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Set the current seller's fee override (U5)" })
  async setMyFeeOverride(
    @CurrentSeller() seller: Seller,
    @Body() dto: SellerFeeOverrideDto,
  ) {
    const data = await this.feeService.upsertOverride({
      scope: FeeOverrideScope.SELLER,
      scopeId: seller.user_id,
      buyerFeePct: dto.buyerFeePct,
      buyerFeeEnabled: dto.buyerFeeEnabled,
      sellerFeePct: dto.sellerFeePct,
      sellerFeeEnabled: dto.sellerFeeEnabled,
      vatPct: dto.vatPct,
      vatBase: (dto.vatBase ?? undefined) as VatBase | undefined,
    });
    return { success: true, message: 'Fee preferences saved', data };
  }

  @Get(':id/public')
  @ApiOperation({ summary: 'Get public seller profile' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile retrieved successfully' })
  async getPublicProfile(@Param('id') id: string) {
    const seller = await this.sellerService.findById(id);
    const reviews = await this.reviewService.getSellerReviews(id, 1, 5);

    // Remove sensitive data
    delete seller.bank_account_details;
    delete seller.internal_notes;

    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        seller,
        recent_reviews: reviews.data,
        total_reviews: reviews.total,
        rating_breakdown: reviews.rating_breakdown,
      },
    };
  }

  // ==========================================
  // SELLER DASHBOARD
  // ==========================================

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @SellerOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get seller dashboard data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Dashboard data retrieved' })
  async getDashboard(@CurrentSeller() seller: Seller) {
    const dashboard = await this.sellerService.getDashboard(seller.id);

    return {
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: dashboard,
    };
  }

  // ==========================================
  // ADMIN: SELLER MANAGEMENT
  // ==========================================

  @Get()
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all sellers (Admin)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Sellers retrieved successfully' })
  async findAll(@Query() query: SellerQueryDto) {
    const result = await this.sellerService.findAll(query);

    return {
      success: true,
      message: 'Sellers retrieved successfully',
      ...result,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get seller details (Admin)' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Seller retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const seller = await this.sellerService.findById(id);

    return {
      success: true,
      message: 'Seller retrieved successfully',
      data: seller,
    };
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve seller (Admin)' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Seller approved successfully' })
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveSellerDto,
    @CurrentAdmin() admin: Admin,
  ) {
    const seller = await this.sellerService.approve(id, approveDto, admin.id);

    this.emailService.sendSellerVerificationEmail(seller.email, seller.business_name, 'approved').catch((err) => {
      this.logger.error(`Failed to send seller approval email: ${err.message}`);
    });

    return {
      success: true,
      message: 'Seller approved successfully',
      data: seller,
    };
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject seller (Admin)' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Seller rejected successfully' })
  async reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectSellerDto,
    @CurrentAdmin() admin: Admin,
  ) {
    const seller = await this.sellerService.reject(id, rejectDto, admin.id);

    this.emailService.sendSellerVerificationEmail(
      seller.email,
      seller.business_name,
      'rejected',
      rejectDto.rejection_reason,
    ).catch((err) => {
      this.logger.error(`Failed to send seller rejection email: ${err.message}`);
    });

    return {
      success: true,
      message: 'Seller rejected successfully',
      data: seller,
    };
  }

  @Post(':id/suspend')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspend seller (Admin)' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Seller suspended successfully' })
  async suspend(
    @Param('id') id: string,
    @Body() suspendDto: SuspendSellerDto,
    @CurrentAdmin() admin: Admin,
  ) {
    const seller = await this.sellerService.suspend(id, suspendDto, admin.id);

    return {
      success: true,
      message: 'Seller suspended successfully',
      data: seller,
    };
  }

  @Post(':id/activate')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate seller (Admin)' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Seller activated successfully' })
  async activate(@Param('id') id: string, @CurrentAdmin() admin: Admin) {
    const seller = await this.sellerService.activate(id, admin.id);

    return {
      success: true,
      message: 'Seller activated successfully',
      data: seller,
    };
  }

  @Patch(':id/commission-rate')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update seller commission rate (Admin)' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Commission rate updated' })
  async updateCommissionRate(
    @Param('id') id: string,
    @Body() updateDto: UpdateCommissionRateDto,
    @CurrentAdmin() admin: Admin,
  ) {
    const seller = await this.sellerService.updateCommissionRate(
      id,
      updateDto,
      admin.id,
    );

    return {
      success: true,
      message: 'Commission rate updated successfully',
      data: seller,
    };
  }

  // ==========================================
  // DOCUMENTS (KYC)
  // ==========================================

  @Post('documents/upload')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @SellerOnly()
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload KYC document' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Document uploaded successfully' })
  async uploadDocument(
    @CurrentSeller() seller: Seller,
    @Body() uploadDto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const fileData = await this.storageService.uploadFile(file, 'documents');

    const document = await this.documentService.upload(
      seller.id,
      uploadDto,
      fileData,
    );

    return {
      success: true,
      message: 'Document uploaded successfully',
      data: document,
    };
  }

  @Get('documents/me')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @SellerOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my documents' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Documents retrieved successfully' })
  async getMyDocuments(@CurrentSeller() seller: Seller) {
    const documents = await this.documentService.findBySellerId(seller.id);
    const status = await this.documentService.getVerificationStatus(seller.id);

    return {
      success: true,
      message: 'Documents retrieved successfully',
      data: {
        documents,
        verification_status: status,
      },
    };
  }

  @Patch('documents/:id')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @SellerOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update document metadata' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document updated successfully' })
  async updateDocument(
    @Param('id') id: string,
    @Body() updateDto: UpdateDocumentDto,
  ) {
    const document = await this.documentService.update(id, updateDto);

    return {
      success: true,
      message: 'Document updated successfully',
      data: document,
    };
  }

  @Delete('documents/:id')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @SellerOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document deleted successfully' })
  async deleteDocument(@Param('id') id: string) {
    await this.documentService.remove(id);

    return {
      success: true,
      message: 'Document deleted successfully',
    };
  }

  @Get(':id/documents')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get seller documents (Admin)' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Documents retrieved successfully' })
  async getSellerDocuments(@Param('id') id: string) {
    const documents = await this.documentService.findBySellerId(id);
    const status = await this.documentService.getVerificationStatus(id);

    return {
      success: true,
      message: 'Documents retrieved successfully',
      data: {
        documents,
        verification_status: status,
      },
    };
  }

  @Post('documents/:id/verify')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify document (Admin)' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document verified successfully' })
  async verifyDocument(
    @Param('id') id: string,
    @Body() verifyDto: VerifyDocumentDto,
    @CurrentAdmin() admin: Admin,
  ) {
    const document = await this.documentService.verify(id, verifyDto, admin.id);

    return {
      success: true,
      message: 'Document verified successfully',
      data: document,
    };
  }

  // ==========================================
  // PAYOUTS
  // ==========================================

  @Post('payouts/request')
  @UseGuards(JwtAuthGuard, SellerGuard, VerifiedSellerGuard)
  @SellerOnly()
  @RequireVerification()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request payout' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Payout requested successfully' })
  async requestPayout(
    @CurrentSeller() seller: Seller,
    @Body() requestDto: RequestPayoutDto,
  ) {
    const payout = await this.payoutService.requestPayout(seller.id, requestDto);

    return {
      success: true,
      message: 'Payout requested successfully',
      data: payout,
    };
  }

  @Get('payouts/me')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @SellerOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my payouts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payouts retrieved successfully' })
  async getMyPayouts(
    @CurrentSeller() seller: Seller,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const result = await this.payoutService.getSellerPayouts(seller.id, page, limit);
    const stats = await this.payoutService.getSellerStatistics(seller.id);

    return {
      success: true,
      message: 'Payouts retrieved successfully',
      ...result,
      statistics: stats,
    };
  }

  @Post('payouts/:id/cancel')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @SellerOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel payout request' })
  @ApiParam({ name: 'id', description: 'Payout ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payout cancelled successfully' })
  async cancelPayout(
    @Param('id') id: string,
    @Body() cancelDto: CancelPayoutDto,
    @CurrentSeller() seller: Seller,
  ) {
    const payout = await this.payoutService.cancel(id, cancelDto, seller.id, false);

    return {
      success: true,
      message: 'Payout cancelled successfully',
      data: payout,
    };
  }

  @Get('payouts')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all payouts (Admin)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payouts retrieved successfully' })
  async getAllPayouts(@Query() query: PayoutQueryDto) {
    const result = await this.payoutService.findAll(query);

    return {
      success: true,
      message: 'Payouts retrieved successfully',
      ...result,
    };
  }

  @Post('payouts/:id/process')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process payout (Admin)' })
  @ApiParam({ name: 'id', description: 'Payout ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payout processed successfully' })
  async processPayout(
    @Param('id') id: string,
    @Body() processDto: ProcessPayoutDto,
    @CurrentAdmin() admin: Admin,
  ) {
    const payout = await this.payoutService.process(id, processDto, admin.id);

    return {
      success: true,
      message: 'Payout processed successfully',
      data: payout,
    };
  }

  // ==========================================
  // REVIEWS
  // ==========================================

  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create review for seller' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Review created successfully' })
  async createReview(
    @Param('id') sellerId: string,
    @Body() createDto: CreateReviewDto,
    @CurrentUser() user: any,
  ) {
    const review = await this.reviewService.create(
      sellerId,
      user.id,
      createDto,
    );

    return {
      success: true,
      message: 'Review submitted successfully',
      data: review,
    };
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get seller reviews' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Reviews retrieved successfully' })
  async getSellerReviews(
    @Param('id') sellerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const result = await this.reviewService.getSellerReviews(
      sellerId,
      page,
      limit,
    );

    return {
      success: true,
      message: 'Reviews retrieved successfully',
      ...result,
    };
  }

  @Post('reviews/:id/respond')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @SellerOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Respond to review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Response added successfully' })
  async respondToReview(
    @Param('id') id: string,
    @Body() respondDto: RespondToReviewDto,
    @CurrentSeller() seller: Seller,
  ) {
    const review = await this.reviewService.respond(id, seller.id, respondDto);

    return {
      success: true,
      message: 'Response added successfully',
      data: review,
    };
  }

  @Post('reviews/:id/helpful')
  @ApiOperation({ summary: 'Mark review as helpful' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Review marked as helpful' })
  async markHelpful(@Param('id') id: string) {
    const review = await this.reviewService.markHelpful(id);

    return {
      success: true,
      message: 'Review marked as helpful',
      data: review,
    };
  }

  @Post('reviews/:id/flag')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Flag review as inappropriate (Admin)' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Review flagged successfully' })
  async flagReview(
    @Param('id') id: string,
    @Body() flagDto: FlagReviewDto,
    @CurrentAdmin() admin: Admin,
  ) {
    const review = await this.reviewService.flag(id, flagDto, admin.id);

    return {
      success: true,
      message: 'Review flagged successfully',
      data: review,
    };
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove review (Admin)' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Review removed successfully' })
  async removeReview(@Param('id') id: string, @CurrentAdmin() admin: Admin) {
    await this.reviewService.remove(id, admin.id);

    return {
      success: true,
      message: 'Review removed successfully',
    };
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  @Get('statistics/me')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @SellerOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved successfully' })
  async getMyStatistics(
    @CurrentSeller() seller: Seller,
    @Query('period') period: StatisticsPeriod = StatisticsPeriod.MONTHLY,
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    let stats;

    if (period === StatisticsPeriod.MONTHLY && year && month) {
      stats = await this.statisticsService.getMonthly(seller.id, year, month);
    } else {
      // Get current period
      const range = this.statisticsService.getPeriodRange(period);
      const allStats = await this.statisticsService.findByPeriod(
        seller.id,
        period,
        range.start,
        range.end,
      );
      stats = allStats[0] || null;
    }

    return {
      success: true,
      message: 'Statistics retrieved successfully',
      data: stats,
    };
  }

  @Get(':id/statistics')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get seller statistics (Admin)' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved successfully' })
  async getSellerStatistics(
    @Param('id') id: string,
    @Query('period') period: StatisticsPeriod = StatisticsPeriod.MONTHLY,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await this.statisticsService.findByPeriod(
      id,
      period,
      start,
      end,
    );

    return {
      success: true,
      message: 'Statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('statistics/leaderboard/revenue')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get top sellers by revenue (Admin)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leaderboard retrieved successfully' })
  async getTopSellersByRevenue(
    @Query('limit') limit: number = 10,
    @Query('period') period: StatisticsPeriod = StatisticsPeriod.MONTHLY,
  ) {
    const topSellers = await this.statisticsService.getTopSellersByRevenue(
      limit,
      period,
    );

    return {
      success: true,
      message: 'Leaderboard retrieved successfully',
      data: topSellers,
    };
  }

  @Get('statistics/leaderboard/rating')
  @ApiOperation({ summary: 'Get top sellers by rating' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leaderboard retrieved successfully' })
  async getTopSellersByRating(
    @Query('limit') limit: number = 10,
    @Query('period') period: StatisticsPeriod = StatisticsPeriod.MONTHLY,
  ) {
    const topSellers = await this.statisticsService.getTopSellersByRating(
      limit,
      period,
    );

    return {
      success: true,
      message: 'Leaderboard retrieved successfully',
      data: topSellers,
    };
  }

  // ==========================================
  // PLATFORM STATISTICS (ADMIN)
  // ==========================================

  @Get('statistics/platform')
  @UseGuards(JwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform-wide seller statistics (Admin)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved successfully' })
  async getPlatformStatistics() {
    const sellerStats = await this.sellerService.getPlatformStatistics();
    const payoutStats = await this.payoutService.getPlatformStatistics();

    return {
      success: true,
      message: 'Platform statistics retrieved successfully',
      data: {
        sellers: sellerStats,
        payouts: payoutStats,
      },
    };
  }
}

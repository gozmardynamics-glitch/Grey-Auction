import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller, SellerVerificationStatus, SellerStatus } from '../seller/entities/seller.entity';
import { SellerDocument, DocumentVerificationStatus } from '../seller/entities/seller-document.entity';

export type KycBadge = 'unverified' | 'pending' | 'verified' | 'trusted';

export interface KycBadgeView {
  sellerId: string;
  businessName: string;
  badge: KycBadge;
  /** Coarse status is safe to show; never expose document details publicly. */
  verificationStatus: SellerVerificationStatus;
  approvedDocuments: number;
  rating: number;
  totalSales: number;
  memberSince: Date | null;
}

/**
 * KYC badge (L4 trust & safety): a public, non-sensitive trust signal derived
 * from the seller's verification state and their APPROVED KYC documents.
 *
 *  - trusted   : approved, active seller with >= 2 approved KYC documents
 *  - verified  : approved, active seller
 *  - pending   : application under review
 *  - unverified: everything else (rejected/suspended sellers show no badge)
 */
@Injectable()
export class KycBadgeService {
  constructor(
    @InjectRepository(Seller)
    private readonly sellers: Repository<Seller>,
    @InjectRepository(SellerDocument)
    private readonly documents: Repository<SellerDocument>,
  ) {}

  async badgeForSeller(sellerId: string): Promise<KycBadgeView> {
    const seller = await this.sellers.findOne({ where: { id: sellerId } });
    if (!seller) throw new NotFoundException('Seller not found');

    const approved = await this.documents.count({
      where: { seller_id: seller.id, verification_status: DocumentVerificationStatus.APPROVED },
    });

    let badge: KycBadge = 'unverified';
    if (
      seller.verification_status === SellerVerificationStatus.APPROVED &&
      seller.status === SellerStatus.ACTIVE
    ) {
      badge = approved >= 2 ? 'trusted' : 'verified';
    } else if (
      seller.verification_status === SellerVerificationStatus.PENDING ||
      seller.verification_status === SellerVerificationStatus.UNDER_REVIEW
    ) {
      badge = 'pending';
    }

    return {
      sellerId: seller.id,
      businessName: seller.business_name,
      badge,
      verificationStatus: seller.verification_status,
      approvedDocuments: approved,
      rating: Number(seller.rating) || 0,
      totalSales: Number(seller.total_sales) || 0,
      memberSince: seller.created_at ?? null,
    };
  }
}

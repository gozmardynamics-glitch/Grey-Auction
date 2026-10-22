import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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

    return this.toView(seller, approved);
  }

  /**
   * Batch lookup for listing grids: products are owned by a User, while KYC
   * lives on the Seller record, so a grid needs user id -> tier. Resolves both
   * the sellers and their approved-document counts in one query each instead of
   * two per card.
   */
  async badgesForUsers(
    userIds: string[],
  ): Promise<Record<string, KycBadge | null>> {
    const unique = [...new Set(userIds.filter(Boolean))];
    if (unique.length === 0) return {};

    const sellers = await this.sellers.find({ where: { user_id: In(unique) } });
    if (sellers.length === 0) return {};

    const counts = await this.documents
      .createQueryBuilder('doc')
      .select('doc.seller_id', 'sellerId')
      .addSelect('COUNT(*)', 'count')
      .where('doc.seller_id IN (:...ids)', { ids: sellers.map((s) => s.id) })
      .andWhere('doc.verification_status = :status', {
        status: DocumentVerificationStatus.APPROVED,
      })
      .groupBy('doc.seller_id')
      .getRawMany<{ sellerId: string; count: string }>();

    const approvedBySeller = new Map(
      counts.map((row) => [row.sellerId, Number(row.count)]),
    );

    const result: Record<string, KycBadge | null> = {};
    for (const seller of sellers) {
      result[seller.user_id] = this.tierFor(
        seller,
        approvedBySeller.get(seller.id) ?? 0,
      );
    }
    return result;
  }

  private tierFor(seller: Seller, approvedDocuments: number): KycBadge {
    if (
      seller.verification_status === SellerVerificationStatus.APPROVED &&
      seller.status === SellerStatus.ACTIVE
    ) {
      return approvedDocuments >= 2 ? 'trusted' : 'verified';
    }
    if (
      seller.verification_status === SellerVerificationStatus.PENDING ||
      seller.verification_status === SellerVerificationStatus.UNDER_REVIEW
    ) {
      return 'pending';
    }
    return 'unverified';
  }

  private toView(seller: Seller, approvedDocuments: number): KycBadgeView {
    return {
      sellerId: seller.id,
      businessName: seller.business_name,
      badge: this.tierFor(seller, approvedDocuments),
      verificationStatus: seller.verification_status,
      approvedDocuments,
      rating: Number(seller.rating) || 0,
      totalSales: Number(seller.total_sales) || 0,
      memberSince: seller.created_at ?? null,
    };
  }
}

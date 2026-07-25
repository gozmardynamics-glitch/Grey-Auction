'use client';

import { useState } from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  ModalStatCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/common';

import { SellerDetail } from '../../models';
import {
  formatCurrency,
  statusStyles,
  sellerTypeIcons,
  verificationStatusIcons,
  planPackageIcons,
} from '@/shared/utils/helpers';
import { InfoRow } from './seller-details/info-row';
import { AuctionsTab } from './seller-details/auctions-tab';
import { SalesTab } from './seller-details/sales-tab';
import { TransactionsTab } from './seller-details/transactions-tab';
import { VerificationTab } from './seller-details/verification-tab';

interface SellerDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seller: SellerDetail | null;
}

export default function SellerDetailsModal({
  open,
  onOpenChange,
  seller,
}: SellerDetailsModalProps) {
  const [mainTab, setMainTab] = useState('activity');
  const [activityTab, setActivityTab] = useState('auctions');

  if (!seller) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[calc(100vw-80rem)] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-semibold">
            Seller Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6 pt-4">
          {/* Seller Header */}
          <Card className=" flex flex-col gap-2 sm:flex-row sm:items-center justify-between rounded-lg border p-4 shadow-none">
            <div className="flex items-center gap-2">
              <Avatar className="h-14 w-14">
                <AvatarImage src={seller.avatar} alt={seller.name} />
                <AvatarFallback className="text-lg">{seller.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{seller.name}</span>
                  {seller.sellerType && (() => {
                    const Icon = sellerTypeIcons[seller.sellerType];
                    return (
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-100 text-blue-700 border-blue-200"
                      >
                        {Icon && <Icon />}
                        {seller.sellerType}
                      </Badge>
                    );
                  })()}
                  {seller.verificationStatus && (() => {
                    const Icon = verificationStatusIcons[seller.verificationStatus];
                    return (
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusStyles[seller.verificationStatus] || ''}`}
                      >
                        {Icon && <Icon />}
                        {seller.verificationStatus}
                      </Badge>
                    );
                  })()}
                  {seller.planPackage && (() => {
                    const Icon = planPackageIcons[seller.planPackage];
                    return (
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusStyles[seller.planPackage] || ''}`}
                      >
                        {Icon && <Icon />}
                        {seller.planPackage} Plan
                      </Badge>
                    );
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">{seller.email}</p>
              </div>
            </div>

            <Badge variant="outline" className={statusStyles[seller.status]}>
              {seller.status}
            </Badge>
          </Card>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ModalStatCard
              label="Total Revenue"
              value={formatCurrency(seller.totalRevenue)}
            />
            <ModalStatCard
              label="Auctions"
              value={seller.totalAuctions ?? seller.totalListings}
            />
            <ModalStatCard label="Total Bids" value={seller.totalBids ?? 0} />
            <ModalStatCard
              label="Item Sold"
              value={seller.itemSold ?? seller.totalSales}
            />
          </div>

          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Basic Information</h3>
            <Card className="grid grid-cols-2 gap-4 border rounded-lg p-4 shadow-none">
              <InfoRow label="Seller ID" value={seller.id} />
              <InfoRow
                label="Phone Number"
                value={seller.phoneNumber || seller.phone}
              />
              <InfoRow label="Email" value={seller.email} />
              <InfoRow
                label="Date Joined"
                value={seller.dateJoined || seller.joinDate}
              />
            </Card>
          </div>

          {/* Contact Address */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Contact Address</h3>
            <Card className="grid grid-cols-2 gap-4 border rounded-lg p-4 shadow-none">
              <InfoRow label="Street" value={seller.street || '-'} />
              <InfoRow label="City" value={seller.city || '-'} />
              <InfoRow label="State" value={seller.state || '-'} />
              <InfoRow label="Country" value={seller.country || '-'} />
            </Card>
          </div>

          {/* Main Tabs: Activity | Verification */}
          <Tabs
            value={mainTab}
            onValueChange={setMainTab}
            className="space-y-4"
          >
            <TabsList className="h-auto gap-4 rounded-lg bg-card p-2">
              <TabsTrigger
                value="activity"
                className="shrink-0 rounded-none  px-1 pt-1 data-[state=active]:bg-background data-[state=active]:shadow-none text-sm"
              >
                Activity
              </TabsTrigger>
              <TabsTrigger
                value="verification"
                className="shrink-0 rounded-none  px-1 pt-1 data-[state=active]:bg-background data-[state=active]:shadow-none text-sm"
              >
                Verification
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity">
              <Tabs
                value={activityTab}
                onValueChange={setActivityTab}
                className="space-y-4"
              >
                <TabsList className="h-auto gap-4 rounded-none bg-transparent border-b p-0">
                  <TabsTrigger
                    value="auctions"
                    className="shrink-0 rounded-none border-b border-transparent px-1 pb-2 pt-1 data-[state=active]:rounded-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs"
                  >
                    Auctions
                  </TabsTrigger>
                  <TabsTrigger
                    value="sales"
                    className="shrink-0 rounded-none border-b border-transparent px-1 pb-2 pt-1 data-[state=active]:rounded-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs"
                  >
                    Sales
                  </TabsTrigger>
                  <TabsTrigger
                    value="transactions"
                    className="shrink-0 rounded-none border-b-2 border-transparent px-1 pb-2 pt-1 data-[state=active]:rounded-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs"
                  >
                    Transactions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="auctions">
                  <AuctionsTab auctions={seller.auctionActivity || []} />
                </TabsContent>
                <TabsContent value="sales">
                  <SalesTab sales={seller.salesActivity || []} />
                </TabsContent>
                <TabsContent value="transactions">
                  <TransactionsTab
                    transactions={seller.transactionActivity || []}
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="verification">
              <VerificationTab documents={seller.uploadedDocuments || []} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

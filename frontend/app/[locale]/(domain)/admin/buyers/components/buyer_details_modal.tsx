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
import { BuyerDetail } from '../../models';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';
import { InfoRow } from './buyer-details/info-row';
import { BidsTab } from './buyer-details/bids-tab';
import { PurchasesTab } from './buyer-details/purchases-tab';
import { TransactionsTab } from './buyer-details/transactions-tab';

interface BuyerDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buyer: BuyerDetail | null;
}

export default function BuyerDetailsModal({
  open,
  onOpenChange,
  buyer,
}: BuyerDetailsModalProps) {
  const [activityTab, setActivityTab] = useState('bids');

  if (!buyer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[50%] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-semibold">
            Buyer Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6 pt-4">
          {/* Buyer Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={buyer.avatar} alt={buyer.name} />
              <AvatarFallback className="text-lg">{buyer.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{buyer.name}</span>
                {buyer.verified && (
                  <svg
                    className="h-4 w-4 text-tertiary"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{buyer.email}</p>
            </div>
            <Badge variant="outline" className={statusStyles[buyer.status]}>
              {buyer.status}
            </Badge>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4">
            <ModalStatCard
              label="Total Spent"
              value={formatCurrency(buyer.totalSpent)}
            />
            <ModalStatCard label="Auc Bid Won" value={buyer.totalWins} />
            <ModalStatCard label="Total Bids" value={buyer.totalBids} />
            <ModalStatCard label="Purchases" value={buyer.purchases ?? 0} />
          </div>

          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Basic Information</h3>
            <Card className="grid grid-cols-2 gap-4 p-4">
              <InfoRow label="Buyer ID" value={buyer.id} />
              <InfoRow
                label="Phone Number"
                value={buyer.phoneNumber || buyer.phone}
              />
              <InfoRow label="Email" value={buyer.email} />
              <InfoRow
                label="Date Joined"
                value={buyer.dateJoined || buyer.joinDate}
              />
            </Card>
          </div>

          {/* Contact Address */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Contact Address</h3>
            <Card className="grid grid-cols-2 gap-4 p-4">
              <InfoRow label="Street" value={buyer.street || '-'} />
              <InfoRow label="City" value={buyer.city || '-'} />
              <InfoRow label="State" value={buyer.state || '-'} />
              <InfoRow label="Country" value={buyer.country || '-'} />
            </Card>
          </div>

          {/* Activity */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Activity</h3>
            <Tabs
              value={activityTab}
              onValueChange={setActivityTab}
              className="space-y-4"
            >
              <TabsList className="h-auto gap-4 rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="bids"
                  className="shrink-0 rounded-none border-b-2 border-transparent px-1 pb-2 pt-1 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm"
                >
                  Bids
                </TabsTrigger>
                <TabsTrigger
                  value="purchases"
                  className="shrink-0 rounded-none border-b-2 border-transparent px-1 pb-2 pt-1 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm"
                >
                  Purchases
                </TabsTrigger>
                <TabsTrigger
                  value="transactions"
                  className="shrink-0 rounded-none border-b-2 border-transparent px-1 pb-2 pt-1 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm"
                >
                  Transactions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bids">
                <BidsTab bids={buyer.bidActivity || []} />
              </TabsContent>
              <TabsContent value="purchases">
                <PurchasesTab purchases={buyer.purchaseActivity || []} />
              </TabsContent>
              <TabsContent value="transactions">
                <TransactionsTab
                  transactions={buyer.transactionActivity || []}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

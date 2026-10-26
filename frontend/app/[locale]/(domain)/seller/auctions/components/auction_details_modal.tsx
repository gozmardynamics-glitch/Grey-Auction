'use client';

import { Search, Hammer, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';

import {
  Badge,
  DataTable,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Separator,
  Card,
  Button,
  Label,
} from '@/shared/components/common';
import { formatCurrency } from '@/shared/utils/helpers';
import { BidHistoryItem, Listing } from '../../models';
import { statusStyles } from '@/shared/utils/helpers';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/shared/utils/api-client';
import { bidHistoryColumns } from './bid_history_columns';

// ---------- Sub-components ----------

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

// ---------- Main Component ----------

interface AuctionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: Listing | null;
}

export default function SellerAuctionDetailsModal({
  open,
  onOpenChange,
  listing,
}: AuctionDetailsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [bids, setBids] = useState<BidHistoryItem[]>([]);
  const [documents, setDocuments] = useState<
    Array<{ id: string; documentType: string; fileName: string; verificationStatus: string }>
  >([]);
  const [docTypes, setDocTypes] = useState<Array<{ value: string; label: string }>>([]);
  const [docType, setDocType] = useState('');
  const [uploading, setUploading] = useState(false);
  const listingId = listing?.id;

  const loadDocuments = useCallback(async () => {
    if (!listingId) return;
    try {
      // includeUnverified is honoured for the owning seller only.
      const json = await apiFetch<{ data?: typeof documents }>(
        `products/${listingId}/documents`,
        { query: { includeUnverified: 'true' } },
      );
      setDocuments(Array.isArray(json.data) ? json.data : []);
    } catch {
      setDocuments([]);
    }
  }, [listingId, documents]);

  useEffect(() => {
    if (!listingId) return;
    let cancelled = false;

    apiFetch<{ data?: Array<{ id?: string; bidderId?: string; amount?: string | number; createdAt?: string }> }>(
      `auctions/${listingId}/bids`,
    )
      .then((json) => {
        if (cancelled) return;
        const rows = Array.isArray(json.data) ? json.data : [];
        setBids(
          rows.map((b, i): BidHistoryItem => ({
            id: 'BID-' + String(i + 1).padStart(2, '0'),
            amount: Number(b.amount ?? 0),
            type: 'Minimum',
            date: b.createdAt ? new Date(b.createdAt).toLocaleString('en-GB') : '—',
            status: i === 0 ? 'Winning' : 'Outbid',
          })),
        );
      })
      .catch(() => setBids([]));

    apiFetch<{ data?: Array<{ value: string; label: string }> }>('products/documents/types')
      .then((json) => {
        if (cancelled) return;
        const types = Array.isArray(json.data) ? json.data : [];
        setDocTypes(types);
        setDocType((prev) => prev || types[0]?.value || '');
      })
      .catch(() => setDocTypes([]));

    void loadDocuments();

    return () => {
      cancelled = true;
    };
    // loadDocuments is stable per listingId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  if (!listing) return null;

  const bidHistory = bids;
  const totalBids = bids.length;

  const filtered = bidHistory.filter(
    (bid) =>
      bid.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uploadDocument = async (file: File | null) => {
    if (!listingId || !file || !docType) {
      toast.error('Pick a document type and a file first');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('documentType', docType);
      await apiFetch(`products/${listingId}/documents`, { method: 'POST', body: form });
      toast.success('Document uploaded for review');
      await loadDocuments();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = async (id: string) => {
    try {
      await apiFetch(`products/documents/${id}`, { method: 'DELETE' });
      toast.success('Document removed');
      await loadDocuments();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not remove the document');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[30%] max-h-[80%] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-semibold">
            Auction Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 p-6 pt-4">
          {/* Item Header */}
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              {listing.itemImage && (
                <Image
                  src={listing.itemImage}
                  alt={listing.item}
                  className="h-16 w-20 rounded-lg object-cover"
                  height={40}
                  width={40}
                />
              )}
              <div className="flex-1 space-y-1">
                <span className="text-xs text-muted-foreground">
                  #{listing.lotId}
                </span>
                <p className="text-sm font-semibold">{listing.item}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[8px] font-bold text-blue-700">
                    S
                  </div>
                  Your lot
                </div>
              </div>
            </div>
            <div>
              <Badge
                variant="default"
                className={statusStyles[listing.status]}
              >
                {listing.status}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Price Section */}
          <Card className="bg-primary/10 p-4">
            <h3 className="mb-3 text-sm font-semibold">Price</h3>
            <div className="grid grid-cols-2 gap-2">
              <InfoRow
                label="Starting Price:"
                value={formatCurrency(listing.startingBid)}
              />

              <InfoRow
                label="Reserved Price:"
                value={
                  typeof listing.reservePrice === 'boolean'
                    ? listing.reservePrice
                      ? 'Yes'
                      : 'No'
                    : listing.reservePrice
                }
              />

            </div>
          </Card>

          <Separator />

          {/* Documents */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Documents</h3>
            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No documents yet. Add an inspection report or provenance file — buyers see it once
                an admin verifies it.
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{doc.fileName}</p>
                      <p className="text-muted-foreground">
                        {doc.documentType} · {doc.verificationStatus}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void removeDocument(doc.id)}
                      aria-label="Remove document"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="doc-type" className="text-xs">
                  Type
                </Label>
                <select
                  id="doc-type"
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                >
                  {docTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="doc-file" className="text-xs">
                  File
                </Label>
                <Input
                  id="doc-file"
                  type="file"
                  className="h-8 text-xs"
                  disabled={uploading}
                  onChange={(e) => void uploadDocument(e.target.files?.[0] ?? null)}
                />
              </div>
              <Button size="sm" disabled={uploading} className="gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                {uploading ? 'Uploading…' : 'Upload'}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Bid History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Bid History</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-[140px] pl-8 text-xs bg-background"
                  />
                </div>
                <span className="text-sm text-muted-foreground border px-2 py-1 rounded-md flex items-center gap-1">
                  <Hammer size={11} />
                  Bids:{' '}
                  <span className="font-semibold">
                    {String(totalBids).padStart(2, '0')}
                  </span>
                </span>
              </div>
            </div>

            <DataTable
              columns={bidHistoryColumns}
              data={filtered}
              globalFilter={searchQuery}
              pageSize={4}
              emptyTitle="No bids placed yet"
              emptyDescription="Bids will appear here once bidders start placing them."
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

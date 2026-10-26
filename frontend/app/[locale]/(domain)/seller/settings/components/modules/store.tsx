'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button, Input, Label, Textarea } from '@/shared/components/common';
import Image from 'next/image';
import { apiFetch, ApiError } from '@/shared/utils/api-client';

interface SellerProfile {
  business_name?: string | null;
  business_description?: string | null;
}

export default function StoreSettings() {
  const t = useTranslations('seller.settings.store');
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const json = await apiFetch<{ data?: SellerProfile }>('sellers/profile/me');
        const profile = json?.data;
        if (cancelled || !profile) return;
        setShopName(profile.business_name ?? '');
        setDescription(profile.business_description ?? '');
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof ApiError ? err.message : 'Could not load your store');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const storeUrl = shopName.trim()
    ? `/store/${shopName.toLowerCase().replace(/\s+/g, '')}`
    : '';

  const handleSave = async () => {
    // Only fields UpdateSellerDto accepts; the API 400s on anything else.
    const body: Record<string, string> = {};
    const name = shopName.trim();
    const about = description.trim();
    if (name) body.business_name = name;
    if (about) body.business_description = about;

    if (!Object.keys(body).length) {
      toast.error('There is nothing to save yet');
      return;
    }

    setSaving(true);
    try {
      await apiFetch('sellers/profile/me', { method: 'PATCH', body });
      toast.success(t('saved'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Shop Banner — display only: there is no banner upload endpoint. */}
      <div className="space-y-2">
        <Label>{t('shopBanner')}</Label>
        <div className="relative block h-48 w-full max-w-lg overflow-hidden rounded-lg border bg-muted">
          <Image
            src="/brushes.svg"
            alt={t('defaultBannerAlt')}
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Shop Name */}
      <div className="space-y-2">
        <Label>{t('shopName')}</Label>
        <Input
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          className="bg-background max-w-lg"
        />
        {storeUrl && (
          <p className="text-xs text-muted-foreground">{storeUrl}</p>
        )}
      </div>

      {/* Store Description */}
      <div className="space-y-2">
        <Label htmlFor="store-description">Store Description</Label>
        <Textarea
          id="store-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="bg-background max-w-lg"
        />
        <p className="text-xs text-muted-foreground">
          Shown on your public seller profile.
        </p>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {t('save')}
      </Button>
    </div>
  );
}

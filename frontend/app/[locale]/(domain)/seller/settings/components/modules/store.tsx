'use client';

import { useState } from 'react';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@/shared/components/common';
import Image from 'next/image';

export default function StoreSettings() {
  const t = useTranslations('seller.settings.store');
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [shopName, setShopName] = useState('Jayden Auto');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');

  const storeUrl = `https://www.greyauction/store/${shopName.toLowerCase().replace(/\s+/g, '')}`;

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    
    toast.success(t('saved'));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Shop Banner */}
      <div className="space-y-2">
        <Label>{t('shopBanner')}</Label>
        <label className="relative block h-48 w-full max-w-lg cursor-pointer overflow-hidden rounded-lg border bg-muted">
          {bannerPreview ? (
            <Image
              src={bannerPreview}
              alt={t('shopBannerAlt')}
              fill
              className="object-cover"
            />
          ) : (
            <Image
              src="/brushes.svg"
              alt={t('defaultBannerAlt')}
              fill
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80">
              <Camera className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBannerChange}
          />
        </label>
      </div>

      {/* Shop Name */}
      <div className="space-y-2">
        <Label>{t('shopName')}</Label>
        <Input
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          className="bg-background max-w-lg"
        />
        <p className="text-xs text-muted-foreground">{storeUrl}</p>
      </div>

      {/* Social Media Links */}
      <div className="space-y-4">
        <p className="text-sm font-semibold">{t('socialMediaLinks')}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-lg">
          <div className="space-y-2">
            <Label>Facebook</Label>
            <Input
              placeholder="https://www."
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label>Instagram</Label>
            <Input
              placeholder="https://www."
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label>Twitter</Label>
            <Input
              placeholder="https://www."
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>
      </div>

      <Button onClick={handleSave}>{t('save')}</Button>
    </div>
  );
}

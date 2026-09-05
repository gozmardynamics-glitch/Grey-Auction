'use client';

import { Copy, ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Separator } from '@/shared/components/common';

const contactInfo = [
  {
    labelKey: 'email',
    value: 'info@greyauction.com',
    icon: Mail,
  },
  {
    labelKey: 'call',
    value: '+2348100225544, +2349122534455',
    icon: Phone,
  },
  {
    labelKey: 'chat',
    value: '+2348100225544, +2349122534455',
    icon: Phone,
  },
];

const socialMedia = [
  { label: 'Instagram', url: '#' },
  { label: 'Twitter', url: '#' },
  { label: 'Facebook', url: '#' },
];

const address =
  'Adenikunle Adesia Street, Victoria Island, Lagos State, Nigeria';

export default function ContactUsSettings() {
  const t = useTranslations('seller.settings.contactUs');
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Contact Info */}
      <section className="space-y-0">
        {contactInfo.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={item.labelKey}>
              <div className="flex items-center justify-between py-4">
                <span className="w-[60px] text-sm text-muted-foreground">
                  {t(item.labelKey)}
                </span>
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">{item.value}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCopy(item.value)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              {i < contactInfo.length - 1 && <Separator />}
            </div>
          );
        })}
      </section>

      <Separator />

      {/* Social Media */}
      <section className="space-y-0">
        <h3 className="mb-2 text-sm font-semibold">{t('socialMedia')}</h3>
        {socialMedia.map((item, i) => (
          <div key={item.label}>
            <div className="flex items-center justify-between py-4">
              <span className="text-sm">{item.label}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                asChild
              >
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
            {i < socialMedia.length - 1 && <Separator />}
          </div>
        ))}
      </section>

      <Separator />

      {/* Address */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{t('address')}</h3>
        <div className="flex items-start justify-between py-2">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-sm">{address}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => handleCopy(address)}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </section>
    </div>
  );
}

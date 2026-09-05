'use client';

import { useCallback, useEffect, useState } from 'react';
import { Percent, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Switch,
} from '@/shared/components/common';

import { cn } from '@/lib/utils';
import { useAppSelector } from '@/redux/store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface FeeConfig {
  id: string | number;
  category: string;
  displayName: string;
  commissionPct: number;
  vatPct: number;
  vatBase?: 'fees_only' | 'hammer_and_fees';
  sellerCommissionPct?: number;
  buyerFeeEnabled?: boolean;
  sellerFeeEnabled?: boolean;
  otherChargesPct: number;
  fixedFee: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FeeOverrideRow {
  scope: 'seller' | 'product' | 'buyer';
  scopeId: string;
  buyerFeePct: number | null;
  buyerFeeEnabled: boolean | null;
  sellerFeePct: number | null;
  sellerFeeEnabled: boolean | null;
  vatPct: number | null;
  vatBase: 'fees_only' | 'hammer_and_fees' | null;
}

interface FeeFormState {
  category: string;
  displayName: string;
  commissionPct: string;
  vatPct: string;
  vatBase: 'fees_only' | 'hammer_and_fees';
  sellerCommissionPct: string;
  buyerFeeEnabled: boolean;
  sellerFeeEnabled: boolean;
  otherChargesPct: string;
  fixedFee: string;
  isActive: boolean;
}

const EMPTY_FORM: FeeFormState = {
  category: '',
  displayName: '',
  commissionPct: '',
  vatPct: '',
  vatBase: 'hammer_and_fees',
  sellerCommissionPct: '5',
  buyerFeeEnabled: true,
  sellerFeeEnabled: true,
  otherChargesPct: '',
  fixedFee: '',
  isActive: true,
};

function formatMoney(value: number) {
  return `₦ ${value.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

export default function FeesSettings() {
  const t = useTranslations('admin.settings.fees');
  const token = useAppSelector((state) => state.auth.token);
  const [configs, setConfigs] = useState<FeeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [form, setForm] = useState<FeeFormState>(EMPTY_FORM);
  const [previewCategory, setPreviewCategory] = useState('');
  const [sampleAmount, setSampleAmount] = useState('1000000');

  // ─── U5: per-seller / per-product overrides ───
  const [overrides, setOverrides] = useState<FeeOverrideRow[]>([]);
  const [ovLoading, setOvLoading] = useState(true);
  const [ovSaving, setOvSaving] = useState(false);
  const [ovForm, setOvForm] = useState({
    scope: 'seller' as 'seller' | 'product' | 'buyer',
    scopeId: '',
    buyerFeePct: '',
    sellerFeePct: '',
    vatPct: '',
    vatBase: '' as '' | 'fees_only' | 'hammer_and_fees',
  });

  const loadConfigs = useCallback(() => {
    fetch(`${API_BASE}/fees`)
      .then((res) => res.json())
      .then((json) => {
        const data: FeeConfig[] =
          json?.success && Array.isArray(json.data) ? json.data : [];
        setConfigs(data);
        setPreviewCategory((prev) =>
          prev && data.some((c) => c.category === prev)
            ? prev
            : data.find((c) => c.category === 'default')?.category ??
              data[0]?.category ??
              ''
        );
      })
      .catch((error) => {
        console.error('Failed to load fee configurations:', error);
        toast.error(t('loadFailed'));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const loadOverrides = useCallback(() => {
    setOvLoading(true);
    fetch(`${API_BASE}/fees/overrides`)
      .then((res) => res.json())
      .then((json) => {
        const data: FeeOverrideRow[] =
          json?.success && Array.isArray(json.data) ? json.data : [];
        setOverrides(data);
      })
      .catch(() => toast.error(t('loadOverridesFailed')))
      .finally(() => setOvLoading(false));
  }, []);

  useEffect(() => {
    loadOverrides();
  }, [loadOverrides]);

  const handleOverrideSave = async () => {
    if (!ovForm.scopeId.trim()) {
      toast.error(t('enterScopeId'));
      return;
    }
    setOvSaving(true);
    try {
      const res = await fetch(`${API_BASE}/fees/overrides`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          scope: ovForm.scope,
          scopeId: ovForm.scopeId.trim(),
          buyerFeePct: ovForm.buyerFeePct === '' ? null : Number(ovForm.buyerFeePct),
          sellerFeePct: ovForm.sellerFeePct === '' ? null : Number(ovForm.sellerFeePct),
          vatPct: ovForm.vatPct === '' ? null : Number(ovForm.vatPct),
          vatBase: ovForm.vatBase === '' ? null : ovForm.vatBase,
        }),
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error('save failed');
      toast.success(t('overrideSaved'));
      setOvForm({ scope: 'seller', scopeId: '', buyerFeePct: '', sellerFeePct: '', vatPct: '', vatBase: '' });
      loadOverrides();
    } catch {
      toast.error(t('overrideSaveFailed'));
    } finally {
      setOvSaving(false);
    }
  };

  const handleOverrideDelete = async (row: FeeOverrideRow) => {
    if (!window.confirm(t('confirmRemoveOverride', { scope: row.scope }))) return;
    try {
      const res = await fetch(
        `${API_BASE}/fees/overrides/${row.scope}/${row.scopeId}`,
        {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      if (!res.ok) throw new Error('delete failed');
      toast.success(t('overrideRemoved'));
      loadOverrides();
    } catch {
      toast.error(t('overrideRemoveFailed'));
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const updateField = <K extends keyof FeeFormState>(
    key: K,
    value: FeeFormState[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const startEdit = (config: FeeConfig) => {
    setForm({
      category: config.category,
      displayName: config.displayName,
      commissionPct: String(config.commissionPct),
      vatPct: String(config.vatPct),
      vatBase: config.vatBase ?? 'hammer_and_fees',
      sellerCommissionPct: String(config.sellerCommissionPct ?? '5'),
      buyerFeeEnabled: config.buyerFeeEnabled ?? true,
      sellerFeeEnabled: config.sellerFeeEnabled ?? true,
      otherChargesPct: String(config.otherChargesPct),
      fixedFee: String(config.fixedFee),
      isActive: config.isActive,
    });
    setEditingId(config.id);
    setShowForm(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        category: form.category.trim(),
        displayName: form.displayName.trim() || form.category.trim(),
        commissionPct: Number(form.commissionPct) || 0,
        vatPct: Number(form.vatPct) || 0,
        vatBase: form.vatBase,
        sellerCommissionPct: Number(form.sellerCommissionPct) || 0,
        buyerFeeEnabled: form.buyerFeeEnabled,
        sellerFeeEnabled: form.sellerFeeEnabled,
        otherChargesPct: Number(form.otherChargesPct) || 0,
        fixedFee: Number(form.fixedFee) || 0,
        isActive: form.isActive,
      };
      const res = await fetch(`${API_BASE}/fees`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error('save failed');
      }
      toast.success(t('saved'));
      setShowForm(false);
      resetForm();
      setLoading(true);
      loadConfigs();
    } catch (error) {
      console.error('Failed to save fee configuration:', error);
      toast.error(t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (config: FeeConfig) => {
    const name = config.displayName || config.category;
    if (!window.confirm(t('confirmDelete', { name }))) return;
    try {
      const res = await fetch(`${API_BASE}/fees/${config.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('delete failed');
      toast.success(t('deleted'));
      setLoading(true);
      loadConfigs();
    } catch (error) {
      console.error('Failed to delete fee configuration:', error);
      toast.error(t('deleteFailed'));
    }
  };

  const handleToggleActive = async (config: FeeConfig, next: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/fees`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          category: config.category,
          displayName: config.displayName,
          commissionPct: config.commissionPct,
          vatPct: config.vatPct,
          otherChargesPct: config.otherChargesPct,
          fixedFee: config.fixedFee,
          isActive: next,
        }),
      });
      if (!res.ok) throw new Error('toggle failed');
      setLoading(true);
      loadConfigs();
    } catch (error) {
      console.error('Failed to update fee configuration:', error);
      toast.error(t('updateFailed'));
    }
  };

  const previewConfig =
    configs.find((c) => c.category === previewCategory) ?? configs[0];

  const amount = Number(sampleAmount) || 0;
  const previewVatBase = previewConfig?.vatBase ?? 'hammer_and_fees';
  const commission = (amount * (previewConfig?.commissionPct ?? 0)) / 100;
  const vat =
    previewVatBase === 'hammer_and_fees'
      ? (amount * (previewConfig?.vatPct ?? 0)) / 100 + (commission * (previewConfig?.vatPct ?? 0)) / 100
      : (commission * (previewConfig?.vatPct ?? 0)) / 100;
  const other = (amount * (previewConfig?.otherChargesPct ?? 0)) / 100;
  const fixed = previewConfig?.fixedFee ?? 0;
  const totalFees = commission + vat + other + fixed;
  const totalPayable = amount + totalFees;

  return (
    <div className="space-y-8 p-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">
            {t('title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" />
          {t('addConfiguration')}
        </Button>
      </div>

      {/* ─── Inline form ────────────────────────────────────────── */}
      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {editingId ? t('editConfiguration') : t('addConfiguration')}
            </CardTitle>
            <CardDescription>
              {editingId
                ? t('formDescriptionEdit')
                : t('formDescriptionAdd')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('categorySlug')}</Label>
                  <Input
                    value={form.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    placeholder={t('categorySlugPlaceholder')}
                    disabled={editingId !== null}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('displayName')}</Label>
                  <Input
                    value={form.displayName}
                    onChange={(e) => updateField('displayName', e.target.value)}
                    placeholder={t('displayNamePlaceholder')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('buyerFeeCommission')}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.commissionPct}
                      onChange={(e) =>
                        updateField('commissionPct', e.target.value)
                      }
                      placeholder="0"
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('vat')}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.vatPct}
                      onChange={(e) => updateField('vatPct', e.target.value)}
                      placeholder="0"
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('otherCharges')}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.otherChargesPct}
                      onChange={(e) =>
                        updateField('otherChargesPct', e.target.value)
                      }
                      placeholder="0"
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('fixedFee')}</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.fixedFee}
                    onChange={(e) => updateField('fixedFee', e.target.value)}
                    placeholder="0"
                  />
                </div>

                {/* ─── U5 fee rules ─────────────────────────────── */}
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('sellerCommission')}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.sellerCommissionPct}
                      onChange={(e) =>
                        updateField('sellerCommissionPct', e.target.value)
                      }
                      placeholder="5"
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('vatBase')}</Label>
                  <Select
                    value={form.vatBase}
                    onValueChange={(v) =>
                      updateField('vatBase', v as FeeFormState['vatBase'])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fees_only">
                        {t('vatBaseFeesOnly')}
                      </SelectItem>
                      <SelectItem value="hammer_and_fees">
                        {t('vatBaseHammerAndFees')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('buyerFeeEnabled')}</Label>
                  <div className="flex h-12 items-center gap-2">
                    <Switch
                      checked={form.buyerFeeEnabled}
                      onCheckedChange={(c) => updateField('buyerFeeEnabled', c)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {form.buyerFeeEnabled ? t('chargingBuyerFee') : t('off')}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('sellerFeeEnabled')}</Label>
                  <div className="flex h-12 items-center gap-2">
                    <Switch
                      checked={form.sellerFeeEnabled}
                      onCheckedChange={(c) => updateField('sellerFeeEnabled', c)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {form.sellerFeeEnabled ? t('chargingSellerCommission') : t('off')}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('active')}</Label>
                  <div className="flex h-12 items-center gap-2">
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(c) => updateField('isActive', c)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {form.isActive ? t('enabled') : t('disabled')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={saving || !form.category.trim()}
                >
                  {saving ? t('saving') : t('saveConfiguration')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  {t('cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ─── Config list ────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : configs.length === 0 ? (
        <EmptyState
          icon={<Percent className="h-10 w-10" />}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          action={
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('addConfiguration')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {configs.map((config) => {
            const isDefault = config.category === 'default';
            const isSelected = config.category === previewCategory;
            return (
              <Card
                key={config.id}
                className={cn(
                  'cursor-pointer transition-shadow',
                  isSelected && 'ring-2 ring-primary'
                )}
                onClick={() => setPreviewCategory(config.category)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {config.displayName || config.category}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-[11px]">
                          {config.category}
                        </Badge>
                        {isDefault && (
                          <Badge variant="outline" className="text-[11px]">
                            {t('platformDefault')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={config.isActive}
                        onCheckedChange={(c) => handleToggleActive(config, c)}
                      />
                    </div>
                  </div>
                  {isDefault && (
                    <p className="pt-1 text-xs text-muted-foreground">
                      {t('defaultAppliesHint')}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Stat
                      label={t('commission')}
                      value={`${config.commissionPct}%`}
                    />
                    <Stat label={t('vat')} value={`${config.vatPct}%`} />
                    <Stat
                      label={t('otherCharges')}
                      value={`${config.otherChargesPct}%`}
                    />
                    <Stat
                      label={t('fixedFeeStat')}
                      value={formatMoney(config.fixedFee)}
                    />
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-xs text-muted-foreground">
                      {config.isActive ? t('active') : t('inactive')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(config);
                        }}
                      >
                        {t('edit')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t('deleteConfiguration')}
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(config);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── U5: per-seller / per-product overrides ────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('overridesTitle')}</CardTitle>
          <CardDescription>
            {t('overridesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-sm">{t('scope')}</Label>
              <Select
                value={ovForm.scope}
                onValueChange={(v) =>
                  setOvForm((f) => ({
                    ...f,
                    scope: v as 'seller' | 'product' | 'buyer',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller">{t('seller')}</SelectItem>
                  <SelectItem value="product">{t('product')}</SelectItem>
                  <SelectItem value="buyer">{t('buyer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">
                {ovForm.scope === 'product'
                  ? t('productId')
                  : ovForm.scope === 'buyer'
                    ? t('buyerUserId')
                    : t('sellerUserId')}
              </Label>
              <Input
                value={ovForm.scopeId}
                onChange={(e) => setOvForm((f) => ({ ...f, scopeId: e.target.value }))}
                placeholder={t('uuidPlaceholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t('vatBaseLabel')}</Label>
              <Select
                value={ovForm.vatBase}
                onValueChange={(v) =>
                  setOvForm((f) => ({
                    ...f,
                    vatBase: v as '' | 'fees_only' | 'hammer_and_fees',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('inherit')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fees_only">{t('feesOnly')}</SelectItem>
                  <SelectItem value="hammer_and_fees">{t('hammerAndFees')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t('buyerFeePct')}</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={ovForm.buyerFeePct}
                onChange={(e) =>
                  setOvForm((f) => ({ ...f, buyerFeePct: e.target.value }))
                }
                placeholder={t('inherit')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t('sellerFeePct')}</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={ovForm.sellerFeePct}
                onChange={(e) =>
                  setOvForm((f) => ({ ...f, sellerFeePct: e.target.value }))
                }
                placeholder={t('inherit')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t('vatPct')}</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={ovForm.vatPct}
                onChange={(e) => setOvForm((f) => ({ ...f, vatPct: e.target.value }))}
                placeholder={t('inherit')}
              />
            </div>
          </div>
          <Button onClick={handleOverrideSave} disabled={ovSaving}>
            {ovSaving ? t('saving') : t('saveOverride')}
          </Button>

          {ovLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : overrides.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noOverrides')}</p>
          ) : (
            <div className="space-y-2">
              {overrides.map((row) => (
                <div
                  key={`${row.scope}-${row.scopeId}`}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="capitalize">
                      {row.scope}
                    </Badge>
                    <span className="font-mono text-xs">{row.scopeId}</span>
                    <span className="text-muted-foreground">
                      {t('summaryBuyer')} {row.buyerFeePct ?? '—'} · {t('summarySeller')} {row.sellerFeePct ?? '—'} ·{' '}
                      {t('vat')} {row.vatPct ?? '—'}
                      {row.vatBase ? ` (${row.vatBase === 'fees_only' ? t('feesOnly') : t('hammerAndFees')})` : ''}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOverrideDelete(row)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Example breakdown preview ──────────────────────────── */}
      {configs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('exampleTitle')}</CardTitle>
            <CardDescription>
              {t('exampleDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label className="text-sm">{t('sampleAmount')}</Label>
                <Input
                  type="number"
                  min={0}
                  value={sampleAmount}
                  onChange={(e) => setSampleAmount(e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label className="text-sm">{t('configuration')}</Label>
                <Select
                  value={previewConfig?.category ?? ''}
                  onValueChange={setPreviewCategory}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {configs.map((c) => (
                      <SelectItem key={c.id} value={c.category}>
                        {c.displayName || c.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label={t('commission')} value={formatMoney(commission)} />
              <Stat label={t('vat')} value={formatMoney(vat)} />
              <Stat label={t('otherCharges')} value={formatMoney(other)} />
              <Stat label={t('fixedFeeStat')} value={formatMoney(fixed)} />
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('totalFees')}</span>
                <span className="font-medium">{formatMoney(totalFees)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('totalPayable')}</span>
                <span className="font-semibold">{formatMoney(totalPayable)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

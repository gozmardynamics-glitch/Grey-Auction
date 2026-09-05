import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
} from '@/shared/components/common';

import {
  paymentGatewaySchema,
  withdrawSchema,
  type PaymentGatewayValues,
  type WithdrawValues,
} from '../../../models/schema';
import PaymentProvidersStatus from './payment_providers_status';

export default function PaymentsSettings() {
  const t = useTranslations('admin.settings.payments');
  // ─── Payment Gateway Form ──────────────────────────────────────────
  const gatewayForm = useForm<PaymentGatewayValues>({
    resolver: zodResolver(paymentGatewaySchema),
    defaultValues: {
      provider: 'Paystack',
      apiClientId:
        'ASldRq5RvKwGcC9NO_tPV7lSLhNFU5-rFdS0GOu3Cpy-Btb6ecqlM8j',
      secretKey: '',
      enabled: true,
    },
  });

  const onSaveGateway = () => {
    
    toast.success(t('gatewaySaved'));
  };

  // ─── Withdraw Form ─────────────────────────────────────────────────
  const withdrawForm = useForm<WithdrawValues>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      method: 'Bank Transfer',
      minWithdraw: '₦ 5000.00',
      maxWithdraw: '₦ 50000000.00',
      autoApprove: false,
    },
  });

  const onSaveWithdraw = () => {
    
    toast.success(t('withdrawSaved'));
  };

  return (
    <div className="space-y-8 p-6">
      {/* ─── Live provider status + env placeholders ───────────── */}
      <PaymentProvidersStatus />

      {/* ─── Payment Gateway ───────────────────────────────────── */}
      <Form {...gatewayForm}>
        <form
          onSubmit={gatewayForm.handleSubmit(onSaveGateway)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('paymentGateway')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={gatewayForm.control}
              name="provider"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('provider')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('providerHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Paystack">Paystack</SelectItem>
                        <SelectItem value="Flutterwave">
                          Flutterwave
                        </SelectItem>
                        <SelectItem value="Stripe">Stripe</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={gatewayForm.control}
              name="apiClientId"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('apiClientId')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('apiClientIdHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input  {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={gatewayForm.control}
              name="secretKey"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('secretKey')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('secretKeyHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input
                        
                        type="password"
                        {...field}
                        placeholder="••••••••••••••••"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={gatewayForm.control}
              name="enabled"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('paymentGatewayToggle')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('paymentGatewayToggleHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <span className="text-sm text-muted-foreground">
                        {t('enable')}
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />
          </div>

          <Button type="submit">{t('saveChanges')}</Button>
        </form>
      </Form>

      <Separator />

      {/* ─── Withdraw ──────────────────────────────────────────── */}
      <Form {...withdrawForm}>
        <form
          onSubmit={withdrawForm.handleSubmit(onSaveWithdraw)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">{t('withdraw')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={withdrawForm.control}
              name="method"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('method')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('methodHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Bank Transfer">
                          {t('bankTransfer')}
                        </SelectItem>
                        <SelectItem value="Mobile Money">
                          {t('mobileMoney')}
                        </SelectItem>
                        <SelectItem value="Crypto">{t('crypto')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={withdrawForm.control}
              name="minWithdraw"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('minWithdraw')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('minWithdrawHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input  {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={withdrawForm.control}
              name="maxWithdraw"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('maxWithdraw')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('maxWithdrawHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <FormControl>
                      <Input  {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={withdrawForm.control}
              name="autoApprove"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      {t('autoApprove')}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t('autoApproveHint')}
                    </FormDescription>
                  </div>
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <span className="text-sm text-muted-foreground">
                        {t('enable')}
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />
          </div>

          <Button type="submit">{t('saveChanges')}</Button>
        </form>
      </Form>
    </div>
  );
}

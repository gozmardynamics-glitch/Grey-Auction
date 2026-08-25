import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

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

export default function PaymentsSettings() {
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

  const onSaveGateway = (data: PaymentGatewayValues) => {
    
    toast.success('Payment gateway settings saved.');
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

  const onSaveWithdraw = (data: WithdrawValues) => {
    
    toast.success('Withdraw settings saved.');
  };

  return (
    <div className="space-y-8 p-6">
      {/* ─── Payment Gateway ───────────────────────────────────── */}
      <Form {...gatewayForm}>
        <form
          onSubmit={gatewayForm.handleSubmit(onSaveGateway)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Payment Gateway</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={gatewayForm.control}
              name="provider"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Provider
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the payment provider.
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
                      API Client ID
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Enter the unique identifier.
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
                      Secret Key
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Enter the key for authentication.
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
                      Payment Gateway
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Enable payment gateway for transactions.
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
                        Enable
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />
          </div>

          <Button type="submit">Save Changes</Button>
        </form>
      </Form>

      <Separator />

      {/* ─── Withdraw ──────────────────────────────────────────── */}
      <Form {...withdrawForm}>
        <form
          onSubmit={withdrawForm.handleSubmit(onSaveWithdraw)}
          className="space-y-6"
        >
          <h3 className="text-base font-semibold">Withdraw</h3>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
            <FormField
              control={withdrawForm.control}
              name="method"
              render={({ field }) => (
                <>
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Method
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify the withdrawal method.
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
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="Mobile Money">
                          Mobile Money
                        </SelectItem>
                        <SelectItem value="Crypto">Crypto</SelectItem>
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
                      Minimum Withdraw
                    </FormLabel>
                    <FormDescription className="text-xs">
                      The minimum amount of withdraw per transaction.
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
                      Maximum Withdraw
                    </FormLabel>
                    <FormDescription className="text-xs">
                      The maximum amount of withdraw per transaction.
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
                      Auto-approve Withdrawals
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Enable withdrawals to be approved by the system.
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
                        Enable
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />
          </div>

          <Button type="submit">Save Changes</Button>
        </form>
      </Form>
    </div>
  );
}

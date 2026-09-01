'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, CheckCircle2, Circle, AlertTriangle, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { REGEXP_ONLY_DIGITS } from 'input-otp';

import {
  ActionSuccessDialog,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/common';

import {
  buyerChangePasswordSchema,
  type BuyerChangePasswordValues,
} from '../../../models/schema';

const passwordRequirements = [
  { label: '8 characters', test: (v: string) => v.length >= 8 },
  { label: 'Lower case', test: (v: string) => /[a-z]/.test(v) },
  { label: 'Upper case', test: (v: string) => /[A-Z]/.test(v) },
  {
    label: 'Special character .→+@',
    test: (v: string) => /[^A-Za-z0-9]/.test(v),
  },
];

type PinStep = 'verify' | 'new-pin';
type DeleteStep = 'info' | 'reason' | 'verify';

export default function SettingsSecurity() {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successConfig, setSuccessConfig] = useState({
    title: '',
    message: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Delete account state
  const [deleteStep, setDeleteStep] = useState<DeleteStep>('info');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  // PIN modal state
  const [pinStep, setPinStep] = useState<PinStep>('verify');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  

  const form = useForm<BuyerChangePasswordValues>({
    resolver: zodResolver(buyerChangePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPasswordValue = useWatch({ control: form.control, name: 'newPassword' });

  // Sync confirmPassword with newPassword (no confirm field in UI)
  useEffect(() => {
    if (newPasswordValue) {
      form.setValue('confirmPassword', newPasswordValue);
    }
  }, [newPasswordValue, form]);

  const requirements = passwordRequirements.map((req) => ({
    ...req,
    met: req.test(newPasswordValue || ''),
  }));

  const onSubmitPassword = async (data: BuyerChangePasswordValues) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setPasswordModalOpen(false);
      form.reset();
      setShowNewPassword(false);
      setSuccessConfig({
        title: 'Password Changed Successfully',
        message: 'Your password has been updated successfully.',
      });
      setSuccessOpen(true);
    } catch (error) {
      console.error('Failed to change password:', error);
    }
  };

  const resetPinModal = () => {
    setPinStep('verify');
    setVerifyCode('');
    setVerifyError('');
    setNewPin('');
    setConfirmPin('');
    setPinError('');
  };

  const handleVerifyCode = () => {
    if (verifyCode.length !== 6) {
      setVerifyError('Invalid code');
      return;
    }
    toast.success('Verification successful');
    setVerifyError('');
    setPinStep('new-pin');
  };

  const handleChangePin = () => {
    if (newPin.length !== 4) {
      setPinError('Please enter a 4-digit PIN');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    toast.success('Withdrawal PIN has been updated successfully.');
    setPinModalOpen(false);
    resetPinModal();
  };

  const resetDeleteModal = () => {
    setDeleteStep('info');
    setDeleteReason('');
    setDeletePassword('');
    setShowDeletePassword(false);
  };

  const handleDeleteAccount = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/auth/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason, password: deletePassword }),
      });
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
    setDeleteModalOpen(false);
    resetDeleteModal();
  };

  return (
    <>
      <div className="divide-y">
        {/* Change Password Row */}
        <div className="flex items-center justify-between py-5 first:pt-0">
          <div>
            <h3 className="text-sm font-medium">Change Password</h3>
            <p className="text-sm text-muted-foreground">
              Update your account password to keep your account secure
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setPasswordModalOpen(true)}
          >
            Change Password
          </Button>
        </div>

        {/* Change Withdrawal PIN Row */}
        <div className="flex items-center justify-between py-5">
          <div>
            <h3 className="text-sm font-medium">Change Withdrawal PIN</h3>
            <p className="text-sm text-muted-foreground">
              Update your withdrawal PIN to authorize payouts
            </p>
          </div>
          <Button variant="outline" onClick={() => setPinModalOpen(true)}>
            Change PIN
          </Button>
        </div>

        {/* Delete Account Row */}
        <div className="flex items-center justify-between py-5">
          <div>
            <h3 className="text-sm font-medium text-destructive">
              Delete Account
            </h3>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Change Password Modal */}
      <Dialog
        open={passwordModalOpen}
        onOpenChange={(open) => {
          setPasswordModalOpen(open);
          if (!open) {
            form.reset();
            setShowNewPassword(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmitPassword)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Old Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password requirements checklist */}
              <ul className="space-y-1.5">
                {requirements.map((req) => (
                  <li
                    key={req.label}
                    className="flex items-center gap-2 text-sm"
                  >
                    {req.met ? (
                      <CheckCircle2 className="size-4 text-green-500" />
                    ) : (
                      <Circle className="size-4 text-muted-foreground" />
                    )}
                    <span
                      className={
                        req.met ? 'text-green-600' : 'text-muted-foreground'
                      }
                    >
                      {req.label}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-end pt-2">
                <Button type="submit">Change Password</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Change PIN Modal */}
      <Dialog
        open={pinModalOpen}
        onOpenChange={(open) => {
          setPinModalOpen(open);
          if (!open) resetPinModal();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change PIN</DialogTitle>
            <DialogDescription>
              {pinStep === 'verify'
                ? 'Enter the 6-digit code sent to jaydennicholas@gmail.com'
                : 'Enter a new 4-digit withdrawal PIN to continue.'}
            </DialogDescription>
          </DialogHeader>

          {pinStep === 'verify' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Code</label>
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={verifyCode}
                  onChange={(val) => {
                    setVerifyCode(val);
                    if (verifyError) setVerifyError('');
                  }}
                >
                  <InputOTPGroup className="gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className={verifyError ? 'border-destructive' : ''}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {verifyError && (
                  <p className="text-sm text-destructive">{verifyError}</p>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Didn&apos;t get code?{' '}
                <button
                  type="button"
                  className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  Resend
                </button>
              </p>

              <div className="flex justify-end">
                <Button onClick={handleVerifyCode}>Verify</Button>
              </div>
            </div>
          )}

          {pinStep === 'new-pin' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-2">
                <label className="text-sm font-medium">Enter New PIN</label>
                <InputOTP
                  maxLength={4}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={newPin}
                  onChange={(val) => {
                    setNewPin(val);
                    if (pinError) setPinError('');
                  }}
                >
                  <InputOTPGroup className="gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="flex flex-col items-center gap-2">
                <label className="text-sm font-medium">Confirm PIN</label>
                <InputOTP
                  maxLength={4}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={confirmPin}
                  onChange={(val) => {
                    setConfirmPin(val);
                    if (pinError) setPinError('');
                  }}
                >
                  <InputOTPGroup className="gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className={pinError ? 'border-destructive' : ''}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {pinError && (
                  <p className="text-sm text-destructive">{pinError}</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleChangePin}>Change PIN</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Account Modal — 3 steps */}
      <Dialog
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) resetDeleteModal();
        }}
      >
        <DialogContent className="sm:max-w-md">
          {/* Step 1: Info */}
          {deleteStep === 'info' && (
            <>
              <div className="flex items-start gap-2">
                <div className="relative">
                  <UserX className="size-8 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-semibold">
                  What happens when you delete your account:
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>All active listings will be closed</li>
                  <li>Pending transactions must be completed</li>
                  <li>Your account cannot be recovered once deleted</li>
                  <li>
                    Transaction records may be retained for legal and compliance
                    purposes
                  </li>
                </ul>

                <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>This action is permanent and cannot be undone.</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setDeleteStep('reason')}>
                  Continue
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Reason */}
          {deleteStep === 'reason' && (
            <>
              <DialogHeader>
                <DialogTitle>Delete Account</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Why are you deleting your account?
                  </label>
                  <Select value={deleteReason} onValueChange={setDeleteReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_longer_needed">
                        No longer needed
                      </SelectItem>
                      <SelectItem value="found_alternative">
                        Found a better alternative
                      </SelectItem>
                      <SelectItem value="privacy_concerns">
                        Privacy concerns
                      </SelectItem>
                      <SelectItem value="difficult_to_use">
                        Too difficult to use
                      </SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>This action is permanent and cannot be undone.</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setDeleteStep('verify')}>
                  Continue
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Password verification */}
          {deleteStep === 'verify' && (
            <>
              <DialogHeader>
                <DialogTitle>Verification</DialogTitle>
                <DialogDescription>
                  Enter password to delete account
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Input
                      type={showDeletePassword ? 'text' : 'password'}
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                    >
                      {showDeletePassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={!deletePassword}
                >
                  Delete Account
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <ActionSuccessDialog
        open={successOpen}
        onOpenChange={setSuccessOpen}
        variant="success"
        title={successConfig.title}
        message={successConfig.message}
      />
    </>
  );
}

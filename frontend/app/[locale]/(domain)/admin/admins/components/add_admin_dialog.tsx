'use client';

import { useState } from 'react';

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@/shared/components/common';
import { AdminRole } from '../../models';
import { ROLES } from '../../models/data';

interface AddAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    email: string;
    role: AdminRole;
    sendInviteEmail: boolean;
    isActive: boolean;
  }) => void;
}


export default function AddAdminDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddAdminDialogProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole | ''>('');
  const [sendInviteEmail, setSendInviteEmail] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const reset = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setRole('');
    setSendInviteEmail(false);
    setIsActive(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  const handleSubmit = () => {
    if (!role) return;
    onSubmit({ firstName, lastName, email, role, sendInviteEmail, isActive });
    handleOpenChange(false);
  };

  const isValid =
    firstName.trim() && lastName.trim() && email.trim() && role;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Add Admin
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* First Name */}
          <div className="space-y-2">
            <Label className="text-sm">First Name</Label>
            <Input
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label className="text-sm">Last Name</Label>
            <Input
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-sm">Email Address</Label>
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label className="text-sm">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as AdminRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Send Invite Email + Activate Admin */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={sendInviteEmail}
                onCheckedChange={(checked) =>
                  setSendInviteEmail(checked === true)
                }
              />
              <Label className="text-sm">Send Invite Email</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Activate Admin</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={!isValid} onClick={handleSubmit}>
              Add Admin
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

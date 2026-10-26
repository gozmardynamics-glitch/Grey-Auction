'use client';

import { useState } from 'react';

import {
  Button,
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
} from '@/shared/components/common';
import { AdminRole } from '../../models';
import { ROLES } from '../../models/data';

interface AddAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // POST admin/admins needs email + password + name; the form keeps the name
  // split in two fields and the action joins them.
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: AdminRole;
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
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRole | ''>('');

  const reset = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setRole('');
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  const handleSubmit = () => {
    if (!role) return;
    onSubmit({ firstName, lastName, email, password, role });
    handleOpenChange(false);
  };

  const isValid =
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    password.length >= 8 &&
    role;

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

          {/* Temporary password */}
          <div className="space-y-2">
            <Label className="text-sm">Temporary Password</Label>
            <Input
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

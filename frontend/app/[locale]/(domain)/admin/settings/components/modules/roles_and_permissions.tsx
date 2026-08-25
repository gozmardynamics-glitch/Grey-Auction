  'use client';

  import { useState } from 'react';
  import {
    Button,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/shared/components/common';
  import {
    Gavel,
    Users,
    Store,
    CreditCard,
    Newspaper,
    UserCog,
  } from 'lucide-react';

  // ─── Types ───────────────────────────────────────────────────────────
  interface Permission {
    feature: string;
    superAdmin: boolean;
    admin: boolean;
  }

  interface PermissionCategory {
    name: string;
    icon: React.ElementType;
    permissions: Permission[];
  }

  // ─── Default Data ────────────────────────────────────────────────────
  const defaultPermissions: PermissionCategory[] = [
    {
      name: 'Auctions',
      icon: Gavel,
      permissions: [
        { feature: 'View', superAdmin: true, admin: true },
        { feature: 'Approve / Reject', superAdmin: true, admin: true },
        { feature: 'Delete / Disable', superAdmin: true, admin: false },
      ],
    },
    {
      name: 'Bids',
      icon: Gavel,
      permissions: [
        { feature: 'View', superAdmin: true, admin: true },
        { feature: 'Monitor Live Bids', superAdmin: true, admin: true },
        { feature: 'Flag Suspicious Bids', superAdmin: true, admin: true },
      ],
    },
    {
      name: 'Sellers',
      icon: Store,
      permissions: [
        { feature: 'View', superAdmin: true, admin: true },
        {
          feature: 'Approve Seller Verification',
          superAdmin: true,
          admin: false,
        },
        { feature: 'Activate / Suspend', superAdmin: true, admin: true },
      ],
    },
    {
      name: 'Buyer',
      icon: Users,
      permissions: [
        { feature: 'View', superAdmin: true, admin: true },
        { feature: 'Activate / Suspend', superAdmin: true, admin: true },
      ],
    },
    {
      name: 'Payment',
      icon: CreditCard,
      permissions: [
        { feature: 'View Deposits', superAdmin: true, admin: true },
        { feature: 'Approve Withdrawals', superAdmin: true, admin: false },
        { feature: 'Export Payment Reports', superAdmin: true, admin: true },
      ],
    },
    {
      name: 'CMS',
      icon: Newspaper,
      permissions: [
        { feature: 'Manage Banners', superAdmin: true, admin: true },
        { feature: 'Manage FAQs', superAdmin: true, admin: true },
      ],
    },
    {
      name: 'Admin Management',
      icon: UserCog,
      permissions: [
        { feature: 'Create / Edit', superAdmin: true, admin: false },
        { feature: 'Assign Roles', superAdmin: true, admin: false },
        { feature: 'Activate / Suspend', superAdmin: true, admin: false },
      ],
    },
  ];

  export default function RolesPermissionSettings() {
    const [categories, setCategories] =
      useState<PermissionCategory[]>(defaultPermissions);

    const togglePermission = (
      catIndex: number,
      permIndex: number,
      role: 'superAdmin' | 'admin'
    ) => {
      setCategories((prev) => {
        const updated = [...prev];
        const cat = { ...updated[catIndex] };
        const perms = [...cat.permissions];
        perms[permIndex] = {
          ...perms[permIndex],
          [role]: !perms[permIndex][role],
        };
        cat.permissions = perms;
        updated[catIndex] = cat;
        return updated;
      });
    };

    const handleSave = () => {
      
    };

    return (
      <div className="space-y-6 p-3 sm:p-6">
        <div className="rounded-md border">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Features</TableHead>
                <TableHead className="w-[80px] sm:w-[120px] text-center px-1 sm:px-4">
                  <span className="hidden sm:inline">Super Admin</span>
                  <span className="sm:hidden">Super</span>
                </TableHead>
                <TableHead className="w-[60px] sm:w-[100px] text-center px-1 sm:px-4">Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category, catIndex) => {
                const Icon = category.icon;
                return (
                  <>
                    {/* Category header row */}
                    <TableRow
                      key={`cat-${catIndex}`}
                      className="bg-muted/40 hover:bg-muted/40"
                    >
                      <TableCell colSpan={3}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold">
                            {category.name}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Permission rows */}
                    {category.permissions.map((perm, permIndex) => (
                      <TableRow key={`perm-${catIndex}-${permIndex}`}>
                        <TableCell className="pl-6 sm:pl-10 text-sm">
                          {perm.feature}
                        </TableCell>
                        <TableCell className="text-center px-1 sm:px-4">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={perm.superAdmin}
                              onCheckedChange={() =>
                                togglePermission(
                                  catIndex,
                                  permIndex,
                                  'superAdmin'
                                )
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center px-1 sm:px-4">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={perm.admin}
                              onCheckedChange={() =>
                                togglePermission(catIndex, permIndex, 'admin')
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    );
  }

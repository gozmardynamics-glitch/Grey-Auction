'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  featureKey: string;
  superAdmin: boolean;
  admin: boolean;
}

interface PermissionCategory {
  nameKey: string;
  icon: React.ElementType;
  permissions: Permission[];
}

// ─── Default Data ────────────────────────────────────────────────────
const defaultPermissions: PermissionCategory[] = [
  {
    nameKey: 'categoryAuctions',
    icon: Gavel,
    permissions: [
      { featureKey: 'featureView', superAdmin: true, admin: true },
      { featureKey: 'featureApproveReject', superAdmin: true, admin: true },
      { featureKey: 'featureDeleteDisable', superAdmin: true, admin: false },
    ],
  },
  {
    nameKey: 'categoryBids',
    icon: Gavel,
    permissions: [
      { featureKey: 'featureView', superAdmin: true, admin: true },
      { featureKey: 'featureMonitorLiveBids', superAdmin: true, admin: true },
      { featureKey: 'featureFlagSuspiciousBids', superAdmin: true, admin: true },
    ],
  },
  {
    nameKey: 'categorySellers',
    icon: Store,
    permissions: [
      { featureKey: 'featureView', superAdmin: true, admin: true },
      {
        featureKey: 'featureApproveSellerVerification',
        superAdmin: true,
        admin: false,
      },
      { featureKey: 'featureActivateSuspend', superAdmin: true, admin: true },
    ],
  },
  {
    nameKey: 'categoryBuyer',
    icon: Users,
    permissions: [
      { featureKey: 'featureView', superAdmin: true, admin: true },
      { featureKey: 'featureActivateSuspend', superAdmin: true, admin: true },
    ],
  },
  {
    nameKey: 'categoryPayment',
    icon: CreditCard,
    permissions: [
      { featureKey: 'featureViewDeposits', superAdmin: true, admin: true },
      { featureKey: 'featureApproveWithdrawals', superAdmin: true, admin: false },
      { featureKey: 'featureExportPaymentReports', superAdmin: true, admin: true },
    ],
  },
  {
    nameKey: 'categoryCms',
    icon: Newspaper,
    permissions: [
      { featureKey: 'featureManageBanners', superAdmin: true, admin: true },
      { featureKey: 'featureManageFaqs', superAdmin: true, admin: true },
    ],
  },
  {
    nameKey: 'categoryAdminManagement',
    icon: UserCog,
    permissions: [
      { featureKey: 'featureCreateEdit', superAdmin: true, admin: false },
      { featureKey: 'featureAssignRoles', superAdmin: true, admin: false },
      { featureKey: 'featureActivateSuspend', superAdmin: true, admin: false },
    ],
  },
];

export default function RolesPermissionSettings() {
  const t = useTranslations('admin.settings.roles');
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
              <TableHead>{t('features')}</TableHead>
              <TableHead className="w-[80px] sm:w-[120px] text-center px-1 sm:px-4">
                <span className="hidden sm:inline">{t('superAdmin')}</span>
                <span className="sm:hidden">{t('superAdminShort')}</span>
              </TableHead>
              <TableHead className="w-[60px] sm:w-[100px] text-center px-1 sm:px-4">{t('admin')}</TableHead>
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
                          {t(category.nameKey)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Permission rows */}
                  {category.permissions.map((perm, permIndex) => (
                    <TableRow key={`perm-${catIndex}-${permIndex}`}>
                      <TableCell className="pl-6 sm:pl-10 text-sm">
                        {t(perm.featureKey)}
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

      <Button onClick={handleSave}>{t('saveChanges')}</Button>
    </div>
  );
}

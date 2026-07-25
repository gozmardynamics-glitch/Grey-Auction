export interface PermissionItem {
  feature: string;
  enabled: boolean;
}

export interface PermissionCategory {
  name: string;
  permissions: PermissionItem[];
}

export const ADMIN_PERMISSIONS: PermissionCategory[] = [
  {
    name: 'Auctions',
    permissions: [
      { feature: 'View', enabled: true },
      { feature: 'Approve / Reject', enabled: true },
      { feature: 'Delete / Disable', enabled: true },
    ],
  },
  {
    name: 'Bids',
    permissions: [
      { feature: 'View', enabled: true },
      { feature: 'Monitor Live Bids', enabled: true },
      { feature: 'Flag Suspicious Bids', enabled: true },
    ],
  },
  {
    name: 'Sellers',
    permissions: [
      { feature: 'View', enabled: true },
      { feature: 'Approve Seller Verification', enabled: true },
      { feature: 'Activate / Suspend', enabled: true },
    ],
  },
  {
    name: 'Buyer',
    permissions: [
      { feature: 'View', enabled: true },
      { feature: 'Activate / Suspend', enabled: true },
    ],
  },
  {
    name: 'Payment',
    permissions: [
      { feature: 'View Deposits', enabled: true },
      { feature: 'Approve Withdrawals', enabled: true },
      { feature: 'Export Payment Reports', enabled: true },
    ],
  },
  {
    name: 'CMS',
    permissions: [
      { feature: 'Manage Banners', enabled: true },
      { feature: 'Manage FAQs', enabled: true },
    ],
  },
  {
    name: 'Admin Management',
    permissions: [
      { feature: 'Create / Edit', enabled: true },
      { feature: 'Assign Roles', enabled: true },
      { feature: 'Activate / Suspend', enabled: true },
    ],
  },
];

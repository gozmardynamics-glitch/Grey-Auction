'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
} from '@/shared/components/common';
import { FileText } from 'lucide-react';

import { columns, type ListedAuctions } from './listed_auctions_column';

interface ListedAuctionsProps {
  data?: ListedAuctions[];
}

export default function ListedAuctionsComponent({ data = [] }: ListedAuctionsProps) {
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Listed Auctions</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data}
          pagination={false}
          emptyIcon={<FileText className="h-8 w-8" />}
          emptyTitle="No pending actions"
          emptyDescription="New requests will appear here when action is required."
        />
      </CardContent>
    </Card>
  );
}

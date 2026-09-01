import { ListFilter, FileText } from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  EmptyState,
} from '@/shared/components/common';

import { columns, type PendingRequest } from './Pending_requests_column';

interface PendingRequestsProps {
  data?: PendingRequest[];
}

export default function PendingRequests({ data = [] }: PendingRequestsProps) {
  return (
    <Card className=''>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">
          Pending Requests
        </CardTitle>
        <Button variant="outline" size="sm" className="gap-2">
          <ListFilter className="h-4 w-4" />
          Sort
        </Button>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title="No pending actions"
            description="New requests will appear here when action is required."
            className="py-12"
          />
        ) : (
          <DataTable
            columns={columns}
            data={data}
            pagination={false}
            showToolbar={false}
          />
        )}
      </CardContent>
    </Card>
  );
}
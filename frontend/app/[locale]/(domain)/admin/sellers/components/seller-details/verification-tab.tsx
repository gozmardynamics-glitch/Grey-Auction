'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { FileText } from 'lucide-react';

import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/common';
import { UploadedDocument } from '../../../models';
import { statusStyles } from '@/shared/utils/helpers';
import { DocumentPreviewModal } from './document-preview-modal';

export function VerificationTab({
  documents,
}: {
  documents: UploadedDocument[];
}) {
  const [selectedDoc, setSelectedDoc] = useState<UploadedDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const t = useTranslations('admin.sellers.verificationTab');

  const handleOpenPreview = (doc: UploadedDocument) => {
    setSelectedDoc(doc);
    setPreviewOpen(true);
  };

  if (!documents || documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        {t('empty')}
      </p>
    );
  }
  return (
    <>
      <div className="space-y-3">
        <h3 className="text-sm font-black text-primary underline">
          {t('uploadedDocuments')}
        </h3>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader className="bg-card">
              <TableRow>
                <TableHead className="text-xs">{t('file')}</TableHead>
                <TableHead className="text-xs">{t('date')}</TableHead>
                <TableHead className="text-xs">{t('status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-xs font-medium">
                        {doc.fileName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {doc.date}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusStyles[doc.status] || ''}`}
                      >
                        {doc.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {doc.status === 'Pending' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleOpenPreview(doc)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleOpenPreview(doc)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <DocumentPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        document={selectedDoc}
      />
    </>
  );
}

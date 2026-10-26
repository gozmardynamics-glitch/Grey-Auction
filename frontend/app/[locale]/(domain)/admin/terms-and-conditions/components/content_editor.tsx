'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Input,
  Label,
  Textarea,
} from '@/shared/components/common';
import { apiFetch, ApiError } from '@/shared/utils/api-client';

interface ContentEditorProps {
  /** Content-page slug served by GET/PUT content/:slug. */
  slug: string;
  /** Page heading, and the fallback content title. */
  title: string;
  placeholder?: string;
}

interface ContentPage {
  title?: string | null;
  content?: string | null;
}

export default function ContentEditor({
  slug,
  title,
  placeholder = 'Enter content...',
}: ContentEditorProps) {
  const [pageTitle, setPageTitle] = useState(title);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await apiFetch<{ data?: ContentPage | null }>(
          `content/${slug}`,
        );
        if (cancelled) return;
        const page = response?.data ?? null;
        if (page) {
          setPageTitle(page.title?.trim() || title);
          setContent(page.content ?? '');
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError
            ? err.message
            : 'Could not load the saved content',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, title]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // UpsertContentPageDto takes title/content/isActive/meta*; nothing else.
      await apiFetch(`content/${slug}`, {
        method: 'PUT',
        body: { title: pageTitle.trim() || title, content },
      });
      toast.success(`${title} saved`);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : `Could not save ${title}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>

      {loadError && (
        <p className="text-sm text-destructive">
          {loadError} — saving will replace the stored page.
        </p>
      )}

      <div className="space-y-2">
        <Label className="text-sm">Page title</Label>
        <Input
          value={pageTitle}
          disabled={loading}
          onChange={(e) => setPageTitle(e.target.value)}
          placeholder={title}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Content</Label>
        <Textarea
          value={content}
          disabled={loading}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="min-h-[400px]"
        />
      </div>

      <Button onClick={handleSave} disabled={loading || isSaving}>
        {isSaving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}

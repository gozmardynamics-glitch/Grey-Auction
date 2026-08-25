'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/common/button';
import { Textarea } from '@/shared/components/common/textarea';

interface ContentEditorProps {
  title: string;
  placeholder?: string;
  initialContent?: string;
  onSave?: (content: string) => void;
}

export default function ContentEditor({
  title,
  placeholder = 'Enter content...',
  initialContent = '',
  onSave,
}: ContentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    
    if (onSave) {
      onSave(content);
    }
    setTimeout(() => setIsSaving(false), 500);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="min-h-[400px]"
      />
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}

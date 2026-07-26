import ContentEditor from './components/content_editor';

export default function TermsAndConditionsPage() {
  const handleSave = async (content: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/content/terms-and-conditions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageContent: content }),
      });
      console.log('Terms & Conditions saved to API.');
    } catch (error) {
      console.error('Failed to save terms & conditions:', error);
    }
  };

  return (
    <ContentEditor
      title="Terms & Conditions"
      placeholder="Enter terms and conditions content..."
      onSave={handleSave}
    />
  );
}

import ContentEditor from './components/content_editor';

export default function PrivacyPolicyPage() {
  const handleSave = async (content: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/content/privacy-policy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageContent: content }),
      });
      
    } catch (error) {
      console.error('Failed to save privacy policy:', error);
    }
  };

  return (
    <ContentEditor
      title="Privacy Policy"
      placeholder="Enter privacy policy content..."
      onSave={handleSave}
    />
  );
}

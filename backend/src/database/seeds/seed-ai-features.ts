const FEATURE_SEEDS = [
  { featureKey: 'auction_description_generator', section: 'seller', displayName: 'Auction Description Generator', description: 'Generates compelling auction descriptions from product specs', quality: 'premium' },
  { featureKey: 'image_captioning', section: 'seller', displayName: 'Image Captioning', description: 'Generates alt text and captions for auction images', quality: 'standard' },
  { featureKey: 'image_auto_tagging', section: 'system', displayName: 'Image Auto-Tagging', description: 'Automatically tags uploaded images with relevant keywords', quality: 'draft' },
  { featureKey: 'pricing_recommendation', section: 'seller', displayName: 'Pricing Recommendation', description: 'Recommends optimal starting prices based on market data', quality: 'standard' },
  { featureKey: 'smart_search', section: 'public', displayName: 'Smart Search', description: 'AI-powered semantic search for better auction discovery', quality: 'standard' },
  { featureKey: 'chatbot_assistant', section: 'public', displayName: 'Chatbot Assistant', description: 'Floating AI chatbot for customer support and guidance', quality: 'standard' },
  { featureKey: 'personalized_recommendations', section: 'buyer', displayName: 'Personalized Recommendations', description: 'Recommends auctions based on user behavior and preferences', quality: 'standard' },
  { featureKey: 'content_moderation', section: 'system', displayName: 'Content Moderation', description: 'Automatically screens listings for policy violations', quality: 'standard' },
  { featureKey: 'fraud_detection', section: 'system', displayName: 'Fraud Detection', description: 'Identifies suspicious bidding patterns and listings', quality: 'premium' },
  { featureKey: 'document_ocr', section: 'admin', displayName: 'Document OCR', description: 'Extracts text from uploaded documents for verification', quality: 'standard' },
  { featureKey: 'email_campaign_generator', section: 'admin', displayName: 'Email Campaign Generator', description: 'Generates marketing email content for promotions', quality: 'standard' },
  { featureKey: 'title_optimizer', section: 'seller', displayName: 'Title Optimizer', description: 'Optimizes auction titles for better visibility', quality: 'draft' },
  { featureKey: 'translation', section: 'system', displayName: 'Translation', description: 'Translates auction content to multiple languages', quality: 'standard' },
  { featureKey: 'bid_prediction', section: 'buyer', displayName: 'Bid Prediction', description: 'Predicts final auction prices based on historical data', quality: 'premium' },
  { featureKey: 'dynamic_pricing', section: 'admin', displayName: 'Dynamic Pricing', description: 'Adjusts reserve prices based on market conditions', quality: 'premium' },
  { featureKey: 'listing_quality_score', section: 'seller', displayName: 'Listing Quality Score', description: 'Scores listing completeness and quality', quality: 'draft' },
  { featureKey: 'category_suggestion', section: 'seller', displayName: 'Category Suggestion', description: 'Suggests optimal categories for new listings', quality: 'draft' },
];

async function seedFeatureConfigs() {
  try {
    const resp = await fetch(`${process.env.API_URL || 'http://localhost:3001/api'}/admin/ai/features`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await resp.json();
    const existing = json?.data || [];

    if (existing.length >= FEATURE_SEEDS.length) {
      console.log('Feature configs already seeded.');
      return;
    }

    const existingKeys = new Set(existing.map((f: any) => f.featureKey));

    for (const feature of FEATURE_SEEDS) {
      if (!existingKeys.has(feature.featureKey)) {
        await fetch(`${process.env.API_URL || 'http://localhost:3001/api'}/admin/ai/features`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...feature,
            isEnabled: false,
            temperature: 0.7,
            maxTokens: 2048,
            rateLimitPerMinute: 10,
            rateLimitPerDay: 1000,
          }),
        });
        console.log(`Seeded feature: ${feature.featureKey}`);
      }
    }
    console.log('Feature config seeding complete.');
  } catch (err) {
    console.error('Failed to seed feature configs:', err);
  }
}

seedFeatureConfigs();

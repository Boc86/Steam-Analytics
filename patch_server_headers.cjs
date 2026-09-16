const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newEndpoints = `
// 1e. Global Top Sellers
app.get('/api/steam/topsellers', async (req, res) => {
  try {
    const apiKey = process.env.GAMES_POPULARITY_API_KEY || 'fd36bac7-fb7d-4b1c-86ab-6be618add21f';
    const gpRes = await fetch(\`https://games-popularity.com/swagger/api/top-sellers\`, {
      headers: { 'ApiKey': apiKey }
    });
    if (!gpRes.ok) return res.status(500).json({ success: false, error: 'Failed to fetch' });
    const gpData = await gpRes.json();
    res.json({ success: true, items: gpData.data || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 1f. Global Top Wishlist
app.get('/api/steam/topwishlist', async (req, res) => {
  try {
    const apiKey = process.env.GAMES_POPULARITY_API_KEY || 'fd36bac7-fb7d-4b1c-86ab-6be618add21f';
    const gpRes = await fetch(\`https://games-popularity.com/swagger/api/top-wishlist\`, {
      headers: { 'ApiKey': apiKey }
    });
    if (!gpRes.ok) return res.status(500).json({ success: false, error: 'Failed to fetch' });
    const gpData = await gpRes.json();
    res.json({ success: true, items: gpData.data || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
`;

code = code.replace(
  /\/\/ 1e\. Global Top Sellers[\s\S]*?\/\/ 1d\. Regional Pricing Matrix API/,
  newEndpoints + "\n\n// 1d. Regional Pricing Matrix API"
);

fs.writeFileSync('server.ts', code);

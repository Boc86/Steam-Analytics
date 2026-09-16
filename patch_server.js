const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regionalEndpoint = `
// 1d. Regional Pricing Matrix API
app.get('/api/steam/game/:appid/regional-prices', async (req, res) => {
  try {
    const appId = parseInt(req.params.appid, 10);
    if (!appId) return res.status(400).json({ success: false, error: 'Invalid AppID' });
    
    // Key regions to track
    const regions = [
      { code: 'US', currency: 'USD', name: 'United States' },
      { code: 'GB', currency: 'GBP', name: 'United Kingdom' },
      { code: 'EU', currency: 'EUR', name: 'European Union' },
      { code: 'CN', currency: 'CNY', name: 'China' },
      { code: 'JP', currency: 'JPY', name: 'Japan' },
      { code: 'BR', currency: 'BRL', name: 'Brazil' },
      { code: 'TR', currency: 'TRY', name: 'Turkey' },
      { code: 'AR', currency: 'ARS', name: 'Argentina' },
      { code: 'IN', currency: 'INR', name: 'India' },
      { code: 'RU', currency: 'RUB', name: 'Russia' },
    ];
    
    const cacheKey = \`game_regional_prices_\${appId}\`;
    const cached = getCached(cacheKey);
    // if (cached) return res.json({ success: true, prices: cached }); // Disabled cache for testing

    const promises = regions.map(async (r) => {
      try {
        const fetchRes = await fetch(\`https://store.steampowered.com/api/appdetails?appids=\${appId}&cc=\${r.code}&filters=price_overview\`);
        if (!fetchRes.ok) return null;
        const data = await fetchRes.json();
        const overview = data[appId]?.data?.price_overview;
        if (overview) {
          return {
            region: r.name,
            currencyCode: overview.currency,
            priceFormatted: overview.final_formatted,
            priceRaw: overview.final / 100
          };
        }
      } catch (e) {}
      return null;
    });

    const results = (await Promise.all(promises)).filter(Boolean);
    // setCached(cacheKey, results, 3600000);
    res.json({ success: true, prices: results });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
`;

code = code.replace(
  "// 1c. Universal Live Steam App Details & Telemetry API",
  regionalEndpoint + "\n\n// 1c. Universal Live Steam App Details & Telemetry API"
);

fs.writeFileSync('server.ts', code);

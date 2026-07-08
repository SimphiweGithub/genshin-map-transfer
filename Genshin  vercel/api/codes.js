module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Fetch active Genshin codes from the community hoyo-codes API
    const response = await fetch('https://hoyo-codes.seria.moe/codes?game=genshin');

    if (!response.ok) {
      return res.status(502).json({
        error: 'Failed to fetch codes from upstream',
        status: response.status
      });
    }

    const data = await response.json();

    // Filter only active (OK status) codes and transform into our app format
    const activeCodes = (data.codes || [])
      .filter(c => c.status === 'OK')
      .map(c => ({
        code: c.code,
        reward: formatRewardString(c.rewards),
        redeemed: false
      }));

    // Cache for 30 minutes at the CDN level
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

    return res.status(200).json({
      codes: activeCodes,
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Codes proxy error:', error);
    return res.status(500).json({
      error: `Failed to fetch active codes: ${error.message}`
    });
  }
};

// Transform reward string from API format to human-readable
// Input:  "Primogem*60;Adventurer's Experience*5"
// Output: "60 Primogems, 5 Adventurer's Experience"
function formatRewardString(rewardsStr) {
  if (!rewardsStr) return 'Unknown Rewards';
  
  return rewardsStr.split(';').map(part => {
    const [item, qty] = part.split('*');
    if (!item || !qty) return part;
    
    // Pluralize common items
    const trimmedItem = item.trim();
    const num = parseInt(qty);
    
    // Format: "60 Primogems" instead of "Primogem*60"
    let displayName = trimmedItem;
    if (trimmedItem === 'Primogem' && num > 1) displayName = 'Primogems';
    
    return `${num.toLocaleString()} ${displayName}`;
  }).join(', ');
}

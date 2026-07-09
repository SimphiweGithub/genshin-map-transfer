const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const OUTPUT_FILE = path.join(__dirname, '../metaData.json');

// Weights for aggregation
const TIER_WEIGHTS = {
  'S+': 10,
  'S': 7,
  'A': 4
};

async function scrapeIcyVeins() {
  try {
    console.log("Fetching from icy-veins.com/genshin-impact/tier-list...");
    const res = await axios.get('https://www.icy-veins.com/genshin-impact/tier-list', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    
    const $ = cheerio.load(res.data);
    const rolesData = { "Main DPS": [], "Sub DPS": [], "Support": [] };
    const table = $('.tier-list').first();
    
    table.find('tr').each((i, tr) => {
        if (i === 0) return; // skip header
        
        const tier = $(tr).find('td, th').eq(0).text().trim();
        if (!['S', 'A', 'B'].includes(tier) && tier !== 'S+') return;
        
        let score = TIER_WEIGHTS[tier] || 2;
        if (tier === 'S') score = 10;
        if (tier === 'A') score = 7;
        
        const extractChars = (colIndex, role) => {
            const charLinks = $(tr).find('td').eq(colIndex).find('a span.text-name, a span');
            let names = charLinks.map((_, el) => $(el).text().trim()).get();
            if (names.length === 0) {
               names = $(tr).find('td').eq(colIndex).find('a').map((_, el) => $(el).text().trim()).get();
            }
            names = names.filter(n => n.length > 0);
            names.forEach(name => {
                rolesData[role].push({ name, tier: tier === 'S' ? 'S+' : (tier === 'A' ? 'S' : 'A'), score });
            });
        };
        
        extractChars(1, "Main DPS");
        extractChars(2, "Sub DPS");
        extractChars(3, "Support");
    });
    return rolesData;
  } catch (err) {
    console.warn('[Scraper] icy-veins fetch failed:', err.message);
    return null;
  }
}

async function scrapeGameWith() {
  // Scrapes individual character tiers from genshin.gg
  try {
    console.log("Fetching from genshin.gg/tier-list...");
    const res = await axios.get('https://genshin.gg/tier-list/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    
    const $ = cheerio.load(res.data);
    const rolesData = { "Main DPS": [], "Sub DPS": [], "Support": [] };

    $('.dropzone-row').each((i, row) => {
        const tier = $(row).find('.dropzone-title').text().trim();
        // Only grab S+, S, A tiers
        if (!['S', 'A', 'B'].includes(tier) && tier !== 'S+') return;
        
        let score = TIER_WEIGHTS[tier] || 2;
        if (tier === 'S') score = 10;
        if (tier === 'A') score = 7;
        if (tier === 'B') score = 4;

        // The second child contains the portraits
        const portraitsContainer = $(row).children().eq(1);
        if (!portraitsContainer) return;

        // Inside portraitsContainer, each child is a character
        portraitsContainer.children().each((j, charEl) => {
            const name = $(charEl).find('h2').text().trim();
            let roleStr = $(charEl).find('.tierlist-role').text().trim();
            
            if (!name || !roleStr) return;
            
            // Map role
            let category = "Support";
            if (roleStr.includes("Main DPS") || roleStr === "DPS") category = "Main DPS";
            if (roleStr.includes("Sub DPS")) category = "Sub DPS";

            rolesData[category].push({
                name,
                tier: tier === 'S' ? 'S+' : (tier === 'A' ? 'S' : 'A'), // shift up slightly for display
                score: score
            });
        });
    });

    // Deduplicate and sort
    for (const role in rolesData) {
        rolesData[role].sort((a, b) => b.score - a.score);
    }
    
    return rolesData;
  } catch (err) {
    console.warn('[Scraper] genshin.gg fetch failed:', err.message);
    return null;
  }
}

async function aggregateData() {
  console.log('Aggregating Genshin Impact Meta Data...');
  
  let ggData = await scrapeGameWith();
  let ivData = await scrapeIcyVeins();

  let rolesData = { "Main DPS": [], "Sub DPS": [], "Support": [] };
  
  // Merge logic
  const mergeRole = (roleCategory) => {
      const charMap = {};
      
      const processSource = (sourceData) => {
          if (!sourceData) return;
          sourceData[roleCategory].forEach(c => {
              // Normalize names
              let n = c.name;
              if (n === 'Kamisato Ayaka') n = 'Ayaka';
              if (n === 'Kamisato Ayato') n = 'Ayato';
              if (n === 'Sangonomiya Kokomi') n = 'Kokomi';
              if (n === 'Arataki Itto') n = 'Itto';
              if (n === 'Kaedehara Kazuha') n = 'Kazuha';
              if (n === 'Yae Miko') n = 'Yae';
              
              if (!charMap[n]) {
                  charMap[n] = { name: n, tier: c.tier, score: 0 };
              }
              charMap[n].score += c.score;
              // Keep the highest tier
              if (c.tier === 'S+' && charMap[n].tier !== 'S+') charMap[n].tier = 'S+';
              else if (c.tier === 'S' && charMap[n].tier === 'A') charMap[n].tier = 'S';
          });
      };
      
      processSource(ggData);
      processSource(ivData);
      
      rolesData[roleCategory] = Object.values(charMap).sort((a, b) => b.score - a.score);
  };
  
  mergeRole("Main DPS");
  mergeRole("Sub DPS");
  mergeRole("Support");

  // If scraping fails, provide a strong fallback
  if (!rolesData || rolesData["Main DPS"].length === 0) {
      console.log("Using fallback role data...");
      rolesData = {
          "Main DPS": [
            { name: "Neuvillette", tier: "S+", score: 20 },
            { name: "Arlecchino", tier: "S+", score: 19 },
            { name: "Alhaitham", tier: "S+", score: 18 },
            { name: "Navia", tier: "S", score: 15 },
            { name: "Hu Tao", tier: "S", score: 14 }
          ],
          "Sub DPS": [
            { name: "Furina", tier: "S+", score: 20 },
            { name: "Yelan", tier: "S+", score: 19 },
            { name: "Xingqiu", tier: "S+", score: 18 }
          ],
          "Support": [
            { name: "Kaedehara Kazuha", tier: "S+", score: 20 },
            { name: "Zhongli", tier: "S+", score: 18 },
            { name: "Bennett", tier: "S+", score: 19 }
          ]
      };
  }

  // Unified Output Structure
  const aggregatedMeta = {
    lastUpdated: new Date().toISOString(),
    teams: [
      {
        id: "neuv_hyper",
        name: "Neuvillette Hypercarry",
        tier: "S+",
        score: 20,
        core: ["Neuvillette", "Furina", "Kaedehara Kazuha"],
        flex: ["Baizhu", "Zhongli", "Charlotte"]
      },
      {
        id: "arle_vape",
        name: "Arlecchino Vape",
        tier: "S+",
        score: 19,
        core: ["Arlecchino", "Yelan", "Bennett"],
        flex: ["Zhongli", "Kaedehara Kazuha", "Xingqiu"]
      },
      {
        id: "navia_plunge",
        name: "Navia Plunge",
        tier: "S+",
        score: 18,
        core: ["Navia", "Xianyun", "Furina"],
        flex: ["Zhongli", "Chiori", "Albedo"]
      },
      {
        id: "alhaitham_quickbloom",
        name: "Alhaitham Quickbloom",
        tier: "S",
        score: 16,
        core: ["Alhaitham", "Nahida", "Kuki Shinobu"],
        flex: ["Yelan", "Xingqiu", "Furina"]
      },
      {
        id: "nilou_bloom",
        name: "Nilou Bloom",
        tier: "S",
        score: 15,
        core: ["Nilou", "Nahida", "Sangonomiya Kokomi"],
        flex: ["Baizhu", "Collei", "Dendro Traveler"]
      },
      {
        id: "hutao_vape",
        name: "Hu Tao Double Hydro",
        tier: "S",
        score: 14,
        core: ["Hu Tao", "Yelan", "Xingqiu"],
        flex: ["Zhongli", "Xiangling", "Thoma"]
      },
      {
        id: "kinich_burgeon",
        name: "Kinich Burgeon",
        tier: "S",
        score: 14,
        core: ["Kinich", "Emilie", "Bennett"],
        flex: ["Thoma", "Dehya", "Xiangling"]
      },
      {
        id: "mualani_vape",
        name: "Mualani Vape",
        tier: "S",
        score: 14,
        core: ["Mualani", "Emilie", "Xiangling"],
        flex: ["Kachina", "Zhongli", "Sucrose"]
      },
      {
        id: "raiden_hyper",
        name: "Raiden Hypercarry",
        tier: "A",
        score: 10,
        core: ["Raiden Shogun", "Kujou Sara", "Kaedehara Kazuha", "Bennett"],
        flex: ["Chevreuse"]
      },
      {
        id: "raiden_national",
        name: "Raiden National",
        tier: "A",
        score: 8,
        core: ["Raiden Shogun", "Xiangling", "Xingqiu", "Bennett"],
        flex: []
      }
    ],
    roles: rolesData
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(aggregatedMeta, null, 2));
  console.log(`Successfully generated ${OUTPUT_FILE}`);
}

aggregateData().catch(err => {
  console.error('Aggregation failed:', err);
  process.exit(1);
});

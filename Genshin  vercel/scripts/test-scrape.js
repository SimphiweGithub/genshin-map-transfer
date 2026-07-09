const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://genshin.gg/tier-list/').then(r => {
    const $ = cheerio.load(r.data);
    
    // Find the first character
    const char = $('.character-portrait').first();
    console.log("Image source:", char.find('.character-icon').attr('src'));
    console.log("Character name:", char.closest('.tierlist-row, .dropzone-row').find('h2').text() || char.parent().find('h2').text());
}).catch(console.error);
    table.find('tr').each((i, tr) => {
        if (i === 0) {
           console.log("Headers:", $(tr).find('th').map((_, th) => $(th).text().trim()).get());
           return;
        }
        
        // Tier label is the first cell
        const tierLabel = $(tr).find('td, th').eq(0).text().trim();
        
        console.log(`Row ${i} Tier: ${tierLabel}`);
        
        // Col 1 (Main DPS)
        const mainDps = $(tr).find('td').eq(1).find('.name').map((_, el) => $(el).text().trim()).get();
        if (mainDps.length === 0) {
            // fallback, maybe it's just in a tags
             const links = $(tr).find('td').eq(1).find('a').map((_, el) => $(el).text().trim()).get();
             console.log("  Main DPS:", links.filter(n => n.length > 0).join(', '));
        } else {
             console.log("  Main DPS:", mainDps.join(', '));
        }
    });
}).catch(e => console.error(e.message));

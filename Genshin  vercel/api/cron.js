const crypto = require('crypto');

function generateDS(salt = '6s25p5ox5y14umn1p61aqyyvbvvl3lrt') {
  const t = Math.floor(Date.now() / 1000);
  const r = Math.random().toString(36).substring(2, 8);
  const sign = crypto.createHash('md5').update(`salt=${salt}&t=${t}&r=${r}`).digest('hex');
  return `${t},${r},${sign}`;
}

async function loadConfig() {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return null;

  const r = await fetch(kvUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kvToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(['GET', 'teyvat_config'])
  });
  const data = await r.json();
  if (!data.result) return null;
  try {
    return JSON.parse(data.result);
  } catch (_) {
    return null;
  }
}

function makeHoyoFetcher(ltoken, ltuid) {
  return async (url, extraHeaders = {}) => {
    const headers = {
      'Cookie': `ltoken_v2=${ltoken}; ltuid_v2=${ltuid}; ltoken=${ltoken}; ltuid=${ltuid};`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://act.hoyolab.com/',
      'x-rpc-app_version': '2.34.1',
      'x-rpc-client_type': '4',
      'DS': generateDS(),
      ...extraHeaders
    };
    const r = await fetch(url, { headers });
    return r.json();
  };
}

async function discord(webhookUrl, embeds) {
  if (!webhookUrl || !embeds.length) return;
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'Teyvat Chrono', embeds })
  });
}

module.exports = async (req, res) => {
  const authHeader = req.headers['authorization'];
  // Fail closed: if CRON_SECRET is not configured, block all access
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const config = await loadConfig();
  if (!config || !config.uid || !config.ltoken || !config.ltuid) {
    return res.status(400).json({
      error: 'No credentials found. Save your credentials in the Teyvat Chrono dashboard Settings modal — they sync to the server automatically.'
    });
  }

  const { uid, server: srv, ltoken, ltuid } = config;
  const server = srv || 'os_euro';
  const webhookUrl = config.discordWebhook || process.env.DISCORD_WEBHOOK_URL;
  const resinThreshold = parseInt(process.env.RESIN_THRESHOLD) || 155;
  const hoyo = makeHoyoFetcher(ltoken, ltuid);

  const alerts = [];
  const log    = [];

  // ── 1. Daily Notes ─────────────────────────────────────────────────────────
  try {
    const d = await hoyo(
      `https://bbs-api-os.hoyolab.com/game_record/genshin/api/dailyNote?role_id=${uid}&server=${server}`
    );

    if (d.retcode !== 0) {
      log.push(`Daily notes error: [${d.retcode}] ${d.message}`);
    } else {
      const n = d.data;
      log.push(`Resin ${n.current_resin}/${n.max_resin} | Coins ${n.current_home_coin}/${n.max_home_coin}`);

      if (n.current_resin >= n.max_resin) {
        alerts.push({
          title: 'Resin CAPPED',
          description: `Resin is full at **${n.current_resin}/${n.max_resin}** — it's overflowing! Go spend it.`,
          color: 0xFF5E57
        });
      } else if (n.current_resin >= resinThreshold) {
        alerts.push({
          title: 'Resin Approaching Cap',
          description: `Resin at **${n.current_resin}/${n.max_resin}**. Will cap soon!`,
          color: 0xECD073
        });
      }

      const doneExps = (n.expeditions || []).filter(e => e.status === 'Finished');
      if (doneExps.length > 0) {
        alerts.push({
          title: 'Expeditions Complete',
          description: `**${doneExps.length}** expedition(s) are done and waiting to be collected.`,
          color: 0x3CD5FF
        });
      }

      if (n.current_home_coin >= n.max_home_coin) {
        alerts.push({
          title: 'Realm Currency Full',
          description: `Serenitea Pot at **${n.current_home_coin}/${n.max_home_coin}**. Collect from Tubby!`,
          color: 0xC3A647
        });
      }

      if (n.transformer?.obtained && n.transformer.recovery_time?.reached) {
        alerts.push({
          title: 'Parametric Transformer Ready',
          description: 'Your Parametric Transformer cooldown is up — time to use it!',
          color: 0xAF83FF
        });
      }

      if (n.finished_task_num === n.total_task_num && !n.is_extra_task_reward_received) {
        alerts.push({
          title: 'Claim Your Katheryne Reward',
          description: `All **${n.total_task_num}** daily commissions done, but you haven't collected from Katheryne yet.`,
          color: 0x3CD5FF
        });
      }

      log.push(`Exps done: ${doneExps.length} | Commissions: ${n.finished_task_num}/${n.total_task_num}`);
    }
  } catch (e) {
    log.push(`Daily notes fetch failed: ${e.message}`);
  }

  // ── 2. Auto Daily Check-in ──────────────────────────────────────────────────
  try {
    const status = await hoyo('https://sg-hk4e-api.hoyolab.com/event/sol/info?act_id=e202102251931481');

    if (status.retcode === 0 && !status.data.is_sign) {
      const postBody = JSON.stringify({ act_id: 'e202102251931481' });
      const headers = {
        'Cookie': `ltoken_v2=${ltoken}; ltuid_v2=${ltuid}; ltoken=${ltoken}; ltuid=${ltuid};`,
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://act.hoyolab.com/',
        'x-rpc-app_version': '2.34.1',
        'x-rpc-client_type': '4',
        'Content-Type': 'application/json',
        'DS': generateDS()
      };
      const sign = await fetch('https://sg-hk4e-api.hoyolab.com/event/sol/sign', {
        method: 'POST', headers, body: postBody
      }).then(r => r.json());

      if (sign.retcode === 0 || sign.retcode === -5003) {
        log.push('Check-in: claimed automatically');
        alerts.push({
          title: 'Daily Check-in Claimed',
          description: `Today's HoYoLAB check-in reward was claimed automatically. Day **${status.data.total_sign_day + 1}** of this month.`,
          color: 0x2ECC71
        });
      } else {
        log.push(`Check-in failed: [${sign.retcode}] ${sign.message}`);
      }
    } else {
      log.push('Check-in: already claimed today');
    }
  } catch (e) {
    log.push(`Check-in error: ${e.message}`);
  }

  // ── 3. Daily Briefing ───────────────────────────────────────────────────────
  try {
    const DOMAIN_TALENTS = [
      { name: "Freedom",    location: "Mondstadt",  days: [1, 4, 0], chars: ["Amber", "Barbara", "Diona", "Klee", "Sucrose", "Tartaglia", "Aloy"] },
      { name: "Resistance", location: "Mondstadt",  days: [2, 5, 0], chars: ["Bennett", "Diluc", "Eula", "Jean", "Mona", "Noelle", "Razor"] },
      { name: "Ballad",     location: "Mondstadt",  days: [3, 6, 0], chars: ["Albedo", "Fischl", "Kaeya", "Lisa", "Rosaria", "Venti"] },
      { name: "Prosperity", location: "Liyue",      days: [1, 4, 0], chars: ["Keqing", "Ningguang", "Qiqi", "Shenhe", "Xiao", "Yelan"] },
      { name: "Diligence",  location: "Liyue",      days: [2, 5, 0], chars: ["Chongyun", "Ganyu", "Hu Tao", "Kazuha", "Xiangling", "Yun Jin"] },
      { name: "Gold",       location: "Liyue",      days: [3, 6, 0], chars: ["Beidou", "Xingqiu", "Xinyan", "Zhongli", "Yanfei"] },
      { name: "Transience", location: "Inazuma",    days: [1, 4, 0], chars: ["Yoimiya", "Kokomi", "Thoma", "Heizou"] },
      { name: "Elegance",   location: "Inazuma",    days: [2, 5, 0], chars: ["Ayaka", "Ayato", "Sara", "Itto", "Kuki Shinobu"] },
      { name: "Light",      location: "Inazuma",    days: [3, 6, 0], chars: ["Raiden Shogun", "Yae Miko", "Sayu", "Gorou"] },
      { name: "Admonition", location: "Sumeru",     days: [1, 4, 0], chars: ["Tighnari", "Cyno", "Faruzan", "Candace"] },
      { name: "Ingenuity",  location: "Sumeru",     days: [2, 5, 0], chars: ["Nahida", "Alhaitham", "Dori", "Layla"] },
      { name: "Praxis",     location: "Sumeru",     days: [3, 6, 0], chars: ["Wanderer", "Nilou", "Dehya", "Collei", "Kaveh"] },
      { name: "Equity",     location: "Fontaine",   days: [1, 4, 0], chars: ["Lyney", "Neuvillette", "Navia"] },
      { name: "Justice",    location: "Fontaine",   days: [2, 5, 0], chars: ["Wriothesley", "Furina", "Charlotte", "Freminet"] },
      { name: "Order",      location: "Fontaine",   days: [3, 6, 0], chars: ["Arlecchino", "Clorinde", "Emilie", "Sigewinne", "Chevreuse"] },
      { name: "Contention", location: "Natlan",     days: [1, 4, 0], chars: ["Mualani", "Kachina", "Kinich"] },
      { name: "Kindling",   location: "Natlan",     days: [2, 5, 0], chars: ["Chasca", "Olorun"] },
      { name: "Conflict",   location: "Natlan",     days: [3, 6, 0], chars: ["Xilonen", "Citlali"] },
    ];

    const SERVER_OFFSETS = { os_usa: -5, os_euro: 1, os_asia: 8, os_cht: 8 };
    const srvOffset = SERVER_OFFSETS[server] || 1;
    const srvNow = new Date(Date.now() + srvOffset * 3600000 + new Date().getTimezoneOffset() * 60000);
    const srvDay = srvNow.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const todayBooks = DOMAIN_TALENTS.filter(t => t.days.includes(srvDay));
    const bookLines = todayBooks.map(t => `• **${t.name}** (${t.location}) — ${t.chars.slice(0, 4).join(', ')}`).join('\n');

    let bossLine = '';
    try {
      const d = await hoyo(
        `https://bbs-api-os.hoyolab.com/game_record/genshin/api/dailyNote?role_id=${uid}&server=${server}`
      );
      if (d.retcode === 0) {
        const remaining = d.data.remain_resin_discount_num;
        if (remaining > 0 && srvDay === 0) {
          bossLine = `\n**${remaining} boss discount${remaining > 1 ? 's' : ''} left** — weekly reset is tomorrow!`;
          alerts.push({
            title: 'Weekly Boss Discounts Expiring',
            description: `You have **${remaining}** half-cost boss discount${remaining > 1 ? 's' : ''} remaining and weekly reset is tomorrow. Don't let them go to waste!`,
            color: 0xE67E22
          });
        }
      }
    } catch (_) {}

    alerts.push({
      title: `Daily Briefing — ${dayNames[srvDay]}`,
      description: `**Today's Talent Books:**\n${bookLines || 'All books available (Sunday)'}${bossLine}\n\nCheck your resin and expeditions!`,
      color: 0x3CD5FF
    });
    log.push('Daily briefing generated');
  } catch (e) {
    log.push(`Briefing error: ${e.message}`);
  }

  // ── 4. Send Discord alerts ──────────────────────────────────────────────────
  try {
    await discord(webhookUrl, alerts);
    if (alerts.length) log.push(`Sent ${alerts.length} Discord alert(s)`);
  } catch (e) {
    log.push(`Discord error: ${e.message}`);
  }

  return res.status(200).json({ ok: true, alerts: alerts.length, log });
};

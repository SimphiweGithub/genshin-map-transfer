# Teyvat Chrono: Genshin Impact Tracker & Reminder Dashboard

A premium, glassmorphic Genshin Impact tracker and reminder dashboard. It queries the unofficial HoYoLAB API to auto-populate your live game statistics (Resin, Serenitea Pot Currency, commissions, boss discounts, active expeditions, character inventory, map explorations, monthly Primogem earnings, and Spiral Abyss progress) and tracks countdowns and resets in real-time.

It is built as a single-page static application with a Node.js Serverless Function proxy configured for zero-setup deployment on **Vercel**.

---

## Features

- **Live Resin & Realm Currency Counter:** Counts up in real-time. Calculates exact completion clocks and sends desktop notifications or plays a sound cue when capped.
- **Daily Commissions & Weekly Reset Checklists:** Tracks commission checkpoints, Katharine rewards, reputation bounties, and weekly bosses.
- **Automatic Daily Check-in:** Check your login streak and claim your HoyoLab web rewards automatically with one click or automatically when the page loads.
- **Spiral Abyss Tracker:** Keeps tabs on your current floor status, chamber stars, and days remaining.
- **Traveler's Ledger:** Summarizes your monthly Mora and Primogem earnings and categorizes where they were sourced.
- **World Map Exploration:** Graphically logs exploration completion rates for Mondstadt, Liyue, Inazuma, Sumeru, Fontaine, Natlan, and other sub-areas.
- **Personalized Farming Alerts:** Cross-references your owned character collection and schedules alerts on the days when their specific talent materials are farmable.
- **Redemption Code List:** Curated list of active codes with direct links prefilled with your code.
- **Manual Mode Toggle:** If you choose not to log in, you can run the dashboard completely offline as a manual calculator.

---

## Local Development (Vercel Dev)

To run the serverless function proxy and the static front-end together locally, use the Vercel CLI:

1. Install the Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```
2. Start the local serverless development environment inside the project directory:
   ```bash
   vercel dev
   ```
3. Open your browser and navigate to `http://localhost:3000`.

---

## How to Deploy to Vercel

Vercel automatically detects the `/api` folder structure and deploys the backend serverless proxy without any extra configuration.

1. Create a free account at [Vercel](https://vercel.com).
2. Connect your GitHub repository.
3. Import the repository in Vercel and click **Deploy**.
4. Once deployed, visit your live site!

---

## How to Extract HoYoLAB Cookies

1. Log in to [hoyolab.com](https://www.hoyolab.com/).
2. Press `F12` to open your browser's Developer Tools.
3. Go to the **Application** tab (Chrome/Edge) or **Storage** tab (Firefox).
4. Expand **Cookies** in the sidebar, select `https://www.hoyolab.com`, and locate these cookies:
   - `ltoken_v2` (or `ltoken`)
   - `ltuid_v2` (or `ltuid`)
5. Copy their values and paste them into the dashboard's **Credentials** modal.

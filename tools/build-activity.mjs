import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshotPath = path.join(root, 'data', 'public-calendar.json');
const login = 'tianxingstarsky';
const query = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

let snapshot;
if (process.argv.includes('--offline')) {
  snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
} else {
  const response = JSON.parse(execFileSync('gh', [
    'api', 'graphql', '-f', `query=${query}`, '-F', `login=${login}`,
  ], { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 }));
  if (response.errors) throw new Error(JSON.stringify(response.errors));
  snapshot = { login, calendar: response.data?.user?.contributionsCollection?.contributionCalendar };
}

const calendar = snapshot.calendar;
const levels = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
if (snapshot.login !== login || !Array.isArray(calendar?.weeks) || !calendar.weeks.length) {
  throw new Error('Missing contribution calendar; the existing wall has been preserved.');
}
const days = calendar.weeks.flatMap(week => week.contributionDays);
for (const day of days) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isInteger(day.contributionCount)
    || day.contributionCount < 0 || !levels.includes(day.contributionLevel)) {
    throw new Error('Invalid contribution data; the existing wall has been preserved.');
  }
}
if (days.reduce((sum, day) => sum + day.contributionCount, 0) !== calendar.totalContributions) {
  throw new Error('Contribution totals do not match the daily counts.');
}

const palettes = {
  dark: { bg: '#1e0914', border: '#63223f', text: '#fff0f7', muted: '#c99aaf', empty: '#391325', colors: ['#722144', '#ac2863', '#de388a', '#ff83cf'] },
  light: { bg: '#400c24', border: '#90284f', text: '#fff3f8', muted: '#edb6cf', empty: '#5a1735', colors: ['#913050', '#c33976', '#ed4aa1', '#ffa0dd'] },
};
const font = 'Segoe UI,Arial,sans-serif';
const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const shortMonth = date => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });

function wall(theme, mobile = false) {
  const c = palettes[theme];
  const weeks = mobile ? calendar.weeks.slice(-16) : calendar.weeks;
  const width = mobile ? 420 : 1000;
  const height = mobile ? 232 : 210;
  const size = mobile ? 16 : 12;
  const pitch = size + 4;
  const gridWidth = weeks.length * pitch - 4;
  const gridHeight = 7 * pitch - 4;
  const gridX = Math.round((width - gridWidth) / 2);
  const gridY = 68;
  const duration = mobile ? 8 : 14;
  const count = mobile ? weeks.flatMap(week => week.contributionDays).reduce((sum, day) => sum + day.contributionCount, 0) : calendar.totalContributions;
  const period = mobile ? 'latest 16 weeks' : 'past year';
  const lastDate = days.at(-1).date;
  const cells = [];
  const monthLabels = [];
  let previousMonth;
  let lastMonthColumn = -4;
  weeks.forEach((week, column) => {
    const month = shortMonth(week.contributionDays[0].date);
    if (month !== previousMonth && column - lastMonthColumn >= (mobile ? 3 : 2)) {
      monthLabels.push(`<text x="${gridX + column * pitch}" y="57">${month}</text>`);
      lastMonthColumn = column;
    }
    previousMonth = month;
    week.contributionDays.forEach(day => {
      const row = new Date(`${day.date}T00:00:00Z`).getUTCDay();
      const level = levels.indexOf(day.contributionLevel);
      const color = level === 0 ? c.empty : c.colors[level - 1];
      cells.push(`<rect class="day" data-date="${day.date}" data-count="${day.contributionCount}" x="${column * pitch}" y="${row * pitch}" width="${size}" height="${size}" rx="3" fill="${color}"><title>${day.date}: ${day.contributionCount} contributions</title></rect>`);
    });
  });
  const particles = Array.from({ length: 7 }, (_, row) => `<g class="particle" transform="translate(-40 ${row * pitch + size / 2})">
    <path d="M-7 0H0" stroke="#ff80c9" stroke-width="1.5" stroke-linecap="round"/>
    <animateTransform attributeName="transform" type="translate" from="-6 ${row * pitch + size / 2}" to="-148 ${row * pitch + size / 2}" dur="1.6s" begin="-${(row * 0.21).toFixed(2)}s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0;.9;0" keyTimes="0;.15;1" dur="1.6s" begin="-${(row * 0.21).toFixed(2)}s" repeatCount="indefinite"/>
  </g>`).join('');
  const caption = `${count.toLocaleString('en-US')} contributions · ${period}`;
  const stats = mobile
    ? `<text x="20" y="44" font-size="12" fill="${c.muted}">${caption}</text>`
    : `<text x="972" y="30" text-anchor="end" font-size="12" fill="${c.muted}">${caption}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">Small Commits, Long Tails</title>
  <desc id="desc">${escape(`${login}: ${caption}, as of ${lastDate}. Dates progress from left to right. A bright front moves right while particles drift and fade left. Each cell retains its real GitHub contribution count.`)}</desc>
  <defs>
    <linearGradient id="tail"><stop stop-color="#ed2788" stop-opacity="0"/><stop offset=".8" stop-color="#ff4faa" stop-opacity=".25"/><stop offset="1" stop-color="#ffc1e8" stop-opacity=".42"/></linearGradient>
    <clipPath id="wallClip"><rect x="0" y="-3" width="${gridWidth}" height="${gridHeight + 18}" rx="4"/></clipPath>
  </defs>
  <style>@media(prefers-reduced-motion:reduce){.motion{display:none}}</style>
  <rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="14" fill="${c.bg}" stroke="${c.border}"/>
  <g font-family="${font}">
    <text x="${mobile ? 20 : 28}" y="${mobile ? 24 : 30}" font-size="${mobile ? 16 : 17}" font-weight="600" fill="${c.text}">Small Commits, Long Tails</text>
    ${stats}
    <g font-size="10" fill="${c.muted}">${monthLabels.join('')}
      ${[[1, 'Mon'], [3, 'Wed'], [5, 'Fri']].map(([row, label]) => `<text x="${gridX - 10}" y="${gridY + row * pitch + size - 2}" text-anchor="end">${label}</text>`).join('')}
    </g>
  </g>
  <g transform="translate(${gridX} ${gridY})">
    ${cells.join('\n    ')}
    <path d="M0 ${gridHeight + 9}H${gridWidth}" stroke="${c.border}" stroke-width="1"/>
    <g clip-path="url(#wallClip)" aria-hidden="true">
      <g class="motion" id="forward-front">
        <animateTransform attributeName="transform" type="translate" from="0 0" to="${gridWidth + 148} 0" dur="${duration}s" repeatCount="indefinite"/>
        <rect x="-148" y="0" width="148" height="${gridHeight}" fill="url(#tail)"/>
        <rect x="-1.5" y="0" width="3" height="${gridHeight}" rx="1.5" fill="#ffd2ee" opacity=".85"/>
        ${particles}
        <path d="M-3 ${gridHeight + 5}l6 4-6 4" fill="none" stroke="#ffe4f5" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M-148 ${gridHeight + 9}H-5" stroke="#ff48ae" stroke-width="2"/>
      </g>
    </g>
  </g>
  <g font-family="${font}" font-size="${mobile ? 9 : 10}" fill="${c.muted}">
    <text x="${mobile ? 20 : 28}" y="${height - 12}">As of ${lastDate}</text>
    <text x="${width - (mobile ? 20 : 28)}" y="${height - 12}" text-anchor="end" letter-spacing=".6">TAILS LEFT · IDEAS RIGHT</text>
  </g>
</svg>\n`;
}

fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
for (const theme of Object.keys(palettes)) {
  fs.writeFileSync(path.join(root, 'assets', `activity-${theme}.svg`), wall(theme));
  fs.writeFileSync(path.join(root, 'assets', `activity-mobile-${theme}.svg`), wall(theme, true));
}
fs.writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Generated the activity wall from ${days.length} real dates and ${calendar.totalContributions} contributions.`);

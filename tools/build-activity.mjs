import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshotPath = path.join(root, 'data', 'public-calendar.json');
const readmePath = path.join(root, 'README.md');
const login = 'tianxingstarsky';
const query = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
      commitContributionsByRepository(maxRepositories: 100) {
        repository { isPrivate }
        contributions(last: 1) { nodes { occurredAt } }
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
  const collection = response.data?.user?.contributionsCollection;
  const publicCommitDates = (collection?.commitContributionsByRepository ?? [])
    .filter(entry => entry.repository?.isPrivate === false)
    .flatMap(entry => entry.contributions.nodes.map(node => node.occurredAt.slice(0, 10)))
    .sort();
  const current = { login, calendar: collection?.contributionCalendar, latestCommitDate: publicCommitDates.at(-1) ?? null };
  const previous = fs.existsSync(snapshotPath) ? JSON.parse(fs.readFileSync(snapshotPath, 'utf8')) : null;
  const previousData = previous && { login: previous.login, calendar: previous.calendar, latestCommitDate: previous.latestCommitDate };
  const unchanged = JSON.stringify(current) === JSON.stringify(previousData);
  snapshot = { ...current, syncedAt: unchanged && previous?.syncedAt ? previous.syncedAt : new Date().toISOString() };
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
const syncParts = snapshot.syncedAt && Object.fromEntries(new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
}).formatToParts(new Date(snapshot.syncedAt)).map(part => [part.type, part.value]));
const syncLabel = syncParts && `Synced ${syncParts.year}-${syncParts.month}-${syncParts.day} ${syncParts.hour}:${syncParts.minute} UTC+8`;

function randomSource(seed) {
  let state = [...seed].reduce((value, char) => Math.imul(value ^ char.charCodeAt(0), 16777619), 2166136261) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function cometModel(positions, pitch, size, gridHeight, mobile) {
  const head = positions.find(day => day.date === snapshot.latestCommitDate);
  if (!head) return null;
  const random = randomSource(`${head.date}/comet-v2/${mobile}`);
  const length = Math.max(pitch * 2, head.cx * .98);
  const streams = [];
  for (let index = 0; index < 15; index++) {
    const branch = (index - 7) / 7;
    const phase = random() * Math.PI * 2;
    const field = (x, y) => {
      const distance = Math.max(0, head.cx - x);
      const spread = 1 - Math.exp(-distance / (pitch * 4));
      const center = head.cy + (gridHeight * .48 - head.cy) * spread;
      const target = center + branch * gridHeight * .42 * spread;
      let vx = -70 - 5 * Math.sin(distance / 65 + phase);
      let vy = (target - y) * 1.25 + Math.sin(distance / (pitch * 2.8) + phase) * 8 * spread;
      for (const [fraction, row, spin] of [[.27, .30, 26], [.56, .69, -31], [.82, .36, 19]]) {
        const radius = pitch * (mobile ? 2.7 : 3.6);
        const dx = x - (head.cx - length * fraction);
        const dy = y - gridHeight * row;
        const swirl = spin * Math.exp(-(dx * dx + dy * dy) / (radius * radius));
        vx += dy / radius * swirl;
        vy -= dx / radius * swirl;
      }
      return { vx, vy };
    };
    let x = head.cx - 1;
    let y = head.cy + branch * size * .10;
    let distance = 0;
    const points = [{ x, y, distance: 0 }];
    for (let step = 0; step < 170 && head.cx - x < length; step++) {
      const first = field(x, y);
      const middle = field(x + first.vx * .055, y + first.vy * .055);
      const nextX = x + middle.vx * .11;
      const nextY = y + middle.vy * .11;
      distance += Math.hypot(nextX - x, nextY - y);
      x = nextX;
      y = nextY;
      points.push({ x, y, distance });
    }
    const duration = (mobile ? 6.4 : 11.4) * (.92 + random() * .22);
    streams.push({
      points, length: distance, duration, phase: random() * duration,
      path: points.map((point, pointIndex) => `${pointIndex ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' '),
    });
  }
  const glows = [];
  for (const day of positions) {
    if (day.date >= head.date) continue;
    const backwards = head.cx - day.cx;
    if (backwards < 0 || backwards > length) continue;
    let nearest;
    streams.forEach((stream, streamIndex) => {
      stream.points.forEach(point => {
        const separation = Math.hypot(point.x - day.cx, point.y - day.cy);
        if (!nearest || separation < nearest.separation) nearest = { separation, streamIndex, along: point.distance / stream.length };
      });
    });
    const influence = Math.exp(-Math.pow(nearest.separation / (pitch * 1.05), 2));
    if (influence < .08 || random() > .30 + influence * .47) continue;
    const stream = streams[nearest.streamIndex];
    const packet = Math.floor(random() * 4);
    const arrival = nearest.along * stream.duration - stream.phase - packet * stream.duration / 4;
    const phase = ((arrival % stream.duration) + stream.duration) % stream.duration;
    const peak = (.20 + .50 * Math.exp(-backwards / length * 1.6)) * (.65 + random() * .35) * Math.sqrt(influence);
    glows.push({ ...day, streamIndex: nearest.streamIndex, duration: stream.duration, phase, peak });
  }
  return { head, streams, glows, length };
}

function drawComet(model, size, gridWidth, gridHeight) {
  if (!model) return '';
  const { head, streams, glows, length } = model;
  const definitions = streams.map((stream, index) => `<path id="flow-${index}" d="${stream.path}"/>`).join('\n');
  const mist = streams.map((stream, index) => `<path d="${stream.path}" stroke="url(#cometTint)" stroke-width="${index % 3 === 0 ? 9 : 5}" opacity=".10"/>`).join('');
  const filaments = streams.map(stream => `<path d="${stream.path}" stroke="url(#cometTint)" stroke-width=".7" opacity=".22"/>`).join('');
  // Keep a still wake visible even when motion is reduced or SVG animation is unavailable.
  const stillGlows = glows.map(day => {
    const progress = 1 - day.phase / day.duration;
    const envelope = progress < .015 || progress >= .16 ? 0
      : progress < .055 ? (progress - .015) / .04 : (.16 - progress) / .105;
    const opacity = day.peak * envelope * .75;
    if (opacity < .025) return '';
    return `<g class="wake-still-cell" data-date="${day.date}" opacity="${opacity.toFixed(3)}">
      <rect x="${day.x - 1}" y="${day.y - 1}" width="${size + 2}" height="${size + 2}" rx="3.5" fill="#ff61b9" filter="url(#cellGlow)"/>
      <rect x="${day.x}" y="${day.y}" width="${size}" height="${size}" rx="3" fill="#ffb2e2" opacity=".74"/>
    </g>`;
  }).join('');
  const particles = streams.map((stream, index) => Array.from({ length: 4 }, (_, packet) => `<g class="flow-particle" opacity="0">
    <ellipse rx="${packet % 2 ? 1.15 : 1.8}" ry=".7" fill="#ffb9e7"/>
    <animateMotion dur="${stream.duration.toFixed(3)}s" begin="-${(stream.phase + packet * stream.duration / 4).toFixed(3)}s" repeatCount="indefinite" rotate="auto"><mpath href="#flow-${index}"/></animateMotion>
    <animate attributeName="opacity" values="0;.78;.30;0" keyTimes="0;.05;.52;1" dur="${stream.duration.toFixed(3)}s" begin="-${(stream.phase + packet * stream.duration / 4).toFixed(3)}s" repeatCount="indefinite"/>
  </g>`).join('')).join('');
  const cellGlows = glows.map(day => `<g class="wake-cell" data-date="${day.date}" data-flow="${day.streamIndex}" opacity="0">
    <rect x="${day.x - 1}" y="${day.y - 1}" width="${size + 2}" height="${size + 2}" rx="3.5" fill="#ff61b9" filter="url(#cellGlow)"/>
    <rect x="${day.x}" y="${day.y}" width="${size}" height="${size}" rx="3" fill="#ffb2e2" opacity=".74"/>
    <animate attributeName="opacity" values="0;0;${day.peak.toFixed(3)};0;0" keyTimes="0;.015;.055;.16;1" dur="${day.duration.toFixed(3)}s" begin="-${(day.duration - day.phase).toFixed(3)}s" repeatCount="indefinite"/>
  </g>`).join('');
  return `<defs>
    ${definitions}
    <linearGradient id="cometTint" gradientUnits="userSpaceOnUse" x1="${head.cx - length}" y1="0" x2="${head.cx}" y2="0"><stop stop-color="#bd2384" stop-opacity="0"/><stop offset=".38" stop-color="#ef329e" stop-opacity=".45"/><stop offset=".8" stop-color="#ff84ce"/><stop offset="1" stop-color="#ffe4f5"/></linearGradient>
    <radialGradient id="coma"><stop stop-color="#fff9fd" stop-opacity=".95"/><stop offset=".22" stop-color="#ffb1e8" stop-opacity=".60"/><stop offset=".62" stop-color="#f446bc" stop-opacity=".20"/><stop offset="1" stop-color="#ec278e" stop-opacity="0"/></radialGradient>
    <filter id="mist" filterUnits="userSpaceOnUse" x="-20" y="-20" width="${gridWidth + 40}" height="${gridHeight + 40}"><feGaussianBlur stdDeviation="2.8"/></filter>
    <filter id="cellGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.7"/></filter>
  </defs>
  <g clip-path="url(#wallClip)" aria-hidden="true">
    <g class="comet-wake" fill="none" filter="url(#mist)">${mist}</g>
    <g class="comet-wake" fill="none">${filaments}</g>
    <g class="wake-still">${stillGlows}</g>
    <g class="motion">${cellGlows}${particles}</g>
  </g>
  <g id="comet-head" data-date="${head.date}" data-count="${head.contributionCount}" transform="translate(${head.cx} ${head.cy})">
    <title>Latest public commit day: ${head.date}</title>
    <circle r="${size * 1.4}" fill="url(#coma)"/>
    <circle class="motion" r="${size * .65}" fill="none" stroke="#ffbce9" stroke-width=".7" opacity=".20"><animate attributeName="r" values="${size * .40};${size * 1.25}" dur="2.7s" repeatCount="indefinite"/><animate attributeName="opacity" values=".45;0" dur="2.7s" repeatCount="indefinite"/></circle>
    <rect x="${-size / 2 - .5}" y="${-size / 2 - .5}" width="${size + 1}" height="${size + 1}" rx="3" fill="none" stroke="#ffb5e7" stroke-width="1.1"/>
    <ellipse cx="-1" rx="${size * .36}" ry="${size * .27}" fill="#ffe4f5"/>
    <circle r="${size * .21}" fill="#fffafd"/>
  </g>`;
}

function wall(theme, mobile = false) {
  const c = palettes[theme];
  const commitWeek = calendar.weeks.findIndex(week => week.contributionDays.some(day => day.date === snapshot.latestCommitDate));
  const endWeek = mobile && commitWeek >= 0 && commitWeek < calendar.weeks.length - 16 ? commitWeek + 1 : calendar.weeks.length;
  const weeks = mobile ? calendar.weeks.slice(Math.max(0, endWeek - 16), endWeek) : calendar.weeks;
  const width = mobile ? 420 : 1000;
  const height = mobile ? 232 : 210;
  const size = mobile ? 16 : 12;
  const pitch = size + 4;
  const gridWidth = weeks.length * pitch - 4;
  const gridHeight = 7 * pitch - 4;
  const gridX = Math.round((width - gridWidth) / 2);
  const gridY = 68;
  const count = mobile ? weeks.flatMap(week => week.contributionDays).reduce((sum, day) => sum + day.contributionCount, 0) : calendar.totalContributions;
  const period = mobile ? (endWeek < calendar.weeks.length ? '16 weeks through latest commit' : 'latest 16 weeks') : 'past year';
  const lastDate = days.at(-1).date;
  const cells = [];
  const positions = [];
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
      positions.push({ ...day, x: column * pitch, y: row * pitch, cx: column * pitch + size / 2, cy: row * pitch + size / 2 });
      cells.push(`<rect class="day" data-date="${day.date}" data-count="${day.contributionCount}" x="${column * pitch}" y="${row * pitch}" width="${size}" height="${size}" rx="3" fill="${color}"><title>${day.date}: ${day.contributionCount} contributions</title></rect>`);
    });
  });
  const comet = cometModel(positions, pitch, size, gridHeight, mobile);
  const caption = `${count.toLocaleString('en-US')} contributions · ${period}`;
  const stats = mobile
    ? `<text x="20" y="44" font-size="12" fill="${c.muted}">${caption}</text>`
    : `<text x="972" y="30" text-anchor="end" font-size="12" fill="${c.muted}">${caption}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">Small Commits, Long Tails</title>
  <desc id="desc">${escape(`${login}: ${caption}, as of ${lastDate}. The comet's head is anchored to the latest public commit day, ${comet?.head.date ?? 'none'}. A curling wake flows left, softly lighting older cells as it passes. Each cell retains its real GitHub contribution count.`)}</desc>
  <defs>
    <clipPath id="wallClip"><rect x="0" y="0" width="${gridWidth}" height="${gridHeight}" rx="4"/></clipPath>
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
    ${drawComet(comet, size, gridWidth, gridHeight)}
  </g>
  <g font-family="${font}" font-size="${mobile ? 9 : 10}" fill="${c.muted}">
    <text x="${mobile ? 20 : 28}" y="${height - 12}">${syncLabel ?? `As of ${lastDate}`}</text>
    <text x="${width - (mobile ? 20 : 28)}" y="${height - 12}" text-anchor="end" letter-spacing=".4">LATEST COMMIT · ${comet?.head.date ?? 'NONE'}</text>
  </g>
</svg>\n`;
}

const assets = [];
for (const theme of Object.keys(palettes)) {
  assets.push([`activity-comet-tail-${theme}.svg`, wall(theme)]);
  assets.push([`activity-comet-tail-mobile-${theme}.svg`, wall(theme, true)]);
}
// Change image URLs with their contents, while unchanged data produces no new commit.
const version = createHash('sha256').update(assets.map(([, svg]) => svg).join('')).digest('hex').slice(0, 12);
const readme = fs.readFileSync(readmePath, 'utf8');
const updatedReadme = readme.replace(/(assets\/activity-comet-tail(?:-mobile)?-(?:dark|light)\.svg)(?:\?v=[a-f0-9]+)?/g, `$1?v=${version}`);
fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
for (const [name, svg] of assets) fs.writeFileSync(path.join(root, 'assets', name), svg);
fs.writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
if (updatedReadme !== readme) fs.writeFileSync(readmePath, updatedReadme);
console.log(`Generated the activity wall from ${days.length} real dates and ${calendar.totalContributions} contributions.`);

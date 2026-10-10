import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'assets');
fs.mkdirSync(output, { recursive: true });
const font = 'Segoe UI,Microsoft YaHei,PingFang SC,Arial,sans-serif';
const mono = 'Consolas,Menlo,monospace';

const palettes = {
  dark: { bg: '#101d31', end: '#102e37', text: '#effaf6', muted: '#b6d2d5', mint: '#92efd0', line: '#33505d', panel: '#152939' },
  light: { bg: '#eaf8f2', end: '#e6f0fb', text: '#17334b', muted: '#476477', mint: '#176c59', line: '#b2d5cc', panel: '#f7fcfa' },
};

function shell(width, height, title, desc, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc"><title id="title">${title}</title><desc id="desc">${desc}</desc>${content}</svg>\n`;
}

function hero(theme) {
  const c = palettes[theme];
  const stars = [[700,60,2],[786,99,3],[1092,63,2],[1152,156,3],[714,245,2],[1113,327,2],[635,90,1.5],[119,47,1.5],[605,327,2],[741,366,1.5],[1001,46,1.5]];
  return shell(1200, 440, "From C to the Moon: A Founder's Notes on Building Intelligence", 'Field notes from tianxingstarsky, founder of Top of Moon in Zhuhai, China. A mint-colored astronaut writes code on the moon above a sea of circuits.', `
  <defs>
    <linearGradient id="background" x2="1" y2="1"><stop stop-color="${c.bg}"/><stop offset="1" stop-color="${c.end}"/></linearGradient>
    <linearGradient id="moon" x2=".3" y2="1"><stop stop-color="#e5fff1"/><stop offset="1" stop-color="#83cbb3"/></linearGradient>
    <linearGradient id="visor" x2="1" y2="1"><stop stop-color="#244452"/><stop offset="1" stop-color="#102135"/></linearGradient>
    <radialGradient id="halo"><stop stop-color="#77dcb8" stop-opacity=".25"/><stop offset="1" stop-color="#77dcb8" stop-opacity="0"/></radialGradient>
    <clipPath id="round"><rect width="1200" height="440" rx="28"/></clipPath>
    <clipPath id="moonClip"><circle cx="941" cy="319" r="94"/></clipPath>
  </defs>
  <g clip-path="url(#round)">
    <rect width="1200" height="440" fill="url(#background)"/>
    <circle cx="947" cy="212" r="248" fill="url(#halo)"/>
    <g fill="none" stroke="${c.line}" opacity=".42">
      <path d="M0 369 Q155 333 300 370 T610 365 T926 369 T1240 363"/>
      <path d="M0 387 Q150 350 308 388 T625 383 T942 387 T1240 381"/>
      <path d="M0 405 Q151 369 303 405 T622 402 T942 405 T1240 399"/>
      <path d="M660 62 L750 117 L808 68 L892 103 L1026 72 L1119 122"/>
    </g>
    <g fill="${c.mint}">${stars.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" opacity=".66"/>`).join('')}</g>
    <g fill="${c.mint}" opacity=".55"><path d="M1118 222h16m-8-8v16" stroke="${c.mint}" stroke-width="2"/><path d="M767 174h12m-6-6v12" stroke="${c.mint}" stroke-width="2"/></g>
    <g font-family="${font}">
      <rect x="60" y="43" width="357" height="34" rx="17" fill="${c.mint}" fill-opacity=".1" stroke="${c.mint}" stroke-opacity=".28"/>
      <circle cx="78" cy="60" r="4" fill="${c.mint}"/>
      <text x="93" y="65" font-family="${mono}" font-size="12" letter-spacing="1.4" fill="${c.mint}">FIELD NOTES / ALWAYS IN REVISION</text>
      <text x="57" y="172" font-size="86" font-weight="700" letter-spacing="-2" fill="${c.text}">From C</text>
      <text x="57" y="264" font-size="86" font-weight="700" letter-spacing="-2" fill="${c.text}">to the Moon.</text>
      <text x="63" y="312" font-size="22" fill="${c.muted}">A Founder's Notes on Building Intelligence</text>
      <text x="63" y="355" font-family="${mono}" font-size="19" fill="${c.mint}">@tianxingstarsky</text>
      <text x="63" y="402" font-family="${mono}" font-size="14" letter-spacing="1" fill="${c.muted}">TOP OF MOON · ZHUHAI, CHINA</text>
    </g>
    <ellipse cx="939" cy="313" rx="204" ry="54" transform="rotate(-21 939 313)" fill="none" stroke="${c.mint}" stroke-opacity=".3" stroke-width="1.5"/>
    <circle cx="941" cy="319" r="94" fill="url(#moon)"/>
    <g clip-path="url(#moonClip)" fill="#539f88" fill-opacity=".17">
      <ellipse cx="897" cy="298" rx="24" ry="15"/><ellipse cx="977" cy="363" rx="28" ry="17"/><circle cx="918" cy="378" r="11"/>
      <ellipse cx="992" cy="299" rx="15" ry="10"/><ellipse cx="942" cy="334" rx="9" ry="5"/>
      <path d="M864 351h32l18-18h57l20-20h52" stroke="#438c76" stroke-width="2" fill="none"/>
      <circle cx="896" cy="351" r="4"/><circle cx="991" cy="313" r="4"/>
    </g>
    <g stroke="#244c51" stroke-width="3" stroke-linejoin="round">
      <rect x="880" y="183" width="32" height="61" rx="11" fill="#83b6ac"/>
      <path d="M899 222 Q897 188 924 187h28q23 4 21 32l-3 51-60-3z" fill="#f1fff8"/>
      <path d="M911 260 Q893 279 901 297l37 7 5-19-18-9" fill="#f1fff8"/>
      <path d="M946 263 Q938 284 959 293l31-4-2-18-20 1" fill="#e1f5ec"/>
      <rect x="922" y="225" width="25" height="20" rx="4" fill="#a4e8cc"/>
      <path d="M908 211q-20 8-21 32l19 6 15-23" fill="#f1fff8"/>
      <path d="M959 210q21 1 31 20l-13 13-21-18" fill="#f1fff8"/>
      <ellipse cx="936" cy="171" rx="48" ry="43" fill="#f1fff8"/>
      <rect x="900" y="150" width="71" height="43" rx="21" fill="url(#visor)"/>
      <path d="M911 160q13-8 26-4" fill="none" stroke="#b5f2d9" stroke-width="4" stroke-linecap="round"/>
      <path d="M923 178q5 6 10 0m10 0q5 6 10 0" fill="none" stroke="#a7edcf" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="887" cy="173" r="7" fill="#a4e8cc"/><circle cx="984" cy="173" r="7" fill="#a4e8cc"/>
      <path d="M987 160v-22" fill="none"/><circle cx="987" cy="134" r="5" fill="#92efd0"/>
      <path d="M920 238h71l-9 43h-72z" fill="#244453"/>
      <path d="M904 282h84l-6 7h-75z" fill="#92c6b6"/>
    </g>
    <text x="932" y="266" fill="#a6f3d3" font-family="${mono}" font-size="20" font-weight="700">&lt;/&gt;</text>
    <g transform="translate(1045 239) rotate(8)">
      <path d="M0 0v83" stroke="${c.muted}" stroke-width="3"/>
      <path d="M2 1h62v38H2z" fill="${c.mint}" fill-opacity=".16" stroke="${c.mint}" stroke-width="1.5"/>
      <text x="15" y="27" font-family="${mono}" font-size="18" font-weight="700" fill="${c.mint}">AI</text>
    </g>
    <g transform="translate(764 284) rotate(-12)" fill="none" stroke="${c.mint}" stroke-width="2" opacity=".78">
      <rect width="53" height="38" rx="8"/><path d="M12 13l-6 6 6 6m29-12 6 6-6 6m-15-13-6 14"/>
    </g>
    <rect x=".75" y=".75" width="1198.5" height="438.5" rx="27" fill="none" stroke="${c.line}" stroke-opacity=".65" stroke-width="1.5"/>
  </g>`);
}

function research(theme) {
  const c = palettes[theme];
  return shell(1200, 222, 'The Blueprints / The Data / The Playground', 'DLES and the BIM series. Over 100 billion data records as of October 2026. Hardware, software, algorithms, and models.', `
  <rect x="1" y="1" width="1198" height="220" rx="24" fill="${c.panel}" stroke="${c.line}"/>
  <path d="M401 37v148m398-148v148" stroke="${c.line}"/>
  <g font-family="${font}">
    <g transform="translate(37 32)"><circle cx="12" cy="12" r="10" fill="none" stroke="${c.mint}" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="${c.mint}"/><path d="M12-3v6m0 18v6m-15-15h6m18 0h6" stroke="${c.mint}" stroke-width="2"/></g>
    <text x="77" y="52" font-family="${mono}" font-size="18" letter-spacing="1" fill="${c.muted}">THE BLUEPRINTS</text>
    <text x="37" y="125" font-family="${mono}" font-size="43" font-weight="700" fill="${c.text}">DLES · BIM</text>
    <text x="38" y="174" font-size="20" fill="${c.mint}">AI paradigm research</text>
    <g transform="translate(438 32)" fill="none" stroke="${c.mint}" stroke-width="2"><ellipse cx="13" cy="5" rx="12" ry="5"/><path d="M1 5v16c0 7 24 7 24 0V5M1 13c0 7 24 7 24 0"/></g>
    <text x="478" y="52" font-family="${mono}" font-size="18" letter-spacing="1" fill="${c.muted}">THE DATA</text>
    <text x="438" y="125" font-family="${mono}" font-size="53" font-weight="700" fill="${c.text}">100B+</text>
    <text x="637" y="121" font-size="25" fill="${c.text}">records</text>
    <text x="439" y="174" font-size="19" fill="${c.mint}">Company data assets · Oct 2026</text>
    <g transform="translate(838 33)" fill="none" stroke="${c.mint}" stroke-width="2"><rect x="2" y="2" width="22" height="22" rx="3"/><path d="M8-3v5m10-5v5M8 24v5m10-5v5M-3 8h5m-5 10h5m22-10h5m-5 10h5"/><rect x="8" y="8" width="10" height="10" rx="1"/></g>
    <text x="879" y="52" font-family="${mono}" font-size="18" letter-spacing="1" fill="${c.muted}">THE PLAYGROUND</text>
    <text x="838" y="123" font-size="43" font-weight="700" fill="${c.text}">Bits × Boards</text>
    <text x="839" y="174" font-size="20" fill="${c.mint}">Hardware · Software · AI</text>
  </g>`);
}

function researchMobile(theme) {
  const c = palettes[theme];
  return shell(600, 326, 'DLES · BIM / 100B+ records / Bits × Boards', 'Representative architectures: DLES and the BIM series. Data assets: over 100 billion records as of October 2026. Hardware, software, algorithms, and models.', `
  <rect x="1" y="1" width="598" height="324" rx="24" fill="${c.panel}" stroke="${c.line}"/>
  <path d="M300 24v159M25 203h550" stroke="${c.line}"/>
  <g font-family="${font}">
    <text x="25" y="48" font-family="${mono}" font-size="22" fill="${c.muted}">THE BLUEPRINTS</text>
    <text x="24" y="107" font-family="${mono}" font-size="39" font-weight="700" fill="${c.text}">DLES · BIM</text>
    <text x="25" y="157" font-size="22" fill="${c.mint}">Paradigm research</text>
    <text x="325" y="48" font-family="${mono}" font-size="22" fill="${c.muted}">THE DATA</text>
    <text x="324" y="109" font-family="${mono}" font-size="45" font-weight="700" fill="${c.text}">100B+</text>
    <text x="483" y="106" font-size="23" fill="${c.text}">records</text>
    <text x="325" y="157" font-size="21" fill="${c.mint}">Data assets · Oct 2026</text>
    <text x="25" y="252" font-size="31" font-weight="700" fill="${c.text}">Bits × Boards</text>
    <text x="26" y="297" font-size="23" fill="${c.mint}">Hardware · Software · Algorithms · Models</text>
  </g>`);
}

function languages(mobile = false) {
  const groups = [
    { x: 0, fill: '#d9ecfa', color: '#204c70', label: 'C++', glyph: '{ }' },
    { x: 205, fill: '#dff4e9', color: '#245c49', label: 'Python', glyph: 'Py' },
    { x: 410, fill: '#e9e6f7', color: '#52447b', label: 'C', glyph: 'C' },
    { x: 615, fill: '#faf0d4', color: '#756025', label: 'JavaScript', glyph: 'JS' },
  ];
  const width = mobile ? 600 : 800;
  const height = mobile ? 178 : 86;
  return shell(width, height, 'C++ · Python · C · JavaScript', 'My everyday programming languages.', groups.map((g,i)=>`
    <g transform="translate(${mobile ? (i%2)*310 : g.x} ${mobile ? Math.floor(i/2)*94+2 : 5})">
      <rect width="${mobile?290:185}" height="76" rx="15" fill="${g.fill}"/>
      <rect x="${mobile?20:12}" y="18" width="38" height="38" rx="10" fill="${g.color}"/>
      <text x="${mobile?39:31}" y="43" text-anchor="middle" fill="${g.fill}" font-family="${mono}" font-size="17" font-weight="700">${g.glyph}</text>
      <text x="${mobile?79:62}" y="46" fill="${g.color}" font-family="${mono}" font-size="${mobile?27:g.label==='JavaScript'?18:23}" font-weight="700">${g.label}</text>
    </g>`).join(''));
}

for (const theme of Object.keys(palettes)) {
  fs.writeFileSync(path.join(output, `hero-${theme}.svg`), hero(theme), 'utf8');
  fs.writeFileSync(path.join(output, `research-${theme}.svg`), research(theme), 'utf8');
  fs.writeFileSync(path.join(output, `research-mobile-${theme}.svg`), researchMobile(theme), 'utf8');
}
fs.writeFileSync(path.join(output, 'languages.svg'), languages(), 'utf8');
fs.writeFileSync(path.join(output, 'languages-mobile.svg'), languages(true), 'utf8');
console.log('Generated eight standalone SVG assets.');

/* รอบส่งเป็น carousel + เมนูบรรทัดละรายการ (นัทสั่ง 2 ก.ย. 2026)

   เดิม: 3 บล็อกเรียงลงมา แต่ละบล็อกเมนู 3 คอลัมน์ → หน้ายาวมาก และชื่อเมนูตัดบรรทัดกลางคำ
   ใหม่: เลื่อนดูทีละรอบ (snap ทีละสไลด์) · เมนูเรียงลงมาบรรทัดละรายการ อ่านง่าย ไม่ตัดคำ

   กติกาที่ต้องคงไว้: ข้อมูลยังมาจาก JAY_ROUNDS ที่สร้างจาก docs/J2026_MENU_DATA.csv
   แก้แพลน = แก้ CSV แล้วรัน m_jay_v2.mjs ไม่ใช่มาแก้มือที่นี่
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/jay.html';
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('u360-jay-carousel')) { console.log('⏭️  ทำแล้ว'); process.exit(0); }
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };

/* ── โครง HTML: เพิ่มปุ่มเลื่อน + จุดบอกตำแหน่ง ── */
const OLD = '    <div id="roundList"></div>';
must(h.includes(OLD), 'ไม่เจอ #roundList');
h = h.replace(OLD, `    <!-- u360-jay-carousel -->
    <div class="rcar">
      <button class="rnav prev" type="button" aria-label="รอบก่อนหน้า" onclick="rSlide(-1)">‹</button>
      <div id="roundList" class="rtrack"></div>
      <button class="rnav next" type="button" aria-label="รอบถัดไป" onclick="rSlide(1)">›</button>
    </div>
    <div class="rdots" id="rDots"></div>`);
console.log('  ✅ โครง carousel + ปุ่มเลื่อน + จุดบอกตำแหน่ง');

/* ── JS render ── */
const S = h.indexOf("document.getElementById('roundList').innerHTML");
const E = h.indexOf("}).join('');", S) + "}).join('');".length;
must(S > 0, 'ไม่เจอโค้ด render รอบ');
h = h.slice(0, S) + `document.getElementById('roundList').innerHTML = JAY_ROUNDS.map(function(r){
  return '<div class="rblock">'
    + '<div class="rhead"><span class="n">รอบ ' + r.n + '</span>'
    + '<span class="s">ส่ง ' + jEsc(r.ship) + '</span>'
    + '<span class="q">' + r.items.length + ' กล่อง</span>'
    + '<span class="e">' + jEsc(r.eat) + '</span></div>'
    + '<ol class="rlist">' + r.items.map(function(m){
        return '<li>' + jEsc(m.name)
             + (m.star ? ' <span style="color:var(--gold)">⭐</span>' : '') + '</li>';
      }).join('') + '</ol></div>';
}).join('');

/* จุดบอกว่าอยู่รอบไหน — กดข้ามไปรอบที่ต้องการได้เลย */
document.getElementById('rDots').innerHTML = JAY_ROUNDS.map(function(r, i){
  return '<button type="button" class="' + (i === 0 ? 'on' : '') + '" onclick="rGo(' + i + ')" '
       + 'aria-label="ไปรอบ ' + r.n + '">รอบ ' + r.n + '</button>';
}).join('');

function rTrack(){ return document.getElementById('roundList'); }
function rCards(){ return [].slice.call(rTrack().children); }
function rIndex(){
  var t = rTrack(), cs = rCards(), best = 0, min = 1e9;
  cs.forEach(function(c, i){ var d = Math.abs(c.offsetLeft - t.scrollLeft); if(d < min){ min = d; best = i; } });
  return best;
}
function rGo(i){
  var cs = rCards(); if(!cs[i]) return;
  rTrack().scrollTo({ left: cs[i].offsetLeft, behavior: 'smooth' });
}
function rSlide(dir){
  var i = rIndex() + dir;
  i = Math.max(0, Math.min(rCards().length - 1, i));
  rGo(i);
}
/* อัปเดตจุด + ซ่อนปุ่มลูกศรตอนสุดทาง */
(function(){
  var t = rTrack(); if(!t) return;
  var sync = function(){
    var i = rIndex(), last = rCards().length - 1;
    [].slice.call(document.querySelectorAll('.rdots button')).forEach(function(b, k){
      b.className = (k === i ? 'on' : '');
    });
    var p = document.querySelector('.rnav.prev'), n = document.querySelector('.rnav.next');
    if(p) p.disabled = (i <= 0);
    if(n) n.disabled = (i >= last);
  };
  t.addEventListener('scroll', function(){ clearTimeout(t._t); t._t = setTimeout(sync, 90); });
  sync();
})();` + h.slice(E);
console.log('  ✅ เมนูเป็น <ol> บรรทัดละรายการ + ตัวเลื่อน/จุด');

/* ── CSS ── */
must(h.includes('</style>'), 'ไม่เจอ </style>');
h = h.replace(/\.rlist\{[^}]*\}\n\.rlist \.m\{[^}]*\}\n\.rlist \.m \.i\{[^}]*\}\n\.rlist \.m \.t\{[^}]*\}\n/, '');
h = h.replace('</style>', `/* ── u360-jay-carousel ── */
.rcar{position:relative;margin-top:22px}
.rtrack{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;
  scroll-behavior:smooth;padding:4px 2px 10px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.rtrack::-webkit-scrollbar{display:none}
.rtrack .rblock{flex:0 0 100%;scroll-snap-align:start;margin-top:0}
@media(min-width:820px){ .rtrack .rblock{flex:0 0 calc(50% - 8px)} }

.rlist{margin:0;padding:6px 0 8px;list-style:none;counter-reset:m}
.rlist li{counter-increment:m;position:relative;padding:11px 18px 11px 46px;
  border-top:1px solid var(--hair);font-size:.99rem;line-height:1.5}
.rlist li:first-child{border-top:0}
.rlist li::before{content:counter(m);position:absolute;left:14px;top:11px;
  min-width:22px;height:22px;border-radius:6px;background:#EDF7EE;color:var(--green);
  font-family:'Prompt';font-weight:600;font-size:.78rem;display:flex;align-items:center;justify-content:center}

.rhead .e{width:100%;margin-top:2px}

/* ปุ่มเลื่อน — ซ่อนบนมือถือ ใช้นิ้วปัดเอา */
.rnav{position:absolute;top:50%;transform:translateY(-50%);z-index:5;
  width:40px;height:40px;border-radius:50%;border:1px solid var(--hair);background:var(--paper);
  font-size:1.5rem;line-height:1;color:var(--ink);cursor:pointer;display:none;
  box-shadow:0 4px 14px rgba(0,0,0,.12);align-items:center;justify-content:center;padding-bottom:3px}
.rnav.prev{left:-16px} .rnav.next{right:-16px}
.rnav:disabled{opacity:.32;cursor:default}
.rnav:not(:disabled):hover{border-color:var(--green);color:var(--green)}
@media(min-width:820px){ .rnav{display:flex} }

.rdots{display:flex;gap:8px;justify-content:center;margin-top:6px}
.rdots button{border:1px solid var(--hair);background:var(--paper);border-radius:999px;
  padding:6px 16px;font-family:'Prompt';font-weight:600;font-size:.85rem;color:var(--muted);cursor:pointer}
.rdots button.on{background:var(--deep);border-color:var(--deep);color:#fff}
</style>`);
console.log('  ✅ CSS carousel + รายการบรรทัดละเมนู');

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('\n✅ ' + F);

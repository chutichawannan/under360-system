/* ════════════════════════════════════════════════════════════════════
   ประตู Google login ของโถงหลังบ้าน — นัทเคาะ 14 ก.ย. 2569
   วิธีใช้: <script src="/staff/auth.js"></script> บรรทัดเดียวในหน้าที่ต้องล็อก

   · อีเมลที่อนุญาตเท่านั้นถึงเห็นหน้า (รายชื่อด้านล่าง)
   · ยังไม่ได้เปิดสวิตช์ Google ที่ Supabase → ถอยไปใช้รหัส 4 ตัวเดิม ไม่ให้ใครติดค้างหน้าขาว
   · ครัวไม่กระทบ — หน้าครัวยังใช้ /gate.js รหัส 4 ตัวเหมือนเดิม

   ⚠️ นี่คือด่านหน้าบ้าน ไม่ใช่กำแพงกันคนตั้งใจ — คนที่รู้วิธียังยิงฐานข้อมูลตรงได้
      (เฟส 2 ค่อยปิดทางนั้นด้วย RLS) อย่าเคลมเกินกว่านี้ — กฎเดียวกับ gate.js
   ════════════════════════════════════════════════════════════════════ */
(function () {
  var SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
  var STORE = 'u360_gauth';

  /* ── ผู้บริหาร เข้าได้ทุกห้อง (นัทให้มาเอง 14 ก.ย.) ──
     ครัวจะเติมทีหลังเมื่อนัทขอเมลลูกน้องมาครบ */
  var ALLOW = [
    'flidty.c@gmail.com',
    'chutichawannan@gmail.com',
    'under360food@gmail.com',
    'ploy.thunyathorn@gmail.com'
  ];

  /* ใครเห็นห้องนัทได้บ้าง — ตัดสินจากอีเมลจริง ไม่ใช่ปุ่มที่ใครกดก็ได้ */
  var OWNERS = ['chutichawannan@gmail.com', 'ploy.thunyathorn@gmail.com', 'under360food@gmail.com', 'flidty.c@gmail.com'];

  function publish(email) {
    window.U360_EMAIL = email || '';
    window.U360_ROLE = OWNERS.indexOf(String(email || '').toLowerCase()) >= 0 ? 'owner' : 'employee';
  }

  function saved() {
    try { var s = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (s && s.email && s.exp && Date.now() < s.exp) return s; } catch (e) {}
    return null;
  }
  function ok(email) { return ALLOW.indexOf(String(email || '').toLowerCase()) >= 0; }
  function hide() { document.documentElement.style.visibility = 'hidden'; }
  function show() { document.documentElement.style.visibility = ''; }

  function screen(html) {
    show();
    document.documentElement.innerHTML =
      '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
      '<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#fcf8ef;' +
      'font-family:\'LINE Seed Sans TH\',\'Leelawadee UI\',Tahoma,sans-serif;color:#07183e">' +
      '<div style="text-align:center;padding:28px;max-width:340px">' + html + '</div></body>';
  }
  var BTN = 'display:block;width:100%;border:0;border-radius:16px;background:#1757f5;color:#fff;' +
            'padding:16px 18px;font-size:16px;font-weight:700;cursor:pointer;margin-top:22px';
  var LINK = 'display:inline-block;margin-top:18px;font-size:13px;color:#53627b';

  function login() {
    var back = location.origin + location.pathname;
    location.href = SB + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(back);
  }

  /* ยังไม่ได้เปิดสวิตช์ Google → ถอยไปใช้รหัส 4 ตัวเดิม ไม่ปล่อยให้หน้าเปิดโล่ง */
  function fallbackPin(why) {
    publish('');
    window.U360_ROLE = 'owner';
    try { localStorage.removeItem(STORE); } catch (e) {}
    var s = document.createElement('script');
    s.src = '/gate.js';
    s.onerror = function () { screen('<h1 style="font-size:19px">เข้าไม่ได้</h1><p style="font-size:14px;color:#53627b;line-height:1.7">' + why + '</p>'); };
    show();
    document.head.appendChild(s);
  }

  function askLogin(note) {
    screen(
      '<div style="font-size:34px">🔐</div>' +
      '<h1 style="font-size:21px;margin:14px 0 6px">โถงหลังบ้าน Under360</h1>' +
      '<p style="font-size:14px;color:#53627b;line-height:1.7">' + (note || 'เข้าด้วยบัญชี Google ของร้าน') + '</p>' +
      '<button id="g" style="' + BTN + '">เข้าสู่ระบบด้วย Google</button>' +
      '<a id="pin" href="#" style="' + LINK + '">ใช้รหัส 4 ตัวแทน</a>'
    );
    document.getElementById('g').onclick = login;
    document.getElementById('pin').onclick = function (e) { e.preventDefault(); fallbackPin('ยังเข้าไม่ได้'); };
  }

  /* กลับจาก Google: โทเคนติดมากับ # ท้าย URL */
  function fromHash() {
    if (location.hash.indexOf('access_token=') < 0) return false;
    var p = new URLSearchParams(location.hash.slice(1));
    var token = p.get('access_token');
    var exp = (Number(p.get('expires_at')) || 0) * 1000;
    hide();
    fetch(SB + '/auth/v1/user', { headers: { apikey: KEY, Authorization: 'Bearer ' + token } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('ถามชื่อผู้ใช้ไม่ได้ (' + r.status + ')')); })
      .then(function (u) {
        var email = (u && u.email || '').toLowerCase();
        history.replaceState(null, '', location.pathname + location.search);
        if (!ok(email)) {
          screen('<div style="font-size:34px">🚫</div><h1 style="font-size:19px;margin:14px 0 6px">อีเมลนี้ยังไม่ได้รับอนุญาต</h1>' +
                 '<p style="font-size:14px;color:#53627b;line-height:1.7">' + email + '<br>บอกเจ้าของร้านให้เพิ่มรายชื่อก่อน</p>' +
                 '<button id="g" style="' + BTN + '">ลองบัญชีอื่น</button>');
          document.getElementById('g').onclick = login;
          return;
        }
        try { localStorage.setItem(STORE, JSON.stringify({ email: email, exp: exp || (Date.now() + 12 * 3600000) })); } catch (e) {}
        publish(email);
        show();
      })
      .catch(function (e) { askLogin('เข้าไม่สำเร็จ — ' + e.message); });
    return true;
  }

  if (fromHash()) return;
  var s0 = saved();
  if (s0) { publish(s0.email); return; }                       /* เคยเข้าแล้ว ผ่านเลย */
  if (location.hash.indexOf('error') >= 0) { askLogin('Google ปฏิเสธการเข้าสู่ระบบ'); return; }

  hide();
  /* เช็คก่อนว่าสวิตช์ Google เปิดหรือยัง — ปิดอยู่ให้ถอยไปรหัส 4 ตัว ไม่ใช่ค้างหน้าขาว */
  fetch(SB + '/auth/v1/settings', { headers: { apikey: KEY } })
    .then(function (r) { return r.json(); })
    .then(function (s) {
      if (s && s.external && s.external.google) askLogin();
      else fallbackPin('ยังไม่ได้เปิด Google login ที่ Supabase');
    })
    .catch(function () { fallbackPin('เช็คสถานะล็อกอินไม่ได้'); });
})();

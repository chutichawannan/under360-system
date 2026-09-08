/* ════════════════════════════════════════════════════════════════════
   ด่านรหัสหน้าหลังบ้าน — ตัวเดียวใช้ทั้งบ้าน (นัทสั่ง 8 ก.ย. 2569 ผ่าน PM)

   วิธีใช้: ใส่บรรทัดเดียวในหน้าที่ต้องล็อก
     <script src="/gate.js"></script>

   ทำไมแยกเป็นไฟล์เดียว: หน้าหลังบ้านมี 30+ หน้า ถ้าก๊อปโค้ดไปทุกหน้า
   วันที่ต้องแก้จะต้องไล่แก้ 30 ที่ และจะมีหน้าที่ตกหล่นแน่นอน

   🔴 เงื่อนไขที่ห้ามพลาด (PM ย้ำ · ของจริงมีคนใช้อยู่):
     · ครัวต้องเข้าได้เหมือนเดิม — ครัวอ่านไทยได้ 2/6 คน
       → ใส่รหัสครั้งเดียว จำไว้ในเครื่อง ไม่ถามซ้ำอีก (แบบเดียวกับ PWA เดิม)
       → หน้าจอมีแค่ช่องตัวเลข ไม่ต้องอ่านอะไร
     · แอดมินต้องไม่สะดุด — วันศุกร์กิ๊ฟหยุด เพอรี่รับช่วง ถ้าเข้าไม่ได้ = งานหยุด
       → ยอมรับรหัสที่หน้า pwa เดิมเคยจำไว้ด้วย (u360_orders_pin) คนที่เคยผ่านแล้วไม่ต้องกรอกใหม่
     · ห้ามรับรหัสทาง URL — 06 เจอรูนี้กับ /ads วันนี้ (?pin= เปิดได้)

   ⚠️ นี่คือด่านหน้าบ้าน ไม่ใช่กำแพงกันคนตั้งใจ — คนที่รู้วิธียังอ้อมไปยิง
      ฐานข้อมูลตรงได้ (เฟส 2 ค่อยปิดทางนั้น) อย่าเคลมเกินกว่านี้
   ════════════════════════════════════════════════════════════════════ */
(function () {
  var KEY = 'u360_gate_pin';
  var OLD_KEYS = ['u360_orders_pin', 'u360_ads_pin']; // คนที่เคยผ่านหน้าอื่นแล้ว ไม่ต้องกรอกซ้ำ

  function readSaved() {
    var keys = [KEY].concat(OLD_KEYS);
    for (var i = 0; i < keys.length; i++) {
      try {
        var v = localStorage.getItem(keys[i]);
        if (v) return v;
      } catch (e) {}
    }
    return '';
  }
  function save(pin) {
    try { localStorage.setItem(KEY, pin); } catch (e) {}
  }

  /* ถามเซิร์ฟเวอร์ว่ารหัสถูกไหม — หน้าเว็บไม่เคยรู้ค่าจริง */
  function check(pin) {
    return fetch('/api/gate', { headers: { 'x-u360-gate': pin }, cache: 'no-store' })
      .then(function (r) {
        if (r.ok) return true;
        /* 401 = รหัสผิดจริง · อย่างอื่น (404 API หาย, 500 พัง, 502 ตัวกลางล่ม)
           = ระบบมีปัญหา ไม่ใช่ความผิดคนใช้ → ห้ามล็อกทั้งบ้านออกเพราะ API ตัวเดียว */
        if (r.status === 401) return false;
        return null;
      })
      .catch(function () { return null; });   // เน็ตล่ม — คนละเรื่องกับรหัสผิด
  }

  /* ซ่อนหน้าไว้ก่อน กันเนื้อหาแวบให้เห็นระหว่างรอตรวจ */
  var hider = document.createElement('style');
  hider.id = 'u360-gate-hide';
  hider.textContent = 'body{visibility:hidden !important}';
  (document.head || document.documentElement).appendChild(hider);

  function reveal() {
    var h = document.getElementById('u360-gate-hide');
    if (h) h.remove();
    var g = document.getElementById('u360-gate');
    if (g) g.remove();
    document.dispatchEvent(new Event('u360-unlocked'));
  }

  function buildGate() {
    var g = document.createElement('div');
    g.id = 'u360-gate';
    g.style.cssText =
      'position:fixed;inset:0;z-index:2147483000;background:#12241C;color:#fff;' +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans Thai",sans-serif;visibility:visible';
    /* ตั้งใจให้มีตัวหนังสือน้อยที่สุด — ครัวส่วนใหญ่อ่านไทยไม่ได้
       เห็นช่องตัวเลข 4 ช่องแล้วรู้เองว่าต้องกดอะไร */
    g.innerHTML =
      '<div style="font-size:26px">🔒</div>' +
      '<input id="u360-gate-pin" type="tel" inputmode="numeric" maxlength="4" placeholder="····" ' +
      'style="width:170px;text-align:center;font-size:30px;letter-spacing:10px;padding:10px;' +
      'border:0;border-radius:12px;font-family:inherit;font-weight:800">' +
      '<div id="u360-gate-err" style="font-size:13px;color:#FCA5A5;height:18px"></div>' +
      /* ปุ่มขอความช่วยเหลือ — ทางออกของคนที่ไม่รู้รหัส จะได้ไม่ต้องวิ่งไปหานัท
         คำน้อยที่สุดเท่าที่สื่อได้ + ไอคอนนำ (ครัวอ่านไทยได้ 2/6 คน) */
      '<button id="u360-gate-ask" type="button" ' +
      'style="margin-top:6px;background:#1F3A2C;color:#CFE9D9;border:1px solid #2F5C43;' +
      'border-radius:22px;padding:11px 20px;font-size:15px;font-family:inherit;font-weight:700;' +
      'display:flex;align-items:center;gap:8px;cursor:pointer">' +
      '<span style="font-size:19px">🙋</span><span>ขอรหัส</span></button>' +
      '<div id="u360-gate-ask-msg" style="font-size:13px;color:#8FA79A;height:20px;text-align:center"></div>';
    document.body.appendChild(g);

    var inp = g.querySelector('#u360-gate-pin');
    var err = g.querySelector('#u360-gate-err');
    setTimeout(function () { try { inp.focus(); } catch (e) {} }, 150);

    /* กดแล้วยิงบอกกะปัน/กลุ่มครัว ว่ามีคนติดอยู่หน้าไหน — ไม่โชว์รหัสบนจอเด็ดขาด */
    var ask = g.querySelector('#u360-gate-ask');
    var askMsg = g.querySelector('#u360-gate-ask-msg');
    ask.addEventListener('click', function () {
      ask.disabled = true;
      askMsg.textContent = 'กำลังส่ง...';
      fetch('/api/gate-help?p=' + encodeURIComponent(location.pathname), { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          /* ✅ ตัวใหญ่ อ่านไม่ออกก็รู้ว่าเรียบร้อย */
          askMsg.innerHTML = j && j.ok
            ? '<span style="color:#4ADE80;font-size:17px">✅ บอกให้แล้ว รอสักครู่</span>'
            : '<span style="color:#FCA5A5">ส่งไม่ได้ ถามหัวหน้าในไลน์</span>';
          /* เปิดให้กดใหม่ได้ เผื่อรอบแรกไม่มีใครเห็น แต่ต้องรอ ไม่ให้รัวติด ๆ */
          setTimeout(function () { ask.disabled = false; }, 60000);
        })
        .catch(function () {
          askMsg.innerHTML = '<span style="color:#FCA5A5">ส่งไม่ได้ ถามหัวหน้าในไลน์</span>';
          setTimeout(function () { ask.disabled = false; }, 15000);
        });
    });

    inp.addEventListener('input', function () {
      var v = inp.value.replace(/[^0-9]/g, '');
      inp.value = v;
      if (v.length < 4) { err.textContent = ''; return; }
      check(v).then(function (ok) {
        if (ok === true) { save(v); reveal(); }
        else if (ok === null) { err.textContent = 'ต่อเน็ตไม่ได้ ลองใหม่'; inp.value = ''; }
        else { err.textContent = 'รหัสไม่ถูก'; inp.value = ''; }
      });
    });
  }

  function start() {
    var saved = readSaved();
    if (!saved) { buildGate(); return; }
    check(saved).then(function (ok) {
      /* 🔑 ต่อเน็ตไม่ได้ = ปล่อยผ่าน ไม่ใช่ล็อกออก
         ครัวใช้เน็ตร้านซึ่งหลุดบ่อย — ล็อกครัวออกจากใบงานตอนเน็ตสะดุด
         อันตรายกว่าปล่อยคนที่เคยผ่านรหัสมาแล้วเข้าดูต่อ */
      if (ok === true || ok === null) reveal();
      else { try { localStorage.removeItem(KEY); } catch (e) {} buildGate(); }
    });
  }

  /* ตาข่ายกันจอดำ: ไม่ว่าเกิดอะไรขึ้น 6 วิแล้วยังไม่ได้คำตอบ = เปิดหน้าให้ทำงานต่อ
     ครัวเน็ตอืดเป็นเรื่องปกติ ปล่อยให้ยืนงงหน้าจอเปล่าไม่ได้ */
  setTimeout(function () {
    if (document.getElementById('u360-gate-hide') && !document.getElementById('u360-gate')) reveal();
  }, 6000);

  function boot() {
    /* ด่านพังเอง (เบราว์เซอร์เก่าไม่มี fetch ฯลฯ) ต้องไม่ลากหน้าทั้งหน้าตายไปด้วย */
    try { start(); } catch (e) { reveal(); }
  }
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();

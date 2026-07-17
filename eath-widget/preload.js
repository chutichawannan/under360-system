const { contextBridge } = require('electron');
const fs = require('fs');
const path = require('path');

const STATUS = path.join(__dirname, 'status.json');
const PROMPT = path.join(__dirname, 'prompt.json');
const CONFIG = path.join(__dirname, 'config.json');
const STALE_MS = 3 * 60 * 1000;   // working ค้างเกิน 3 นาที = ถือว่า idle (กัน agent crash)

contextBridge.exposeInMainWorld('eath', {
  // อ่านสถานะทำงาน/ว่าง
  getStatus() {
    try {
      const st = fs.statSync(STATUS);
      const s = JSON.parse(fs.readFileSync(STATUS, 'utf8'));
      if (s.state === 'working' && (Date.now() - st.mtimeMs) > STALE_MS) return { state: 'idle', stale: true };
      return s;
    } catch (e) { return { state: 'idle' }; }
  },
  // ส่งคำสั่งไปให้เอิธ (เขียนลงไฟล์ให้ watcher เห็น)
  sendPrompt(text) {
    try {
      fs.writeFileSync(PROMPT, JSON.stringify({ text: String(text), ts: Date.now(), done: false }));
      // ตื่นทันทีเป็น feedback (watcher/agent จะเขียน idle ตอนจบ · ถ้าไม่มี watcher stale-check 3 นาทีจะหลับเอง)
      fs.writeFileSync(STATUS, JSON.stringify({ state: 'working', task: 'รับคำสั่ง: ' + String(text).slice(0, 40) }));
      return true;
    } catch (e) { return false; }
  },
  // โหมด Auto (watcher เปิด/ปิด)
  getConfig() {
    try { return JSON.parse(fs.readFileSync(CONFIG, 'utf8')); } catch (e) { return { auto: false }; }
  },
  setAuto(v) {
    try { fs.writeFileSync(CONFIG, JSON.stringify({ auto: !!v })); return true; } catch (e) { return false; }
  }
});

const { contextBridge } = require('electron');
const fs = require('fs');
const path = require('path');

const STATUS = path.join(__dirname, 'status.json');
const STALE_MS = 3 * 60 * 1000;   // working ค้างเกิน 3 นาที = ถือว่า idle (กัน agent crash)

contextBridge.exposeInMainWorld('eath', {
  getStatus() {
    try {
      const st = fs.statSync(STATUS);
      const s = JSON.parse(fs.readFileSync(STATUS, 'utf8'));
      if (s.state === 'working' && (Date.now() - st.mtimeMs) > STALE_MS) {
        return { state: 'idle', stale: true };
      }
      return s;
    } catch (e) {
      return { state: 'idle' };   // ไม่มีไฟล์ = ว่าง
    }
  }
});

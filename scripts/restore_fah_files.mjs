#!/usr/bin/env node
/**
 * กู้ไฟล์สคริปต์ห้องฟ้าจาก origin/main ถ้าหายจากโฟลเดอร์ทำงาน (รันก่อน fah_auto ทุกครั้ง)
 * 16 ก.ย. 2026: ไฟล์ห้องฟ้า 11 ตัวหายจากเครื่อง (ทรีถูกรีเซ็ต) → ตัวตั้งเวลารันแล้วไม่เจอไฟล์
 *   ใบงานครัวไม่ออก และไม่มีใครรู้จนนัทมาทวง · ตัวนี้กู้เฉพาะไฟล์ที่หาย ไม่ทับของที่มีอยู่
 */
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
const ROOT = 'C:/Users/PP/Desktop/under360-system';
const git = a => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 24 });
try {
  git(['fetch', '-q', 'origin']);
  const list = git(['ls-tree', '--name-only', 'origin/main', 'scripts/']).split(String.fromCharCode(10)).filter(f => /fah_/.test(f));
  let back = 0;
  for (const f of list) {
    if (existsSync(ROOT + '/' + f)) continue;
    writeFileSync(ROOT + '/' + f, git(['show', 'origin/main:' + f]));
    console.log('กู้ไฟล์ที่หาย: ' + f); back++;
  }
  if (back) console.log('⚠️ กู้ไฟล์ห้องฟ้าคืนมา ' + back + ' ไฟล์ก่อนเริ่มงาน');
} catch (e) { console.log('⚠️ กู้ไฟล์ไม่สำเร็จ: ' + e.message); }

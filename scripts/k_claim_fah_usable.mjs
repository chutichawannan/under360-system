// ห้อง k จองงาน: ทำฟ้าให้ "ใช้งานได้" จริง (งานที่ 1 ใน docs/BRIEF_K_TRACK.md)
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

// กันจองซ้ำ
const dup = await (await fetch(B + 'work_claims?room=eq.k&status=eq.open&select=task', { headers: H })).json();
console.log('claim ที่เปิดอยู่ของห้อง k:', JSON.stringify(dup));

const r = await fetch(B + 'work_claims', {
  method: 'POST', headers: H,
  body: JSON.stringify({
    task: 'ทำน้องฟ้าให้ "ใช้งานได้" จริง — ลดขั้นที่ต้องใช้มือคนในไปป์ไลน์ใบงานครัวรายวัน',
    room: 'k',
    files: 'kitchen/ · .claude/agents/nong-fah.md · docs/BRIEF_FAH_KITCHEN.md · scripts/ (ของห้อง k เท่านั้น)',
    note: 'เปิดตาม docs/BRIEF_K_TRACK.md งานที่ 1 · รอนัทนิยาม "ใช้งานได้" (ก/ข/ค) ก่อนลงมือสร้าง',
  }),
});
console.log('จองงาน → ' + r.status, await r.text());

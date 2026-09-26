// ⏰ ทวงนัท 10 ต.ค. 2026 — แพคเจจิ๋ว 4 ตัวที่ปิดอยู่ จะเปิดขายไหม
// นัทสั่งเอง 9 ก.ย. 2026: "ทวงอีกทีวันที่ 10 ตุลาคม และให้เจ้าของเรื่องเป็นคนทวงเอง ตั้งเวลาเอง"
// ตั้งด้วย Windows Task Scheduler (ไม่ใช่ตัวตั้งเวลาของแอป — ตาย 34/36 ตัว)
// ตั้งซ้ำ/ลบ:  schtasks /Query /TN "U360_creative_jaypack_remind"
//              schtasks /Delete /TN "U360_creative_jaypack_remind" /F

const K = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8";
const URL = "https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/session_messages";

const text = `⏰ [ครีเอทีฟ → นัท] **ทวงตามที่สั่งไว้ 9 ก.ย. — แพคเจจิ๋ว**

เรื่องอะไร: ในระบบมี "แพคเจจิ๋ว" ทำไว้แล้ว 4 ตัวแต่ปิดอยู่ (รอบ 1 = 9 กล่อง ฿1,440 · รอบ 2 = 12 กล่อง ฿1,920 · รอบ 3 = 9 กล่อง ฿1,440 · เลือกเอง 6 กล่อง ฿960)
ตกลงกันว่ายังไง: 9 ก.ย. นัทสั่งว่า "ทวงอีกทีวันที่ 10 ตุลาคม" — วันนี้ครบกำหนดแล้ว
นัทต้องเคาะอะไร: เปิดทั้ง 4 / เปิดเฉพาะรอบ 1 เป็นตัวลองก่อนซื้อคอร์สเต็ม / ไม่เปิด`;

const rows = [
  { room: "nut", sender: "ครีเอทีฟ", role: "claude", text },
  { room: "ครีเอทีฟ", sender: "ครีเอทีฟ", role: "claude", text },
];

// --dry = เช็คว่ากุญแจ/ตาราง/ข้อความพร้อมจริง โดยไม่ส่งอะไรเข้าบอร์ด (ใช้ทดสอบว่างานตั้งเวลาจะทำงาน)
if (process.argv.includes("--dry")) {
  const probe = await fetch(URL + "?select=id&limit=1", { headers: { apikey: K } });
  console.log("DRY · เชื่อมบอร์ดได้:", probe.status === 200, "· จะส่ง", rows.length, "ห้อง:", rows.map(r => r.room).join(","));
  console.log("ข้อความขึ้นต้นว่า:", text.split("\n")[0]);
  if (probe.status !== 200) process.exitCode = 1;   // ห้ามใช้ process.exit() — node บน Windows โยน assertion ตอน fetch ยังค้าง
}
else {

  const r = await fetch(URL, {
    method: "POST",
    headers: { apikey: K, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(rows),
  });
  console.log(r.status, (await r.text()).slice(0, 200));
  if (!r.ok) process.exitCode = 1;
}

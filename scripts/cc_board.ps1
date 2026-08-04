# cc_board.ps1 — ยิงสถานะบอร์ด Command Center เข้า context ตอนเปิด session ใหม่
# เรียกจาก hook SessionStart (.claude/settings.json)
# เป้า: ทุกห้องเห็น "ใครถืองานอะไรอยู่" ก่อนแตะงาน → กันทำซ้ำ (นัทสั่ง 5 ส.ค. 2026)
# ห้ามพังทั้ง session ถ้าเน็ต/ตารางมีปัญหา -> ทุกอย่างห่อ try/catch เงียบ

$ErrorActionPreference = 'SilentlyContinue'
$OutputEncoding = [Console]::OutputEncoding = [Text.Encoding]::UTF8

$KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8'
$BASE = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1'
$H = @{ apikey = $KEY; Authorization = "Bearer $KEY" }

function Get-Rows($path) {
  try { return @(Invoke-RestMethod -Uri "$BASE/$path" -Headers $H -TimeoutSec 8) } catch { return $null }
}
function Squash($s, $n) {
  if (-not $s) { return '' }
  $t = ($s -replace '\s+', ' ').Trim()
  if ($t.Length -gt $n) { return $t.Substring(0, $n) + '...' }
  return $t
}

Write-Output "=== 📋 บอร์ด Command Center (auto จาก hook · อย่าเชื่อ TODO.md อย่างเดียว) ==="

# --- 1) งานที่ถูกจองอยู่ = ห้ามหยิบซ้ำ ---
$claims = Get-Rows 'work_claims?select=task,room,files,note,updated_at&status=eq.open&order=updated_at.desc&limit=15'
if ($null -eq $claims) {
  Write-Output "[work_claims] ยังไม่มีตาราง — ให้นัทรัน scripts/sql_work_claims.sql ก่อน (ระบบจองงานยังไม่ทำงาน)"
} elseif ($claims.Count -eq 0) {
  Write-Output "[งานที่ถูกจองอยู่] ไม่มี — หยิบงานได้ แต่ต้อง 'จองก่อนทำ' (POST work_claims)"
} else {
  Write-Output "[🔒 งานที่ห้องอื่นถืออยู่ — ห้ามทำซ้ำ ให้ถามเจ้าของแทน]"
  foreach ($c in $claims) {
    $d = if ($c.updated_at) { $c.updated_at.Substring(0, 10) } else { '' }
    Write-Output ("  - [{0}] {1}  (ห้อง {2}{3})" -f $d, (Squash $c.task 70), $c.room, $(if ($c.files) { " · แตะ: " + (Squash $c.files 40) } else { '' }))
  }
}

# --- 2) เวอร์ชัน/สถานะแต่ละแทร็ค ---
$ts = Get-Rows 'track_status?select=*&order=updated_at.desc&limit=14'
if ($ts) {
  $line = ($ts | Where-Object { $_.version } | ForEach-Object { "$($_.version)($($_.status))" }) -join ' '
  if ($line) { Write-Output "[เวอร์ชันแทร็ค] $line" }
}

# --- 3) ความเคลื่อนไหวล่าสุดของทุกห้อง ---
$msgs = Get-Rows 'session_messages?select=room,sender,text,created_at&order=created_at.desc&limit=8'
if ($msgs) {
  Write-Output "[ห้องอื่นเพิ่งทำอะไร]"
  foreach ($m in $msgs) {
    $d = if ($m.created_at) { $m.created_at.Substring(5, 11) } else { '' }
    Write-Output ("  - {0} [{1}] {2}" -f $d, $m.sender, (Squash $m.text 100))
  }
}

Write-Output "=== กติกา 2 ข้อ ==="
Write-Output "1. ก่อนลงมืองานใหม่ -> จองใน work_claims (task/room/files) · เจอคนจองแล้ว = ไม่ทำ"
Write-Output "2. ปิดงานต้องมี evidence จาก DB/ไฟล์จริง (นับได้/เปิดดูได้) ไม่ใช่คำบอกเล่า แล้วค่อยขีด TODO.md"

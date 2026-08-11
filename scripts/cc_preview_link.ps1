# เตือนอัตโนมัติ: push ขึ้น branch ให้นัทเทส = ต้องมีลิงก์ที่กดจากมือถือได้เสมอ
# นัทสั่งเอง 11 ส.ค. 2026: "เอาลิงค์มาเลยทุกครั้ง hook เลย ต่อไปนี้เวลาทำอะไรใน branch แล้วจะให้ฉันเทส ทุกครั้ง แนบลิ้งเสมอ"
# ที่มาของปัญหา: ลิงก์ Preview ของ Vercel สร้างเองจากเครื่องไม่ได้ (ต้องเปิดหน้า Vercel ถึงจะรู้)
#   → นัทเปิดไม่ถูก เลยเทสไม่ได้เลย · ทางแก้คือ copy ไฟล์ไป /preview/ บน main แทน (คนละไฟล์กับของจริง ไม่กระทบใคร)
$ErrorActionPreference = 'SilentlyContinue'
# ต้องตั้ง UTF-8 ทั้งขาอ่านและขาเขียน ไม่งั้นภาษาไทยออกมาเป็นขยะ (PowerShell 5.1 ใช้ codepage เครื่อง)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$raw = [Console]::In.ReadToEnd()
if (-not $raw) { exit 0 }
try { $j = $raw | ConvertFrom-Json } catch { exit 0 }
$cmd = [string]$j.tool_input.command
if (-not $cmd) { exit 0 }

# สนใจเฉพาะตอน push ขึ้น branch (ไม่ใช่ push เข้า main)
if ($cmd -notmatch 'git\s+push') { exit 0 }
if ($cmd -notmatch 'refs/heads/(feature|fix)/') { exit 0 }

$branch = ''
if ($cmd -match 'refs/heads/((?:feature|fix)/[A-Za-z0-9._\-]+)') { $branch = $Matches[1] }

Write-Output @"
[เตือนอัตโนมัติ] เพิ่ง push ขึ้น branch $branch — ถ้างานนี้จะให้นัทเทส **ต้องแนบลิงก์เสมอ**

ห้ามบอกให้นัทไปหาลิงก์ใน Vercel เอง (เปิดไม่ถูก เคยติดมาแล้ว) ทำแบบนี้แทน:
  1) copy ไฟล์ที่จะให้เทส -> preview/<ชื่องาน>.html แล้ว push เข้า main (คนละไฟล์กับของจริง ไม่กระทบแอดมิน/ครัว)
  2) เพิ่มการ์ดในหน้า preview/index.html พร้อมบอกว่าให้กดดูตรงไหน
  3) รอ deploy แล้ว curl เช็คให้ได้ 200 ก่อน แล้วค่อยส่งลิงก์เต็มให้นัท:
     https://under360-system.vercel.app/preview/<ชื่องาน>.html
     https://under360-system.vercel.app/preview   (หน้ารวมของรอเทส)
"@
exit 0

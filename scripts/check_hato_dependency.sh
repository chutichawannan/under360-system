#!/usr/bin/env bash
# ============================================================================
# 🔍 ตรวจว่าระบบยังพึ่ง Hato ตรงไหนบ้าง — รันซ้ำได้เรื่อยๆ
# ----------------------------------------------------------------------------
# ใช้เมื่อ: ก่อน/หลัง Hato cutover (7 ส.ค. 2026) · หรือเมื่อสงสัยว่ามีอะไรพึ่ง Hato อยู่
#   bash scripts/check_hato_dependency.sh
#
# ตรวจ 2 ชั้น เพราะการพึ่ง Hato ซ่อนได้ 2 ที่:
#   ชั้น 1 = โค้ดใน repo (hotlink CDN · LIFF id เก่า · โดเมน hato)
#   ชั้น 2 = ข้อมูลใน DB (URL รูปที่ยังชี้ Hato — โค้ดสะอาดแต่ข้อมูลสกปรกได้)
#
# ⚠️ สิ่งที่สคริปต์นี้ตรวจไม่ได้ (ต้องคนเปิดดูเอง):
#   · ริชเมนู LINE OA — อยู่หลัง login (เครื่องมือ AI เข้าไม่ได้)
#   · ข้อความ broadcast ที่ยิงไปแล้ว — ลิงก์ฝังในข้อความเก่าแก้ไม่ได้
# ============================================================================
set -u
SB="https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1"
KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8"
REF="${1:-origin/main}"
FAIL=0; WARN=0; PASS=0
ok(){   echo "  ✅ $1"; PASS=$((PASS+1)); }
bad(){  echo "  ❌ $1"; FAIL=$((FAIL+1)); }
warn(){ echo "  ⚠️  $1"; WARN=$((WARN+1)); }

echo "🔍 ตรวจการพึ่งพา Hato — โค้ดจาก $REF · ข้อมูลจาก Supabase สด"
echo "════════════════════════════════════════════"

echo "① โค้ดใน repo (ไฟล์ที่ deploy จริง)"
git fetch origin -q 2>/dev/null
n=$(git grep -ilE "hatohub|hatoheart|2005639551" "$REF" -- '*.html' '*.js' 2>/dev/null | wc -l)
[ "$n" -eq 0 ] && ok "ไม่มีไฟล์ไหนอ้างถึง Hato (hatohub / hatoheart / LIFF 2005639551)" \
               || { bad "พบ $n ไฟล์อ้างถึง Hato:"; git grep -ilE "hatohub|hatoheart|2005639551" "$REF" -- '*.html' '*.js' | sed 's/^/     /'; }

echo
echo "② รูปที่ hotlink จาก Hato CDN (อยู่ใน DB ไม่ใช่โค้ด)"
for t in home_layout menu_items packages blog_posts; do
  urls=$(curl -s "$SB/$t?select=*&limit=1000" -H "apikey: $KEY" | grep -oE 'https?://[^"]+' )
  tot=$(echo "$urls" | grep -c . )
  hato=$(echo "$urls" | grep -ciE 'hato' )
  if [ "$hato" -eq 0 ]; then ok "$t — URL $tot รายการ ไม่มีตัวไหนชี้ Hato"
  else bad "$t — พบ $hato URL ชี้ Hato (จาก $tot) ← ต้องย้ายเข้า Storage ก่อน Hato ตาย"
       echo "$urls" | grep -iE 'hato' | head -5 | sed 's/^/     /'
  fi
done

echo
echo "③ ชื่อหมวดที่ลูกค้าเห็น (กันคีย์ดิบโผล่หน้าจอ)"
cats=$(curl -s "$SB/menu_items?select=category&is_available=eq.true&limit=1000" -H "apikey: $KEY" \
       | grep -oE '"category":"[^"]*"' | sed 's/.*:"//;s/"//' | sort -u)
labels=$(curl -s "$SB/kitchen_data?select=data&key=eq.appConfig" -H "apikey: $KEY" \
       | grep -oE '"key": "[^"]+", "color"' | sed 's/"key": "//;s/", "color"//')
missing=""
for c in $cats; do echo "$labels" | grep -qx "$c" || missing="$missing $c"; done
if [ -z "$missing" ]; then ok "ทุกหมวดที่เปิดขายมีชื่อไทยครบ (ไม่มีคีย์ดิบโผล่)"
else warn "หมวดที่ยังไม่มีชื่อ → ลูกค้าจะเห็นคีย์ดิบ:$missing"; fi

echo
echo "════════════════════════════════════════════"
echo " ผ่าน $PASS · เตือน $WARN · ตก $FAIL"
[ "$FAIL" -eq 0 ] && echo " 🎉 ไม่มีอะไรพึ่ง Hato แล้ว — Hato ตายได้โดยระบบไม่กระทบ" \
                  || echo " 🔴 ยังมีของพึ่ง Hato อยู่ — ดูรายการด้านบน"
echo
echo " ⚠️ ยังต้องคนเช็คเอง: ริชเมนู LINE OA (อยู่หลัง login) — ถ้ายังชี้ LIFF 2005639551"
echo "    ลูกค้า ~20,000 คนจะกดสั่งอาหารไม่ได้ทั้งร้าน"

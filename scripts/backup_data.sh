#!/usr/bin/env bash
# Under360 — Data Backup (curl-only · ไม่พึ่ง node/jq · นัทสั่ง 3 ส.ค. 2026)
# ปรัชญา: "ดาต้าลูกค้าสำคัญกว่าระบบ — ถ้าข้อมูลอยู่ ต่อให้ระบบพังก็ถอยไปจดมือได้"
# ดัมพ์ทีละหน้า (raw จาก PostgREST = การันตี JSON ถูก · ไม่ต้อง merge เสี่ยงพัง)
# ใช้:  bash scripts/backup_data.sh [outdir]
#   default = ../under360_backups/YYYY-MM-DD  (นอก repo · ไม่เข้า git)
set -u
SB="https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1"
KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8"
AUTH=(-H "apikey: $KEY" -H "Authorization: Bearer $KEY")
OUT="${1:-../under360_backups/$(date +%F)}"
mkdir -p "$OUT"
# crown jewels ก่อน (ลูกค้า+ออเดอร์) แล้วตามด้วยเมนู/แพคเกจ/โปร
TABLES="customers orders order_items mp_deliveries menu_items packages package_items mp_offer_sets promo_codes home_layout daily_menu_assignments"
echo "📦 Backup -> $OUT"
: > "$OUT/_manifest.txt"
echo "generated_at $(date -u +%FT%TZ)" >> "$OUT/_manifest.txt"
grand=0
for t in $TABLES; do
  total=$(curl -s -D - -o /dev/null "${AUTH[@]}" -H "Prefer: count=exact" "$SB/$t?limit=1" | tr -d '\r' | awk -F/ '/^[Cc]ontent-[Rr]ange:/{print $2}')
  [ -z "${total:-}" ] && total=0
  off=0; n=0
  while [ "$off" -lt "$total" ]; do
    p=$(printf "%03d" "$n")
    curl -s "${AUTH[@]}" "$SB/$t?select=*&limit=1000&offset=$off" > "$OUT/${t}.${p}.json"
    off=$((off+1000)); n=$((n+1))
  done
  echo "  ok ${t}: ${total} rows, ${n} file(s)"
  echo "${t} ${total} ${n}" >> "$OUT/_manifest.txt"
  grand=$((grand+total))
done
echo "DONE -> $OUT · รวม ${grand} แถว"

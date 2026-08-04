#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# เช็คหลังย้าย DNS (Wix → Vercel) — รันซ้ำได้เรื่อยๆ ระหว่างรอ propagate
#   bash scripts/check_after_dns_cutover.sh
# m-track · 5 ส.ค. 2026 · ใช้แค่ curl+grep (ไม่พึ่ง node)
# ═══════════════════════════════════════════════════════════════
PASS=0; FAIL=0; WARN=0
ok(){   echo "  ✅ $1"; PASS=$((PASS+1)); }
bad(){  echo "  ❌ $1"; FAIL=$((FAIL+1)); }
warn(){ echo "  ⚠️  $1"; WARN=$((WARN+1)); }
hdr(){  echo ""; echo "$1"; }

VERCEL_IP="216.198.79.1"
VERCEL_CNAME="vercel-dns"
WIX_IP_PREFIX="185.230.63"

hdr "① DNS ชี้ที่ไหนแล้ว (propagate ~ไม่กี่นาที–1 ชม.)"
A_REC=$(curl -s "https://dns.google/resolve?name=360foodbox.com&type=A" | grep -o '"data":"[0-9.]*"' | sed 's/.*:"//;s/"//' | tr '\n' ' ')
CN_REC=$(curl -s "https://dns.google/resolve?name=www.360foodbox.com&type=CNAME" | grep -o '"data":"[^"]*"' | sed 's/.*:"//;s/"//' | head -1)
echo "     A    = ${A_REC:-(ไม่มี)}"
echo "     CNAME= ${CN_REC:-(ไม่มี)}"
echo "$A_REC" | grep -q "$VERCEL_IP" && ok "A ชี้ Vercel แล้ว" || { echo "$A_REC" | grep -q "$WIX_IP_PREFIX" && warn "A ยังเป็น Wix — ยังไม่ propagate (หรือยังไม่ได้กด)" || bad "A ไม่ตรงทั้ง Vercel/Wix — เช็คค่าที่ใส่"; }
echo "$CN_REC" | grep -q "$VERCEL_CNAME" && ok "CNAME www ชี้ Vercel แล้ว" || { echo "$CN_REC" | grep -q "wixdns" && warn "CNAME ยังเป็น Wix — ยังไม่ propagate" || bad "CNAME ไม่ตรง"; }

hdr "② เว็บเปิดได้ + HTTPS (cert Vercel ออกอัตโนมัติหลัง DNS ถูก)"
CODE=$(curl -sI -m 15 "https://www.360foodbox.com/" -o /dev/null -w "%{http_code}")
[ "$CODE" = "200" ] && ok "https://www.360foodbox.com → 200" || bad "https www → HTTP $CODE (ถ้าเพิ่งกด รอ cert สักครู่)"
APEX=$(curl -sI -m 15 "https://360foodbox.com/" -o /dev/null -w "%{redirect_url}")
echo "$APEX" | grep -q "www.360foodbox.com" && ok "apex → www (canonical ตรงของเดิม SEO ไม่สะดุด)" || warn "apex ยังไม่ redirect ไป www: ${APEX:-ว่าง}"

hdr "③ เว็บใหม่จริงไหม (ไม่ใช่ Wix ค้าง cache)"
BODY=$(curl -s -m 20 "https://www.360foodbox.com/")
echo "$BODY" | grep -q "เข้ากับเป้าหมายของคุณ" && ok "หน้าแรก = เว็บใหม่ (เจอ headline ของเรา)" || bad "หน้าแรกไม่ใช่เว็บใหม่ — อาจยัง cache Wix"
echo "$BODY" | grep -q "3 รูปแบบ" && ok "section สินค้า 3 รูปแบบขึ้นครบ" || warn "ไม่เจอ section 3 รูปแบบ"
echo "$BODY" | grep -q "line.me/R/ti/p/@under360" && ok "CTA ชี้ LINE ร้าน" || bad "CTA ไม่ได้ชี้ LINE!"

# ⚠️ ห้ามใส่ URL ภาษาไทยดิบใน script — Windows terminal จะส่งเป็น ??? (เคยหลงคิดว่า redirect พัง)
#    อ่าน source ที่ percent-encode ไว้แล้วจาก web/vercel.json แทน
VJ="$(dirname "$0")/../web/vercel.json"

hdr "④ redirect ตัวเป็นตัวตาย — riceberry (692 views ≈ 70% ของบล็อก)"
RB_PATH=$(grep -o '"source": "[^"]*"' "$VJ" | sed 's/"source": "//;s/"$//' | grep -i "%E0%B8%82%E0%B9%89%E0%B8%AD%E0%B8%94%E0%B8%B5" | head -1)
if [ -z "$RB_PATH" ]; then bad "หา redirect riceberry ใน vercel.json ไม่เจอ!"; else
  LOC=$(curl -s -m 15 -o /dev/null -w "%{redirect_url}" "https://www.360foodbox.com$RB_PATH")
  if echo "$LOC" | grep -qi "legacy="; then ok "riceberry → ส่ง ?legacy= ต่อ (JS แมปเป็น ?post=riceberry-pros-cons ในเบราว์เซอร์)"
  elif echo "$LOC" | grep -q "riceberry-pros-cons"; then ok "riceberry → เข้าบทความตรง"
  else bad "riceberry ไม่ redirect! ได้: ${LOC:-ว่าง}  ← เจ็บสุด ต้องแก้ทันที"; fi
fi

hdr "⑤ redirect ทั้งหมดใน vercel.json (นับรวม)"
TOT=0; RD=0; MISS=""
while read -r p; do
  [ -z "$p" ] && continue
  case "$p" in *":rest"*|*"*"*) continue;; esac   # ข้าม pattern catch-all
  TOT=$((TOT+1))
  C=$(curl -s -m 15 -o /dev/null -w "%{http_code}" "https://www.360foodbox.com$p")
  if [ "$C" = "301" ] || [ "$C" = "308" ]; then RD=$((RD+1)); else MISS="$MISS\n     - $p → $C"; fi
done <<< "$(grep -o '"source": "[^"]*"' "$VJ" | sed 's/"source": "//;s/"$//')"
[ $RD -eq $TOT ] && ok "redirect ทำงานครบ $RD/$TOT" || { warn "redirect ผ่าน $RD/$TOT (ก่อน DNS ย้าย = 0 ปกติ · Wix ไม่มี redirect พวกนี้)"; printf '%b\n' "$MISS" | head -6; }

hdr "⑥ บล็อกโชว์ครบ 61 บทความ (เคยมีบั๊ก limit 50)"
curl -s -m 15 "https://www.360foodbox.com/blog.html" | grep -q "limit(500)" && ok "โค้ดดึงบทความเพดาน 500 (ครอบ 61)" || warn "ยังเป็นเวอร์ชันเก่า — รอ deploy"

hdr "⑦ Wix ยังอยู่เป็นตาข่าย (ห้ามยกเลิกจนกว่าจะชัวร์)"
echo "     เตือน: อย่าเพิ่งยกเลิก Wix Premium — ถ้าต้องถอย ใส่ค่าเดิมคืนได้:"
echo "       A → 185.230.63.171 / .186 / .107   ·   CNAME www → cdn1.wixdns.net"

echo ""; echo "═══════════════════════════════════"
echo " ผ่าน $PASS · เตือน $WARN · ตก $FAIL"
[ $FAIL -eq 0 ] && [ $WARN -eq 0 ] && echo " 🎉 cutover สมบูรณ์"
[ $FAIL -gt 0 ] && echo " 🔴 มีข้อตก — ดูด้านบน"
[ $FAIL -eq 0 ] && [ $WARN -gt 0 ] && echo " 🟡 ยังไม่ propagate ครบ — รันซ้ำอีก 10-15 นาที"
echo "═══════════════════════════════════"

# Stock integration — 24 September 2026

Branch: gpt/stock-entry
Page: /pwa/ing_stock.html. Assets: /pwa/ing_assets/.
Canonical catalogue: 239 local reviewed items. No mapping to old 302-item dataset.
Each completed round is stored as kitchen_data key ing_count_v1_<uuid>. Insert ignores duplicate keys and verifies by reading back. Local pending rounds retained for retry; historical local rounds are not silently uploaded. Draft stays device-local.
Tests: node scripts/ing/test-sync.mjs (mocked transport; no production count writes). Browser verified 239-item page and successful production history read (empty).
Isolated live database write/readback and independent read passed (see live-check.json). No real inventory count written by testing.
User confirmed no other chat is editing Staff. Added a direct shortcut above the existing room cards.
Proposed link: href="/pwa/ing_stock.html" labelled “นับวัตถุดิบ”, accessible from Staff home, relative URL preserves staff.360foodbox.com. /ing alias can follow separately.
Staff home adds only the shortcut and its CSS. No changes to core files, authentication, roles, or existing stock/recipe tables.
Existing gate is reused; it is not database authorization. No RLS policies were added or changed.

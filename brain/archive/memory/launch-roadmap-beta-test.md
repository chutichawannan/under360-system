---
name: launch-roadmap-beta-test
description: "Sequence after KQ dev finishes — parallel beta test vs Hato, then real launch, customer migration, Facebook integration, AI agents (น้องนิว/น้องฟ้า)"
metadata: 
  node_type: memory
  type: project
  originSessionId: bde8aa49-da42-434a-9109-fde3459291b7
---

Nat's stated plan (2026-07-05) for what comes after `kitchen_queue.html` (KQ) dev work wraps up — she said the dev loop for the storefront + Operation Hub (OH) feels basically done, and KQ is "the last page to dev."

**Sequence, in order:**
1. Finish KQ dev (current focus — see [[kq-order-cards-and-logging]] if it exists, or check CLAUDE.md's KQ section for latest state).
2. **Parallel beta test against Hato** (their existing/legacy system — "เฮโต๊", referenced elsewhere as "ปิด Hato Heart" in the roadmap's v1.0 milestone): admin will manually re-enter real customer orders (that come in through the old system) into the new Under360 system by hand, in parallel, specifically to surface bugs before trusting it for real. Her words: "test ระบบ แบบ paralelle ควบคู่ไปกับ hato แอดมินจะเหนื่อยหน่อย คือ กดออเดอร์ที่ลูกค้าสั่ง ด้วยมือตัวเองลงระบบ เพื่อให้เจอปัญหาไปก่อน แล้วก็แก้ไปเรื่อยๆ"
3. **Real launch** of the new system.
4. **Migrate old customer data** (this is the same long-standing blocker referenced in the Loyalty tier backlog item — she's been saying she needs to migrate legacy data before finalizing the points/tier system; this roadmap confirms migration is a planned phase right after launch, not indefinitely deferred).
5. **Facebook-integration system** (`api/webhook.js` — currently "built, ยังไม่ configure" per CLAUDE.md's file list — this is the phase where that gets finished/wired up).
6. **AI agents** — finally, in order: **น้องนิว** (stock/menu-assignment agent, spec'd in CLAUDE.md's AI Agents section, "ยังไม่คลอดเลย" — hasn't been born/started at all yet) then **น้องฟ้า** (a SECOND AI agent name mentioned for the first time here, 2026-07-05 — no spec given yet, "รอคลอดอยู่" — waiting to be born. Not documented anywhere else. When she brings this up again, ask what น้องฟ้า is supposed to do before designing anything).

**How to apply:** Don't get ahead of this sequence — e.g. don't start Facebook webhook config or AI agent design unless she explicitly signals she's reached that phase. When she mentions being close to done with KQ or asks about "beta test," this roadmap is the context for what happens next. If "น้องฟ้า" comes up again, treat it as a brand-new, unspecced feature — don't assume it's related to น้องนิว or พี่เก่ง.

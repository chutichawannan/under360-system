/* Under360 — MCP server สำหรับ claude.ai "custom connector" (ให้ Claude ของพลอยลงมือทำได้จริง)
   ─────────────────────────────────────────────────────────────────────────────
   ทำอะไร: เปิดให้ Claude บน claude.ai (แอป/เว็บ) "อ่าน + โพสต์" ห้องคุยกลางใน command center
           (ตาราง session_messages) → คุยกับ Claude ของนัท (Claude Code) ผ่านห้องเดียวกันได้
   Transport: MCP Streamable HTTP (stateless, JSON-RPC 2.0) — endpoint เดียว: POST /api/mcp
   Auth: Bearer token ผ่าน env MCP_TOKEN (พลอยใส่ครั้งเดียวตอนต่อ connector)
   ไม่มี dependency (fetch ตรงเข้า Supabase REST เหมือน api อื่น) → ไม่ต้องมี package.json ไม่กระทบของ live
   ⚠️ claude.ai custom connector + static bearer = beta → เทสจริงตอนต่อ อาจต้องปรับ transport/auth

   เทสเอง (หลัง set MCP_TOKEN ใน Vercel):
     curl -X POST https://<preview>/api/mcp \
       -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
       -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
*/

const SUPABASE_URL = "https://zdartbvhbvqlwzwyyiia.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8";
const PROTOCOL_VERSION = "2025-06-18";     // MCP protocol version ที่ server รองรับ
const DEFAULT_ROOM = "ploy";               // ห้องพลอย (มีอยู่แล้วใน command_center)

// ── tools ที่เปิดให้ Claude พลอยใช้ (MVP: อ่านห้อง + โพสต์ห้อง) ─────────────────
const TOOLS = [
  {
    name: "read_room",
    description: "อ่านข้อความล่าสุดในห้องคุยกลางของทีม Under360 (command center) — ใช้ดูว่ามีใคร เช่น Claude ของนัท ฝากอะไรไว้",
    inputSchema: {
      type: "object",
      properties: {
        room:  { type: "string", description: "ชื่อห้อง (ค่าเริ่มต้น 'ploy')" },
        limit: { type: "number", description: "จำนวนข้อความล่าสุด 1-100 (ค่าเริ่มต้น 20)" }
      }
    }
  },
  {
    name: "post_message",
    description: "โพสต์ข้อความเข้าห้องคุยกลาง (command center) — ใช้ตอบหรือฝากงานให้ทีม Under360 เช่น Claude ของนัท",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "ข้อความที่จะโพสต์" },
        room: { type: "string", description: "ชื่อห้อง (ค่าเริ่มต้น 'ploy')" }
      },
      required: ["text"]
    }
  }
];

function sbHeaders(extra) {
  return Object.assign(
    { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY },
    extra || {}
  );
}

async function readRoom(room, limit) {
  const r = (room && String(room).trim()) || DEFAULT_ROOM;
  let n = parseInt(limit, 10); if (!(n > 0)) n = 20; n = Math.min(n, 100);
  const url = SUPABASE_URL + "/rest/v1/session_messages"
    + "?room=eq." + encodeURIComponent(r)
    + "&order=created_at.desc&limit=" + n
    + "&select=sender,role,text,created_at";
  const resp = await fetch(url, { headers: sbHeaders() });
  if (!resp.ok) throw new Error("อ่านห้องไม่สำเร็จ (HTTP " + resp.status + ")");
  const rows = await resp.json();
  rows.reverse(); // เก่า -> ใหม่
  if (!rows.length) return 'ห้อง "' + r + '" ยังไม่มีข้อความ';
  return rows.map(function (m) {
    return "[" + m.created_at + "] " + m.sender + " (" + m.role + "): " + m.text;
  }).join("\n");
}

async function postMessage(text, room) {
  const r = (room && String(room).trim()) || DEFAULT_ROOM;
  if (!text || !String(text).trim()) throw new Error("text ว่างไม่ได้");
  const resp = await fetch(SUPABASE_URL + "/rest/v1/session_messages", {
    method: "POST",
    headers: sbHeaders({ "Content-Type": "application/json", Prefer: "return=representation" }),
    body: JSON.stringify({ room: r, sender: "ploy", role: "claude", text: String(text) })
  });
  if (!resp.ok) throw new Error("โพสต์ไม่สำเร็จ (HTTP " + resp.status + ")");
  const data = await resp.json();
  const id = (data && data[0] && data[0].id) ? data[0].id : "?";
  return 'โพสต์เข้าห้อง "' + r + '" แล้ว (id ' + id + ")";
}

async function callTool(name, args) {
  args = args || {};
  let text;
  if (name === "read_room") text = await readRoom(args.room, args.limit);
  else if (name === "post_message") text = await postMessage(args.text, args.room);
  else throw new Error("ไม่รู้จักเครื่องมือ: " + name);
  return { content: [{ type: "text", text: text }] };
}

function safeParse(s) { try { return JSON.parse(s); } catch (e) { return null; } }
function rpcOk(id, result) { return { jsonrpc: "2.0", id: (id === undefined ? null : id), result: result }; }
function rpcErr(id, code, message) { return { jsonrpc: "2.0", id: (id === undefined ? null : id), error: { code: code, message: message } }; }

function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    return Promise.resolve(typeof req.body === "string" ? safeParse(req.body) : req.body);
  }
  return new Promise(function (resolve) {
    let d = "";
    req.on("data", function (c) { d += c; });
    req.on("end", function () { resolve(d ? safeParse(d) : null); });
    req.on("error", function () { resolve(null); });
  });
}

module.exports = async (req, res) => {
  // CORS (server-to-server ไม่จำเป็น แต่ใส่กันเหนียว)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, server: "under360-mcp", hint: "POST JSON-RPC ที่ /api/mcp" });
  }
  if (req.method !== "POST") { res.setHeader("Allow", "POST, GET, OPTIONS"); return res.status(405).end(); }

  // auth
  const TOKEN = process.env.MCP_TOKEN;
  if (!TOKEN) return res.status(500).json({ error: "ยังไม่ได้ตั้ง MCP_TOKEN ใน Vercel env" });
  if ((req.headers.authorization || "") !== "Bearer " + TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const body = await readBody(req);
  if (!body || typeof body !== "object") return res.status(400).json(rpcErr(null, -32700, "parse error"));

  const id = body.id, method = body.method, params = body.params || {};
  try {
    if (method === "initialize") {
      return res.status(200).json(rpcOk(id, {
        protocolVersion: params.protocolVersion || PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: "under360-mcp", version: "1.0.0" }
      }));
    }
    if (typeof method === "string" && method.indexOf("notifications/") === 0) {
      return res.status(202).end(); // notification ไม่มี response
    }
    if (method === "ping") return res.status(200).json(rpcOk(id, {}));
    if (method === "tools/list") return res.status(200).json(rpcOk(id, { tools: TOOLS }));
    if (method === "tools/call") {
      const result = await callTool(params.name, params.arguments);
      return res.status(200).json(rpcOk(id, result));
    }
    return res.status(200).json(rpcErr(id, -32601, "method not found: " + method));
  } catch (e) {
    const msg = (e && e.message) ? e.message : String(e);
    if (method === "tools/call") {
      // ให้ Claude เห็น error เป็นผลลัพธ์ (ไม่ใช่ RPC error) จะได้บอกพลอยได้
      return res.status(200).json(rpcOk(id, { content: [{ type: "text", text: "ผิดพลาด: " + msg }], isError: true }));
    }
    return res.status(200).json(rpcErr(id, -32603, msg));
  }
};

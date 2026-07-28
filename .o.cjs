const { createClient } = require("@libsql/client");
require("dotenv").config();
const c = createClient({ url: process.env.VITE_TURSO_URL, authToken: process.env.VITE_TURSO_AUTH_TOKEN });
(async () => {
  const o = await c.execute("SELECT id, total, province, items, created_at FROM orders WHERE vendor LIKE 'wills%' ORDER BY id DESC LIMIT 4");
  for (const r of o.rows) {
    const items = JSON.parse(r.items);
    const sub = items.reduce((s,i)=>s + (Number(i.price)||0)*(Number(i.quantity)||1), 0);
    console.log(`#${r.id}  total=$${r.total}  province=${r.province}  computed-subtotal=$${sub.toFixed(2)}  implied-tax=$${(r.total-sub).toFixed(2)} (${((r.total/sub-1)*100).toFixed(2)}%)`);
    items.forEach(i=>console.log(`     ${i.quantity}x ${i.name} @ $${i.price}  (${i.size||''} ${i.color||''})`));
  }
})().catch(e => console.error("ERR", e.message));

import { createClient } from "@libsql/client";
import { config } from "dotenv";
config({ path: new URL("../.env", import.meta.url).pathname });
const V="modernniagara", SKU="MN-12";
const COLORS=["#1a1a18","#6b8bb0"]; // Black, Solace Blue
const IMGS=["/footjoy/womens-black.webp","/footjoy/womens-solaceblue.webp"];
const url=process.env.TURSO_URL||process.env.VITE_TURSO_URL, tok=process.env.TURSO_AUTH_TOKEN||process.env.VITE_TURSO_AUTH_TOKEN;
const db=createClient({url,authToken:tok});
const b=await db.execute({sql:"SELECT colors,img,imgs FROM products WHERE vendor=? AND sku=?",args:[V,SKU]});
console.log("BEFORE:",JSON.stringify(b.rows[0]));
await db.execute({sql:"UPDATE products SET colors=?,img=?,imgs=? WHERE vendor=? AND sku=?",args:[JSON.stringify(COLORS),IMGS[0],JSON.stringify(IMGS),V,SKU]});
console.log("done");

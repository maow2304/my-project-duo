# แนวทางการพัฒนา (Contributing)

คู่มือสั้นๆ สำหรับคนที่มาแก้โค้ดในโปรเจคนี้ ควรอ่านก่อนเริ่มงานทุกครั้ง

## กฎหลัก (Core Rules)

1. **งานทุกอย่างต้องผ่าน `src/api/`** — หน้าจอ/สโตร์ห้ามเดา query เอง
   ทุกหน้าที่เขียน Supabase `.from()/.rpc()` ตรงๆ ต้องย้ายลง api layer ก่อน
2. **ห้ามเรียก Supabase ในคอมโพเนนต์** — Component ใช้ store ซึ่งใช้ api อีกชั้นหนึ่ง
3. **ทั้งหมดเป็น "pure refactor"** — ฟีเจอร์/หน้าตา/ชื่อ route ต้องไม่เปลี่ยน
   (ชื่อ route เป็น key ของ commit/PR แยกผู้เขียน ให้เปิดอภิปรายถ้าต้องเปลี่ยน)
4. **ชิ้นงานประกอบด้วย comments ภาษาไทย** — header ของทุกไฟล์บอกจุดประสงค์
   และคอมเมนต์เฉพาะจุดที่ซับซ้อน
5. **ใช้ import แบบ alias `@/` เสมอ** แทน relative (`./'` / `../`) ตามที่ตั้งไว้ใน `jsconfig.json`

## โครงสร้างไฟล์ (เรียกได้ว่าริม "ทำอะไรที่ไหน")

| โฟลเดอร์ | หน้าที่ |
|---|---|
| `web/src/api/` | ติดต่อ Supabase ทั้งหมด (query, FK embed, RPC, storage) — คืนข้อมูลดิบ |
| `web/src/stores/` | Pinia store: ถือ state + เรียก api — ห้าม query เอง |
| `web/src/components/ui/` | Components UI ใช้ซ้ำ ไม่ผูกกับธุรกิจ (เช่น QuantityStepper) |
| `web/src/components/` | Components กลางที่ผูกกับธุรกิจ (Navbar, ChatRoom, ProductCard...) |
| `web/src/views/` | หน้าเว็บ — จัด layout + ส่ง props/ฟัง event จาก components |
| `web/src/lib/` | supabase client, constants, helpers บริสุทธิ์ (formatTHB, formatDate, toast) |

## วิธีเริ่ม project

```bash
cd web
npm install
npm run dev        # เปิด http://localhost:5173
```

## ตรวจให้ครบก่อนส่งงาน

```bash
npm run build      # ต้องผ่าน + ไม่มี warning
```

และลองเดิน flow หลักอย่างน้อยหนึ่งรอบผ่าน browser dev:
ล็อกอิน → เพิ่มสินค้าในตะกร้า → สั่งซื้อ → (ฝั่ง seller) เห็นออเดอร์ + แชทตอบกลับ

## ข้อควรระวัง (ที่เคยพลาดมาแล้ว)

- **ระวัง shadowing ชื่อ import กับ function ใน store** — ถ้า store import `updateProfile`
  แล้วประกาศ function ชื่อเดียวกัน ตัวที่ call เหมือนกันจะเรียกตัวเอง (infinite recursion หรือ stack overflow)
  ให้ใช้ alias import เช่น `updateProfile as updateProfileApi` เสมอ
- **Template attribute ห้ามใส่ backtick + เครื่องหมายคำพูดซ้อน** ตรงๆ เช่น
  `:message="deleting ? \`..."\"\..."\` : ''"` — complier ของ Vue/rollup จะตี break
  ให้ย้ายค่าซับซ้อนไปเป็น computed ใน `<script>` แทน
- **ทุก SFC ต้องมี `<script setup>`** — ไฟล์ที่ขึ้นต้นด้วย comment อาจลืม tag เปิดจนได้ "Invalid end tag"

## Commit / Push

- ดู `docs/plan.md` ว่าเฟสไหนเป็นของใคร แล้วตั้ง `user.name/email` ของผู้เขียนคนนั้นก่อน commit
- ตัวอย่าง commit message: `refactor: extract api layer for products module`

## เชื่อมต่อ Supabase จริง

เห็น `web/.env` (ชี้ `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`) และรัน
`supabase/migrations/*.sql` ตามลำดับที่จำเป็นก่อนถึงจะเห็นข้อมูลจริง — ตารางทั้งหมดมี RLS คนละบทบาทเห็นข้อมูลเฉพาะของตัวเอง
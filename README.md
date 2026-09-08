# UP Cloth Market

เว็บซื้อขายเสื้อผ้าสำหรับนิสิตมหาวิทยาลัยพะเยา — กลุ่ม "ไม่ใส่กุ้ง" (รายวิชา 227202)

- Frontend: Vue 3 + Vite + Vue Router + Pinia + Tailwind CSS v4
- Backend/DB: Supabase (PostgreSQL + Auth + Storage + Realtime)
- ผู้ใช้ 2 บทบาท: **ผู้ซื้อ (Buyer)** และ **ผู้ขาย (Seller)** พร้อมหน้าตาแยกกัน

---

## โครงสร้าง

```
web/                      ← Vue app
  src/
    components/           ← components กลาง (Navbar, ProductCard, ChatRoom...)
    views/                ← หน้าเว็บ (auth / buyer / seller)
    stores/               ← Pinia: auth, cart, chat, notification
    lib/                  ← supabase client, format, toast
supabase/migrations/      ← SQL: schema, seed, storage, rpc (รันตามลำดับ)
docs/                     ← plan.md, สรุปสิ่งที่จะทำ.md
```

## วิธีติดตั้ง

### 1. ตั้งค่า Supabase (ครั้งเดียว)

1. เข้า [supabase.com](https://supabase.com) → New project
2. ในโปรเจคเปิด **SQL Editor** แล้วรันไฟล์ตามลำดับ:
   - `supabase/migrations/0001_schema.sql` — ตาราง + RLS + triggers
   - `supabase/migrations/0002_seed.sql` — บัญชีทดลอง + ข้อมูลตัวอย่าง
   - `supabase/migrations/0003_storage.sql` — bucket รูปสินค้า `product-images`
   - `supabase/migrations/0004_rpc.sql` — ฟังก์ชัน `place_order`
3. **Auth → Providers → Email**: ปิด "Confirm email" (เพื่อให้สมัครแล้วเข้าสู่ระบบได้ทันที) — *ไม่บังคับ แต่แนะนำ*
4. **Realtime**: บนตาราง `messages` และ `notifications` เปิด Realtime ไว้ (ค่าเริ่มต้นของ Supabase เปิดให้อยู่แล้ว)
5. ใส่ value ใน `web/.env`:
   ```
   VITE_SUPABASE_URL=https://<ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon public key>
   ```

### 2. รันเว็บ (local dev)

```bash
cd web
npm install
npm run dev
```

เปิด `http://localhost:5173`

### 3. สร้าง production build

```bash
npm run build
npm run preview
```

---

## บัญชีทดลอง (จาก seed)

| ประเภท | อีเมล | รหัสผ่าน |
|---|---|---|
| ผู้ขาย 1 | seller01@upmarket.local | sell1234 |
| ผู้ขาย 2 | seller02@upmarket.local | sell2345 |
| ... | seller03~05@upmarket.local | sell3456 / sell4567 / sell5678 |
| ผู้ซื้อ 1 | buyer01@upmarket.local | pass1234 |
| ผู้ซื้อ 2 | buyer02@upmarket.local | pass2345 |
| ... | buyer03~05@upmarket.local | pass3456 / pass4567 / pass5678 |

> หมายเหตุ: `@upmarket.local` เป็นโดเมนสมมติใน seed (ไม่ต้องยืนยันอีเมลจริง)

---

## ฟีเจอร์หลัก

**ผู้ซื้อ:** ค้นหา/กรองสินค้า, ดูรายละเอียด + เลือกสี/ไซส์/จำนวน, ตะกร้า, สั่งซื้อ (RPC ลดสต็อกอัตโนมัติ), ประวัติ + สถานะออเดอร์, แชทกับผู้ขาย, การแจ้งเตือน (Realtime)

**ผู้ขาย (Dashboard UI):** สถิติร้านค้า, CRUD สินค้า + อัปรูป, จัดการคำสั่งซื้อ/เปลี่ยนสถานะ (แจ้งเตือนผู้ซื้ออัตโนมัติ), แชทกับลูกค้า, การแจ้งเตือน

**ความปลอดภัย:** RLS ทั้ง 10 ตาราง — แต่ละบทบาทเข้าถึงได้เฉพาะข้อมูลของตนเอง

## ข้อจำกัด (Out of Scope)

Admin, ชำระเงินจริง, จัดส่ง/ติดตามพัสดุ, รีวิวสินค้า, แนะนำสินค้าอัตโนมัติ

## เอกสารอ้างอิง

- `docs/plan.md` — แผนพัฒนา 8 เฟส + checklist
- `docs/สรุปสิ่งที่จะทำ.md` — สรุปฉบับสั้น
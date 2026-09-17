# คู่มือ Deploy ขึ้น Vercel (สำหรับให้คนอื่นเทส)

เอกสารนี้อธิบายแบบทีละขั้น ตั้งแต่ต้นจนได้ลิงก์แชร์ให้เพื่อน ไม่ต้องมีพื้นฐานเทคนิคก็ทำได้

## ภาพรวม (คิดง่ายๆ)

- **เว็บเรา** = บ้าน · **Supabase** = ตู้เซฟที่เก็บข้อมูล
- ตอนนี้เว็บอยู่แค่ในเครื่องเรา ใครก็เข้าไม่ได้ → เราจะ **ฝากเว็บไว้บน Vercel** (บริการฝากเว็บฟรี) แล้วได้ลิงก์มาแชร์
- **Environment Variables** = กระดาษโน้ต 2 บรรทัด บอกเว็บว่า "ตู้เซฟอยู่ที่ไหน + กุญแจคืออะไร" ต้องแปะตอนฝากเว็บ ไม่งั้นเว็บจะต่อฐานข้อมูลไม่ได้

## สิ่งที่ต้องมี

- บัญชี GitHub (repo อยู่ที่ `https://github.com/maow2304/my-project-duo`)
- บัญชี Vercel (สมัครฟรีด้วยปุ่ม "Continue with GitHub")
- ค่า 2 ตัวจากไฟล์ `web/.env`:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY` (สตริงยาวๆ ขึ้นต้น `eyJ...`)
- รัน migration ใน Supabase ให้ถึง `supabase/migrations/0005_product_variants.sql` ก่อน deploy
  (ถ้าเว็บมีระบบตัวเลือกไซส์/สีแล้วแต่ฐานข้อมูลยังไม่มีตาราง `product_variant` หน้าเว็บจะพัง)

> หมายเหตุ: `VITE_SUPABASE_ANON_KEY` เป็น **คีย์สาธารณะ** ใช้ฝั่งเว็บอยู่แล้ว ปลอดภัยที่จะใส่ใน Vercel
> แต่ **ห้ามใช้ `service_role` key เด็ดขาด** เพราะเป็นคีย์ลับที่มีสิทธิ์เต็ม

---

## ขั้นตอนที่ 1 — เซฟโค้ดขึ้น GitHub ก่อน

โค้ดที่แก้ล่าสุดต้องขึ้น GitHub ก่อน ถ้าไม่ เว็บที่ deploy จะเป็นของเก่า

- ถ้าใช้ VS Code: Source Control (`Ctrl+Shift+G`) → พิมพ์ข้อความ commit → **✓ Commit** → **Sync Changes**
- ถ้าใช้ command line:
  ```powershell
  $env:Path = "C:\Program Files\Git\cmd;$env:Path"
  git add -A
  git commit -m "feat: กันข้อมูลผิดรูป + validate ช่องกรอกทุกฟอร์ม + คู่มือ deploy"
  git push
  ```

## ขั้นตอนที่ 2 — เข้า Vercel

1. เปิด https://vercel.com
2. กด **Sign up / Log in**
3. เลือก **Continue with GitHub** (ใช้บัญชี GitHub เดิม ไม่ต้องสมัครใหม่)

## ขั้นตอนที่ 3 — เลือกโปรเจกต์

1. กด **Add New... → Project**
2. หาชื่อ repo `my-project-duo` → กด **Import**

## ขั้นตอนที่ 4 — บอก Vercel ว่าเว็บอยู่โฟลเดอร์ไหน

- ในช่อง **Root Directory** กด **Edit** แล้วเลือกโฟลเดอร์ **`web`**
  (โค้ดเว็บอยู่ใน `web/` ไม่ใช่ราก repo)
- ที่เหลือปล่อยค่าเดิมได้เลย เพราะ Vercel ตรวจเจอ Vite เอง:
  - Framework Preset = `Vite`
  - Build Command = `npm run build`
  - Output Directory = `dist`

> ไฟล์ `web/vercel.json` ตั้งค่าเหล่านี้ไว้ให้แล้ว (รวม SPA fallback กันหน้าเว็บพังเวลารีเฟรช path ลึก)

## ขั้นตอนที่ 5 — ใส่ Environment Variables (สำคัญสุด)

กดหัวข้อ **Environment Variables** แล้วเพิ่ม 2 ตัว (ติ๊กทั้ง Production และ Preview):

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://yneuoeyuvxfemavsrpci.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | คัดลอกจาก `web/.env` บรรทัดที่ 2 |

วิธีคัดลอก: เปิดไฟล์ `web/.env` → เลือกข้อความหลังเครื่องหมาย `=` บรรทัดที่ 2 → คัดลอก → วาง

## ขั้นตอนที่ 6 — Deploy

1. กดปุ่ม **Deploy**
2. รอ 1–2 นาที จะได้ลิงก์ เช่น `https://my-project-duo.vercel.app`
3. เปิดลิงก์ดู ถ้าเห็นหน้าเว็บ = สำเร็จ

## ขั้นตอนที่ 7 — บอก Supabase ให้รู้จักลิงก์ใหม่

1. เข้า Supabase → **Authentication** → **URL Configuration**
2. ช่อง **Site URL** ใส่ลิงก์จาก Vercel
3. ช่อง **Redirect URLs** กด Add ใส่ลิงก์เดียวกัน → Save

## ขั้นตอนที่ 8 — ส่งให้เพื่อนเทส

- ส่งลิงก์ Vercel ให้เพื่อน เปิดได้เลย
- บัญชีทดลอง (ถ้ารัน `supabase/migrations/0002_seed.sql` แล้ว):

  | ประเภท | อีเมล | รหัสผ่าน |
  |---|---|---|
  | ผู้ขาย 1 | seller01@upmarket.local | sell1234 |
  | ผู้ซื้อ 1 | buyer01@upmarket.local | pass1234 |

  > ถ้าเข้าไม่ได้ แปลว่ายังไม่ได้รัน `0002_seed.sql` ให้เข้า Supabase → SQL Editor แล้วรันไฟล์นั้นก่อน

---

## อัปเดตเว็บครั้งต่อไป

แก้โค้ด → commit + push ขึ้น GitHub → Vercel จะ deploy ให้อัตโนมัติ ไม่ต้องกดอะไรอีก

## ข้อควรระวัง

- **คนเทสทุกคนใช้ Supabase โปรเจกต์เดียวกัน** → มีข้อมูลจริงปนกัน ถ้าอยากสะอาดให้ใช้บัญชีทดลองจาก seed หรือแยกโปรเจกต์ Supabase สำหรับเดโม
- อย่า commit ไฟล์ `web/.env` ขึ้น GitHub (ถูก `.gitignore` ไว้แล้ว) — ค่าจริงให้ใส่ใน Vercel เท่านั้น
- โปรเจกต์ Supabase ฟรีจะถูก **pause ถ้าไม่มีการใช้งานหลายวัน** ถ้าเว็บต่อข้อมูลไม่ได้ให้เข้า Supabase กด Restore

## ทางเลือกสำหรับคนที่อยู่ Wi-Fi เดียวกัน (ไม่ต้อง deploy)

รัน `npm run dev` ในโฟลเดอร์ `web` (ตั้ง `host: true` ไว้แล้ว) แล้วให้เครื่องอื่นเปิด
`http://<ไอพีเครื่องเรา>:5173` — หาไอพีได้จากคำสั่ง `ipconfig` (ดู IPv4 Address)
วิธีนี้ใช้ได้เฉพาะวงเน็ตเดียวกัน และเครื่องเราต้องเปิดอยู่

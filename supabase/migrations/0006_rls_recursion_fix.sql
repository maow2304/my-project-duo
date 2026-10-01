-- UP Cloth Market — แก้วงจร RLS ระหว่าง orders <-> order_item (error 42P17)
-- สาเหตุ: policy "order_item buyer ..." อ้างตาราง orders ตรง ๆ
-- ส่วน policy "orders seller ..." ก็อ้างกลับมาที่ order_item
-- ทำให้ประเมิน policy วนกันไม่รู้จบ ผู้ขายดูหน้าออเดอร์ไม่ได้
-- วิธีแก้: ใช้ฟังก์ชัน security definer เช็กเจ้าของออเดอร์โดยข้าม RLS
-- (auth.uid() ยังเป็นของผู้เรียกเหมือนเดิม) แล้วให้ policy เรียกฟังก์ชันแทน
-- Run AFTER 0005_product_variants.sql (รันซ้ำได้)

-- ============================================================================
-- helper: เป็นออเดอร์ของตัวเองหรือไม่ (ข้าม RLS อย่างปลอดภัย)
-- ============================================================================

create or replace function public.is_own_order(p_order_id int)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.orders o
    where o.order_id = p_order_id and o.buyer_id = auth.uid()
  );
$$;

revoke all on function public.is_own_order(int) from public;
grant execute on function public.is_own_order(int) to authenticated, anon;

-- ============================================================================
-- order_item: ฝั่งผู้ซื้อเลิกอ้างตาราง orders ตรง ๆ (ใช้ helper แทน)
-- ฝั่งผู้ขายอ้างแค่ product ซึ่งปลอดภัยอยู่แล้ว ไม่ต้องแตะ
-- ============================================================================

drop policy if exists "order_item buyer select" on public.order_item;
create policy "order_item buyer select" on public.order_item
  for select using (public.is_own_order(order_id));

drop policy if exists "order_item buyer insert" on public.order_item;
create policy "order_item buyer insert" on public.order_item
  for insert with check (public.is_own_order(order_id));

-- หมายเหตุ: policy "orders seller select/update" เดิมอ้าง order_item ได้อย่างปลอดภัยแล้ว
-- เพราะฝั่ง order_item ไม่มีการวนกลับเข้าตาราง orders อีกต่อไป

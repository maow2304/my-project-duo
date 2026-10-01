-- UP Cloth Market — สายสถานะออเดอร์ใหม่ + แจ้งเตือนผู้ซื้อตอนสั่ง
-- สายเดิม: Pending -> Paid -> Shipped -> Delivered (มีคำว่า "ชำระแล้ว" ทั้งที่ไม่มีระบบจ่ายเงิน)
-- สายใหม่: Pending (รอดำเนินการ) -> Preparing (จัดเตรียมสินค้า)
--          -> Shipped (จัดส่งแล้ว) -> Delivered (ส่งมอบแล้ว)
-- Run AFTER 0007_order_shipping_address.sql (รันซ้ำได้)

-- ============================================================================
-- 1) เปลี่ยน check constraint ของ status + ย้ายข้อมูลเก่า Paid -> Preparing
-- ============================================================================

alter table public.orders drop constraint if exists orders_status_check;

-- ออเดอร์เก่าที่ค้างสถานะ Paid ให้กลายเป็น Preparing (ขั้นถัดไปในสายใหม่)
update public.orders set status = 'Preparing' where status = 'Paid';

alter table public.orders
  add constraint orders_status_check
  check (status in ('Pending', 'Preparing', 'Shipped', 'Delivered'));

-- ============================================================================
-- 2) แจ้งเตือนผู้ซื้อตอน "บันทึกคำสั่งซื้อ" + ข้อความสถานะเป็นภาษาไทย
--    (เดิมมีแค่: ผู้ขายได้ "มีออเดอร์ใหม่" / ผู้ซื้อได้ notice ตอนเปลี่ยนสถานะเป็นอังกฤษดิบ)
-- ============================================================================

create or replace function public.notify_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_label text;
begin
    if tg_table_name = 'order_item' then
        insert into public.notifications (user_id, type, title, content)
        select p.seller_id, 'order', 'มีออเดอร์ใหม่',
               'มีคำสั่งซื้อ #' || new.order_id || ' สำหรับสินค้า ' || p.product_name
        from public.product p
        where p.product_id = new.product_id;
        return new;
    elsif tg_table_name = 'orders' then
        if TG_OP = 'INSERT' then
            -- ผู้ซื้อกดสั่งซื้อสำเร็จ: บันทึกคำสั่งซื้อ + สถานะเริ่มต้น
            insert into public.notifications (user_id, type, title, content)
            values (new.buyer_id, 'order_placed',
                    'บันทึกคำสั่งซื้อ #' || new.order_id || ' แล้ว',
                    'คำสั่งซื้อของคุณถูกบันทึกแล้ว สถานะปัจจุบัน: รอดำเนินการ');
            return new;
        elsif old.status is distinct from new.status then
            v_label := case new.status
                when 'Pending' then 'รอดำเนินการ'
                when 'Preparing' then 'จัดเตรียมสินค้า'
                when 'Shipped' then 'จัดส่งแล้ว'
                when 'Delivered' then 'ส่งมอบแล้ว'
                else new.status
            end;
            insert into public.notifications (user_id, type, title, content)
            values (new.buyer_id, 'order_status',
                    'สถานะคำสั่งซื้อ #' || new.order_id || ' อัปเดต',
                    'สถานะเปลี่ยนเป็น ' || v_label);
            return new;
        end if;
    end if;
    return new;
end;
$$;

-- trigger เดิม (update สถานะ) ยังใช้ฟังก์ชันเวอร์ชันใหม่นี้ต่อได้เลย
drop trigger if exists trg_orders_insert_notify on public.orders;
create trigger trg_orders_insert_notify
after insert on public.orders
for each row execute function public.notify_user();

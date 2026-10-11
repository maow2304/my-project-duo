-- UP Cloth Market — แจ้งเตือนเมื่อมีข้อความแชทใหม่ + ลิงก์เข้าห้อง
-- Run AFTER 0008_order_status_pipeline.sql (รันซ้ำได้)
-- ที่มา: เดิมไม่มีอะไรสร้าง notification ตอนแชทเลย ผู้ขายไม่รู้ว่าลูกค้าทักมาจนกว่าจะเปิดห้องดูเอง
-- วิธีนี้เก็บแจ้งเตือนลง DB จึงเห็นย้อนหลังได้แม้ตอนนั้นไม่ได้เปิดเว็บค้างไว้

-- ============================================================================
-- 1) คอลัมน์ลิงก์ปลายทาง (เก็บ conversation_id สำหรับแจ้งเตือนแชท)
-- ============================================================================

alter table public.notifications add column if not exists link text;

-- ============================================================================
-- 2) ขยาย notify_user() รองรับข้อความแชท (สาขาเดิมไม่แตะ)
-- ============================================================================

create or replace function public.notify_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_label text;
  v_buyer uuid;
  v_seller uuid;
  v_name text;
  v_to uuid;
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
    elsif tg_table_name = 'messages' then
        -- มีข้อความใหม่: แจ้ง "อีกฝ่าย" (ไม่ใช่คนส่ง) พร้อมลิงก์เข้าห้อง
        select c.buyer_id, c.seller_id into v_buyer, v_seller
        from public.conversations c
        where c.id = new.conversation_id;
        if not found then
            return new;
        end if;
        if new.sender_id = v_buyer then
            v_to := v_seller;
            select b.name into v_name from public.buyer b where b.buyer_id = new.sender_id;
            v_name := coalesce(v_name, 'ผู้ซื้อ');
        else
            v_to := v_buyer;
            select s.name into v_name from public.seller s where s.seller_id = new.sender_id;
            v_name := coalesce(v_name, 'ผู้ขาย');
        end if;
        -- กันกรณีผู้ส่งไม่ใช่คู่สนทนา (ไม่ควรเกิดเพราะ RLS แต่กันไว้)
        if v_to is null then
            return new;
        end if;
        insert into public.notifications (user_id, type, title, content, link)
        values (v_to, 'chat',
                'ข้อความใหม่จาก ' || v_name,
                left(new.content, 120),
                new.conversation_id::text);
        return new;
    end if;
    return new;
end;
$$;

drop trigger if exists trg_messages_notify on public.messages;
create trigger trg_messages_notify
after insert on public.messages
for each row execute function public.notify_user();

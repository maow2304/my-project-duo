-- UP Cloth Market — เก็บที่อยู่จัดส่งตอนสั่งซื้อ (snapshot ลงออเดอร์)
-- Run AFTER 0006_rls_recursion_fix.sql (รันซ้ำได้)
-- ที่อยู่เป็นของแถว buyer แต่ต้อง snapshot ไว้ เพราะผู้ซื้ออาจเปลี่ยนที่อยู่ทีหลัง
-- ออเดอร์เก่าที่ไม่มีที่อยู่ให้ fallback ไปอ่าน buyer.address ตอนแสดงผล

-- ============================================================================
-- 1) คอลัมน์ที่อยู่บน orders
-- ============================================================================

alter table public.orders add column if not exists shipping_address text;

-- ============================================================================
-- 2) ผู้ขายอ่านชื่อ/ที่อยู่ของลูกค้าที่สั่งสินค้าตัวเองได้ (ใช้แสดงที่อยู่จัดส่ง)
--    (เดิม buyer มีแค่ "read own" ทำให้ join buyer จากฝั่งผู้ขายได้ null เสมอ)
-- ============================================================================

drop policy if exists "buyer read by seller" on public.buyer;
create policy "buyer read by seller" on public.buyer
  for select using (
    exists (
      select 1 from public.orders o
      join public.order_item oi on oi.order_id = o.order_id
      join public.product p on p.product_id = oi.product_id
      where o.buyer_id = buyer.buyer_id
        and p.seller_id = auth.uid()
    )
  );

-- ============================================================================
-- 3) place_order รับที่อยู่ (พารามิเตอร์มี default โค้ดเก่าที่ส่ง 2 ตัวจึงยังเรียกได้)
-- ============================================================================

-- ลบ overload เก่าออกก่อนเพื่อกันสับสน (ของใหม่มี default รับ 2-3 args ได้หมด)
drop function if exists public.place_order(uuid, jsonb);

create or replace function public.place_order(p_buyer_id uuid, p_items jsonb, p_shipping_address text default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id int;
  v_item jsonb;
  v_product record;
  v_variant record;
  v_variant_id int;
  v_qty int;
  v_price numeric;
begin
  insert into public.orders (buyer_id, total_amount, status, shipping_address)
  values (p_buyer_id, 0, 'Pending', nullif(p_shipping_address, ''))
  returning order_id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;

    select * into v_product
    from public.product
    where product_id = (v_item->>'product_id')::int
    for update;

    if not found then
      raise exception 'ไม่พบสินค้า product %', (v_item->>'product_id');
    end if;

    v_variant_id := case
      when nullif(v_item->>'variant_id', '') is null then null
      else (v_item->>'variant_id')::int
    end;

    if v_variant_id is not null then
      -- เส้นทางใหม่: ตัดสต็อกแยกตามตัวเลือก
      select * into v_variant
      from public.product_variant
      where variant_id = v_variant_id
      for update;

      if not found then
        raise exception 'ไม่พบตัวเลือกสินค้า %', v_variant_id;
      end if;
      if v_variant.product_id <> v_product.product_id then
        raise exception 'ตัวเลือกสินค้าไม่ตรงกับสินค้า';
      end if;
      if v_variant.quantity < v_qty then
        raise exception 'สินค้า "%" (%s/%s) มีสต็อกไม่เพียงพอ',
          v_product.product_name, v_variant.size, v_variant.color;
      end if;

      v_price := v_product.price;

      insert into public.order_item (order_id, product_id, variant_id, quantity, price, color, size, subtotal)
      values (
        v_order_id,
        v_product.product_id,
        v_variant.variant_id,
        v_qty,
        v_price,
        v_variant.color,
        v_variant.size,
        v_qty * v_price
      );

      update public.product_variant
      set quantity = v_variant.quantity - v_qty
      where variant_id = v_variant.variant_id;
      -- trigger trg_refresh_product_quantity จะปรับยอดรวม product.quantity ให้เอง
    else
      -- เส้นทางเดิม: สินค้าที่ไม่มี variant (ข้อมูลเก่า)
      if v_product.quantity < v_qty then
        raise exception 'สินค้า "%" มีสต็อกไม่เพียงพอ', v_product.product_name;
      end if;

      v_price := v_product.price;

      insert into public.order_item (order_id, product_id, quantity, price, color, size, subtotal)
      values (
        v_order_id,
        v_product.product_id,
        v_qty,
        v_price,
        nullif(v_item->>'color', ''),
        nullif(v_item->>'size', ''),
        v_qty * v_price
      );

      update public.product
      set quantity = v_product.quantity - v_qty
      where product_id = v_product.product_id;
    end if;
  end loop;

  update public.orders
  set total_amount = coalesce(
    (select sum(subtotal) from public.order_item where order_id = v_order_id), 0
  )
  where order_id = v_order_id;

  return v_order_id;
end;
$$;

revoke all on function public.place_order(uuid, jsonb, text) from public;
grant execute on function public.place_order(uuid, jsonb, text) to authenticated;

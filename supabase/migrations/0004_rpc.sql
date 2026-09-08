-- UP Cloth Market — RPC: place_order (atomic, server-side, bypasses product RLS for stock decrement)
-- Run AFTER 0001_schema.sql

create or replace function public.place_order(p_buyer_id uuid, p_items jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id int;
  v_item jsonb;
  v_product record;
  v_qty int;
  v_price numeric;
begin
  insert into public.orders (buyer_id, total_amount, status)
  values (p_buyer_id, 0, 'Pending')
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
  end loop;

  update public.orders
  set total_amount = coalesce(
    (select sum(subtotal) from public.order_item where order_id = v_order_id), 0
  )
  where order_id = v_order_id;

  return v_order_id;
end;
$$;

revoke all on function public.place_order(uuid, jsonb) from public;
grant execute on function public.place_order(uuid, jsonb) to authenticated;
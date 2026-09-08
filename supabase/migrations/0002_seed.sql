-- UP Cloth Market — seed data (auth users + sample business data)
-- Run AFTER 0001_schema.sql
-- Demo accounts can log in with email + password shown at the bottom.

create extension if not exists pgcrypto;

-- ============================================================================
-- AUTH USERS (seller + buyer demo accounts, fixed UUIDs matching public tables)
-- ============================================================================

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'seller01@upmarket.local', crypt('sell1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"ABC Shop"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'seller02@upmarket.local', crypt('sell2345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Fashion Store"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'seller03@upmarket.local', crypt('sell3456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Tech Shop"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'seller04@upmarket.local', crypt('sell4567', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Home Store"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'seller05@upmarket.local', crypt('sell5678', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Sport Shop"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'buyer01@upmarket.local', crypt('pass1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Somchai Jaidee"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'buyer02@upmarket.local', crypt('pass2345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Somsak Dee"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'buyer03@upmarket.local', crypt('pass3456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Suda Wong"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'buyer04@upmarket.local', crypt('pass4567', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Nida Smith"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'buyer05@upmarket.local', crypt('pass5678', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Anan Kong"}', now(), now())
on conflict (id) do nothing;

-- ============================================================================
-- AUTH IDENTITIES (required by GoTrue for login)
-- ============================================================================

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) values
  (gen_random_uuid(), '10000000-0000-4000-8000-000000000001', jsonb_build_object('sub','10000000-0000-4000-8000-000000000001','email','seller01@upmarket.local'), 'email', '10000000-0000-4000-8000-000000000001', now(), now(), now()),
  (gen_random_uuid(), '10000000-0000-4000-8000-000000000002', jsonb_build_object('sub','10000000-0000-4000-8000-000000000002','email','seller02@upmarket.local'), 'email', '10000000-0000-4000-8000-000000000002', now(), now(), now()),
  (gen_random_uuid(), '10000000-0000-4000-8000-000000000003', jsonb_build_object('sub','10000000-0000-4000-8000-000000000003','email','seller03@upmarket.local'), 'email', '10000000-0000-4000-8000-000000000003', now(), now(), now()),
  (gen_random_uuid(), '10000000-0000-4000-8000-000000000004', jsonb_build_object('sub','10000000-0000-4000-8000-000000000004','email','seller04@upmarket.local'), 'email', '10000000-0000-4000-8000-000000000004', now(), now(), now()),
  (gen_random_uuid(), '10000000-0000-4000-8000-000000000005', jsonb_build_object('sub','10000000-0000-4000-8000-000000000005','email','seller05@upmarket.local'), 'email', '10000000-0000-4000-8000-000000000005', now(), now(), now()),
  (gen_random_uuid(), '20000000-0000-4000-8000-000000000001', jsonb_build_object('sub','20000000-0000-4000-8000-000000000001','email','buyer01@upmarket.local'), 'email', '20000000-0000-4000-8000-000000000001', now(), now(), now()),
  (gen_random_uuid(), '20000000-0000-4000-8000-000000000002', jsonb_build_object('sub','20000000-0000-4000-8000-000000000002','email','buyer02@upmarket.local'), 'email', '20000000-0000-4000-8000-000000000002', now(), now(), now()),
  (gen_random_uuid(), '20000000-0000-4000-8000-000000000003', jsonb_build_object('sub','20000000-0000-4000-8000-000000000003','email','buyer03@upmarket.local'), 'email', '20000000-0000-4000-8000-000000000003', now(), now(), now()),
  (gen_random_uuid(), '20000000-0000-4000-8000-000000000004', jsonb_build_object('sub','20000000-0000-4000-8000-000000000004','email','buyer04@upmarket.local'), 'email', '20000000-0000-4000-8000-000000000004', now(), now(), now()),
  (gen_random_uuid(), '20000000-0000-4000-8000-000000000005', jsonb_build_object('sub','20000000-0000-4000-8000-000000000005','email','buyer05@upmarket.local'), 'email', '20000000-0000-4000-8000-000000000005', now(), now(), now())
on conflict (provider, provider_id) do nothing;

-- ============================================================================
-- SELLERS
-- ============================================================================

insert into public.seller (seller_id, username, name, email, phone, places) values
    ('10000000-0000-4000-8000-000000000001', 'seller01', 'ABC Shop',      'abcshop@gmail.com',  '0861111111', 'มหาวิทยาลัยพะเยา อาคาร ICT'),
    ('10000000-0000-4000-8000-000000000002', 'seller02', 'Fashion Store', 'fashion@gmail.com',  '0862222222', 'วิทยาทาน บึงบวกว้าง'),
    ('10000000-0000-4000-8000-000000000003', 'seller03', 'Tech Shop',     'tech@gmail.com',     '0863333333', 'หอพักในม.พะเยา'),
    ('10000000-0000-4000-8000-000000000004', 'seller04', 'Home Store',    'home@gmail.com',     '0864444444', 'ถ.พหลโยธิน'),
    ('10000000-0000-4000-8000-000000000005', 'seller05', 'Sport Shop',    'sport@gmail.com',    '0865555555', 'เขตเทศบาลเมืองพะเยา');

-- ============================================================================
-- BUYERS
-- ============================================================================

insert into public.buyer (buyer_id, username, name, email, phone, address) values
    ('20000000-0000-4000-8000-000000000001', 'buyer01', 'Somchai Jaidee', 'somchai@gmail.com', '0811111111', 'หอพักนิสิต ม.พะเยา'),
    ('20000000-0000-4000-8000-000000000002', 'buyer02', 'Somsak Dee',     'somsak@gmail.com',  '0822222222', 'อ.เมืองพะเยา'),
    ('20000000-0000-4000-8000-000000000003', 'buyer03', 'Suda Wong',      'suda@gmail.com',    '0833333333', 'อ.ดอกคำใต้'),
    ('20000000-0000-4000-8000-000000000004', 'buyer04', 'Nida Smith',     'nida@gmail.com',    '0844444444', 'อ.เชียงคำ'),
    ('20000000-0000-4000-8000-000000000005', 'buyer05', 'Anan Kong',      'anan@gmail.com',    '0855555555', 'อ.ภูกามยาว');

-- ============================================================================
-- PRODUCTS
-- ============================================================================

insert into public.product (product_id, product_name, price, image, description, category, quantity, size, color, seller_id) values
    (1, 'เสื้อยืดคอกลม UP Edition',      299.00, NULL, 'เสื้อยืดคอกลมผ้าคอตตอน ใส่สบาย พิมพ์โลโก้มหาวิทยาลัยพะเยา', 'เสื้อผ้า',   50,  'M',  'Black',  '10000000-0000-4000-8000-000000000001'),
    (2, 'ยีนส์ขาเท่ ทรงสลิม',            799.00, NULL, 'กางเกงยีนส์ทรงสลิม เส้นใยยืด นุ่มใส่สบาย',                    'เสื้อผ้า',   30,  'L',  'Blue',   '10000000-0000-4000-8000-000000000002'),
    (3, 'รองเท้าวิ่งเบาสุดเบา',         1299.00, NULL, 'รองเท้าสำหรับวิ่ง น้ำหนักเบา รองรับทุกก้าว',                   'รองเท้า',   20,  '42', 'White',  '10000000-0000-4000-8000-000000000005'),
    (4, 'กระเป๋าเป้ใส่แล็ปท็อป',         599.00, NULL, 'กระเป๋าเป้กันน้ำ มีช่องใส่แล็ปท็อป 15 นิ้ว',                    'กระเป๋า',   40,  'M',  'Black',  '10000000-0000-4000-8000-000000000004'),
    (5, 'เสื้อฮู้ดหนานุ่ม',              499.00, NULL, 'เสื้อฮู้ดเนื้อหนา อบอุ่น เหมาะกับหน้าหนาวเชียงราย-พะเยา',      'เสื้อผ้า',   25,  'L',  'Gray',   '10000000-0000-4000-8000-000000000001'),
    (6, 'กางเกงขาสั้นใส่เรียน',          249.00, NULL, 'กางเกงขาสั้นผ้าร่ม น้ำหนักเบา',                                 'เสื้อผ้า',   60,  'M',  'Khaki',  '10000000-0000-4000-8000-000000000002'),
    (7, 'หมวกแก๊ปโลโก้ UP',             199.00, NULL, 'หมวกแก๊ปปรับขนาดได้',                                        'เครื่องประดับ', 45, 'Free','Navy',  '10000000-0000-4000-8000-000000000003'),
    (8, 'ชุดกีฬาฟิตเนส',               899.00, NULL, 'เสื้อ + กางเกงกีฬาระบายความร้อน',                              'กีฬา',     15,  'L',  'Black',  '10000000-0000-4000-8000-000000000005'),
    (9, 'เสื้อเชิ้ตแขนยาวพรีเมียม',      599.00, NULL, 'เสื้อเชิ้ตผ้าลินิน ใส่ทำงาน/สัมภาษณ์งาน',                       'เสื้อผ้า',   20,  'M',  'White',  '10000000-0000-4000-8000-000000000002'),
    (10, 'กระเป๋าสะพายข้างมินิมอล',     349.00, NULL, 'กระเป๋าสะพายข้าง ใส่ของจำเป็น',                                 'กระเป๋า',   35,  'Free','Beige',  '10000000-0000-4000-8000-000000000004');

select setval('public.product_product_id_seq', (select max(product_id) from public.product));

-- ============================================================================
-- CARTS
-- ============================================================================

insert into public.cart (cart_id, buyer_id) values
    (gen_random_uuid(), '20000000-0000-4000-8000-000000000001'),
    (gen_random_uuid(), '20000000-0000-4000-8000-000000000002'),
    (gen_random_uuid(), '20000000-0000-4000-8000-000000000003'),
    (gen_random_uuid(), '20000000-0000-4000-8000-000000000004'),
    (gen_random_uuid(), '20000000-0000-4000-8000-000000000005');

-- ============================================================================
-- ORDERS + ORDER ITEMS (demo history)
-- ============================================================================

insert into public.orders (order_id, order_date, total_amount, status, buyer_id) values
    (1, '2026-08-01', 598.00,  'Pending',   '20000000-0000-4000-8000-000000000001'),
    (2, '2026-08-02', 1098.00, 'Paid',      '20000000-0000-4000-8000-000000000002'),
    (3, '2026-08-03', 1299.00, 'Shipped',   '20000000-0000-4000-8000-000000000003'),
    (4, '2026-08-04', 1198.00, 'Delivered', '20000000-0000-4000-8000-000000000004'),
    (5, '2026-08-05', 1999.00, 'Delivered', '20000000-0000-4000-8000-000000000005');

insert into public.order_item (order_item_id, quantity, price, color, size, subtotal, order_id, product_id) values
    (1, 2, 299.00, 'Black', 'M', 598.00,  1, 1),
    (2, 1, 799.00, 'Blue',  'L', 799.00,  2, 2),
    (3, 1, 299.00, 'Black', 'M', 299.00,  2, 1),
    (4, 1, 1299.00, 'White', '42', 1299.00, 3, 3),
    (5, 2, 599.00, 'Black',  'M', 1198.00, 4, 4),
    (6, 1, 1999.00, 'Silver', 'Standard', 1999.00, 5, 6);

select setval('public.orders_order_id_seq', (select max(order_id) from public.orders));
select setval('public.order_item_order_item_id_seq', (select max(order_item_id) from public.order_item));

-- ============================================================================
-- DEMO LOGIN ACCOUNTS
-- ============================================================================
-- Seller:  seller01@upmarket.local / sell1234  (seller02..seller05: sell2345..sell5678)
-- Buyer:   buyer01@upmarket.local / pass1234   (buyer02..buyer05: pass2345..pass5678)
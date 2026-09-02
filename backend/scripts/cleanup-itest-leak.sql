-- U5 pre-test cleanup: remove rows leaked by the killed integration run
-- (identifiable by *@itest.local emails). Leaf-first, transactional.
BEGIN;

CREATE TEMP TABLE _uids AS SELECT id FROM users WHERE email LIKE '%@itest.local';
CREATE TEMP TABLE _sids AS SELECT id FROM sellers WHERE user_id IN (SELECT id FROM _uids);
CREATE TEMP TABLE _pids AS SELECT id FROM products WHERE "sellerId" IN (SELECT id FROM _uids);
CREATE TEMP TABLE _iids AS SELECT id FROM invoices WHERE buyer_id IN (SELECT id FROM _uids) OR seller_id IN (SELECT id FROM _uids) OR product_id IN (SELECT id FROM _pids);
CREATE TEMP TABLE _wids AS SELECT id FROM wallets WHERE "userId" IN (SELECT id FROM _uids);
CREATE TEMP TABLE _rids AS SELECT id FROM rooms WHERE "createdById" IN (SELECT id FROM _uids) OR ("productIds" IS NOT NULL AND string_to_array("productIds", ',') && ARRAY(SELECT id::text FROM _pids));

DELETE FROM wallet_transactions WHERE "walletId" IN (SELECT id FROM _wids);
DELETE FROM wallets WHERE "userId" IN (SELECT id FROM _uids);
DELETE FROM payments WHERE "invoiceId" IN (SELECT id FROM _iids) OR "userId" IN (SELECT id FROM _uids);
DELETE FROM escrow_holds WHERE "invoiceId" IN (SELECT id FROM _iids) OR "buyerId" IN (SELECT id FROM _uids) OR "sellerId" IN (SELECT id FROM _uids);
DELETE FROM shipments WHERE "invoiceId" IN (SELECT id FROM _iids);
DELETE FROM disputes WHERE "invoiceId" IN (SELECT id FROM _iids) OR "productId" IN (SELECT id FROM _pids);
DELETE FROM dispute_feedback WHERE "userId" IN (SELECT id FROM _uids);
DELETE FROM orders WHERE "invoiceId" IN (SELECT id FROM _iids) OR "buyerId" IN (SELECT id FROM _uids) OR "sellerId" IN (SELECT id FROM _uids) OR "productId" IN (SELECT id FROM _pids);
DELETE FROM invoices WHERE buyer_id IN (SELECT id FROM _uids) OR seller_id IN (SELECT id FROM _uids) OR product_id IN (SELECT id FROM _pids);
DELETE FROM bids WHERE "bidderId" IN (SELECT id FROM _uids) OR "productId" IN (SELECT id FROM _pids);
DELETE FROM seller_reviews WHERE seller_id IN (SELECT id FROM _sids) OR product_id IN (SELECT id FROM _pids);
DELETE FROM condition_reports WHERE "productId" IN (SELECT id FROM _pids);
DELETE FROM invites WHERE "productId" IN (SELECT id::text FROM _pids);
DELETE FROM notifications WHERE "userId" IN (SELECT id FROM _uids);
DELETE FROM tickets WHERE "userId" IN (SELECT id::text FROM _uids);
DELETE FROM shipping_addresses WHERE "userId" IN (SELECT id FROM _uids);
DELETE FROM ai_usage_logs WHERE "userId" IN (SELECT id::text FROM _uids);
DELETE FROM room_participants WHERE "userId" IN (SELECT id FROM _uids) OR "roomId" IN (SELECT id FROM _rids);
DELETE FROM rooms WHERE "createdById" IN (SELECT id FROM _uids) OR id IN (SELECT id FROM _rids);
DELETE FROM seller_documents WHERE seller_id IN (SELECT id FROM _sids);
DELETE FROM seller_payouts WHERE seller_id IN (SELECT id FROM _sids);
DELETE FROM seller_statistics WHERE seller_id IN (SELECT id FROM _sids);
DELETE FROM products WHERE "sellerId" IN (SELECT id FROM _uids);
DELETE FROM sellers WHERE user_id IN (SELECT id FROM _uids);
DELETE FROM users WHERE id IN (SELECT id FROM _uids);

COMMIT;
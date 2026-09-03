import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { pool } from '../drizzle/db';

async function testPartialIndex() {
  console.log('Testing partial unique index on (order_id, item_name)...');

  const client = await pool.connect();
  try {
    // 1. Clean up any previous test leftovers
    await client.query("DELETE FROM requests WHERE order_id = 'ORD-TEST-UNIQUE'");

    // 2. Insert first live request
    console.log('1. Inserting first live request for (ORD-TEST-UNIQUE, Widget X)...');
    await client.query(`
      INSERT INTO requests (
        reference, customer_name, customer_contact, order_id, item_name, quantity, reason, status
      ) VALUES (
        'RD-TEST-001', 'Test Customer', 'test@example.com', 'ORD-TEST-UNIQUE', 'Widget X', 1, 'damaged', 'open'
      )
    `);
    console.log('   ✓ First insert succeeded');

    // 3. Try inserting duplicate live request (should FAIL)
    console.log('2. Inserting duplicate live request for same (order_id, item_name)...');
    let duplicateRejected = false;
    try {
      await client.query(`
        INSERT INTO requests (
          reference, customer_name, customer_contact, order_id, item_name, quantity, reason, status
        ) VALUES (
          'RD-TEST-002', 'Test Customer 2', 'test2@example.com', 'ORD-TEST-UNIQUE', 'Widget X', 1, 'wrong_item', 'in_review'
        )
      `);
    } catch (err: any) {
      if (err.code === '23505' && err.constraint === 'uq_live_request_per_item') {
        duplicateRejected = true;
        console.log(`   ✓ Postgres rejected duplicate with constraint: ${err.constraint} (code ${err.code})`);
      } else {
        console.error('   ✗ Unexpected error:', err);
      }
    }

    if (!duplicateRejected) {
      throw new Error('FAIL: Duplicate live request was NOT rejected by Postgres!');
    }

    // 4. Soft-delete the first request
    console.log('3. Soft-deleting first request (setting removed_at = NOW())...');
    await client.query(`
      UPDATE requests SET removed_at = NOW() WHERE reference = 'RD-TEST-001'
    `);
    console.log('   ✓ Soft-deleted first request');

    // 5. Now try inserting duplicate again (should SUCCEED now)
    console.log('4. Retrying insert for (ORD-TEST-UNIQUE, Widget X) after soft-delete...');
    await client.query(`
      INSERT INTO requests (
        reference, customer_name, customer_contact, order_id, item_name, quantity, reason, status
      ) VALUES (
        'RD-TEST-002', 'Test Customer 2', 'test2@example.com', 'ORD-TEST-UNIQUE', 'Widget X', 1, 'wrong_item', 'in_review'
      )
    `);
    console.log('   ✓ Insert succeeded because previous request is soft-deleted');

    // 6. Complete this second request (status = completed)
    console.log('5. Updating second request status to completed...');
    await client.query(`
      UPDATE requests SET status = 'completed' WHERE reference = 'RD-TEST-002'
    `);

    // 7. Insert a third request (should SUCCEED because second is completed)
    console.log('6. Inserting third request for (ORD-TEST-UNIQUE, Widget X) when prior is completed...');
    await client.query(`
      INSERT INTO requests (
        reference, customer_name, customer_contact, order_id, item_name, quantity, reason, status
      ) VALUES (
        'RD-TEST-003', 'Test Customer 3', 'test3@example.com', 'ORD-TEST-UNIQUE', 'Widget X', 1, 'size_issue', 'open'
      )
    `);
    console.log('   ✓ Insert succeeded because previous request was completed (terminal)');

    // 8. Clean up test rows
    await client.query("DELETE FROM requests WHERE order_id = 'ORD-TEST-UNIQUE'");
    console.log('7. Cleaned up test records');

    console.log('\n--> ALL PARTIAL UNIQUE INDEX CHECKS PASSED SUCCESSFULLY! <--');
  } finally {
    client.release();
    await pool.end();
  }
}

testPartialIndex().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

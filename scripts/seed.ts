import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { pool } from '../drizzle/db';

interface SeedRequest {
  customer_name: string;
  customer_contact: string;
  order_id: string;
  item_name: string;
  quantity: number;
  reason: 'damaged' | 'wrong_item' | 'size_issue' | 'not_as_described' | 'changed_mind';
  status: 'open' | 'in_review' | 'approved' | 'completed' | 'rejected';
  resolution?: 'refund' | 'replacement' | 'store_credit';
  refund_amount?: string;
  removed_at?: Date;
  notes?: string[];
}

const seedData: SeedRequest[] = [
  // 1-7: OPEN requests (Rule 2: resolution & refund_amount MUST be null)
  {
    customer_name: 'Aarav Patel',
    customer_contact: 'aarav.patel@example.com',
    order_id: 'ORD-2024-8801',
    item_name: 'Ergonomic Memory Foam Insoles (Size 10)',
    quantity: 1,
    reason: 'size_issue',
    status: 'open',
    notes: ['Customer submitted request via web form stating insole is too tight in toe box.'],
  },
  {
    customer_name: 'Priya Sharma',
    customer_contact: '+91-98765-43210',
    order_id: 'ORD-2024-8802',
    item_name: 'Anti-Fatigue Standing Mat (Charcoal)',
    quantity: 1,
    reason: 'damaged',
    status: 'open',
    notes: ['Outer packaging arrived punctured. Deep gouge in foam surface.'],
  },
  {
    customer_name: 'David Miller',
    customer_contact: 'david.m@example.org',
    order_id: 'ORD-2024-8803',
    item_name: 'Deep-Tissue Massage Roller',
    quantity: 1,
    reason: 'wrong_item',
    status: 'open',
  },
  {
    customer_name: 'Ananya Deshmukh',
    customer_contact: 'ananya.d@example.com',
    order_id: 'ORD-2024-8804',
    item_name: 'Gel Heel Cushion Pads (Pair)',
    quantity: 2,
    reason: 'changed_mind',
    status: 'open',
  },
  {
    customer_name: 'Marcus Chen',
    customer_contact: 'marcus.chen@example.com',
    order_id: 'ORD-2024-8805',
    item_name: 'Breathable Arch Support Socks (Pack of 3)',
    quantity: 1,
    reason: 'not_as_described',
    status: 'open',
    notes: ['Customer expected wool blend; material tag indicates polyester.'],
  },
  {
    customer_name: 'Kavita Rao',
    customer_contact: '+91-98111-22334',
    order_id: 'ORD-2024-8806',
    item_name: 'Contoured Lumbar Support Cushion',
    quantity: 1,
    reason: 'size_issue',
    status: 'open',
  },
  {
    customer_name: 'Liam O\'Connor',
    customer_contact: 'liam.oc@example.com',
    order_id: 'ORD-2024-8807',
    item_name: 'Compression Ankle Brace (Large)',
    quantity: 1,
    reason: 'wrong_item',
    status: 'open',
  },

  // 8-14: IN_REVIEW requests
  {
    customer_name: 'Rohan Mehta',
    customer_contact: 'rohan.mehta@example.com',
    order_id: 'ORD-2024-8810',
    item_name: 'Orthopedic Heel Cups (Medium)',
    quantity: 2,
    reason: 'damaged',
    status: 'in_review',
    notes: [
      'Customer reported silicone split on first wear.',
      'Agent requested batch code from underside of product.',
      'Batch code received: B24-098. Sent to QA lead for assessment.',
    ],
  },
  {
    customer_name: 'Sofia Alvarez',
    customer_contact: 'sofia.a@example.com',
    order_id: 'ORD-2024-8811',
    item_name: 'Adjustable Plantar Fasciitis Night Splint',
    quantity: 1,
    reason: 'not_as_described',
    status: 'in_review',
    notes: ['Customer states angle strap does not hold 90 degree tension as advertised.'],
  },
  {
    customer_name: 'Vikram Joshi',
    customer_contact: 'vikram.j@example.com',
    order_id: 'ORD-2024-8812',
    item_name: 'Carbon Fiber Arch Insoles (Size 11)',
    quantity: 1,
    reason: 'size_issue',
    status: 'in_review',
    notes: ['Customer wants to exchange for Size 10. Checking warehouse inventory.'],
  },
  {
    customer_name: 'Elena Rostova',
    customer_contact: 'elena.rostova@example.com',
    order_id: 'ORD-2024-8813',
    item_name: 'Postural Back Brace (S/M)',
    quantity: 1,
    reason: 'damaged',
    status: 'in_review',
    notes: ['Velcro fastener detached on left side.'],
  },
  {
    customer_name: 'Aditya Gupta',
    customer_contact: 'aditya.g@example.com',
    order_id: 'ORD-2024-8814',
    item_name: 'High-Density Foam Foot Roller',
    quantity: 3,
    reason: 'wrong_item',
    status: 'in_review',
    notes: ['Received smooth rollers instead of ribbed version ordered.'],
  },
  {
    customer_name: 'Fatima Al-Sayed',
    customer_contact: 'fatima.s@example.org',
    order_id: 'ORD-2024-8815',
    item_name: 'Therapeutic Toe Separators (Silicone)',
    quantity: 1,
    reason: 'changed_mind',
    status: 'in_review',
  },
  {
    customer_name: 'Nathaniel Ward',
    customer_contact: 'nward@example.com',
    order_id: 'ORD-2024-8816',
    item_name: 'Shock-Absorbing Work Boot Insoles (Size 12)',
    quantity: 1,
    reason: 'size_issue',
    status: 'in_review',
  },

  // 15-21: APPROVED requests (Rule 2: MUST have resolution; refund MUST have amount)
  {
    customer_name: 'Neha Kapoor',
    customer_contact: 'neha.k@example.com',
    order_id: 'ORD-2024-8820',
    item_name: 'Acupressure Foot Massage Mat',
    quantity: 1,
    reason: 'damaged',
    status: 'approved',
    resolution: 'refund',
    refund_amount: '1499.00',
    notes: [
      'Customer provided photo showing cracked plastic base plate.',
      'Approved for full refund under 30-day structural guarantee.',
    ],
  },
  {
    customer_name: 'Brian Taylor',
    customer_contact: 'brian.t@example.com',
    order_id: 'ORD-2024-8821',
    item_name: 'Metatarsal Relief Pads (Pack of 4)',
    quantity: 1,
    reason: 'wrong_item',
    status: 'approved',
    resolution: 'replacement',
    notes: [
      'Sent Large instead of Small. Replacement order REPL-491 scheduled for dispatch.',
    ],
  },
  {
    customer_name: 'Sunita Verma',
    customer_contact: '+91-99887-76655',
    order_id: 'ORD-2024-8822',
    item_name: 'Custom-Molding Heat Arch Supports',
    quantity: 1,
    reason: 'changed_mind',
    status: 'approved',
    resolution: 'store_credit',
    notes: [
      'Customer opted for store credit voucher rather than wait for return transit.',
    ],
  },
  {
    customer_name: 'Lucas Dupont',
    customer_contact: 'lucas.d@example.fr',
    order_id: 'ORD-2024-8823',
    item_name: 'Copper Infused Compression Knee Sleeve',
    quantity: 2,
    reason: 'size_issue',
    status: 'approved',
    resolution: 'replacement',
    notes: ['Customer exchanging XL for L.'],
  },
  {
    customer_name: 'Tanvi Saxena',
    customer_contact: 'tanvi.s@example.com',
    order_id: 'ORD-2024-8824',
    item_name: 'Orthopedic Seat Wedge Cushion',
    quantity: 1,
    reason: 'not_as_described',
    status: 'approved',
    resolution: 'refund',
    refund_amount: '2199.50',
    notes: ['Incline angle did not match specs. Full refund approved.'],
  },
  {
    customer_name: 'James Wilson',
    customer_contact: 'jwilson@example.com',
    order_id: 'ORD-2024-8825',
    item_name: 'Bunion Corrector Night Relief Splint',
    quantity: 1,
    reason: 'damaged',
    status: 'approved',
    resolution: 'refund',
    refund_amount: '899.00',
  },
  {
    customer_name: 'Deepak Nambiar',
    customer_contact: 'deepak.n@example.com',
    order_id: 'ORD-2024-8826',
    item_name: 'Silicone Heel Lift Inserts (1 Inch)',
    quantity: 1,
    reason: 'size_issue',
    status: 'approved',
    resolution: 'store_credit',
  },

  // 22-28: COMPLETED requests (Terminal state: resolution was enacted)
  {
    customer_name: 'Rajesh Singhania',
    customer_contact: 'rajesh.s@example.com',
    order_id: 'ORD-2024-8790',
    item_name: 'Pro-Glide Walking Insoles (Size 9)',
    quantity: 1,
    reason: 'damaged',
    status: 'completed',
    resolution: 'refund',
    refund_amount: '1250.00',
    notes: [
      'Crushed in transit by courier.',
      'Approved for refund.',
      'Payment gateway transaction TXN-99412 settled. Case closed.',
    ],
  },
  {
    customer_name: 'Chloe Bennett',
    customer_contact: 'chloe.b@example.com',
    order_id: 'ORD-2024-8791',
    item_name: 'Magnetic Therapy Foot Insoles',
    quantity: 1,
    reason: 'wrong_item',
    status: 'completed',
    resolution: 'replacement',
    notes: [
      'Wrong color sent initially.',
      'Replacement delivered and delivery acknowledged by customer.',
    ],
  },
  {
    customer_name: 'Arjun Reddy',
    customer_contact: 'arjun.reddy@example.com',
    order_id: 'ORD-2024-8792',
    item_name: 'Adjustable Standing Desk Balance Board',
    quantity: 1,
    reason: 'not_as_described',
    status: 'completed',
    resolution: 'store_credit',
    notes: [
      'Credit voucher issued: CR-8839-40. Customer confirmed receipt.',
    ],
  },
  {
    customer_name: 'Rachel Green',
    customer_contact: 'rachel.g@example.com',
    order_id: 'ORD-2024-8793',
    item_name: 'Heel Spur Cushion Cups',
    quantity: 2,
    reason: 'size_issue',
    status: 'completed',
    resolution: 'refund',
    refund_amount: '750.00',
  },
  {
    customer_name: 'Manoj Kumar',
    customer_contact: 'manoj.k@example.com',
    order_id: 'ORD-2024-8794',
    item_name: 'Arch Stabilizer Support Strap',
    quantity: 1,
    reason: 'damaged',
    status: 'completed',
    resolution: 'replacement',
  },
  {
    customer_name: 'Emma Watson',
    customer_contact: 'emma.w@example.com',
    order_id: 'ORD-2024-8795',
    item_name: 'Reflexology Walking Stones Pad',
    quantity: 1,
    reason: 'changed_mind',
    status: 'completed',
    resolution: 'store_credit',
  },

  // 29-33: REJECTED requests (Terminal state: resolution is null)
  {
    customer_name: 'Siddharth Roy',
    customer_contact: 'sid.roy@example.com',
    order_id: 'ORD-2024-8780',
    item_name: 'Active-Step Gel Insoles',
    quantity: 1,
    reason: 'changed_mind',
    status: 'rejected',
    notes: [
      'Return requested 75 days after delivery date.',
      'Exceeds store 30-day return policy window. Customer notified of policy decline.',
    ],
  },
  {
    customer_name: 'Jessica Gomez',
    customer_contact: 'jess.g@example.com',
    order_id: 'ORD-2024-8781',
    item_name: 'Heavy-Duty Work Boot Orthotics',
    quantity: 1,
    reason: 'damaged',
    status: 'rejected',
    notes: [
      'Inspection photos revealed insoles had been heavily trimmed past guideline marks and washed in high-heat laundry.',
      'Damage determined to be user modification, not manufacturing defect. Rejected.',
    ],
  },
  {
    customer_name: 'Karan Mehra',
    customer_contact: 'karan.m@example.com',
    order_id: 'ORD-2024-8782',
    item_name: 'Vibrating Foot Therapy Ball',
    quantity: 1,
    reason: 'not_as_described',
    status: 'rejected',
    notes: ['Product matches website product specifications exactly.'],
  },
  {
    customer_name: 'Sarah Connor',
    customer_contact: 'sconnor@example.com',
    order_id: 'ORD-2024-8783',
    item_name: 'Compression Calf Sleeves',
    quantity: 1,
    reason: 'size_issue',
    status: 'rejected',
  },

  // 34-35: SOFT-DELETED requests (Rule 5: removed_at is not null; only allowed on open or rejected)
  {
    customer_name: 'Test Duplicate Entry',
    customer_contact: 'duplicate@example.com',
    order_id: 'ORD-2024-8700',
    item_name: 'Accidental Duplicate Submission',
    quantity: 1,
    reason: 'changed_mind',
    status: 'open',
    removed_at: new Date('2024-08-01T10:00:00Z'),
    notes: ['Agent took off desk: duplicate customer inquiry submitted twice.'],
  },
  {
    customer_name: 'Spam Ticket',
    customer_contact: 'noreply@spam.org',
    order_id: 'ORD-2024-8701',
    item_name: 'Invalid Test Inquiry',
    quantity: 1,
    reason: 'not_as_described',
    status: 'rejected',
    removed_at: new Date('2024-08-02T11:30:00Z'),
    notes: ['Removed from desk: automated spam test ticket.'],
  },
];

async function seed() {
  console.log('Seeding database with realistic return desk data...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Truncate tables and reset sequence
    console.log('Truncating existing records...');
    await client.query('TRUNCATE TABLE notes, requests CASCADE;');
    await client.query('ALTER SEQUENCE request_reference_seq RESTART WITH 1;');

    // 2. Insert requests & notes
    let insertedCount = 0;
    let noteCount = 0;

    for (const item of seedData) {
      // Get next sequence value formatted as RD-000001
      const seqRes = await client.query("SELECT LPAD(nextval('request_reference_seq')::text, 6, '0') as ref;");
      const reference = `RD-${seqRes.rows[0].ref}`;

      const insertRes = await client.query(
        `INSERT INTO requests (
          reference,
          customer_name,
          customer_contact,
          order_id,
          item_name,
          quantity,
          reason,
          status,
          resolution,
          refund_amount,
          removed_at,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() - INTERVAL '1 day' * (35 - $12), NOW()
        ) RETURNING id;`,
        [
          reference,
          item.customer_name,
          item.customer_contact,
          item.order_id,
          item.item_name,
          item.quantity,
          item.reason,
          item.status,
          item.resolution ?? null,
          item.refund_amount ?? null,
          item.removed_at ?? null,
          insertedCount,
        ]
      );

      const requestId = insertRes.rows[0].id;
      insertedCount++;

      if (item.notes && item.notes.length > 0) {
        for (let i = 0; i < item.notes.length; i++) {
          await client.query(
            `INSERT INTO notes (request_id, body, created_at)
             VALUES ($1, $2, NOW() - INTERVAL '1 day' * (35 - $3) + INTERVAL '1 hour' * $4);`,
            [requestId, item.notes[i], insertedCount, i + 1]
          );
          noteCount++;
        }
      }
    }

    await client.query('COMMIT');

    console.log(`\nSuccessfully seeded database!`);
    console.log(`- Requests created: ${insertedCount} (spanning all 5 statuses & 5 reasons)`);
    console.log(`- Notes created: ${noteCount} across realistic subset of tickets`);
    console.log(`- Soft-deleted requests: 2`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during database seed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Fatal seed failure:', err);
  process.exit(1);
});

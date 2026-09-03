/**
 * Automated Verification Script for ReturnDesk Five Business Rules
 *
 * Can be executed against local or remote deployment:
 *   npx tsx scripts/verify-business-rules.ts [BASE_URL]
 */

const BASE_URL = process.argv[2] || 'http://127.0.0.1:3000';

interface AssertionResult {
  rule: string;
  description: string;
  expectedStatus: number;
  actualStatus: number;
  expectedCode?: string;
  actualCode?: string;
  passed: boolean;
  notes?: string;
}

const results: AssertionResult[] = [];

async function api(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }
  return { status: res.status, data };
}

function record(
  rule: string,
  description: string,
  expectedStatus: number,
  actualStatus: number,
  expectedCode?: string,
  actualCode?: string,
  notes?: string
) {
  const passed =
    expectedStatus === actualStatus && (!expectedCode || expectedCode === actualCode);
  results.push({
    rule,
    description,
    expectedStatus,
    actualStatus,
    expectedCode,
    actualCode,
    passed,
    notes,
  });
  const symbol = passed ? '✓ PASS' : '✗ FAIL';
  console.log(
    `[${symbol}] ${rule}: ${description} -> HTTP ${actualStatus} (code: ${actualCode || 'none'})`
  );
}

async function run() {
  console.log(`\n======================================================`);
  console.log(`ReturnDesk Business Rule Verification against ${BASE_URL}`);
  console.log(`======================================================\n`);

  const runId = Math.floor(Math.random() * 90000) + 10000;
  const testOrderId = `ORD-TEST-${runId}`;
  const testItem = `Verification Widget ${runId}`;

  // ─── Rule 3: One live request per item ──────────────────────────
  console.log('--- Testing Rule 3: One live request per item ---');
  // 1. Create initial request
  const create1 = await api('/api/requests', {
    method: 'POST',
    body: JSON.stringify({
      customer_name: 'Test Customer A',
      customer_contact: 'test-a@example.com',
      order_id: testOrderId,
      item_name: testItem,
      quantity: 1,
      reason: 'damaged',
    }),
  });
  record(
    'Rule 3 (Success)',
    'Create first live request for (order, item)',
    201,
    create1.status,
    undefined,
    create1.data?.data?.reference ? 'OK' : undefined
  );
  const req1Id = create1.data?.data?.id;

  // 2. Refusal: Create duplicate live request for same item on same order
  const create2 = await api('/api/requests', {
    method: 'POST',
    body: JSON.stringify({
      customer_name: 'Test Customer B',
      customer_contact: 'test-b@example.com',
      order_id: testOrderId,
      item_name: testItem,
      quantity: 2,
      reason: 'wrong_item',
    }),
  });
  record(
    'Rule 3 (Refusal)',
    'Refuse duplicate live request for same (order, item)',
    409,
    create2.status,
    'DUPLICATE_LIVE_REQUEST',
    create2.data?.error?.code
  );

  // ─── Rule 1: Status Flow ─────────────────────────────────────────
  console.log('\n--- Testing Rule 1: Status flow ---');
  // Refusal: Open straight to Completed
  const badJump = await api(`/api/requests/${req1Id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'completed' }),
  });
  record(
    'Rule 1 (Refusal)',
    'Refuse jump from open straight to completed',
    409,
    badJump.status,
    'ILLEGAL_TRANSITION',
    badJump.data?.error?.code
  );

  // Success: Open -> In Review
  const toInReview = await api(`/api/requests/${req1Id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'in_review' }),
  });
  record(
    'Rule 1 (Success)',
    'Advance from open to in_review',
    200,
    toInReview.status,
    undefined,
    toInReview.data?.data?.status === 'in_review' ? 'OK' : undefined
  );

  // ─── Rule 2: Approval Needs Resolution (Atomic) ──────────────────
  console.log('\n--- Testing Rule 2: Approval needs resolution ---');
  // Refusal: in_review -> approved without resolution
  const noResolution = await api(`/api/requests/${req1Id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'approved' }),
  });
  record(
    'Rule 2 (Refusal)',
    'Refuse move to approved without resolution',
    409,
    noResolution.status,
    'APPROVAL_INCOMPLETE',
    noResolution.data?.error?.code
  );

  // Refusal: resolution=refund but no refund_amount
  const refundNoAmount = await api(`/api/requests/${req1Id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'approved', resolution: 'refund' }),
  });
  record(
    'Rule 2 (Refusal)',
    'Refuse resolution=refund without refund_amount',
    409,
    refundNoAmount.status,
    'APPROVAL_INCOMPLETE',
    refundNoAmount.data?.error?.code
  );

  // Refusal: resolution=replacement but refund_amount is passed
  const replWithAmount = await api(`/api/requests/${req1Id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'approved',
      resolution: 'replacement',
      refund_amount: 100,
    }),
  });
  record(
    'Rule 2 (Refusal)',
    'Refuse resolution!=refund when refund_amount is provided',
    409,
    replWithAmount.status,
    'APPROVAL_INCOMPLETE',
    replWithAmount.data?.error?.code
  );

  // Success: in_review -> approved with resolution=refund and refund_amount=250.00
  const approveOk = await api(`/api/requests/${req1Id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'approved',
      resolution: 'refund',
      refund_amount: 250.0,
    }),
  });
  record(
    'Rule 2 (Success)',
    'Atomic approval with resolution=refund and refund_amount > 0',
    200,
    approveOk.status,
    undefined,
    approveOk.data?.data?.status === 'approved' ? 'OK' : undefined
  );

  // ─── Rule 4: Locked Once Decided ─────────────────────────────────
  console.log('\n--- Testing Rule 4: Locked once decided ---');
  // Refusal: Edit details on approved request
  const editLocked = await api(`/api/requests/${req1Id}`, {
    method: 'PATCH',
    body: JSON.stringify({ customer_name: 'Should Not Be Allowed' }),
  });
  record(
    'Rule 4 (Refusal)',
    'Refuse general edit once status is approved',
    409,
    editLocked.status,
    'RECORD_LOCKED',
    editLocked.data?.error?.code
  );

  // Notes are still permitted on decided request
  const addNoteOnLocked = await api(`/api/requests/${req1Id}/notes`, {
    method: 'POST',
    body: JSON.stringify({ body: 'Audit note added to decided request' }),
  });
  record(
    'Rule 4 (Note Exception)',
    'Permit adding notes to decided requests',
    201,
    addNoteOnLocked.status,
    undefined,
    addNoteOnLocked.data?.data?.id ? 'OK' : undefined
  );

  // Complete the request: approved -> completed
  const completeOk = await api(`/api/requests/${req1Id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'completed' }),
  });
  record(
    'Rule 1 (Success)',
    'Transition approved to completed',
    200,
    completeOk.status,
    undefined,
    completeOk.data?.data?.status === 'completed' ? 'OK' : undefined
  );

  // Refusal: Transition out of completed terminal status
  const reopenCompleted = await api(`/api/requests/${req1Id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'open' }),
  });
  record(
    'Rule 1 (Refusal)',
    'Refuse reopening or transitioning out of completed status',
    409,
    reopenCompleted.status,
    'ILLEGAL_TRANSITION',
    reopenCompleted.data?.error?.code
  );

  // ─── Rule 5: Removal ─────────────────────────────────────────────
  console.log('\n--- Testing Rule 5: Removal ---');
  // Refusal: Attempt to remove completed request
  const removeCompleted = await api(`/api/requests/${req1Id}/remove`, {
    method: 'POST',
  });
  record(
    'Rule 5 (Refusal)',
    'Refuse removal of completed request',
    409,
    removeCompleted.status,
    'CANNOT_REMOVE_REQUEST',
    removeCompleted.data?.error?.code
  );

  // Create a rejected request to test removal on rejected
  const reqRejectCreate = await api('/api/requests', {
    method: 'POST',
    body: JSON.stringify({
      customer_name: 'Reject Test',
      customer_contact: 'reject@example.com',
      order_id: `ORD-REJECT-${runId}`,
      item_name: 'Reject Item',
      quantity: 1,
      reason: 'changed_mind',
    }),
  });
  const reqRejectId = reqRejectCreate.data?.data?.id;

  await api(`/api/requests/${reqRejectId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'rejected' }),
  });

  // Success: Remove rejected request
  const removeRejected = await api(`/api/requests/${reqRejectId}/remove`, {
    method: 'POST',
  });
  record(
    'Rule 5 (Success)',
    'Permit removal of rejected request',
    200,
    removeRejected.status,
    undefined,
    removeRejected.data?.data?.removed_at ? 'OK' : undefined
  );

  // Disappearance check: Detail GET must now return 404
  const detailRemoved = await api(`/api/requests/${reqRejectId}`);
  record(
    'Rule 5 (Disappearance)',
    'Removed request returns 404 NOT_FOUND on detail fetch',
    404,
    detailRemoved.status,
    'NOT_FOUND',
    detailRemoved.data?.error?.code
  );

  // ─── Summary ─────────────────────────────────────────────────────
  console.log(`\n======================================================`);
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  console.log(`Summary: ${passedTests}/${totalTests} tests passed.`);
  console.log(`======================================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

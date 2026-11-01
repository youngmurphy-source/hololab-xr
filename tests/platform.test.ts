import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../server/src/auth/authService.ts';
import { SchoolService, StudentService } from '../server/src/schools/schoolService.ts';
import { SupermarketService, MockPaystackProvider } from '../server/src/store/storeService.ts';

test('1. School Registration & Institutional Approval', async () => {
  const schoolService = new SchoolService();
  const school = await schoolService.registerSchool({
    name: 'King’s College Lagos',
    slug: 'kings-college-lagos',
    email: 'principal@kingscollege.edu.ng',
    countryCode: 'NG',
  });

  assert.equal(school.status, 'pending');
  assert.equal(school.slug, 'kings-college-lagos');

  // Duplicate slug must be rejected
  await assert.rejects(
    schoolService.registerSchool({
      name: 'Duplicate School',
      slug: 'kings-college-lagos',
      email: 'other@school.ng',
      countryCode: 'NG',
    }),
    /already registered/
  );

  // Verification & approval
  const approved = await schoolService.verifyAndApproveSchool(school.id);
  assert.equal(approved.status, 'active');
});

test('2. Student Registration & Automatic Private Laboratory Provisioning', async () => {
  const schoolService = new SchoolService();
  const studentService = new StudentService();
  const authService = new AuthService();

  const school = await schoolService.registerSchool({
    name: 'Corona Secondary School',
    slug: 'corona-school',
    email: 'admin@corona.edu.ng',
    countryCode: 'NG',
  });
  await schoolService.verifyAndApproveSchool(school.id);

  // Register student user
  const { user } = await authService.registerUser({
    email: 'chidi.okafor@students.corona.edu.ng',
    firstName: 'Chidi',
    lastName: 'Okafor',
    password: 'SecurePassword123!',
    schoolId: school.id,
    role: 'student',
  });

  // Enrol student & provision private lab
  const { profile, lab, spaces } = await studentService.enrolStudent({
    userId: user.id,
    schoolId: school.id,
    admissionNumber: 'CSS-2026-042',
  });

  assert.equal(profile.userId, user.id);
  assert.equal(profile.schoolId, school.id);
  assert.equal(lab.studentId, user.id);
  assert.equal(lab.status, 'active');

  // Must contain Chemistry, Biology, Physics workspaces
  assert.equal(spaces.length, 3);
  const departments = spaces.map((s) => s.department);
  assert.ok(departments.includes('chemistry'));
  assert.ok(departments.includes('biology'));
  assert.ok(departments.includes('physics'));

  // Ensure student retrieves only their private lab
  const studentLab = studentService.getStudentLab(user.id);
  assert.equal(studentLab.lab.id, lab.id);
});

test('3. Supermarket Order Creation, Idempotency & Direct Payment', async () => {
  const store = new SupermarketService();
  const paystack = new MockPaystackProvider();
  const studentId = 'usr_student_001';
  const schoolId = 'sch_001';

  const products = store.listProducts();
  assert.ok(products.length >= 4);

  const beaker = products.find((p) => p.sku === 'CHEM-EQ-001')!;
  const hcl = products.find((p) => p.sku === 'CHEM-RG-001')!;

  // 1. Create order
  const idempotencyKey = 'idem_checkout_sess_98234';
  const order1 = await store.createOrder({
    studentId,
    schoolId,
    idempotencyKey,
    items: [
      { productId: beaker.id, quantity: 2 }, // 2 * 150000 = 300000 (₦3,000)
      { productId: hcl.id, quantity: 1 },    // 1 * 120000 = 120000 (₦1,200)
    ],
  });

  assert.equal(order1.status, 'pending');
  assert.equal(order1.totalMinor, 420000); // ₦4,200.00 in kobo

  // Idempotency: Repeating request with identical key returns same order without duplicating totals
  const order2 = await store.createOrder({
    studentId,
    schoolId,
    idempotencyKey,
    items: [
      { productId: beaker.id, quantity: 2 },
      { productId: hcl.id, quantity: 1 },
    ],
  });
  assert.equal(order2.id, order1.id);
  assert.equal(order2.totalMinor, 420000);

  // 2. Initialize payment with provider
  const paymentInit = await paystack.initializePayment({
    reference: order1.orderNumber,
    amountMinor: order1.totalMinor,
    currency: 'NGN',
    customerEmail: 'student@school.edu.ng',
    returnUrl: 'https://hololabxr.com/student/checkout/return',
  });
  assert.ok(paymentInit.checkoutUrl.includes('paystack.com'));

  // 3. Webhook verification & Settlement
  const webhookSignature = 'mock_pstk_sig_valid_sha512';
  const isValidSignature = paystack.verifyWebhook('{}', webhookSignature);
  assert.ok(isValidSignature);

  // 4. Settle payment and credit virtual inventory
  const { order: settledOrder, payment } = await store.settleOrderPayment({
    orderId: order1.id,
    provider: 'paystack',
    providerReference: paymentInit.providerReference,
    amountMinor: 420000,
    webhookEventId: 'evt_pstk_9001',
  });

  assert.equal(settledOrder.status, 'paid');
  assert.equal(payment.status, 'verified');

  // Verify student inventory reflects purchased items
  const inventory = store.getStudentInventory(studentId);
  const ownedBeakers = inventory.find((i) => i.productId === beaker.id);
  const ownedHcl = inventory.find((i) => i.productId === hcl.id);

  assert.equal(ownedBeakers?.quantity, 2);
  assert.equal(ownedHcl?.quantity, 1);
  assert.ok(store.hasItem(studentId, beaker.id, 2));

  // Idempotency check: Duplicate webhook event does not credit inventory twice
  await store.settleOrderPayment({
    orderId: order1.id,
    provider: 'paystack',
    providerReference: paymentInit.providerReference,
    amountMinor: 420000,
    webhookEventId: 'evt_pstk_9001', // duplicate event ID
  });

  const inventoryAfter = store.getStudentInventory(studentId);
  assert.equal(inventoryAfter.find((i) => i.productId === beaker.id)?.quantity, 2);
});

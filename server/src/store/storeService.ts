import type {
  Product,
  Order,
  OrderItem,
  StudentInventoryItem,
  InventoryTransaction,
  OrderStatus,
  Payment,
  PaymentStatus,
} from '../../../src/types/platform';

export interface PaymentProvider {
  initializePayment(input: {
    reference: string;
    amountMinor: number;
    currency: string;
    customerEmail: string;
    returnUrl: string;
  }): Promise<{ checkoutUrl: string; providerReference: string }>;

  verifyPayment(reference: string): Promise<{
    successful: boolean;
    amountMinor: number;
    currency: string;
    providerReference: string;
  }>;

  verifyWebhook(rawBody: string, signature: string): boolean;
}

export class MockPaystackProvider implements PaymentProvider {
  private secret = 'mock_sk_live_hololab_secret_key';

  async initializePayment(input: {
    reference: string;
    amountMinor: number;
    currency: string;
    customerEmail: string;
    returnUrl: string;
  }): Promise<{ checkoutUrl: string; providerReference: string }> {
    return {
      checkoutUrl: `https://checkout.paystack.com/${input.reference}?email=${encodeURIComponent(input.customerEmail)}`,
      providerReference: `pstk_ref_${input.reference}`,
    };
  }

  async verifyPayment(reference: string): Promise<{
    successful: boolean;
    amountMinor: number;
    currency: string;
    providerReference: string;
  }> {
    return {
      successful: true,
      amountMinor: 700000, // ₦7,000.00
      currency: 'NGN',
      providerReference: `pstk_ref_${reference}`,
    };
  }

  verifyWebhook(rawBody: string, signature: string): boolean {
    return signature.startsWith('mock_pstk_sig_');
  }
}

export class SupermarketService {
  private products = new Map<string, Product>();
  private orders = new Map<string, Order>();
  private inventory = new Map<string, StudentInventoryItem>(); // key: `${studentId}:${productId}`
  private ledger: InventoryTransaction[] = [];
  private payments = new Map<string, Payment>();
  private processedWebhooks = new Set<string>();

  constructor() {
    this.seedDefaultProducts();
  }

  private seedDefaultProducts() {
    const catalog: Omit<Product, 'id' | 'createdAt'>[] = [
      {
        sku: 'CHEM-EQ-001',
        name: 'Pyrex Borosilicate Beaker (250 mL)',
        department: 'chemistry',
        category: 'Glassware',
        description: 'Standard 250 mL reusable glass beaker with graduation markings.',
        productType: 'reusable_equipment',
        priceMinor: 150000, // ₦1,500
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'CHEM-EQ-002',
        name: 'Borosilicate Boiling Test Tubes (Pack of 6)',
        department: 'chemistry',
        category: 'Glassware',
        description: 'Set of 6 reusable heat-resistant boiling test tubes with rack.',
        productType: 'reusable_equipment',
        priceMinor: 250000, // ₦2,500
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'CHEM-RG-001',
        name: 'Hydrochloric Acid Solution (0.1 M, 250 mL)',
        department: 'chemistry',
        category: 'Reagents',
        description: 'Analytical grade diluted HCl reagent for acid-base practicals.',
        productType: 'consumable_reagent',
        priceMinor: 120000, // ₦1,200
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'CHEM-RG-002',
        name: 'Phenolphthalein Indicator Dropper Bottle (50 mL)',
        department: 'chemistry',
        category: 'Indicators',
        description: 'pH transition 8.2 (colorless) to 10.0 (pink).',
        productType: 'consumable_reagent',
        priceMinor: 180000, // ₦1,800
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'CHEM-BD-001',
        name: 'Gas Evolution Complete Practical Kit (Zn + HCl)',
        department: 'chemistry',
        category: 'Bundles',
        description: 'Includes zinc granules, 2 M HCl, collecting tube, pneumatic trough, and spirit burner.',
        productType: 'experiment_bundle',
        priceMinor: 450000, // ₦4,500
        currency: 'NGN',
        published: true,
      },
    ];

    catalog.forEach((p, i) => {
      const id = 'prod_' + (i + 1);
      this.products.set(id, {
        ...p,
        id,
        createdAt: new Date().toISOString(),
      });
    });
  }

  listProducts(dept?: string): Product[] {
    const all = Array.from(this.products.values()).filter((p) => p.published);
    if (!dept) return all;
    return all.filter((p) => p.department === dept);
  }

  getProduct(productId: string): Product {
    const prod = this.products.get(productId);
    if (!prod) throw new Error('Product not found in catalogue');
    return prod;
  }

  async createOrder(input: {
    studentId: string;
    schoolId: string;
    idempotencyKey: string;
    items: { productId: string; quantity: number }[];
  }): Promise<Order> {
    // Check idempotency per student
    const existing = Array.from(this.orders.values()).find(
      (o) => o.studentId === input.studentId && o.idempotencyKey === input.idempotencyKey
    );
    if (existing) return existing;

    let subtotalMinor = 0;
    const orderId = 'ord_' + Math.random().toString(36).substring(2, 11);
    const orderItems: OrderItem[] = input.items.map((item) => {
      const prod = this.getProduct(item.productId);
      const totalMinor = prod.priceMinor * item.quantity;
      subtotalMinor += totalMinor;
      return {
        id: 'itm_' + Math.random().toString(36).substring(2, 11),
        orderId,
        productId: prod.id,
        productNameSnapshot: prod.name,
        quantity: item.quantity,
        unitPriceMinor: prod.priceMinor,
        totalMinor,
      };
    });

    const order: Order = {
      id: orderId,
      studentId: input.studentId,
      schoolId: input.schoolId,
      orderNumber: 'HLXR-' + Date.now().toString(36).toUpperCase(),
      status: 'pending',
      subtotalMinor,
      totalMinor: subtotalMinor,
      currency: 'NGN',
      idempotencyKey: input.idempotencyKey,
      createdAt: new Date().toISOString(),
      items: orderItems,
    };

    this.orders.set(order.id, order);
    return order;
  }

  /**
   * Verified settlement & atomic inventory delivery.
   * Can be invoked via signed webhook or backend verification run.
   */
  async settleOrderPayment(params: {
    orderId: string;
    provider: 'paystack' | 'flutterwave' | 'mock_gateway';
    providerReference: string;
    amountMinor: number;
    webhookEventId?: string;
  }): Promise<{ order: Order; payment: Payment }> {
    // Webhook deduplication
    if (params.webhookEventId) {
      if (this.processedWebhooks.has(params.webhookEventId)) {
        const order = this.orders.get(params.orderId)!;
        const payment = Array.from(this.payments.values()).find(
          (p) => p.providerReference === params.providerReference
        )!;
        return { order, payment };
      }
      this.processedWebhooks.add(params.webhookEventId);
    }

    const order = this.orders.get(params.orderId);
    if (!order) throw new Error('Order not found');
    if (order.status === 'paid') {
      const payment = Array.from(this.payments.values()).find((p) => p.orderId === order.id)!;
      return { order, payment };
    }

    if (params.amountMinor !== order.totalMinor) {
      throw new Error(`Payment amount mismatch: expected ${order.totalMinor}, received ${params.amountMinor}`);
    }

    // 1. Record immutable payment record
    const payment: Payment = {
      id: 'pay_' + Math.random().toString(36).substring(2, 11),
      orderId: order.id,
      studentId: order.studentId,
      provider: params.provider,
      providerReference: params.providerReference,
      amountMinor: params.amountMinor,
      currency: order.currency,
      status: 'verified',
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.payments.set(payment.id, payment);

    // 2. Mark order paid
    order.status = 'paid';

    // 3. Atomically credit student virtual inventory via append-only ledger entries
    for (const item of order.items) {
      const prod = this.getProduct(item.productId);
      const tx: InventoryTransaction = {
        id: 'tx_' + Math.random().toString(36).substring(2, 11),
        studentId: order.studentId,
        productId: prod.id,
        orderItemId: item.id,
        transactionType: 'purchase_credit',
        quantityDelta: item.quantity,
        createdAt: new Date().toISOString(),
      };
      this.ledger.push(tx);

      // Update student persistent inventory
      const invKey = `${order.studentId}:${prod.id}`;
      const current = this.inventory.get(invKey);
      if (current) {
        current.quantity += item.quantity;
        current.updatedAt = new Date().toISOString();
      } else {
        this.inventory.set(invKey, {
          id: 'inv_' + Math.random().toString(36).substring(2, 11),
          studentId: order.studentId,
          productId: prod.id,
          productName: prod.name,
          productType: prod.productType,
          department: prod.department,
          quantity: item.quantity,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return { order, payment };
  }

  getStudentInventory(studentId: string): StudentInventoryItem[] {
    return Array.from(this.inventory.values()).filter((item) => item.studentId === studentId);
  }

  hasItem(studentId: string, productId: string, requiredQty = 1): boolean {
    const item = this.inventory.get(`${studentId}:${productId}`);
    return (item?.quantity ?? 0) >= requiredQty;
  }
}

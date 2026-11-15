import type {
  Product,
  Order,
  OrderItem,
  StudentInventoryItem,
  InventoryTransaction,
  Payment,
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
  readonly secret = 'mock_sk_live_hololab_secret_key';

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

  verifyWebhook(_rawBody: string, signature: string): boolean {
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
      // --- CHEMISTRY GLASSWARE & REAGENTS ---
      {
        sku: 'CHEM-EQ-001',
        name: 'Pyrex Borosilicate Beaker (250 mL)',
        department: 'chemistry',
        category: 'Glassware',
        description: 'Standard 250 mL reusable glass beaker with graduation markings and pouring spout.',
        productType: 'reusable_equipment',
        priceMinor: 150000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'CHEM-EQ-002',
        name: 'Borosilicate Boiling Test Tubes (Pack of 6)',
        department: 'chemistry',
        category: 'Glassware',
        description: 'Set of 6 reusable heat-resistant boiling test tubes with wooden rack.',
        productType: 'reusable_equipment',
        priceMinor: 250000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'CHEM-EQ-003',
        name: 'Conical Erlenmeyer Titration Flask (250 mL)',
        department: 'chemistry',
        category: 'Glassware',
        description: 'Borosilicate conical flask with narrow neck for swirl titration without splashing.',
        productType: 'reusable_equipment',
        priceMinor: 180000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'CHEM-EQ-004',
        name: 'Graduated Measuring Cylinder (100 mL)',
        department: 'chemistry',
        category: 'Glassware',
        description: 'Precision class-A measuring cylinder with hexagonal stability base.',
        productType: 'reusable_equipment',
        priceMinor: 220000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'CHEM-EQ-005',
        name: 'Precision Titration Burette (50 mL) & Retort Stand',
        department: 'chemistry',
        category: 'Apparatus',
        description: 'Class-A 50 mL glass burette with PTFE stopcock, heavy iron retort stand and bosshead clamp.',
        productType: 'reusable_equipment',
        priceMinor: 580000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'CHEM-EQ-006',
        name: 'Bunsen Burner, Tripod Stand & Wire Gauze',
        department: 'chemistry',
        category: 'Apparatus',
        description: 'Adjustable air-collar Bunsen burner, cast iron tripod stand, and ceramic-centered wire gauze.',
        productType: 'reusable_equipment',
        priceMinor: 350000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'CHEM-RG-001',
        name: 'Hydrochloric Acid Solution (0.1 M, 250 mL)',
        department: 'chemistry',
        category: 'Reagents',
        description: 'Analytical grade diluted HCl reagent for acid-base practicals and gas generation.',
        productType: 'consumable_reagent',
        priceMinor: 120000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'CHEM-RG-002',
        name: 'Sodium Hydroxide Solution (0.1 M, 250 mL)',
        department: 'chemistry',
        category: 'Reagents',
        description: 'Standard volumetric NaOH base solution for acid-base titrations.',
        productType: 'consumable_reagent',
        priceMinor: 120000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'CHEM-RG-003',
        name: 'Phenolphthalein Indicator Dropper Bottle (50 mL)',
        department: 'chemistry',
        category: 'Indicators',
        description: 'Precision dropper bottle with 1% ethanolic phenolphthalein indicator (pH transition 8.2 colorless to 10.0 pink).',
        productType: 'consumable_reagent',
        priceMinor: 180000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'CHEM-RG-004',
        name: 'Universal pH Indicator Solution (50 mL) + Color Card',
        department: 'chemistry',
        category: 'Indicators',
        description: 'Full-range pH 1-14 indicator with laminated color comparison chart.',
        productType: 'consumable_reagent',
        priceMinor: 200000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'CHEM-RG-005',
        name: 'Zinc Metal Granules (Analytical Grade, 100 g)',
        department: 'chemistry',
        category: 'Reagents',
        description: 'Pure granulated zinc metal for single displacement & hydrogen evolution reactions.',
        productType: 'consumable_reagent',
        priceMinor: 160000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'CHEM-RG-006',
        name: 'Magnesium Metal Ribbon (Roll of 5 m)',
        department: 'chemistry',
        category: 'Reagents',
        description: 'Cleaned magnesium ribbon for combustion, acid reactivity, and rate of reaction practicals.',
        productType: 'consumable_reagent',
        priceMinor: 190000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'CHEM-RG-007',
        name: 'Copper(II) Sulfate Pentahydrate Crystals (150 g)',
        department: 'chemistry',
        category: 'Reagents',
        description: 'Deep blue CuSO4*5H2O crystals for precipitation, displacement, and crystal growth experiments.',
        productType: 'consumable_reagent',
        priceMinor: 175000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'CHEM-BD-001',
        name: 'Gas Evolution Complete Practical Kit (Zn + HCl)',
        department: 'chemistry',
        category: 'Bundles',
        description: 'Includes zinc granules, 2 M HCl, collecting tube, delivery tube, pneumatic trough, and splint pop-test materials.',
        productType: 'experiment_bundle',
        priceMinor: 450000,
        currency: 'NGN',
        published: true,
      },

      // --- BIOLOGY MICROSCOPES & SPECIMENS ---
      {
        sku: 'BIO-EQ-001',
        name: 'Compound Monocular Optical Microscope (40x - 1000x)',
        department: 'biology',
        category: 'Instruments',
        description: 'Precision educational optical microscope with revolving 4x/10x/40x turret, condenser, and LED stage illumination.',
        productType: 'reusable_equipment',
        priceMinor: 1250000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'BIO-EQ-002',
        name: 'Prepared Microscope Slide Set (25 Specimen Slides)',
        department: 'biology',
        category: 'Specimens',
        description: 'Wooden slide box containing onion root tip mitosis, human blood smear, stomata, skeletal muscle, and amoeba.',
        productType: 'reusable_equipment',
        priceMinor: 380000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'BIO-EQ-003',
        name: 'Nutrient Agar Glass Petri Dishes (Sterile Pack of 5)',
        department: 'biology',
        category: 'Consumables',
        description: 'Pre-poured sterile borosilicate glass Petri dishes with dehydrated nutrient broth for microbial cultures.',
        productType: 'consumable_reagent',
        priceMinor: 240000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'BIO-EQ-004',
        name: 'Stainless Steel Dissection Surgical Tool Kit',
        department: 'biology',
        category: 'Instruments',
        description: 'Zippered surgical case with stainless scalpel #10, fine-point forceps, dissecting scissors, and needle probes.',
        productType: 'reusable_equipment',
        priceMinor: 320000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'BIO-EQ-005',
        name: 'Desktop Human Anatomical Torso Model (12 Removable Parts)',
        department: 'biology',
        category: 'Models',
        description: 'Hand-painted anatomical display model showing cranial brain, dual lungs, 2-part heart, liver, and digestive tract.',
        productType: 'reusable_equipment',
        priceMinor: 890000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'BIO-EQ-006',
        name: 'DNA Double Helix Rotating Molecular Model',
        department: 'biology',
        category: 'Models',
        description: 'Interlocking nucleotide base pairs (Adenine-Thymine, Guanine-Cytosine) on an oak demonstration stand.',
        productType: 'reusable_equipment',
        priceMinor: 420000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'BIO-RG-001',
        name: 'Histology & Staining Solution Dual Pack (Methylene Blue & Iodine)',
        department: 'biology',
        category: 'Reagents',
        description: 'Twin dropper bottles of Methylene Blue and Gram Iodine for plant and animal cell contrast viewing.',
        productType: 'consumable_reagent',
        priceMinor: 210000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'BIO-BD-001',
        name: 'Cellular Histology & Mitosis Practical Exam Bundle',
        department: 'biology',
        category: 'Bundles',
        description: 'Comprehensive kit with slides, cover slips, scalpel, stains, and calibrated onion root specimens.',
        productType: 'experiment_bundle',
        priceMinor: 480000,
        currency: 'NGN',
        published: true,
      },

      // --- PHYSICS OPTICS & CIRCUIT EXPERIMENTATION ---
      {
        sku: 'PHYS-EQ-001',
        name: 'Optical Ray Bench System (Laser Ray Box & Lens Set)',
        department: 'physics',
        category: 'Optics',
        description: 'Calibrated aluminum optical rail, 650nm red 3-beam laser box, biconvex/biconcave cylindrical lenses, and magnetic mounts.',
        productType: 'reusable_equipment',
        priceMinor: 920000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'PHYS-EQ-002',
        name: 'Equilateral Crown Glass Dispersive Triangular Prism (60°)',
        department: 'physics',
        category: 'Optics',
        description: 'High-index optical crown glass triangular prism for light refraction, critical angle, and dispersion demonstrations.',
        productType: 'reusable_equipment',
        priceMinor: 260000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'PHYS-EQ-003',
        name: 'Digital Multimeter with Needle Probes & Continuity Buzzer',
        department: 'physics',
        category: 'Electronics',
        description: 'Auto-ranging digital DMM measuring DC/AC voltage, DC current, resistance, diode drop, and circuit continuity.',
        productType: 'reusable_equipment',
        priceMinor: 480000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'PHYS-EQ-004',
        name: 'Complete Circuit Trainer & Component Experiment Board',
        department: 'physics',
        category: 'Electronics',
        description: 'STEM circuit baseboard with SPST knife switches, sliding ceramic wire-wound rheostat, lamp sockets, and battery holder.',
        productType: 'reusable_equipment',
        priceMinor: 520000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'PHYS-EQ-005',
        name: 'Dual-Scale Hooke’s Law Spring Dynamometer (10 N / 1000 g)',
        department: 'physics',
        category: 'Mechanics',
        description: 'Clear acrylic spring balance with zero-adjust collar, calibrated in Newtons and Grams for Hooke’s law experiments.',
        productType: 'reusable_equipment',
        priceMinor: 210000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'PHYS-EQ-006',
        name: 'Slotted Brass Calibration Masses Set (500 g with Hanger)',
        department: 'physics',
        category: 'Mechanics',
        description: 'Precision machined brass weight set: 9 x 50 g slotted discs + 50 g hanger hook.',
        productType: 'reusable_equipment',
        priceMinor: 340000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'PHYS-EQ-007',
        name: 'AlNiCo Educational Bar Magnets Pair with Keeper & Iron Filings',
        department: 'physics',
        category: 'Magnetism',
        description: 'Pair of painted Red (North) & Blue (South) AlNiCo bar magnets with soft iron keepers and shaker jar of iron filings.',
        productType: 'reusable_equipment',
        priceMinor: 280000,
        currency: 'NGN',
        published: true,
      },
      {
        sku: 'PHYS-BD-001',
        name: 'Cambridge IGCSE & WAEC Optics & Electricity Practical Bundle',
        department: 'physics',
        category: 'Bundles',
        description: 'All-inclusive experimental kit with laser ray box, prism, mirrors, circuit trainer board, multimeter, and Hooke’s apparatus.',
        productType: 'experiment_bundle',
        priceMinor: 1150000,
        currency: 'NGN',
        published: true,
      },

      // --- GENERAL & SAFETY GEAR ---
      {
        sku: 'GEN-EQ-001',
        name: 'HoloLab XR Certified Lab Coat & Splash Goggles Bundle',
        department: 'chemistry',
        category: 'Safety',
        description: 'Flame-resistant white 100% cotton laboratory coat and anti-fog wrap-around chemical splash safety goggles.',
        productType: 'reusable_equipment',
        priceMinor: 380000,
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

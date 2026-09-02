/**
 * Money-path integration suite (P2). Runs against a real Postgres DB
 * (greyauction_itest, provisioned by scripts/itest-db-setup.ts).
 *
 * Flow: register seller+buyer → create listing → approve → bid → end
 * auction → settlement → invoice → payment init → success (order paid)
 * → wallet deposit idempotency.
 */
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { InvoiceSettlementService } from '../src/invoices/invoice-settlement.service';
import { PaymentOrchestrationService } from '../src/payments/payment.orchestration.service';
import { PaymentService } from '../src/payments/payment.service';
import { ProductService } from '../src/products/product.service';
import { PaymentType, PaymentProvider, PaymentStatus } from '../src/payments/entities/payment.entity';
import { createHmac } from 'crypto';

const TS = Date.now().toString(36);
const sellerEmail = "seller-" + TS + "@itest.local";
const buyerEmail = "buyer-" + TS + "@itest.local";
const PASSWORD = "Passw0rd123!";

describe("Money path (integration)", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let settlement: InvoiceSettlementService;
  let orchestration: PaymentOrchestrationService;
  let paymentService: PaymentService;
  let productService: ProductService;
  let sellerToken: string;
  let buyerToken: string;
  let productId: string;
  let invoiceId: string;
  let paymentRef: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
    dataSource = app.get(DataSource);
    settlement = app.get(InvoiceSettlementService);
    orchestration = app.get(PaymentOrchestrationService);
    paymentService = app.get(PaymentService);
    productService = app.get(ProductService);
  }, 60000);

  afterAll(async () => {
    if (app) await app.close();
  });

  const http = () => app.getHttpServer();

  it("registers and logs in seller + buyer", async () => {
    let res = await request(http())
      .post("/api/auth/register")
      .send({ email: sellerEmail, password: PASSWORD, name: "Itest Seller", role: "seller" })
      .expect(201);
    expect(res.body.data?.user?.id).toBeTruthy();

    res = await request(http())
      .post("/api/auth/login")
      .send({ email: sellerEmail, password: PASSWORD })
      .expect(200);
    sellerToken = res.body.data?.token;
    expect(sellerToken).toBeTruthy();

    res = await request(http())
      .post("/api/auth/register")
      .send({ email: buyerEmail, password: PASSWORD, name: "Itest Buyer", role: "bidder" })
      .expect(201);

    res = await request(http())
      .post("/api/auth/login")
      .send({ email: buyerEmail, password: PASSWORD })
      .expect(200);
    buyerToken = res.body.data?.token;
    expect(buyerToken).toBeTruthy();
  });

  it("seller creates a listing and it gets approved", async () => {
    const res = await request(http())
      .post("/api/products")
      .set("Authorization", "Bearer " + sellerToken)
      .send({
        title: "Integration Test Lot " + TS,
        startingBid: 1000,
        endTime: new Date(Date.now() + 3600 * 1000).toISOString(),
        category: "vehicles",
      })
      .expect(201);
    productId = res.body.data?.id;
    expect(productId).toBeTruthy();

    const approved = await productService.approve(productId, {}, "itest-admin");
    expect(approved.status).toBe("active");
  });

  it("buyer places a winning bid", async () => {
    const res = await request(http())
      .post("/api/auctions/" + productId + "/bids")
      .set("Authorization", "Bearer " + buyerToken)
      .send({ amount: 1500 })
      .expect(201);
    expect(res.body.success).toBe(true);
    expect(Number(res.body.data?.amount)).toBe(1500);
  });

  it("auction ends and settlement issues the invoice + marks SOLD", async () => {
    await dataSource.query(
      "UPDATE products SET \"endTime\" = now() - interval '1 minute' WHERE id = $1",
      [productId],
    );

    const result = await settlement.settleEndedAuctions();
    expect(result.settled).toBe(1);
    expect(result.errors).toBe(0);

    const invoices = await request(http())
      .get("/api/invoices")
      .set("Authorization", "Bearer " + buyerToken)
      .expect(200);
    expect(invoices.body.data.length).toBeGreaterThanOrEqual(1);
    invoiceId = invoices.body.data[0].id;
    expect(Number(invoices.body.data[0].hammerPrice ?? invoices.body.data[0].hammer_price ?? invoices.body.data[0].total)).toBeGreaterThanOrEqual(1500);
  });

  it("buyer initializes the payment (mock provider, no keys)", async () => {
    // The suite assumes an offline init. If the developer's backend/.env now
    // carries real provider keys, temporarily hide them so the init stays
    // offline (the webhook test re-enables a test key below).
    const savedPaystack = process.env.PAYSTACK_SECRET_KEY;
    const savedFlutterwave = process.env.FLUTTERWAVE_SECRET_KEY;
    delete process.env.PAYSTACK_SECRET_KEY;
    delete process.env.FLUTTERWAVE_SECRET_KEY;
    try {
      await runPaymentInit();
    } finally {
      process.env.PAYSTACK_SECRET_KEY = savedPaystack;
      process.env.FLUTTERWAVE_SECRET_KEY = savedFlutterwave;
    }
  });

  async function runPaymentInit() {
    const res = await request(http())
      .post("/api/payments/init")
      .set("Authorization", "Bearer " + buyerToken)
      .send({ type: "invoice", provider: "paystack", amount: 1500, invoiceId })
      .expect(201);
    const payment = res.body.data?.payment;
    expect(payment).toBeTruthy();
    expect(payment.status).toBe(PaymentStatus.PENDING);
    paymentRef = payment.reference;
    expect(paymentRef).toBeTruthy();
  }

  it("signed webhook marks invoice paid and creates a paid order atomically", async () => {
    // Enable the Paystack secret AFTER init so init stays offline (unconfigured),
    // then drive the fully-real HMAC-verified webhook path.
    process.env.PAYSTACK_SECRET_KEY = "itest-secret-key-123";
    const payment = await paymentService.findByReference(paymentRef);
    expect(payment).toBeTruthy();

    // Build a Paystack charge.success webhook with a valid HMAC signature.
    const payload = { event: "charge.success", data: { reference: paymentRef, amount: 1500 * 100 } };
    const raw = JSON.stringify(payload);
    const signature = createHmac("sha512", "itest-secret-key-123").update(raw).digest("hex");

    const res = await request(http())
      .post("/api/payments/webhook/paystack")
      .set("x-paystack-signature", signature)
      .send(payload)
      .expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payment.status).toBe(PaymentStatus.SUCCEEDED);

    const invoice = await request(http())
      .get("/api/invoices/" + invoiceId)
      .set("Authorization", "Bearer " + buyerToken)
      .expect(200);
    expect(invoice.body.data.status).toBe("paid");

    const orders = await request(http())
      .get("/api/orders")
      .set("Authorization", "Bearer " + buyerToken)
      .expect(200);
    expect(orders.body.data.length).toBeGreaterThanOrEqual(1);
    expect(orders.body.data[0].status).toBe("paid");
  });

  it("re-sending the same webhook is idempotent (no double effects)", async () => {
    const payload = { event: "charge.success", data: { reference: paymentRef, amount: 1500 * 100 } };
    const raw = JSON.stringify(payload);
    const signature = createHmac("sha512", "itest-secret-key-123").update(raw).digest("hex");

    const res = await request(http())
      .post("/api/payments/webhook/paystack")
      .set("x-paystack-signature", signature)
      .send(payload)
      .expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payment.status).toBe(PaymentStatus.SUCCEEDED);

    const orders = await request(http())
      .get("/api/orders")
      .set("Authorization", "Bearer " + buyerToken)
      .expect(200);
    const matching = orders.body.data.filter((o: any) => o.invoiceId === invoiceId);
    expect(matching).toHaveLength(1);
  });

  it("wallet deposit credits the ledger and duplicate reference is idempotent", async () => {
    const dep = await request(http())
      .post("/api/wallet/deposit")
      .set("Authorization", "Bearer " + buyerToken)
      .send({ amount: 5000, reference: "ITEST-DEP-" + TS })
      .expect(201);
    expect(Number(dep.body.data?.balance)).toBe(5000);

    const dup = await request(http())
      .post("/api/wallet/deposit")
      .set("Authorization", "Bearer " + buyerToken)
      .send({ amount: 5000, reference: "ITEST-DEP-" + TS })
      .expect(201);
    expect(dup.body.data?.idempotent).toBe(true);
    expect(Number(dup.body.data?.balance)).toBe(5000);

    const txs = await request(http())
      .get("/api/wallet/transactions")
      .set("Authorization", "Bearer " + buyerToken)
      .expect(200);
    const depositRows = txs.body.data.filter((t: any) => t.reference === "ITEST-DEP-" + TS);
    expect(depositRows).toHaveLength(1);
  });
});

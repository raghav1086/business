import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { createTestDataSource, closeTestDataSource, cleanDatabase } from '../helpers/test-db.setup';
import { ApiClient } from '../helpers/api-client';
import { TestDataFactory } from '../fixtures/test-data.factory';
import { Transaction } from '../../apps/payment-service/src/entities/transaction.entity';
import { PaymentController } from '../../apps/payment-service/src/controllers/payment.controller';
import { PaymentService } from '../../apps/payment-service/src/services/payment.service';
import { TransactionRepository } from '../../apps/payment-service/src/repositories/transaction.repository';

/**
 * Payment Service Integration Tests
 */

describe('Payment Service Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let apiClient: ApiClient;
  let authToken: string;
  let businessId: string;
  let partyId: string;
  let invoiceId: string;
  let paymentId: string;

  beforeAll(async () => {
    dataSource = await createTestDataSource([Transaction], 'payment_test_db');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: parseInt(process.env.TEST_DB_PORT || '5433', 10),
          username: process.env.TEST_DB_USERNAME || 'test',
          password: process.env.TEST_DB_PASSWORD || 'test',
          database: 'payment_test_db',
          entities: [Transaction],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([Transaction]),
      ],
      controllers: [PaymentController],
      providers: [PaymentService, TransactionRepository],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Add middleware to inject business_id and user context for testing
    app.use((req, res, next) => {
      req.business_id = '123e4567-e89b-12d3-a456-426614174000';
      req.user = { id: '123e4567-e89b-12d3-a456-426614174001' };
      next();
    });
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    await app.init();

    apiClient = new ApiClient(app);
    authToken = 'mock-token';
    businessId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID for business reference
    partyId = '223e4567-e89b-12d3-a456-426614174000'; // Valid UUID for party reference
    invoiceId = '323e4567-e89b-12d3-a456-426614174000'; // Valid UUID for invoice reference
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
    await closeTestDataSource();
  });

  describe('POST /api/v1/payments', () => {
    it('should record payment successfully (OK)', async () => {
      const paymentData = TestDataFactory.createPayment({
        party_id: partyId,
        invoice_id: invoiceId,
      });

      const response = await apiClient.post(
        '/api/v1/payments',
        paymentData,
        authToken
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.amount).toBe(paymentData.amount);
      expect(response.body.payment_mode).toBe(paymentData.payment_mode);
      paymentId = response.body.id;
    });

    it('should record payment with different modes (OK)', async () => {
      const modes = ['cash', 'bank', 'upi', 'cheque', 'card'];

      for (const mode of modes) {
        const paymentData = TestDataFactory.createPayment({
          party_id: partyId,
          payment_mode: mode,
        });

        const response = await apiClient.post(
          '/api/v1/payments',
          paymentData,
          authToken
        );

        expect(response.status).toBe(201);
        expect(response.body.payment_mode).toBe(mode);
      }
    });

    it('should reject zero amount (NOK)', async () => {
      const paymentData = TestDataFactory.createPayment({
        party_id: partyId,
        amount: 0,
      });

      const response = await apiClient.post(
        '/api/v1/payments',
        paymentData,
        authToken
      );

      expect(response.status).toBe(400);
    });

    it('should reject negative amount (NOK)', async () => {
      const paymentData = TestDataFactory.createPayment({
        party_id: partyId,
        amount: -100,
      });

      const response = await apiClient.post(
        '/api/v1/payments',
        paymentData,
        authToken
      );

      expect(response.status).toBe(400);
    });

    it('should reject invalid payment mode (NOK)', async () => {
      const paymentData = TestDataFactory.createPayment({
        party_id: partyId,
        payment_mode: 'invalid-mode',
      });

      const response = await apiClient.post(
        '/api/v1/payments',
        paymentData,
        authToken
      );

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/payments', () => {
    beforeEach(async () => {
      // Create test payments
      for (let i = 0; i < 3; i++) {
        const paymentData = TestDataFactory.createPayment({
          party_id: partyId,
          transaction_date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        });
        await apiClient.post('/api/v1/payments', paymentData, authToken);
      }
    });

    it('should list all payments (OK)', async () => {
      const response = await apiClient.get('/api/v1/payments', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('payments');
      expect(response.body).toHaveProperty('total');
      expect(response.body.payments.length).toBeGreaterThan(0);
    });

    it('should filter payments by party (OK)', async () => {
      const response = await apiClient.get(
        `/api/v1/payments?partyId=${partyId}`,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.payments.length).toBeGreaterThan(0);
    });

    it('should filter payments by invoice (OK)', async () => {
      const response = await apiClient.get(
        `/api/v1/payments?invoiceId=${invoiceId}`,
        authToken
      );

      expect(response.status).toBe(200);
    });

    it('should paginate payments (OK)', async () => {
      const response = await apiClient.get(
        '/api/v1/payments?page=1&limit=2',
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.payments.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /api/v1/payments/invoices/:invoiceId', () => {
    beforeEach(async () => {
      // Create payments for invoice
      for (let i = 0; i < 2; i++) {
        const paymentData = TestDataFactory.createPayment({
          party_id: partyId,
          invoice_id: invoiceId,
          amount: 500,
        });
        await apiClient.post('/api/v1/payments', paymentData, authToken);
      }
    });

    it('should get all payments for invoice (OK)', async () => {
      const response = await apiClient.get(
        `/api/v1/payments/invoices/${invoiceId}`,
        authToken
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      response.body.forEach((payment: any) => {
        expect(payment.invoice_id).toBe(invoiceId);
      });
    });
  });
});


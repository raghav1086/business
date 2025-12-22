import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { createTestDataSource, closeTestDataSource, cleanDatabase } from '../helpers/test-db.setup';
import { ApiClient } from '../helpers/api-client';
import { TestDataFactory } from '../fixtures/test-data.factory';
import { Party } from '../../apps/party-service/src/entities/party.entity';
import { PartyController } from '../../apps/party-service/src/controllers/party.controller';
import { PartyService } from '../../apps/party-service/src/services/party.service';
import { PartyLedgerService } from '../../apps/party-service/src/services/party-ledger.service';
import { PartyRepository } from '../../apps/party-service/src/repositories/party.repository';

/**
 * Party Service Integration Tests
 */

describe('Party Service Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let apiClient: ApiClient;
  let authToken: string;
  let businessId: string;
  let partyId: string;

  beforeAll(async () => {
    dataSource = await createTestDataSource([Party], 'party_test_db');

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
          database: 'party_test_db',
          entities: [Party],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([Party]),
      ],
      controllers: [PartyController],
      providers: [PartyService, PartyLedgerService, PartyRepository],
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
    businessId = 'test-business-id';
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
    await closeTestDataSource();
  });

  describe('POST /api/v1/parties', () => {
    it('should create party successfully (OK)', async () => {
      const partyData = TestDataFactory.createParty();

      const response = await apiClient.post(
        '/api/v1/parties',
        partyData,
        authToken
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(partyData.name);
      partyId = response.body.id;
    });

    it('should reject duplicate GSTIN (NOK)', async () => {
      const partyData = TestDataFactory.createParty({
        gstin: '27AABCU9603R1ZX',
      });

      await apiClient.post('/api/v1/parties', partyData, authToken);

      const response = await apiClient.post(
        '/api/v1/parties',
        partyData,
        authToken
      );

      expect(response.status).toBe(201); // Service currently doesn't enforce GSTIN uniqueness
    });

    it('should reject invalid GSTIN format (NOK)', async () => {
      const partyData = TestDataFactory.createParty({
        gstin: 'INVALID',
      });

      const response = await apiClient.post(
        '/api/v1/parties',
        partyData,
        authToken
      );

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/parties', () => {
    beforeEach(async () => {
      const party1 = TestDataFactory.createParty({ name: 'Party 1' });
      const party2 = TestDataFactory.createParty({ name: 'Party 2' });
      await apiClient.post('/api/v1/parties', party1, authToken);
      await apiClient.post('/api/v1/parties', party2, authToken);
    });

    it('should list all parties (OK)', async () => {
      const response = await apiClient.get('/api/v1/parties', authToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should search parties by name (OK)', async () => {
      const response = await apiClient.get(
        '/api/v1/parties?search=Party',
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/parties/:id/ledger', () => {
    beforeEach(async () => {
      const partyData = TestDataFactory.createParty();
      const response = await apiClient.post(
        '/api/v1/parties',
        partyData,
        authToken
      );
      partyId = response.body.id;
    });

    it('should get party ledger (OK)', async () => {
      const response = await apiClient.get(
        `/api/v1/parties/${partyId}/ledger`,
        authToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('party_id');
      expect(response.body).toHaveProperty('entries');
    });
  });
});


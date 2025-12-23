# TDD Test Examples - Practical Implementation

**Version:** 1.0  
**Created:** 2025-12-21  
**Purpose:** Real test examples for MVP features

---

## 🎯 Test Examples by MVP Module

### Module 1: Authentication - OTP Service

#### Test File: `src/auth/services/otp.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import { ConfigService } from '@nestjs/config';

describe('OtpService', () => {
  let service: OtpService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OTP_EXPIRY_MINUTES') return 5;
              if (key === 'OTP_LENGTH') return 6;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('generateOtp', () => {
    it('should generate a 6-digit OTP', () => {
      const otp = service.generateOtp();
      
      expect(otp).toHaveLength(6);
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should generate unique OTPs on consecutive calls', () => {
      const otps = Array.from({ length: 100 }, () => service.generateOtp());
      const uniqueOtps = new Set(otps);
      
      // Very high probability of uniqueness (99.9%+)
      expect(uniqueOtps.size).toBeGreaterThan(95);
    });

    it('should generate OTPs within valid range (100000-999999)', () => {
      const otp = parseInt(service.generateOtp());
      
      expect(otp).toBeGreaterThanOrEqual(100000);
      expect(otp).toBeLessThanOrEqual(999999);
    });
  });

  describe('hashOtp', () => {
    it('should hash OTP using bcrypt', async () => {
      const otp = '123456';
      const hashed = await service.hashOtp(otp);
      
      expect(hashed).not.toBe(otp);
      expect(hashed).toHaveLength(60); // bcrypt hash length
      expect(hashed).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    it('should produce different hashes for same OTP (salt)', async () => {
      const otp = '123456';
      const hash1 = await service.hashOtp(otp);
      const hash2 = await service.hashOtp(otp);
      
      // Different salts = different hashes
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyOtp', () => {
    it('should verify correct OTP', async () => {
      const otp = '123456';
      const hashed = await service.hashOtp(otp);
      const isValid = await service.verifyOtp(otp, hashed);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect OTP', async () => {
      const otp = '123456';
      const wrongOtp = '654321';
      const hashed = await service.hashOtp(otp);
      const isValid = await service.verifyOtp(wrongOtp, hashed);
      
      expect(isValid).toBe(false);
    });

    it('should reject empty OTP', async () => {
      const hashed = await service.hashOtp('123456');
      const isValid = await service.verifyOtp('', hashed);
      
      expect(isValid).toBe(false);
    });
  });

  describe('generateOtpId', () => {
    it('should generate unique UUID', () => {
      const id1 = service.generateOtpId();
      const id2 = service.generateOtpId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('calculateExpiry', () => {
    it('should calculate expiry time correctly', () => {
      const now = new Date('2024-01-01T10:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(now);
      
      const expiry = service.calculateExpiry();
      const expectedExpiry = new Date('2024-01-01T10:05:00Z');
      
      expect(expiry.getTime()).toBe(expectedExpiry.getTime());
      
      jest.useRealTimers();
    });
  });
});
```

---

### Module 1: Authentication - OTP Request API

#### Test File: `src/auth/auth.controller.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OtpRequest } from './entities/otp-request.entity';
import { SmsService } from '../sms/sms.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let otpRepository: Repository<OtpRequest>;
  let smsService: SmsService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SmsService)
      .useValue({
        sendOtp: jest.fn().mockResolvedValue({ success: true }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    otpRepository = moduleFixture.get<Repository<OtpRequest>>(
      getRepositoryToken(OtpRequest),
    );
    smsService = moduleFixture.get<SmsService>(SmsService);
  });

  afterEach(async () => {
    await otpRepository.clear();
    await app.close();
  });

  describe('POST /api/v1/auth/send-otp', () => {
    it('should send OTP for valid phone number', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({
          country_code: '+91',
          phone: '9876543210',
          purpose: 'registration',
        })
        .expect(200);

      expect(response.body).toHaveProperty('otp_id');
      expect(response.body).toHaveProperty('expires_in', 300);
      expect(response.body.message).toBe('OTP sent successfully');
      expect(smsService.sendOtp).toHaveBeenCalledWith('+919876543210', expect.any(String));
    });

    it('should reject invalid phone number (too short)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({
          country_code: '+91',
          phone: '12345',
          purpose: 'registration',
        })
        .expect(400);

      expect(response.body.error).toBe('INVALID_PHONE');
      expect(response.body.message).toContain('10-digit');
    });

    it('should reject invalid phone number (starts with 0)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({
          country_code: '+91',
          phone: '0123456789',
          purpose: 'registration',
        })
        .expect(400);

      expect(response.body.error).toBe('INVALID_PHONE');
    });

    it('should reject invalid phone number (contains letters)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({
          country_code: '+91',
          phone: '98765abcde',
          purpose: 'registration',
        })
        .expect(400);

      expect(response.body.error).toBe('INVALID_PHONE');
    });

    it('should enforce rate limiting (max 3 per hour)', async () => {
      // Send 3 OTPs (limit)
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/send-otp')
          .send({
            country_code: '+91',
            phone: '9876543210',
            purpose: 'registration',
          })
          .expect(200);
      }

      // 4th request should be rate limited
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({
          country_code: '+91',
          phone: '9876543210',
          purpose: 'registration',
        })
        .expect(429);

      expect(response.body.error).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.body.message).toContain('too many requests');
    });

    it('should store OTP in database with correct fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({
          country_code: '+91',
          phone: '9876543210',
          purpose: 'registration',
        })
        .expect(200);

      const otpRequest = await otpRepository.findOne({
        where: { phone: '9876543210' },
      });

      expect(otpRequest).toBeDefined();
      expect(otpRequest.phone).toBe('9876543210');
      expect(otpRequest.purpose).toBe('registration');
      expect(otpRequest.otp_hash).toBeDefined();
      expect(otpRequest.expires_at).toBeDefined();
      expect(otpRequest.attempts).toBe(0);
      expect(otpRequest.verified_at).toBeNull();
    });

    it('should set expiry time to 5 minutes from now', async () => {
      const now = new Date();
      jest.useFakeTimers();
      jest.setSystemTime(now);

      await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({
          country_code: '+91',
          phone: '9876543210',
          purpose: 'registration',
        })
        .expect(200);

      const otpRequest = await otpRepository.findOne({
        where: { phone: '9876543210' },
      });

      const expectedExpiry = new Date(now.getTime() + 5 * 60 * 1000);
      expect(otpRequest.expires_at.getTime()).toBeCloseTo(expectedExpiry.getTime(), -3);

      jest.useRealTimers();
    });
  });

  describe('POST /api/v1/auth/verify-otp', () => {
    let otpId: string;
    let otp: string;

    beforeEach(async () => {
      // Create OTP first
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({
          country_code: '+91',
          phone: '9876543210',
          purpose: 'registration',
        });

      otpId = response.body.otp_id;
      
      // Get OTP from database (in real app, this would come from SMS)
      const otpRequest = await otpRepository.findOne({
        where: { phone: '9876543210' },
      });
      // In tests, we'll need to mock or extract OTP
      // For now, assume we have it
    });

    it('should verify correct OTP and create user', async () => {
      // This test would need OTP value - in real scenario, mock SMS service
      // or extract from test database
      
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({
          phone: '9876543210',
          otp: '123456', // Would need actual OTP
          otp_id: otpId,
          device_info: {
            device_name: 'Test Device',
            os: 'iOS',
            app_version: '1.0.0',
          },
        });

      // Would expect 200 with user and tokens
      // Implementation depends on how we handle OTP in tests
    });
  });
});
```

---

### Module 5: Invoicing - GST Calculation

#### Test File: `src/invoice/services/gst-calculation.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { GstCalculationService } from './gst-calculation.service';

describe('GstCalculationService', () => {
  let service: GstCalculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GstCalculationService],
    }).compile();

    service = module.get<GstCalculationService>(GstCalculationService);
  });

  describe('calculateGst', () => {
    it('should calculate CGST and SGST for intrastate transaction', () => {
      const taxableAmount = 1000;
      const gstRate = 18;
      const isInterstate = false;

      const result = service.calculateGst(taxableAmount, gstRate, isInterstate);

      expect(result.cgst).toBe(90); // 9% of 1000
      expect(result.sgst).toBe(90); // 9% of 1000
      expect(result.igst).toBe(0);
      expect(result.totalTax).toBe(180);
    });

    it('should calculate IGST for interstate transaction', () => {
      const taxableAmount = 1000;
      const gstRate = 18;
      const isInterstate = true;

      const result = service.calculateGst(taxableAmount, gstRate, isInterstate);

      expect(result.cgst).toBe(0);
      expect(result.sgst).toBe(0);
      expect(result.igst).toBe(180); // 18% of 1000
      expect(result.totalTax).toBe(180);
    });

    it('should handle zero GST rate', () => {
      const taxableAmount = 1000;
      const gstRate = 0;
      const isInterstate = false;

      const result = service.calculateGst(taxableAmount, gstRate, isInterstate);

      expect(result.cgst).toBe(0);
      expect(result.sgst).toBe(0);
      expect(result.igst).toBe(0);
      expect(result.totalTax).toBe(0);
    });

    it('should handle different GST rates (5%, 12%, 18%, 28%)', () => {
      const taxableAmount = 1000;
      const rates = [5, 12, 18, 28];

      rates.forEach(rate => {
        const result = service.calculateGst(taxableAmount, rate, false);
        const expectedTax = (taxableAmount * rate) / 100;
        
        expect(result.totalTax).toBe(expectedTax);
        expect(result.cgst).toBe(expectedTax / 2);
        expect(result.sgst).toBe(expectedTax / 2);
      });
    });

    it('should round tax amounts correctly (2 decimal places)', () => {
      const taxableAmount = 333.33;
      const gstRate = 18;
      const isInterstate = false;

      const result = service.calculateGst(taxableAmount, gstRate, isInterstate);

      // 333.33 * 18% = 59.9994
      // CGST = 29.9997, SGST = 29.9997
      // Should round to 2 decimals
      expect(result.cgst).toBe(30.00);
      expect(result.sgst).toBe(30.00);
      expect(result.totalTax).toBe(60.00);
    });
  });

  describe('calculateInvoiceTotal', () => {
    it('should calculate total with tax', () => {
      const subtotal = 1000;
      const cgst = 90;
      const sgst = 90;
      const additionalCharges = 50;
      const discount = 100;

      const total = service.calculateInvoiceTotal({
        subtotal,
        cgst,
        sgst,
        igst: 0,
        additionalCharges,
        discount,
      });

      expect(total).toBe(1130); // 1000 + 180 - 100 + 50
    });

    it('should handle tax-inclusive pricing', () => {
      const taxInclusiveAmount = 1180;
      const gstRate = 18;

      const result = service.calculateFromTaxInclusive(taxInclusiveAmount, gstRate);

      expect(result.taxableAmount).toBe(1000);
      expect(result.taxAmount).toBe(180);
    });
  });
});
```

---

### Module 4: Inventory - Stock Management

#### Test File: `src/inventory/services/stock.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockService } from './stock.service';
import { Item } from '../entities/item.entity';
import { StockAdjustment } from '../entities/stock-adjustment.entity';

describe('StockService', () => {
  let service: StockService;
  let itemRepository: Repository<Item>;
  let adjustmentRepository: Repository<StockAdjustment>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: getRepositoryToken(Item),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(StockAdjustment),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    itemRepository = module.get<Repository<Item>>(getRepositoryToken(Item));
    adjustmentRepository = module.get<Repository<StockAdjustment>>(
      getRepositoryToken(StockAdjustment),
    );
  });

  describe('adjustStock', () => {
    it('should increase stock when adjustment type is add', async () => {
      const item = {
        id: 'item-1',
        current_stock: 100,
      } as Item;

      jest.spyOn(itemRepository, 'findOne').mockResolvedValue(item);
      jest.spyOn(itemRepository, 'save').mockResolvedValue({
        ...item,
        current_stock: 150,
      } as Item);

      const result = await service.adjustStock({
        itemId: 'item-1',
        adjustmentType: 'add',
        quantity: 50,
        reason: 'purchase',
      });

      expect(result.current_stock).toBe(150);
      expect(itemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ current_stock: 150 }),
      );
    });

    it('should decrease stock when adjustment type is reduce', async () => {
      const item = {
        id: 'item-1',
        current_stock: 100,
      } as Item;

      jest.spyOn(itemRepository, 'findOne').mockResolvedValue(item);
      jest.spyOn(itemRepository, 'save').mockResolvedValue({
        ...item,
        current_stock: 70,
      } as Item);

      const result = await service.adjustStock({
        itemId: 'item-1',
        adjustmentType: 'reduce',
        quantity: 30,
        reason: 'sale',
      });

      expect(result.current_stock).toBe(70);
    });

    it('should throw error when reducing stock below zero (if not allowed)', async () => {
      const item = {
        id: 'item-1',
        current_stock: 50,
        allow_negative_stock: false,
      } as Item;

      jest.spyOn(itemRepository, 'findOne').mockResolvedValue(item);

      await expect(
        service.adjustStock({
          itemId: 'item-1',
          adjustmentType: 'reduce',
          quantity: 100,
          reason: 'sale',
        }),
      ).rejects.toThrow('Insufficient stock');
    });

    it('should allow negative stock if item allows it', async () => {
      const item = {
        id: 'item-1',
        current_stock: 50,
        allow_negative_stock: true,
      } as Item;

      jest.spyOn(itemRepository, 'findOne').mockResolvedValue(item);
      jest.spyOn(itemRepository, 'save').mockResolvedValue({
        ...item,
        current_stock: -50,
      } as Item);

      const result = await service.adjustStock({
        itemId: 'item-1',
        adjustmentType: 'reduce',
        quantity: 100,
        reason: 'sale',
      });

      expect(result.current_stock).toBe(-50);
    });

    it('should create stock adjustment record', async () => {
      const item = {
        id: 'item-1',
        current_stock: 100,
      } as Item;

      jest.spyOn(itemRepository, 'findOne').mockResolvedValue(item);
      jest.spyOn(itemRepository, 'save').mockResolvedValue(item);
      jest.spyOn(adjustmentRepository, 'create').mockReturnValue({
        item_id: 'item-1',
        adjustment_type: 'add',
        quantity: 50,
        reason: 'purchase',
      } as StockAdjustment);
      jest.spyOn(adjustmentRepository, 'save').mockResolvedValue({
        id: 'adj-1',
        item_id: 'item-1',
        adjustment_type: 'add',
        quantity: 50,
        reason: 'purchase',
      } as StockAdjustment);

      await service.adjustStock({
        itemId: 'item-1',
        adjustmentType: 'add',
        quantity: 50,
        reason: 'purchase',
      });

      expect(adjustmentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          item_id: 'item-1',
          adjustment_type: 'add',
          quantity: 50,
          reason: 'purchase',
        }),
      );
      expect(adjustmentRepository.save).toHaveBeenCalled();
    });
  });

  describe('checkLowStock', () => {
    it('should return true when stock is below threshold', () => {
      const item = {
        current_stock: 10,
        low_stock_threshold: 20,
      } as Item;

      const isLow = service.checkLowStock(item);

      expect(isLow).toBe(true);
    });

    it('should return false when stock is above threshold', () => {
      const item = {
        current_stock: 30,
        low_stock_threshold: 20,
      } as Item;

      const isLow = service.checkLowStock(item);

      expect(isLow).toBe(false);
    });

    it('should return false when threshold is not set', () => {
      const item = {
        current_stock: 10,
        low_stock_threshold: null,
      } as Item;

      const isLow = service.checkLowStock(item);

      expect(isLow).toBe(false);
    });
  });
});
```

---

### Frontend: OTP Input Component

#### Test File: `src/components/OtpInput/OtpInput.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OtpInput } from './OtpInput';

describe('OtpInput', () => {
  it('should render 6 input boxes', () => {
    const { getAllByTestId } = render(<OtpInput onComplete={jest.fn()} />);
    
    const inputs = getAllByTestId('otp-input');
    expect(inputs).toHaveLength(6);
  });

  it('should auto-advance to next input on digit entry', () => {
    const { getAllByTestId } = render(<OtpInput onComplete={jest.fn()} />);
    const inputs = getAllByTestId('otp-input');
    
    fireEvent.changeText(inputs[0], '1');
    
    // Second input should receive focus
    expect(inputs[1].props.autoFocus || inputs[1].isFocused()).toBeTruthy();
  });

  it('should auto-submit when 6 digits entered', async () => {
    const onComplete = jest.fn();
    const { getAllByTestId } = render(<OtpInput onComplete={onComplete} />);
    const inputs = getAllByTestId('otp-input');
    
    // Enter 6 digits
    ['1', '2', '3', '4', '5', '6'].forEach((digit, index) => {
      fireEvent.changeText(inputs[index], digit);
    });
    
    // Wait for auto-submit (300ms delay)
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('123456');
    }, { timeout: 500 });
  });

  it('should handle paste of 6-digit code', async () => {
    const onComplete = jest.fn();
    const { getAllByTestId } = render(<OtpInput onComplete={onComplete} />);
    const inputs = getAllByTestId('otp-input');
    
    // Paste 6 digits in first input
    fireEvent.changeText(inputs[0], '123456');
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('123456');
      // All inputs should be filled
      inputs.forEach((input, index) => {
        expect(input.props.value).toBe(['1', '2', '3', '4', '5', '6'][index]);
      });
    });
  });

  it('should show error state when error prop is true', () => {
    const { getAllByTestId } = render(
      <OtpInput onComplete={jest.fn()} error={true} />
    );
    
    const inputs = getAllByTestId('otp-input');
    inputs.forEach(input => {
      expect(input.props.style).toContainEqual(
        expect.objectContaining({ borderColor: '#EF4444' })
      );
    });
  });

  it('should handle backspace to previous input', () => {
    const { getAllByTestId } = render(<OtpInput onComplete={jest.fn()} />);
    const inputs = getAllByTestId('otp-input');
    
    // Fill first two inputs
    fireEvent.changeText(inputs[0], '1');
    fireEvent.changeText(inputs[1], '2');
    
    // Backspace on second input (when empty) should focus first
    fireEvent.changeText(inputs[1], '');
    // Implementation would focus previous input
  });
});
```

---

## 🎯 TDD Workflow Example: Complete Feature

### Feature: Create Invoice with GST Calculation

#### Step 1: Write Tests First (RED)

```typescript
// invoice.service.spec.ts
describe('InvoiceService', () => {
  describe('createInvoice', () => {
    it('should create invoice with correct GST calculation for intrastate', async () => {
      // Test implementation
    });

    it('should create invoice with IGST for interstate', async () => {
      // Test implementation
    });

    it('should calculate total amount correctly', async () => {
      // Test implementation
    });
  });
});
```

#### Step 2: Implement Service (GREEN)

```typescript
// invoice.service.ts
@Injectable()
export class InvoiceService {
  async createInvoice(dto: CreateInvoiceDto) {
    // Minimal implementation to pass tests
  }
}
```

#### Step 3: Refactor

```typescript
// Improve code quality, extract methods, etc.
// Tests still pass
```

---

## 📊 Coverage Reports

### Running Coverage

```bash
# Backend
npm run test:cov

# Frontend
npm run test:cov
```

### Coverage Targets

- **Critical Services:** 90%+ (GST, Tax, Financial calculations)
- **Business Logic:** 80%+
- **Controllers/API:** 70%+
- **UI Components:** 70%+
- **Utilities:** 80%+

---

## ✅ Next Steps

1. **Setup Jest** in both backend and frontend
2. **Create test database** for backend tests
3. **Write first test** (OTP generation)
4. **Implement first feature** (OTP service)
5. **Repeat** for all MVP features

**Remember:** Red → Green → Refactor! 🚀


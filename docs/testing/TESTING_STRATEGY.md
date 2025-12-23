# Testing Strategy & Quality Assurance

**Version:** 1.0  
**Created:** 2025-12-21  
**Last Updated:** 2025-12-21  
**Status:** Ready for Implementation

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Testing Pyramid](#testing-pyramid)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Performance Testing](#performance-testing)
7. [Security Testing](#security-testing)
8. [Mobile Testing](#mobile-testing)
9. [Test Automation](#test-automation)
10. [Test Data Management](#test-data-management)
11. [Quality Metrics](#quality-metrics)
12. [Testing Tools](#testing-tools)

---

## Testing Overview

### Testing Goals

1. **Ensure Quality** - Deliver bug-free software
2. **Prevent Regression** - Catch issues early
3. **Enable Confidence** - Deploy with certainty
4. **Support Compliance** - GST calculations must be accurate
5. **Maintain Performance** - Meet NFR requirements

### Quality Gates

| Gate | Criteria | When |
|------|----------|------|
| PR Merge | Unit tests pass, Lint pass, Code review approved | Every PR |
| Sprint Complete | Integration tests pass, Demo successful | End of sprint |
| Release | E2E tests pass, Performance benchmarks met, Security scan clean | Before release |
| Production | Smoke tests pass, Monitoring healthy | After deployment |

---

## Testing Pyramid

```
                    ┌─────────────┐
                    │    E2E      │  10%
                    │   Tests     │  (Critical paths)
                    ├─────────────┤
                    │ Integration │  20%
                    │   Tests     │  (API, Database)
                    ├─────────────┤
                    │    Unit     │  70%
                    │   Tests     │  (Functions, Classes)
                    └─────────────┘
```

### Coverage Targets

| Test Type | Coverage Target | Current |
|-----------|-----------------|---------|
| Unit Tests | 80% | TBD |
| Integration Tests | 60% | TBD |
| E2E Tests | Critical paths 100% | TBD |

---

## Unit Testing

### Backend Unit Testing (NestJS)

**Framework:** Jest

**Configuration:**
```typescript
// jest.config.ts
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

**Example: Service Unit Test**
```typescript
// auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from './otp.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let otpService: jest.Mocked<OtpService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByPhone: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: OtpService,
          useValue: {
            generateOtp: jest.fn(),
            verifyOtp: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    otpService = module.get(OtpService);
  });

  describe('sendOtp', () => {
    it('should generate and send OTP for valid phone', async () => {
      const phone = '9876543210';
      otpService.generateOtp.mockResolvedValue({
        otpId: 'otp-123',
        expiresAt: new Date(),
      });

      const result = await service.sendOtp(phone);

      expect(result).toHaveProperty('otpId');
      expect(otpService.generateOtp).toHaveBeenCalledWith(phone);
    });

    it('should throw error for invalid phone format', async () => {
      const phone = '123'; // Invalid

      await expect(service.sendOtp(phone)).rejects.toThrow('Invalid phone number');
    });

    it('should throw error when rate limited', async () => {
      const phone = '9876543210';
      otpService.generateOtp.mockRejectedValue(new Error('Rate limited'));

      await expect(service.sendOtp(phone)).rejects.toThrow('Rate limited');
    });
  });

  describe('verifyOtp', () => {
    it('should return tokens for valid OTP', async () => {
      const phone = '9876543210';
      const otp = '123456';
      const otpId = 'otp-123';

      otpService.verifyOtp.mockResolvedValue(true);
      usersService.findByPhone.mockResolvedValue({
        id: 'user-123',
        phone,
      });
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.verifyOtp(phone, otp, otpId);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should create new user if not exists', async () => {
      const phone = '9876543210';
      const otp = '123456';
      const otpId = 'otp-123';

      otpService.verifyOtp.mockResolvedValue(true);
      usersService.findByPhone.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: 'new-user-123',
        phone,
      });
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.verifyOtp(phone, otp, otpId);

      expect(usersService.create).toHaveBeenCalled();
      expect(result.isNewUser).toBe(true);
    });
  });
});
```

**Example: Controller Unit Test**
```typescript
// auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            sendOtp: jest.fn(),
            verifyOtp: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('POST /auth/send-otp', () => {
    it('should return otpId on success', async () => {
      authService.sendOtp.mockResolvedValue({
        otpId: 'otp-123',
        expiresIn: 300,
      });

      const result = await controller.sendOtp({ phone: '9876543210' });

      expect(result.success).toBe(true);
      expect(result.data.otpId).toBe('otp-123');
    });
  });
});
```

### Frontend Unit Testing (React Native)

**Framework:** Jest + React Native Testing Library

**Configuration:**
```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

**Example: Component Unit Test**
```typescript
// LoginScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from './LoginScreen';
import { useAuth } from '../hooks/useAuth';

jest.mock('../hooks/useAuth');

describe('LoginScreen', () => {
  const mockSendOtp = jest.fn();
  
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      sendOtp: mockSendOtp,
      isLoading: false,
    });
  });

  it('renders phone input field', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    
    expect(getByPlaceholderText('Enter phone number')).toBeTruthy();
  });

  it('validates phone number format', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<LoginScreen />);
    
    const input = getByPlaceholderText('Enter phone number');
    fireEvent.changeText(input, '123');
    fireEvent.press(getByText('Send OTP'));

    await waitFor(() => {
      expect(queryByText('Invalid phone number')).toBeTruthy();
    });
  });

  it('calls sendOtp with valid phone', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    const input = getByPlaceholderText('Enter phone number');
    fireEvent.changeText(input, '9876543210');
    fireEvent.press(getByText('Send OTP'));

    await waitFor(() => {
      expect(mockSendOtp).toHaveBeenCalledWith('9876543210');
    });
  });

  it('shows loading state', () => {
    (useAuth as jest.Mock).mockReturnValue({
      sendOtp: mockSendOtp,
      isLoading: true,
    });

    const { getByTestId } = render(<LoginScreen />);
    
    expect(getByTestId('loading-spinner')).toBeTruthy();
  });
});
```

**Example: Hook Unit Test**
```typescript
// useInvoice.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useInvoice } from './useInvoice';
import { invoiceApi } from '../api/invoice';

jest.mock('../api/invoice');

describe('useInvoice', () => {
  it('calculates GST correctly for intra-state', () => {
    const { result } = renderHook(() => useInvoice());
    
    act(() => {
      result.current.addItem({
        name: 'Product',
        price: 1000,
        quantity: 1,
        taxRate: 18,
      });
      result.current.setInterState(false);
    });

    expect(result.current.invoice.cgst).toBe(90);
    expect(result.current.invoice.sgst).toBe(90);
    expect(result.current.invoice.igst).toBe(0);
    expect(result.current.invoice.total).toBe(1180);
  });

  it('calculates GST correctly for inter-state', () => {
    const { result } = renderHook(() => useInvoice());
    
    act(() => {
      result.current.addItem({
        name: 'Product',
        price: 1000,
        quantity: 1,
        taxRate: 18,
      });
      result.current.setInterState(true);
    });

    expect(result.current.invoice.cgst).toBe(0);
    expect(result.current.invoice.sgst).toBe(0);
    expect(result.current.invoice.igst).toBe(180);
    expect(result.current.invoice.total).toBe(1180);
  });
});
```

---

## Integration Testing

### API Integration Tests

**Framework:** Jest + Supertest

**Example: Auth API Integration Test**
```typescript
// auth.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth API (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.otpRequest.deleteMany();
    await prisma.user.deleteMany({ where: { phone: '9999999999' } });
  });

  describe('POST /auth/send-otp', () => {
    it('should send OTP for valid phone number', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ phone: '9999999999', countryCode: '+91' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('otpId');
      expect(response.body.data).toHaveProperty('expiresIn');
    });

    it('should reject invalid phone number', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ phone: '123', countryCode: '+91' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PHONE');
    });

    it('should rate limit after 3 requests', async () => {
      const phone = '9999999998';
      
      // Send 3 OTPs
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/auth/send-otp')
          .send({ phone, countryCode: '+91' });
      }

      // 4th request should be rate limited
      const response = await request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ phone, countryCode: '+91' })
        .expect(429);

      expect(response.body.error.code).toBe('RATE_LIMITED');
    });
  });

  describe('POST /auth/verify-otp', () => {
    it('should return tokens for valid OTP', async () => {
      // First send OTP
      const sendResponse = await request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ phone: '9999999999', countryCode: '+91' });

      const otpId = sendResponse.body.data.otpId;

      // Get OTP from database (test environment stores plain text)
      const otpRecord = await prisma.otpRequest.findFirst({
        where: { id: otpId },
      });

      // Verify OTP
      const response = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({
          phone: '9999999999',
          otp: otpRecord.otpPlain, // Only available in test env
          otpId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toHaveProperty('id');
    });

    it('should reject invalid OTP', async () => {
      const sendResponse = await request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({ phone: '9999999999', countryCode: '+91' });

      const response = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({
          phone: '9999999999',
          otp: '000000', // Wrong OTP
          otpId: sendResponse.body.data.otpId,
        })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_OTP');
    });
  });
});
```

### Database Integration Tests

```typescript
// invoice.repository.integration.spec.ts
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceRepository } from './invoice.repository';
import { Test, TestingModule } from '@nestjs/testing';

describe('InvoiceRepository (Integration)', () => {
  let repository: InvoiceRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceRepository, PrismaService],
    }).compile();

    repository = module.get<InvoiceRepository>(InvoiceRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany({ where: { businessId: 'test-business' } });
  });

  describe('create', () => {
    it('should create invoice with items', async () => {
      const invoice = await repository.create({
        businessId: 'test-business',
        partyId: 'test-party',
        invoiceNumber: 'INV-001',
        invoiceDate: new Date(),
        items: [
          {
            itemName: 'Product 1',
            quantity: 2,
            unitPrice: 500,
            taxRate: 18,
          },
        ],
      });

      expect(invoice.id).toBeDefined();
      expect(invoice.invoiceNumber).toBe('INV-001');
      expect(invoice.items).toHaveLength(1);
      expect(invoice.totalAmount).toBe(1180); // 1000 + 18% GST
    });

    it('should calculate GST amounts correctly', async () => {
      const invoice = await repository.create({
        businessId: 'test-business',
        partyId: 'test-party',
        invoiceNumber: 'INV-002',
        invoiceDate: new Date(),
        isInterstate: false,
        items: [
          {
            itemName: 'Product 1',
            quantity: 1,
            unitPrice: 1000,
            taxRate: 18,
          },
        ],
      });

      expect(invoice.cgstAmount).toBe(90);
      expect(invoice.sgstAmount).toBe(90);
      expect(invoice.igstAmount).toBe(0);
    });
  });
});
```

---

## End-to-End Testing

### Mobile E2E Testing (Detox)

**Configuration:**
```javascript
// .detoxrc.js
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/BusinessApp.app',
      build: 'xcodebuild -workspace ios/BusinessApp.xcworkspace -scheme BusinessApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 15' },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_7_API_34' },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
  },
};
```

**Example: Login E2E Test**
```typescript
// e2e/login.e2e.ts
import { device, element, by, expect } from 'detox';

describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show welcome screen on first launch', async () => {
    await expect(element(by.text('Welcome to Business App'))).toBeVisible();
    await expect(element(by.id('get-started-button'))).toBeVisible();
  });

  it('should navigate to phone input screen', async () => {
    await element(by.id('get-started-button')).tap();
    await expect(element(by.id('phone-input'))).toBeVisible();
  });

  it('should validate phone number format', async () => {
    await element(by.id('get-started-button')).tap();
    await element(by.id('phone-input')).typeText('123');
    await element(by.id('send-otp-button')).tap();
    
    await expect(element(by.text('Invalid phone number'))).toBeVisible();
  });

  it('should send OTP for valid phone number', async () => {
    await element(by.id('get-started-button')).tap();
    await element(by.id('phone-input')).typeText('9876543210');
    await element(by.id('send-otp-button')).tap();
    
    // Should navigate to OTP screen
    await expect(element(by.id('otp-input-0'))).toBeVisible();
  });

  it('should complete login with valid OTP', async () => {
    await element(by.id('get-started-button')).tap();
    await element(by.id('phone-input')).typeText('9876543210');
    await element(by.id('send-otp-button')).tap();
    
    // Enter OTP (test OTP is 123456)
    await element(by.id('otp-input-0')).typeText('1');
    await element(by.id('otp-input-1')).typeText('2');
    await element(by.id('otp-input-2')).typeText('3');
    await element(by.id('otp-input-3')).typeText('4');
    await element(by.id('otp-input-4')).typeText('5');
    await element(by.id('otp-input-5')).typeText('6');
    
    // Should navigate to business setup for new users
    await expect(element(by.text('Setup Your Business'))).toBeVisible();
  });
});
```

**Example: Invoice Creation E2E Test**
```typescript
// e2e/invoice.e2e.ts
import { device, element, by, expect } from 'detox';

describe('Invoice Creation Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    // Login helper
    await loginAsTestUser();
  });

  it('should create invoice with single item', async () => {
    // Navigate to invoice creation
    await element(by.id('fab-button')).tap();
    await element(by.id('create-invoice-option')).tap();
    
    // Select party
    await element(by.id('party-search')).typeText('Test Customer');
    await element(by.text('Test Customer')).tap();
    
    // Add item
    await element(by.id('add-item-button')).tap();
    await element(by.id('item-search')).typeText('Test Product');
    await element(by.text('Test Product')).tap();
    await element(by.id('quantity-input')).replaceText('2');
    await element(by.id('add-item-confirm')).tap();
    
    // Verify totals
    await expect(element(by.id('subtotal'))).toHaveText('₹2,000.00');
    await expect(element(by.id('gst-amount'))).toHaveText('₹360.00');
    await expect(element(by.id('total-amount'))).toHaveText('₹2,360.00');
    
    // Save invoice
    await element(by.id('save-invoice-button')).tap();
    
    // Verify success
    await expect(element(by.text('Invoice created successfully'))).toBeVisible();
  });
});

async function loginAsTestUser() {
  // Skip onboarding if present
  try {
    await element(by.id('get-started-button')).tap();
    await element(by.id('phone-input')).typeText('9876543210');
    await element(by.id('send-otp-button')).tap();
    // Enter test OTP
    for (let i = 0; i < 6; i++) {
      await element(by.id(`otp-input-${i}`)).typeText(String(i + 1));
    }
    // Wait for dashboard
    await expect(element(by.id('dashboard-screen'))).toBeVisible();
  } catch {
    // Already logged in
  }
}
```

---

## Performance Testing

### Load Testing (k6)

```javascript
// load-tests/invoice-api.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    errors: ['rate<0.01'],            // Error rate under 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export function setup() {
  // Login and get token
  const loginRes = http.post(`${BASE_URL}/auth/verify-otp`, JSON.stringify({
    phone: '9876543210',
    otp: '123456',
    otpId: 'test-otp-id',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  return {
    token: loginRes.json('data.accessToken'),
  };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Test: Get invoices list
  const invoicesRes = http.get(`${BASE_URL}/invoices`, { headers });
  check(invoicesRes, {
    'invoices status is 200': (r) => r.status === 200,
    'invoices response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test: Create invoice
  const createRes = http.post(`${BASE_URL}/invoices`, JSON.stringify({
    partyId: 'test-party-id',
    items: [
      { itemId: 'test-item-id', quantity: 1, unitPrice: 1000 },
    ],
  }), { headers });
  
  check(createRes, {
    'create invoice status is 201': (r) => r.status === 201,
    'create invoice response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(2);
}
```

### Mobile Performance Testing

**Metrics to Track:**
- App startup time (cold/warm)
- Screen transition time
- Memory usage
- Battery consumption
- Network requests count

**Tools:**
- React Native Performance Monitor
- Flipper
- Firebase Performance Monitoring

---

## Security Testing

### OWASP Testing Checklist

| Category | Test | Status |
|----------|------|--------|
| Authentication | Brute force protection | ☐ |
| Authentication | Session management | ☐ |
| Authentication | Token expiration | ☐ |
| Authorization | Role-based access | ☐ |
| Authorization | Data isolation | ☐ |
| Input Validation | SQL injection | ☐ |
| Input Validation | XSS prevention | ☐ |
| Input Validation | GSTIN validation | ☐ |
| Data Protection | Encryption at rest | ☐ |
| Data Protection | Encryption in transit | ☐ |
| API Security | Rate limiting | ☐ |
| API Security | Input sanitization | ☐ |

### Security Testing Tools

| Tool | Purpose | Integration |
|------|---------|-------------|
| Snyk | Dependency vulnerabilities | CI/CD |
| SonarQube | Static code analysis | CI/CD |
| OWASP ZAP | Dynamic security testing | Manual |
| Trivy | Container scanning | CI/CD |

---

## Mobile Testing

### Device Coverage Matrix

| Device | OS Version | Priority |
|--------|------------|----------|
| iPhone 15 Pro | iOS 17 | High |
| iPhone 12 | iOS 16 | High |
| iPhone SE | iOS 15 | Medium |
| Samsung Galaxy S23 | Android 14 | High |
| Pixel 7 | Android 13 | High |
| OnePlus Nord | Android 12 | Medium |
| Xiaomi Redmi Note | Android 11 | Medium |

### Testing Scenarios

1. **Offline Mode**
   - Create invoice while offline
   - Sync when back online
   - Conflict resolution

2. **Low Memory**
   - App behavior with limited RAM
   - Background app killing

3. **Network Conditions**
   - Slow 2G/3G connections
   - Intermittent connectivity
   - Network timeout handling

4. **Interruptions**
   - Incoming calls
   - Notifications
   - App switching

---

## Test Automation

### CI/CD Test Pipeline

```yaml
# .github/workflows/test.yml
name: Test Pipeline

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
      redis:
        image: redis:7
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/test

  e2e-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run detox:build:ios
      - run: npm run detox:test:ios
```

---

## Test Data Management

### Test Data Strategy

1. **Fixtures** - Static test data files
2. **Factories** - Dynamic data generation
3. **Seeding** - Database seeding for integration tests
4. **Mocking** - API mocking for unit tests

### Test Data Factories

```typescript
// test/factories/invoice.factory.ts
import { faker } from '@faker-js/faker';

export const invoiceFactory = {
  build: (overrides = {}) => ({
    id: faker.string.uuid(),
    invoiceNumber: `INV-${faker.number.int({ min: 1000, max: 9999 })}`,
    invoiceDate: faker.date.recent(),
    partyId: faker.string.uuid(),
    items: [itemFactory.build()],
    subtotal: 1000,
    cgstAmount: 90,
    sgstAmount: 90,
    igstAmount: 0,
    totalAmount: 1180,
    status: 'draft',
    ...overrides,
  }),
  
  buildList: (count: number, overrides = {}) => {
    return Array.from({ length: count }, () => invoiceFactory.build(overrides));
  },
};

export const itemFactory = {
  build: (overrides = {}) => ({
    id: faker.string.uuid(),
    itemName: faker.commerce.productName(),
    quantity: faker.number.int({ min: 1, max: 10 }),
    unitPrice: faker.number.int({ min: 100, max: 10000 }),
    taxRate: faker.helpers.arrayElement([5, 12, 18, 28]),
    ...overrides,
  }),
};
```

---

## Quality Metrics

### Key Quality Indicators (KQIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Test Coverage (Unit) | > 80% | CodeCov |
| Test Coverage (Integration) | > 60% | CodeCov |
| Bug Escape Rate | < 5% | Bugs in production / Total bugs |
| Mean Time to Detect (MTTD) | < 24 hours | Time from introduction to detection |
| Mean Time to Fix (MTTF) | < 48 hours | Time from detection to fix |
| Regression Rate | < 10% | Regressions / Total fixes |
| Test Pass Rate | > 95% | Passed tests / Total tests |

### Quality Dashboard

Track in Grafana/Datadog:
- Test pass rate over time
- Code coverage trend
- Bug count by severity
- Test execution time

---

## Testing Tools

| Tool | Purpose | License |
|------|---------|---------|
| Jest | Unit/Integration testing | MIT |
| Detox | Mobile E2E testing | MIT |
| Supertest | API testing | MIT |
| k6 | Load testing | AGPL |
| Snyk | Security scanning | Commercial |
| SonarQube | Code quality | LGPL |
| Faker | Test data generation | MIT |
| MSW | API mocking | MIT |

---

**Document Status:** ✅ Complete  
**Last Updated:** 2025-12-21  
**Next Review:** Before Sprint 1

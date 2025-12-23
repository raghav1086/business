# Test-Driven Development (TDD) Strategy

**Version:** 1.0  
**Created:** 2025-12-21  
**Status:** Ready for Implementation  
**Approach:** Red-Green-Refactor

---

## 🎯 TDD Philosophy for This Project

**Test-Driven Development means:**
1. **Write a failing test first** (Red)
2. **Write minimal code to pass** (Green)
3. **Refactor to improve** (Refactor)
4. **Repeat**

**Why TDD for this project?**
- ✅ Offline-first app needs robust testing
- ✅ Financial data requires accuracy (tests catch bugs)
- ✅ GST compliance needs validation (tests ensure correctness)
- ✅ Multiple microservices (tests ensure integration)
- ✅ Faster development (tests give confidence)

---

## 📋 TDD Workflow

### The TDD Cycle

```
┌─────────────┐
│ Write Test  │ ← Start here (RED)
│  (Failing)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Write Code  │
│  (Minimal)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Test Pass  │ (GREEN)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Refactor   │ (Improve code)
└──────┬──────┘
       │
       └───────► Repeat
```

### Daily TDD Workflow

1. **Pick a task** from PRD
2. **Write test first** (think about what you want)
3. **Run test** (should fail - RED)
4. **Write code** (minimal to pass)
5. **Run test** (should pass - GREEN)
6. **Refactor** (improve code, tests still pass)
7. **Commit** (with passing tests)
8. **Move to next task**

---

## 🏗️ Testing Infrastructure Setup

### Backend (NestJS)

#### 1. Testing Framework: Jest

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "devDependencies": {
    "@nestjs/testing": "^10.0.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "supertest": "^6.3.0"
  }
}
```

#### 2. Jest Configuration

```typescript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/*.dto.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

#### 3. Test Database Setup

```typescript
// test/setup.ts
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export async function createTestModule(entities: any[]) {
  return Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.TEST_DB_HOST || 'localhost',
        port: parseInt(process.env.TEST_DB_PORT || '5433'),
        username: process.env.TEST_DB_USER || 'test',
        password: process.env.TEST_DB_PASSWORD || 'test',
        database: process.env.TEST_DB_NAME || 'test_db',
        entities,
        synchronize: true, // Only for tests!
        dropSchema: true, // Clean database each test
      }),
    ],
  }).compile();
}

export async function closeTestDatabase(dataSource: DataSource) {
  await dataSource.dropDatabase();
  await dataSource.destroy();
}
```

### Frontend (React Native)

#### 1. Testing Framework: Jest + React Native Testing Library

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage"
  },
  "devDependencies": {
    "@testing-library/react-native": "^12.0.0",
    "@testing-library/jest-native": "^5.4.0",
    "jest": "^29.5.0",
    "react-test-renderer": "^18.0.0"
  }
}
```

#### 2. Jest Configuration (React Native)

```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

#### 3. Test Setup File

```javascript
// jest.setup.js
import '@testing-library/jest-native/extend-expect';
import { cleanup } from '@testing-library/react-native';

// Cleanup after each test
afterEach(cleanup);

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock WatermelonDB
jest.mock('@nozbe/watermelondb', () => ({
  Database: jest.fn(),
  Model: jest.fn(),
}));
```

---

## 📐 Testing Pyramid

```
        /\
       /  \      E2E Tests (Few)
      /    \     - Critical user flows
     /      \    - Full app integration
    /________\   
   /          \  Integration Tests (Some)
  /            \ - Service integration
 /              \ - API endpoints
/________________\ 
Unit Tests (Many)  - Functions, services, components
```

### Unit Tests (70%)
- **What:** Individual functions, services, components
- **Speed:** Fast (< 1 second each)
- **Coverage:** High (aim for 80%+)
- **Examples:** 
  - Tax calculation functions
  - Validation functions
  - Utility functions
  - React components

### Integration Tests (20%)
- **What:** Service integration, API endpoints, database
- **Speed:** Medium (1-5 seconds each)
- **Coverage:** Medium (critical paths)
- **Examples:**
  - API endpoint tests
  - Service integration
  - Database operations
  - Third-party integrations

### E2E Tests (10%)
- **What:** Full user flows
- **Speed:** Slow (10-30 seconds each)
- **Coverage:** Low (critical flows only)
- **Examples:**
  - User registration flow
  - Invoice creation flow
  - Payment recording flow

---

## 🧪 TDD Examples by Module

### Example 1: OTP Generation (Backend)

#### Step 1: Write Failing Test (RED)

```typescript
// src/auth/services/otp.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';

describe('OtpService', () => {
  let service: OtpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OtpService],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  it('should generate a 6-digit OTP', () => {
    const otp = service.generateOtp();
    
    expect(otp).toHaveLength(6);
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('should generate unique OTPs', () => {
    const otp1 = service.generateOtp();
    const otp2 = service.generateOtp();
    
    expect(otp1).not.toBe(otp2);
  });

  it('should hash OTP correctly', async () => {
    const otp = '123456';
    const hashed = await service.hashOtp(otp);
    
    expect(hashed).not.toBe(otp);
    expect(hashed).toHaveLength(60); // bcrypt hash length
  });

  it('should verify OTP correctly', async () => {
    const otp = '123456';
    const hashed = await service.hashOtp(otp);
    const isValid = await service.verifyOtp(otp, hashed);
    
    expect(isValid).toBe(true);
  });

  it('should reject invalid OTP', async () => {
    const otp = '123456';
    const wrongOtp = '654321';
    const hashed = await service.hashOtp(otp);
    const isValid = await service.verifyOtp(wrongOtp, hashed);
    
    expect(isValid).toBe(false);
  });
});
```

#### Step 2: Run Test (Should Fail - RED)

```bash
npm test -- otp.service.spec.ts
# ❌ All tests fail (service doesn't exist yet)
```

#### Step 3: Write Minimal Code (GREEN)

```typescript
// src/auth/services/otp.service.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OtpService {
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async hashOtp(otp: string): Promise<string> {
    return bcrypt.hash(otp, 10);
  }

  async verifyOtp(otp: string, hashedOtp: string): Promise<boolean> {
    return bcrypt.compare(otp, hashedOtp);
  }
}
```

#### Step 4: Run Test (Should Pass - GREEN)

```bash
npm test -- otp.service.spec.ts
# ✅ All tests pass
```

#### Step 5: Refactor (If Needed)

```typescript
// Maybe add constants, improve readability
const OTP_LENGTH = 6;
const OTP_MIN = 100000;
const OTP_MAX = 999999;

generateOtp(): string {
  return Math.floor(OTP_MIN + Math.random() * (OTP_MAX - OTP_MIN + 1)).toString();
}
```

---

### Example 2: OTP Request API (Backend Integration Test)

#### Step 1: Write Failing Test (RED)

```typescript
// src/auth/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OtpRequest } from './entities/otp-request.entity';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let otpRepository: Repository<OtpRequest>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    otpRepository = moduleFixture.get<Repository<OtpRequest>>(
      getRepositoryToken(OtpRequest),
    );
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
    });

    it('should reject invalid phone number', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({
          country_code: '+91',
          phone: '12345', // Invalid
          purpose: 'registration',
        })
        .expect(400);

      expect(response.body.error).toBe('INVALID_PHONE');
      expect(response.body.message).toContain('valid 10-digit');
    });

    it('should enforce rate limiting', async () => {
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
    });

    it('should store OTP in database', async () => {
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
      expect(otpRequest.purpose).toBe('registration');
      expect(otpRequest.otp_hash).toBeDefined();
      expect(otpRequest.expires_at).toBeDefined();
    });
  });
});
```

#### Step 2: Write Controller Code (GREEN)

```typescript
// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto);
  }
}
```

---

### Example 3: OTP Input Component (Frontend)

#### Step 1: Write Failing Test (RED)

```typescript
// src/components/OtpInput/OtpInput.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
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
    
    // Second input should be focused
    expect(inputs[1].props.autoFocus).toBe(true);
  });

  it('should auto-submit when 6 digits entered', () => {
    const onComplete = jest.fn();
    const { getAllByTestId } = render(<OtpInput onComplete={onComplete} />);
    const inputs = getAllByTestId('otp-input');
    
    // Enter 6 digits
    ['1', '2', '3', '4', '5', '6'].forEach((digit, index) => {
      fireEvent.changeText(inputs[index], digit);
    });
    
    // Wait for auto-submit (300ms delay)
    setTimeout(() => {
      expect(onComplete).toHaveBeenCalledWith('123456');
    }, 350);
  });

  it('should handle paste of 6-digit code', () => {
    const onComplete = jest.fn();
    const { getAllByTestId } = render(<OtpInput onComplete={onComplete} />);
    const inputs = getAllByTestId('otp-input');
    
    fireEvent.changeText(inputs[0], '123456');
    
    setTimeout(() => {
      expect(onComplete).toHaveBeenCalledWith('123456');
      // All inputs should be filled
      inputs.forEach((input, index) => {
        expect(input.props.value).toBe(['1', '2', '3', '4', '5', '6'][index]);
      });
    }, 350);
  });

  it('should show error state when invalid', () => {
    const { getAllByTestId, rerender } = render(
      <OtpInput onComplete={jest.fn()} error={true} />
    );
    
    const inputs = getAllByTestId('otp-input');
    inputs.forEach(input => {
      expect(input.props.style).toContainEqual(
        expect.objectContaining({ borderColor: '#EF4444' })
      );
    });
  });
});
```

#### Step 2: Write Component Code (GREEN)

```typescript
// src/components/OtpInput/OtpInput.tsx
import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

interface OtpInputProps {
  onComplete: (otp: string) => void;
  error?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({ onComplete, error = false }) => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<TextInput[]>([]);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste
      const pastedOtp = text.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      
      if (newOtp.every(char => char !== '')) {
        setTimeout(() => onComplete(newOtp.join('')), 300);
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(char => char !== '')) {
      setTimeout(() => onComplete(newOtp.join('')), 300);
    }
  };

  return (
    <View style={styles.container}>
      {otp.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            if (ref) inputRefs.current[index] = ref;
          }}
          testID="otp-input"
          style={[
            styles.input,
            error && styles.inputError,
          ]}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          keyboardType="numeric"
          maxLength={1}
          autoFocus={index === 0}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    width: 45,
    height: 56,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    fontSize: 20,
    textAlign: 'center',
  },
  inputError: {
    borderColor: '#EF4444',
  },
});
```

---

## 📝 Test Templates

### Backend Service Test Template

```typescript
// src/[module]/services/[service].spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { [Service] } from './[service]';

describe('[Service]', () => {
  let service: [Service];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        [Service],
        // Add mocked dependencies
      ],
    }).compile();

    service = module.get<[Service]>([Service]);
  });

  describe('methodName', () => {
    it('should [expected behavior]', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = service.methodName(input);
      
      // Assert
      expect(result).toBe('expected');
    });

    it('should handle [edge case]', () => {
      // Test edge cases
    });

    it('should throw error when [invalid input]', () => {
      // Test error cases
    });
  });
});
```

### Backend Controller Test Template

```typescript
// src/[module]/[controller].spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('[Controller] (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/[endpoint]', () => {
    it('should [expected behavior]', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/[endpoint]')
        .send({ /* request body */ })
        .expect(200);

      expect(response.body).toHaveProperty('expectedProperty');
    });
  });
});
```

### Frontend Component Test Template

```typescript
// src/components/[Component]/[Component].test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { [Component] } from './[Component]';

describe('[Component]', () => {
  it('should render correctly', () => {
    const { getByTestId } = render(<[Component] />);
    expect(getByTestId('component')).toBeDefined();
  });

  it('should handle user interaction', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<[Component] onPress={onPress} />);
    
    fireEvent.press(getByTestId('button'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

---

## 🎯 TDD Checklist for Each Feature

### Before Writing Code:
- [ ] Write failing test first
- [ ] Test covers happy path
- [ ] Test covers edge cases
- [ ] Test covers error cases
- [ ] Test is readable and clear

### While Writing Code:
- [ ] Write minimal code to pass test
- [ ] Run tests frequently
- [ ] All tests pass before moving on

### After Writing Code:
- [ ] Refactor if needed
- [ ] Tests still pass after refactor
- [ ] Code coverage is adequate
- [ ] Code is clean and readable

---

## 📊 Coverage Targets

### Minimum Coverage:
- **Unit Tests:** 80%+
- **Integration Tests:** 60%+
- **E2E Tests:** Critical flows only

### Critical Areas (100% Coverage):
- ✅ Tax calculations (GST, TDS, TCS)
- ✅ Financial calculations
- ✅ Data validation
- ✅ Security functions
- ✅ Offline sync logic

---

## 🚀 TDD Workflow for MVP Features

### Sprint 1: Authentication

**Day 1-2: OTP Service**
1. Write tests for OTP generation
2. Write tests for OTP hashing/verification
3. Implement service
4. Write tests for OTP request API
5. Implement API

**Day 3-4: OTP UI**
1. Write tests for OTP input component
2. Implement component
3. Write tests for login screen
4. Implement screen

**Day 5: Integration**
1. Write E2E test for registration flow
2. Fix any issues
3. All tests pass ✅

### Sprint 2: Business Setup

**Day 1-2: Business Service**
1. Write tests for business creation
2. Write tests for GSTIN validation
3. Implement service
4. Write tests for business API
5. Implement API

**Day 3-4: Business UI**
1. Write tests for business setup form
2. Implement form
3. Write tests for validation
4. Implement validation

**Day 5: Integration**
1. Write E2E test for business setup flow
2. Fix any issues
3. All tests pass ✅

---

## 🛠️ Testing Tools & Libraries

### Backend:
- **Jest** - Test framework
- **Supertest** - HTTP assertions
- **TypeORM Testing** - Database testing
- **Sinon** - Mocks and spies (if needed)

### Frontend:
- **Jest** - Test framework
- **React Native Testing Library** - Component testing
- **Detox** - E2E testing (for later)
- **MSW** - API mocking (if needed)

### Utilities:
- **Faker** - Generate test data
- **Factory Bot** - Test data factories
- **Nock** - HTTP mocking (if needed)

---

## 📚 Best Practices

### 1. Test Naming
```typescript
// ✅ Good
it('should calculate GST correctly for interstate transaction', () => {});
it('should reject invalid phone number format', () => {});

// ❌ Bad
it('test1', () => {});
it('works', () => {});
```

### 2. Arrange-Act-Assert Pattern
```typescript
it('should calculate total amount', () => {
  // Arrange
  const subtotal = 1000;
  const tax = 180;
  
  // Act
  const total = calculateTotal(subtotal, tax);
  
  // Assert
  expect(total).toBe(1180);
});
```

### 3. One Assertion Per Test (When Possible)
```typescript
// ✅ Good - Clear what's being tested
it('should return user object', () => {
  const user = getUser();
  expect(user).toHaveProperty('id');
});

it('should return user with correct email', () => {
  const user = getUser();
  expect(user.email).toBe('test@example.com');
});

// ⚠️ OK - Related assertions
it('should return valid user object', () => {
  const user = getUser();
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('email');
  expect(user.email).toContain('@');
});
```

### 4. Test Isolation
```typescript
// ✅ Good - Each test is independent
beforeEach(() => {
  // Setup fresh state for each test
  database.clear();
});

// ❌ Bad - Tests depend on each other
let sharedState = {};
```

### 5. Mock External Dependencies
```typescript
// ✅ Good - Mock SMS service
jest.mock('../sms.service', () => ({
  SmsService: {
    send: jest.fn().mockResolvedValue(true),
  },
}));

// ❌ Bad - Actually sending SMS in tests
```

---

## 🎓 Learning Resources

1. **TDD Basics:**
   - "Test-Driven Development by Example" - Kent Beck
   - "The Art of Unit Testing" - Roy Osherove

2. **Jest Documentation:**
   - https://jestjs.io/docs/getting-started

3. **React Native Testing:**
   - https://callstack.github.io/react-native-testing-library/

4. **NestJS Testing:**
   - https://docs.nestjs.com/fundamentals/testing

---

## ✅ TDD Checklist for Project Setup

### Initial Setup:
- [ ] Install Jest and testing dependencies
- [ ] Configure Jest for backend
- [ ] Configure Jest for frontend
- [ ] Setup test database
- [ ] Create test utilities
- [ ] Setup CI/CD to run tests
- [ ] Configure coverage reporting

### For Each Feature:
- [ ] Write failing test first
- [ ] Write minimal code to pass
- [ ] Refactor if needed
- [ ] All tests pass
- [ ] Coverage meets target
- [ ] Code review includes tests

---

## 🚀 Let's Start!

**Next Steps:**
1. Setup testing infrastructure (Jest, configs)
2. Create test database
3. Write first test (OTP generation)
4. Implement first feature (OTP service)
5. Repeat for all MVP features

**Remember:**
- ✅ Red → Green → Refactor
- ✅ Write tests first
- ✅ Keep tests simple
- ✅ Test behavior, not implementation
- ✅ Refactor with confidence (tests protect you)

Let's build this with TDD! 🎯


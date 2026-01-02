# AI Chatbot Architecture & Technical Design

**Version:** 1.0  
**Last Updated:** 2025-01-20  
**Status:** Planning Phase

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Component Design](#component-design)
4. [Technology Stack](#technology-stack)
5. [Data Flow](#data-flow)
6. [Integration Points](#integration-points)
7. [Security & Privacy](#security--privacy)
8. [Scalability](#scalability)
9. [Implementation Phases](#implementation-phases)

---

## Overview

The AI Chatbot is designed as a microservice that integrates seamlessly with the existing business application ecosystem. It serves as an intelligent interface layer that understands natural language, executes business operations, and provides contextual assistance.

### Core Principles

1. **Natural Language First** - Users interact in Hindi/English naturally
2. **Context-Aware** - Remembers conversation and business context
3. **Action-Oriented** - Executes operations, not just answers questions
4. **Proactive** - Suggests actions before being asked
5. **Secure** - Respects RBAC and data privacy
6. **Scalable** - Handles concurrent users efficiently

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Web App     │  │  Mobile App  │  │  API Client  │     │
│  │  Chat Widget │  │  Chat Screen │  │  Integration │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Gateway / Load Balancer                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Chatbot Service (New)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Chat Controller Layer                    │  │
│  │  - REST API Endpoints                                 │  │
│  │  - WebSocket Support                                  │  │
│  │  - Request Validation                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                  │
│        ┌───────────────────┼───────────────────┐            │
│        ▼                   ▼                   ▼            │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐          │
│  │   LLM     │      │ Context │      │  Action  │          │
│  │  Engine   │      │ Manager │      │  Agent   │          │
│  └──────────┘      └──────────┘      └──────────┘          │
│        │                   │                   │            │
│        └───────────────────┼───────────────────┘            │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Tool Calling Framework                    │  │
│  │  - Business Service Tools                              │  │
│  │  - Invoice Service Tools                               │  │
│  │  - Party Service Tools                                 │  │
│  │  - Inventory Service Tools                             │  │
│  │  - Payment Service Tools                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Business    │   │   Invoice     │   │    Party      │
│   Service     │   │   Service     │   │   Service     │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Inventory   │   │   Payment    │   │     Auth      │
│   Service    │   │   Service     │   │   Service     │
└──────────────┘   └──────────────┘   └──────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  PostgreSQL  │  │    Redis     │  │  Vector DB   │       │
│  │  (Business)  │  │  (Cache)     │  │  (RAG)       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. Chat Controller

**Responsibilities:**
- Handle HTTP/WebSocket requests
- Validate user authentication
- Route to appropriate handlers
- Manage conversation sessions

**Endpoints:**
```
POST   /api/v1/chat/message          - Send message
GET    /api/v1/chat/history          - Get conversation history
POST   /api/v1/chat/clear            - Clear conversation
WS     /api/v1/chat/stream           - WebSocket streaming
```

### 2. LLM Engine

**Responsibilities:**
- Process natural language input
- Generate responses
- Understand intent
- Extract entities

**Components:**
- **LLM Provider**: OpenAI GPT-4 / Claude 3.5 / Local LLM
- **Prompt Manager**: Dynamic prompt construction
- **Response Generator**: Format responses appropriately

### 3. Context Manager

**Responsibilities:**
- Maintain conversation context
- Store business context
- Manage user preferences
- Track conversation history

**Data Structures:**
```typescript
interface ChatContext {
  userId: string;
  businessId: string;
  conversationId: string;
  messages: Message[];
  businessContext: BusinessContext;
  userPreferences: UserPreferences;
  sessionData: SessionData;
}
```

### 4. Action Agent

**Responsibilities:**
- Execute business operations
- Call service APIs
- Handle tool calling
- Manage operation results

**Tool Definitions:**
```typescript
const tools = [
  {
    name: "create_invoice",
    description: "Create a new invoice",
    parameters: {
      party_id: "string",
      items: "array",
      amounts: "object"
    }
  },
  {
    name: "get_invoices",
    description: "Get list of invoices",
    parameters: {
      filters: "object",
      pagination: "object"
    }
  },
  // ... more tools
];
```

### 5. RAG System (Retrieval-Augmented Generation)

**Responsibilities:**
- Store application documentation
- Retrieve relevant context
- Provide accurate answers
- Learn from user interactions

**Components:**
- **Vector Database**: Pinecone / Weaviate / Chroma
- **Embedding Model**: OpenAI embeddings / Local model
- **Document Store**: Application docs, FAQs, guides

---

## Technology Stack

### Core Technologies

#### LLM & NLP
- **Primary**: OpenAI GPT-4 Turbo / Claude 3.5 Sonnet
- **Alternative**: Local LLMs (Llama 3, Mistral) for privacy
- **Embeddings**: OpenAI text-embedding-3 / Local embeddings

#### Backend Framework
- **Service**: NestJS (consistent with existing services)
- **Language**: TypeScript
- **Database**: PostgreSQL (for chat history, context)
- **Cache**: Redis (for session management)

#### Vector Database
- **Option 1**: Pinecone (cloud, managed)
- **Option 2**: Weaviate (self-hosted)
- **Option 3**: Chroma (lightweight, local)

#### Communication
- **REST API**: Express/NestJS
- **WebSocket**: Socket.io (for real-time streaming)
- **Message Queue**: Redis Pub/Sub (for async processing)

### Integration Libraries

#### LLM Integration
- **OpenAI**: `openai` npm package
- **Anthropic**: `@anthropic-ai/sdk`
- **LangChain**: For agent orchestration
- **LangGraph**: For complex workflows

#### Tool Calling
- **Custom Framework**: Built on NestJS
- **Function Calling**: LLM native function calling
- **API Client**: Axios for service communication

---

## Data Flow

### Request Flow

```
1. User sends message
   ↓
2. Chat Controller receives request
   ↓
3. Authentication & Authorization check
   ↓
4. Context Manager loads conversation context
   ↓
5. LLM Engine processes message
   ↓
6. Intent Classification & Entity Extraction
   ↓
7. RAG System retrieves relevant context
   ↓
8. Action Agent determines required operations
   ↓
9. Tool Calling Framework executes operations
   ↓
10. Service APIs called (Business, Invoice, Party, etc.)
    ↓
11. Results aggregated and formatted
    ↓
12. LLM generates natural language response
    ↓
13. Response sent to user
```

### Response Flow

```
1. Service API returns data
   ↓
2. Action Agent formats results
   ↓
3. Context Manager updates conversation
   ↓
4. LLM Engine generates response
   ↓
5. Response formatted (text, cards, buttons)
   ↓
6. Sent to user via WebSocket/HTTP
```

---

## Integration Points

### Service Integrations

#### Business Service
- Get business context
- Update business settings
- Get business statistics

#### Auth Service
- User authentication
- Session management
- Permission checking

#### Party Service
- Create/Read/Update/Delete parties
- Get party ledger
- Search parties

#### Invoice Service
- Create invoices
- Get invoice list
- Update invoice status
- Generate invoice PDF

#### Inventory Service
- Manage items
- Check stock
- Adjust stock
- Get low stock items

#### Payment Service
- Record payments
- Get payment history
- Link payments to invoices

### External Integrations

#### Email Service
- Send invoices via email
- Send reports
- Send notifications

#### SMS/WhatsApp Service
- Send payment reminders
- Send invoice links
- Send notifications

#### File Storage
- Store invoice PDFs
- Store reports
- Store attachments

---

## Security & Privacy

### Authentication & Authorization

#### User Authentication
- JWT token validation
- Session management
- Multi-factor authentication support

#### RBAC Integration
- Check user permissions before operations
- Respect role-based access
- Audit all actions

### Data Privacy

#### Data Isolation
- User data isolation
- Business data isolation
- No cross-user data leakage

#### Data Encryption
- Encrypt chat history
- Encrypt sensitive data
- Secure API communications

#### Compliance
- GDPR compliance
- Data retention policies
- User data deletion

### Security Measures

#### Input Validation
- Sanitize user input
- Validate all parameters
- Prevent injection attacks

#### Rate Limiting
- Limit requests per user
- Prevent abuse
- Fair usage policies

#### Audit Logging
- Log all operations
- Track user actions
- Maintain audit trail

---

## Scalability

### Horizontal Scaling

#### Service Scaling
- Stateless service design
- Load balancer support
- Auto-scaling capabilities

#### Database Scaling
- Read replicas for queries
- Connection pooling
- Query optimization

### Caching Strategy

#### Redis Caching
- Cache conversation context
- Cache business context
- Cache frequent queries
- Cache LLM responses

#### Cache Invalidation
- Smart cache invalidation
- TTL-based expiration
- Event-based invalidation

### Performance Optimization

#### Response Time
- Async processing
- Streaming responses
- Background jobs

#### Cost Optimization
- Response caching
- Batch processing
- Tiered LLM usage

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-4)

#### Week 1-2: Service Setup
- [ ] Create chatbot-service microservice
- [ ] Set up NestJS structure
- [ ] Configure database (PostgreSQL)
- [ ] Set up Redis cache
- [ ] Create basic API endpoints

#### Week 3-4: LLM Integration
- [ ] Integrate OpenAI/Claude API
- [ ] Implement basic chat endpoint
- [ ] Set up prompt management
- [ ] Create response formatting
- [ ] Basic error handling

### Phase 2: Core Features (Weeks 5-8)

#### Week 5-6: Context Management
- [ ] Implement context manager
- [ ] Conversation history storage
- [ ] Business context loading
- [ ] User preferences management

#### Week 7-8: Tool Calling
- [ ] Create tool calling framework
- [ ] Integrate with Business Service
- [ ] Integrate with Invoice Service
- [ ] Integrate with Party Service
- [ ] Integrate with Inventory Service
- [ ] Integrate with Payment Service

### Phase 3: Intelligence (Weeks 9-12)

#### Week 9-10: RAG System
- [ ] Set up vector database
- [ ] Create document embeddings
- [ ] Implement retrieval system
- [ ] Integrate with LLM

#### Week 11-12: Advanced Features
- [ ] Proactive suggestions
- [ ] Multi-step workflows
- [ ] Batch operations
- [ ] Error recovery

### Phase 4: Polish (Weeks 13-16)

#### Week 13-14: User Experience
- [ ] WebSocket streaming
- [ ] Response formatting
- [ ] Quick action buttons
- [ ] Voice input support

#### Week 15-16: Testing & Optimization
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Cost optimization
- [ ] Documentation

---

## Database Schema

### Chat Conversations

```sql
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations(id),
  role VARCHAR(20) NOT NULL, -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_context (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations(id),
  context_data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### User Preferences

```sql
CREATE TABLE user_chat_preferences (
  user_id UUID PRIMARY KEY,
  language VARCHAR(10) DEFAULT 'hi',
  response_style VARCHAR(20) DEFAULT 'friendly',
  notification_enabled BOOLEAN DEFAULT true,
  preferences JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Specifications

### Chat Endpoints

#### Send Message
```http
POST /api/v1/chat/message
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "Invoice बनाओ: Ashish को",
  "conversation_id": "optional-uuid",
  "context": {
    "business_id": "uuid"
  }
}

Response:
{
  "message_id": "uuid",
  "response": "Invoice बना रहा हूं...",
  "conversation_id": "uuid",
  "suggestions": ["View invoice", "Send email"],
  "actions": [...]
}
```

#### Get History
```http
GET /api/v1/chat/history?conversation_id=uuid&limit=50
Authorization: Bearer <token>

Response:
{
  "conversation_id": "uuid",
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "...",
      "created_at": "timestamp"
    },
    ...
  ]
}
```

#### WebSocket Streaming
```javascript
ws://api/v1/chat/stream?token=<token>

// Send
{
  "message": "Invoice बनाओ",
  "conversation_id": "uuid"
}

// Receive (streaming)
{
  "type": "token",
  "content": "Invoice"
}
{
  "type": "token",
  "content": " बना"
}
{
  "type": "complete",
  "message_id": "uuid"
}
```

---

## Monitoring & Analytics

### Metrics to Track

#### Performance Metrics
- Response time (p50, p95, p99)
- Token usage per request
- API call latency
- Cache hit rate

#### Business Metrics
- Daily active users
- Messages per user
- Task completion rate
- User satisfaction score

#### Error Metrics
- Error rate
- Error types
- Failed operations
- Timeout rate

### Logging

#### Log Levels
- **INFO**: Normal operations
- **WARN**: Warnings, retries
- **ERROR**: Errors, failures
- **DEBUG**: Detailed debugging

#### Log Structure
```json
{
  "timestamp": "2025-01-20T10:00:00Z",
  "level": "INFO",
  "service": "chatbot-service",
  "user_id": "uuid",
  "business_id": "uuid",
  "conversation_id": "uuid",
  "message": "Invoice created successfully",
  "metadata": {...}
}
```

---

## Cost Estimation

### LLM Costs (Monthly)

#### OpenAI GPT-4 Turbo
- Input: $10 per 1M tokens
- Output: $30 per 1M tokens
- Estimated: 1000 users × 50 messages/day × 500 tokens = 25M tokens/month
- Cost: ~$750/month

#### Claude 3.5 Sonnet
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens
- Estimated: 25M tokens/month
- Cost: ~$450/month

### Infrastructure Costs

#### Compute
- 2 instances × $50/month = $100/month

#### Database
- PostgreSQL: $50/month
- Redis: $30/month
- Vector DB: $100/month

#### Total Estimated: $680-$980/month (1000 users)

---

## Success Criteria

### Technical Success
- ✅ Response time < 2 seconds (p95)
- ✅ 99.9% uptime
- ✅ Error rate < 1%
- ✅ Support 1000+ concurrent users

### Business Success
- ✅ 70%+ user adoption
- ✅ 4.5+ user satisfaction rating
- ✅ 60%+ task completion rate
- ✅ 50%+ time savings per user

---

**Last Updated:** 2025-01-20  
**Status:** Ready for Implementation


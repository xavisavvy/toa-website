# API Contract Specifications

This directory contains OpenAPI 3.0 specifications for third-party webhook integrations with Tales of Aneria.

## 📋 Overview

These specifications define the **contracts** between Tales of Aneria and external services:
- **Stripe**: Payment processing and checkout webhooks
- **Printful**: Print-on-demand order fulfillment and shipping webhooks

## 🎯 Purpose

### 1. **Living Documentation**
- Self-documenting API contracts
- Always up-to-date with implementation
- Viewable in Swagger UI or Redoc

### 2. **Contract Testing**
- Validate that our server correctly handles webhook events
- Ensure third-party services send data matching our expectations
- Prevent breaking changes from going unnoticed

### 3. **Development Tool**
- Generate mock webhook payloads for testing
- Validate request/response schemas
- Auto-generate TypeScript types (future enhancement)

## 📄 Specifications

### stripe-webhooks.yaml
Defines Stripe webhook events for payment processing:
- \\\checkout.session.completed\\\ - Customer completes payment
- \\\payment_intent.succeeded\\\ - Payment successfully processed
- \\\payment_intent.payment_failed\\\ - Payment failed

**Key Features:**
- Signature verification via \\\stripe-signature\\\ header
- Metadata requirements for Printful integration
- Shipping address collection
- Idempotency handling

### printful-webhooks.yaml
Defines Printful webhook events for order fulfillment:
- \\\package_shipped\\\ - Order shipped with tracking
- \\\package_returned\\\ - Package returned to sender
- \\\order_failed\\\ - Fulfillment failed
- \\\order_updated\\\ - Order status changed

**Key Features:**
- HMAC signature verification via \\\x-printful-signature\\\ header
- Tracking information structure
- Order status lifecycle
- Dev mode support (no signature required)

## 🚀 Usage

### View Specifications

**Option 1: Swagger UI (Recommended)**
\\\ash
npx swagger-ui-watcher docs/api-specs/stripe-webhooks.yaml
npx swagger-ui-watcher docs/api-specs/printful-webhooks.yaml
\\\

**Option 2: VS Code Extensions**
- Install: **OpenAPI (Swagger) Editor** by 42Crunch
- Right-click spec file → **Preview OpenAPI**

**Option 3: Online Viewer**
- Upload to [https://editor.swagger.io](https://editor.swagger.io)

### Validate Implementation

**Manual Validation:**
1. Compare spec examples with actual webhook payloads
2. Ensure all required fields are present
3. Check data types match

**Automated Validation (Future):**
See implementation plan below.

## 🧪 Contract Testing with SpecKit

### Installation

\\\ash
npm install --save-dev @pact-foundation/pact-core speccy
\\\

### Setup Contract Tests

Create \\\	est/contract/openapi-validation.test.ts\\\:

\\\	ypescript
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as OpenAPIValidator from 'express-openapi-validator';

describe('OpenAPI Contract Validation', () => {
  it('should validate Stripe webhook payloads against spec', async () => {
    const spec = yaml.load(
      fs.readFileSync('docs/api-specs/stripe-webhooks.yaml', 'utf8')
    );
    
    // Example: Validate checkout.session.completed event
    const validPayload = {
      id: "evt_123",
      object: "event",
      type: "checkout.session.completed",
      data: { /* ... */ }
    };
    
    // Use OpenAPI validator to check against spec
    // ...
  });
});
\\\

### Provider Testing

Validate that **our server** correctly handles webhooks:

\\\	ypescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server';

describe('Stripe Webhook Provider Contract', () => {
  it('should accept valid checkout.session.completed webhook', async () => {
    const payload = /* load from spec example */;
    const signature = /* generate HMAC */;
    
    const response = await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', signature)
      .send(payload);
    
    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);
  });
  
  it('should reject invalid signature', async () => {
    const response = await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', 'invalid')
      .send({});
    
    expect(response.status).toBe(400);
  });
});
\\\

### Consumer Testing

Validate that **Stripe/Printful** send data matching our spec (simulation):

\\\	ypescript
import { Pact } from '@pact-foundation/pact';

describe('Stripe Consumer Contract', () => {
  const provider = new Pact({
    consumer: 'TalesOfAneria',
    provider: 'Stripe',
  });

  it('should receive valid checkout.session.completed event', async () => {
    await provider
      .given('a successful payment')
      .uponReceiving('checkout.session.completed webhook')
      .withRequest({
        method: 'POST',
        path: '/api/stripe/webhook',
        headers: {
          'stripe-signature': Matchers.string()
        },
        body: {
          type: 'checkout.session.completed',
          data: { /* ... */ }
        }
      })
      .willRespondWith({
        status: 200,
        body: { received: true }
      });

    await provider.verify();
  });
});
\\\

## 🛠️ Maintenance

### When to Update Specs

1. **Adding new webhook events** - Add to \\\	ype\\\ enum and examples
2. **Changing required fields** - Update \\\equired\\\ array in schema
3. **Adding metadata** - Update \\\SessionMetadata\\\ or custom fields
4. **API version changes** - Check Stripe/Printful API docs for breaking changes

### Validation Workflow

1. Update OpenAPI spec
2. Run \\\
px swagger-cli validate docs/api-specs/*.yaml\\\
3. Update implementation to match spec
4. Run contract tests
5. Commit both spec and implementation together

## 📚 Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Printful Webhooks Documentation](https://developers.printful.com/docs/#section/Webhooks)
- [Pact Contract Testing](https://docs.pact.io/)
- [Swagger Editor](https://editor.swagger.io/)

## 🔮 Future Enhancements

- [ ] Auto-generate TypeScript types from specs
- [ ] CI/CD validation of specs on PR
- [ ] Automated contract test generation from examples
- [ ] Publish specs to Pact Broker
- [ ] Mock server generation for local development
- [ ] Integration with Postman/Insomnia collections

## 📝 Notes

- Specs are **descriptive**, not **prescriptive** - they document what IS, not what should be
- Update specs **before** changing implementation (spec-first development)
- Examples should be realistic and based on actual webhook payloads
- Use \\\equired\\\ carefully - only mark truly required fields

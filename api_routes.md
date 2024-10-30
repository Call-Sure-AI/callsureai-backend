# API Routes Documentation

## Table of Contents
- [API Routes Documentation](#api-routes-documentation)
  - [Table of Contents](#table-of-contents)
  - [Base URL](#base-url)
  - [Business Routes](#business-routes)
  - [Customer Routes](#customer-routes)
  - [Agent Routes](#agent-routes)
  - [Conversation Routes](#conversation-routes)
  - [Validation](#validation)
  - [Error Handling](#error-handling)

## Base URL
```
/api
```

## Business Routes
Base path: `/businesses`

| Method | Endpoint | Description | Validation |
|--------|----------|-------------|------------|
| POST | `/` | Create a new business | Yes |
| GET | `/` | Get all businesses | No |
| GET | `/:id` | Get business by ID | No |
| PUT | `/:id` | Update business by ID | Yes |
| DELETE | `/:id` | Delete business by ID | No |
| GET | `/:id/metrics` | Get business metrics | No |

## Customer Routes
Base path: `/customers`

| Method | Endpoint | Description | Validation |
|--------|----------|-------------|------------|
| POST | `/` | Create a new customer | Yes |
| GET | `/` | Get all customers | No |
| GET | `/:id` | Get customer by ID | No |
| PUT | `/:id` | Update customer by ID | Yes |
| DELETE | `/:id` | Delete customer by ID | No |
| POST | `/bulk` | Create multiple customers | No |

## Agent Routes
Base path: `/agents`

| Method | Endpoint | Description | Validation |
|--------|----------|-------------|------------|
| POST | `/` | Create a new agent | Yes |
| GET | `/` | Get all agents | No |
| GET | `/:id` | Get agent by ID | No |
| PUT | `/:id` | Update agent by ID | Yes |
| DELETE | `/:id` | Delete agent by ID | No |
| GET | `/:id/performance` | Get agent performance metrics | No |

## Conversation Routes
Base path: `/conversations`

| Method | Endpoint | Description | Validation |
|--------|----------|-------------|------------|
| POST | `/` | Create a new conversation | Yes |
| GET | `/` | Get all conversations | Yes |
| GET | `/:id` | Get conversation by ID | No |
| PUT | `/:id` | Update conversation by ID | Yes |
| DELETE | `/:id` | Delete conversation by ID | No |
| GET | `/customer/:customerId` | Get conversations by customer ID | No |
| GET | `/agent/:agentId` | Get conversations by agent ID | No |

## Validation
Each route marked with validation uses middleware validators:
- `businessValidation`
- `customerValidation`
- `agentValidation`
- `conversationValidation`

## Error Handling
All endpoints follow standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
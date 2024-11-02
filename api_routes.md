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
| GET | `/:pk` | Get business by PK | No |
| PUT | `/:pk` | Update business by PK | Yes |
| DELETE | `/:pk` | Delete business by PK | No |
| GET | `/:pk/metrics` | Get business metrics | No |

## Customer Routes
Base path: `/customers`

| Method | Endpoint | Description | Validation |
|--------|----------|-------------|------------|
| POST | `/` | Create a new customer | Yes |
| GET | `/` | Get all customers | No |
| GET | `/:pk` | Get customer by PK | No |
| PUT | `/:pk` | Update customer by PK | Yes |
| DELETE | `/:pk` | Delete customer by PK | No |
| POST | `/bulk` | Create multiple customers | No |

## Agent Routes
Base path: `/agents`

| Method | Endpoint | Description | Validation |
|--------|----------|-------------|------------|
| POST | `/` | Create a new agent | Yes |
| GET | `/` | Get all agents | No |
| GET | `/:pk` | Get agent by PK | No |
| PUT | `/:pk` | Update agent by PK | Yes |
| DELETE | `/:pk` | Delete agent by PK | No |
| GET | `/:pk/performance` | Get agent performance metrics | No |

## Conversation Routes
Base path: `/conversations`

| Method | Endpoint | Description | Validation |
|--------|----------|-------------|------------|
| POST | `/` | Create a new conversation | Yes |
| GET | `/` | Get all conversations | Yes |
| GET | `/:pk` | Get conversation by PK | No |
| PUT | `/:pk` | Update conversation by PK | Yes |
| DELETE | `/:pk` | Delete conversation by PK | No |
| GET | `/customer/:customerPk` | Get conversations by customer PK | No |
| GET | `/agent/:agentPk` | Get conversations by agent PK | No |

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
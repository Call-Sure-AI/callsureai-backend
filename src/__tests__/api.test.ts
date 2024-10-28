// src/__tests__/api.test.ts
import request from 'supertest';
import { app } from '../server';
import { PrismaService } from '../lib/prisma';

describe('API Integration Tests', () => {
    // Test data holders
    let businessId: string;
    let customerId: string;
    let agentId: string;
    let custAgentId: string;
    let conversationId: string;

    // Cleanup after all tests
    afterAll(async () => {
        const prisma = await PrismaService.getInstance();
        await prisma.$disconnect();
    });

    describe('Business Account Tests', () => {
        test('Should create a business account', async () => {
            const response = await request(app)
                .post('/api/businesses')
                .send({
                    type: "Enterprise",
                    desc: "Test Business",
                    report: "Initial Report"
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            businessId = response.body.id;
        });

        test('Should fail to create business with missing required fields', async () => {
            const response = await request(app)
                .post('/api/businesses')
                .send({
                    type: "Enterprise"
                    // Missing desc and report
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('errors');
        });

        test('Should fail to create business with empty strings', async () => {
            const response = await request(app)
                .post('/api/businesses')
                .send({
                    type: "",
                    desc: "",
                    report: ""
                });

            expect(response.status).toBe(400);
        });

        test('Should handle empty query parameters', async () => {
            const response = await request(app)
                .get('/api/businesses')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toEqual({
                data: expect.any(Array),
                metadata: expect.objectContaining({
                    currentPage: 1,
                    pageSize: 10,
                    totalPages: expect.any(Number),
                    totalCount: expect.any(Number),
                    hasNextPage: expect.any(Boolean),
                    hasPreviousPage: false
                })
            });
        });

        test('Should handle invalid pagination parameters gracefully', async () => {
            const response = await request(app)
                .get('/api/businesses?page=invalid&limit=invalid')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toEqual({
                data: expect.any(Array),
                metadata: expect.objectContaining({
                    currentPage: 1, // Should default to first page
                    pageSize: 10,   // Should use default limit
                    totalPages: expect.any(Number),
                    totalCount: expect.any(Number),
                    hasNextPage: expect.any(Boolean),
                    hasPreviousPage: false
                })
            });
        });
    });

    describe('Customer Tests', () => {
        test('Should create a customer', async () => {
            const response = await request(app)
                .post('/api/customers')
                .send({
                    name: "Test Customer",
                    description: "Test Description"
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            customerId = response.body.id;
        });

        test('Should get customer with related businesses', async () => {
            const response = await request(app)
                .get(`/api/customers/${customerId}?include=businesses`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('bus_cus');
        });
    });

    describe('Agent Tests', () => {
        test('Should create an agent', async () => {
            const response = await request(app)
                .post('/api/agents')
                .send({
                    name: "Test Agent",
                    spec: "Technical",
                    description: "Test Agent Description",
                    generate: false
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            agentId = response.body.id;
        });

        test('Should fail to update non-existent agent', async () => {
            const response = await request(app)
                .put('/api/agents/non-existent-id')
                .send({
                    name: "Updated Name"
                });

            expect(response.status).toBe(400);
        });

        test('Should get agents filtered by specialization', async () => {
            const response = await request(app)
                .get('/api/agents?spec=Technical');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Customer-Agent Relationship Tests', () => {
        test('Should create customer-agent relationship', async () => {
            const response = await request(app)
                .post('/api/cust-agent')
                .send({
                    customerID: customerId,
                    agentID: agentId
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            custAgentId = response.body.id;
        });

        test('Should fail to create duplicate customer-agent relationship', async () => {
            const response = await request(app)
                .post('/api/cust-agent')
                .send({
                    customerID: customerId,
                    agentID: agentId
                });

            expect(response.status).toBe(400);
        });

        test('Should fail with invalid customer ID', async () => {
            const response = await request(app)
                .post('/api/cust-agent')
                .send({
                    customerID: 'invalid-id',
                    agentID: agentId
                });

            expect(response.status).toBe(404);
        });
    });

    describe('Conversation Tests', () => {
        test('Should create a conversation', async () => {
            const response = await request(app)
                .post('/api/conversations')
                .send({
                    custAgentId: custAgentId,
                    timeDate: new Date().toISOString(),
                    duration: 300,
                    exchange: "Test conversation",
                    transcript: "Test transcript",
                    file: "test.mp3",
                    generate: false
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            conversationId = response.body.id;
        });

        test('Should fail with future date', async () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);

            const response = await request(app)
                .post('/api/conversations')
                .send({
                    custAgentId: custAgentId,
                    timeDate: futureDate.toISOString(),
                    duration: 300,
                    exchange: "Test conversation",
                    transcript: "Test transcript",
                    file: "test.mp3"
                });

            expect(response.status).toBe(400);
        });

        test('Should fail with negative duration', async () => {
            const response = await request(app)
                .post('/api/conversations')
                .send({
                    custAgentId: custAgentId,
                    timeDate: new Date().toISOString(),
                    duration: -300,
                    exchange: "Test conversation",
                    transcript: "Test transcript",
                    file: "test.mp3"
                });

            expect(response.status).toBe(400);
        });

        test('Should get conversations with date range filter', async () => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);

            const endDate = new Date();

            const response = await request(app)
                .get(`/api/conversations?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('Should get conversations with duration filter', async () => {
            const response = await request(app)
                .get('/api/conversations?minDuration=100&maxDuration=600');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('Should fail with invalid duration filter', async () => {
            const response = await request(app)
                .get('/api/conversations?minDuration=invalid');

            expect(response.status).toBe(400);
        });

        test('Should get conversations by agent', async () => {
            const response = await request(app)
                .get(`/api/conversations?agentId=${agentId}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Complex Query Tests', () => {
        test('Should get customer with all relationships and conversations', async () => {
            const response = await request(app)
                .get(`/api/customers/${customerId}?include=businesses,agents,conversations`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('bus_cus');
            expect(response.body).toHaveProperty('cust_agent');
        });

        test('Should get business metrics', async () => {
            const response = await request(app)
                .get(`/api/businesses/${businessId}/metrics`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('agentMetrics');
            expect(response.body).toHaveProperty('conversationMetrics');
            expect(response.body).toHaveProperty('customerMetrics');
            expect(response.body).toHaveProperty('trends');
        });

        test('Should get agent performance metrics', async () => {
            const response = await request(app)
                .get(`/api/agents/${agentId}/performance`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('agentInfo');
            expect(response.body).toHaveProperty('overview');
            expect(response.body).toHaveProperty('conversationQuality');
            expect(response.body).toHaveProperty('customerInsights');
        });
    });

    describe('Error Handling Tests', () => {

        test('Should handle invalid UUID format', async () => {
            const response = await request(app)
                .get('/api/customers/invalid-uuid-format');

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Bulk Operation Tests', () => {
        test('Should create multiple customers', async () => {
            const response = await request(app)
                .post('/api/customers/bulk')
                .send([
                    { name: "Bulk Customer 1", description: "Bulk Description 1" },
                    { name: "Bulk Customer 2", description: "Bulk Description 2" }
                ]);

            expect(response.status).toBe(201);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
        });

        test('Should fail bulk create with invalid data', async () => {
            const response = await request(app)
                .post('/api/customers/bulk')
                .send([
                    { name: "Valid Customer", description: "Valid Description" },
                    { name: "", description: "" } // Invalid data
                ]);

            expect(response.status).toBe(400);
        });
    });
});
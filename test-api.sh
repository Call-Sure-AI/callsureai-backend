#!/bin/bash

# Base URL
BASE_URL="http://localhost:3000/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Starting API Tests..."

# Test Business Endpoints
echo -e "\n${GREEN}Testing Business Endpoints${NC}"

# Create Business
echo "Creating Business..."
BUSINESS_RESPONSE=$(curl -s -X POST "$BASE_URL/businesses" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Enterprise",
    "desc": "Global technology solutions provider",
    "report": "Q1 2024 Business Report"
  }')
BUSINESS_ID=$(echo $BUSINESS_RESPONSE | jq -r '.id')
echo "Created Business ID: $BUSINESS_ID"

# Get All Businesses
echo "Getting all businesses..."
curl -s "$BASE_URL/businesses"

# Get Single Business
echo "Getting single business..."
curl -s "$BASE_URL/businesses/$BUSINESS_ID"

# Update Business
echo "Updating business..."
curl -s -X PUT "$BASE_URL/businesses/$BUSINESS_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Enterprise Premium",
    "desc": "Updated: Global technology and AI solutions provider",
    "report": "Q2 2024 Business Report"
  }'

# Test Customer Endpoints
echo -e "\n${GREEN}Testing Customer Endpoints${NC}"

# Create Customer
echo "Creating Customer..."
CUSTOMER_RESPONSE=$(curl -s -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "description": "Leading manufacturer of innovative products"
  }')
CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq -r '.id')
echo "Created Customer ID: $CUSTOMER_ID"

# Get All Customers
echo "Getting all customers..."
curl -s "$BASE_URL/customers"

# Get Single Customer
echo "Getting single customer..."
curl -s "$BASE_URL/customers/$CUSTOMER_ID"

# Update Customer
echo "Updating customer..."
curl -s -X PUT "$BASE_URL/customers/$CUSTOMER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation International",
    "description": "Global leader in innovative product manufacturing"
  }'

# Test Agent Endpoints
echo -e "\n${GREEN}Testing Agent Endpoints${NC}"

# Create Agent
echo "Creating Agent..."
AGENT_RESPONSE=$(curl -s -X POST "$BASE_URL/agents" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "spec": "Technical Support",
    "description": "Senior technical support specialist",
    "generate": false
  }')
AGENT_ID=$(echo $AGENT_RESPONSE | jq -r '.id')
echo "Created Agent ID: $AGENT_ID"

# Create Customer-Agent Relationship
echo "Creating Customer-Agent Relationship..."
CUST_AGENT_RESPONSE=$(curl -s -X POST "$BASE_URL/cust-agent" \
  -H "Content-Type: application/json" \
  -d "{
    \"customerID\": \"$CUSTOMER_ID\",
    \"agentID\": \"$AGENT_ID\"
  }")
CUST_AGENT_ID=$(echo $CUST_AGENT_RESPONSE | jq -r '.id')
echo "Created Customer-Agent ID: $CUST_AGENT_ID"

# Test Conversation Endpoints
echo -e "\n${GREEN}Testing Conversation Endpoints${NC}"

# Create Conversation
echo "Creating Conversation..."
CONV_RESPONSE=$(curl -s -X POST "$BASE_URL/conversations" \
  -H "Content-Type: application/json" \
  -d "{
    \"custAgentId\": \"$CUST_AGENT_ID\",
    \"timeDate\": \"2024-03-20T14:30:00Z\",
    \"duration\": 1800,
    \"exchange\": \"Technical support call regarding cloud service integration\",
    \"transcript\": \"Customer: Hi, I'm having issues...\nAgent: Hello, I'll be happy to help...\",
    \"file\": \"conversation_recording_20240320.mp3\",
    \"generate\": false
  }")
CONV_ID=$(echo $CONV_RESPONSE | jq -r '.id')
echo "Created Conversation ID: $CONV_ID"

# Test Conversation Queries
echo "Testing conversation queries..."

# Date range query
echo "Conversations by date range..."
curl -s "$BASE_URL/conversations?startDate=2024-03-01T00:00:00Z&endDate=2024-03-31T23:59:59Z"

# Duration query
echo "Conversations by duration..."
curl -s "$BASE_URL/conversations?minDuration=300&maxDuration=3600"

# Combined query
echo "Conversations with combined filters..."
curl -s "$BASE_URL/conversations?startDate=2024-03-01T00:00:00Z&endDate=2024-03-31T23:59:59Z&minDuration=300&agentId=$AGENT_ID"

# Cleanup
echo -e "\n${GREEN}Cleaning up...${NC}"

# Delete Conversation
echo "Deleting conversation..."
curl -s -X DELETE "$BASE_URL/conversations/$CONV_ID"

# Delete Customer-Agent Relationship
echo "Deleting customer-agent relationship..."
curl -s -X DELETE "$BASE_URL/cust-agent/$CUST_AGENT_ID"

# Delete Agent
echo "Deleting agent..."
curl -s -X DELETE "$BASE_URL/agents/$AGENT_ID"

# Delete Customer
echo "Deleting customer..."
curl -s -X DELETE "$BASE_URL/customers/$CUSTOMER_ID"

# Delete Business
echo "Deleting business..."
curl -s -X DELETE "$BASE_URL/businesses/$BUSINESS_ID"

echo -e "\n${GREEN}API Tests Completed${NC}"
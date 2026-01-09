/**
 * C.R.E.A.M. CRM - Swagger/OpenAPI Configuration
 * API documentation with interactive UI
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'C.R.E.A.M. CRM API',
      version: '2.0.0',
      description: `
# Coffee Rewards & Engagement Account Manager

RESTful API for managing coffee shop loyalty programs, including:
- Member registration and management
- Stamp collection and reward redemption
- Apple Wallet pass generation
- Transaction tracking and reporting

## Authentication
Currently, the API does not require authentication. Future versions may implement API key or OAuth2 authentication.
      `,
      contact: {
        name: 'C.R.E.A.M. Support'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      { 
        url: '/api', 
        description: 'API Server' 
      }
    ],
    tags: [
      { name: 'Dashboard', description: 'Dashboard statistics and overview' },
      { name: 'Members', description: 'Member management operations' },
      { name: 'Loyalty', description: 'Stamps and rewards operations' },
      { name: 'Transactions', description: 'Transaction history and tracking' },
      { name: 'Wallet', description: 'Apple Wallet pass operations' }
    ],
    components: {
      schemas: {
        Member: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Internal database ID' },
            member_id: { type: 'string', example: 'CREAM-123456', description: 'Public member identifier' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            phone: { type: 'string', example: '+1234567890' },
            birthday: { type: 'string', format: 'date', example: '1990-01-15' },
            gender: { type: 'string', enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
            stamps: { type: 'integer', default: 0, description: 'Current stamp count (0-5)' },
            total_rewards: { type: 'integer', default: 0, description: 'Total rewards earned' },
            available_rewards: { type: 'integer', default: 0, description: 'Rewards available for redemption' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        MemberCreate: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            phone: { type: 'string', example: '+1234567890' },
            birthday: { type: 'string', format: 'date', example: '1990-01-15' },
            gender: { type: 'string', enum: ['male', 'female', 'other', 'prefer_not_to_say'] }
          }
        },
        Stats: {
          type: 'object',
          properties: {
            totalMembers: { type: 'integer', example: 150 },
            totalStamps: { type: 'integer', example: 1250 },
            totalRewards: { type: 'integer', example: 85 },
            todayMembers: { type: 'integer', example: 5 }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            member_id: { type: 'integer' },
            member_name: { type: 'string' },
            type: { type: 'string', enum: ['stamp', 'redeem', 'register'] },
            data: { type: 'object' },
            panel: { type: 'string', enum: ['crm', 'merchant', 'api'] },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        RewardHistory: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            type: { type: 'string', enum: ['earned', 'redeemed'] },
            description: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Failed to process request' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            member: { '$ref': '#/components/schemas/Member' }
          }
        }
      },
      responses: {
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { '$ref': '#/components/schemas/Error' }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { '$ref': '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  apis: ['./server.js']
};

const specs = swaggerJsdoc(options);

// Custom Swagger UI options
const uiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0 }
    .swagger-ui .info .title { color: #00d4ff }
  `,
  customSiteTitle: 'C.R.E.A.M. API Documentation',
  customfavIcon: '/logo-icon.png'
};

module.exports = { 
  swaggerUi, 
  specs, 
  uiOptions 
};

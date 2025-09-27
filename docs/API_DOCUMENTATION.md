# 📚 API Documentation

## Overview

This document provides comprehensive API documentation for the Book Management Portal backend, including endpoint details, request/response formats, authentication, and usage examples.

## 🔗 Base URL

```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

## 🔐 Authentication

### JWT Token Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Token Format

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "USER|ADMIN",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Token Expiration

- **Development**: Tokens never expire (`ignoreExpiration: true`)
- **Production**: Configurable expiration (recommended: 24 hours)

## 📊 Response Format

### Success Response

```json
{
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Error type"
}
```

### Paginated Response

```json
{
  "data": [/* array of items */],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

## 🔐 Authentication Endpoints

### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "access_token": "jwt-token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "isActive": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `201` - User registered successfully
- `409` - User with this email already exists
- `400` - Invalid input data

### POST /auth/login

Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "jwt-token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "isActive": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**Suspended Account Response:**
```json
{
  "access_token": "",
  "user": {
    "id": 0,
    "email": "",
    "firstName": "",
    "lastName": "",
    "role": "USER",
    "isActive": false,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "Your account is suspended. Please contact admin."
}
```

**Status Codes:**
- `200` - Login successful
- `401` - Invalid credentials or account suspended
- `400` - Invalid input data

### GET /auth/profile

Get current user profile.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "isActive": true,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `200` - Profile retrieved successfully
- `401` - Unauthorized

### PUT /auth/profile

Update current user profile.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "isActive": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Profile updated successfully
- `401` - Unauthorized
- `400` - Invalid input data

### GET /auth/users (Admin Only)

Get all users in the system.

**Headers:**
```http
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```json
{
  "message": "Users retrieved successfully",
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "isActive": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Users retrieved successfully
- `401` - Unauthorized
- `403` - Forbidden - Admin access required

### POST /auth/users (Admin Only)

Create a new user.

**Headers:**
```http
Authorization: Bearer <admin-jwt-token>
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "USER",
  "isActive": true
}
```

**Response:**
```json
{
  "message": "User created successfully by admin",
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "USER",
    "isActive": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `201` - User created successfully
- `401` - Unauthorized
- `403` - Forbidden - Admin access required
- `409` - User with this email already exists
- `400` - Invalid input data

### PATCH /auth/users/:id (Admin Only)

Update user by admin.

**Headers:**
```http
Authorization: Bearer <admin-jwt-token>
```

**Request Body:**
```json
{
  "firstName": "Updated Name",
  "lastName": "Updated Last",
  "role": "ADMIN",
  "isActive": false
}
```

**Response:**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "Updated Name",
    "lastName": "Updated Last",
    "role": "ADMIN",
    "isActive": false,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - User updated successfully
- `401` - Unauthorized
- `403` - Forbidden - Admin access required
- `404` - User not found
- `400` - Invalid input data

### DELETE /auth/users/:id (Admin Only)

Delete user by admin.

**Headers:**
```http
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

**Status Codes:**
- `200` - User deleted successfully
- `401` - Unauthorized
- `403` - Forbidden - Admin access required
- `404` - User not found

## 📖 Books Endpoints

### POST /books

Create a new book.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "978-0-7432-7356-5"
}
```

**Response:**
```json
{
  "message": "Book created successfully",
  "book": {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0-7432-7356-5",
    "createdBy": 1,
    "creator": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com"
    },
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `201` - Book created successfully
- `401` - Unauthorized
- `409` - Book with this ISBN already exists
- `400` - Invalid input data

### GET /books

Get all books with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `title` (optional): Filter by title
- `author` (optional): Filter by author
- `isbn` (optional): Filter by ISBN

**Example:**
```http
GET /books?page=1&limit=10&title=Gatsby&author=Fitzgerald
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "978-0-7432-7356-5",
      "createdBy": 1,
      "creator": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "email": "user@example.com"
      },
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

**Status Codes:**
- `200` - Books retrieved successfully

### GET /books/my-books

Get current user's books.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `title` (optional): Filter by title
- `author` (optional): Filter by author
- `isbn` (optional): Filter by ISBN

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "978-0-7432-7356-5",
      "createdBy": 1,
      "creator": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "email": "user@example.com"
      },
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
      }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

**Status Codes:**
- `200` - User books retrieved successfully
- `401` - Unauthorized

### GET /books/:id

Get book by ID.

**Response:**
```json
{
  "id": 1,
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "978-0-7432-7356-5",
  "createdBy": 1,
  "creator": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com"
  },
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `200` - Book retrieved successfully
- `404` - Book not found

### PATCH /books/:id

Update book.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "author": "Updated Author",
  "isbn": "978-0-7432-7356-6"
}
```

**Response:**
```json
{
  "message": "Book updated successfully",
  "book": {
    "id": 1,
    "title": "Updated Title",
    "author": "Updated Author",
    "isbn": "978-0-7432-7356-6",
    "createdBy": 1,
    "creator": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com"
    },
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Book updated successfully
- `401` - Unauthorized
- `403` - Forbidden - You can only update your own books
- `404` - Book not found
- `409` - Book with this ISBN already exists
- `400` - Invalid input data

### DELETE /books/:id

Delete book.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "message": "Book deleted successfully"
}
```

**Status Codes:**
- `200` - Book deleted successfully
- `401` - Unauthorized
- `403` - Forbidden - You can only delete your own books
- `404` - Book not found

## 💬 Feedback Endpoints

### POST /feedback

Create feedback for a book.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent book! Highly recommended.",
  "bookId": 1
}
```

**Response:**
```json
{
  "message": "Feedback created successfully",
  "feedback": {
    "id": 1,
    "rating": 5,
    "comment": "Excellent book! Highly recommended.",
    "status": "VISIBLE",
    "userId": 1,
    "bookId": 1,
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com"
    },
    "book": {
      "id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "978-0-7432-7356-5"
    },
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**Rate Limiting:**
- 1 feedback per minute per user

**Status Codes:**
- `201` - Feedback created successfully
- `401` - Unauthorized
- `400` - Invalid input data
- `404` - Book not found
- `429` - Too Many Requests - Rate limit exceeded

### GET /feedback/all-reviews

Get all visible feedback.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `rating` (optional): Filter by rating (1-5)
- `bookId` (optional): Filter by book ID

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "rating": 5,
      "comment": "Excellent book! Highly recommended.",
      "status": "VISIBLE",
      "userId": 1,
      "bookId": 1,
      "user": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "email": "user@example.com"
      },
      "book": {
        "id": 1,
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "978-0-7432-7356-5"
      },
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

**Status Codes:**
- `200` - Feedback retrieved successfully

### GET /feedback/my-reviews

Get current user's feedback.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `rating` (optional): Filter by rating (1-5)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "rating": 5,
      "comment": "Excellent book! Highly recommended.",
      "status": "VISIBLE",
      "userId": 1,
      "bookId": 1,
      "user": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "email": "user@example.com"
      },
      "book": {
        "id": 1,
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "978-0-7432-7356-5"
      },
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

**Status Codes:**
- `200` - User feedback retrieved successfully
- `401` - Unauthorized

### GET /feedback/book/:bookId

Get feedback for a specific book.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `rating` (optional): Filter by rating (1-5)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "rating": 5,
      "comment": "Excellent book! Highly recommended.",
      "status": "VISIBLE",
      "userId": 1,
      "bookId": 1,
      "user": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "email": "user@example.com"
      },
      "book": {
        "id": 1,
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "978-0-7432-7356-5"
      },
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

**Status Codes:**
- `200` - Book feedback retrieved successfully
- `404` - Book not found

### GET /feedback/:id

Get feedback by ID.

**Response:**
```json
{
  "id": 1,
  "rating": 5,
  "comment": "Excellent book! Highly recommended.",
  "status": "VISIBLE",
  "userId": 1,
  "bookId": 1,
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com"
  },
  "book": {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0-7432-7356-5"
  },
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `200` - Feedback retrieved successfully
- `404` - Feedback not found

### PATCH /feedback/:id/moderate (Admin Only)

Moderate feedback (hide/show).

**Headers:**
```http
Authorization: Bearer <admin-jwt-token>
```

**Request Body:**
```json
{
  "status": "HIDDEN"
}
```

**Response:**
```json
{
  "message": "Feedback moderated successfully",
  "feedback": {
    "id": 1,
    "rating": 5,
    "comment": "Excellent book! Highly recommended.",
    "status": "HIDDEN",
    "userId": 1,
    "bookId": 1,
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com"
    },
    "book": {
      "id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "978-0-7432-7356-5"
    },
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Feedback moderated successfully
- `401` - Unauthorized
- `403` - Forbidden - Admin access required
- `404` - Feedback not found
- `400` - Invalid input data

### PATCH /feedback/:id

Update feedback.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "rating": 4,
  "comment": "Updated comment"
}
```

**Response:**
```json
{
  "message": "Feedback updated successfully",
  "feedback": {
    "id": 1,
    "rating": 4,
    "comment": "Updated comment",
    "status": "VISIBLE",
    "userId": 1,
    "bookId": 1,
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com"
    },
    "book": {
      "id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "978-0-7432-7356-5"
    },
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Feedback updated successfully
- `401` - Unauthorized
- `403` - Forbidden - You can only update your own feedback
- `404` - Feedback not found
- `400` - Invalid input data

### DELETE /feedback/:id

Delete feedback.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "message": "Feedback deleted successfully"
}
```

**Status Codes:**
- `200` - Feedback deleted successfully
- `401` - Unauthorized
- `403` - Forbidden - You can only delete your own feedback
- `404` - Feedback not found

## 🏥 Health Check Endpoints

### GET /health

Check application health.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "uptime": 12345
}
```

**Status Codes:**
- `200` - Application is healthy

## 🚫 Error Codes

### Common Error Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| `400` | Bad Request | Invalid input data, validation errors |
| `401` | Unauthorized | Missing or invalid JWT token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `409` | Conflict | Duplicate resource (email, ISBN) |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server-side error |

### Validation Errors

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

### Rate Limit Errors

```json
{
  "statusCode": 429,
  "message": "Too Many Requests - Rate limit exceeded (1 feedback per minute per user). Please wait 30 more seconds.",
  "error": "Too Many Requests",
  "retryAfter": 30
}
```

## 🔒 Security Considerations

### Authentication

- JWT tokens are stateless and self-contained
- Tokens should be stored securely on the client side
- Consider implementing token refresh for production

### Authorization

- Role-based access control (RBAC) is implemented
- Users can only access/modify their own data
- Admins have full system access

### Input Validation

- All inputs are validated using class-validator
- SQL injection is prevented by TypeORM
- XSS protection through input sanitization

### Rate Limiting

- Global rate limiting prevents API abuse
- Per-user rate limiting for feedback creation
- Configurable limits for different endpoints

## 📊 Performance Considerations

### Pagination

- All list endpoints support pagination
- Default page size is 10 items
- Maximum page size should be limited

### Filtering

- Database-level filtering for better performance
- Indexed columns for efficient queries
- Selective field loading to reduce payload

### Caching

- Consider implementing Redis for production
- Cache frequently accessed data
- Use appropriate cache headers

## 🔧 Development Tools

### Swagger UI

Interactive API documentation is available at `/api/docs`:

- Test endpoints directly from the browser
- View request/response schemas
- Authenticate using JWT tokens
- Export API specifications

### Postman Collection

A Postman collection can be generated from the Swagger documentation for API testing.

## 📝 Examples

### Complete Authentication Flow

```bash
# 1. Register a new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# 2. Login to get JWT token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# 3. Use JWT token for protected endpoints
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer <jwt-token>"
```

### Book Management Flow

```bash
# 1. Create a book
curl -X POST http://localhost:3001/api/books \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0-7432-7356-5"
  }'

# 2. Get all books with pagination
curl -X GET "http://localhost:3001/api/books?page=1&limit=10"

# 3. Get user's books
curl -X GET http://localhost:3001/api/books/my-books \
  -H "Authorization: Bearer <jwt-token>"
```

### Feedback Flow

```bash
# 1. Create feedback
curl -X POST http://localhost:3001/api/feedback \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Excellent book!",
    "bookId": 1
  }'

# 2. Get all visible feedback
curl -X GET "http://localhost:3001/api/feedback/all-reviews?page=1&limit=10"

# 3. Get feedback for specific book
curl -X GET "http://localhost:3001/api/feedback/book/1?page=1&limit=10"
```

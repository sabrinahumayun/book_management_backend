# 🐳 Docker Configuration for Book Management Portal

This document provides comprehensive instructions for containerizing and deploying the Book Management Portal backend using Docker.

## 📁 Docker Files Overview

| File | Purpose | Environment |
|------|---------|-------------|
| `Dockerfile` | Production container | Production |
| `Dockerfile.dev` | Development container | Development |
| `docker-compose.yml` | Development orchestration | Development |
| `docker-compose.prod.yml` | Production orchestration | Production |
| `nginx.conf` | Reverse proxy configuration | Production |
| `.dockerignore` | Build context exclusions | All |

## 🚀 Quick Start

### Development Environment

```bash
# Start all services (API + Database)
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Seed database
docker-compose --profile seed up seed
```

### Production Environment

```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f api

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## 🏗️ Docker Architecture

### Multi-Stage Build Process

#### **Stage 1: Builder**
- **Base Image**: `node:18-alpine`
- **Purpose**: Build the application
- **Actions**:
  - Install dependencies
  - Compile TypeScript
  - Generate production build

#### **Stage 2: Production**
- **Base Image**: `node:18-alpine`
- **Purpose**: Run the application
- **Actions**:
  - Install production dependencies only
  - Copy built application
  - Set up security (non-root user)
  - Configure health checks

### Container Security Features

- **Non-root User**: Application runs as `nestjs` user (UID 1001)
- **Minimal Base Image**: Alpine Linux for smaller attack surface
- **Signal Handling**: `dumb-init` for proper signal propagation
- **Health Checks**: Built-in health monitoring
- **Resource Limits**: Configurable memory and CPU limits

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment | `development` | ❌ |
| `PORT` | Application port | `3001` | ❌ |
| `DB_HOST` | Database host | `postgres` | ✅ |
| `DB_PORT` | Database port | `5432` | ✅ |
| `DB_USERNAME` | Database username | `postgres` | ✅ |
| `DB_PASSWORD` | Database password | `postgres` | ✅ |
| `DB_DATABASE` | Database name | `book_management` | ✅ |
| `JWT_SECRET` | JWT signing secret | - | ✅ |

### Docker Compose Services

#### **PostgreSQL Database**
- **Image**: `postgres:15-alpine`
- **Port**: `5432`
- **Volume**: Persistent data storage
- **Health Check**: Database connectivity verification

#### **API Service**
- **Build**: Custom Dockerfile
- **Port**: `3001`
- **Dependencies**: PostgreSQL
- **Health Check**: HTTP endpoint verification

#### **Nginx Reverse Proxy** (Production)
- **Image**: `nginx:alpine`
- **Ports**: `80`, `443`
- **Features**: Rate limiting, SSL termination, load balancing

## 🛠️ Development Workflow

### Local Development

```bash
# 1. Start database only
docker-compose up -d postgres

# 2. Run API locally (with hot reload)
npm run start:dev

# 3. Or run everything in containers
docker-compose up -d
```

### Database Management

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d book_management

# Run migrations
docker-compose exec api npm run migration:run

# Seed database
docker-compose exec api npm run seed

# Backup database
docker-compose exec postgres pg_dump -U postgres book_management > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres book_management < backup.sql
```

### Debugging

```bash
# View container logs
docker-compose logs -f api

# Execute commands in container
docker-compose exec api sh

# Check container health
docker-compose ps

# View resource usage
docker stats
```

## 🚀 Production Deployment

### Environment Setup

1. **Create production environment file**:
```bash
# .env.production
NODE_ENV=production
PORT=3001
DB_HOST=postgres
DB_USERNAME=your_prod_username
DB_PASSWORD=your_secure_password
DB_DATABASE=book_management_prod
JWT_SECRET=your_super_secure_jwt_secret
```

2. **Build production image**:
```bash
docker build -t book-management-api:latest .
```

3. **Deploy with production compose**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Production Optimizations

#### **Image Optimization**
- **Multi-stage build**: Reduces final image size
- **Alpine Linux**: Minimal base image (~5MB)
- **Production dependencies only**: Excludes dev dependencies
- **Layer caching**: Optimized layer ordering

#### **Security Hardening**
- **Non-root user**: Prevents privilege escalation
- **Read-only filesystem**: Immutable container
- **Security headers**: Nginx security configuration
- **Rate limiting**: API abuse prevention

#### **Performance Tuning**
- **Health checks**: Container health monitoring
- **Resource limits**: Memory and CPU constraints
- **Connection pooling**: Database connection optimization
- **Caching**: Nginx response caching

### Monitoring & Logging

```bash
# View application logs
docker-compose logs -f api

# Monitor resource usage
docker stats book_management_api

# Check health status
curl http://localhost:3001/api/health

# View container details
docker inspect book_management_api
```

## 🔍 Troubleshooting

### Common Issues

#### **Container Won't Start**
```bash
# Check logs
docker-compose logs api

# Check container status
docker-compose ps

# Restart services
docker-compose restart api
```

#### **Database Connection Issues**
```bash
# Check database status
docker-compose exec postgres pg_isready -U postgres

# Check database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

#### **Port Conflicts**
```bash
# Check port usage
netstat -tulpn | grep :3001

# Change ports in docker-compose.yml
ports:
  - "3002:3001"  # Use port 3002 instead
```

#### **Permission Issues**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Performance Issues

#### **High Memory Usage**
```bash
# Add memory limits to docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

#### **Slow Database Queries**
```bash
# Enable query logging
# Add to postgres environment:
POSTGRES_INITDB_ARGS: "--auth-host=scram-sha-256"
```

## 📊 Health Monitoring

### Health Check Endpoints

- **Application Health**: `GET /api/health`
- **Database Health**: Built-in PostgreSQL health check
- **Container Health**: Docker health check integration

### Health Check Response

```json
{
  "status": "ok",
  "timestamp": "2023-09-27T10:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 45678912,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1048576
  },
  "version": "1.0.0"
}
```

## 🔒 Security Considerations

### Container Security
- **Non-root execution**: Application runs as unprivileged user
- **Minimal attack surface**: Alpine Linux base image
- **Regular updates**: Keep base images updated
- **Secret management**: Use Docker secrets for sensitive data

### Network Security
- **Internal networks**: Services communicate over private networks
- **Port exposure**: Only necessary ports are exposed
- **TLS termination**: HTTPS support via Nginx
- **Rate limiting**: API abuse prevention

### Data Security
- **Encrypted connections**: Database connections use TLS
- **Secure secrets**: Environment variables for sensitive data
- **Backup encryption**: Database backups are encrypted
- **Access control**: Role-based access control

## 📈 Scaling & Load Balancing

### Horizontal Scaling

```yaml
# Scale API service
docker-compose up -d --scale api=3

# Load balancer configuration
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
  volumes:
    - ./nginx-lb.conf:/etc/nginx/nginx.conf
```

### Database Scaling

```yaml
# Read replicas
postgres-read:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: book_management
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
  command: postgres -c hot_standby=on
```

## 🎯 Best Practices

### Development
- **Use docker-compose for local development**
- **Mount source code as volume for hot reload**
- **Use .env files for environment configuration**
- **Regular database backups**

### Production
- **Use multi-stage builds for smaller images**
- **Implement proper health checks**
- **Use secrets management for sensitive data**
- **Monitor container resource usage**
- **Regular security updates**

### CI/CD Integration
- **Automated builds on code changes**
- **Security scanning of container images**
- **Automated testing in containers**
- **Blue-green deployments**

---

**Happy Containerizing! 🐳**

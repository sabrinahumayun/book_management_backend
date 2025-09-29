# 🚀 Deployment Documentation

## Overview

This document provides comprehensive deployment instructions for the Book Management Portal backend, including development, staging, and production environments.

## 🏗️ Environment Setup

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **Docker** (optional, for containerized deployment)
- **Git** (for version control)

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=book_management

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Application Configuration
NODE_ENV=development
PORT=3001

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
```

### Production Environment Variables

```env
# Database Configuration
DB_HOST=your-production-db-host
DB_PORT=5432
DB_USERNAME=production_username
DB_PASSWORD=secure_production_password
DB_DATABASE=book_management_prod

# JWT Configuration
JWT_SECRET=very-secure-production-jwt-secret-key

# Application Configuration
NODE_ENV=production
PORT=3001

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com
```

## 🐳 Docker Deployment

### Development with Docker

1. **Start the development environment:**
   ```bash
   npm run docker:up
   ```

2. **View logs:**
   ```bash
   npm run docker:logs
   ```

3. **Stop the environment:**
   ```bash
   npm run docker:down
   ```

### Production with Docker

1. **Start production environment:**
   ```bash
   npm run docker:prod
   ```

2. **Stop production environment:**
   ```bash
   npm run docker:prod:down
   ```

### Docker Compose Files

#### Development (`docker-compose.yml`)
```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USERNAME=postgres
      - DB_PASSWORD=password
      - DB_DATABASE=book_management
      - JWT_SECRET=dev-secret-key
    depends_on:
      - postgres
    volumes:
      - .:/app
      - /app/node_modules

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=book_management
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  seed:
    build:
      context: .
      dockerfile: Dockerfile.dev
    command: npm run seed
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USERNAME=postgres
      - DB_PASSWORD=password
      - DB_DATABASE=book_management
      - JWT_SECRET=dev-secret-key
    depends_on:
      - postgres
    profiles:
      - seed

volumes:
  postgres_data:
```

#### Production (`docker-compose.prod.yml`)
```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USERNAME=${DB_USERNAME}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_DATABASE=${DB_DATABASE}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=${DB_USERNAME}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_DATABASE}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

## 🏭 Production Deployment

### Manual Deployment

1. **Prepare the server:**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PostgreSQL
   sudo apt-get install -y postgresql postgresql-contrib
   
   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Clone and setup the application:**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd book_management_backend
   
   # Install dependencies
   npm ci --only=production
   
   # Build the application
   npm run build
   ```

3. **Setup the database:**
   ```bash
   # Create database user
   sudo -u postgres createuser --interactive
   
   # Create database
   sudo -u postgres createdb book_management_prod
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with production values
   ```

4. **Start the application:**
   ```bash
   # Using PM2
   pm2 start dist/main.js --name "book-management-api"
   
   # Or using npm
   npm run start:prod
   ```

### Using PM2 Process Manager

1. **Create PM2 ecosystem file (`ecosystem.config.js`):**
   ```javascript
   module.exports = {
     apps: [{
       name: 'book-management-api',
       script: 'dist/main.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3001
       },
       env_production: {
         NODE_ENV: 'production',
         PORT: 3001
       },
       error_file: './logs/err.log',
       out_file: './logs/out.log',
       log_file: './logs/combined.log',
       time: true
     }]
   };
   ```

2. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

### Nginx Reverse Proxy

1. **Install Nginx:**
   ```bash
   sudo apt install nginx
   ```

2. **Create Nginx configuration (`/etc/nginx/sites-available/book-management`):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/book-management /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### SSL Certificate (Let's Encrypt)

1. **Install Certbot:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain SSL certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Auto-renewal:**
   ```bash
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

## 🗄️ Database Setup

### PostgreSQL Configuration

1. **Create production database:**
   ```sql
   CREATE DATABASE book_management_prod;
   CREATE USER book_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE book_management_prod TO book_user;
   ```

2. **Configure PostgreSQL for production:**
   ```bash
   # Edit postgresql.conf
   sudo nano /etc/postgresql/15/main/postgresql.conf
   
   # Set these values:
   max_connections = 200
   shared_buffers = 256MB
   effective_cache_size = 1GB
   maintenance_work_mem = 64MB
   checkpoint_completion_target = 0.9
   wal_buffers = 16MB
   default_statistics_target = 100
   ```

3. **Configure pg_hba.conf:**
   ```bash
   sudo nano /etc/postgresql/15/main/pg_hba.conf
   
   # Add:
   local   book_management_prod   book_user   md5
   host    book_management_prod   book_user   127.0.0.1/32   md5
   ```

4. **Restart PostgreSQL:**
   ```bash
   sudo systemctl restart postgresql
   ```

### Database Migrations

1. **Disable synchronize in production:**
   ```typescript
   // In app.module.ts
   TypeOrmModule.forRoot({
     // ... other config
     synchronize: false, // Disable in production
     migrations: ['dist/migrations/*.js'],
     migrationsRun: true,
   })
   ```

2. **Create migration:**
   ```bash
   npm run typeorm migration:generate -- -n InitialMigration
   ```

3. **Run migrations:**
   ```bash
   npm run typeorm migration:run
   ```

## 🔒 Security Configuration

### Environment Security

1. **Secure environment variables:**
   ```bash
   # Set proper file permissions
   chmod 600 .env
   
   # Use environment-specific files
   cp .env.example .env.production
   ```

2. **Use secrets management:**
   ```bash
   # Using Docker secrets
   echo "your-secret" | docker secret create jwt_secret -
   
   # Using Kubernetes secrets
   kubectl create secret generic app-secrets \
     --from-literal=jwt-secret=your-secret \
     --from-literal=db-password=your-password
   ```

### Application Security

1. **Enable HTTPS:**
   ```typescript
   // In main.ts
   const app = await NestFactory.create(AppModule, {
     httpsOptions: {
       key: fs.readFileSync('path/to/private-key.pem'),
       cert: fs.readFileSync('path/to/certificate.pem'),
     },
   });
   ```

2. **Configure CORS properly:**
   ```typescript
   app.enableCors({
     origin: process.env.CORS_ORIGIN?.split(',') || false,
     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
     allowedHeaders: ['Content-Type', 'Authorization'],
     credentials: true,
   });
   ```

3. **Set security headers:**
   ```typescript
   app.use(helmet());
   ```

## 📊 Monitoring & Logging

### Application Monitoring

1. **Install monitoring tools:**
   ```bash
   npm install --save @nestjs/monitoring
   ```

2. **Configure health checks:**
   ```typescript
   // health.controller.ts
   @Get('health')
   @HealthCheck()
   check() {
     return this.health.check([
       () => this.db.pingCheck('database'),
     ]);
   }
   ```

3. **Set up logging:**
   ```typescript
   // In main.ts
   app.useLogger(new Logger('BookManagementAPI'));
   ```

### System Monitoring

1. **Install monitoring tools:**
   ```bash
   # Install htop for system monitoring
   sudo apt install htop
   
   # Install iotop for I/O monitoring
   sudo apt install iotop
   ```

2. **Set up log rotation:**
   ```bash
   # Create logrotate configuration
   sudo nano /etc/logrotate.d/book-management
   
   # Add:
   /var/log/book-management/*.log {
       daily
       missingok
       rotate 52
       compress
       delaycompress
       notifempty
       create 644 root root
   }
   ```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /path/to/app
          git pull origin main
          npm ci --only=production
          npm run build
          pm2 restart book-management-api
```

### Docker Hub Deployment

1. **Build and push Docker image:**
   ```bash
   # Build image
   docker build -t your-username/book-management-api .
   
   # Push to Docker Hub
   docker push your-username/book-management-api
   ```

2. **Deploy on server:**
   ```bash
   # Pull latest image
   docker pull your-username/book-management-api:latest
   
   # Stop and remove old container
   docker stop book-management-api
   docker rm book-management-api
   
   # Run new container
   docker run -d \
     --name book-management-api \
     -p 3001:3001 \
     --env-file .env.production \
     your-username/book-management-api:latest
   ```

## 🚨 Backup & Recovery

### Database Backup

1. **Create backup script:**
   ```bash
   #!/bin/bash
   # backup.sh
   DATE=$(date +%Y%m%d_%H%M%S)
   pg_dump -h localhost -U book_user book_management_prod > backup_$DATE.sql
   ```

2. **Schedule automated backups:**
   ```bash
   # Add to crontab
   0 2 * * * /path/to/backup.sh
   ```

3. **Restore from backup:**
   ```bash
   psql -h localhost -U book_user book_management_prod < backup_20231201_020000.sql
   ```

### Application Backup

1. **Backup application files:**
   ```bash
   tar -czf app_backup_$(date +%Y%m%d).tar.gz /path/to/app
   ```

2. **Backup configuration files:**
   ```bash
   cp .env .env.backup
   cp nginx.conf nginx.conf.backup
   ```

## 🔧 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Find process using port 3001
   lsof -i :3001
   
   # Kill the process
   kill -9 <PID>
   ```

2. **Database connection issues:**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Check database connectivity
   psql -h localhost -U book_user -d book_management_prod
   ```

3. **Memory issues:**
   ```bash
   # Check memory usage
   free -h
   
   # Check PM2 memory usage
   pm2 monit
   ```

### Log Analysis

1. **Application logs:**
   ```bash
   # PM2 logs
   pm2 logs book-management-api
   
   # Nginx logs
   tail -f /var/log/nginx/access.log
   tail -f /var/log/nginx/error.log
   ```

2. **Database logs:**
   ```bash
   # PostgreSQL logs
   tail -f /var/log/postgresql/postgresql-15-main.log
   ```

## 📈 Performance Optimization

### Application Performance

1. **Enable compression:**
   ```typescript
   app.use(compression());
   ```

2. **Configure caching:**
   ```typescript
   app.use(cache('1 day'));
   ```

3. **Optimize database queries:**
   ```typescript
   // Use select specific fields
   const users = await this.userRepository.find({
     select: ['id', 'email', 'firstName', 'lastName']
   });
   ```

### System Performance

1. **Configure swap:**
   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

2. **Optimize PostgreSQL:**
   ```sql
   -- Create indexes for frequently queried columns
   CREATE INDEX idx_books_title ON books(title);
   CREATE INDEX idx_books_author ON books(author);
   CREATE INDEX idx_feedback_rating ON feedbacks(rating);
   ```

## 🔄 Updates & Maintenance

### Application Updates

1. **Update dependencies:**
   ```bash
   npm update
   npm audit fix
   ```

2. **Update application:**
   ```bash
   git pull origin main
   npm ci
   npm run build
   pm2 restart book-management-api
   ```

### System Updates

1. **Update system packages:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Update Node.js:**
   ```bash
   # Using NodeSource repository
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

## 📞 Support & Maintenance

### Monitoring Checklist

- [ ] Application health checks
- [ ] Database connectivity
- [ ] Disk space usage
- [ ] Memory usage
- [ ] CPU usage
- [ ] Network connectivity
- [ ] SSL certificate validity
- [ ] Backup completion

### Maintenance Schedule

- **Daily**: Check application logs and health
- **Weekly**: Review performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and update security configurations

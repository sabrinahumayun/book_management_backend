#!/bin/bash

# Database Seeding Script for Book Management Portal
# This script seeds the database with sample data

echo "🌱 Book Management Portal - Database Seeding Script"
echo "=================================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your database configuration."
    echo ""
    echo "Example .env file:"
    echo "DB_HOST=localhost"
    echo "DB_PORT=5432"
    echo "DB_USERNAME=your_username"
    echo "DB_PASSWORD=your_password"
    echo "DB_DATABASE=book_management"
    echo "JWT_SECRET=your-super-secret-jwt-key"
    echo "NODE_ENV=development"
    echo "PORT=3001"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Ask for confirmation
echo "⚠️  WARNING: This will clear all existing data in your database!"
echo "Are you sure you want to continue? (y/N)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo "🚀 Starting database seeding..."
    echo ""
    
    # Run the seeding script
    npm run seed
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Database seeding completed successfully!"
        echo ""
        echo "🔑 Test Credentials:"
        echo "==================="
        echo "Admin User:"
        echo "  Email: admin@bookportal.com"
        echo "  Password: admin123"
        echo ""
        echo "Regular Users:"
        echo "  Email: john.doe@example.com | Password: password123"
        echo "  Email: jane.smith@example.com | Password: password123"
        echo "  Email: mike.johnson@example.com | Password: password123"
        echo "  Email: sarah.wilson@example.com | Password: password123"
        echo "  Email: david.brown@example.com | Password: password123"
        echo ""
        echo "Suspended User:"
        echo "  Email: suspended@example.com | Password: password123 (Account suspended)"
        echo ""
        echo "🌐 You can now start the application with: npm run start:dev"
        echo "📚 API Documentation: http://localhost:3001/api/docs"
    else
        echo ""
        echo "❌ Database seeding failed!"
        echo "Please check your database connection and try again."
        exit 1
    fi
else
    echo ""
    echo "❌ Database seeding cancelled."
    exit 0
fi

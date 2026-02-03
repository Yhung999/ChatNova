#!/bin/bash

echo "🚀 ChatNova Setup Script"
echo "========================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..
echo "✅ Server dependencies installed"
echo ""

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..
echo "✅ Client dependencies installed"
echo ""

echo "✨ Setup complete!"
echo ""
echo "To start the application:"
echo "1. Open terminal 1 and run: cd server && npm start"
echo "2. Open terminal 2 and run: cd client && npm start"
echo ""
echo "The app will open at http://localhost:3000"
echo ""
echo "Happy chatting! 💬"

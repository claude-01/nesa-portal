const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const papersRoutes = require('./routes/papers');
const analyticsRoutes = require('./routes/analytics');
const { authenticateToken, preventCache } = require('./middleware/auth');

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS configuration for production
const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:3000',
    'https://nesa-portal.onrender.com',
    'https://www.nesa-portal.onrender.com'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            console.log('Blocked origin:', origin);
            return callback(null, false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Trust proxy (required for Render)
app.set('trust proxy', 1);

// Serve static files - FIXED PATHS FOR PRODUCTION
const frontendPath = path.join(__dirname, '../frontend');
const uploadsPath = path.join(__dirname, 'uploads');

console.log('Frontend path:', frontendPath);
console.log('Uploads path:', uploadsPath);

// Check if frontend exists
if (fs.existsSync(frontendPath)) {
    console.log('✅ Frontend folder found');
    app.use(express.static(frontendPath));
    app.use('/css', express.static(path.join(frontendPath, 'css')));
    app.use('/js', express.static(path.join(frontendPath, 'js')));
    app.use('/admin', express.static(path.join(frontendPath, 'admin')));
    app.use('/public', express.static(path.join(frontendPath, 'public')));
} else {
    console.log('❌ Frontend folder not found at:', frontendPath);
}

// Serve uploaded files
app.use('/uploads', express.static(uploadsPath));

// Ensure uploads directory exists
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('✅ Uploads directory created');
}

// Apply cache prevention to admin routes
app.use('/api/papers/admin', preventCache);
app.use('/api/analytics', preventCache);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/papers', papersRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root route - redirect to public page
app.get('/', (req, res) => {
    res.redirect('/public/index.html');
});

// API status route
app.get('/api/status', (req, res) => {
    res.json({ 
        success: true,
        status: 'online', 
        message: 'NESA Portal API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Debug route - helps troubleshoot file paths (REMOVE IN PRODUCTION if desired)
app.get('/debug/paths', (req, res) => {
    const frontendExists = fs.existsSync(frontendPath);
    const publicExists = fs.existsSync(path.join(frontendPath, 'public'));
    const adminExists = fs.existsSync(path.join(frontendPath, 'admin'));
    
    let publicFiles = [];
    if (publicExists) {
        publicFiles = fs.readdirSync(path.join(frontendPath, 'public'));
    }
    
    res.json({
        success: true,
        frontendPath,
        frontendExists,
        publicExists,
        adminExists,
        publicFiles,
        currentDirectory: process.cwd(),
        __dirname
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        success: false,
        message: 'API endpoint not found' 
    });
});

// 404 handler for all other routes
app.use((req, res) => {
    const notFoundPath = path.join(frontendPath, '404.html');
    if (fs.existsSync(notFoundPath)) {
        res.status(404).sendFile(notFoundPath);
    } else {
        res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>404 Not Found</title>
                <style>
                    body { font-family: Arial; text-align: center; padding: 50px; background: #0a0c0f; color: white; }
                    h1 { color: #3b82f6; }
                    a { color: #3b82f6; }
                </style>
            </head>
            <body>
                <h1>404 - Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
                <a href="/public/index.html">Go to Home</a>
            </body>
            </html>
        `);
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n=================================');
    console.log('🚀 NESA PORTAL SERVER STARTED');
    console.log('=================================');
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📍 Frontend path: ${frontendPath}`);
    console.log(`📍 Public URL: /public/index.html`);
    console.log(`🔐 Admin URL: /admin/login.html`);
    console.log('=================================\n');
});

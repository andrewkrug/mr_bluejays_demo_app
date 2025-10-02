// VULNERABLE SERVER - FOR SECURITY DEMONSTRATION ONLY
// WARNING: This server contains intentional security vulnerabilities for educational purposes

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const url = require('url');

const app = express();
const PORT = 3000;

// JSON logging utility
function logJSON(level, message, metadata = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        message,
        service: 'mr-bluejays-api',
        port: PORT,
        ...metadata
    };
    console.log(JSON.stringify(logEntry));
}

// Enable CORS for all origins (intentionally permissive for demo)
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Mock product database with image URLs
const products = [
    {
        id: 1,
        name: "Classic 1460 Boot",
        price: 169.99,
        imageUrl: "http://localhost:3000/images/classic-boot.jpg",
        description: "The original Mr. Bluejays boot."
    },
    {
        id: 2,
        name: "Steel Toe Worker",
        price: 199.99,
        imageUrl: "http://localhost:3000/images/steel-toe.jpg",
        description: "Heavy-duty steel toe boot."
    },
    {
        id: 3,
        name: "Chelsea Boot",
        price: 159.99,
        imageUrl: "http://localhost:3000/images/chelsea.jpg",
        description: "Sleek slip-on design."
    }
];

// API endpoint to get products
app.get('/api/products', (req, res) => {
    res.json(products);
});

// VULNERABLE ENDPOINT - SSRF Vulnerability
// This endpoint fetches product images from URLs without validation
app.get('/api/product-image', async (req, res) => {
    const imageUrl = req.query.url;

    if (!imageUrl) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    logJSON('info', 'SSRF Demo - Fetching image', {
        endpoint: '/api/product-image',
        requestedUrl: imageUrl,
        clientIp: req.ip,
        userAgent: req.get('User-Agent')
    });

    try {
        // VULNERABILITY: No validation of the URL - allows SSRF attacks
        // Attacker can provide internal URLs like:
        // - http://localhost:3000/admin
        // - http://169.254.169.254/latest/meta-data/ (AWS metadata)
        // - file:///etc/passwd
        // - http://internal-service.local/sensitive-data

        const response = await axios.get(imageUrl, {
            timeout: 5000,
            responseType: 'arraybuffer'
        });

        // Send the fetched content back to the client
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        res.set('Content-Type', contentType);
        res.send(response.data);

    } catch (error) {
        logJSON('error', 'SSRF Demo - Error fetching image', {
            endpoint: '/api/product-image',
            requestedUrl: imageUrl,
            errorMessage: error.message,
            errorCode: error.code,
            clientIp: req.ip
        });
        res.status(500).json({
            error: 'Failed to fetch image',
            details: error.message // Intentionally leaking error details
        });
    }
});

// VULNERABLE ENDPOINT - URL Preview Feature (Another SSRF vector)
app.post('/api/preview-url', async (req, res) => {
    const { targetUrl } = req.body;

    if (!targetUrl) {
        return res.status(400).json({ error: 'targetUrl is required' });
    }

    logJSON('info', 'SSRF Demo - Previewing URL', {
        endpoint: '/api/preview-url',
        targetUrl: targetUrl,
        clientIp: req.ip,
        userAgent: req.get('User-Agent')
    });

    try {
        // VULNERABILITY: Fetches and returns content from any URL
        const response = await axios.get(targetUrl, {
            timeout: 5000,
            maxRedirects: 5
        });

        // Return the fetched content
        res.json({
            status: response.status,
            headers: response.headers,
            data: response.data.toString().substring(0, 1000), // First 1000 chars
            fullUrl: response.config.url
        });

    } catch (error) {
        logJSON('error', 'SSRF Demo - Error previewing URL', {
            endpoint: '/api/preview-url',
            targetUrl: targetUrl,
            errorMessage: error.message,
            errorCode: error.code,
            clientIp: req.ip
        });
        res.status(500).json({
            error: 'Failed to preview URL',
            message: error.message,
            attempted: targetUrl
        });
    }
});

// VULNERABLE ENDPOINT - Import product from external catalog
app.post('/api/import-product', async (req, res) => {
    const { catalogUrl } = req.body;

    if (!catalogUrl) {
        return res.status(400).json({ error: 'catalogUrl is required' });
    }

    logJSON('info', 'SSRF Demo - Importing from catalog', {
        endpoint: '/api/import-product',
        catalogUrl: catalogUrl,
        clientIp: req.ip,
        userAgent: req.get('User-Agent')
    });

    try {
        // VULNERABILITY: Fetches product data from any URL
        const response = await axios.get(catalogUrl, {
            timeout: 5000
        });

        // Simulate processing imported product data
        const importedData = response.data;

        res.json({
            message: 'Product imported successfully',
            source: catalogUrl,
            data: importedData
        });

    } catch (error) {
        logJSON('error', 'SSRF Demo - Error importing from catalog', {
            endpoint: '/api/import-product',
            catalogUrl: catalogUrl,
            errorMessage: error.message,
            errorCode: error.code,
            clientIp: req.ip
        });
        res.status(500).json({
            error: 'Failed to import from catalog',
            details: error.message
        });
    }
});

// Simulated internal admin endpoint (to demonstrate SSRF impact)
app.get('/admin/users', (req, res) => {
    // This would normally be protected, but SSRF can access it
    res.json({
        users: [
            { id: 1, username: 'admin', email: 'admin@bluejays.com', role: 'administrator' },
            { id: 2, username: 'user1', email: 'user1@example.com', role: 'customer' },
            { id: 3, username: 'user2', email: 'user2@example.com', role: 'customer' }
        ],
        internal: true,
        warning: 'This is internal data exposed via SSRF'
    });
});

// Simulated internal configuration endpoint
app.get('/internal/config', (req, res) => {
    res.json({
        database: {
            host: 'internal-db.local',
            port: 5432,
            name: 'bluejays_prod'
        },
        apiKeys: {
            stripe: 'sk_test_vulnerable_key_123',
            aws: 'AKIA_VULNERABLE_KEY'
        },
        warning: 'Internal configuration exposed via SSRF vulnerability'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'running',
        vulnerabilities: ['SSRF'],
        purpose: 'Security demonstration only'
    });
});

// Start server
app.listen(PORT, () => {
    logJSON('info', 'Server started', {
        port: PORT,
        environment: 'development',
        purpose: 'Security demonstration only',
        vulnerabilities: ['SSRF'],
        endpoints: {
            vulnerable: [
                'GET /api/product-image?url=<URL>',
                'POST /api/preview-url',
                'POST /api/import-product'
            ],
            internal: [
                '/admin/users',
                '/internal/config'
            ]
        }
    });

    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           VULNERABLE SERVER - SECURITY DEMO ONLY              ║
║                                                               ║
║  Server running on: http://localhost:${PORT}                     ║
║                                                               ║
║  SSRF Vulnerable Endpoints:                                  ║
║  - GET  /api/product-image?url=<URL>                        ║
║  - POST /api/preview-url { targetUrl: <URL> }               ║
║  - POST /api/import-product { catalogUrl: <URL> }           ║
║                                                               ║
║  Internal Endpoints (accessible via SSRF):                   ║
║  - /admin/users                                              ║
║  - /internal/config                                          ║
║                                                               ║
║  Example SSRF Attacks:                                       ║
║  - http://localhost:3000/admin/users                        ║
║  - http://169.254.169.254/latest/meta-data/                 ║
║  - http://internal-service:8080/                            ║
║                                                               ║
║  WARNING: Do not use in production!                          ║
╚═══════════════════════════════════════════════════════════════╝
    `);
});
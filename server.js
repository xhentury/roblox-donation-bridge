const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let recentDonations = [];
const MAX_DONATIONS = 50;

// Webhook dari Saweria
app.post('/webhook/donation', (req, res) => {
    console.log('📨 Webhook received from Saweria:', req.body);
    
    const donation = {
        id: Date.now().toString(),
        donor_name: req.body.donatur_name || req.body.donor_name || 'Anonymous',
        amount: req.body.amount || req.body.total || 0,
        message: req.body.message || req.body.note || 'Terima kasih!',
        timestamp: new Date().toISOString(),
        processed: false
    };
    
    recentDonations.unshift(donation);
    
    if (recentDonations.length > MAX_DONATIONS) {
        recentDonations = recentDonations.slice(0, MAX_DONATIONS);
    }
    
    console.log('✅ Donation added:', donation);
    
    res.status(200).json({
        success: true,
        message: 'Donation received',
        donation: donation
    });
});

// Endpoint untuk Roblox
app.get('/api/donations/unprocessed', (req, res) => {
    const unprocessed = recentDonations.filter(d => !d.processed);
    
    res.json({
        success: true,
        count: unprocessed.length,
        donations: unprocessed
    });
});

app.post('/api/donations/mark-processed', (req, res) => {
    const { donation_ids } = req.body;
    
    if (!donation_ids || !Array.isArray(donation_ids)) {
        return res.status(400).json({
            success: false,
            message: 'donation_ids array required'
        });
    }
    
    donation_ids.forEach(id => {
        const donation = recentDonations.find(d => d.id === id);
        if (donation) {
            donation.processed = true;
        }
    });
    
    res.json({
        success: true,
        message: `${donation_ids.length} donations marked as processed`
    });
});

// Test endpoint
app.post('/api/test/donation', (req, res) => {
    const testDonation = {
        id: Date.now().toString(),
        donor_name: req.body.donor_name || 'Test Donor',
        amount: req.body.amount || 10000,
        message: req.body.message || 'Test donation!',
        timestamp: new Date().toISOString(),
        processed: false
    };
    
    recentDonations.unshift(testDonation);
    
    res.json({
        success: true,
        message: 'Test donation created',
        donation: testDonation
    });
});

app.get('/api/donations/all', (req, res) => {
    res.json({
        success: true,
        total: recentDonations.length,
        donations: recentDonations
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        donations_count: recentDonations.length
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: '🎮 Roblox Donation Bridge Server',
        status: 'running',
        endpoints: {
            webhook: '/webhook/donation',
            unprocessed: '/api/donations/unprocessed',
            test: '/api/test/donation',
            health: '/health'
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
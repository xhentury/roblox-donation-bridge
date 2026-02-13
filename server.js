const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let recentDonations = [];
const MAX_DONATIONS = 50;

// ================================
// HELPER: Tambah donasi ke queue
// ================================
function addDonation(donor_name, amount, message, platform) {
    const donation = {
        id: Date.now().toString(),
        donor_name: donor_name || 'Anonymous',
        amount: parseInt(amount) || 0,
        message: message || 'Terima kasih!',
        platform: platform || 'unknown', // 'saweria' atau 'sociabuzz'
        timestamp: new Date().toISOString(),
        processed: false
    };

    console.log(`✅ [${platform.toUpperCase()}] Donation added:`, JSON.stringify(donation, null, 2));

    recentDonations.unshift(donation);
    if (recentDonations.length > MAX_DONATIONS) {
        recentDonations = recentDonations.slice(0, MAX_DONATIONS);
    }

    return donation;
}

// ================================
// WEBHOOK: Saweria
// ================================
app.post('/webhook/donation', (req, res) => {
    console.log('📨 Webhook received from SAWERIA');
    console.log('Body:', JSON.stringify(req.body, null, 2));

    const donation = addDonation(
        req.body.donator_name || req.body.donatur_name || req.body.donor_name || req.body.name,
        req.body.amount_raw || req.body.amount || req.body.total,
        req.body.message || req.body.note || req.body.pesan,
        'saweria'
    );

    res.status(200).json({ success: true, message: 'Saweria donation received', donation });
});

// ================================
// WEBHOOK: Sociabuzz
// ================================
app.post('/webhook/sociabuzz', (req, res) => {
    console.log('📨 Webhook received from SOCIABUZZ');
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Format Sociabuzz (akan kita update setelah lihat format aslinya)
    const donation = addDonation(
        req.body.donator_name  ||
        req.body.supporter_name ||
        req.body.from_name ||
        req.body.name ||
        req.body.username,

        req.body.amount ||
        req.body.total ||
        req.body.nominal ||
        req.body.price,

        req.body.message ||
        req.body.note ||
        req.body.comment ||
        req.body.pesan,

        'sociabuzz'
    );

    res.status(200).json({ success: true, message: 'Sociabuzz donation received', donation });
});

// ================================
// API: Roblox ambil donasi baru
// ================================
app.get('/api/donations/unprocessed', (req, res) => {
    const unprocessed = recentDonations.filter(d => !d.processed);
    res.json({ success: true, count: unprocessed.length, donations: unprocessed });
});

app.post('/api/donations/mark-processed', (req, res) => {
    const { donation_ids } = req.body;
    if (!donation_ids || !Array.isArray(donation_ids)) {
        return res.status(400).json({ success: false, message: 'donation_ids array required' });
    }
    donation_ids.forEach(id => {
        const donation = recentDonations.find(d => d.id === id);
        if (donation) donation.processed = true;
    });
    res.json({ success: true, message: `${donation_ids.length} donations marked as processed` });
});

// ================================
// API: Test donation manual
// ================================
app.post('/api/test/donation', (req, res) => {
    const donation = addDonation(
        req.body.donor_name || 'Test Donor',
        req.body.amount || 10000,
        req.body.message || 'Test donation!',
        req.body.platform || 'test'
    );
    res.json({ success: true, message: 'Test donation created', donation });
});

// Test khusus Sociabuzz
app.post('/api/test/sociabuzz', (req, res) => {
    const donation = addDonation(
        req.body.donor_name || 'Test Sociabuzz',
        req.body.amount || 15000,
        req.body.message || 'Test dari Sociabuzz!',
        'sociabuzz'
    );
    res.json({ success: true, message: 'Test Sociabuzz donation created', donation });
});

// ================================
// API: Lainnya
// ================================
app.get('/api/donations/all', (req, res) => {
    res.json({ success: true, total: recentDonations.length, donations: recentDonations });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        donations_count: recentDonations.length,
        endpoints: {
            saweria_webhook: '/webhook/donation',
            sociabuzz_webhook: '/webhook/sociabuzz',
            test: '/api/test/donation',
            test_sociabuzz: '/api/test/sociabuzz'
        }
    });
});

app.get('/', (req, res) => {
    res.json({ message: 'Roblox Donation Bridge', status: 'running' });
});

app.listen(PORT, () => {
    console.log('🚀 Server running on port', PORT);
    console.log('📡 Saweria webhook: /webhook/donation');
    console.log('📡 Sociabuzz webhook: /webhook/sociabuzz');
});

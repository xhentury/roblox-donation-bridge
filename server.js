const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let recentDonations = [];
const MAX_DONATIONS = 50;

app.post('/webhook/donation', (req, res) => {
    console.log('Webhook received from Saweria');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const donation = {
        id: Date.now().toString(),
        donor_name: req.body.donator_name || req.body.donatur_name || req.body.donor_name || 'Anonymous',
        amount: req.body.amount_raw || req.body.amount || req.body.total || 0,
        message: req.body.message || req.body.note || req.body.pesan || 'Terima kasih',
        timestamp: new Date().toISOString(),
        processed: false
    };
    
    console.log('Processed donation:', donation);
    
    recentDonations.unshift(donation);
    
    if (recentDonations.length > MAX_DONATIONS) {
        recentDonations = recentDonations.slice(0, MAX_DONATIONS);
    }
    
    res.status(200).json({ success: true, message: 'Donation received' });
});

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
    res.json({ success: true, message: 'Processed' });
});

app.post('/api/test/donation', (req, res) => {
    const testDonation = {
        id: Date.now().toString(),
        donor_name: req.body.donor_name || 'Test Donor',
        amount: req.body.amount || 10000,
        message: req.body.message || 'Test donation',
        timestamp: new Date().toISOString(),
        processed: false
    };
    recentDonations.unshift(testDonation);
    res.json({ success: true, donation: testDonation });
});

app.get('/api/donations/all', (req, res) => {
    res.json({ success: true, total: recentDonations.length, donations: recentDonations });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.json({ message: 'Roblox Donation Bridge', status: 'running' });
});

app.listen(PORT, () => {
    console.log('Server running on port', PORT);
});
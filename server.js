// Webhook dari Saweria - FIXED AMOUNT HANDLING
app.post('/webhook/donation', (req, res) => {
    console.log('=== WEBHOOK RECEIVED FROM SAWERIA ===');
    console.log('Full Body:', JSON.stringify(req.body, null, 2));
    console.log('========================================');
    
    // Extract amount dengan berbagai kemungkinan field
    let amount = 0;
    
    // Coba berbagai kemungkinan nama field untuk amount
    if (req.body.amount) {
        amount = parseInt(req.body.amount) || 0;
    } else if (req.body.total) {
        amount = parseInt(req.body.total) || 0;
    } else if (req.body.nominal) {
        amount = parseInt(req.body.nominal) || 0;
    } else if (req.body.amount_raw) {
        amount = parseInt(req.body.amount_raw) || 0;
    } else if (req.body.donation_amount) {
        amount = parseInt(req.body.donation_amount) || 0;
    } else if (req.body.jumlah) {
        amount = parseInt(req.body.jumlah) || 0;
    }
    
    // Log untuk debug
    console.log('Extracted amount:', amount);
    
    const donation = {
        id: Date.now().toString(),
        donor_name: req.body.donatur_name || 
                   req.body.donor_name || 
                   req.body.name || 
                   req.body.supporter_name ||
                   req.body.donator ||
                   'Anonymous',
        amount: amount,
        message: req.body.message || 
                req.body.note || 
                req.body.pesan ||
                req.body.comment ||
                'Terima kasih!',
        timestamp: new Date().toISOString(),
        processed: false,
        raw_data: req.body // Simpan raw data untuk debug
    };
    
    recentDonations.unshift(donation);
    
    if (recentDonations.length > MAX_DONATIONS) {
        recentDonations = recentDonations.slice(0, MAX_DONATIONS);
    }
    
    console.log('✅ Donation processed:', JSON.stringify(donation, null, 2));
    
    res.status(200).json({
        success: true,
        message: 'Donation received',
        donation: donation
    });
});

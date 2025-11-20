const fetch = require('node-fetch');

async function testAnalytics() {
    try {
        console.log('🧪 Testing Analytics API...');
        
        const now = new Date();
        const startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);

        const params = new URLSearchParams();
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
        params.append('_t', Date.now());

        console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

        const response = await fetch(`http://localhost:4000/api/sales/analytics?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer test-token',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        console.log(`📡 Response status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('📊 Analytics Results:');
            console.log(`  - Total Sales: ${data.totalSales}`);
            console.log(`  - Total Revenue: ₱${data.totalRevenue}`);
            console.log(`  - Total Cost: ₱${data.totalCost}`);
            console.log(`  - Total Profit: ₱${data.totalProfit}`);
            console.log(`  - Profit Margin: ${data.totalRevenue > 0 ? ((data.totalProfit / data.totalRevenue) * 100).toFixed(1) : 0}%`);
            
            if (data.totalSales > 1) {
                console.log('⚠️  DUPLICATE DETECTED: More than 1 sale found!');
            } else {
                console.log('✅ No duplicates detected');
            }
        } else {
            const error = await response.text();
            console.log(`❌ Error: ${error}`);
        }
    } catch (error) {
        console.log(`❌ Network error: ${error.message}`);
    }
}

// Run the test
testAnalytics();

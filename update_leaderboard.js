// ⚡ Backend script to update static leaderboard.json
// Run this every 60 seconds via cron or scheduled task
// 
// INSTALLATION:
// npm install airtable
// node update_leaderboard.js

const Airtable = require('airtable');
const fs = require('fs');

const AIRTABLE_CONFIG = {
    apiKey: process.env.AIRTABLE_API_KEY || 'patgtYBRVsbCN0yiz.d660b61e2e10c4bf7877e383d77586f64e679a77cccb38b31d7d7d99cc7f3797',
    baseId: 'appyo8R5LsbYRi40o',
    usersTable: 'Users'
};

async function updateLeaderboard() {
    try {
        console.log('🔄 Fetching leaderboard data from Airtable...');
        
        const base = new Airtable({ apiKey: AIRTABLE_CONFIG.apiKey }).base(AIRTABLE_CONFIG.baseId);
        
        const records = await base(AIRTABLE_CONFIG.usersTable).select({
            view: 'Grid view'
        }).all();
        
        console.log(`📊 Found ${records.length} users in Airtable`);
        
        // Process and sort users
        const allUsers = records
            .map(record => {
                const referralCount = record.fields['Referral Count'] || 0;
                const questXP = record.fields['Quest XP'] || 0;
                const referralXP = referralCount * 100;
                const totalXP = referralXP + questXP;
                
                return {
                    code: record.fields['Referral Code'] || 'N/A',
                    count: referralCount,
                    xp: totalXP,
                    questXP: questXP,
                    referralXP: referralXP
                };
            })
            .filter(user => user.xp > 0)
            .sort((a, b) => b.xp - a.xp);
        
        const top10 = allUsers.slice(0, 10);
        
        const leaderboardData = {
            lastUpdated: new Date().toISOString(),
            top10: top10,
            totalUsers: allUsers.length,
            updateInterval: 60
        };
        
        // Write to static file
        const filePath = './leaderboard.json';
        fs.writeFileSync(filePath, JSON.stringify(leaderboardData, null, 2));
        
        console.log(`✅ Updated leaderboard.json with ${allUsers.length} users, ${top10.length} in top 10`);
        console.log(`📅 Last updated: ${leaderboardData.lastUpdated}`);
        
    } catch (error) {
        console.error('❌ Failed to update leaderboard:', error);
        process.exit(1);
    }
}

// Run immediately
updateLeaderboard();

// If run with --watch, update every 60 seconds
if (process.argv.includes('--watch')) {
    console.log('👀 Watching for changes (updates every 60 seconds)...');
    setInterval(updateLeaderboard, 60000);
}


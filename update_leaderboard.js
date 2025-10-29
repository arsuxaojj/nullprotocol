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
    usersTable: 'Users',
    referralsTable: 'Referrals'
};

async function updateLeaderboard() {
    const startTime = Date.now();
    
    try {
        console.log('🔄 Fetching leaderboard data from Airtable...');
        
        const base = new Airtable({ apiKey: AIRTABLE_CONFIG.apiKey }).base(AIRTABLE_CONFIG.baseId);
        
        // Get all users (with pagination handling)
        console.log('📥 Fetching users...');
        const userRecords = await base(AIRTABLE_CONFIG.usersTable).select({
            view: 'Grid view',
            pageSize: 100
        }).all();
        
        console.log(`📊 Found ${userRecords.length} users in Airtable`);
        
        // Get all referrals and count by referrer code (with pagination handling)
        console.log('📥 Fetching referrals...');
        const referralRecords = await base(AIRTABLE_CONFIG.referralsTable).select({
            view: 'Grid view',
            pageSize: 100
        }).all();
        
        console.log(`📊 Found ${referralRecords.length} referral records`);
        
        // Count referrals per code (VALIDATION: count only from Referrals table)
        const referralCounts = {};
        const referredWallets = new Set(); // Track unique wallets
        
        referralRecords.forEach(record => {
            const referrerCode = record.fields['Referrer Code'];
            const referredWallet = record.fields['Referred Wallet'];
            
            if (referrerCode && referredWallet) {
                // Count only unique wallets (prevent duplicate counting)
                const walletKey = `${referrerCode}_${referredWallet.toLowerCase()}`;
                if (!referredWallets.has(walletKey)) {
                    referralCounts[referrerCode] = (referralCounts[referrerCode] || 0) + 1;
                    referredWallets.add(walletKey);
                }
            }
        });
        
        console.log(`📊 Calculated referral counts for ${Object.keys(referralCounts).length} codes`);
        
        // Process and sort users (USE REAL COUNTS FROM REFERRALS TABLE, NOT FIELD)
        const allUsers = userRecords
            .map(record => {
                const referralCode = record.fields['Referral Code'] || 'N/A';
                // Use REAL count from Referrals table, not the field (which can be faked)
                const referralCount = referralCounts[referralCode] || 0;
                const questXP = parseFloat(record.fields['Quest XP']) || 0;
                
                // VALIDATION: Cap referral count at reasonable limit (prevent abuse)
                const safeReferralCount = Math.min(referralCount, 1000000); // Max 1M referrals
                const safeQuestXP = Math.min(questXP, 10000000); // Max 10M quest XP
                
                const referralXP = safeReferralCount * 100;
                const totalXP = referralXP + safeQuestXP;
                
                return {
                    code: referralCode,
                    count: safeReferralCount,
                    xp: totalXP,
                    questXP: safeQuestXP,
                    referralXP: referralXP
                };
            })
            .filter(user => user.code && user.code !== 'N/A' && user.xp > 0)
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
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`⏱️ Completed in ${duration} seconds`);
        
        // Exit successfully
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Failed to update leaderboard:', error);
        console.error('Error stack:', error.stack);
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


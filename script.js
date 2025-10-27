// Null Protocol Interactive Script - AIRTABLE INTEGRATION

// Twitter OAuth Configuration
const TWITTER_CONFIG = {
    consumerKey: 'We5HTTT18NTd11DLxNFUdDM15k',
    consumerSecret: 'efjzpHY1OWYeKrnzprCRtcpNNZ7AZkVucFL9XCZVKZ7ISjingK',
    callbackUrl: window.location.origin + '/callback'
};

// Twitter OAuth Functions - DISABLED
/*
function initTwitterAuth() {
    const connectBtn = document.getElementById('twitterConnectBtn');
    const statusDiv = document.getElementById('twitterStatus');
    const disconnectBtn = document.getElementById('twitterDisconnectBtn');
    
    if (connectBtn) {
        connectBtn.addEventListener('click', connectTwitter);
    }
    
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', disconnectTwitter);
    }
    
    // Check if user is already connected
    checkTwitterConnection();
}

function connectTwitter() {
    console.log('Starting Twitter OAuth connection...');
    
    // Используем Twitter OAuth 2.0 для подключения аккаунта
    const clientId = 'UOJNX3JUamxQeG9tcnlEa310SFg6MTpjaQ'; // Новый Client ID
    const redirectUri = encodeURIComponent(window.location.origin + '/callback');
    const scope = encodeURIComponent('tweet.read users.read follows.read');
    
    // Twitter OAuth 2.0 URL
    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=twitter_connect&code_challenge=challenge&code_challenge_method=plain`;
    
    // Открываем в popup
    const popup = window.open(
        authUrl,
        'twitter-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
    );
    
    // Слушаем сообщения от popup
    const messageListener = (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'TWITTER_AUTH_SUCCESS') {
            const userData = event.data.user;
            
            // Сохраняем данные пользователя
            localStorage.setItem('twitter_user', JSON.stringify(userData));
            updateTwitterStatus(userData);
            
            // Сохраняем в Airtable
            saveTwitterConnectionToAirtable(userData);
            
            // Завершаем квест
            completeQuest('follow_twitter');
            
            console.log('✅ Twitter account connected successfully!');
            
            // Удаляем слушатель
            window.removeEventListener('message', messageListener);
        }
    };
    
    window.addEventListener('message', messageListener);
    
    // Проверяем закрытие popup
    const checkClosed = setInterval(() => {
        if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
        }
    }, 1000);
}

// Removed complex OAuth functions for simplified approach

function disconnectTwitter() {
    localStorage.removeItem('twitter_user');
    updateTwitterStatus(null);
}

function checkTwitterConnection() {
    const userData = localStorage.getItem('twitter_user');
    if (userData) {
        const user = JSON.parse(userData);
        updateTwitterStatus(user);
    }
}

function updateTwitterStatus(user) {
    const connectBtn = document.getElementById('twitterConnectBtn');
    const statusDiv = document.getElementById('twitterStatus');
    const userInfo = statusDiv?.querySelector('.twitter-user-info');
    
    if (user) {
        connectBtn.style.display = 'none';
        statusDiv.style.display = 'flex';
        if (userInfo) {
            userInfo.textContent = `Connected as @${user.username}`;
        }
    } else {
        connectBtn.style.display = 'flex';
        statusDiv.style.display = 'none';
    }
}

function isTwitterConnected() {
    return localStorage.getItem('twitter_user') !== null;
}

// Save Twitter connection to Airtable (simplified)
async function saveTwitterConnectionToAirtable(twitterUser) {
    try {
        const referralCode = localStorage.getItem('my_referral_code');
        
        if (!referralCode) {
            console.log('No referral code found, skipping Airtable save');
            return;
        }
        
        // Find user in Airtable
        const userResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${AIRTABLE_CONFIG.usersTable}?filterByFormula={Referral Code}='${referralCode}'`, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}`
            }
        });
        
        const userData = await userResponse.json();
        
        if (userData.records && userData.records.length > 0) {
            const userRecord = userData.records[0];
            
            // Update user record with Twitter info
            const updateResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${AIRTABLE_CONFIG.usersTable}/${userRecord.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        'Twitter Username': twitterUser.username,
                        'Twitter Name': twitterUser.name,
                        'Twitter ID': twitterUser.id,
                        'Twitter Followers': twitterUser.followers_count,
                        'Twitter Verified': twitterUser.verified,
                        'Twitter Connected': true,
                        'Twitter Connected At': twitterUser.connected_at
                    }
                })
            });
            
            if (updateResponse.ok) {
                console.log('✅ Twitter connection saved to Airtable');
            } else {
                console.error('❌ Failed to save Twitter connection to Airtable');
            }
        } else {
            console.log('User not found in Airtable for Twitter connection');
        }
        
    } catch (error) {
        console.error('Error saving Twitter connection to Airtable:', error);
    }
}
*/

// Simplified Twitter connection - no complex OAuth for free API

document.addEventListener('DOMContentLoaded', function() {
    // Airtable Configuration
    const AIRTABLE_CONFIG = {
        apiKey: 'patgtYBRVsbCN0yiz.d660b61e2e10c4bf7877e383d77586f64e679a77cccb38b31d7d7d99cc7f3797',
        baseId: 'appyo8R5LsbYRi40o',
        usersTable: 'Users',
        referralsTable: 'Referrals'
    };

    const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}`;

    // ===== AIRTABLE API FUNCTIONS =====
    
    // Request cache to reduce API calls
    const requestCache = new Map();
    const CACHE_DURATION = 30000; // 30 seconds cache
    
    // Rate limiting queue
    let requestQueue = [];
    let isProcessingQueue = false;
    const MAX_REQUESTS_PER_SECOND = 4; // Stay under 5 req/sec limit
    let requestTimestamps = [];
    
    // Generic function to make Airtable API calls with retry and rate limiting
    async function airtableRequest(endpoint, method = 'GET', data = null, retries = 3) {
        const url = `${AIRTABLE_API_URL}/${endpoint}`;
        
        // Check cache for GET requests
        if (method === 'GET') {
            const cacheKey = `${method}_${url}`;
            const cached = requestCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                console.log(`📦 Using cached response for ${endpoint}`);
                return cached.data;
            }
        }
        
        // Rate limiting
        await rateLimitCheck();
        
        console.log(`Making Airtable request: ${method} ${url}`);
        
        const options = {
            method: method,
            headers: {
                'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
            console.log('Request body:', options.body);
        }
        
        // Retry logic
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const response = await fetch(url, options);
                console.log('Response status:', response.status, response.statusText);
                
                // Handle rate limiting (429)
                if (response.status === 429) {
                    const retryAfter = response.headers.get('Retry-After') || (attempt + 1) * 1000;
                    console.warn(`⚠️ Rate limited. Waiting ${retryAfter}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, retryAfter));
                    continue;
                }
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Error response:', errorText);
                    
                    // Retry on server errors (5xx)
                    if (response.status >= 500 && attempt < retries - 1) {
                        console.warn(`⚠️ Server error ${response.status}. Retrying... (${attempt + 1}/${retries})`);
                        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 500));
                        continue;
                    }
                    
                    throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorText}`);
                }
                
                const result = await response.json();
                console.log('Response data:', result);
                
                // Cache GET responses
                if (method === 'GET') {
                    const cacheKey = `${method}_${url}`;
                    requestCache.set(cacheKey, {
                        data: result,
                        timestamp: Date.now()
                    });
                }
                
                return result;
            } catch (error) {
                if (attempt < retries - 1) {
                    console.warn(`⚠️ Request failed. Retrying... (${attempt + 1}/${retries})`);
                    await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 500));
                } else {
                    console.error('Airtable API request failed after retries:', error);
                    throw error;
                }
            }
        }
    }
    
    // Rate limiting function
    async function rateLimitCheck() {
        const now = Date.now();
        // Remove timestamps older than 1 second
        requestTimestamps = requestTimestamps.filter(ts => now - ts < 1000);
        
        // If we're at the limit, wait
        if (requestTimestamps.length >= MAX_REQUESTS_PER_SECOND) {
            const waitTime = 1000 - (now - requestTimestamps[0]);
            console.log(`⏱️ Rate limit reached. Waiting ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            // Clean up old timestamps again
            const now2 = Date.now();
            requestTimestamps = requestTimestamps.filter(ts => now2 - ts < 1000);
        }
        
        // Add current timestamp
        requestTimestamps.push(Date.now());
    }

    // Create a new user in Airtable - DEBUG VERSION
    async function createUserInAirtable(userData) {
        console.log('Creating user in Airtable with data:', userData);
        
        const data = {
            records: [{
                fields: {
                    'Wallet Address': userData.walletAddress,
                    'Referral Code': userData.referralCode,
                    'Invite Code': userData.inviteCode,
                    'Registration Date': userData.registrationDate,
                    'Referrer Code': userData.referrerCode || '',
                    'Referral Count': 0
                }
            }]
        };
        
        console.log('Sending to Airtable:', data);
        
        try {
            const result = await airtableRequest(`${AIRTABLE_CONFIG.usersTable}`, 'POST', data);
            console.log('Airtable response:', result);
            return result;
        } catch (error) {
            console.error('Airtable create user error:', error);
            throw error;
        }
    }

    // Create a new referral record in Airtable
    async function createReferralInAirtable(referralData) {
        const data = {
            records: [{
                fields: {
                    'Referrer Code': referralData.referrerCode,
                    'Referred Wallet': referralData.referredWallet,
                    'Referral Date': referralData.referralDate,
                    'Status': 'completed'
                }
            }]
        };
        
        return await airtableRequest(`${AIRTABLE_CONFIG.referralsTable}`, 'POST', data);
    }

    // Get user by referral code
    async function getUserByReferralCode(referralCode) {
        const params = new URLSearchParams({
            filterByFormula: `{Referral Code} = "${referralCode}"`
        });
        
        return await airtableRequest(`${AIRTABLE_CONFIG.usersTable}?${params}`);
    }

    // Get referrals count for a user
    async function getReferralsCount(referralCode) {
        const params = new URLSearchParams({
            filterByFormula: `{Referrer Code} = "${referralCode}"`
        });
        
        const result = await airtableRequest(`${AIRTABLE_CONFIG.referralsTable}?${params}`);
        return result.records.length;
    }

    // Update user's referral count
    async function updateUserReferralCount(referralCode, newCount) {
        // First, get the user record
        const userResult = await getUserByReferralCode(referralCode);
        if (userResult.records.length === 0) {
            throw new Error('User not found');
        }
        
        const recordId = userResult.records[0].id;
        const data = {
            records: [{
                id: recordId,
                fields: {
                    'Referral Count': newCount
                }
            }]
        };
        
        return await airtableRequest(`${AIRTABLE_CONFIG.usersTable}`, 'PATCH', data);
    }

    // ===== END AIRTABLE API FUNCTIONS =====

    // Screen elements
    const screen1 = document.getElementById('screen1');
    const screen2 = document.getElementById('screen2');
    const screen3 = document.getElementById('screen3');
    const mainLogo = document.getElementById('mainLogo');
    
    // Form elements
    const codeStep = document.getElementById('codeStep');
    const walletStep = document.getElementById('walletStep');
    const inviteCodeInput = document.getElementById('inviteCode');
    const walletAddressInput = document.getElementById('walletAddress');
    const codeBtn = document.getElementById('codeBtn');
    const walletBtn = document.getElementById('walletBtn');
    const walletCount = document.getElementById('walletCount');
    
    // Referral elements
    const referralLink = document.getElementById('referralLink');
    const copyBtn = document.getElementById('copyBtn');
    const referralCount = document.getElementById('referralCount');
    const xpCount = document.getElementById('xpCount');
    const walletCount2 = document.getElementById('walletCount2');
    
    // Discord button (will be found dynamically since it appears on multiple screens)
    let discordBtn = null;

    // Wallet storage system
    const STORAGE_KEY = 'null_protocol_wallets';
    const ADMIN_KEY = 'null_protocol_admin';

    // Valid invite codes (you can change these)
    const VALID_CODES = ['NULL2024', 'PROTOCOL', 'VOID', 'ENTER'];

    // ===== NEW REFERRAL SYSTEM =====
    
    // Generate unique referral code
    function generateReferralCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Get or create user referral code
    function getUserReferralCode() {
        let referralCode = localStorage.getItem('my_referral_code');
        if (!referralCode) {
            referralCode = generateReferralCode();
            localStorage.setItem('my_referral_code', referralCode);
            console.log('Generated new referral code:', referralCode);
        }
        return referralCode;
    }

    // Generate referral link
    function generateReferralLink() {
        const referralCode = getUserReferralCode();
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?ref=${referralCode}`;
    }

    // Get my referral count - AIRTABLE VERSION (RESTORED)
    async function getMyReferralCount() {
        const myCode = getUserReferralCode();
        console.log('Looking for referrals for my code:', myCode);
        
        try {
            const count = await getReferralsCount(myCode);
            console.log('My referral count for code', myCode, ':', count);
            return count;
        } catch (error) {
            console.error('Failed to get referral count from Airtable:', error);
            // Fallback to localStorage
            const count = parseInt(localStorage.getItem(`ref_count_${myCode}`) || '0');
            console.log('Using localStorage fallback:', count);
            return count;
        }
    }

    // Add referral to my count
    function addReferralToMe() {
        const myCode = getUserReferralCode();
        console.log('Adding referral to my code:', myCode);
        
        const currentCount = getMyReferralCount();
        const newCount = currentCount + 1;
        
        localStorage.setItem(`ref_count_${myCode}`, newCount.toString());
        console.log('Added referral to my count. New total:', newCount);
        console.log('localStorage now has:', localStorage.getItem(`ref_count_${myCode}`));
        
        updateReferralDisplay();
    }

    // Update referral display - AIRTABLE VERSION
    async function updateReferralDisplay() {
        try {
            const count = await getMyReferralCount();
            const referralXP = count * 100; // 100 XP per referral
            const questXP = getTotalXP(); // XP from completed quests
            const totalXP = referralXP + questXP;
            
            console.log('Updating referral display. Count:', count, 'Referral XP:', referralXP, 'Quest XP:', questXP, 'Total XP:', totalXP);
            
            // Find elements again in case they're not loaded yet
            const refCountEl = document.getElementById('referralCount');
            const xpCountEl = document.getElementById('xpCount');
            
            if (refCountEl) {
                refCountEl.textContent = count;
                console.log('Updated referral count element to:', count);
            } else {
                console.log('Referral count element not found');
            }
            
            if (xpCountEl) {
                xpCountEl.textContent = totalXP;
                console.log('Updated XP element to:', totalXP);
            } else {
                console.log('XP count element not found');
            }
        } catch (error) {
            console.error('Failed to update referral display:', error);
        }
    }

    // Clear my referrals
    function clearMyReferrals() {
        const myCode = getUserReferralCode();
        localStorage.removeItem(`ref_count_${myCode}`);
        console.log('Cleared referrals for code:', myCode);
        updateReferralDisplay();
    }

    // Handle referral link from URL - AIRTABLE VERSION
    async function handleReferralFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        
        if (refCode) {
            console.log('Someone came from referral link:', refCode);
            
            // Store that this user came from a referral
            localStorage.setItem('came_from_referral', refCode);
            
            // Remove ref parameter from URL
            const newUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            
            console.log('Referral link processed, will create referral record after registration');
        }
    }

    // Check for pending referrals from other browsers
    function checkPendingReferrals() {
        const myCode = getUserReferralCode();
        const pendingReferrals = JSON.parse(localStorage.getItem('pending_referrals') || '[]');
        
        // Count referrals for my code
        const myReferrals = pendingReferrals.filter(ref => ref.referrerCode === myCode);
        
        if (myReferrals.length > 0) {
            console.log('Found', myReferrals.length, 'pending referrals for my code:', myCode);
            
            // Add them to my count
            const currentCount = parseInt(localStorage.getItem(`ref_count_${myCode}`) || '0');
            const newCount = currentCount + myReferrals.length;
            localStorage.setItem(`ref_count_${myCode}`, newCount.toString());
            
            console.log('Updated my referral count from', currentCount, 'to', newCount);
            
            // Remove processed referrals
            const remainingReferrals = pendingReferrals.filter(ref => ref.referrerCode !== myCode);
            localStorage.setItem('pending_referrals', JSON.stringify(remainingReferrals));
            
            // Update display
            updateReferralDisplay();
        }
    }

    // Check if wallet is already registered
    function isWalletRegistered(walletAddress) {
        const wallets = getStoredWallets();
        return wallets.some(wallet => 
            wallet.address.toLowerCase() === walletAddress.toLowerCase()
        );
    }

    // Check if user has completed registration
    function hasUserCompletedRegistration() {
        return localStorage.getItem('user_completed_registration') === 'true';
    }

    // Mark user as completed registration
    function markUserAsCompleted() {
        localStorage.setItem('user_completed_registration', 'true');
    }

    // Get user's wallet address
    function getUserWalletAddress() {
        return localStorage.getItem('user_wallet_address');
    }

    // Save user's wallet address
    function saveUserWalletAddress(address) {
        localStorage.setItem('user_wallet_address', address);
    }

    // Get stored wallets
    function getStoredWallets() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    // Save wallet to storage and Airtable - FIXED VERSION
    async function saveWallet(walletData) {
        const wallets = getStoredWallets();
        
        // Check for duplicates
        const isDuplicate = wallets.some(wallet => 
            wallet.address.toLowerCase() === walletData.address.toLowerCase()
        );
        
        if (!isDuplicate) {
            // Add to localStorage
            wallets.push({
                ...walletData,
                timestamp: new Date().toISOString(),
                id: Date.now() + Math.random()
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
            
            // Create user in Airtable
            try {
                const referralCode = getUserReferralCode();
                const cameFromRef = localStorage.getItem('came_from_referral');
                
                const userData = {
                    walletAddress: walletData.address,
                    referralCode: referralCode,
                    inviteCode: walletData.inviteCode,
                    registrationDate: new Date().toISOString().split('T')[0],
                    referrerCode: cameFromRef || ''
                };
                
                await createUserInAirtable(userData);
                console.log('User created in Airtable successfully');
                
                // If user came from a referral, create referral record
                if (cameFromRef) {
                    const referralData = {
                        referrerCode: cameFromRef,
                        referredWallet: walletData.address,
                        referralDate: new Date().toISOString().split('T')[0]
                    };
                    
                    await createReferralInAirtable(referralData);
                    console.log('Referral record created in Airtable successfully');
                    
                    // Update referrer's count
                    try {
                        const currentCount = await getReferralsCount(cameFromRef);
                        await updateUserReferralCount(cameFromRef, currentCount);
                        console.log('Updated referrer count in Airtable');
                    } catch (error) {
                        console.error('Failed to update referrer count:', error);
                    }
                    
                    // Complete invite friend quest for the referrer
                    completeInviteFriendQuest();
                    
                    // Note: XP is given through the quest completion, not separately
                }
                
            } catch (error) {
                console.error('Failed to save to Airtable:', error);
                // Continue anyway - localStorage backup worked
            }
            
            return true;
        }
        return false;
    }

    // Export wallets to CSV
    function exportWalletsToCSV() {
        const wallets = getStoredWallets();
        if (wallets.length === 0) {
            alert('No wallets to export');
            return;
        }

        const headers = ['Address', 'Invite Code', 'Timestamp', 'ID'];
        const csvContent = [
            headers.join(','),
            ...wallets.map(wallet => [
                wallet.address,
                wallet.inviteCode,
                wallet.timestamp,
                wallet.id
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `null_protocol_wallets_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Export wallets to JSON
    function exportWalletsToJSON() {
        const wallets = getStoredWallets();
        if (wallets.length === 0) {
            alert('No wallets to export');
            return;
        }

        const jsonContent = JSON.stringify(wallets, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `null_protocol_wallets_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Get current wallet count from Airtable
    async function getCurrentWalletCount() {
        try {
            const usersResult = await airtableRequest(`${AIRTABLE_CONFIG.usersTable}`);
            const count = usersResult.records ? usersResult.records.length : 0;
            console.log('Total wallets from Airtable:', count);
            return count;
        } catch (error) {
            console.error('Failed to get wallet count from Airtable:', error);
            // Fallback to localStorage
            return getStoredWallets().length;
        }
    }

    // Initialize wallet counter with real data from Airtable
    async function initializeWalletCounter() {
        try {
            const realCount = await getCurrentWalletCount();
            let currentCount = 0;
            const targetCount = Math.max(realCount, 1); // Start from 1, not 100
            const increment = Math.ceil(targetCount / 100);

            function animateCounter() {
                if (currentCount < targetCount) {
                    currentCount += increment;
                    if (currentCount > targetCount) currentCount = targetCount;
                    walletCount.textContent = currentCount.toLocaleString();
                    walletCount2.textContent = currentCount.toLocaleString();
                    requestAnimationFrame(animateCounter);
                }
            }

            // Start counter animation after a delay
            setTimeout(animateCounter, 2000);
        } catch (error) {
            console.error('Failed to initialize wallet counter:', error);
            // Fallback to localStorage
            const storedCount = getStoredWallets().length;
            let currentCount = storedCount > 0 ? storedCount : 0;
            const targetCount = Math.max(currentCount, 1); // Start from 1, not 100
            const increment = Math.ceil(targetCount / 100);

            function animateCounter() {
                if (currentCount < targetCount) {
                    currentCount += increment;
                    if (currentCount > targetCount) currentCount = targetCount;
                    walletCount.textContent = currentCount.toLocaleString();
                    walletCount2.textContent = currentCount.toLocaleString();
                    requestAnimationFrame(animateCounter);
                }
            }

            // Start counter animation after a delay
            setTimeout(animateCounter, 2000);
        }
    }

    // Initialize wallet counter
    initializeWalletCounter();

    // Check if user has already completed registration - AIRTABLE VERSION
    async function checkUserStatus() {
        if (hasUserCompletedRegistration()) {
            console.log('User already completed registration, showing referral screen');
            // User already registered, show referral screen directly
            screen1.style.display = 'none';
            screen2.style.display = 'none';
            screen3.style.display = 'block';
            
            // Generate and set referral link
            const link = generateReferralLink();
            referralLink.value = link;
            
            // Update stats with delay to ensure elements are loaded
            setTimeout(async () => {
                await updateReferralDisplay();
            }, 200);
            
            // Update wallet counter
            const walletAddress = getUserWalletAddress();
            if (walletAddress) {
                const newCount = await getCurrentWalletCount();
                walletCount2.textContent = newCount.toLocaleString();
            }
            
            // Initialize Discord button for screen 3
            setTimeout(() => {
                initDiscordButton();
            }, 100);
        } else {
            console.log('New user, starting from screen 1');
            // New user, start from screen 1
            screen1.style.display = 'block';
            screen2.style.display = 'none';
            screen3.style.display = 'none';
        }
    }

    // Initialize referral system and user status check - AIRTABLE VERSION
    async function initializeApp() {
        await handleReferralFromURL();
        await checkUserStatus();
    }
    
    // Start the app
    initializeApp();

    // Screen 1: Yin-Yang click handler
    mainLogo.addEventListener('click', function() {
        console.log('Yin-Yang clicked, transitioning to screen 2');
        
        // Add transition effect
        screen1.style.opacity = '0';
        screen1.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            screen1.style.display = 'none';
            screen2.style.display = 'block';
            screen2.style.opacity = '0';
            screen2.style.transform = 'scale(1.1)';
            
            // Animate screen 2 appearance
            setTimeout(() => {
                screen2.style.transition = 'all 0.5s ease';
                screen2.style.opacity = '1';
                screen2.style.transform = 'scale(1)';
                
                // Initialize Discord button for screen 2
                initDiscordButton();
            }, 50);
        }, 500);
    });

    // Code verification handler
    codeBtn.addEventListener('click', function() {
        const inviteCode = inviteCodeInput.value.trim().toUpperCase();
        
        if (!inviteCode) {
            alert('Please enter an invite code');
            inviteCodeInput.focus();
            return;
        }

        // Check if code is valid
        if (VALID_CODES.includes(inviteCode)) {
            console.log('Valid code entered:', inviteCode);
            
            // Hide code step and show wallet step
            codeStep.style.display = 'none';
            walletStep.style.display = 'flex';
            walletStep.style.opacity = '0';
            walletStep.style.transform = 'translateY(20px)';
            
            // Animate wallet step appearance
            setTimeout(() => {
                walletStep.style.transition = 'all 0.3s ease';
                walletStep.style.opacity = '1';
                walletStep.style.transform = 'translateY(0)';
                walletAddressInput.focus();
            }, 100);
            
        } else {
            alert('Invalid invite code. Please try again.');
            inviteCodeInput.value = '';
            inviteCodeInput.focus();
        }
    });

    // Wallet submission handler - AIRTABLE VERSION
    walletBtn.addEventListener('click', async function() {
        const inviteCode = inviteCodeInput.value.trim().toUpperCase();
        const walletAddress = walletAddressInput.value.trim();

        // Basic Solana wallet address validation
        const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
        if (!solanaAddressRegex.test(walletAddress)) {
            alert('Please enter a valid Solana wallet address');
            walletAddressInput.focus();
            return;
        }

        // Save wallet data
        const walletData = {
            address: walletAddress,
            inviteCode: inviteCode
        };

        // Simulate submission
        walletBtn.textContent = 'Processing...';
        walletBtn.disabled = true;

        try {
            const wasSaved = await saveWallet(walletData);
            
            if (wasSaved) {
                // Mark user as completed and save wallet address
                markUserAsCompleted();
                saveUserWalletAddress(walletAddress);
                
                // Show welcome tweet modal
                showWelcomeTweetModal();
                
                // Update wallet counter with real data
                const newCount = await getCurrentWalletCount();
                walletCount.textContent = newCount.toLocaleString();
                walletCount2.textContent = newCount.toLocaleString();
            } else {
                alert(`Wallet already registered!\n\nInvite Code: ${inviteCode}\nWallet: ${walletAddress}\n\nProtocol access already granted!`);
                
                // Reset form
                walletBtn.textContent = 'Join Protocol';
                walletBtn.disabled = false;
                inviteCodeInput.value = '';
                walletAddressInput.value = '';
                
                // Reset to code step
                walletStep.style.display = 'none';
                codeStep.style.display = 'flex';
            }
        } catch (error) {
            console.error('Error saving wallet:', error);
            alert('Error saving wallet. Please try again.');
            walletBtn.textContent = 'Join Protocol';
            walletBtn.disabled = false;
        }
    });

    // Add keyboard support
    document.addEventListener('keydown', function(e) {
        // Enter key submits form when focused on inputs
        if (e.key === 'Enter') {
            if (document.activeElement === inviteCodeInput) {
                codeBtn.click();
            } else if (document.activeElement === walletAddressInput) {
                walletBtn.click();
            }
        }
        
        // Escape key resets form
        if (e.key === 'Escape') {
            if (walletStep.style.display !== 'none') {
                walletStep.style.display = 'none';
                codeStep.style.display = 'flex';
                walletAddressInput.value = '';
                inviteCodeInput.focus();
            }
        }
    });

    // Show referral screen - AIRTABLE VERSION
    async function showReferralScreen() {
        console.log('Showing referral screen');
        
        // Generate and set referral link
        const link = generateReferralLink();
        referralLink.value = link;
        
        // Update stats
        await updateReferralDisplay();
        
        // Hide screen 2 and show screen 3
        screen2.style.opacity = '0';
        screen2.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            screen2.style.display = 'none';
            screen3.style.display = 'block';
            screen3.style.opacity = '0';
            screen3.style.transform = 'scale(1.1)';
            
            // Animate screen 3 appearance
            setTimeout(() => {
                screen3.style.transition = 'all 0.5s ease';
                screen3.style.opacity = '1';
                screen3.style.transform = 'scale(1)';
                
                // Initialize Discord button for screen 3
                initDiscordButton();
                // Initialize navigation for screen 3
                initNavigation();
                
                // Show XP notification if user came from referral
                const cameFromRef = localStorage.getItem('came_from_referral');
                if (cameFromRef) {
                    setTimeout(() => {
                        alert(`🎉 Welcome to Null Protocol!\n\nYou registered via referral link!\n+100 XP earned!\n\nYour referrer also earned +100 XP!\n\nTotal XP: 100`);
                    }, 1000);
                }
            }, 50);
        }, 500);
    }

    // Copy referral link handler
    copyBtn.addEventListener('click', function() {
        referralLink.select();
        referralLink.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            copyBtn.textContent = 'Copied!';
            copyBtn.style.backgroundColor = '#00ff00';
            copyBtn.style.color = '#000000';
            
            setTimeout(() => {
                copyBtn.textContent = 'Copy';
                copyBtn.style.backgroundColor = '#ffffff';
                copyBtn.style.color = '#333333';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            alert('Failed to copy link. Please copy manually.');
        }
    });

    // Initialize Discord button handler
    function initDiscordButton() {
        // Find all Discord buttons
        const discordButtons = document.querySelectorAll('.discord.coming-soon');
        
        discordButtons.forEach((btn, index) => {
            // Remove existing listeners to avoid duplicates
            btn.replaceWith(btn.cloneNode(true));
            const newBtn = document.querySelectorAll('.discord.coming-soon')[index];
            
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Discord button clicked!', index); // Debug log
                
                // Create and show coming soon popup
                const popup = document.createElement('div');
                popup.className = 'coming-soon-popup';
                popup.innerHTML = `
                    <div class="popup-content">
                        <div class="popup-icon">🚀</div>
                        <div class="popup-title">Coming Soon</div>
                        <div class="popup-subtitle">Discord server will be available soon</div>
                        <button class="popup-close">OK</button>
                    </div>
                `;
                
                document.body.appendChild(popup);
                
                // Close popup handlers
                const closeBtn = popup.querySelector('.popup-close');
                closeBtn.addEventListener('click', () => {
                    popup.remove();
                });
                
                popup.addEventListener('click', (e) => {
                    if (e.target === popup) {
                        popup.remove();
                    }
                });
                
                // Auto close after 3 seconds
                setTimeout(() => {
                    if (popup.parentNode) {
                        popup.remove();
                    }
                }, 3000);
            });
        });
        
        if (discordButtons.length === 0) {
            console.error('No Discord buttons found!');
        } else {
            console.log(`Found ${discordButtons.length} Discord buttons`);
        }
    }

    // Initialize Discord button when screens change
    initDiscordButton();

    // Initialize navigation
    function initNavigation() {
        const invitesBtn = document.getElementById('invitesBtn');
        const questsBtn = document.getElementById('questsBtn');
        const leaderboardBtn = document.getElementById('leaderboardBtn');
        const invitesContent = document.getElementById('invitesContent');
        const questsContent = document.getElementById('questsContent');
        const leaderboardContent = document.getElementById('leaderboardContent');

        if (invitesBtn && questsBtn && leaderboardBtn && invitesContent && questsContent && leaderboardContent) {
            invitesBtn.addEventListener('click', () => {
                // Switch to invites tab
                invitesBtn.classList.add('active');
                questsBtn.classList.remove('active');
                leaderboardBtn.classList.remove('active');
                invitesContent.style.display = 'block';
                questsContent.style.display = 'none';
                leaderboardContent.style.display = 'none';
            });

            questsBtn.addEventListener('click', () => {
                // Switch to quests tab
                questsBtn.classList.add('active');
                invitesBtn.classList.remove('active');
                leaderboardBtn.classList.remove('active');
                invitesContent.style.display = 'none';
                questsContent.style.display = 'block';
                leaderboardContent.style.display = 'none';
                
                // Load quests data
                loadQuests();
            });

            leaderboardBtn.addEventListener('click', () => {
                // Switch to leaderboard tab
                leaderboardBtn.classList.add('active');
                invitesBtn.classList.remove('active');
                questsBtn.classList.remove('active');
                invitesContent.style.display = 'none';
                questsContent.style.display = 'none';
                leaderboardContent.style.display = 'block';
                
                // Load leaderboard data
                loadLeaderboard();
            });
        }
    }

    // Render leaderboard from static JSON data (for high traffic)
    function renderLeaderboardFromData(top10Users, totalUsers) {
        const leaderboardList = document.getElementById('leaderboardList');
        if (!leaderboardList) return;
        
        console.log('🎨 Rendering leaderboard from static data...');
        
        // Get current user info
        const currentUserCode = localStorage.getItem('my_referral_code');
        const currentUserXP = parseInt(localStorage.getItem('total_xp') || '0');
        
        // Find current user in top10
        const currentUserIndex = top10Users.findIndex(user => user.code === currentUserCode);
        const currentUser = currentUserIndex >= 0 ? top10Users[currentUserIndex] : null;
        const currentUserPosition = currentUserIndex >= 0 ? currentUserIndex + 1 : null;
        
        // Render top 10
        let leaderboardHTML = '';
        if (top10Users.length > 0) {
            leaderboardHTML = top10Users.map((user, index) => {
                const isTop3 = index < 3;
                const isCurrentUser = user.code === currentUserCode;
                const position = index + 1;
                return `
                    <div class="leaderboard-item ${isTop3 ? 'top-3' : ''} ${isCurrentUser ? 'current-user' : ''}">
                        <div class="leaderboard-position-number">#${position}</div>
                        <div class="leaderboard-code">${user.code}</div>
                        <div class="leaderboard-stats">
                            <div class="leaderboard-count">${user.count || 0}</div>
                            <div class="leaderboard-xp">${user.xp || 0} XP</div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        // Add current user's position ALWAYS
        if (currentUser && currentUserPosition) {
            // User is in top 10
            leaderboardHTML += `
                <div class="leaderboard-separator">
                    <div class="separator-line"></div>
                    <div class="separator-text">Your Position</div>
                    <div class="separator-line"></div>
                </div>
                <div class="leaderboard-item current-user">
                    <div class="leaderboard-position-number">#${currentUserPosition}</div>
                    <div class="leaderboard-code">${currentUser.code}</div>
                    <div class="leaderboard-stats">
                        <div class="leaderboard-count">${currentUser.count || 0}</div>
                        <div class="leaderboard-xp">${currentUser.xp || 0} XP</div>
                    </div>
                </div>
            `;
        } else if (currentUserCode) {
            // User not in top 10, but has referral code
            const estimatedPosition = totalUsers + 1;
            leaderboardHTML += `
                <div class="leaderboard-separator">
                    <div class="separator-line"></div>
                    <div class="separator-text">Your Position</div>
                    <div class="separator-line"></div>
                </div>
                <div class="leaderboard-item current-user">
                    <div class="leaderboard-position-number">#${estimatedPosition}+</div>
                    <div class="leaderboard-code">${currentUserCode}</div>
                    <div class="leaderboard-stats">
                        <div class="leaderboard-count">0</div>
                        <div class="leaderboard-xp">${currentUserXP} XP</div>
                    </div>
                </div>
            `;
        }
        
        if (leaderboardHTML) {
            leaderboardList.innerHTML = leaderboardHTML;
        } else {
            leaderboardList.innerHTML = '<div class="leaderboard-empty">No users with XP yet</div>';
        }
        
        console.log('✅ Leaderboard rendered from static data');
    }
    
    // Load leaderboard data - STATIC FILE FIRST FOR HIGH TRAFFIC
    async function loadLeaderboard() {
        const leaderboardList = document.getElementById('leaderboardList');
        if (!leaderboardList) return;

        try {
            console.log('🔄 Loading leaderboard...');
            
            // CRITICAL: Try static file first (read-only CDN, 10,000+ req/sec capacity)
            let staticData = null;
            try {
                const staticResponse = await fetch('./leaderboard.json?' + Date.now()); // Cache busting
                if (staticResponse.ok) {
                    staticData = await staticResponse.json();
                    console.log('📦 Using static leaderboard file (last updated: ' + staticData.lastUpdated + ')');
                    
                    // Render from static data
                    renderLeaderboardFromData(staticData.top10 || [], staticData.totalUsers || 0);
                    return; // DONE - no Airtable calls!
                }
            } catch (staticError) {
                console.log('⚠️ Static file not available, falling back to Airtable...');
            }
            
            // FALLBACK: Use Airtable only if static file unavailable
            console.log('🔄 Loading fresh leaderboard data from Airtable...');
            
            // Get all users from Airtable
            const usersResult = await airtableRequest(`${AIRTABLE_CONFIG.usersTable}`);
            console.log('📊 Fetched users from Airtable:', usersResult.records.length);

            if (usersResult.records && usersResult.records.length > 0) {
                // Process and sort users by total XP
                const allUsers = usersResult.records
                    .map(record => {
                        const referralCount = record.fields['Referral Count'] || 0;
                        const referralXP = referralCount * 100;
                        const questXP = record.fields['Quest XP'] || 0;
                        const totalXP = referralXP + questXP;
                        
                        return {
                            code: record.fields['Referral Code'] || 'N/A',
                            count: referralCount,
                            xp: totalXP,
                            questXP: questXP,
                            referralXP: referralXP
                        };
                    })
                    .filter(user => user.xp > 0) // Only show users with XP
                    .sort((a, b) => b.xp - a.xp); // Sort by total XP descending

                // Find current user's position FIRST
                const currentUserCode = localStorage.getItem('my_referral_code');
                const currentUserIndex = allUsers.findIndex(user => user.code === currentUserCode);
                const currentUser = currentUserIndex >= 0 ? allUsers[currentUserIndex] : null;
                const currentUserPosition = currentUserIndex >= 0 ? currentUserIndex + 1 : null;
                
                // Get top 10 for display
                const top10Users = allUsers.slice(0, 10);

                console.log('🏆 All users sorted by XP:', allUsers.length);
                console.log('👤 Current user position:', currentUserPosition);
                console.log('👤 Current user code:', currentUserCode);
                console.log('👤 Current user found:', currentUser);

                // Render leaderboard WITHOUT duplicating - renderLeaderboard already does it
                // Don't call renderLeaderboard here, we'll render manually below
                
                if (top10Users.length > 0) {
                    let leaderboardHTML = top10Users.map((user, index) => {
                        const isTop3 = index < 3;
                        const isCurrentUser = user.code === currentUserCode; // Check if current user
                        const position = index + 1;
                        return `
                            <div class="leaderboard-item ${isTop3 ? 'top-3' : ''} ${isCurrentUser ? 'current-user' : ''}">
                                <div class="leaderboard-position-number">#${position}</div>
                                <div class="leaderboard-code">${user.code}</div>
                                <div class="leaderboard-stats">
                                    <div class="leaderboard-count">${user.count}</div>
                                    <div class="leaderboard-xp">${user.xp} XP</div>
                                </div>
                            </div>
                        `;
                    }).join('');
                    
                    // Add current user's position ALWAYS (even if not found in leaderboard)
                    console.log('🔍 Checking if should add "Your Position" block:', { currentUser: !!currentUser, currentUserPosition });
                    
                    const currentUserXP = parseInt(localStorage.getItem('total_xp') || '0');
                    
                    if (currentUser && currentUserPosition) {
                        // User found in leaderboard
                        console.log('✅ Adding "Your Position" block for user:', currentUser.code, 'at position:', currentUserPosition);
                        leaderboardHTML += `
                            <div class="leaderboard-separator">
                                <div class="separator-line"></div>
                                <div class="separator-text">Your Position</div>
                                <div class="separator-line"></div>
                            </div>
                            <div class="leaderboard-item current-user">
                                <div class="leaderboard-position-number">#${currentUserPosition}</div>
                                <div class="leaderboard-code">${currentUser.code}</div>
                                <div class="leaderboard-stats">
                                    <div class="leaderboard-count">${currentUser.count}</div>
                                    <div class="leaderboard-xp">${currentUser.xp} XP</div>
                                </div>
                            </div>
                        `;
                    } else if (currentUserCode) {
                        // User not in leaderboard but has referral code - show at bottom
                        console.log('✅ User not in leaderboard, showing position at bottom with code:', currentUserCode);
                        const estimatedPosition = allUsers.length + 1;
                        leaderboardHTML += `
                            <div class="leaderboard-separator">
                                <div class="separator-line"></div>
                                <div class="separator-text">Your Position</div>
                                <div class="separator-line"></div>
                            </div>
                            <div class="leaderboard-item current-user">
                                <div class="leaderboard-position-number">#${estimatedPosition}+</div>
                                <div class="leaderboard-code">${currentUserCode}</div>
                                <div class="leaderboard-stats">
                                    <div class="leaderboard-count">0</div>
                                    <div class="leaderboard-xp">${currentUserXP} XP</div>
                                </div>
                            </div>
                        `;
                    } else {
                        console.log('❌ No referral code found - cannot show position');
                    }
                    
                    leaderboardList.innerHTML = leaderboardHTML;
                    console.log(`✅ Displayed ${top10Users.length} users in leaderboard${currentUser ? ' + current user position' : ''}`);
                } else {
                    // Even if no top 10 users, show current user if they exist
                    if (currentUser && currentUserPosition) {
                        console.log('✅ No top 10 users, but showing current user position');
                        leaderboardList.innerHTML = `
                            <div class="leaderboard-empty">No other users with XP yet</div>
                            <div class="leaderboard-separator">
                                <div class="separator-line"></div>
                                <div class="separator-text">Your Position</div>
                                <div class="separator-line"></div>
                            </div>
                            <div class="leaderboard-item current-user">
                                <div class="leaderboard-position-number">#${currentUserPosition}</div>
                                <div class="leaderboard-code">${currentUser.code}</div>
                                <div class="leaderboard-stats">
                                    <div class="leaderboard-count">${currentUser.count}</div>
                                    <div class="leaderboard-xp">${currentUser.xp} XP</div>
                                </div>
                            </div>
                        `;
                    } else {
                        leaderboardList.innerHTML = '<div class="leaderboard-empty">No users with XP yet</div>';
                    }
                }
            } else {
                leaderboardList.innerHTML = '<div class="leaderboard-empty">No users found</div>';
            }
        } catch (error) {
            console.error('❌ Failed to load leaderboard:', error);
            leaderboardList.innerHTML = `
                <div class="leaderboard-empty" style="color: #ff6666;">
                    ⚠️ Unable to connect to server
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: rgba(255, 102, 102, 0.1); border: 1px solid #ff6666; border-radius: 8px; color: #ffcccc; font-size: 0.9rem;">
                    The site is experiencing high traffic. Please try refreshing the page in a few moments.
                </div>
            `;
        }
    }

    // Load quests data
    function loadQuests() {
        const questsList = document.getElementById('questsList');
        if (!questsList) return;

        // Define quests
        const quests = [
            {
                id: 'welcome_tweet',
                name: 'Welcome Tweet',
                description: 'Share your success on Twitter',
                reward: 200,
                icon: '🎉',
                completed: localStorage.getItem('quest_welcome_tweet') === 'true',
                url: 'welcome_tweet' // Special action for welcome tweet
            },
            {
                id: 'follow_twitter',
                name: 'Follow Twitter',
                description: 'Follow @nullprotocol_ on Twitter',
                reward: 150,
                icon: '🐦',
                completed: localStorage.getItem('quest_follow_twitter') === 'true',
                url: 'https://x.com/nullprotocol_'
            },
            {
                id: 'retweet_post',
                name: 'Retweet Post',
                description: 'Retweet our latest post',
                reward: 150,
                icon: '🔄',
                completed: localStorage.getItem('quest_retweet_post') === 'true',
                url: 'https://x.com/nullprotocol_/status/1981792353708052769'
            },
            {
                id: 'quote_post',
                name: 'Quote Post',
                description: 'Quote our latest post',
                reward: 100,
                icon: '💬',
                completed: localStorage.getItem('quest_quote_post') === 'true',
                url: 'https://x.com/nullprotocol_/status/1981792353708052769'
            },
            {
                id: 'like_post',
                name: 'Like Post',
                description: 'Like our latest post',
                reward: 50,
                icon: '❤️',
                completed: localStorage.getItem('quest_like_post') === 'true',
                url: 'https://x.com/nullprotocol_/status/1981792353708052769'
            },
            {
                id: 'invite_friend',
                name: 'Invite Friend',
                description: 'Invite a friend to join',
                reward: 100,
                icon: '👥',
                completed: false, // Never show as completed
                url: 'invites_tab' // Special action to switch to invites tab
            }
        ];

        // Display quests
        questsList.innerHTML = quests.map(quest => {
            const statusClass = quest.completed ? 'completed' : '';
            const statusText = quest.completed ? 'COMPLETED' : 'CLICK TO START';
            const iconClass = quest.completed ? 'completed' : '';

            return `
                <div class="quest-item ${statusClass}" data-quest-id="${quest.id}">
                    <div class="quest-info">
                        <div class="quest-icon ${iconClass}">${quest.icon}</div>
                        <div class="quest-details">
                            <div class="quest-name">${quest.name}</div>
                            <div class="quest-description">${quest.description}</div>
                        </div>
                    </div>
                    <div class="quest-reward">${quest.reward} XP</div>
                    <div class="quest-status">${statusText}</div>
                </div>
            `;
        }).join('');
    }

    // XP Management System
    function getTotalXP() {
        return parseInt(localStorage.getItem('total_xp') || '0');
    }

    function addXP(amount) {
        const currentXP = getTotalXP();
        const newXP = currentXP + amount;
        localStorage.setItem('total_xp', newXP.toString());
        console.log(`Added ${amount} XP! Total XP: ${newXP}`);
        return newXP;
    }

    // Update user XP in Airtable
    async function updateUserXPInAirtable(totalXP) {
        try {
            const referralCode = localStorage.getItem('my_referral_code');
            console.log('🔍 Attempting to update XP for referral code:', referralCode);
            console.log('🔍 Current localStorage wallet:', localStorage.getItem('user_wallet_address'));
            console.log('🔍 Current localStorage referral code:', referralCode);
            
            if (!referralCode) {
                console.log('❌ No referral code found, skipping Airtable XP update');
                return;
            }

            // Find user record by referral code (this is what's displayed in leaderboard)
            const usersResult = await airtableRequest(`${AIRTABLE_CONFIG.usersTable}?filterByFormula={Referral Code}='${referralCode}'`);
            console.log('🔍 Users search result for XP update:', usersResult);
            
            if (usersResult.records && usersResult.records.length > 0) {
                const recordId = usersResult.records[0].id;
                const currentRecord = usersResult.records[0];
                
                console.log('🔍 Found user record for XP update. Record ID:', recordId);
                console.log('🔍 Current fields:', currentRecord.fields);
                console.log('🔍 User wallet in Airtable:', currentRecord.fields['Wallet Address']);
                
                // Try different field names for XP
                const possibleFieldNames = ['Quest XP', 'XP', 'Total XP', 'Quest Points', 'Points'];
                let xpFieldName = 'Quest XP'; // Default
                
                // Check which field exists in the record
                for (const fieldName of possibleFieldNames) {
                    if (currentRecord.fields.hasOwnProperty(fieldName)) {
                        xpFieldName = fieldName;
                        console.log(`✅ Found XP field: ${fieldName}`);
                        break;
                    }
                }
                
                console.log('🔍 All available fields:', Object.keys(currentRecord.fields));
                console.log('🔍 Using XP field name:', xpFieldName);
                
                // Update XP field
                console.log(`🚀 About to PATCH Airtable user record ${recordId} with fields: { ${xpFieldName}: ${totalXP} }`);
                
                const patchResponse = await airtableRequest(`${AIRTABLE_CONFIG.usersTable}/${recordId}`, 'PATCH', {
                    fields: {
                        [xpFieldName]: totalXP
                    }
                });
                
                console.log(`✅ Updated user XP in Airtable: ${totalXP} (field: ${xpFieldName})`);
                console.log('🔍 Airtable PATCH response:', patchResponse);
                
            } else {
                console.log('❌ User not found in Airtable for XP update with referral code:', referralCode);
            }
        } catch (error) {
            console.error('❌ Failed to update user XP in Airtable:', error);
            console.log('❌ Error details:', error);
        }
    }

    function updateXPDisplay() {
        // Use the total XP from localStorage instead of calculating
        updateTotalXPDisplay();
    }

    // Load user XP from Airtable and update display
    async function loadUserXPFromAirtable() {
        try {
            const referralCode = localStorage.getItem('my_referral_code');
            if (!referralCode) {
                console.log('No referral code found, using localStorage XP');
                updateTotalXPDisplay();
                return;
            }

            console.log('🔄 Loading user XP from Airtable...');
            
            // Find user in Airtable
            const userResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${AIRTABLE_CONFIG.usersTable}?filterByFormula={Referral Code}='${referralCode}'`, {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}`
                }
            });
            
            const userData = await userResponse.json();
            
            if (userData.records && userData.records.length > 0) {
                const userRecord = userData.records[0];
                const referralCount = userRecord.fields['Referral Count'] || 0;
                const questXP = userRecord.fields['Quest XP'] || 0;
                const referralXP = referralCount * 100;
                const totalXP = referralXP + questXP;
                
                console.log(`📊 Airtable XP - Referral: ${referralXP}, Quest: ${questXP}, Total: ${totalXP}`);
                
                // Update localStorage with Airtable data
                localStorage.setItem('total_xp', totalXP.toString());
                
                // Update display
                updateTotalXPDisplay();
                
                console.log('✅ User XP loaded from Airtable and updated');
            } else {
                console.log('User not found in Airtable, using localStorage XP');
                updateTotalXPDisplay();
            }
            
        } catch (error) {
            console.error('Error loading user XP from Airtable:', error);
            updateTotalXPDisplay();
        }
    }

    // Update total XP display
    function updateTotalXPDisplay() {
        const totalXP = parseInt(localStorage.getItem('total_xp') || '0');
        const xpCountElement = document.getElementById('xpCount');
        
        console.log(`🔍 updateTotalXPDisplay called:`);
        console.log(`📊 totalXP from localStorage: ${totalXP}`);
        console.log(`🎯 xpCountElement found:`, xpCountElement);
        
        if (xpCountElement) {
            xpCountElement.textContent = totalXP.toLocaleString();
            console.log(`✅ Updated xpCountElement to: ${totalXP.toLocaleString()}`);
        } else {
            console.error(`❌ Element with id 'xpCount' not found!`);
        }
    }

    // Complete quest function with XP reward - SIMPLIFIED VERSION
    function completeQuest(questId) {
        console.log(`🎯 Completing quest: ${questId}`);
        
        localStorage.setItem(`quest_${questId}`, 'true');
        
        // Add XP reward
        const reward = getQuestReward(questId);
        console.log(`💰 Quest reward: ${reward} XP`);
        
        const newTotalXP = addXP(reward);
        console.log(`📊 New total XP: ${newTotalXP}`);
        
        // Update XP in Airtable
        console.log(`🚀 Calling updateUserXPInAirtable with ${newTotalXP} XP`);
        updateUserXPInAirtable(newTotalXP);
        
        // Update XP display
        updateXPDisplay();
        
        // Reload quests to show updated status
        loadQuests();
        
        // Reload leaderboard to show updated XP
        loadLeaderboard();
        
        console.log(`✅ Quest ${questId} completed! +${reward} XP (Total: ${newTotalXP})`);
    }

    // Complete invite friend quest automatically when someone registers via referral
    function completeInviteFriendQuest() {
        const isAlreadyCompleted = localStorage.getItem('quest_invite_friend') === 'true';
        if (!isAlreadyCompleted) {
            localStorage.setItem('quest_invite_friend', 'true');
            
            // Add XP reward for invite friend quest
            const reward = getQuestReward('invite_friend');
            const newTotalXP = addXP(reward);
            
            // Update XP in Airtable
            updateUserXPInAirtable(newTotalXP);
            
            // Update XP display
            updateXPDisplay();
            
            // Reload quests to show updated status
            loadQuests();
            
            // Reload leaderboard to show updated XP
            loadLeaderboard();
            
            console.log('Invite Friend quest completed automatically!');
        }
    }

    // Handle quest click
    function handleQuestClick(questId, questItem = null) {
        // Special handling for invite friend quest - always switch to invites tab
        if (questId === 'invite_friend') {
            const invitesBtn = document.getElementById('invitesBtn');
            if (invitesBtn) {
                invitesBtn.click(); // Trigger the invites tab click
            }
            return;
        }
        
        // Special handling for welcome tweet quest
        if (questId === 'welcome_tweet') {
            const isCompleted = localStorage.getItem(`quest_${questId}`) === 'true';
            
            if (isCompleted) {
                alert('Welcome Tweet quest is already completed!');
                return;
            }
            
            // Show welcome tweet modal
            showWelcomeTweetModal();
            return;
        }
        
        const isCompleted = localStorage.getItem(`quest_${questId}`) === 'true';
        
        // Define quest data
        const questData = {
            'follow_twitter': {
                name: 'Follow Twitter',
                url: 'https://x.com/intent/follow?screen_name=nullprotocol_',
                action: 'Follow @nullprotocol_'
            },
            'retweet_post': {
                name: 'Retweet Post',
                url: 'https://x.com/intent/retweet?tweet_id=1981792353708052769',
                action: 'Retweet our latest post'
            },
            'quote_post': {
                name: 'Quote Post',
                url: 'https://x.com/intent/tweet?in_reply_to=1981792353708052769',
                action: 'Quote our latest post'
            },
            'like_post': {
                name: 'Like Post',
                url: 'https://x.com/intent/like?tweet_id=1981792353708052769',
                action: 'Like our latest post'
            }
        };
        
        const quest = questData[questId];
        if (!quest) return;
        
        if (isCompleted) {
            // If already completed, show message
            alert(`Quest "${quest.name}" is already completed!`);
        } else {
            if (quest.url) {
                // Open Twitter link in new tab
                window.open(quest.url, '_blank');
                
                // Automatically complete quest after 4 seconds
                setTimeout(() => {
                    if (questItem) {
                        questItem.classList.remove('loading');
                        questItem.classList.add('completed-animation');
                        
                        // Update status to COMPLETED
                        const statusElement = questItem.querySelector('.quest-status');
                        if (statusElement) {
                            statusElement.innerHTML = 'COMPLETED';
                            statusElement.style.color = '#00ff00';
                        }
                    }
                    completeQuest(questId);
                }, 4000);
            }
        }
    }

    // Get quest reward
    function getQuestReward(questId) {
        const rewards = {
            'welcome_tweet': 200,
            'follow_twitter': 150,
            'retweet_post': 150,
            'quote_post': 100,
            'like_post': 50,
            'invite_friend': 100
        };
        const reward = rewards[questId] || 0;
        console.log(`Getting reward for quest ${questId}: ${reward} XP`);
        return reward;
    }

    // Welcome Tweet Modal Functions
    function showWelcomeTweetModal() {
        const modal = document.getElementById('welcomeTweetModal');
        const referralLinkSpan = document.getElementById('referralLink');
        
        // Get user's referral link
        const referralCode = localStorage.getItem('my_referral_code');
        const referralLink = `${window.location.origin}?ref=${referralCode}`;
        
        // Set referral link in preview
        referralLinkSpan.textContent = referralLink;
        
        // Show modal
        modal.style.display = 'flex';
        
        // Add event listeners
        document.getElementById('skipTweetBtn').onclick = () => {
            hideWelcomeTweetModal();
            showReferralScreen();
        };
        
        document.getElementById('shareTweetBtn').onclick = () => {
            shareWelcomeTweet(referralLink);
        };
    }
    
    function hideWelcomeTweetModal() {
        const modal = document.getElementById('welcomeTweetModal');
        modal.style.display = 'none';
    }
    
    function shareWelcomeTweet(referralLink) {
        // Create tweet text
        const tweetText = `I just joined @nullprotocol_! 🚀 Join me and earn rewards! ${referralLink}`;
        
        // Create Twitter intent URL
        const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        
        // Open Twitter in new tab
        window.open(twitterUrl, '_blank');
        
        // Complete welcome tweet quest and give XP
        completeWelcomeTweetQuest();
        
        // Hide modal and show referral screen
        hideWelcomeTweetModal();
        showReferralScreen();
    }
    
    function completeWelcomeTweetQuest() {
        const questId = 'welcome_tweet';
        const reward = 200;
        
        // Mark quest as completed
        localStorage.setItem(`quest_${questId}`, 'true');
        
        // Add XP
        const currentXP = parseInt(localStorage.getItem('total_xp') || '0');
        const newTotalXP = currentXP + reward;
        localStorage.setItem('total_xp', newTotalXP.toString());
        
        // Update Airtable with new XP
        updateUserXPInAirtable(newTotalXP);
        
        // Update XP display
        updateXPDisplay();
        
        console.log(`✅ Welcome Tweet Quest completed! +${reward} XP`);
    }

    // Theme Switcher Functions
    function initThemeSwitcher() {
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = themeToggle?.querySelector('.theme-icon');
        
        if (!themeToggle || !themeIcon) return;
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(themeIcon, savedTheme);
        
        // Add click listener
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(themeIcon, newTheme);
            
            console.log(`🎨 Theme switched to: ${newTheme}`);
        });
    }
    
    function updateThemeIcon(icon, theme) {
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    
    // Chat System Functions
    function initChatSystem() {
        const chatBtn = document.getElementById('chatBtn');
        const chatContent = document.getElementById('chatContent');
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendMessageBtn');
        const chatMessages = document.getElementById('chatMessages');
        
        if (!chatBtn || !chatContent || !chatInput || !sendBtn || !chatMessages) return;
        
        // Add chat tab to navigation
        chatBtn.addEventListener('click', () => {
            // Switch to chat tab
            chatBtn.classList.add('active');
            document.getElementById('invitesBtn').classList.remove('active');
            document.getElementById('questsBtn').classList.remove('active');
            document.getElementById('leaderboardBtn').classList.remove('active');
            
            // Show chat content
            document.getElementById('invitesContent').style.display = 'none';
            document.getElementById('questsContent').style.display = 'none';
            document.getElementById('leaderboardContent').style.display = 'none';
            chatContent.style.display = 'block';
            
            // Focus input
            setTimeout(() => chatInput.focus(), 100);
        });
        
        // Send message functionality
        function sendMessage() {
            const message = chatInput.value.trim();
            if (!message) return;
            
            const referralCode = localStorage.getItem('my_referral_code') || 'Anonymous';
            const timestamp = new Date().toLocaleTimeString();
            
            // Add message to chat
            addChatMessage(referralCode, message, timestamp, true);
            
            // Clear input
            chatInput.value = '';
            
            // Simulate other users (for demo)
            setTimeout(() => {
                const responses = [
                    "Great work! 🚀",
                    "Welcome to the community!",
                    "Nice referral code!",
                    "Keep it up! 💪",
                    "This project is amazing!"
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                const randomUser = `User${Math.floor(Math.random() * 1000)}`;
                addChatMessage(randomUser, randomResponse, new Date().toLocaleTimeString(), false);
            }, 1000 + Math.random() * 2000);
        }
        
        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        
        // Update online count (simulate)
        updateOnlineCount();
        setInterval(updateOnlineCount, 5000);
    }
    
    function addChatMessage(username, message, timestamp, isOwn = false) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        // Remove welcome message if it exists
        const welcome = chatMessages.querySelector('.chat-welcome');
        if (welcome) welcome.remove();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isOwn ? 'own' : ''}`;
        messageDiv.innerHTML = `
            <div class="chat-message-header">
                <span class="chat-username">${username}</span>
                <span class="chat-timestamp">${timestamp}</span>
            </div>
            <div class="chat-text">${message}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function updateOnlineCount() {
        const onlineCount = document.getElementById('onlineCount');
        if (!onlineCount) return;
        
        // Simulate online count (5-50 users)
        const count = Math.floor(Math.random() * 45) + 5;
        onlineCount.textContent = count;
    }

    // Initialize navigation when screens change
    initNavigation();
    
    // Initialize theme switcher
    initThemeSwitcher();
    
    // Initialize chat system
    initChatSystem();
    
    // Initialize XP display with delay to ensure DOM is ready
    setTimeout(async () => {
        console.log('🚀 Initializing XP display from Airtable...');
        await loadUserXPFromAirtable();
        
        // Also load leaderboard data
        console.log('🚀 Initializing leaderboard...');
        await loadLeaderboard();
    }, 500);
    
    // Initialize quest click handlers - use event delegation
    document.addEventListener('click', function(e) {
        if (e.target.closest('.quest-item')) {
            const questItem = e.target.closest('.quest-item');
            const questId = questItem.getAttribute('data-quest-id');
            if (questId) {
                console.log('Quest clicked:', questId);
                
                // Check if quest is already completed
                const isCompleted = localStorage.getItem(`quest_${questId}`) === 'true';
                if (isCompleted) {
                    return; // Don't do anything if already completed
                }
                
                // Add loading state to the clicked item
                questItem.classList.add('loading');
                
                // Update status to show loading spinner
                const statusElement = questItem.querySelector('.quest-status');
                if (statusElement) {
                    statusElement.innerHTML = '<span class="loading-spinner"></span> LOADING...';
                }
                
                // Call handleQuestClick with quest item reference
                handleQuestClick(questId, questItem);
            }
        }
    });

    // Admin authentication system
    const ADMIN_PASSWORD = 'nullprotocol2024'; // Change this to your desired password
    
    function isAdminAuthenticated() {
        return sessionStorage.getItem('admin_authenticated') === 'true';
    }
    
    function authenticateAdmin(password) {
        if (password === ADMIN_PASSWORD) {
            sessionStorage.setItem('admin_authenticated', 'true');
            console.log('✅ Admin access granted');
            return true;
        } else {
            console.log('❌ Invalid admin password');
            return false;
        }
    }
    
    function logoutAdmin() {
        sessionStorage.removeItem('admin_authenticated');
        console.log('👋 Admin logged out');
    }
    
    // Protected admin functions
    function protectedFunction(functionName, func) {
        return function(...args) {
            if (!isAdminAuthenticated()) {
                const password = prompt('🔐 Enter admin password to access this function:');
                if (!authenticateAdmin(password)) {
                    console.log('❌ Access denied');
                    return;
                }
            }
            return func.apply(this, args);
        };
    }
    // Reset registration function (for testing) - PROTECTED
    function resetRegistration() {
        localStorage.removeItem('user_completed_registration');
        localStorage.removeItem('user_wallet_address');
        localStorage.removeItem('referral_source');
        localStorage.removeItem('my_referral_code');
        localStorage.removeItem('totalXP'); // Reset XP
        localStorage.removeItem('quest_follow_twitter');
        localStorage.removeItem('quest_retweet_post');
        localStorage.removeItem('quest_quote_post');
        localStorage.removeItem('quest_like_post');
        localStorage.removeItem('quest_invite_friend');
        // Clear all referral counts
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('ref_count_')) {
                localStorage.removeItem(key);
            }
        }
        console.log('Registration and XP reset - user will see screen 1 again');
        location.reload();
    }
    
    // Create protected version of addReferralToMe
    const protectedAddReferralToMe = protectedFunction('addReferralToMe', addReferralToMe);
    
    // Create protected version of resetRegistration
    const protectedResetRegistration = protectedFunction('resetRegistration', resetRegistration);

    // Test Discord button function
    function testDiscordButton() {
        console.log('Testing Discord button...');
        const buttons = document.querySelectorAll('.discord.coming-soon');
        console.log('Found Discord buttons:', buttons.length);
        
        if (buttons.length > 0) {
            console.log('Simulating click on first Discord button');
            buttons[0].click();
        } else {
            console.error('No Discord buttons found!');
        }
    }

    // Debug: Check if commands are available (REMOVED FOR PRODUCTION)
    // console.log('Available commands:', {
    //     resetRegistration: typeof window.resetRegistration,
    //     addReferralToMe: typeof window.addReferralToMe,
    //     authenticateAdmin: typeof window.authenticateAdmin,
    //     logoutAdmin: typeof window.logoutAdmin
    // });
    window.resetRegistration = protectedResetRegistration;
    window.authenticateAdmin = authenticateAdmin;
    window.logoutAdmin = logoutAdmin;
    window.addReferralToMe = protectedAddReferralToMe;
    window.clearMyReferrals = clearMyReferrals;
    window.getMyReferralCount = getMyReferralCount;
    window.testDiscordButton = testDiscordButton;
    window.updateTotalXPDisplay = updateTotalXPDisplay;
    window.loadUserXPFromAirtable = loadUserXPFromAirtable;
    window.forceUpdateXP = () => {
        console.log('🔄 Force updating XP display...');
        updateTotalXPDisplay();
    };
    window.forceLoadXPFromAirtable = async () => {
        console.log('🔄 Force loading XP from Airtable...');
        await loadUserXPFromAirtable();
    };
    window.completeQuest = completeQuest;
    window.loadQuests = loadQuests;
    window.handleQuestClick = handleQuestClick;
    window.completeInviteFriendQuest = completeInviteFriendQuest;

    // Console easter egg
    console.log(`
    ╔══════════════════════════════════════╗
    ║           NULL PROTOCOL               ║
    ║                                      ║
    ║  Welcome to the void.                ║
    ║  Where everything begins...          ║
    ║                                      ║
    ║  Protocol Status: ACTIVE             ║
    ║  Network: Solana                     ║
    ║  Version: 1.0.0                      ║
    ║                                      ║
    ║  Valid Codes: ${VALID_CODES.join(', ')} ║
    ║  Admin: Triple-click Yin-Yang        ║
    ║                                      ║
    ║  🔐 Admin Commands (Password Required): ║
    ║  Reset: resetRegistration()           ║
    ║  Add Ref: addReferralToMe()           ║
    ║  Auth: authenticateAdmin('password')   ║
    ║  Logout: logoutAdmin()                ║
    ║                                      ║
    ║  📊 Public Commands:                  ║
    ║  Clear Refs: clearMyReferrals()      ║
    ╚══════════════════════════════════════╝
    `);
});
require('dotenv').config();
const cron = require('node-cron');

// --- CONFIGURATION ---
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = 'whatsapp:+14155238886'; // Sandbox Number
const MY_NUMBER = 'whatsapp:+919817717588'; 
const NOTIFY_BEFORE_MINUTES = 5; 

// --- SCHEDULE DATA ---
const timetable = [
    // Mon
    { day: 1, time: '09:30', group: 'BE-CSE-5E', room: 'CVR311R' },
    { day: 1, time: '12:50', group: 'BE-CSE-5B', room: 'RJ309R' },
    { day: 1, time: '14:30', group: 'BE-CSE-5F', room: 'RJ309R' },
    // Tue
    { day: 2, time: '09:30', group: 'BE-CSE-5H', room: 'RJ309R' },
    { day: 2, time: '12:50', group: 'BE-CSE-5B', room: 'RJ309R' },
    { day: 2, time: '14:30', group: 'BE-CSE-5E', room: 'RJ110R' },
    // Wed
    { day: 3, time: '09:30', group: 'BE-CSE-5B', room: 'CVR311R' },
    { day: 3, time: '14:30', group: 'BE-CSE-5F', room: 'CVR308R' },
    // Thu
    { day: 4, time: '09:30', group: 'BE-CSE-5H', room: 'RJ309R' },
    { day: 4, time: '14:30', group: 'BE-CSE-5E', room: 'RJ309R' },
    // Fri
    { day: 5, time: '11:10', group: 'BE-CSE-5H', room: 'CVR203R' },
    { day: 5, time: '14:30', group: 'BE-CSE-5F', room: 'CVR309R' }
];

// --- HELPER: GET IST TIME ---
function getISTTime() {
    // Manually adjust UTC to IST (+5.5 hours)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 5.5));
}

// --- SEND LOGIC (Native Fetch) ---
const sendNotification = async (cls) => {
    const message = `🔔 *Class Reminder*\n\n` +
                    `📅 Group: *${cls.group}*\n` +
                    `🚪 Room: *${cls.room}*\n` +
                    `⏰ Time: ${cls.time}`;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;
    const body = new URLSearchParams({
        From: TWILIO_WHATSAPP_NUMBER,
        To: MY_NUMBER,
        Body: message
    });

    const auth = Buffer.from(ACCOUNT_SID + ":" + AUTH_TOKEN).toString('base64');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });

        if (response.ok) {
            console.log(`[SUCCESS] Sent to ${cls.group}`);
        } else {
            const err = await response.json();
            console.error(`[ERROR] Twilio API: ${err.message}`);
        }
    } catch (error) {
        console.error('[ERROR] Network error:', error.message);
    }
};

// --- CRON JOB ---
cron.schedule('* * * * *', () => {
    const now = getISTTime();
    const day = now.getDay(); 
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;

    console.log(`Checking: ${currentTimeStr} (Day: ${day})`);

    timetable.forEach(cls => {
        if (cls.day === day) {
            // Convert class time string to Minutes from midnight
            const [cHour, cMin] = cls.time.split(':').map(Number);
            const classTotalMins = (cHour * 60) + cMin;
            
            // Convert current time to Minutes from midnight
            const currentTotalMins = (now.getHours() * 60) + now.getMinutes();

            // Check difference
            const diff = classTotalMins - currentTotalMins;

            if (diff === NOTIFY_BEFORE_MINUTES) {
                sendNotification(cls);
            }
        }
    });
});

console.log('🚀 Native-Fetch Bot Started...');
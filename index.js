require('dotenv').config();
const cron = require('node-cron');
const express = require('express'); // Import Express

// --- CONFIGURATION ---
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = 'whatsapp:+14155238886'; 
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

function getISTTime() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 5.5));
}

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
        if (response.ok) console.log(`[SUCCESS] Message sent for ${cls.group}`);
        else console.error(`[ERROR] Twilio: ${(await response.json()).message}`);
    } catch (error) {
        console.error('[ERROR] Network error:', error.message);
    }
};

cron.schedule('* * * * *', () => {
    const now = getISTTime();
    const day = now.getDay();
    // Only run Mon(1) to Fri(5)
    if (day === 0 || day === 6) return; 

    console.log(`Checking schedule: ${now.toLocaleTimeString()} (Day: ${day})`);

    timetable.forEach(cls => {
        if (cls.day === day) {
            const [cHour, cMin] = cls.time.split(':').map(Number);
            const classTotalMins = (cHour * 60) + cMin;
            const currentTotalMins = (now.getHours() * 60) + now.getMinutes();
            const diff = classTotalMins - currentTotalMins;

            if (diff === NOTIFY_BEFORE_MINUTES) {
                sendNotification(cls);
            }
        }
    });
});


const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Class Notifier Bot is Active!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
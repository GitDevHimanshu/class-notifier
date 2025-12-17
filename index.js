require('dotenv').config();
const twilio = require('twilio');
const cron = require('node-cron');
const moment = require('moment-timezone');

// --- CONFIGURATION ---
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = 'whatsapp:+14155238886'; // Default Twilio Sandbox Number
const MY_NUMBER = 'whatsapp:+919817717588'; // Your Number
const NOTIFY_BEFORE_MINUTES = 10; // Notify 10 mins before class

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

// --- SCHEDULE DATA (From Image) ---
// Days: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
const timetable = [
    // MONDAY
    { day: 1, time: '09:30', group: 'BE-CSE-5E', room: 'CVR311R' },
    { day: 1, time: '12:50', group: 'BE-CSE-5B', room: 'RJ309R' },
    { day: 1, time: '14:30', group: 'BE-CSE-5F', room: 'RJ309R' }, // 2:30 PM is 14:30

    // TUESDAY
    { day: 2, time: '09:30', group: 'BE-CSE-5H', room: 'RJ309R' },
    { day: 2, time: '12:50', group: 'BE-CSE-5B', room: 'RJ309R' },
    { day: 2, time: '14:30', group: 'BE-CSE-5E', room: 'RJ110R' },

    // WEDNESDAY
    { day: 3, time: '09:30', group: 'BE-CSE-5B', room: 'CVR311R' },
    { day: 3, time: '14:30', group: 'BE-CSE-5F', room: 'CVR308R' },

    // THURSDAY
    { day: 4, time: '09:30', group: 'BE-CSE-5H', room: 'RJ309R' },
    { day: 4, time: '14:30', group: 'BE-CSE-5E', room: 'RJ309R' },

    // FRIDAY
    { day: 5, time: '11:10', group: 'BE-CSE-5H', room: 'CVR203R' },
    { day: 5, time: '14:30', group: 'BE-CSE-5F', room: 'CVR309R' }
];

// --- NOTIFICATION LOGIC ---
const sendNotification = async (cls) => {
    const message = `🔔 *Class Reminder*\n\n` +
                    `📅 Group: *${cls.group}*\n` +
                    `🚪 Room: *${cls.room}*\n` +
                    `⏰ Time: ${cls.time}`;

    try {
        await client.messages.create({
            body: message,
            from: TWILIO_WHATSAPP_NUMBER,
            to: MY_NUMBER
        });
        console.log(`[SUCCESS] Message sent for ${cls.group} at ${cls.time}`);
    } catch (error) {
        console.error('[ERROR] Failed to send WhatsApp message:', error.message);
    }
};

// --- CRON JOB ---
// Runs every minute to check if a class is starting soon
cron.schedule('* * * * *', () => {
    const now = moment().tz('Asia/Kolkata');
    const currentDay = now.day(); // 0=Sun, 1=Mon...

    console.log(`Checking schedule: ${now.format('HH:mm')} (Day: ${currentDay})`);

    timetable.forEach(cls => {
        if (cls.day === currentDay) {
            // Parse class time
            const [hours, minutes] = cls.time.split(':');
            const classTime = moment().tz('Asia/Kolkata').set({
                hour: parseInt(hours),
                minute: parseInt(minutes),
                second: 0
            });

            // Calculate notification time
            const notifyTime = moment(classTime).subtract(NOTIFY_BEFORE_MINUTES, 'minutes');

            // Check if current minute matches notification minute
            if (now.format('HH:mm') === notifyTime.format('HH:mm')) {
                sendNotification(cls);
            }
        }
    });
});

console.log('🚀 Class Notifier Bot Started (IST Timezone)...');
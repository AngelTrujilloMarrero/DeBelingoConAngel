function log(level, data) {
    const entry = { timestamp: new Date().toISOString(), ...data };
    const line = JSON.stringify(entry);
    if (level === 'error') console.error(line);
    else console.log(line);
}

export async function sendTelegramMessage(message) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        log('error', { action: 'sendTelegramMessage', success: false, error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID' });
        return { success: false, error: 'Missing credentials' };
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            log('error', { action: 'sendTelegramMessage', success: false, error: data.description });
            return { success: false, error: data.description };
        }

        log('info', { action: 'sendTelegramMessage', success: true });
        return { success: true, data };
    } catch (error) {
        log('error', { action: 'sendTelegramMessage', success: false, error: error.message });
        return { success: false, error: error.message };
    }
}

export async function sendTelegramPhoto(imageBuffer, caption) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        log('error', { action: 'sendTelegramPhoto', success: false, error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID' });
        return { success: false, error: 'Missing credentials' };
    }

    try {
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('photo', new Blob([imageBuffer], { type: 'image/png' }), 'cartel.png');
        if (caption) {
            formData.append('caption', caption);
            formData.append('parse_mode', 'HTML');
        }

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            log('error', { action: 'sendTelegramPhoto', success: false, error: data.description });
            return { success: false, error: data.description };
        }

        log('info', { action: 'sendTelegramPhoto', success: true });
        return { success: true, data };
    } catch (error) {
        log('error', { action: 'sendTelegramPhoto', success: false, error: error.message });
        return { success: false, error: error.message };
    }
}

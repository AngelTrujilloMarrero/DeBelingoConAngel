function log(level, data) {
    const entry = { timestamp: new Date().toISOString(), ...data };
    const line = JSON.stringify(entry);
    if (level === 'error') console.error(line);
    else console.log(line);
}

const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;

function splitMessage(message) {
    if (message.length <= TELEGRAM_MAX_MESSAGE_LENGTH) {
        return [message];
    }

    const chunks = [];
    let remaining = message;

    while (remaining.length > TELEGRAM_MAX_MESSAGE_LENGTH) {
        let cut = remaining.lastIndexOf('\n', TELEGRAM_MAX_MESSAGE_LENGTH);

        if (cut === -1 || cut < TELEGRAM_MAX_MESSAGE_LENGTH / 2) {
            cut = TELEGRAM_MAX_MESSAGE_LENGTH;
        }

        chunks.push(remaining.slice(0, cut));
        remaining = remaining.slice(cut).replace(/^\n+/, '');
    }

    if (remaining.length > 0) {
        chunks.push(remaining);
    }

    return chunks;
}

export async function sendTelegramMessage(message) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        log('error', { action: 'sendTelegramMessage', success: false, error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID' });
        return { success: false, error: 'Missing credentials' };
    }

    const chunks = splitMessage(message);
    const results = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        try {
            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: chunk,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                log('error', { action: 'sendTelegramMessage', success: false, error: data.description, chunk: i + 1, totalChunks: chunks.length });
                return { success: false, error: data.description, sentChunks: results.length, totalChunks: chunks.length };
            }

            results.push(data);
        } catch (error) {
            log('error', { action: 'sendTelegramMessage', success: false, error: error.message, chunk: i + 1, totalChunks: chunks.length });
            return { success: false, error: error.message, sentChunks: results.length, totalChunks: chunks.length };
        }
    }

    log('info', { action: 'sendTelegramMessage', success: true, chunks: chunks.length });
    return { success: true, data: results, chunks: chunks.length };
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

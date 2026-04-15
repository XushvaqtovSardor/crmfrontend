export function getApiErrorMessage(error, fallback = 'Xatolik yuz berdi') {
    const payload = error?.response?.data;
    const responseMessage = payload?.message;
    if (Array.isArray(responseMessage) && responseMessage.length) {
        return responseMessage.join(', ');
    }
    if (typeof responseMessage === 'string' && responseMessage.trim()) {
        return responseMessage;
    }
    if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
        const flattened = payload.errors
            .map((entry) => {
            const field = entry?.field ? `${entry.field}: ` : '';
            const errors = Array.isArray(entry?.errors) ? entry.errors.join(', ') : '';
            return `${field}${errors}`.trim();
        })
            .filter(Boolean);
        if (flattened.length) {
            return flattened.join(' | ');
        }
    }
    if (typeof error?.message === 'string' && error.message.trim()) {
        return error.message;
    }
    return fallback;
}

export function getApiErrorMessage(error, fallback = 'Xatolik yuz berdi') {
    // API may return validation errors as array or message string.
    const responseMessage = error?.response?.data?.message;

    if (Array.isArray(responseMessage) && responseMessage.length) {
        return responseMessage.join(', ');
    }

    if (typeof responseMessage === 'string' && responseMessage.trim()) {
        return responseMessage;
    }

    // Fallback to transport/runtime message when server message is unavailable.
    if (typeof error?.message === 'string' && error.message.trim()) {
        return error.message;
    }

    // Final safety fallback for unknown failure shape.
    return fallback;
}
export const WEEKDAY_INDEX = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 0,
};

export const WEEKDAY_LABEL = {
    MONDAY: 'Du',
    TUESDAY: 'Se',
    WEDNESDAY: 'Cho',
    THURSDAY: 'Pa',
    FRIDAY: 'Ju',
    SATURDAY: 'Sha',
    SUNDAY: 'Ya',
};

function safeNumber(value) {
    const next = Number(value);
    return Number.isFinite(next) ? next : 0;
}

export function computeStudentXP(progress) {
    const averageScore = safeNumber(progress?.averageScore);
    const submissionCount = safeNumber(progress?.submissionCount);
    const onTime = safeNumber(progress?.onTime);
    const late = safeNumber(progress?.late);
    const gradingApproved = safeNumber(progress?.grading?.approved);

    return Math.max(
        0,
        Math.round(averageScore * 6) + submissionCount * 12 + onTime * 10 + late * 4 + gradingApproved * 8,
    );
}

export function computeStudentCoins(progress) {
    const xp = computeStudentXP(progress);
    const rejected = safeNumber(progress?.grading?.rejected);
    return Math.max(0, Math.round(xp * 1.5) - rejected * 35);
}

export function computeStudentLevel(xpValue) {
    const xp = safeNumber(xpValue);
    const levelSize = 500;
    const level = Math.max(1, Math.floor(xp / levelSize) + 1);
    const levelStart = (level - 1) * levelSize;
    const levelEnd = level * levelSize;
    const inLevel = xp - levelStart;
    const progressPercent = Math.max(0, Math.min(100, Math.round((inLevel / levelSize) * 100)));

    return {
        level,
        inLevel,
        levelStart,
        levelEnd,
        progressPercent,
    };
}

export function formatTimeRange(startTime, durationMinutes = 90) {
    if (!startTime || typeof startTime !== 'string') {
        return '--:-- - --:--';
    }

    const [hourText, minuteText] = String(startTime).split(':');
    const hour = Number(hourText);
    const minute = Number(minuteText);

    if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
        return '--:-- - --:--';
    }

    const totalStart = hour * 60 + minute;
    const totalEnd = totalStart + Number(durationMinutes || 90);

    const startHour = String(Math.floor(totalStart / 60) % 24).padStart(2, '0');
    const startMinute = String(totalStart % 60).padStart(2, '0');
    const endHour = String(Math.floor(totalEnd / 60) % 24).padStart(2, '0');
    const endMinute = String(totalEnd % 60).padStart(2, '0');

    return `${startHour}:${startMinute} - ${endHour}:${endMinute}`;
}

export function toDateKey(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

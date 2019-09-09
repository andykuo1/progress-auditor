export const ONE_DAYTIME = 86400000;

export function compareDates(a, b)
{
    return a.getTime() - b.getTime();
}

export function isWithinDates(date, fromDate, toDate)
{
    return compareDates(date, fromDate) >= 0 && compareDates(date, toDate) <= 0;
}

export function getDaysBetween(fromDate, toDate)
{
    return Math.floor(Math.abs(compareDates(toDate, fromDate)) / ONE_DAYTIME);
}

/**
 * Gets the date of the Sunday that has most recently passed.
 * @param {Date} date The date to calculate past Sunday from.
 * @param {Number} offset The number of days to offset from the date before calculations.
 * @returns {Date} The calculated Sunday date.
 */
export function getPastSunday(date, offset = 0)
{
    const result = new Date(date.getTime());
    result.setUTCDate(result.getUTCDate() - result.getUTCDay() + offset);
    return result;
}

/**
 * Gets the date of the Sunday that is coming.
 * @param {Date} date The date to calculate next Sunday from.
 * @param {Number} offset The number of days to offset from the date before calculations.
 * @returns {Date} The calculated Sunday date.
 */
export function getNextSunday(date, offset = 0)
{
    const result = new Date(date.getTime());
    result.setUTCDate(result.getUTCDate() - result.getUTCDay() + 7 + offset);
    return result;
}

/**
 * Gets the effective week's date of the Sunday that is coming.
 * @param {Date} date The date to calculate the next Sunday from.
 * @param {Number} effectiveThreshold The min number of days in an effective week.
 * @returns {Date} The calculated effective week's Sunday date. At most, this is 2 weeks away.
 */
export function getNextEffectiveSunday(date, effectiveThreshold = 0)
{
    // Whether to count the current week as the effective week, or use the next week instead.
    if (date.getUTCDay() > effectiveThreshold)
    {
        return getNextSunday(new Date(date.getTime() + 7 * ONE_DAYTIME));
    }
    else
    {
        return getNextSunday(date);
    }
}

export function offsetDate(date, offset = 0)
{
    const result = new Date(date.getTime());
    if (offset) result.setUTCDate(result.getUTCDate() + offset);
    return result;
}

/** This should is the NON-OFFICIAL way to parse dates. */
export function parseAmericanDate(dateString, offset = 0)
{
    // Allow for both:
    // MM/DD/YYYY
    // MM-DD-YYYY
    const monthIndex = 0;
    let dayIndex, yearIndex;
    dayIndex = dateString.indexOf('/', monthIndex);
    if (dayIndex < 0)
    {
        dayIndex = dateString.indexOf('-', monthIndex);
        yearIndex = dateString.indexOf('-', dayIndex + 1);
    }
    else
    {
        yearIndex = dateString.indexOf('/', dayIndex + 1);
    }

    let year, month, day, hour, minute, second;

    if (dayIndex < 0 || monthIndex < 0 || yearIndex < 0)
    {
        throw new Error('Invalid date format - Expected MM/DD/YYYY');
    }
    
    year = Number(dateString.substring(yearIndex + 1));
    month = Number(dateString.substring(monthIndex, dayIndex));
    day = Number(dateString.substring(dayIndex + 1, yearIndex));
    hour = 0;
    minute = 0;
    second = 0;

    if (year === NaN || month === NaN || day === NaN || hour === NaN || minute === NaN || second === NaN)
    {
        throw new Error('Invalid date format - Expected MM/DD/YYYY');
    }

    const result = new Date(offset);
    result.setUTCFullYear(year);
    result.setUTCMonth(month - 1);
    result.setUTCDate(day);

    return result;
}

/** This should be the OFFICIAL way to parse dates. */
export function parse(dateString)
{
    const yearIndex = 0;
    const monthIndex = dateString.indexOf('-', yearIndex);
    const dayIndex = dateString.indexOf('-', monthIndex + 1);

    // Allow for both:
    // YYYY-MM-DD HH:MM:SS
    // YYYY-MM-DD-HH:MM:SS
    
    let hourIndex, minuteIndex, secondIndex;
    hourIndex = dateString.indexOf('-', dayIndex + 1);
    if (hourIndex < 0)
    {
        hourIndex = dateString.indexOf(' ', dayIndex + 1);
    }
    minuteIndex = dateString.indexOf(':', hourIndex + 1);
    secondIndex = dateString.indexOf(':', minuteIndex + 1);

    let year, month, day, hour, minute, second;

    if (dayIndex < 0 || monthIndex < 0 || yearIndex < 0)
    {
        throw new Error('Invalid date format - Expected YYYY-MM-DD-HH:MM:SS');
    }

    if (hourIndex < 0 || minuteIndex < 0 || secondIndex < 0)
    {
        hourIndex = dateString.length;
        hour = 0;
        minute = 0;
        second = 0;
    }

    year = Number(dateString.substring(yearIndex, monthIndex));
    month = Number(dateString.substring(monthIndex + 1, dayIndex));
    day = Number(dateString.substring(dayIndex + 1, hourIndex));

    if (year === NaN || month === NaN || day === NaN || hour === NaN || minute === NaN || second === NaN)
    {
        throw new Error('Invalid date format - Expected YYYY-MM-DD-HH:MM:SS');
    }
    
    const result = new Date(0);
    result.setUTCFullYear(year);
    result.setUTCMonth(month - 1);
    result.setUTCDate(day);
    result.setUTCHours(hour);
    result.setUTCMinutes(minute);
    result.setUTCSeconds(second);
    return result;
}

/** This should be the OFFICIAL way to stringify dates. */
export function stringify(date, withTime = true)
{
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds();
    const result = String(year).padStart(4, '0') + '-'
        + String(month).padStart(2, '0') + '-'
        + String(day).padStart(2, '0')
        + (withTime
            ? '-'
            + String(hour).padStart(2, '0') + ':'
            + String(minute).padStart(2, '0') + ':'
            + String(second).padStart(2, '0')
            : '');
    return result;
}
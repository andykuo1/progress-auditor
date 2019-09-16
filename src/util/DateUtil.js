export const ONE_DAYTIME = 86400000;
export const DAYS_IN_WEEK = 7;

/**
 * Returns a negative number if a is less than b, a positive
 * number if a is greature than b, and 0 if they are equal.
 * This only compares the date; time is not considered.
 * @param {Date} a The left hand side date.
 * @param {Date} b The right hand side date.
 * @returns {Number} A number representing how a compares to b.
 */
export function compareDates(a, b)
{
    const dayA = new Date(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate()).getTime();
    const dayB = new Date(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()).getTime();
    return Math.ceil((dayA - dayB) / ONE_DAYTIME);
}

/**
 * Returns a negative number if a is less than b, a positive
 * number if a is greature than b, and 0 if they are equal.
 * This compares BOTH date and time.
 * @param {Date} a The left hand side date.
 * @param {Date} b The right hand side date.
 * @returns {Number} A number representing how a compares to b.
 */
export function compareDatesWithTime(a, b)
{
    return a.getTime() - b.getTime();
}

export function isWithinDates(date, fromDate, toDate)
{
    const dayDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const dayFrom = new Date(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate());
    const dayTo = new Date(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate());
    return compareDatesWithTime(dayDate, dayFrom) >= 0 && compareDatesWithTime(dayDate, dayTo) <= 0;
}

export function getDaysUntil(fromDate, toDate)
{
    const dayFrom = new Date(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate());
    const dayTo = new Date(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate());
    return Math.floor(Math.abs(dayTo.getTime() - dayFrom.getTime()) / ONE_DAYTIME);
}

export function copyDate(date)
{
    return new Date(date.getTime());
}

/**
 * If the date is between Sunday and Tuesday, get past Sunday.
 * If the date is between Thursday and Saturday, get next Sunday.
 * If the date is Wednesday, it depends on floorWednesday.
 * If floorWednesday is true, then it would choose past,
 * otherwise, it would choose next.
 * @param {Date} date The date to get nearest Sunday for.
 */
export function getNearestSunday(date, floorWednesday = true)
{
    const day = date.getUTCDay();
    if (day < 3 || (floorWednesday && day === 3))
    {
        return getPastSunday(date);
    }
    else
    {
        return getNextSunday(date);
    }
}

/**
 * Gets the date of the Sunday of this week. Usually, this is the one most
 * recently passed, or today, if today is Sunday.
 * @param {Date} date The date to calculate past Sunday from.
 * @param {Number} offset The number of days to offset from the date before calculations.
 * @returns {Date} The calculated Sunday date.
 */
export function getPastSunday(date, offset = 0)
{
    const result = copyDate(date);
    result.setUTCDate(result.getUTCDate() - result.getUTCDay() + offset);
    return result;
}

/**
 * Gets the date of the Sunday that has most recently passed. If today is Sunday, it will get the one before.
 * @param {Date} date The date to calculate past Sunday from.
 * @param {Number} offset The number of days to offset from the date before calculations.
 * @returns {Date} The calculated Sunday date.
 */
export function getPrevSunday(date, offset = 0)
{
    const result = copyDate(date);
    const day = result.getUTCDay();
    if (day === 0)
    {
        result.setUTCDate(result.getUTCDate() - DAYS_IN_WEEK + offset);
    }
    else
    {
        result.setUTCDate(result.getUTCDate() - result.getUTCDay() + offset);
    }
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
    result.setUTCDate(result.getUTCDate() - result.getUTCDay() + DAYS_IN_WEEK + offset);
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
        return getNextSunday(new Date(date.getTime() + DAYS_IN_WEEK * ONE_DAYTIME));
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
        throw new Error('Invalid date format - Expected YYYY-MM-DD-hh:mm:ss');
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
        throw new Error('Invalid date format - Expected YYYY-MM-DD-hh:mm:ss');
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
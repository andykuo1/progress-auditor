const ONE_DAYTIME = 86400000;

function compareDates(a, b)
{
    return a.getTime() - b.getTime();
}

function isWithinDates(date, fromDate, toDate)
{
    return compareDates(date, fromDate) >= 0 && compareDates(date, toDate) <= 0;
}

function getDaysBetween(fromDate, toDate)
{
    return Math.floor(compareDates(toDate, fromDate) / ONE_DAYTIME);
}

/**
 * Gets the date of the Sunday that has most recently passed.
 * @param {Date} date The date to calculate past Sunday from.
 * @param {Number} offset The number of days to offset from the date before calculations.
 * @returns {Date} The calculated Sunday date.
 */
function getPastSunday(date, offset=0)
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
function getNextSunday(date, offset=0)
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
function getNextEffectiveSunday(date, effectiveThreshold = 0)
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

function offsetDate(date, offset=0)
{
    const result = new Date(date.getTime());
    if (offset) result.setUTCDate(result.getUTCDate() + offset);
    return result;
}

module.exports = {
    ONE_DAYTIME,
    compareDates,
    isWithinDates,
    getDaysBetween,
    getPastSunday,
    getNextSunday,
    getNextEffectiveSunday,
    offsetDate,
};
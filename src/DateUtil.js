function compareDates(a, b)
{
    return a.getTime() - b.getTime();
}

function isWithinDates(date, fromDate, toDate)
{
    return compareDates(date, fromDate) >= 0 && compareDates(date, toDate) <= 0;
}

/**
 * Gets the date of the Sunday that has most recently passed.
 * @param {Date} date The date to calculate past Sunday from.
 * @param {Number} offset The number of days to offset from the date before calculations.
 * @returns {Date} The calculated Sunday date.
 */
function getPastSunday(date, offset=0)
{
    const result = new Date(date);
    result.setDate(result.getDate() - result.getDay() + offset);
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
    const result = new Date(date);
    result.setDate(result.getDate() - result.getDay() + 7 + offset);
    return result;
}

function offsetDate(date, offset=0)
{
    const result = new Date(date);
    if (offset) result.setDate(result.getDate() + offset);
    return result;
}

module.exports = {
    compareDates,
    isWithinDates,
    getPastSunday,
    getNextSunday,
    offsetDate,
};
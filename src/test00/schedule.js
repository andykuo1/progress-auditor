const ONE_DAYTIME = 86400000;

/**
 * Calculates the number of days starting from the
 * passed-in date to the other.
 * @param {Date} fromDate   The date from.
 * @param {Date} toDate     The date to.
 * @returns {Number}        The number of days between the passed-in dates.
 *                          Can assume to be a whole number.
 */
function getNumberOfDaysBetween(fromDate, toDate)
{
    return Math.round(Math.abs((fromDate.getTime() - toDate.getTime()) / (ONE_DAYTIME)));
}

/**
 * Calculates the number of available slip days for the
 * user based on the duration of their schedule.
 * @param {Object} schedule The schedule for the user.
 * @returns {Number} The number of slip days available.
 */
function calculateNumberOfSlipDays(schedule)
{
    return 3 * schedule.weeks;
}

function createSchedule(startDate, endDate, opts={})
{
    const threshold = opts.threshold || 0;

    const firstSunday = getNextSunday(startDate, threshold);

    // Add the remaining week due dates. This includes the last
    // week (even if incomplete, they still need to turn it in)...
    const endTime = endDate.getTime() - ONE_DAYTIME * threshold;
    const pastSunday = getPastSunday(startDate, threshold);
    const lastSunday = new Date(pastSunday);
    // As long as we have started this week (even if it ends in-progress)
    // calculate last Sunday...
    let sundayCount = 0;
    while(lastSunday.getTime() < endTime)
    {
        // Go to next Sunday...
        lastSunday.setDate(lastSunday.getDate() + 7);
        ++sundayCount;
    }

    return {
        startDate,
        endDate,
        // Number of weeks within the schedule (by counting number of Sundays).
        weeks: sundayCount,
        // The Sunday belonging to the week of the start date.
        // This will likely not be within the schedule unless
        // the start date is a Sunday.
        startSunday: pastSunday,
        // The Sunday after the start date. May be of the same week as 
        // the start date if the schedule started on a Sunday.
        firstSunday,
        // The last Sunday of the week of the end date. Usually
        // This will be the last Sunday within the schedule.
        lastSunday,
    };
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
    result.setDate(result.getDate() + offset);
    result.setDate(result.getDate() - result.getDay());
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
    result.setDate(result.getDate() + offset);
    result.setDate(result.getDate() - result.getDay() + 7);
    return result;
}

module.exports = {
    calculateNumberOfSlipDays,
    createSchedule,
    getPastSunday,
    getNextSunday,
};
/**
 * Generates an array of due dates by the week based on the students time frame.
 * @param {Date} startDate The date the student starts the program.
 * @param {Date} endDate The date the student ends the program.
 * @param {Object} opts Any additional options.
 * @returns {Array<Date>} An array of due dates ordered by week.
 * However, it does NOT order by time, since week 0 could be due
 * after week 1.
 */
function generateDueDates(startDate, endDate, opts)
{
    const result = [];
    const firstSunday = getPastSunday(startDate);

    // Add week 0 deadline - this does not follow the formats of
    // the other due dates. Instead, it is exactly 1 week after
    // the start date. This also means it can overlap with week 1.
    // Therefore, the resulting array may not be ordered by time.
    const week0 = new Date(startDate);
    week0.setDate(week0.getDate() + 7);
    result.push(week0);

    // Add the remaining week due dates. This includes the last
    // week (even if incomplete, they still need to turn it in)...
    const endTime = endDate.getTime();
    let pastSunday = firstSunday;
    // As long as we have started this week (even if it ends in-progress)...
    while(pastSunday.getTime() < endTime)
    {
        // Go to next Sunday...
        pastSunday.setDate(pastSunday.getDate() + 7);
        // Add the next week to result...
        result.push(new Date(pastSunday));
    }

    return result;
}

/**
 * Gets the date of the Sunday that has most recently passed.
 * @param {Date} date 
 * @returns {Date} The calculated Sunday date.
 */
function getPastSunday(date)
{
    const result = new Date(date);
    result.setDate(date.getDate() - date.getDay());
    return result;
}

module.exports = {
    getPastSunday,
    generateDueDates
};
import * as DateUtil from './DateUtil.js';

const DEFAULT_VALIDATOR = (date) => {
    return date;
};

export function createDateRange(fromDate, toDate)
{
    return [DateUtil.copyDate(fromDate), DateUtil.copyDate(toDate)];
}

export function copyDateRange(dateRange)
{
    return [DateUtil.copyDate(dateRange[0]), DateUtil.copyDate(dateRange[1])];
}

export function sortDateRanges(dateRanges)
{
    dateRanges.sort((a, b) => a[0].getTime() - b[0].getTime());
}

/**
 * Merge date ranges that overlap. This assumes the ranges are in order of start date.
 */
export function mergeDateRangesWithOverlap(dateRanges)
{
    let prevDateRange = null;
    for(let i = 0; i < dateRanges.length; ++i)
    {
        let dateRange = dateRanges[i];
        if (!prevDateRange)
        {
            prevDateRange = dateRange;
        }
        else if (DateUtil.compareDates(prevDateRange[1], dateRange[0]) >= 0)
        {
            // Merge the two ranges...
            prevDateRange[1].setTime(dateRange[1].getTime());
            // Delete the smaller one...
            dateRanges.splice(i, 1);
            // Decrement back one due to removal...
            --i;
        }
        else
        {
            // The ranges don't overlap. It's all good...
        }
    }
}

/**
 * Expand or remove date ranges into effective work weeks.
 * A week is effective if it occupies at least 3 of the work days,
 * not including Sunday or Saturday.
 */
export function convertDateRangesToEffectiveWorkWeeks(dateRanges, dst = [])
{
    for(const dateRange of dateRanges)
    {
        // If the range is too small, it can never possibly occupy 3 or more work days...
        if (DateUtil.getDaysBetween(dateRange[0], dateRange[1]) < 3)
        {
            continue;
        }
        else
        {
            // Mon, Tues, Wed, will create effective work week.
            const startDate = DateUtil.getNearestSunday(dateRange[0], true);
            // Wed, Thurs, Fri, will create effective work week.
            const endDate = DateUtil.getNearestSunday(dateRange[1], false);
            // Neither start nor end date could become an effective week...
            if (DateUtil.compareDates(startDate, endDate) === 0)
            {
                continue;
            }
            else
            {
                // The end date should always be a Saturday.
                dst.push([startDate, DateUtil.offsetDate(endDate, -1)]);
            }
        }
    }

    mergeDateRangesWithOverlap(dst);

    return dst;
}

/** Assumes date ranges do not overlap and are sorted. */
export function createOffsetDelayValidator(invalidDateRanges = [])
{
    return function OffsetDelayValidator(date)
    {
        let result = DateUtil.copyDate(date);
        for(const dateRange of invalidDateRanges)
        {
            // Since date ranges are sorted, all ranges afterwards are all greater than the date time.
            // Therefore no collision is possible.
            if (result.getTime() < dateRange[0].getTime()) break;

            if (DateUtil.isWithinDates(result, dateRange[0], dateRange[1]))
            {
                const offset = DateUtil.getDaysBetween(dateRange[0], result) + 1;
                result = DateUtil.offsetDate(dateRange[1], offset);
            }
        }
        return result;
    };
}

/**
 * Generate a valid date.
 * @param {Date} date The date to generate.
 * @param {Function} [validator] The validator to get a valid date
 * given another date. These effectively allows vacations to be implemented.
 * @returns {Date} A valid date.
 */
export function generateDate(date, validator = DEFAULT_VALIDATOR)
{
    return validator(date);
}

/**
 * Generate valid weekly dates.
 * @param {Date} startDate The date to start on or after.
 * @param {Date} endDate The date to end on or before.
 * @param {Function} [validator] The validator to get a valid date
 * given another date. These effectively allows vacations to be implemented.
 * @returns {Array<Date>} An array of valid dates for each week on the day
 * between the start and end dates.
 */
export function generateWeeklySunday(startDate, endDate, validator = DEFAULT_VALIDATOR)
{
    const result = [];

    // Get the following Sunday of the effective week...
    const effectiveStartSunday = DateUtil.offsetDate(DateUtil.getNearestSunday(startDate, true), DateUtil.DAYS_IN_WEEK);

    // Make sure its a valid date...
    let date = validator(effectiveStartSunday);
    while(DateUtil.compareDates(date, endDate) <= 0)
    {
        result.push(date);

        // Move to the next Sunday, but make sure it's still valid...
        date = validator(DateUtil.getNextSunday(date));
    }

    return result;
}
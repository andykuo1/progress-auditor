import { ONE_DAYTIME, getDaysBetween, getPastSunday, getNextEffectiveSunday } from '../util/DateUtil.js';

function computeDatesWithPadding(padding, startDate, endDate)
{
    switch(padding)
    {
        case 'week':
            const pastSunday = getPastSunday(startDate);
            const nextSunday = getNextEffectiveSunday(endDate, 3);
            return [pastSunday, nextSunday];
        default:
            const days = Number(padding);
            if (Number.isNaN(days))
            {
                throw new Error(`Unknown padding type '${padding}'.`);
            }
            else
            {
                return [new Date(startDate.getTime() - ONE_DAYTIME * days), new Date(endDate.getTime() + ONE_DAYTIME * days)];
            }
    }
}

/**
 * Creates a vacation object.
 * @param {*} vacationID The globally unique vacation id.
 * @param {*} userID The id for the user of the vacation.
 * @param {Date} startDate The date the vacation starts from.
 * @param {Date} endDate The date the vacation ends on.
 * @param {String|Number} padding The padding around the vacation days.
 * @param {Object} attributes Any additional information about the vacation.
 * @returns {Object} The vacation data object.
 */
export function createVacation(vacationID, userID, startDate, endDate, padding, attributes)
{
    const [newStartDate, newEndDate] = computeDatesWithPadding(padding, startDate, endDate);
    return {
        id: vacationID,
        userID,
        // Dates defined by user. Use this for user-sensitive calculations.
        userStartDate: startDate,
        userEndDate: endDate,
        // Dates with padding accounted for. Use this when determining active work days.
        effectiveStartDate: newStartDate,
        effectiveEndDate: newEndDate,
        padding: padding,
        duration: getDaysBetween(startDate, endDate),
        attributes
    };
}

import * as Schedule from './Schedule.js';

/**
 * Creates a user object.
 * @param {*} userID The globally unique user id.
 * @param {String} ownerKey The unique key, or keys, that associates submissions to users. Can be an array if associated with multiple.
 * @param {String} userName The user's name.
 * @param {Date} startDate The start date for the user.
 * @param {Date} endDate The end date for the user.
 * @param {Object} opts Additional options to initialize the user.
 * @param {Number} opts.threshold The day threshold for week boundaries.
 * @param {Object} attributes Any additional information about the user.
 * @returns {Object} The user data object.
 */
export function createUser(userID, ownerKey, userName, startDate, endDate, opts, attributes)
{
    const schedule = Schedule.createSchedule(startDate, endDate, opts);
    return {
        id: userID,
        ownerKey,
        name: userName,
        schedule,
        attributes
    };
}

/**
 * Creates a vacation object.
 * @param {*} vacationID The globally unique vacation id.
 * @param {*} ownerKey The key for the owner of the vacation.
 * @param {Date} startDate The date the vacation starts from.
 * @param {Date} endDate The date the vacation ends on.
 * @param {String|Number} padding The padding around the vacation days.
 * @param {Object} attributes Any additional information about the vacation.
 * @returns {Object} The vacation data object.
 */
function createVacation(vacationID, ownerKey, startDate, endDate, padding, attributes)
{
    return {
        id: vacationID,
        ownerKey,
        startDate: startDate,
        endDate: endDate,
        padding: padding,
        attributes
    };
}

module.exports = {
    createVacation
};
/**
 * @param {Date} dueDate The date the assignment is due.
 * @param {Object} attributes Any additional attributes for the assignment.
 */
function createAssignment(dueDate, attributes={})
{
    return {
        dueDate,
        attributes
    };
}

module.exports = {
    createAssignment
};
/**
 * @param {String} assignmentID The id for the assignment.
 * @param {Date} dueDate The date the assignment is due.
 * @param {Object} attributes Any additional attributes for the assignment.
 */
function createAssignment(assignmentID, dueDate, attributes={})
{
    return {
        id: assignmentID,
        dueDate,
        attributes
    };
}

module.exports = {
    createAssignment
};
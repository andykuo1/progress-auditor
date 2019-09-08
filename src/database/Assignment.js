/**
 * @param {Date} dueDate The date the assignment is due.
 * @param {Object} attributes Any additional attributes for the assignment.
 */
export function createAssignment(id, dueDate, attributes={})
{
    return {
        id,
        dueDate,
        attributes
    };
}

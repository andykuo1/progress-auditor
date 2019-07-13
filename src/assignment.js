class Assignment
{
    static createDueAssignment(assignment, dueDate, active=true)
    {
        return {
            dueDate,
            active
        };
    }

    constructor(name)
    {
        this.name = name;
    }

    getDueAssignments(userID, userSchedule, otherAssignments)
    {
        return {};
    }

    hasAssignmentID(assignmentID)
    {
        return this.name === assignmentID;
    }

    getAssignmentID(headerContent, bodyContent = '')
    {
        return this.name;
    }
}

module.exports = Assignment;
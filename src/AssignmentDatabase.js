const ASSIGNMENT_KEY = 'assignment';

function setupDatabase(db)
{
    db[ASSIGNMENT_KEY] = {
        class: new Map(),
        instance: new Map()
    };
}

function registerAssignmentClass(db, assignmentClass)
{
    db[ASSIGNMENT_KEY].class.set(assignmentClass.name, assignmentClass);
    return assignmentClass;
}

function assignAssignment(db, assignmentClass, userID, userSchedule)
{
    const instances = db[ASSIGNMENT_KEY].instance;
    let assigned = instances.get(userID);
    if (!assigned) instances.set(userID, assigned = {});

    const result = assignmentClass.getDueAssignments(userID, userSchedule, assigned);
    for(const key of Object.keys(result))
    {
        if (key in assigned)
        {
            db.throwError(ASSIGNMENT_KEY, 'Found duplicate assignment for user', userID);
            continue;
        }
        else
        {
            assigned[key] = result[key];
        }
    }
}

module.exports = {
    ASSIGNMENT_KEY,
    setupDatabase,
    registerAssignmentClass,
    assignAssignment
};
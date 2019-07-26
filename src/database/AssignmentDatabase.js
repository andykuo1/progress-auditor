const Assignment = require('./Assignment.js');

const ASSIGNMENT_KEY = 'assignment';
const OUTPUT_LOG = 'db.assignment.log';

function setupDatabase(db)
{
    if (!(ASSIGNMENT_KEY in db))
    {
        db[ASSIGNMENT_KEY] = new Map();
    }
    return db;
}

function addAssignment(db, userID, assignmentID, dueDate, attributes={})
{
    const assignmentMapping = db[ASSIGNMENT_KEY];

    let ownedAssignments;
    if (assignmentMapping.has(userID))
    {
        ownedAssignments = assignmentMapping.get(userID);
    }
    else
    {
        assignmentMapping.set(userID, ownedAssignments = {});
    }

    if (assignmentID in ownedAssignments)
    {
        db.throwError(ASSIGNMENT_KEY, 'Found duplicate assignment for user', userID);
        return null;
    }
    else
    {
        const assignment = Assignment.createAssignment(new Date(dueDate), attributes);
        ownedAssignments[assignmentID] = assignment;
        return assignment;
    }
}

function getAssignmentByID(db, userID, assignmentID)
{
    return db[ASSIGNMENT_KEY].get(userID)[assignmentID];
}

function getAssignmentsByUser(db, userID)
{
    return db[ASSIGNMENT_KEY].get(userID);
}

function outputLog(db, outputDir = '.')
{
    const assignmentMapping = db[ASSIGNMENT_KEY];
    const result = {};
    for(const [key, value] of assignmentMapping.entries())
    {
        result[key] = value;
    }
    
    const header = `${'# '.repeat(20)}\n# Assignments\n# Size: ${assignmentMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    require('fs').writeFileSync(require('path').resolve(outputDir, OUTPUT_LOG), log);
}

module.exports = {
    ASSIGNMENT_KEY,
    setupDatabase,
    addAssignment,
    getAssignmentByID,
    getAssignmentsByUser,
    outputLog,
};
const { AssignmentGenerator } = Library;

async function assign(db, name, userID, userSchedule, opts={})
{
    AssignmentGenerator.assign(db, userID, name, new Date(userSchedule.lastSunday.getTime()));
}

module.exports = {
    assign
};

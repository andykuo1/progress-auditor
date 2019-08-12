const { AssignmentGenerator, UserDatabase } = Library;

async function assign(db, name, userID, userSchedule, opts={})
{
    AssignmentGenerator.assignWeekly(db, userID, name, userSchedule.firstSunday, userSchedule.lastSunday);
}

module.exports = {
    assign
};

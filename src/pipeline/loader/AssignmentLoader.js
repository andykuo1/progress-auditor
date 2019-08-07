const UserDatabase = require('../../database/UserDatabase.js');
const ScheduleDatabase = require('../../database/ScheduleDatabase.js');
const { offsetDate } = require('../../util/DateUtil.js');
const AssignmentGenerator = require('../../database/AssignmentGenerator.js');

// TODO: this is still hard-coded...
async function loadAssignments(db, config)
{
    // Create assignments...
    
    // NOTE: Custom assignment handlers...
    for(const userID of UserDatabase.getUsers(db))
    {
        const schedule = ScheduleDatabase.getScheduleByUserID(db, userID);
        AssignmentGenerator.assign(db, userID, 'intro', offsetDate(schedule.startDate, 7));
        AssignmentGenerator.assignWeekly(db, userID, 'week', schedule.firstSunday, schedule.lastSunday);
        AssignmentGenerator.assign(db, userID, 'last', new Date(schedule.lastSunday.getTime()));
    }
}

module.exports = {
    loadAssignments
};
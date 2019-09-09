import * as AssignmentGenerator from './util/AssignmentGenerator.js';

export async function assign(db, name, userID, userSchedule, opts={})
{
    AssignmentGenerator.assignWeekly(db, userID, name, userSchedule.firstSunday, userSchedule.lastSunday);
}

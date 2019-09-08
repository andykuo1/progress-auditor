import * as AssignmentGenerator from '../../app/AssignmentGenerator.js';

export async function assign(db, name, userID, userSchedule, opts={})
{
    AssignmentGenerator.assign(db, userID, name, new Date(userSchedule.lastSunday.getTime()));
}

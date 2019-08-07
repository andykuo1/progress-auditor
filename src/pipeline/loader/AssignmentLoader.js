import * as UserDatabase from '../../database/UserDatabase.js';
import * as ScheduleDatabase from '../../database/ScheduleDatabase.js';
import { offsetDate } from '../../util/DateUtil.js';
import * as AssignmentGenerator from '../../database/AssignmentGenerator.js';

// TODO: this is still hard-coded...
export async function loadAssignments(db, config)
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

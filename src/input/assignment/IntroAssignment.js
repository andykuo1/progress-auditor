import * as AssignmentGenerator from '../../app/AssignmentGenerator.js';
import * as DateUtil from '../../util/DateUtil.js';

export async function assign(db, name, userID, userSchedule, opts={})
{
    AssignmentGenerator.assign(db, userID, name, DateUtil.offsetDate(userSchedule.startDate, 7));
}

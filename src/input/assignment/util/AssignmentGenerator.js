import * as UserDatabase from '../../../database/UserDatabase.js';
import * as AssignmentDatabase from '../../../database/AssignmentDatabase.js';
import * as VacationDatabase from '../../../database/VacationDatabase.js';
import * as DateUtil from '../../../util/DateUtil.js';

const DAYS_PER_WEEK = 7;
const MAX_GENERATED_ASSIGNMENTS = 100;

export function assign(db, userID, assignmentID, dueDate, attributes = {})
{
    const ownerKeys = UserDatabase.getOwnerKeysForUserID(db, userID);
    const newDueDate = VacationDatabase.offsetDateByVacations(db, ownerKeys, dueDate);
    return AssignmentDatabase.addAssignment(db, userID, assignmentID, newDueDate, attributes);
}

export function assignWeekly(db, userID, assignmentBaseName, startDate, endDate, weekDay = 0, attributes = {})
{
    const result = [];

    let weekDate;
    if (startDate.getUTCDay() < weekDay)
    {
        // Week day for this week already passed. Use the next one.
        weekDate = DateUtil.getNextSunday(startDate);
    }
    else
    {
        // Week day for this week has yet to pass. Use this one.
        weekDate = DateUtil.getPastSunday(startDate);
    }
    weekDate.setUTCDate(weekDate.getUTCDate() + weekDay);

    const ownerKeys = UserDatabase.getOwnerKeysForUserID(db, userID);
    weekDate = VacationDatabase.offsetDateByVacations(db, ownerKeys, weekDate);

    // Generate assignments...
    let count = 1;
    while(DateUtil.compareDates(weekDate, endDate) <= 0)
    {
        // Add the current week date to result...
        const assignment = AssignmentDatabase.addAssignment(db, userID, `${assignmentBaseName}[${count}]`, weekDate, Object.assign({}, attributes));
        result.push(assignment);

        // Go to next week day...
        weekDate.setUTCDate(weekDate.getUTCDate() + DAYS_PER_WEEK);
        weekDate = VacationDatabase.offsetDateByVacations(db, ownerKeys, weekDate);

        if (++count >= MAX_GENERATED_ASSIGNMENTS) break;
    }

    return result;
}

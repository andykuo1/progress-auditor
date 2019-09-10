import * as UserDatabase from '../../../database/UserDatabase.js';
import * as AssignmentDatabase from '../../../database/AssignmentDatabase.js';
import * as VacationDatabase from '../../../database/VacationDatabase.js';
import * as DateUtil from '../../../util/DateUtil.js';
import * as DateGenerator from '../../../util/DateGenerator.js';

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
    const ownerKeys = UserDatabase.getOwnerKeysForUserID(db, userID);
    const vacations = VacationDatabase.getVacationsByOwnerKeys(db, ownerKeys);

    // Convert vacations to work week ranges...
    const timeOffRanges = [];
    for(const vacationID of vacations)
    {
        const vacation = VacationDatabase.getVacationByID(db, vacationID);
        timeOffRanges.push(DateGenerator.createDateRange(vacation.userStartDate, vacation.userEndDate));
    }
    DateGenerator.sortDateRanges(timeOffRanges);
    DateGenerator.mergeDateRangesWithOverlap(timeOffRanges);
    const validator = DateGenerator.createOffsetDelayValidator(timeOffRanges);
    const dueDates = DateGenerator.generateWeeklySunday(startDate, endDate, validator);

    // Assign assignments to due date...
    const result = [];
    let assignmentCount = 0;
    for(const date of dueDates)
    {
        const assignment = AssignmentDatabase.addAssignment(db, userID, `${assignmentBaseName}[${assignmentCount + 1}]`, date, Object.assign({}, attributes));
        result.push(assignment);
        
        if (++assignmentCount > MAX_GENERATED_ASSIGNMENTS)
        {
            throw new Error('Reached maximum amount of assignments generated.')
        }
    }

    return result;
}

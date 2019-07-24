const AssignmentDatabase = require('./AssignmentDatabase.js');
const { getPastSunday, getNextSunday, compareDates } = require('../util/DateUtil.js');

const DAYS_PER_WEEK = 7;
const MAX_GENERATED_ASSIGNMENTS = 100;

function assign(db, userID, assignmentID, dueDate, attributes = {})
{
    return AssignmentDatabase.addAssignment(db, userID, assignmentID, dueDate, attributes);
}

function assignWeekly(db, userID, assignmentBaseName, startDate, endDate, weekDay = 0, attributes = {})
{
    const result = [];

    let weekDate;
    if (startDate.getDay() < weekDay)
    {
        // Week day for this week already passed. Use the next one.
        weekDate = getNextSunday(startDate);
    }
    else
    {
        // Week day for this week has yet to pass. Use this one.
        weekDate = getPastSunday(startDate);
    }
    weekDate.setDate(weekDate.getDate() + weekDay);

    // Generate assignments...
    let count = 1;
    while(compareDates(weekDate, endDate) <= 0)
    {
        // Add the current week date to result...
        const assignment = AssignmentDatabase.addAssignment(db, userID, `${assignmentBaseName}[${count}]`, weekDate, attributes);
        result.push(assignment);

        // Go to next week day...
        weekDate.setDate(weekDate.getDate() + DAYS_PER_WEEK);

        if (++count >= MAX_GENERATED_ASSIGNMENTS) break;
    }

    return result;
}

module.exports = {
    assign,
    assignWeekly,
};

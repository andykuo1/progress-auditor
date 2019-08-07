export async function assign(db, assignmentName, userID, opts = {})
{
    const result = [];

    const startDate = opts.startDate;
    const endDate = opts.endDate;
    const weekDay = opts.weekDay;
    const attributes = opts.attributes;

    let weekDate;
    if (startDate.getUTCDay() < weekDay)
    {
        // Week day for this week already passed. Use the next one.
        weekDate = getNextSunday(startDate);
    }
    else
    {
        // Week day for this week has yet to pass. Use this one.
        weekDate = getPastSunday(startDate);
    }
    weekDate.setUTCDate(weekDate.getUTCDate() + weekDay);

    // Generate assignments...
    let count = 1;
    while(compareDates(weekDate, endDate) <= 0)
    {
        // Add the current week date to result...
        const assignment = AssignmentDatabase.addAssignment(db, userID, `${assignmentName}[${count}]`, weekDate, Object.assign({}, attributes));
        result.push(assignment);

        // Go to next week day...
        weekDate.setUTCDate(weekDate.getUTCDate() + DAYS_PER_WEEK);

        if (++count >= MAX_GENERATED_ASSIGNMENTS) break;
    }

    return result;
}

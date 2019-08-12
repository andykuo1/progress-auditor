const path = require('path');
const { UserDatabase, AssignmentDatabase, ScheduleDatabase, Schedule, FileUtil, TableBuilder } = Library;

/**
    Name: Bob Ross
    PID: A12345678
    Date: August 9, 2019
    Your weekly student report:
    Week 0 - Completed
    Week 1 - Completed (4 slip-day(s) used)
    Week 2 - Completed (1 slip-day(s) used) - In-Review
    Week 3 - Missing (9+? slip-day(s) used)
    Week 4 - Completed
    Week 5 - Completed
    Week 6 - Missing (6+? slip-day(s) used)

    Weeks remaining: 2
    Daily accruing slip-days: -2
    Remaining slip-days available: 4

    IMPORTANT:
        Missing assignment for Week 3 and Week 6.

    You must turn in all assignments, even if late. These will continue to accrue slip-days until it is turned in. Based on the number of slip-days available, you have 2 more days until all slip-days are used. To not be deducted points, you must submit the assignments on or before August 11, 2019.

    *In-Review: Significant difference has been found for the submission for the week past the deadline. A review is being conducted to evaluate number slip days used. Until resolved, it will assume the latest submission time is accurate.
 */

function stringifyStatus(status, slipDays = 0)
{
    let rateString;
    if (status === 'N' && slipDays > 0)
    {
        rateString = '+?';
    }
    else
    {
        rateString = '';
    }

    let slipString;
    if (slipDays > 0)
    {
        slipString = ` (${slipDays}${rateString} slip day(s) used)`;
    }
    else
    {
        slipString = '';
    }

    let statusString;
    switch(status)
    {
        case 'Y':
            statusString = 'Completed';
            break;
        case 'N':
            statusString = 'Missing';
            break;
        case '_':
            statusString = 'Not yet assigned';
            break;
        default:
            statusString = 'Unknown';
            break;
    }

    return statusString + slipString;
}

function generateProgressReport(db, userID)
{
    const user = UserDatabase.getUserByID(db, userID);
    const dst = [];

    dst.push('Name:', user.name);
    dst.push('PID:', user.attributes.pid);
    dst.push('Date:', db.currentDate.toDateString());
    dst.push('Your weekly student report:');
    dst.push('');
    const assignments = AssignmentDatabase.getAssignmentsByUser(db, userID);
    const inReviewAssignments = [];
    const missingAssignments = [];
    let accruedSlips = 0;
    let slipRate = 0;
    for(const assignmentID of assignments)
    {
        const assignment = AssignmentDatabase.getAssignmentByID(db, userID, assignmentID);
        if (assignment.attributes.status === 'N')
        {
            missingAssignments.push(assignment);
            slipRate += 1;
        }
        else if (assignment.attributes.status === '?')
        {
            inReviewAssignments.push(assignment);
        }
        accruedSlips += assignment.attributes.slip;
        dst.push(assignment.id, ' - ', stringifyStatus(assignment.attributes.status, assignment.attributes.slip))
    }
    dst.push('');
    const schedule = ScheduleDatabase.getScheduleByUserID(db, userID);
    const totalSlipDays = Schedule.calculateNumberOfSlipDays(schedule);
    dst.push('Weeks Remaining:', schedule.weeks - (assignments.length - missingAssignments.length));
    dst.push('Daily accruing slip days:', slipRate);
    dst.push('Remaining slip days available:', totalSlipDays - accruedSlips);
    dst.push('');

    if (missingAssignments.length > 0)
    {
        dst.push('IMPORTANT:');
        dst.push('');

        dst.push('Missing assignment for ' + missingAssignments.map((value) => value.id).join(', ') + '.');

        dst.push('');
        dst.push('You must turn in all assignments, even if late. These will continue to accrue slip-days until it is turned in.');

        // Calculate this based on schedule...
        /*
        const remainingDays = 0;
        const finalDueDate = 0;
        dst.push(`Based on the number of slip-days available, you have ${remainingDays} more days until all slip-days are used. To not be deducted points, you must submit the assignments on or before ${finalDueDate}.`);
        */

        dst.push('');
    }

    if (inReviewAssignments.length > 0)
    {
        dst.push('*In-Review: Significant difference has been found for the submission for the week past the deadline. A review is being conducted to evaluate number slip days used. Until resolved, it will assume the latest submission time is accurate.');
    }

    dst.push('');

    return dst.join('\\n');
}

function generateNoticeReport(db, userID)
{
    return 'N/A';
}

async function output(db, outputPath, config)
{
    const tableBuilder = new TableBuilder();
    tableBuilder.addColumn('User ID');
    tableBuilder.addColumn('User Name', (userID) => {
        return UserDatabase.getUserByID(db, userID).name;
    });
    tableBuilder.addColumn('Progress Report', (userID) => {
        return generateProgressReport(db, userID);
    });
    tableBuilder.addColumn('Notice Report', (userID) => {
        return generateNoticeReport(db, userID);
    });

    // Populate the table...
    for(const userID of UserDatabase.getUsers(db))
    {
        tableBuilder.addEntry(userID);
    }
    
    const outputTable = tableBuilder.build();
    FileUtil.writeTableToCSV(path.resolve(outputPath, 'reports.csv'), outputTable);
}

module.exports = {
    output
};

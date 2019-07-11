// USAGE: node generate-user-schedules.js ./input-path/to-your-file.csv
// Will output to ./out/user-schedule.csv

const { printTable, printDivider, printRow } = require('./output/console.js');
const { writeTableToCSV } = require('./fileutil.js');
const { createSchedule, calculateNumberOfSlipDays } = require('./schedule.js');
const { generateAssignments } = require('./assignment.js');
const csvUserParser = require('./parser/csv-user-parser.js');

const WEEK_DAYS = ['U', 'M', 'T', 'W', 'R', 'F', 'S'];
function dateString(date)
{
    return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();// + ':' + WEEK_DAYS[date.getDay()];
}

function generateUserSchedule(userData, schedule, assignments)
{
    const dueDates = [];
    const header = [];
    for(const assignment of assignments)
    {
        header.push(assignment.name);
        dueDates.push(dateString(assignment.date));
    }
    printTable([dueDates], header);
}

async function main()
{
    const db = {};
    if (process.argv.length < 3) throw new Error('Missing input file path');
    await csvUserParser.parse(process.argv[2], db);
    const invalidUsers = [];
    const userScheduleTable = [];
    let maxAssignments = null;
    for(const userData of db.users)
    {
        const startDate = Date.parse(userData[1]) ? new Date(userData[1]) : null;
        const endDate = Date.parse(userData[2]) ? new Date(userData[2]) : null;
        if (!startDate || !endDate)
        {
            invalidUsers.push(userData);
        }
        else
        {
            const schedule = createSchedule(startDate, endDate, { threshold: 2 });
            const assignments = generateAssignments(schedule);
            if (!maxAssignments || assignments.length > maxAssignments.length)
            {
                maxAssignments = assignments;
            }
            const slipDays = calculateNumberOfSlipDays(schedule);
            const output = [userData[0], dateString(startDate), dateString(endDate), slipDays];
            for(const assignment of assignments)
            {
                output.push(dateString(assignment.date));
            }
            userScheduleTable.push(output);
        }
    }

    for(const userSchedule of userScheduleTable)
    {
        while (userSchedule.length < maxAssignments.length)
        {
            userSchedule.push('');
        }
    }

    const userScheduleTableHeader = [
        'Email',
        'Start',
        'End',
        'Max Slip Days',
    ];
    for(const assignment of maxAssignments)
    {
        userScheduleTableHeader.push(assignment.name);
    }

    console.log("User schedules:");
    printTable(userScheduleTable, userScheduleTableHeader);
    console.log();
    console.log("Invalid users:");
    console.log(invalidUsers);
    console.log();

    console.log("OUTPUTTING...");
    userScheduleTable.unshift(userScheduleTableHeader);
    writeTableToCSV('./out/user-schedule.csv', userScheduleTable);
    console.log("END!");
}

// Run the program.
main();
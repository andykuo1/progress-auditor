// USAGE: node generate-reflection-deadlines.js startDate endDate ./output-path/for-your-file.csv
// Will output to provided output path.

const { createSchedule, calculateNumberOfSlipDays } = require('./schedule.js');
const { generateAssignments } = require('./assignment.js');
const { printTable } = require('./output/console.js');

const { writeTableToCSV } = require('./fileutil.js');

function parseAmericanStringToDate(dateString)
{
    const dateArray = dateString.split('/');
    return new Date(
        Number(dateArray[2]),       // Year
        Number(dateArray[0]) - 1,   // Month Index (starts from 0)
        Number(dateArray[1])        // Day of the Month
    );
}

function toAmericanDateString(date)
{
    return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();// + ':' + WEEK_DAYS[date.getDay()];
}

if (process.argv.length < 3) throw new Error('Missing start date.');
if (process.argv.length < 4) throw new Error('Missing end date.');

const startDate = parseAmericanStringToDate(process.argv[2]);
const endDate = parseAmericanStringToDate(process.argv[3]);

const schedule = createSchedule(startDate, endDate, { threshold: 2 });
const assignments = generateAssignments(schedule);

const dueDates = [
    toAmericanDateString(startDate)
];
const header = [
    'start',
];
for(const assignment of assignments)
{
    dueDates.push(toAmericanDateString(assignment.date));
    header.push(assignment.name);
}

printTable([dueDates], header, undefined, 10);

if (process.argv.length >= 5)
{
    writeTableToCSV(process.argv[4], [header, dueDates]);
}



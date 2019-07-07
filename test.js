console.log("");
console.log("Running tests...");

// Test for schedule.js
{
    runTest('schedule', () => {
        const schedule = require('./schedule.js');

        // getPastSunday
        {
            // Months start at 0, but days start at 1.
            const date = new Date(2000, 0, 1);
            assertEqual(date.getDay(), 6, '1/1/2000 is a Saturday.');

            const pastSunday = schedule.getPastSunday(date);
            assertEqual(pastSunday.getDay(), 0, 'getPastSunday() returns a Sunday.');
            assertEqual(pastSunday.getDate(), 26, 'The past Sunday was on December 26, 1999.');
            assertEqual(pastSunday.getFullYear(), 1999, 'getPastSunday() accounts for previous years.');
        }

        // generateDueDates
        {
            const startDate = new Date(2018, 5, 18);
            const dueDates = schedule.generateDueDates(startDate, new Date(2018, 8, 21));
            // console.log(dueDates);
            assertEqual(dueDates[1].getDay(), 0, 'generateDueDates returns Sundays.');
            assertEqual(dueDates.length, 15, 'There are 15 due dates (including week 0) between 6/18/2018 to 9/21/2018.');
            assertEqual(dueDates[0].getTime(), new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 7).getTime(), 'generateDueDates returns the correct last due date.');
            assertEqual(dueDates[14].getTime(), new Date(2018, 8, 23).getTime(), 'generateDueDates returns the correct last due date.');
        }

        // generateDueDates - same start and end date
        {
            const startDate = new Date(2018, 5, 18);
            const dueDates = schedule.generateDueDates(startDate, startDate);
            // console.log(dueDates);
            assertEqual(dueDates.length, 2, 'There are 2 due dates (week 0 and week 1) between 6/18/2018 to 6/18/2018.');
            assertEqual(dueDates[0].getTime(), new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 7).getTime(), 'generateDueDates returns the correct last due date.');
            assertEqual(dueDates[1].getTime(), new Date(2018, 5, 24).getTime(), 'generateDueDates returns the correct last due date.');
        }

        // generateDueDates - shorter schedules
        {
            const startDate = new Date(2018, 6, 26);
            const endDate = new Date(2018, 8, 17);
            const dueDates = schedule.generateDueDates(startDate, endDate);
            // console.log(dueDates);
            assertEqual(dueDates.length, 10, 'There are 10 due dates (including week 0) between 7/26/2018 to 9/17/2018.');
            assertEqual(dueDates[0].getTime(), new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 7).getTime(), 'generateDueDates returns the correct last due date.');
            assertEqual(dueDates[9].getTime(), new Date(2018, 8, 23).getTime(), 'generateDueDates returns the correct last due date.');
        }
    });
}

console.log("Finished tests!");
console.log("");

function runTest(title, testCallback)
{
    console.log(`Testing ${title}...`);
    try
    {
        testCallback();
    }
    catch(e)
    {
        console.error(`...FAILED: ${e.message}`);
        return;
    }
    console.log(`...PASSED!`);
}

function assertEqual(value, result, message = 'Error')
{
    if (value === result)
    {
        return;
    }
    else
    {
        throw new Error(`Expected '${result}' but found '${value}' - ${message}`);
    }
}
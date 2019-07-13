const { readCSVFileByRow } = require('../FileUtil.js');
const { parseAmericanDate } = require('../ParseUtil.js');
const UserDatabase = require('../UserDatabase.js');
const ScheduleDatabase = require('../ScheduleDatabase.js');

function parseName(value)
{
    return value;
}

function parseEmail(value)
{
    return value;
}

function parseEmailArray(value)
{
    return value.split(',');
}

module.exports = {
    async parse(filepath, db)
    {
        UserDatabase.setupDatabase(db);
        ScheduleDatabase.setupDatabase(db);

        let first = true;
        await readCSVFileByRow(filepath, (row) => {
            // Skip header...
            if (first)
            {
                first = false;
                return;
            }

            // 0      ,1        ,2         ,3             ,4  ,5            ,6          ,7         ,8
            // User ID,Last name,First name,Preferred Name,PID,Primary Email,Other Email,Start Date,End Date
            try
            {
                const userID = parseEmail(row[0]);
                const lastName = parseName(row[1]);
                const firstName = parseName(row[2]);
                const primaryEmail = parseEmail(row[5]);
                const otherEmails = parseEmailArray(row[6]);
                const user = UserDatabase.addUser(db, userID, primaryEmail, lastName, firstName, primaryEmail, otherEmails);

                const startDate = parseAmericanDate(row[7]);
                const endDate = parseAmericanDate(row[8]);
                const schedule = ScheduleDatabase.addSchedule(db, userID, startDate, endDate, { threshold: 2 });
            }
            catch(e)
            {
                db.throwError(UserDatabase.USER_KEY, 'Unable to parse user.', e);
            }
        });

        return db;
    }
};
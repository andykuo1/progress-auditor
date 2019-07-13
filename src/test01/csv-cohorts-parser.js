const { readCSVFileByRow } = require('../FileUtil.js');
const UserDatabase = require('../UserDatabase.js');

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

        await readCSVFileByRow(filepath, (row) => {
            // 0      ,1        ,2         ,3             ,4  ,5            ,6          ,7         ,8
            // User ID,Last name,First name,Preferred Name,PID,Primary Email,Other Email,Start Date,End Date
            try
            {
                const userID = parseEmail(row[0]);
                const lastName = parseName(row[1]);
                const firstName = parseName(row[2]);
                const primaryEmail = parseEmail(row[5]);
                const otherEmails = parseEmailArray(row[6]);
                UserDatabase.addUser(db, userID, primaryEmail, lastName, firstName, primaryEmail, otherEmails);
            }
            catch(e)
            {
                db.throwError(UserDatabase.USER_KEY, 'Unable to parse user.', e);
            }
        });

        return db;
    }
};
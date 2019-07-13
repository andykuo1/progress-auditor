const { readCSVFileByRow } = require('../FileUtil.js');
const SubmissionDatabase = require('../SubmissionDatabase.js');

function parseDate(value)
{
    // 2018-06-10 06:20:30 UTC
    const year = Number(value.substring(0, 4));
    const month = Number(value.substring(5, 7));
    const day = Number(value.substring(8, 10));

    if (year === NaN || month === NaN || day === NaN) throw new Error('Invalid date format - should be YYYY-MM-DD.');
    return new Date(year, month - 1, day);
}

function parseEmail(value)
{
    return value;
}

function evaluatePostAssignment(folder, submissionContent, subject)
{
    const introMatch = /intro/i;
    const weekMatch = /week ?([0-9]+)/i;
    const lastMatch = /last/i;

    if (introMatch.test(subject))
    {
        return 'intro';
    }
    else if (weekMatch.test(subject))
    {
        return 'week' + weekMatch.exec(subject)[1];
    }
    else if (lastMatch.test(subject))
    {
        return 'last';
    }
    else if (introMatch.test(submissionContent))
    {
        return 'intro';
    }
    else if (weekMatch.test(submissionContent))
    {
        return 'week' + weekMatch.exec(submissionContent)[1];
    }
    else if (lastMatch.test(submissionContent))
    {
        return 'last';
    }
    else
    {
        return 'unknown';
    }
}

module.exports = {
    async parse(filepath, db)
    {
        SubmissionDatabase.setupDatabase(db);

        await readCSVFileByRow(filepath, (row) => {
            // 0        ,1          ,2      ,3         ,4         ,5                      ,6      ,7           ,8   ,9    ,10
            // Anonymous,Post Number,Folders,Created At,Submission,Submission HTML Removed,Subject,Part of Post,Name,Email,Endorsed by Instructor
            try
            {
                // Requires OwnerID (email) -> User ID Mapping
                const postOwnerID = parseEmail(row[9]);
                const postDate = parseDate(row[3]);
                const postAssignmentID = evaluatePostAssignment(row[2], row[5], row[6]);
                console.log(postOwnerID, postDate, postAssignmentID);
                SubmissionDatabase.addSubmission(db, postOwnerID, postAssignmentID, postDate);
            }
            catch(e)
            {
                db.throwError(SubmissionDatabase.SUBMISSION_KEY, 'Unable to parse submission.', e);
            }
        });

        return db;
    }
};
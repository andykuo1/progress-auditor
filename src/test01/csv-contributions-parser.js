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

function parseAssignment(assignmentClassMapping, headerContent, bodyContent)
{
    let result;
    for(const assignment of assignmentClassMapping.values())
    {
        result = assignment.getAssignmentID(headerContent, bodyContent);
        if (result) return result;
    }
    return null;
}

module.exports = {
    async parse(filepath, db)
    {
        if (!('assignment' in db))
        {
            db.throwError('csv-contributions-parser', 'Parse is missing dependency.', 'assignment');
            return;
        }

        SubmissionDatabase.setupDatabase(db);
        let first = true;
        await readCSVFileByRow(filepath, (row) => {
            // Skip header...
            if (first)
            {
                first = false;
                return;
            }

            // 0        ,1          ,2      ,3         ,4         ,5                      ,6      ,7           ,8   ,9    ,10
            // Anonymous,Post Number,Folders,Created At,Submission,Submission HTML Removed,Subject,Part of Post,Name,Email,Endorsed by Instructor
            try
            {
                // Requires OwnerID (email) -> User ID Mapping
                const postOwnerID = parseEmail(row[9]);
                const postDate = parseDate(row[3]);
                const postAssignmentID = parseAssignment(db.assignment.class, row[6], row[5]) || parseAssignment(db.assignment.class, row[2], '');
                if (!postAssignmentID) db.throwError('csv-contributions-parser', 'Unable to evaluate assignment id.');
                
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
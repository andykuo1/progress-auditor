const { readCSVFileByRow } = require('../FileUtil.js');
const { parseDate } = require('../ParseUtil.js');
const SubmissionDatabase = require('../SubmissionDatabase.js');

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

            // Skip follow-up posts...
            if (row.length >= 8 && (row[7] === 'followup' || row[7] === 'reply_to_followup')) return;

            // 0        ,1          ,2      ,3         ,4         ,5                      ,6      ,7           ,8   ,9    ,10
            // Anonymous,Post Number,Folders,Created At,Submission,Submission HTML Removed,Subject,Part of Post,Name,Email,Endorsed by Instructor

            // Debugging
            // 11        ,12        ,13  ,14         ,15      ,16
            // UCSD Email,Start date,Week,Base Sunday,Deadline,Slip days used
            try
            {
                // Requires OwnerID (email) -> User ID Mapping
                const postOwnerID = parseEmail(row[9]);
                const postDate = parseDate(row[3]);
                const postAssignmentID = parseAssignment(db.assignment.class, row[6], row[5]) || parseAssignment(db.assignment.class, row[2], '');
                if (!postAssignmentID) db.throwError('csv-contributions-parser', 'Unable to evaluate assignment id.');

                // Test if post date is correct...
                // console.log(postOwnerID, postAssignmentID, row[3], postDate);
                
                // Test if assignment ID is parsed correctly...
                // console.log(postOwnerID, postAssignmentID, row[13]);

                // TODO: find user id by postOwnerID, and vice versa
                // Test if schedule is assigned correctly...
                /*
                const schedule = db.schedule.get(postOwnerID);
                if (!schedule) console.log("No schedule", postOwnerID);
                else console.log(postOwnerID,schedule.startSunday.getTime() - parseAmericanDate(row[14]).getTime());
                */

                // Test if due dates are accurate...
                /*
                if (row[7] === 'started_off_note')
                {
                    const assignments = db.assignment.instance.get(postOwnerID);
                    if (!assignments) console.log("No assignment", postOwnerID);
                    else if (!(postAssignmentID in assignments)) console.log("Not assigned", postAssignmentID, postOwnerID);
                    else console.log(postOwnerID, assignments[postAssignmentID].dueDate.getTime() - parseAmericanDate(row[15]).getTime());    
                }
                */

                // Test if slip days are accurate...
                // yic264@ucsd.edu is off by 3 because title does not include week3.
                /*
                if (row[7] === 'started_off_note')
                {
                    function calculateSlipDays(submitDate, dueDate)
                    {
                        const duration = dueDate.getTime() - submitDate.getTime();
                        if (duration < 0)
                        {
                            return -Math.ceil(duration / 86400000);
                        }
                        else
                        {
                            return 0;
                        }
                    }

                    const assignments = db.assignment.instance.get(postOwnerID);
                    if (!assignments) console.log("No assignment", postOwnerID);
                    else if (!(postAssignmentID in assignments)) console.log("Not assigned", postAssignmentID, postOwnerID);
                    else console.log(postOwnerID, postAssignmentID, calculateSlipDays(postDate, assignments[postAssignmentID].dueDate) - Number(row[16]));    
                }
                */

                // Test whether piazza's source post is the same as our own identified posts...
                // const submission = SubmissionDatabase.addSubmission(db, postOwnerID, postAssignmentID, postDate);
                /*
                if (row[7] === 'started_off_note' || row[7] === 'started_off_question')
                {
                    submission.source = true;
                    console.log(postOwnerID, postAssignmentID, row);
                }
                else
                {
                    submission.content = row[6];
                    submission.other = row[5].substring(0, 10);
                }
                */

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
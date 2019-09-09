import * as UserDatabase from '../../../database/UserDatabase.js';
import * as AssignmentDatabase from '../../../database/AssignmentDatabase.js';
import * as DateUtil from '../../../util/DateUtil.js';

/**
 * This is the LAST time zone offset from UTC. This means that there does
 * not exist any other place on Earth with an earlier time, therefore the due
 * date MUST be passed for everyone.
 */
const LATEST_TIMEZONE_OFFSET = 12 * 3600000;

/**
 * Calculates the number of days past the submission, accounting for time zones and partial days.
 * @param {Date} submitDate The date submitted.
 * @param {Date} dueDate The date the something should have been due.
 * @returns {Number} The number of days past the due date from submission. Otherwise, it is 0.
 */
function calculateSlipDays(submitDate, dueDate)
{
    const days = Math.floor((dueDate.getTime() + LATEST_TIMEZONE_OFFSET) / DateUtil.ONE_DAYTIME) - Math.floor(submitDate.getTime() / DateUtil.ONE_DAYTIME);
    if (days < 0)
    {
        return -days;
    }
    else
    {
        return 0;
    }
}

/**
 * Calculates the slip days for each user and assignment. This depends on submission
 * already being assigned appropriately.
 * @param {Database} db The database to resolve for.
 */
export async function resolve(db, config)
{
    // HACK: There should be a better way to get today's date.
    const currentDate = db.currentDate;

    // Dependent on accurate assignment resolution for submissions...
    for(const userID of UserDatabase.getUsers(db))
    {
        // Progress calculations
        let missing = 0;
        let unassigned = 0;
        let submitted = 0;

        // Slip calculations
        const submittedSlips = [];
        let totalSlips = 0;
        let daySlips = 0;
        const user = UserDatabase.getUserByID(db, userID);
        const schedule = user.schedule;
        const maxSlips = schedule.weeks * 3;
        const assignments = AssignmentDatabase.getAssignmentsByUser(db, userID);

        for(const assignmentID of assignments)
        {
            const assignment = AssignmentDatabase.getAssignmentByID(db, userID, assignmentID);

            // Check if not yet processed... (sometimes already processed by review)
            if (!('status' in assignment.attributes) || !('slip' in assignment.attributes))
            {
                const dueDate = assignment.dueDate;
                if (DateUtil.compareDates(currentDate, dueDate) < 0)
                {
                    assignment.attributes.status = '_';
                    assignment.attributes.slipDays = 0;
                }
                else
                {
                    let submitDate;
                    if (assignment.attributes.submission)
                    {
                        assignment.attributes.status = 'Y';
                        submitDate = assignment.attributes.submission.date;
                    }
                    else
                    {
                        assignment.attributes.status = 'N';
                        submitDate = currentDate;
                    }

                    const slipDays = calculateSlipDays(submitDate, dueDate);
                    assignment.attributes.slipDays = slipDays;
                }
            }

            // Update assignment info...
            const slipDays = assignment.attributes.slipDays;
            if (slipDays > 0)
            {
                submittedSlips.push(slipDays);
                totalSlips += slipDays;
                ++daySlips;
            }

            switch(assignment.attributes.status)
            {
                case 'Y': ++submitted; break;
                case 'N': ++missing; break;
                case '_': ++unassigned; break;
                // Don't recognize the status...
                default: ++unassigned;
            }
        }

        let mean = 0;
        let median = 0;
        if (daySlips > 0)
        {
            // Calculate mean...
            mean = totalSlips / daySlips;
            
            // Calculate median...
            if (submittedSlips.length % 2 === 0)
            {
                const left = Math.floor(submittedSlips.length / 2);
                const right = left + 1;
                median = left + right / 2;
            }
            else
            {
                median = Math.floor(submittedSlips.length / 2);
            }
        }

        user.attributes.slips = {
            used: totalSlips,
            remaining: maxSlips - totalSlips,
            max: maxSlips,
            mean,
            median,
        };
        
        user.attributes.progress = {
            submitted,
            missing,
            unassigned,
        };
    }
}

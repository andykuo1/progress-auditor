import * as UserDatabase from '../../../database/UserDatabase.js';
import * as AssignmentDatabase from '../../../database/AssignmentDatabase.js';
import * as DateUtil from '../../../util/DateUtil.js';

function calculateSlipDays(submitDate, dueDate)
{
    const days = Math.floor(dueDate.getTime() / DateUtil.ONE_DAYTIME) - Math.floor(submitDate.getTime() / DateUtil.ONE_DAYTIME);
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
export async function resolve(db)
{
    // HACK: There should be a better way to get today's date.
    const currentDate = db.currentDate;

    // Dependent on accurate assignment resolution for submissions...
    for(const userID of UserDatabase.getUsers(db))
    {
        let totalSlips = 0;
        let daySlips = 0;
        const user = UserDatabase.getUserByID(db, userID);
        const schedule = user.schedule;
        const maxSlips = schedule.weeks * 3;
        const assignments = AssignmentDatabase.getAssignmentsByUser(db, userID);
        for(const assignmentID of assignments)
        {
            const assignment = AssignmentDatabase.getAssignmentByID(db, userID, assignmentID);

            // Already processed... (usually by review)
            if ('status' in assignment.attributes && 'slip' in assignment.attributes) continue;

            const dueDate = assignment.dueDate;
            if (DateUtil.compareDates(currentDate, dueDate) < 0)
            {
                assignment.attributes.status = '_';
                assignment.attributes.slip = 0;
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

                const slips = calculateSlipDays(submitDate, dueDate);
                assignment.attributes.slips = slips;
                totalSlips += slips;
                ++daySlips;
            }
        }

        user.attributes.slips = {
            used: totalSlips,
            remaining: maxSlips - totalSlips,
            max: maxSlips,
            average: daySlips > 0 ? totalSlips / daySlips : 0,
        };
    }
}

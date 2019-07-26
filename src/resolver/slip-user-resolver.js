const UserDatabase = require('../database/UserDatabase.js');
const ScheduleDatabase = require('../database/ScheduleDatabase.js');
const AssignmentDatabase = require('../database/AssignmentDatabase.js');
const { compareDates } = require('../util/DateUtil.js');

const CURRENT_DATE = new Date(2018, 7 - 1, 19);
const ONE_DAYTIME = 86400000;

function calculateSlipDays(submitDate, dueDate)
{
    const days = Math.floor(dueDate.getTime() / ONE_DAYTIME) - Math.floor(submitDate.getTime() / ONE_DAYTIME);
    if (days < 0)
    {
        return -days;
    }
    else
    {
        return 0;
    }
}

async function resolve(db)
{
    // Dependent on accurate assignment resolution for submissions...
    for(const userID of UserDatabase.getUsers(db))
    {
        const schedule = ScheduleDatabase.getScheduleByUserID(db, userID);
        const maxSlips = schedule.weeks * 3;

        let totalSlips = 0;
        const user = UserDatabase.getUserByID(db, userID);
        const assignments = AssignmentDatabase.getAssignmentsByUser(db, userID);
        for(const assignmentID of Object.keys(assignments))
        {
            const assignment = assignments[assignmentID];

            const dueDate = assignment.dueDate;
            if (compareDates(CURRENT_DATE, dueDate) < 0)
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
                    submitDate = CURRENT_DATE;
                }

                const slips = calculateSlipDays(submitDate, dueDate);
                assignment.attributes.slips = slips;
                totalSlips += slips;
            }
        }

        user.attributes.slips = {
            used: totalSlips,
            remaining: maxSlips - totalSlips,
            max: maxSlips,
        };
    }
}

module.exports = {
    resolve
};
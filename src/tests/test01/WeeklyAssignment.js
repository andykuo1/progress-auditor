const Assignment = require('../Assignment.js');

const CURRENT_TIME = new Date(2018, 7 - 1, 9).getTime();
const ONE_DAYTIME = 86400000;

class WeeklyAssignment extends Assignment
{
    constructor()
    {
        super('weekly');
    }

    /** @override */
    getDueAssignments(userID, userSchedule, otherAssignments)
    {
        const result = {};

        // Add the remaining weekly due dates. This includes the last
        // week (even if partial week, they may still need to turn it in,
        // depending on the threshold set)...
        let pastSunday = new Date(userSchedule.startSunday);
        let active = pastSunday.getTime() <= CURRENT_TIME;
        for(let i = 0; i < userSchedule.weeks - 1; ++i)
        {
            // Go to next Sunday...
            pastSunday.setDate(pastSunday.getDate() + 7);
            // Add the next week to result...
            result['week' + (i + 1)] = Assignment.createDueAssignment(this, new Date(pastSunday), active);

            if (pastSunday.getTime() > CURRENT_TIME) active = false;
        }

        return result;
    }

    /** @override */
    hasAssignmentID(assignmentID)
    {
        return /week[0-9]+/i.test(assignmentID);
    }

    /** @override */
    getAssignmentID(headerContent, bodyContent='')
    {
        const pattern = /week ?([0-9]+)/i;
        const result = pattern.exec(headerContent);
        if (!result || result.length <= 0) return null;
        return 'week' + result[1];
    }
}

module.exports = WeeklyAssignment;

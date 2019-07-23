const Assignment = require('../Assignment.js');

const CURRENT_TIME = new Date(2018, 7 - 1, 9).getTime();
const ONE_DAYTIME = 86400000;

class LastAssignment extends Assignment
{
    constructor()
    {
        super('last');
    }

    /** @override */
    getDueAssignments(userID, userSchedule, otherAssignments)
    {
        let active = userSchedule.lastSunday.getTime() <= CURRENT_TIME + 7 * ONE_DAYTIME;
        return {
            'last': Assignment.createDueAssignment(this, new Date(userSchedule.lastSunday), active)
        };
    }

    /** @override */
    getAssignmentID(headerContent, bodyContent='')
    {
        if (/last/i.test(headerContent))
        {
            return this.name;
        }
        else
        {
            return null;
        }
    }
}

module.exports = LastAssignment;
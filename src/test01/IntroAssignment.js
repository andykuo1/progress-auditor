const Assignment = require('../Assignment.js');

const CURRENT_TIME = new Date(2018, 7 - 1, 9).getTime();
const ONE_DAYTIME = 86400000;

class IntroAssignment extends Assignment
{
    constructor()
    {
        super('intro');
    }

    /** @override */
    getDueAssignments(userID, userSchedule, otherAssignments)
    {
        // Add week 0 deadline - this does not follow the formats of
        // the other due dates. Instead, it is exactly 1 week after
        // the start date. This also means it can overlap with week 1.
        const dueDate = new Date(userSchedule.startDate);
        dueDate.setDate(dueDate.getDate() + 7);
        const active = userSchedule.startDate.getTime() < CURRENT_TIME;
        return {
            'intro': Assignment.createDueAssignment(this, dueDate, active)
        };
    }

    /** @override */
    getAssignmentID(headerContent, bodyContent='')
    {
        if (/intro/i.test(headerContent) || /week ?0+/i.test(headerContent))
        {
            return this.name;
        }
        else
        {
            return null;
        }
    }
}

module.exports = IntroAssignment;
import * as UserDatabase from '../../database/UserDatabase.js';
import * as ScheduleDatabase from '../../database/ScheduleDatabase.js';

export async function loadAssignments(db, config)
{
    if (!('assignments' in config))
    {
        console.log('......No assignments found...');
        return Promise.resolve([]);
    }

    // Create assignments...
    const assignmentResults = [];
    for(const assignmentConfig of config.assignments)
    {
        const name = assignmentConfig.name;
        const filePath = assignmentConfig.filePath;
        const assignment = require(filePath);

        console.log(`......Assigning '${path.basename(assignmentConfig.name)}' with '${path.basename(assignmentConfig.filePath)}'...`);

        for(const userID of UserDatabase.getUsers(db))
        {
            const schedule = ScheduleDatabase.getScheduleByUserID(db, userID);
            
            assignmentResults.push(assignment.parse(db, name, userID, schedule, assignmentConfig.opts));
        }
    }

    return Promise.all(assignmentResults);
}

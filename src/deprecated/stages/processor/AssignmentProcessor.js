import * as UserDatabase from '../../database/UserDatabase.js';

const path = require('path');

/**
 * Assumes assigners have already been loaded.
 * @param {Database} db The database to load data into.
 * @param {Object} config The config.
 */
export async function processAssignments(db, config)
{
    const registry = db._registry;
    if (!('assigners' in registry) || !Array.isArray(registry.assigners))
    {
        return Promise.resolve([]);
    }

    // Create assignments...
    const assignmentResults = [];
    for(const assignerEntry of registry.assigners)
    {
        const [assignment, filePath, name, opts] = assignerEntry;
        console.log(`......Assigning '${path.basename(name)}' with '${path.basename(filePath)}'...`);

        for(const userID of UserDatabase.getUsers(db))
        {
            const user = UserDatabase.getUserByID(db, userID);
            const schedule = user.schedule;
            assignmentResults.push(assignment.assign(db, name, userID, schedule, opts));
        }
    }

    return Promise.all(assignmentResults);
}

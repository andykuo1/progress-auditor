/**
 * This file is used to load and apply assignments from the config to the database.
 * 
 * @module AssignmentHandler
 */

import * as AssignmentLoader from './loader/AssignmentLoader.js';
import * as AssignerRegistry from '../../input/assignment/AssignerRegistry.js';
import * as UserDatabase from '../../database/UserDatabase.js';

export async function loadAssignmentsFromConfig(db, config)
{
    const assignmentEntries = await AssignmentLoader.findAssignmentEntries(config);
    for(const assignmentEntry of assignmentEntries)
    {
        try
        {
            await AssignmentLoader.loadAssignmentEntry(db, config, assignmentEntry);
        }
        catch(e)
        {
            console.error('Failed to load assignment entry.', e);
        }
    }
}

export async function applyAssignersToDatabase(db, config)
{
    for(const assigner of AssignerRegistry.getAssigners())
    {
        const [assignmentFunction, pattern, name, opts] = assigner;
        console.log(`...Assigning '${name}' as '${pattern}'...`);

        for(const userID of UserDatabase.getUsers(db))
        {
            const user = UserDatabase.getUserByID(db, userID);
            const schedule = user.schedule;
            await assignmentFunction.assign(db, name, userID, schedule, opts);
        }
    }
}

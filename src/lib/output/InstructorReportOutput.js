import * as UserDatabase from '../../database/UserDatabase.js';
import * as AssignmentDatabase from '../../database/AssignmentDatabase.js';
import * as FileUtil from '../../util/FileUtil.js';
import TableBuilder from '../../util/TableBuilder.js';

const path = require('path');

export async function output(db, outputPath, config)
{
    // COMPLETE = 0x2713 (checkmark)
    const COMPLETE_TOKEN = '\u2713';
    // INCOMPLETE = 0x2717 (cross) (RED)
    const INCOMPLETE_TOKEN = '\u2717';
    // UNASSIGNED = _ (empty)
    const UNASSIGNED_TOKEN = '\u25A0';
    const INPROGRESS_TOKEN = '...';
    // INREVIEW = ?
    const INREVIEW_TOKEN = '?';
    // POSTPONED = ...
    const POSTPONED_TOKEN = '...';
    // OUTOFBOUNDS = 0x25A0 (filled square) (DARK)
    const OUTOFBOUNDS_TOKEN = '_';

    const tableBuilder = new TableBuilder();
    tableBuilder.addColumn('User ID');
    tableBuilder.addColumn('Used Slips', (userID) => {
        return UserDatabase.getUserByID(db, userID).attributes.slips.used;
    });
    tableBuilder.addColumn('Remaining Slips', (userID) => {
        return UserDatabase.getUserByID(db, userID).attributes.slips.remaining;
    });
    tableBuilder.addColumn('Average Slips (Median)', (userID) => {
        return UserDatabase.getUserByID(db, userID).attributes.slips.median;
    });
    tableBuilder.addColumn('Max Slips', (userID) => {
        return UserDatabase.getUserByID(db, userID).attributes.slips.max;
    });
    tableBuilder.addColumn('Missing Assignments', (userID) => {
        return UserDatabase.getUserByID(db, userID).attributes.progress.missing;
    });
    tableBuilder.addColumn('Auto-report', (userID) => {
        // The auto-report threshold formula
        let flag = false;
        // Check the average if maintained from today, would it exceed by the end date.
        const userAttributes = UserDatabase.getUserByID(db, userID).attributes;
        const averageSlips = userAttributes.slips.mean;
        const remainingAssignments = userAttributes.progress.missing + userAttributes.progress.unassigned;
        if (averageSlips * remainingAssignments > userAttributes.slips.max)
        {
            flag = true;
        }
        // TODO: Check if there are any holes in submissions.
        // TODO: Check if intro or week 1 is past due date.
        // ...and the result...
        if (flag)
        {
            return 'NOTICE!';
        }
        else
        {
            return 'N/A';
        }
    });

    // Most recently submitted assignments...
    const usedAssignments = new Set();
    for(const userID of UserDatabase.getUsers(db))
    {
        const assignmentIDs = AssignmentDatabase.getAssignmentsByUser(db, userID);
        for(const assignmentID of assignmentIDs)
        {
            if (!usedAssignments.has(assignmentID))
            {
                const assignment = AssignmentDatabase.getAssignmentByID(db, userID, assignmentID);
                if (assignment.attributes.status !== '_')
                {
                    usedAssignments.add(assignmentID);
                }
            }
        }
    }
    const recentAssignments = Array.from(usedAssignments).reverse();

    // Add assignments to table...
    for(const assignmentID of recentAssignments)
    {
        tableBuilder.addColumn(assignmentID + ' Status', (userID) => {
            const assignment = AssignmentDatabase.getAssignmentByID(db, userID, assignmentID);
            if (!assignment) return '!ERROR';
            return assignment.attributes.status;
        });
        tableBuilder.addColumn(assignmentID + ' Slips', (userID) => {
            const assignment = AssignmentDatabase.getAssignmentByID(db, userID, assignmentID);
            if (!assignment) return '!ERROR';
            return assignment.attributes.slipDays;
        });
    }

    // Populate the table...
    for(const userID of UserDatabase.getUsers(db))
    {
        tableBuilder.addEntry(userID);
    }
    
    const outputTable = tableBuilder.build();
    FileUtil.writeTableToCSV(path.resolve(outputPath, 'slip-days.csv'), outputTable);
}

import * as AssignmentLoader from '../../input/assignment/AssignmentLoader.js';
import * as AssignerRegistry from '../../input/assignment/AssignerRegistry.js';

const fs = require('fs');
const path = require('path');

function validateAssignmentEntry(config, assignmentEntry)
{
    const errors = [];

    const assignmentName = assignmentEntry.assignmentName;
    const patternType = assignmentEntry.pattern;
    const customPath = assignmentEntry.customPath;

    if (!assignmentName)
    {
        errors.push([
            'Invalid assignment entry:',
            '=>',
            `Missing required property 'assignmentName'.`,
            '<='
        ]);
    }

    if (!patternType && !customPath)
    {
        errors.push([
            'Invalid assignment entry:',
            '=>',
            `Missing one of property 'pattern' or 'customPath'.`,
            '<='
        ]);
    }

    if (customPath && !fs.existsSync(customPath))
    {
        errors.push([
            `Cannot find custom assignment file '${path.basename(customPath)}':`,
            '=>',
            `File does not exist: '${customPath}'.`,
            '<='
        ]);
    }

    if (errors.length > 0)
    {
        throw new Error([
            'Failed to validate assignment entry:',
            '=>',
            errors,
            '<='
        ]);
    }
}

/** If unable to find entries, an empty array is returned. */
export async function findAssignmentEntries(config)
{
    console.log("...Finding assignment entries...");
    if (Array.isArray(config.assignments))
    {
        const result = config.assignments;

        // Validate assignment entries...
        const errors = [];
        for(const assignmentEntry of result)
        {
            try
            {
                validateAssignmentEntry(config, assignmentEntry);
            }
            catch(e)
            {
                errors.push(e);
            }
        }

        if (errors.length > 0)
        {
            throw new Error([
                'Failed to resolve assignment entries from config:',
                '=>',
                errors,
                '<='
            ]);
        }
        else
        {
            return result;
        }
    }
    else
    {
        return [];
    }
}

/**
 * Guaranteed to load assignment entry. Will throw an error if failed.
 * Also assumes that assignmentEntry is valid.
 */
export async function loadAssignmentEntry(db, config, assignmentEntry)
{
    console.log(`...Process assignment entry '${assignmentEntry.assignmentName}'...`);
    const assignmentName = assignmentEntry.assignmentName;
    const patternType = assignmentEntry.pattern;
    const customPath = assignmentEntry.customPath;
    const opts = assignmentEntry.opts || {};

    let Assignment;

    try
    {
        // customPath will override patternType if defined.
        if (customPath)
        {
            Assignment = AssignmentLoader.loadCustomAssignment(customPath);
        }
        else
        {
            Assignment = AssignmentLoader.loadAssignmentByType(patternType);
        }
    }
    catch(e)
    {
        throw new Error([
            `Failed to resolve assignment entry from config:`,
            '=>',
            e,
            '<='
        ]);
    }

    AssignerRegistry.registerAssigner(assignmentName, Assignment, customPath || patternType, opts);
}

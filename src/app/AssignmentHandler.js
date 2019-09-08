import * as AssignmentLoader from '../assignment/AssignmentLoader.js';
import * as ErrorHandler from '../app/ErrorHandler.js';

import * as AssignerRegistry from '../assignment/AssignerRegistry.js';

const fs = require('fs');
const path = require('path');

function validateAssignmentEntry(config, assignmentEntry)
{
    const ERROR = ErrorHandler.createErrorBuffer();

    const assignmentName = assignmentEntry.assignmentName;
    const patternType = assignmentEntry.pattern;
    const customPath = assignmentEntry.customPath;

    if (!assignmentName)
    {
        ERROR.add('Invalid assignment entry:', `Missing required property 'assignmentName'.`);
    }

    if (!patternType && !customPath)
    {
        ERROR.add('Invalid assignment entry:', `Missing one of property 'pattern' or 'customPath'.`);
    }

    if (customPath && !fs.existsSync(customPath))
    {
        ERROR.add(`Cannot find custom assignment file '${path.basename(customPath)}':`, `File does not exist: '${customPath}'.`);
    }

    if (!ERROR.isEmpty())
    {
        ERROR.flush('Failed to validate assignment entry:');
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
        const ERROR = ErrorHandler.createErrorBuffer();
        for(const assignmentEntry of result)
        {
            try
            {
                validateAssignmentEntry(config, assignmentEntry);
            }
            catch(e)
            {
                ERROR.add(e);
            }
        }

        if (!ERROR.isEmpty())
        {
            ERROR.flush('Failed to resolve assignment entries from config:');
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
    console.log("...Process assignment entry...");
    const assignmentName = assignmentEntry.assignmentName;
    const patternType = assignmentEntry.pattern;
    const customPath = assignmentEntry.customPath;
    const opts = assignmentEntry.opts || {};

    let Assignment;

    const ERROR = ErrorHandler.createErrorBuffer();
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
        ERROR.add(e);
    }

    if (!ERROR.isEmpty())
    {
        ERROR.flush(`Failed to resolve assignment entry from config:`);
    }
    else
    {
        AssignerRegistry.registerAssigner(assignmentName, Assignment, customPath || patternType, opts);
    }
}

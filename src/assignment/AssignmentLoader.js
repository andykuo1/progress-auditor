import * as SundayAssignment from './SundayAssignment';
import * as LastAssignment from './LastAssignment';
import * as IntroAssignment from './IntroAssignment';

export function loadAssignmentByType(assignmentType)
{
    switch(assignmentType)
    {
        case 'sunday': return SundayAssignment;
        case 'intro': return IntroAssignment;
        case 'last': return LastAssignment;
        default:
            throw new Error([
                'Invalid assignment entry:',
                '=>',
                `Cannot find valid assignment of type '${assignmentType}'.`,
                '<='
            ]);
    }
}

export function loadCustomAssignment(filePath)
{
    try
    {
        const result = require(filePath);

        // Make sure it is a valid assignment file...
        if (typeof result.assign !== 'function')
        {
            throw new Error([
                'Invalid custom assignment file:',
                '=>',
                `Missing export for named function 'assign'.`,
                '<='
            ]);
        }
    }
    catch(e)
    {
        throw new Error([
            `Unable to import custom assignment file:`,
            '=>',
            `File: '${filePath}'`, e,
            '<='
        ]);
    }
}

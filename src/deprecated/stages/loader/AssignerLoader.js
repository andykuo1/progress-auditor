const path = require('path');
const fs = require('fs');

/**
 * Assumes db is already initialized.
 * @param {Database} db The database to load assigners for.
 * @param {Object} config The config.
 */
export async function loadAssigners(db, config)
{
    const registry = db._registry;
    let dst;
    if ('assigners' in registry && Array.isArray(registry.assigners))
    {
        dst = registry.assigners;
    }
    else
    {
        dst = registry.assigners = [];
    }

    if (!('assignments' in config))
    {
        return Promise.resolve(dst);
    }

    // Create assignments...
    const errors = [];
    for(const assignmentConfig of config.assignments)
    {
        const name = assignmentConfig.name;
        const filePath = assignmentConfig.filePath;

        if (!name)
        {
            errors.push(`Invalid assignment config:`, '=>', `Missing 'name' for assignment config.`, '<=');
            continue;
        }

        if (!filePath)
        {
            errors.push(`Invalid assignment config:`, '=>', `Missing 'filePath' for assignment config.`, '<=');
            continue;
        }
        else if (!fs.existsSync(filePath))
        {
            errors.push(`Cannot find assigner script file '${path.basename(filePath)}':`, '=>', `File does not exist: '${filePath}'.`,'<=');
            continue;
        }

        let assignment;
        try
        {
            assignment = require(filePath);
        }
        catch(e)
        {
            errors.push(`Unable to import assigner file:`, '=>', `File: '${filePath}'`, e, '<=');
            continue;
        }

        dst.push([assignment, filePath, name, assignmentConfig.opts]);
    }

    if (errors.length > 0)
    {
        return Promise.reject([`Failed to resolve assignments from config:`, '=>', errors, '<=']);
    }

    return Promise.resolve(dst);
}

const path = require('path');
const fs = require('fs');

import * as NullReviewer from '../../lib/reviewer/NullReviewer.js';

/**
 * Assumes db is already initialized.
 * @param {Database} db The database to load reviewers for.
 * @param {Object} config The config.
 */
export async function loadReviewers(db, config)
{
    const registry = db._registry;
    let dst;
    if ('reviewers' in registry && registry.reviewers instanceof Map)
    {
        dst = registry.reviewers;
    }
    else
    {
        dst = registry.reviewers = new Map;
    }

    // Register the default reviewer...
    if (!dst.has('unknown'))
    {
        dst.set('unknown', NullReviewer.review);
    }

    if (!('reviewers' in config))
    {
        return Promise.resolve(dst);
    }
    
    const errors = [];
    for(const reviewerConfig of config.reviewers)
    {
        const filePath = reviewerConfig.filePath;
        const name = reviewerConfig.name;

        if (!name)
        {
            errors.push(`Invalid reviewer config:`, '=>', `Missing 'name' for reviewer config.`, '<=');
            continue;
        }

        if (!filePath)
        {
            errors.push(`Invalid reviewer config:`, '=>', `Missing 'filePath' for reviewer config.`, '<=');
            continue;
        }
        else if (!fs.existsSync(filePath))
        {
            errors.push(`Cannot find reviewer script file '${path.basename(filePath)}':`, '=>', `File does not exist: '${filePath}'.`,'<=');
            continue;
        }

        let reviewer;
        try
        {
            reviewer = require(filePath);
        }
        catch(e)
        {
            errors.push(`Unable to import reviewer file:`, '=>', `File: '${filePath}'`, e, '<=');
            continue;
        }
        
        dst.set(name, reviewer);
    }

    if (errors.length > 0)
    {
        return Promise.reject([`Failed to resolve reviewers from config:`, '=>', errors, '<=']);
    }

    return Promise.resolve(dst);
}

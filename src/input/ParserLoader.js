import * as CohortParser from './CohortParser.js';
import * as ContributionsParser from './ContributionsParser.js';

export function loadParserByType(parserType)
{
    switch(parserType)
    {
        case 'cohort': return CohortParser;
        case 'contributions': return ContributionsParser;
        default:
            throw new Error([
                'Invalid input entry:',
                '=>',
                `Cannot find valid parser of type '${parserType}'.`,
                '<='
            ]);
    }
}

export function loadCustomParser(filePath)
{
    try
    {
        const result = require(filePath);

        // Make sure it is a valid parser file...
        if (typeof result.parse !== 'function')
        {
            throw new Error([
                'Invalid custom parser file:',
                '=>',
                `Missing export for named function 'parse'.`,
                '<='
            ]);
        }
    }
    catch(e)
    {
        throw new Error([
            `Unable to import custom parser file:`,
            '=>',
            `File: '${filePath}'`, e,
            '<='
        ]);
    }
}

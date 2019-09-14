import * as PiazzaScheme from '../../scheme/piazza/PiazzaScheme.js';

export async function prepareScheme(db, config, schemeName = config.scheme)
{
    if (!schemeName) throw new Error('Missing \'scheme\' from config.');
    switch(schemeName)
    {
        case PiazzaScheme.SCHEME_NAME:
            PiazzaScheme.setup(db, config);
            break;
        default:
            throw new Error(`Unknown scheme by name '${schemeName}'.`);
    }
}


export function getSchemeNames()
{
    return [
        PiazzaScheme.SCHEME_NAME
    ];
}

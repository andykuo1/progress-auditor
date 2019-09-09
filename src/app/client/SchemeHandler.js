import * as PiazzaScheme from '../piazza/PiazzaScheme.js';

export async function prepareScheme(db, config)
{
    const schemeName = config.scheme;
    if (!schemeName) throw new Error('Missing \'scheme\' name from config.');
    switch(schemeName)
    {
        case PiazzaScheme.SCHEME_NAME:
            PiazzaScheme.setup(db, config);
            break;
        default:
            throw new Error(`Unknown scheme by name '${schemeName}'.`);
    }
}

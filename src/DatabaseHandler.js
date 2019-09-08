import * as ClientHandler from './ClientHandler.js';

// Database setup

/** Guaranteed to succeed. */
export function createDatabase(config)
{
    console.log("...Creating database...");
}

/** If unable to find entries, an empty array is returned. */
export async function findInputEntries(config)
{
    console.log("...Finding input entries...");
    if (Array.isArray(config.inputs))
    {
        return config.inputs;
    }
    else
    {
        return [];
    }
}

/** Guaranteed to load input entry. Will throw an error if failed. */
export async function loadInputEntry(db, config, inputEntry)
{
    console.log("...Loading input entry...");
}

export async function verifyDatabaseWithClient(db, config)
{
    console.log("...Verifying database with client...");
    return await ClientHandler.askWhetherDatabaseIsValidToUse(db, config);
}

// Database validation

/** If unable to find errors, an empty array is returned. */
export async function findDatabaseErrors(db, config)
{
    console.log("...Finding database errors...");
}

export async function shouldContinueResolvingErrorsWithClient(db, config, errors)
{
    console.log("...Should resolve database errors?");
}

export async function resolveDatabaseErrors(db, config, errors)
{
    console.log("...Resolving database errors...");
}

export async function verifyErrorsWithClient(db, config, errors)
{
    if (!errors || errors.length <= 0) return true;
}

export async function outputErrorLog(db, config, errors)
{
    console.log("...Outputting database errors...");
}
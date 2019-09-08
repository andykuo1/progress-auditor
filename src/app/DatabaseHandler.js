import * as ClientHandler from './ClientHandler.js';
import * as InputHandler from './InputHandler.js';

import * as DatabaseSetup from '../database/DatabaseSetup.js';

// Database setup

/** Guaranteed to succeed. */
export async function createDatabase(config)
{
    console.log("...Creating database...");

    return await DatabaseSetup.setupDatabase(config);
}

export async function loadDatabaseFromInputs(db, config)
{
    console.log("...Load database from inputs...");
    const inputEntries = await InputHandler.findInputEntries(config);
    for(const inputEntry of inputEntries)
    {
        try
        {
            await InputHandler.loadInputEntry(db, config, inputEntry);
        }
        catch(e)
        {
            // TODO: What to output if input file is missing?
            // TODO: What to output if input file cannot be parsed?
            // TODO: What to output if custom parser file is missing?
            // TODO: What to output if custom parser file is invalid?
            // TODO: What to output if parser type is missing?
            console.error('Failed to load input entry.', e);
        }
    }
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
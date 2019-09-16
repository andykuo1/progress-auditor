import * as ClientHandler from '../client/ClientHandler.js';
import * as InputHandler from '../helper/InputHandler.js';
import * as AssignmentHandler from '../helper/AssignmentHandler.js';

import * as DatabaseSetup from '../../database/DatabaseSetup.js';
import * as VacationLoader from '../helper/loader/VacationLoader.js';

/** Guaranteed to succeed. */
export async function createDatabase(config)
{
    console.log("...Creating database...");
    return await DatabaseSetup.setupDatabase(config);
}

/**
 * This prepares the database will all STATIC data that WILL NOT change over
 * the program's lifecycle. This includes custom scripts, input entries, etc.
 * This does NOT include the input DATA. Refer to populateDatabaseWithInputs()
 * for that.
 */
export async function prepareDatabaseForInputs(db, config)
{
    console.log("...Load database from inputs...");
    await InputHandler.loadInputsFromConfig(db, config);

    console.log("...Load database from assignments...");
    await AssignmentHandler.loadAssignmentsFromConfig(db, config);
}

/** This is used, alongside ReviewHandler.fixDatabaseWithReviews(), in both the input and validation stage. */
export async function populateDatabaseWithInputs(db, config)
{
    // Load input data...
    await InputHandler.applyParsersToDatabase(db, config);

    // Load vacation data... (this MUST come before assignment data but after user/schedule data)
    // ... and since this is a review now, it CAN change during the program's lifecycle...
    await VacationLoader.loadVacationsFromReviews(db, config);

    // Load assignment data...
    await AssignmentHandler.applyAssignersToDatabase(db, config);
}

export async function verifyDatabaseWithClient(db, config)
{
    console.log("...Verifying database with client...");
    return await ClientHandler.askWhetherDatabaseIsValidToUse(db, config);
}

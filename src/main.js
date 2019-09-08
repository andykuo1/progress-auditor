// TODO: This should be it's own bundled file for plugins to use. But for now, it's a global.
import './index.js';

import * as ConfigHandler from './app/ConfigHandler.js';
import * as DatabaseHandler from './app/DatabaseHandler.js';
import * as OutputHandler from './app/OutputHandler.js';
import * as ClientApplication from './client/ClientApplication.js';

/** The root project directory */
const DIRECTORY = '.';

/**
 * The entry point to the program.
 */
export async function main(args)
{
    await ClientApplication.onStart(args);
    
    try
    {
        // Setup is starting...
        const config = await resolveConfig(DIRECTORY);
        const db = await resolveDatabase(config);

        await ClientApplication.onSetup(db, config);
        await ClientApplication.onPreProcess(db, config);

        // All setup is GUARANTEED to be done now. Reviews are now to be processed...
        // Any errors that dare to surface will be vanquished here. Or ignored...
        await validateDatabase(db, config);

        await ClientApplication.onPostProcess(db, config);
        await ClientApplication.onPreOutput(db, config);
    
        // All validation is GUARANTEED to be done now. Outputs can now be generated...
        await generateOutput(db, config);

        await ClientApplication.onPostOutput(db, config);
    }
    catch(e)
    {
        await ClientApplication.onError(db, config, e);

        console.error('Program failed.', e);
        return false;
    }

    await ClientApplication.onStop(db, config);

    return true;
}

/**
 * Guarantees a config will be returned. It will throw an error if unable to.
 * @param {String} directory The root project directory.
 * @returns {Config} The config.
 */
async function resolveConfig(directory)
{
    console.log("Resolving config...");

    // Try to load the provided config file in the directory...
    let config;
    try
    {
        config = await ConfigHandler.loadConfigFile(directory);
    }
    catch(e)
    {
        // Try other fallback config files... maybe ask for one?
        let configFilePath;
        while (configFilePath = await ConfigHandler.requestConfigFile(directory))
        {
            try
            {
                // Found config file. Load it up.
                config = await ConfigHandler.loadConfigFile(configFilePath);
                if (config) break;
            }
            catch(e)
            {
                // Failed to load config. Try again.
                console.error('Failed to load config.', e);
            }
        }
    
        // None found. Use the default instead.
        if (!config) config = await ConfigHandler.loadDefaultConfig(directory);
    }

    if (!config)
    {
        // This should never happen...
        throw new Error('Could not resolve a config file for program. Stopping program...');
    }
    return config;
}

/**
 * Guarantees a database will be returned. It will throw an error if unable to.
 * @param {Config} config The config.
 * @returns {Database} The database.
 */
async function resolveDatabase(config)
{
    console.log("Resolving database...");

    // Creates an empty database (with no structure at all)...
    const db = await DatabaseHandler.createDatabase(config);

    // Try to load all database entries from config...
    await DatabaseHandler.loadDatabaseFromInputs(db, config);

    // Check with the user if it is okay to continue, based on some data stats...
    if (!await DatabaseHandler.verifyDatabaseWithClient(db, config))
    {
        throw new Error('Could not resolve database for program. Please update the config to match your specifications, then try again. Stopping program...');
    }
    return db;
}

/**
 * Guarantees to prepare the database for output. Otherwise, it will throw an error.
 * @param {Database} db The database.
 * @param {Config} config The config.
 */
async function validateDatabase(db, config)
{
    console.log("Validating database...");

    // Apply reviews...
    let errors;
    while(errors = await DatabaseHandler.findDatabaseErrors(db, config))
    {
        // Check whether the client wants to continue resolving errors... cause there could be a lot.
        if (await DatabaseHandler.shouldContinueResolvingErrorsWithClient(db, config, errors))
        {
            await DatabaseHandler.resolveDatabaseErrors(db, config, errors);
        }
        else
        {
            break;
        }
    }

    // Whether to ignore errors and continue as normal...
    if (!await DatabaseHandler.verifyErrorsWithClient(db, config, errors))
    {
        await DatabaseHandler.outputErrorLog(db, config, errors);
        
        // IT'S AN ERROR! RUN AWAY!!!
        throw new Error('Could not validate database. Stopping program...');
    }

    // All is well.
}

/**
 * Guarantees no changes will be made to the database or the config.
 * @param {Database} db The database.
 * @param {Config} config The config.
 */
async function generateOutput(db, config)
{
    console.log("Generating output...");
    
    const outputEntries = OutputHandler.findOutputEntries(config);

    for(const outputEntry of outputEntries)
    {
        try
        {
            await OutputHandler.processOutputEntry(db, config, outputEntry);
        }
        catch(e)
        {
            console.error('Failed to process output entry.', e);
        }
    }
}

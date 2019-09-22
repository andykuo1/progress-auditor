import * as ConfigHandler from './main/ConfigHandler.js';
import * as DatabaseHandler from './main/DatabaseHandler.js';
import * as DatabaseSolver from './main/DatabaseSolver.js';
import * as ReviewHandler from './main/ReviewHandler.js';
import * as OutputHandler from './main/OutputHandler.js';

/**
 * Guarantees a config will be returned. It will throw an error if unable to.
 * @param {String} directory The root project directory.
 * @returns {Config} The config.
 */
export async function resolveConfig(directory)
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
            }
        }
        
        // More fallbacks...
        if (!config) config = await ConfigHandler.createNewConfig(directory);
        if (!config) config = await ConfigHandler.loadDefaultConfig(directory);
    }

    if (!config)
    {
        // This should never happen...
        throw new Error('Could not resolve a config file for program. Stopping program...');
    }

    await ConfigHandler.validateConfig(config, directory);

    return config;
}

/**
 * Guarantees a database will be returned. It will throw an error if unable to.
 * @param {Config} config The config.
 * @returns {Database} The database.
 */
export async function resolveDatabase(config)
{
    console.log("Resolving database...");

    // Creates an empty database (with no structure at all)...
    const db = await DatabaseHandler.createDatabase(config);

    // Prepare review registry with schemes...
    await ReviewHandler.prepareDatabaseForScheme(db, config, config.scheme);

    // Try to prepare all database entries from config...
    await DatabaseHandler.prepareDatabaseForInputs(db, config);

    // Try to load all database entries from config...
    await DatabaseHandler.populateDatabaseWithInputs(db, config);

    // Apply the database review fixes...
    await ReviewHandler.fixDatabaseWithReviews(db, config);

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
export async function validateDatabase(db, config)
{
    console.log("Validating database...");

    // Apply reviews...
    let reviews = [];
    let errors;
    while(errors = await DatabaseSolver.findDatabaseErrors(db, config))
    {
        // Check whether the client wants to continue resolving errors... cause there could be a lot.
        if (await DatabaseSolver.shouldContinueResolvingErrorsWithClient(db, config, errors))
        {
            const result = await DatabaseSolver.resolveDatabaseErrors(db, config, errors);

            // If review was successful...
            if (result && result.length > 0)
            {
                reviews.push(...result);

                // Restart the database...
                await DatabaseSolver.clearDatabase(db, config);
    
                // Re-apply all the data...
                await DatabaseHandler.populateDatabaseWithInputs(db, config);
                // Re-apply the new reviews...
                await ReviewHandler.populateDatabaseWithAdditionalReviews(db, config, reviews);

                // Re-fix them...
                await ReviewHandler.fixDatabaseWithReviews(db, config);
            }

            // And go back to check for errors again...
        }
        else
        {
            break;
        }
    }
    
    // Whether to save any newly created reviews...
    if (await ReviewHandler.shouldSaveReviewsForClient(db, config, reviews))
    {
        // This is null because we want to output all of it...
        await ReviewHandler.outputReviewsToFile(db, config);
    }

    // Whether to ignore errors or continue as normal...
    if (!await DatabaseSolver.verifyErrorsWithClient(db, config, errors))
    {
        // IT'S AN ERROR! RUN AWAY!!!
        throw new Error('Cannot resolve errors. Stopping program...');
    }

    // All is well.
}

/**
 * Guarantees no changes will be made to the database or the config.
 * @param {Database} db The database.
 * @param {Config} config The config.
 */
export async function generateOutput(db, config)
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


// TODO: Config properties that only require filePath should accept strings as well.
// TODO: If files like vacations.csv or reviews.csv does not exist, it should not try to process them.

export async function run()
{
    Menu.printTitle();
    Menu.println();

    /**
     * Setup - Where all resources that loaders require to import
     * should be initialized.
     */
    const config = await prepareConfig();

    // Prepare global environment for external scripts...
    global.Library = Library;

    // Prepare database from config...
    const db = await prepareDatabase(config);

    // Prepare registries from scheme...
    // NOTE: Any new schemes should be added to prepareScheme().
    await prepareScheme(db, config);

    /**
     * Loading - Where all data should be loaded from file. This
     * should be raw data as defined by the user. No modifications
     * should take place; they will be considered for alterations
     * in the processing stage.
     */
    await runLoaders(db, config);

    /**
     * Processing - Where all data is evaluated and processed into
     * valid and useful information. This is also where most of the
     * errors not related to IO will be thrown. This stage consists
     * of two steps: the review and the resolution. The resolution
     * step will attempt to automatically format and validate the
     * data. If it is unable to then the data is invalid and is
     * flagged for review by the user. Therefore, the review step,
     * which processes all user-created reviews, is computed before
     * the resolution. This is a frequent debug loop.
     */
    await runProcessors(db, config);

    // Review resolution loop
    const reviews = await ErrorReviewer.run(db, config, runProcessors);

    /**
     * Outputting - Where all data is outputted into relevant
     * files. If any errors had occured, it will exit-early and
     * output any gathered debug information.
     */
    if (reviews.length > 0)
    {
        if (await Menu.askYesNo("Do you want to save the new reviews?"))
        {
            const reviewTableHeader = [
                'Review ID',
                'Date',
                'Comment',
                'Type',
                'Param[0]',
                'Param[1]',
                'Param[2]',
                'Param[3]',
                '...'
            ];
            const reviewTable = [reviewTableHeader];
            for(const review of reviews)
            {
                const reviewEntry = [];
                // ID
                reviewEntry.push(review[0]);
                // Date
                reviewEntry.push(review[1]);
                // Comment
                reviewEntry.push(review[2]);
                // Type
                reviewEntry.push(review[3]);
                // Params
                reviewEntry.push(...review[4]);
                reviewTable.push(reviewEntry);
            }
            await FileUtil.writeTableToCSV(path.resolve(config.outputPath, `reviews-${db.currentDate.toISOString()}.csv`), reviewTable);
        }
        else
        {
            Menu.println("Dumping reviews...");
        }
    }

    await runOutputs(db, config);

    /**
     * Cleanup - Where all resources are destroyed, just to make
     * sure nothing leaks.
     */
    console.log("......Stopped.");
    console.log();

    // process.exit(0);
}

async function prepareConfig()
{
    const path = require('path');
    Menu.println("Running from directory:", path.resolve('.'));
    Menu.println();

    Menu.println("Getting config file...");
    let configPath = null;
    if (process.argv.length > 2)
    {
        path.resolve(path.dirname(process.execPath), process.argv[2]);
    }
    else
    {
        Menu.println("...no config specified...");
        Menu.println("...getting default config...");
        configPath = './config.json';
    }

    Menu.println(`Loading config file '${configPath}'...`);
    let config = null;
    try
    {
        config = await loadConfig(configPath);
    }
    catch(e)
    {
        Menu.printlnError(e);
        process.exit(1);
    }
    Menu.println();
    return config;
}

async function prepareDatabase(config)
{
    Menu.println("Setting up the database...");
    let db = null;
    try
    {
        db = await setupDatabase(config);
    }
    catch(e)
    {
        Menu.printlnError(e);
        process.exit(1);
    }
    Menu.println();

    Menu.println("Date:", db.currentDate.toDateString());
    Menu.println();

    return db;
}

async function prepareScheme(db, config)
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

async function runLoaders(db, config)
{
    Menu.println("Loading parsers...");
    try
    {
        await loadParsers(db, config);
    }
    catch(e)
    {
        Menu.printlnError(e);
        process.exit(1);
    }

    Menu.println("Loading assigners...");
    try
    {
        await loadAssigners(db, config);
    }
    catch(e)
    {
        Menu.printlnError(e);
        process.exit(1);
    }

    Menu.println();
}

async function runProcessors(db, config)
{
    Menu.println("...Processing...");

    Menu.println("Parsing databases...");

    try
    {
        await InputProcessor.processInputs(db, config);
    }
    catch(e)
    {
        Menu.printlnError(e);
        process.exit(1);
    }

    Menu.println("Assigning assignments...");
    try
    {
        await AssignmentProcessor.processAssignments(db, config);
    }
    catch(e)
    {
        Menu.printlnError(e);
        process.exit(1);
    }

    Menu.println("Evaluating reviews...");
    console.log('......Looking over our work...');
    try
    {
        await ReviewProcessor.processReviews(db, config);
    }
    catch(e)
    {
        Menu.printlnError(e);
        process.exit(1);
    }

    Menu.println("Resolving database...");
    console.log(`......Helping you fix a few things...`);
    try
    {
        await PostProcessor.processDatabase(db, config);
    }
    catch(e)
    {
        Menu.printlnError(e);
        process.exit(1);
    }

    Menu.println();
}

async function runOutputs(db, config)
{
    console.log("...Outputting...");
    if (db.getErrors().length > 0)
    {
        console.log("......Oh no! We found some errors...");
        console.log("......Finding debug info for you...");
        await DebugInfoOutput.output(db, config.outputPath, config);

        console.log("...Failed!");
        console.log();

        Menu.printMotivation();
        console.log();
    }
    else
    {
        console.log("......Hooray! Everything is as expected...");

        if (config.debug)
        {
            console.log("......Finding debug info for you...");
            await DebugInfoOutput.output(db, config.outputPath, config);
        }

        await OutputProcessor.processOutput(db, config);

        console.log("...Success!");
    }
}

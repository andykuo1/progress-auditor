import * as Menu from './menu/Menu.js';
import * as Client from '../../client/Client.js';

// Used for logging database stats...
import * as UserDatabase from '../../database/UserDatabase.js';
import * as SubmissionDatabase from '../../database/SubmissionDatabase.js';
import * as ReviewDatabase from '../../database/ReviewDatabase.js';

const chalk = require('chalk');

export async function askForConfigFilePath(directory)
{
    if (await Client.ask("Change the working directory?"))
    {
        return Client.askPath("Another working directory:", directory, true, true);
    }

    return null;
}

export async function askWhetherDatabaseIsValidToUse(db, config)
{
    // Let the client verify the database stats...
    Client.log('')
    Client.log('== Current Status ==')
    Client.log(` - Current Date: ${config.currentDate}`);
    Client.log(` - Input Path: ${config.inputPath}`);
    Client.log(` - Output Path: ${config.outputPath}`);
    Client.log(` - Scheme: ${config.scheme}`);
    Client.log(` - User(s): ${UserDatabase.getUserCount(db)}`);
    Client.log(` - Submission(s): ${SubmissionDatabase.getSubmissionCount(db)}`);
    Client.log(` - Review(s): ${ReviewDatabase.getReviewCount(db)}`);
    Client.log('');

    return await Client.ask("Is this correct?");
}

export async function askWhetherToIgnoreErrors(db, config, errors)
{
    // Let the client decide whether to skip these errors...
    return await Client.ask(`Do you want to continue despite ${errors.length} error(s)?`);
}

export async function askWhetherToSaveNewReviews(db, config, reviews)
{
    // Let the client decide whether to save it...
    return await Client.ask(`Do you want to save the new ${reviews.length} review(s)?`);
}

export async function askWhetherToReviewErrors(db, config, errors)
{
    // Let the client decide whether to review the errors...
    Menu.printlnError(`Found ${errors.length} errors. :(`);
    Menu.printMotivation();
    const result = await Client.ask("Do you want to review them now?", true);
    if (!result)
    {
        Menu.println(`Skipping errors...${Math.random() > 0.6 ? chalk.gray(`(I trust you)...`) : ''}`);
    }
    return result;
}

export async function askWhetherToSaveDebugInfo()
{
    // Let the client decide whether to save debug info (which can contain user info)...
    return await Client.ask(`Do you want to save debug info? It will contain user information.`);
}

export async function showSkippingDebugLog()
{
    Menu.println('...Skipping debug logs...');
}

export async function celebrateNoErrors()
{
    Menu.println("== No errors! Hooray! ==");
}
export async function askWhetherToMakeNewConfig()
{
    return await Client.ask('Make a new config?');
}
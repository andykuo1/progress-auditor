import * as Menu from './menu/Menu.js';
const chalk = require('chalk');

export async function askForConfigFilePath(directory)
{
    // TODO: Let the client specify another config file...
    return null;
}

export async function askWhetherDatabaseIsValidToUse(db, config)
{
    // TODO: Let the client verify the database stats...
    return true;
}

export async function askWhetherToIgnoreErrors(db, config, errors)
{
    // TODO: Let the client decide whether to skip these errors...
    return await Menu.askYesNo(`Do you want to continue despite ${errors.length} error(s)?`);
}

export async function askWhetherToSaveNewReviews(db, config, reviews)
{
    // Let the client decide whether to save it...
    return await Menu.askYesNo(`Do you want to save the new ${reviews.length} review(s)?`);
}

export async function askWhetherToReviewErrors(db, config, errors)
{
    // Let the client decide whether to review the errors...
    Menu.printlnError(`Found ${errors.length} errors. :(`);
    Menu.printMotivation();
    const result = await Menu.askYesNo("Do you want to review them now?");
    if (!result)
    {
        Menu.println(`Skipping errors...${Math.random() > 0.6 ? chalk.gray(`(I trust you)...`) : ''}`);
    }
    return result;
}

export async function askWhetherToSaveDebugInfo()
{
    // Let the client decide whether to save debug info (which can contain user info)...
    return await Menu.askYesNo(`Do you want to save debug info? It will contain user information.`);
}

export async function showSkippingDebugLog()
{
    Menu.println('...Skipping debug logs...');
}
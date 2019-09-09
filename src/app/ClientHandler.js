import * as Menu from './client/menu/Menu.js';

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

export async function askWhetherToSaveNewReviews(db, config, reviews)
{
    // Let the client decide whether to save it...
    if (reviews.length > 0)
    {
        return await Menu.askYesNo("Do you want to save the new reviews?");
    }
    return false;
}
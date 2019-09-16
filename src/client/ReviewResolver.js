import { log, askPrompt, ask, askPath, askDate, askChoose, CHOICE_SEPARATOR } from './Client.js';
import { createResolver, ifFailOrAgain, ifFailAndAgain } from './Resolver.js';
import * as ReviewMaker from './ReviewMaker.js';
import chalk from 'chalk';

async function askChooseError(message, errors)
{
    const choices = [];

    for(const error of errors)
    {
        choices.push({
            message: `${chalk.gray(error.id + ': ')} ${error.message}`,
            value: error.id,
        });
    }
    choices.push(CHOICE_SEPARATOR);

    return await askPrompt(message, 'autocomplete', {
        multiple: true,
        choices
    });
}

/** Tries to resolve the errors with reviews. */
export async function run(errors, cache = {})
{
    cache.errors = errors;
    cache.reviews = [];
    cache.reviewMaker = {};

    /**
     * First, show all the errors and let the client pick one or many.
     * This should have preliminary info to figure out what to do next.
     * If the client has picked some, ask if they want to ignore these or review them.
     * If ignore, store the error ids to hide them next time.
     * If review, enter review mode for all selected reviews.
     * Do they want to save the reviews somewhere? Do they want to review some more?
     * Return anything we have.
     */

    let result = null;

    result = await askChooseError("Which errors would you like to resolve? (Use 'space' to select)", errors);
    if (!result)
    {
        /*

        Create a review.
        I want to know how to pick parameters.
        I therefore need information?

        */
    }

    console.log(JSON.stringify(result));

    log("That's all folks. Sayonara.");
    return { sad: true };
}

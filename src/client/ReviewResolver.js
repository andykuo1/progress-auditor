import { log, askPrompt, ask, askPath, askDate, askChoose, CHOICE_SEPARATOR } from './Client.js';
import { createResolver, ifFailOrAgain, ifFailAndAgain } from './helper/Resolver.js';
import * as ReviewMaker from './ReviewMaker.js';
import ReviewRegistry from '../review/ReviewRegistry.js';
import chalk from 'chalk';
import * as Menu from '../app/client/menu/Menu.js';

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
        multiple: false, // TODO: This will allow batch processing in the future.
        limit: 10,
        choices
    });
}


/** Tries to resolve the errors with reviews. */
export async function run(errors, cache = {})
{
    cache.errors = errors;
    cache.reviews = [];
    cache.reviewMaker = {};

    const errorMapping = new Map();
    for(const error of errors)
    {
        errorMapping.set(error.id, error);
    }

    /**
     * First, show all the errors and let the client pick one or many.
     * This should have preliminary info to figure out what to do next.
     * If the client has picked some, ask if they want to ignore these or review them.
     * If ignore, store the error ids to hide them next time.
     * If review, enter review mode for all selected reviews.
     * Do they want to save the reviews somewhere? Do they want to review some more?
     * Return anything we have.
     */

    // NOTE: Temporary implementation
    const errorID = await askChooseError("What error do you want to review?", errors);

    if (await askClientToReviewError(errorMapping.get(errorID)))
    {
        const reviewResult = await doReviewSession(ReviewRegistry);
        cache.reviews.push(reviewResult);
    }
}

async function showErrorInfo(error)
{
    const errorMessage = `${chalk.gray(error.id + ':')} ${error.message}`;
    Menu.printError(errorMessage);
    const errorSolutions = `${chalk.green(`${chalk.bold(`= Solutions: ${'='.repeat(67)}`)}\n => ${error.options.join('\n => ')}\n${chalk.bold('='.repeat(80))}`)}`;
    Menu.println(errorSolutions);

    if (await ask("Show more info?"))
    {
        const errorInfo = `${chalk.yellow(`${chalk.bold(`= More Info: ${'='.repeat(67)}`)}\n | ${error.more.join('\n')}\n${'='.repeat(80)}`)}`;
        Menu.println(errorInfo);
    }
}

async function askClientToReviewError(error)
{
    await showErrorInfo(error);
    return await ask("Continue to review?");
}

async function doReviewSession(reviewRegistry)
{
    const reviewType = await chooseReviewType(reviewRegistry);
    const review = reviewRegistry.getReviewByType(reviewType);
    if (review.build)
    {
        return await review.build();
    }
    else
    {
        return null;
    }
}

async function chooseReviewType(reviewRegistry)
{
    // return 'add_owner_key';
    const reviewTypes = reviewRegistry.getReviewTypes();
    return await askChoose("What type of review do you want to make?", Array.from(reviewTypes));
}

import { log, askPrompt, ask, askPath, askDate, askChoose, CHOICE_SEPARATOR, askInput } from './Client.js';
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
            name: error.id,
            message: `\n${chalk.gray(error.id + ': ')}\n${error.message}`,
            value: error.id,
        });
    }
    choices.push(CHOICE_SEPARATOR);

    return await askPrompt(message, 'autocomplete', {
        multiple: true,
        limit: 5,
        choices,
        validate: result => result.length <= 0 ? "Must select at least one error (use 'space' to select)." : true
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

    const chosenErrorIDs = await askChooseError("What error do you want to review?", errors);
    const chosenErrors = [];
    for(const errorID of chosenErrorIDs)
    {
        const error = errorMapping.get(errorID);
        chosenErrors.push(error);
    }

    if (await askClientToReviewErrors(chosenErrors))
    {
        const reviewResult = await doReviewSession(ReviewRegistry, chosenErrors);
        cache.reviews.push(...reviewResult);
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

async function askClientToReviewErrors(errors)
{
    for(const error of errors)
    {
        await showErrorInfo(error);
    }
    return await ask("Continue to review?");
}

/**
 * @returns {Array<Review>} The reviews generated for the list of errors.
 * If none were created, it will be an array of length 0.
 */
async function doReviewSession(reviewRegistry, errors)
{
    if (errors.length <= 0) throw new Error('Cannot review empty error list.');

    const reviewType = await chooseReviewType(reviewRegistry);
    const review = reviewRegistry.getReviewByType(reviewType);

    if (!review || typeof review.build !== 'function')
    {
        throw new Error('Cannot build review with review-only review type.');
    }

    return await review.build(errors);
}

async function chooseReviewType(reviewRegistry)
{
    const buildableReviewTypes = [];
    for(const reviewType of reviewRegistry.getReviewTypes())
    {
        const review = reviewRegistry.getReviewByType(reviewType);
        if ('build' in review && typeof review.build === 'function')
        {
            buildableReviewTypes.push(reviewType);
        }
    }
    const result = await askPrompt("What type of review do you want to make?", "autocomplete", {
        limit: 10,
        choices: buildableReviewTypes,
    });
    return result;
}

import * as Client from './Client.js';
import ReviewRegistry from '../review/ReviewRegistry.js';
import chalk from 'chalk';

/** Tries to resolve the errors with reviews. */
export async function run(db, config, errors, cache = {})
{
    cache.errors = errors;
    cache.reviews = [];

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

    try
    {
        const chosenErrorIDs = await askChooseError("What error do you want to review?", errors, errorMapping);
        if (!chosenErrorIDs) throw null;
        
        const chosenErrors = [];
        for(const chosenErrorID of chosenErrorIDs)
        {
            const error = errorMapping.get(Number(chosenErrorID));
            chosenErrors.push(error);
        }
    
        if (await askClientToReviewErrors(chosenErrors))
        {
            const reviewResult = await doReviewSession(db, config, ReviewRegistry, chosenErrors);
            cache.reviews.push(...reviewResult);
        }
    }
    catch(e)
    {
        if (e && e.message && e.message.length > 0)
        {
            throw e;
        }
        else
        {
            Client.error("Review interrupted. Restarting review session...", true);
        }
    }
}

async function askChooseError(message, errors, errorMapping)
{
    const choices = [];

    for(const error of errors)
    {
        console.log(error);
        if (!errorMapping.has(error.id)) throw new Error('Error map does not match error list.');
        choices.push({
            name: String(error.id),
            message: formatErrorAsChoice(error),
            value: String(error.id),
        });
    }
    choices.push(Client.CHOICE_SEPARATOR);

    return await Client.askPrompt(message, 'autocomplete', {
        multiple: true,
        limit: 4,
        choices,
        validate: (result, state) => {
            if (result.length <= 0) return "Must select at least one error (use 'space' to select).";

            // NOTE: Error ids are number types, but prompt values MUST be strings.
            let errorIds = result.map(value => Number(value));
            if (!errorMapping.has(errorIds[0])) return "This error can only be fixed in file.";

            const type = errorMapping.get(errorIds[0]).type;
            for(const errorID of errorIds)
            {
                const error = errorMapping.get(errorID);
                if (error.type !== type)
                {
                    return `Cannot batch process errors of different type (${type} != ${error.type})`;
                }
            }
            return true;
        }
    });
}

function formatErrorAsChoice(error)
{
    const first = ``;
    const second = `${chalk.gray(error.id + ': ')} ${error.message}`;
    let third;
    if (error.info && error.info.length > 70)
    {
        third = chalk.italic.gray(error.info.substring(0, 70));
    }
    else
    {
        third = chalk.italic.gray(error.info) || '';
    }
    return [first, second, third].join('\n');
}

async function askClientToReviewErrors(errors)
{
    // Show all solutions
    const solutions = new Set();
    for(const error of errors)
    {
        for(const option of error.options)
        {
            solutions.add(option);
        }
    }
    const errorSolutions = `${chalk.green(`${chalk.bold(`= Solutions: ${'='.repeat(67)}`)}\n => ${Array.from(solutions).join('\n => ')}\n${chalk.bold('='.repeat(80))}`)}`;
    Client.log(errorSolutions);

    // Show more info for each one...
    if (await Client.ask("Show more info?"))
    {
        for(const error of errors)
        {
            await showErrorInfo(error);
        }
    }

    return await Client.ask("Continue to review?");
}

async function showErrorInfo(error)
{
    if (!error) return;

    const errorMessage = `${chalk.gray(error.id + ':')} ${error.message}`;
    Client.error(errorMessage, true);

    const errorSolutions = `${chalk.green(`${chalk.bold(`= Solutions: ${'='.repeat(67)}`)}\n => ${error.options.join('\n => ')}\n${chalk.bold('='.repeat(80))}`)}`;
    Client.log(errorSolutions);

    const errorInfo = `${chalk.yellow(`${chalk.bold(`= More Info: ${'='.repeat(67)}`)}\n | ${error.more.join('\n')}\n${'='.repeat(80)}`)}`;
    Client.log(errorInfo);
}

/**
 * @returns {Array<Review>} The reviews generated for the list of errors.
 * If none were created, it will be an array of length 0.
 */
async function doReviewSession(db, config, reviewRegistry, errors)
{
    if (errors.length <= 0) throw new Error('Cannot review empty error list.');

    const reviewType = await chooseReviewType(reviewRegistry);
    const review = reviewRegistry.getReviewByType(reviewType);

    if (!review || typeof review.build !== 'function')
    {
        throw new Error('Cannot build review with review-only review type.');
    }

    // TODO: review.build() params should be changed to match (db, config, errors) for consistency.
    return await review.build(errors, db, config);
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
    const result = await Client.askPrompt("What type of review do you want to make?", "autocomplete", {
        limit: 10,
        choices: buildableReviewTypes,
    });
    return result;
}

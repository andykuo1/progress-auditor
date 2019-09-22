import { createReviewer } from '../helper/Reviewer.js';
import { createBuilder } from '../helper/ReviewBuilder.js';

/**
 * Every reviewer is expected to have at least a unique TYPE and a review function.
 * The build function is optional and only if users can change the review.
 */
export const TYPE = 'skip_error';
export const DESCRIPTION = 'Skip a specific error.';

/**
 * Applies the review to the database.
 * @param {Database} db The database.
 * @param {Config} config The config.
 */
export async function review(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE)
            .paramLength(1)
            .forEach(value =>
            {
                const { params } = value;
                const errorID = Number(params[0]);
                console.log(`...Skipping error ${errorID} by review...`);
                db.removeErrorByID(errorID);
            })
            .review(db, config);
    }
    catch(e)
    {
        Client.error(e);
        throw e;
    }
}

/**
 * Builds a review instance for the database, interactively.
 * @param {Array<Error>} [errors=[]] The errors this review build is in response to.
 */
export async function build(errors = [])
{
    const result = [];
    for(const error of errors)
    {
        result.push(await buildStep(error));
    }
    return result;
}

async function buildStep(error)
{
    return await createBuilder()
        .type(TYPE)
        .param(0, 'Error ID', 'The id of the error to skip.', error.id)
        .build();
}

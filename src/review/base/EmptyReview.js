import { createBuilder } from '../helper/ReviewBuilder.js';

const ERROR_TAG = 'REVIEW';

/**
 * Every reviewer is expected to have at least a unique TYPE and a review function.
 * The build function is optional and only if users can change the review.
 */
export const TYPE = 'empty';
export const DESCRIPTION = 'A placeholder review if you need one.';

/**
 * Applies the review to the database.
 * @param {Database} db The database.
 * @param {Config} config The config.
 */
export async function review(db, config)
{
    // console.log("Nice to meet you. I'm empty :D");
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
    // console.log("Just a placeholder, if you need it.");
    return await createBuilder()
        .type(TYPE)
        .param(0, 'Comment', 'Anything you want to say about this placeholder.')
        .build();
}

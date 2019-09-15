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
 * @param {Database} reviewDatabase The review database of all review instances to be applied.
 */
export async function review(db, config, reviewDatabase)
{
    console.log("Nice to meet you. I'm empty :D");
}

/**
 * Builds a review instance for the database, interactively.
 * @param {Database} db The database.
 * @param {Config} config The config.
 */
export async function build(db, config)
{
    console.log("Just a placeholder, if you need it.");
}

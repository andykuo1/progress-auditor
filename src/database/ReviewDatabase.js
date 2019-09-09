import * as Review from './Review.js';

/**
 * The key for the database to access Review data.
 */
export const REVIEW_KEY = 'review';

/**
 * The name of the output log for this data.
 */
const OUTPUT_LOG = 'db.review.log';

/**
 * Prepares the database to be used for reviews.
 * @param {Database} db The database to prepare the sub-database for.
 */
export function setupDatabase(db)
{
    if (!(REVIEW_KEY in db))
    {
        db[REVIEW_KEY] = new Map();
    }
    return db;
}

export function clearDatabase(db)
{
    if (REVIEW_KEY in db)
    {
        db[REVIEW_KEY].clear();
    }
    return db;
}

/**
 * Adds a review, by id, with the specified attributes.
 * @param {Database} db The current database to add to.
 * @param {*} reviewID The associated unique id for the review.
 * @param {Date} reviewDate The date the review was created.
 * @param {String} comment Comments related to this review.
 * @param {String} type The type of review. This is usually associated with a reviewer script.
 * @param {Array} params A variable length array of parameters for the review.
 */
export function addReview(db, reviewID, reviewDate, comment, type, params)
{
    const reviewMapping = db[REVIEW_KEY];

    if (reviewMapping.has(reviewID))
    {
        db.throwError(REVIEW_KEY, `Found duplicate id for review '${reviewID}'.`);
        return null;
    }
    else
    {
        const review = Review.createReview(reviewID, reviewDate, comment, type, params);
        reviewMapping.set(reviewID, review);
        return review;
    }
}

export function getReviews(db)
{
    return db[REVIEW_KEY].keys();
}

export function getReviewByID(db, reviewID)
{
    return db[REVIEW_KEY].get(reviewID);
}

export function getReviewTypes(db)
{
    const reviewMapping = db[REVIEW_KEY];
    const dst = new Set();
    for(const review of reviewMapping.values())
    {
        dst.add(review.type);
    }
    return dst;
}

/**
 * Outputs all information related to reviews in this database.
 * @param {Database} db The current database.
 * @param {String} outputDir The output directory that will contain the output log.
 */
export function outputLog(db, outputFunction, outputDir = '.')
{
    const reviewMapping = db[REVIEW_KEY];
    const result = {};
    for(const [key, value] of reviewMapping.entries())
    {
        result[key] = value;
    }
    
    const header = `${'# '.repeat(20)}\n# Reviews\n# Size: ${reviewMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    outputFunction(require('path').resolve(outputDir, OUTPUT_LOG), log);
}

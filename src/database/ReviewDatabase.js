const Review = require('./Review.js');

const REVIEW_KEY = 'review';
const OUTPUT_LOG = 'db.review.log';

function setupDatabase(db)
{
    if (!(REVIEW_KEY in db))
    {
        db[REVIEW_KEY] = new Map();
    }
    return db;
}

function addReview(db, reviewID, reviewDate, comment, type, params)
{
    const reviewMapping = db[REVIEW_KEY];

    if (reviewMapping.has(reviewID))
    {
        db.throwError(REVIEW_KEY, 'Found duplicate ids for reviews', reviewID);
        return null;
    }
    else
    {
        const review = Review.createReview(reviewID, reviewDate, comment, type, params);
        reviewMapping.set(reviewID, review);
        return review;
    }
}

function getReviews(db)
{
    return db[REVIEW_KEY].keys();
}

function getReviewByID(db, reviewID)
{
    return db[REVIEW_KEY].get(reviewID);
}

function outputLog(db, outputDir = '.')
{
    const reviewMapping = db[REVIEW_KEY];
    const result = {};
    for(const [key, value] of reviewMapping.entries())
    {
        result[key] = value;
    }
    
    const header = `${'# '.repeat(20)}\n# Reviews\n# Size: ${reviewMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    require('fs').writeFileSync(require('path').resolve(outputDir, OUTPUT_LOG), log);
}

module.exports = {
    REVIEW_KEY,
    setupDatabase,
    addReview,
    getReviews,
    getReviewByID,
    outputLog,
};
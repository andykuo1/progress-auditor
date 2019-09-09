import * as ReviewRegistry from '../../review/ReviewRegistry.js';
import * as ReviewDatabase from '../../database/ReviewDatabase.js';
import * as FileUtil from '../../util/FileUtil.js';

import * as ResolverRegistry from '../../review/ResolverRegistry.js';

export async function reviewDatabase(db, config)
{
    console.log('...Reviewing our work...');
    // Review data...
    for(const reviewID of ReviewDatabase.getReviews(db))
    {
        const review = ReviewDatabase.getReviewByID(db, reviewID);
        const reviewType = review.type;
        const reviewParams = review.params;

        const reviewer = ReviewRegistry.getReviewerByType(reviewType);
        await reviewer.review(db, reviewID, reviewType, reviewParams);
    }

    console.log('...Helping you resolve a few things...');
    // Resolve data...
    const resolvers = ResolverRegistry.getResolvers();
    for(const resolver of resolvers)
    {
        await resolver.resolve(db);
    }
}

export async function saveReviewsToFile(db, config, reviews)
{
    const path = require('path');
    
    const reviewTableHeader = [
        'Review ID',
        'Date',
        'Comment',
        'Type',
        'Param[0]',
        'Param[1]',
        'Param[2]',
        'Param[3]',
        '...'
    ];
    const reviewTable = [reviewTableHeader];
    for(const review of reviews)
    {
        const reviewEntry = [];
        // ID
        reviewEntry.push(review[0]);
        // Date
        reviewEntry.push(review[1]);
        // Comment
        reviewEntry.push(review[2]);
        // Type
        reviewEntry.push(review[3]);
        // Params
        reviewEntry.push(...review[4]);
        reviewTable.push(reviewEntry);
    }
    await FileUtil.writeTableToCSV(path.resolve(config.outputPath, `reviews-${db.currentDate.toISOString()}.csv`), reviewTable);
}

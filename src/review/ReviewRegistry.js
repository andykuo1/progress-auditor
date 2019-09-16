import * as Client from '../client/Client.js';

/**
 * Assumes all databases have been properly initialized with data. This
 * will try to resolve all issues through either interactive or automatic
 * reviews.
 * 
 * Interactive reviews require user input to resolve certain errors. These
 * interactions are saved into a "reviews" file to be parsed back later without
 * asking the user for the input again.
 * 
 * Automatic reviews do not have this limitation, therefore it is the preferred
 * way to resolve errors.
 */
class ReviewRegistry
{
    constructor()
    {
        this.reviewMap = new Map();
        this.priorityList = [];
    }
    
    /** The order in which the reviewer is registered is the order they execute. */
    register(review)
    {
        if (!review) throw new Error('Cannot register null reviews.');
        if (!('TYPE' in review) || !review.TYPE) throw new Error(`Not a valid review type - missing type. ${review}`)

        this.reviewMap.set(review.TYPE, review);
        this.priorityList.push(review.TYPE);
        
        return this;
    }

    /** Will apply the reviews to the database. */
    async applyReviews(db, config, reviewDatabase)
    {
        for(const reviewType of this.priorityList)
        {
            const review = this.reviewMap.get(reviewType);
            try
            {
                await review.review(db, config, reviewDatabase);
            }
            catch(e)
            {
                Client.skippedError('Failed to apply reviewer.', e);
            }
        }
    }

    getReviewByType(type)
    {
        return this.reviewMap.get(type);
    }

    getReviewTypes()
    {
        return this.reviewMap.keys();
    }
}

const INSTANCE = new ReviewRegistry();
export default INSTANCE;

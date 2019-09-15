import { createReviewer } from './helper/Reviewer.js';

const ERROR_TAG = 'REVIEW';

export const TYPE = 'null';
export const DESCRIPTION = 'Unknown review type.';

export async function review(db, config, reviewDatabase)
{
    try
    {
        await createReviewer(reviewDatabase)
            .type(TYPE)
            .forEach((value, key) =>
            {
                const { id, type } = value;
                db.throwError(ERROR_TAG, `Unhandled review type ${type} for review '${id}'.`, {
                    id: [id, type],
                    options: [
                        `You probably misspelled the review type.`,
                        `Ask the developer to handle a new '${type}' review type.`
                    ]
                });
            })
            .review();
    }
    catch(e)
    {
        db.throwError(ERROR_TAG, e);
    }
}

export const build = undefined;

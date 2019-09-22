import { createReviewer } from '../helper/Reviewer.js';

const ERROR_TAG = 'REVIEW';

export const TYPE = 'null';
export const DESCRIPTION = 'Unknown review type.';

export async function review(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE)
            .forEach(value =>
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
            .review(db, config);
    }
    catch(e)
    {
        Client.error(e);
        throw e;
    }
}

export const build = undefined;

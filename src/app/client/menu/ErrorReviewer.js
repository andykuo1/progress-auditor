import * as ReviewResolver from '../../../client/ReviewResolver.js';

export async function resolveErrors(db, config, errors)
{
    const cache = db.getCache().reviewSession = {};
    await ReviewResolver.run(errors, cache);
    if (cache.reviews && cache.reviews.length > 0)
    {
        // FIXME: this only accepts the first one. We should let them send multiple for batching.
        return cache.reviews;
    }
    else
    {
        return null;
    }
}

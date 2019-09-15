export function createReviewer(reviewDatabase)
{
    return {
        _reviews: reviewDatabase,
        _type: null,
        _paramLength: -1,
        _callback: null,
        async review()
        {
            const errors = [];
            this._reviews.forEach((value, key) =>
            {
                if (!this._type || value.type !== this._type) return;
                if (value.params.length < this._paramLength)
                {
                    errors.push(`Missing required params - expected at least ${this._paramLength} but was ${value.params.length} for '${value.type}': ${key}.`);
                    return;
                }

                try
                {
                    await this._callback.call(null, value, key);
                }
                catch(e)
                {
                    errors.push(`Failed to review - ${e.message}`);
                }
            });

            if (errors.length > 0)
            {
                throw errors;
            }
        },
        type(type)
        {
            this._type = type;
            return this;
        },
        paramLength(length)
        {
            this._paramLength = length;
            return this;
        },
        forEach(callback)
        {
            this._callback = callback;
            return this;
        }
    }
}

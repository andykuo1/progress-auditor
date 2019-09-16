import * as ReviewDatabase from '../../database/ReviewDatabase.js';

export function createReviewer()
{
    return {
        _type: null,
        _paramLength: -1,
        _callback: null,
        _async: false,
        async review(db, config)
        {
            const errors = [];
            const results = [];
            ReviewDatabase.forEach(db, (value, key) =>
            {
                if (!this._type || value.type !== this._type) return;
                if (value.params.length < this._paramLength)
                {
                    errors.push(`Missing required params - expected at least ${this._paramLength} but was ${value.params.length} for '${value.type}': ${key}.`);
                    return;
                }

                if (this._async)
                {
                    results.push(
                        this._callback.call(null, value, key)
                            .catch(e => errors.push(`Failed to review - ${e.message}`))
                    );
                }
                else
                {
                    try
                    {
                        results.push(Promise.resolve(this._callback.call(null, value, key)));
                    }
                    catch(e)
                    {
                        errors.push(`Failed to review - ${e.message}`);
                    }
                }
            });

            // Resolve all for each callback promises...
            await Promise.all(results);

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
            this._async = false;
            return this;
        },
        forEachAsync(callback)
        {
            this._callback = callback;
            this._async = true;
            return this;
        }
    }
}

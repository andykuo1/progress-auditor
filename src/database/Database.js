import { stringHash } from '../util/MathHelper.js';

/**
 * Creates a database to hold all your data :)
 * 
 * It also has some extra error-handling to help you log errors.
 */
export function createDatabase()
{
    return {
        _registry: {},
        _errors: new Map(),
        throwError(message, opts = {})
        {
            let id;
            if ('id' in opts)
            {
                if (Array.isArray(opts.id))
                {
                    id = stringHash(opts.join('.'));
                }
                else if (typeof opts.id !== 'number')
                {
                    id = stringHash(JSON.stringify(opts.id));
                }
                else
                {
                    id = opts.id;
                }
            }
            else
            {
                id = this._errors.size;
            }
            
            // Find a valid error id.
            let MAX_ITERATIONS = 1000;
            while (MAX_ITERATIONS-- >= 0 && this._errors.has(id)) ++id;

            // There's just too much.
            if (MAX_ITERATIONS <= 0) throw new Error('Invalid error id - too many errors.');

            const dst = {
                id,
                message,
                options: []
            };
            
            if ('options' in opts)
            {
                if (Array.isArray(opts.options))
                {
                    for(const option of opts.options)
                    {
                        dst.options.push(option);
                    }
                }
                else
                {
                    dst.options.push(option);
                }
            }

            this._errors.set(id, opts);
        },
        clearErrors()
        {
            this._errors.clear();
        },
        getErrors()
        {
            return Array.from(this._errors.values());
        }
    };
}

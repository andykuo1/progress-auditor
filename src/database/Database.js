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
        throwError(tag, message, opts = {})
        {
            // Try to deterministically generate an id for the error.
            let id;
            if (typeof opts === 'object' && 'id' in opts)
            {
                if (Array.isArray(opts.id))
                {
                    id = stringHash(opts.id.join('.'));
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
                // If all else fails, I hope the program is mostly deterministic...
                id = this._errors.size;
            }
            
            // Find a valid error id.
            let MAX_ITERATIONS = 1000;
            while (MAX_ITERATIONS-- >= 0 && this._errors.has(id)) ++id;

            // There's just too much.
            if (MAX_ITERATIONS <= 0) throw new Error('Invalid error id - too many errors.');

            const dst = {
                id,
                tag,
                message,
                options: [],
                more: [],
                toString() { return `${id} [${tag}] ${message}`; }
            };

            if (typeof opts === 'string')
            {
                dst.options.push(opts);
            }
            else if (typeof opts === 'object')
            {
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

                if ('more' in opts)
                {
                    dst.more = opts.more;
                }
            }

            this._errors.set(id, dst);
        },
        removeErrorByID(id)
        {
            if (typeof id !== 'number') throw new Error('Error id must be a number.');

            if (this._errors.has(key))
            {
                this._errors.delete(id);
                return true;
            }
            return false;
        },
        getErrorByID(id)
        {
            if (typeof id !== 'number') throw new Error('Error id must be a number.');

            return this._errors.get(id);
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

/**
 * This file handles the common lifecycle of a resolution process.
 * 
 * Generally, the program would need some kind of input from the
 * client. And the input must be valid. Therefore, if the client
 * provides invalid input, the process should start over and ask
 * for a valid answer again. This handles that.
 * 
 * @module Resolver
 */

import { ask } from '../Client.js';

export function ifFailAndAgain(message, expected = true)
{
    return async result => !result && (Boolean(await ask(message)) === expected);
}

export function ifFailOrAgain(message, expected = true)
{
    return async result => !result || (Boolean(await ask(message)) === expected);
}

export function createResolver()
{
    return {
        _init: () => true,
        _run: () => null,
        _error: null,
        _validate: value => value,
        _again: () => false,
        async resolve()
        {
            try
            {
                let answer = false;
                if (typeof this._init === 'string')
                {
                    answer = await ask(this._init);
                }
                else if (typeof this._init === 'function')
                {
                    answer = this._init.call(null);
                }

                if (answer)
                {
                    let result = null;
                    let running = false;
                    do
                    {
                        running = false;
                        try
                        {
                            result = await this._run.call(null);
                        }
                        catch(e)
                        {
                            if (typeof this._error === 'function')
                            {
                                result = this._error.call(null, e);
                            }
                            else
                            {
                                result = this._error;
                            }
                        }

                        // Try again maybe?
                        if (typeof this._again === 'function')
                        {
                            if (await this._again.call(null, result))
                            {
                                running = true;
                            }
                        }
                        else if (typeof this._again === 'string')
                        {
                            if (await ask(this._again))
                            {
                                running = true;
                            }
                        }
                    }
                    while(running);

                    return result;
                }

                return undefined;
            }
            catch(e)
            {
                if (typeof this._error === 'function')
                {
                    return this._error.call(null, e);
                }
                else
                {
                    return this._error;
                }
            }
        },
        init(value)
        {
            this._init = value;
            return this;
        },
        run(callback)
        {
            this._run = callback;
            return this;
        },
        error(callback)
        {
            this._error = callback;
            return this;
        },
        again(value)
        {
            this._again = value;
            return this;
        }
    }
};

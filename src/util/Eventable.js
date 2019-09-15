/*
The MIT License

Copyright (c) 2019 Andrew Kuo

Permission is hereby granted, free of charge, 
to any person obtaining a copy of this software and 
associated documentation files (the "Software"), to 
deal in the Software without restriction, including 
without limitation the rights to use, copy, modify, 
merge, publish, distribute, sublicense, and/or sell 
copies of the Software, and to permit persons to whom 
the Software is furnished to do so, 
subject to the following conditions:

The above copyright notice and this permission notice 
shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES 
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR 
ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

const EventableInstance = {
    on(event, callback, handle = callback)
    {
        let callbacks;
        if (!this.__events.has(event))
        {
            callbacks = new Map();
            this.__events.set(event, callbacks);
        }
        else
        {
            callbacks = this.__events.get(event);
        }

        if (!callbacks.has(handle))
        {
            callbacks.set(handle, callback);
        }
        else
        {
            throw new Error(`Found callback for event '${event}' with the same handle '${handle}'.`);
        }
        return this;
    },
    off(event, handle)
    {
        if (this.__events.has(event))
        {
            const callbacks = this.__events.get(event);
            if (callbacks.has(handle))
            {
                callbacks.delete(handle);
            }
            else
            {
                throw new Error(`Unable to find callback for event '${event}' with handle '${handle}'.`);
            }
        }
        else
        {
            throw new Error(`Unable to find event '${event}'.`);
        }
        return this;
    },
    once(event, callback, handle = callback)
    {
        const func = (...args) => {
            this.off(event, handle);
            callback(...args);
        };
        return this.on(event, func, handle);
    },
    emit(event, ...args)
    {
        if (this.__events.has(event))
        {
            const callbacks = Array.from(this.__events.get(event).values());
            for(const callback of callbacks)
            {
                callback(...args);
            }
        }
        else
        {
            this.__events.set(event, new Map());
        }
        return this;
    }
};

const Eventable = {
    create()
    {
        const result = Object.create(EventableInstance);
        result.__events = new Map();
        return result;
    },
    assign(dst)
    {
        const result = Object.assign(dst, EventableInstance);
        result.__events = new Map();
        return result;
    },
    mixin(targetClass)
    {
        const targetPrototype = targetClass.prototype;
        Object.assign(targetPrototype, EventableInstance);
        targetPrototype.__events = new Map();
    }
};

export default Eventable;

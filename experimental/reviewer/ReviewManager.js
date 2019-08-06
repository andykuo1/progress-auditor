class ReviewManager
{
    constructor()
    {
        this.handlers = new Map();
    }

    register(reviewType, handler)
    {
        this.handlers.set(reviewType, handler);
    }

    unregister(reviewType)
    {
        this.handlers.delete(reviewType);
    }

    has(reviewType)
    {
        return this.handlers.has(reviewType);
    }

    get(reviewType)
    {
        return this.handlers.get(reviewType);
    }

    values()
    {
        return this.handlers.values();
    }
}

const INSTANCE = new ReviewManager();
module.exports = INSTANCE;
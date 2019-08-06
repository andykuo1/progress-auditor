class ParserManager
{
    constructor()
    {
        this.parsers = new Map();
    }

    register(parserOpts)
    {
        this.parsers.set(parserOpts, handler);
    }

    unregister(parserOpts)
    {
        this.parsers.delete(parserOpts);
    }

    has(parserOpts)
    {
        return this.parsers.has(parserOpts);
    }

    get(parserOpts)
    {
        return this.parsers.get(parserOpts);
    }

    values()
    {
        return this.parsers.values();
    }
}

const INSTANCE = new ParserManager();
module.exports = INSTANCE;
const PROCESSORS = new Map();
registerEvent('post');

export function registerEvent(event)
{
    if (!PROCESSORS.has(event))
    {
        PROCESSORS.set(event, []);
    }
    else
    {
        throw new Error('Event already registered.');
    }
}

export function addProcessor(event, processor)
{
    if (PROCESSORS.has(event))
    {
        const processors = PROCESSORS.get(event);
        processors.push(processor);
    }
    else
    {
        throw new Error(`Unknown processor event '${event}'.`);
    }
}

export function getProcessors(event)
{
    if (PROCESSORS.has(event))
    {
        return PROCESSORS.get(event);
    }
    else
    {
        throw new Error(`Unknown processor event '${event}'.`);
    }
}

export async function runProcessors(db, config, event)
{
    // Resolve database...
    const processors = getProcessors(event);
    const results = [];
    for(const processor of processors)
    {
        // console.log(`.........Processing with '${path.basename(resolverConfig.filePath)}'...`);
        results.push(processor.resolve(db, config));
    }
    return Promise.all(results);
}

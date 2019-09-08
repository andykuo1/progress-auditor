export function findOutputEntries(config)
{
    console.log("...Finding output entries...");
    if (Array.isArray(config.outputs))
    {
        return config.outputs;
    }
    else
    {
        return [];
    }
}

export function processOutputEntry(db, config, outputEntry)
{
    console.log("...Process output entry...");
}

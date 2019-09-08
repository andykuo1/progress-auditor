export const ASSIGNERS = new Map();

export function registerAssigner(name, assigner, pattern, opts)
{
    ASSIGNERS.set(name, [assigner, pattern, name, opts]);
}

export function hasAssignerByName(name)
{
    return ASSIGNERS.has(name);
}

export function getAssignerByName(name)
{
    if (ASSIGNERS.has(name))
    {
        return ASSIGNERS.get(name);
    }
    else
    {
        return ASSIGNERS.get('null');
    }
}

export function getAssigners()
{
    return ASSIGNERS.values();
}

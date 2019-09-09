const RESOLVERS = new Set();

export function registerResolver(resolver)
{
    RESOLVERS.add(resolver);
}

export function getResolvers()
{
    return RESOLVERS;
}

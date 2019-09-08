export const PARSERS = new Set();

export function registerParser(parser, inputFilePath, parserType, opts)
{
    PARSERS.add([parser, inputFilePath, parserType, opts]);
}

export function getParsers()
{
    return PARSERS.values();
}

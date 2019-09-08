import * as ProcessorPipeline from '../ProcessorPipeline.js';

/**
 * Assumes processors have already been registered.
 * @param {Database} db The database to resolve data for.
 * @param {Object} config The config.
 */
export async function processDatabase(db, config)
{
    // Resolve database...
    const processors = ProcessorPipeline.getProcessors('post');
    const results = [];
    for(const processor of processors)
    {
        // console.log(`.........Resolving with '${path.basename(resolverConfig.filePath)}'...`);
        results.push(processor.resolve(db));
    }
    return Promise.all(results);
}

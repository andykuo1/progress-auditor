import * as Client from '../../../client/Client.js';
const path = require('path');
const fs = require('fs');

export const DEFAULT_CONFIG_FILE_NAME = 'config.json';

/**
 * Loads the config from the filepath. If there exists the 'include' property, it will
 * resolve those dependencies such that they are given priority and loaded first, in the
 * order defined, before this config. Any conflicting properties between configs are
 * either overridden or merged in the order visited. In other words, the last config in
 * the include list will override the first config. If the first config also has an
 * include list, those will load first, and therefore also be overriden by the last config.
 * And this "root" config will override all of them. If the property overriden is an array,
 * it will attempt to merge them instead.
 * 
 * @param {String} configPath The path to the config file.
 * @returns {Object} The config loaded from this file.
 */
export async function loadConfig(configPath)
{
    let parentConfig;
    let parentDir;
    try
    {
        configPath = findValidConfigFilePath(configPath);
        parentDir = path.dirname(configPath);
    }
    catch(e)
    {
        Client.error(`...Cannot find config at '${configPath}'...`, true);
        return Promise.reject(e);
    }

    try
    {
        const data = fs.readFileSync(configPath);
        parentConfig = JSON.parse(data);
    }
    catch(e)
    {
        return Promise.reject([`Failed to parse config file:`, '=>', e, '<=']);
    }

    parentConfig = resolveConfigPaths(parentDir, parentConfig);

    if ('include' in parentConfig)
    {
        const errors = [];
        const configs = [];
        for(const includePath of parentConfig.include)
        {
            try
            {
                const childConfig = await loadConfig(includePath);
                configs.push(childConfig);
            }
            catch(e)
            {
                errors.push(e);
            }
        }

        if (errors.length > 0)
        {
            return Promise.reject([`Failed to resolve config includes:`, '=>', errors, '<=']);
        }

        const mergedConfig = configs.reduce((prev, current) => mergeConfigs(current, prev), {});
        parentConfig = mergeConfigs(parentConfig, mergedConfig);
    }

    return parentConfig;
}

function findValidConfigFilePath(filepath)
{
    if (!fs.existsSync(filepath))
    {
        throw new Error(`Cannot find non-existant path '${filepath}'.`);
    }

    if (fs.lstatSync(filepath).isDirectory())
    {
        const dirpath = filepath;
        filepath = path.resolve(dirpath, DEFAULT_CONFIG_FILE_NAME);

        if (!fs.existsSync(filepath))
        {
            throw new Error(`Cannot find config file in directory '${dirpath}'.`);
        }
    }

    return filepath;
}

function resolveConfigEntry(parentPath, key, value)
{
    if (key.toLowerCase().endsWith('path'))
    {
        return resolveConfigPathEntry(parentPath, value);
    }
    else if (Array.isArray(value))
    {
        let result = [];
        for(const index in value)
        {
            result.push(resolveConfigEntry(parentPath, index, value[index]));
        }
        return result;
    }
    else if (typeof value === 'object')
    {
        let result = {};
        for(const [objectKey, objectValue] of Object.entries(value))
        {
            result[objectKey] = resolveConfigEntry(parentPath, objectKey, objectValue);
        }
        return result;
    }
    else
    {
        return value;
    }
}

function resolveConfigPathEntry(parentPath, value)
{
    if (Array.isArray(value))
    {
        let result = [];
        for(const entry of value)
        {
            result.push(resolveConfigPathEntry(parentPath, entry));
        }
        return result;
    }
    else if (typeof value === 'object')
    {
        return resolveConfigPaths(parentPath, value);
    }
    else if (typeof value === 'string')
    {
        // TODO: Implement path macros.
        // const index = value.indexOf('$EXEC_PATH');

        // Don't resolve for absolute or home paths.
        if (value.startsWith('/') || value.startsWith('~/'))
        {
            return path.resolve(value);
        }
        // Do resolve for relative paths.
        else
        {
            return path.resolve(parentPath, value);
        }
    }
    else
    {
        return value;
    }
}

function resolveConfigPaths(parentPath, config)
{
    const result = resolveConfigEntry(parentPath, '', config);

    // Overwrite 'include' and treat it as a path entry.
    if ('include' in config && Array.isArray(config.include))
    {
        result.include = config.include.map((value) => resolveConfigPathEntry(parentPath, value));
    }

    return result;
}

function mergeConfigs(src, dst)
{
    for(const [key, value] of Object.entries(src))
    {
        if (key in dst)
        {
            if (Array.isArray(dst[key]))
            {
                if (Array.isArray(value))
                {
                    dst[key] = dst[key].concat(value);
                }
                else
                {
                    dst[key].push(value);
                }
            }
        }
        else
        {
            dst[key] = src[key];
        }
    }
    return dst;
}

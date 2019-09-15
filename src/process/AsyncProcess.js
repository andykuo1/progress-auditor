class AsyncProcess
{
    constructor(defaultResult = undefined)
    {
        this.eventHandlers = new Map();
        this.defaultResult = defaultResult;
        this.result = defaultResult;
        this.ready = false;
    }

    async onSetUp()
    {
        const setupCallback = this.eventHandlers.get('setup');
        if (setupCallback) await setupCallback(this);
    }

    async onRun()
    {
        const runCallback = this.eventHandlers.get('run');
        if (runCallback) this.result = await runCallback(this);
    }

    async onContinue()
    {
        const continueCallback = this.eventHandlers.get('continue');
        if (continueCallback) return await continueCallback(this);
        return false;
    }

    async onTearDown()
    {
        const teardownCallback = this.eventHandlers.get('teardown');
        if (teardownCallback) await teardownCallback(this);
    }

    async onError(e)
    {
        const errorCallback = this.eventHandlers.get('error');
        if (!errorCallback || !await errorCallback(this, e))
        {
            throw e;
        }
    }

    async onComplete()
    {
        const completeCallback = this.eventHandlers.get('complete');
        if (completeCallback) await completeCallback(this, this.result);
    }

    async run()
    {
        if (!this.ready)
        {
            this.ready = true;
            await this.onSetUp();
        }

        let running = true;
        do
        {
            running = false;
            try
            {
                await this.onRun();

                running = await this.onContinue();
                if (typeof running !== 'boolean')
                {
                    console.error(`Invalid continue type - expected boolean but found '${running}'.`);
                }
            }
            catch(e)
            {
                // It could be an interrupt, which should be okay.
                if (e instanceof Error)
                {
                    await this.onError(e);
                }
                else
                {
                    // Adds a new line to separate the cancelled prompt.
                    this.log();
                }

                running = await this.onContinue();
                if (typeof running !== 'boolean')
                {
                    console.error(`Invalid continue type - expected boolean but found '${running}'.`);
                }
            }
            finally
            {
                if (!running)
                {
                    if (this.ready)
                    {
                        this.ready = false;
                        await this.onTearDown();
                    }
                }
            }
        }
        while(running);

        await this.onComplete();
        return this.result;
    }

    when(event, callback)
    {
        this.eventHandlers.set(event, callback);
        return this;
    }
}

export default AsyncProcess;

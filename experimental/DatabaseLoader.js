const Database = require('./database/Database.js');
const UserDatabase = require('./database/UserDatabase.js');
const ScheduleDatabase = require('./database/ScheduleDatabase.js');
const SubmissionDatabase = require('./database/SubmissionDatabase.js');
const AssignmentDatabase = require('./database/AssignmentDatabase.js');
const ReviewDatabase = require('./database/ReviewDatabase.js');

class DatabaseLoader
{
    constructor(config)
    {
        this.config = config;
        this.db = null;
    }

    async setup(config = {})
    {
        const cfg = Object.assign({}, this.config, config);
        const db = Database.createDatabase();
        UserDatabase.setupDatabase(db);
        ScheduleDatabase.setupDatabase(db);
        SubmissionDatabase.setupDatabase(db);
        AssignmentDatabase.setupDatabase(db);
        ReviewDatabase.setupDatabase(db);

        this.db = db;
        return this;
    }

    async load(config = {})
    {
        const cfg = Object.assign({}, this.config, config);
        const db = this.db;
        return this;
    }

    async resolve(config = {})
    {
        const cfg = Object.assign({}, this.config, config);
        const db = this.db;
        return this;
    }

    async output(config = {})
    {
        const cfg = Object.assign({}, this.config, config);
        const db = this.db;
        return this;
    }
}

module.exports = DatabaseLoader;
function createDatabase()
{
    return {
        user: new Map(),
        submission: new Map(),
        review: new Map(),
        vacation: new Map(),
    };
}

function getUserByID(database, id)
{
    database.user.get(id);
}

db.user(userID).getPosts();
db.user(userID).getEmail();
db.user(userID).getName();
db.user(userID).getVacations();
db.user(userID).getPosts(new Date(), new Date());
db.user(userID).getUsedSlipDays();
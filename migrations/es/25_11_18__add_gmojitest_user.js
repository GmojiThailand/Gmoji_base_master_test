/* Migration: add GmojiTest user
   Run with: mongo <this-file>  OR mongosh <this-file>
*/

db = connect('localhost:27017/api-factory');

// Application-specific user collection used in other migrations
const usersColl = db.user_587640c995ed3c0c59b14600;

// Insert user: username=GmojiTest password=Pass (MD5 stored)
usersColl.save({
    username: 'GmojiTest',
    password: 'b9b57aae83585e17ede4570dcede353c',
    role: ObjectId('58b40f669154c320f9831bfa'), // USER role
    type: 'oauth',
    createdAt: new Date(),
    updatedAt: new Date()
});

print('Migration add_gmojitest_user finished.');

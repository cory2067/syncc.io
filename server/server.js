import { Documents } from '../collections/files'

Documents.allow({
    'insert': function(userId, doc) {
        return true;
    },
    'remove': function(userId, doc) {
        return true;
    }
});

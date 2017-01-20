import { Meteor } from 'meteor/meteor';
import { Changes } from '../collections/changes'

Meteor.startup(() => {
});

Meteor.methods({
    logServer: function(msg) {
        console.log(msg);
    },
    parseZip: function(file) {
        console.log("Unzipping zip"+file);
    },
    deleteChanges: function(editor, file){
        Changes.remove({editor: editor, file: file});
    }
});

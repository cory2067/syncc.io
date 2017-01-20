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
    deleteChanges: function(params){
        Changes.remove({editor: params[0], file: params[1]});
    }
});

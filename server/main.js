import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
});

Meteor.methods({
    logServer: function(msg) {
        console.log(msg);
    },
    parseZip: function(file) {
        console.log("Unzipping zip"+file);
    }
});

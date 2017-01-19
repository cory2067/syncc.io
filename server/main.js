import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
});

Meteor.methods({
  logServer: function(msg) {
    console.log(msg)
  }
});

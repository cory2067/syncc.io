import { Meteor } from 'meteor/meteor';
import { Changes } from '../collections/changes';

Meteor.startup(() => {
});

Meteor.methods({
  logServer: function(msg) {
    console.log(msg)
  }
});

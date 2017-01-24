import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Random } from 'meteor/random'
import { EditUsers } from '../collections/editusers';
import { Session } from 'meteor/session'
import './main.html';

Meteor.startup(function(){
    $(window).bind('beforeunload', function() {
        Session.set("editing", false)
    });
});

Tracker.autorun(function (c) {
  if(!Session.get("editing") && Session.get("userId")) {
    EditUsers.remove({_id : Session.get("userId")});
    Session.set("userId", null)
  }
});

//gross repeating the same helper
Template.Header.helpers({
    newEditor() {
      return Random.id(8);
    }
});
Template.HomePage.helpers({
    getUser() {
      a= Meteor.user();
      if(a) {
        a['email'] = a['emails'][0]['address']
        a['name'] = a['email'].split("@")[0]
        return a.name;
      }
      else {
        return '';
      }
    }
});
Template.HomePage.onCreated(()=>{
  Meteor.subscribe("documents");
});
Template.HomePage.events({
    'click #demoEditor': function(event, template) {
        console.log("making new file");
        var nameInput = Random.id(8)+'.py';
        Meteor.call('newFile', [nameInput, Meteor.userId()], function() {
          Meteor.call("getPath", function(err, path) {
            var full = path + "/files/" + nameInput;
            var found = Documents.find({path: full}).fetch()
            if(found.length > 1) {
              alert("Please choose a unique file name!");
            } else if(found.length == 1) {
              window.location.href = "/" + found[0]['_id'];
            }
          });
        });
    }
});

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
    newEditor() {
      return Random.id(8);
    },
    getUser() {
      a= Meteor.user();
      if(a) {
        a['email'] = a['emails'][0]['address']
        a['name'] = a['email'].split("@")[0]
        return a;
      }
      else {
        return {"name": ""};
      }
    }
});

Template.HomePage.onRendered(function () {
    /*$("body").click(function() {
      if($('.login-close-text')[0]) {
        $(".login-close-text")[0].click();
      }
      //add exclude if in the accounts-dialog div
    });*/

  this.$('#jstree').jstree({
    core: {
      themes: {
        name: 'proton',
        dots: true,
        icons: true,
        responsive: true
      },
      data: [{
        text: 'Root node', 'children': [{
          text: 'Child node 1'
        }, {
          text: 'Child node 2'
        }]
      }]
    }
  });
});

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
    //Meteor.call("logServer", "closed client " + Session.get("userId"));
    Session.set("userId", null)
  }
});

Template.hello.onCreated(function helloOnCreated() {
  // counter starts at 0
  this.counter = new ReactiveVar(0);
});

Template.hello.helpers({
  counter() {
    return Template.instance().counter.get();
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
    }
});

Template.HomePage.onRendered(function () {
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

Template.hello.events({
  'click button'(event, instance) {
    var editor = $('.CodeMirror')[0].CodeMirror;
    var line = editor.getLine(0);
    editor.replaceRange("new stuff\n", {line:0,ch:0}, {line:0,ch:line.length}, origin="ignore");
    // increment the counter when button is clicked
    instance.counter.set(instance.counter.get() + 1);
  },
});

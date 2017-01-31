import { Template } from 'meteor/templating';
import { Documents } from '../collections/files'
import { Profiles } from '../collections/profiles'
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
    },
    loading() {
      return Session.get("loadingDemo");
    }
});
Template.HomePage.onCreated(()=>{
  Meteor.subscribe("documents");
  Meteor.subscribe("profiles", function() {
    var user  = Profiles.find({user: Meteor.userId()}).fetch();
    console.log(user);
    if(!user.length) {
      Profiles.insert({user: Meteor.userId(), bio: "", friends: []});
    }
    console.log(Profiles.find().fetch());
  });
  Session.set("loadingDemo", false);
});
Template.HomePage.events({
    'click #demoEditor': function(event, template) {
        Session.set("loadingDemo", true);
        console.log("making new file");
        var nameInput = Random.id(8)+'.py';
        Meteor.call('newFile', [nameInput, "demo"], function() {
          Meteor.call("getPath", function(err, path) {
            var full = path + "/files/demo/" + nameInput;
            console.log(full);
            console.log("why th efuck doesnt this work");
            var found = Documents.find({path: full}).fetch()
            Session.set("loadingDemo", false);
            window.location.href = "/" + found[0]['_id'];
          });
        });
    }
});

Template.ProfilePage.onRendered(()=>{
});

Template.ProfilePage.helpers({
    getUser() {
      a= Meteor.user();
      if(a) {
        a['email'] = a['emails'][0]['address']
        a['name'] = a['email'].split("@")[0]
        a['first'] = a['name'][0]
        return a;
      }
      else {
        return '';
      }
    },
    friends() {
      var user = Profiles.find({user: Meteor.userId()}).fetch()
      if(!user.length) { return [] }
      return user[0].friends;
    },
    bio() {
      var user = Profiles.find({user: Meteor.userId()}).fetch()
      if(!user.length) { return '' }
      return user[0].bio;
    }
});

Template.ProfilePage.events({
  'click #loadBioEdit': function(e) {
    $("#bioField")[0].innerHTML = Profiles.find({user:Meteor.userId()}).fetch()[0].bio;
  },
    'click #bioSubmit': function(e) {
      e.preventDefault();
      id = Profiles.find({user: Meteor.userId()}).fetch()[0]._id
      val = $("#bioField")[0].value;
      Profiles.update(id, {$set: {bio: val}});
      $("#bioInput").toggleClass("toggled");
      $("#Bio").toggleClass("toggled");
    }
})

Template.newFileModal.events({
  'click #cloneGitRepo': function() {
      var repo = $("#repoURL").val();
      console.log(repo);
      Session.set("loading", true);
      Meteor.call("gitClone", repo, function(e) {
        Meteor.call("updateJSON", Meteor.userId());
        Session.set("foldersRendered", Random.id());;
        Session.set("loading", false);
      });
    },
  'click #createNewFile': function(event, template) {
  $(function(){
    console.log("---------------------------------main start");
    var nameInput = $("#fileName").val()
    if(!nameInput) {
      alert("Illegal name!");
      return;
    }
    console.log(nameInput);
    Meteor.call("getPath", function(err, path) {
      var full = path + "/files/" + Meteor.userId()+"/"+nameInput;
      var found = Documents.find({path: full}).fetch()
      if(found.length > 0) {
        alert("Please give your file a unique name!");
        return;
      }
      Meteor.call('newFile', [nameInput, Meteor.userId()], function() {
          var found = Documents.find({path: full}).fetch()
          if(found.length > 1) {
            alert("I honestly have no idea how this happened. Where did I go wrong? Why is our code so buggy?");
          } else if(found.length == 1) {
            window.location.href = "/" + found[0]['_id'];
          }
          else {
            alert("File creation failed D:");
          }
          Meteor.call("updateJSON", Meteor.userId());
      });
      console.log("------------------------------main end");
    });
  });
  }
});

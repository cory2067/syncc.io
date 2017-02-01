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
  Meteor.subscribe("userList");
  Meteor.subscribe("documents");
  Meteor.subscribe("profiles", function() {
    var user  = Profiles.find({user: Meteor.userId()}).fetch();
    console.log(user);
    if(!user.length) {
      Profiles.insert({user: Meteor.userId(), bio: "", friends: [], added: 0, removed: 0});
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
        Meteor.call('newFile', [nameInput, "demo",""], function() {
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
    /*randomColor() {
      var seed = Meteor.userId();
      var meme = 0;
      for(var p=0; p<16; p++) {
        meme += seed.charCodeAt(p) * 3**p;
      }
      console.log(meme);
      var x = Math.sin(meme) * 10000;
      return (x - Math.floor(x)).toString(16).substr(-6);
    },*/
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
      for(var q=0; q<user[0].friends.length; q++) {
        var userPro = Profiles.find({user: user[0].friends[q]}).fetch()[0];
        user[0].friends[q] = {name: Meteor.users.find(user[0].friends[q]).fetch()[0]['emails'][0]['address'],
                              added: userPro['added'], removed: userPro['removed']}
      }
      console.log(user[0].friends);
      return user[0].friends;
    },
    bio() {
      var user = Profiles.find({user: Meteor.userId()}).fetch()
      if(!user.length) { return '' }
      return user[0].bio;
    },
    stats() {
      var user = Profiles.find({user: Meteor.userId()}).fetch()
      if(!user.length) { return {added: 0, removed: 0} }
      return {added: user[0].added, removed: user[0].removed};
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
    },
    'click #collabBtn': function(e) {
      val = $("#collabUser").val();
      Meteor.call("addFriend", val, function(e,r) {
        if(r == 'err') {
          ErrorMessage("user");
          $("#errorBtn").click();
        }
      });
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
      $("#errorBtn").click();
      ErrorMessage("name");
      //alert("Illegal name!");
      return;
    }
    console.log(nameInput);
    Meteor.call("getPath", function(err, path) {
      if (!Session.get('pathString')) {
          var full = path + "/files/" +Meteor.userId() +"/"+nameInput;
      } else {
        var full = path + "/files" + Session.get('pathString')+"/"+nameInput;
      }
      var found = Documents.find({path: full}).fetch()
      if(found.length > 0) {
        $("#errorBtn").click();
        ErrorMessage("uniqueName")
        //alert("Please give your file a unique name!");
        return;
      }
      Meteor.call('newFile', [nameInput, Meteor.userId(), full], function() {
          var found = Documents.find({path: full}).fetch()
          if(found.length > 1) {
            $("#errorBtn").click();
            ErrorMessage("why");
            //alert("I honestly have no idea how this happened. Where did I go wrong? Why is our code so buggy?");
          } else if(found.length == 1) {
            window.location.href = "/" + found[0]['_id'];
          }
          else {
            $("#errorBtn").click();
            ErrorMessage("fileFail");
            //alert("File creation failed D:");
          }
          Meteor.call("updateJSON", Meteor.userId());
      });
      console.log("------------------------------main end");
    });
  });
  },
  'click #createNewFolder': function(event, template) {
  $(function(){
    console.log("---------------------------------main start");
    Session.set('loading', true);
    var nameInput = $("#folderName").val()
    if(!nameInput) {
      $("#errorBtn").click();
      ErrorMessage("folderFail");
      //alert("Illegal name!");
      return;
    }
    console.log(nameInput);
    Meteor.call("getPath", function(err, path) {
      var full = path + "/files" + Session.get('pathString')+"/"+nameInput;
      var found = Documents.find({path: full}).fetch();
      Meteor.call('newFolder', [nameInput, Meteor.userId(),full], function() {
          Meteor.call("updateJSON", Meteor.userId());
      });
      console.log("------------------------------main end");
      Session.set("foldersRendered", Random.id());;
      Session.set('loading', false);
    });
  });
  }
});

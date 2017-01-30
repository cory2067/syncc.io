import { Meteor } from 'meteor/meteor';
import { Documents } from '../../collections/files'
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var'
import { Session } from 'meteor/session'
import { Random } from 'meteor/random'

import path from 'path';
import fs from 'fs';

Template.ProjectList.onCreated(()=>{
    Meteor.subscribe('currjson');
    Meteor.subscribe('documents');
    Meteor.subscribe('editusers');
    Session.set('pathString', "/"+Meteor.userId());
    Session.set('currPath', [Meteor.userId()]);
    Session.set('foldersRendered', "meme");
    Session.set("loading", false);
    Session.set("searchQuery", '')
    Meteor.subscribe("userList");
});

Template.ProjectList.helpers({
    loading: function() {
      return Session.get("loading");
    },
    collabDocs: function() {
        console.log("the things")
        console.log(Documents.find().fetch());
        var a = Documents.find({"collab": Meteor.userId()}).fetch();
        console.log(a);
        b = []
        var query = Session.get("searchQuery");
        for(var q=0; q<a.length; q++) {
          a[q]['owner'] = Meteor.users.find(a[q]['userId']).fetch()[0]['emails'][0]['address']
          if(a[q]['name'].toLowerCase().indexOf(query) > -1)
            b.push(a[q]);
        }
        return a;
    },
    //get docs in path
    docs: function () {
        Meteor.call('makeDir');
        console.log("getting relevant docs");

        var pathString = Session.get('pathString');
        //get path
        console.log("Current path string is "+pathString);
        var fullPath = pathString;
        console.log("path to show: "+fullPath);
        var a = Documents.find({"userId": Meteor.userId(), "_storagePath": new RegExp(fullPath+'$', 'i')}).fetch();
        console.log("relevant user docs #: "+a.length);
        var query =  Session.get("searchQuery");
        b = []
        for(var entry=0; entry<a.length; entry++) {
            if(a[entry]['name'].toLowerCase().indexOf(query) > -1)
              b.push(a[entry]);
        }
        return b;
    },
    folders: function () {
        var eman17 = Session.get("foldersRendered"); //rerenders on change
        Meteor.call('makeDir');
        console.log("fetching folders");
        var pathString = Session.get('pathString');
        Meteor.call('getSubDir', ['/files'+pathString],
            function(err, serverResult) {
                console.log("serverResult"+serverResult);
                if (err) {
                    console.log("error getting subdir from callback"+ err);
                } else {
                    Session.set('subDir', serverResult);
                }
            }
        );
        var subDirs = Session.get('subDir');
        console.log("subdirectories:" +subDirs);
        if(!subDirs)
          return [];
        b = []
        var query = Session.get("searchQuery");
        for(var entry=0; entry<subDirs.length; entry++) {
            if(subDirs[entry].toLowerCase().indexOf(query) > -1)
              b.push(subDirs[entry]);
        }
        return b;
    },
    path: function () {
        var a = Session.get('currPath').slice(0);
        //console.log("THIS IS A BEFORE: " + a);
        for(var q=0; q<a.length; q++) {
            if(q==0){
                a[q] = {name: "home", glyph: false};
            } else {
                a[q] = {name: a[q], glyph: true};
            }
          //a[q] = a[q]
        }
        console.log(a);
        return a;
    },
    inHome: function() {
      return Session.get('currPath').length == 1
    }
});

Template.ProjectList.events({
    'click #remove': function(event, template) {
        try {
          Documents.remove({_id: this._id});
        } catch(e) {
          alert("error deleting");
        }
    },
    'click #removeFolder': function(event, template) {
        Session.set('loading', true);
        console.log("Told to remove folder");
        Meteor.call('removeFolder', Session.get('pathString')+"/"+this, function() {
          Session.set('loading', false);
          Session.set('foldersRendered', Random.id());
        });
    },
    'click #folder': function(event, template) {
        //forward that directory
        console.log("--------------------------------------clicked folder");
        console.log(event.target.textContent);
        var cd = event.target.textContent
        var newPath = Session.get('pathString') + "/"+cd;
        Session.set('pathString', newPath);
        var pathArray = Session.get('currPath').slice(0)
        pathArray.push(cd);
        Session.set('currPath', pathArray);
        console.log("path string is now: "+Session.get('pathString'));
        console.log("currPath is now:" + Session.get('currPath'));
    },
    'click #pathBack': function(event, template) {
        //parsing array
        var pathArray = Session.get('currPath').slice(0);
        if(pathArray.length > 1) {
          var clicked = pathArray[pathArray.length-2];
        } else { var clicked = pathArray[0]; }
        console.log("wew " + clicked);
        var index = pathArray.indexOf(clicked);
        pathArray = pathArray.slice(0, index+1);
        Session.set('currPath', pathArray);

        //parsing string
        var pathString = Session.get('pathString');
        console.log("original path string: "+pathString);
        console.log("index: "+pathString.indexOf(clicked));
        pathString = pathString.substring(0,pathString.indexOf(clicked) + clicked.length);
        console.log("pathString is now" + pathString);
        Session.set('pathString', pathString);
    },
    'click #path': function(event, template) {
        var clicked = event.target.textContent;
        console.log(".........................................clicked path "+clicked);
        if (clicked==='home')
        {
            clicked = Meteor.userId();
        }

        if (clicked != '')
        {
            var pathArray = Session.get('currPath').slice(0);
            console.log("currPath is "+pathArray);
            var index = pathArray.indexOf(clicked);
            pathArray = pathArray.slice(0, index+1);
            Session.set('currPath', pathArray);

            //parsing string
            var pathString = Session.get('pathString');
            console.log("original path string: "+pathString);
            console.log("index: "+pathString.indexOf(clicked));
            pathString = pathString.substring(0,pathString.indexOf(clicked) + clicked.length);
            console.log("pathString is now" + pathString);
            Session.set('pathString', pathString);
        } else {
            console.log("you tried to break it;")
        }
    }
});

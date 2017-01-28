import { Meteor } from 'meteor/meteor';
import { Documents } from '../../collections/files'
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var'
import { Session } from 'meteor/session'

import path from 'path';
import fs from 'fs';

Template.ProjectList.onCreated(()=>{
    Meteor.subscribe('currjson');
    Meteor.subscribe('documents');
    Meteor.subscribe('editusers');
    Session.set('pathString', "/"+Meteor.userId());
    Session.set('currPath', [Meteor.userId()]);
});

Template.ProjectList.helpers({
    collabDocs: function() {
        var a = Documents.find({"collab": Meteor.userId()}).fetch();
        for(var q=0; q<a.length; q++) {
          a[q]['owner'] = Meteor.users.find(a[q]['userId']).fetch()[0]['emails'][0]['address']
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
        for(var entry=0; entry<a.length; entry++) {
            console.log(a[entry]);
            //a[entry]['date'] = a[entry].original.updatedAt.toString().substring(0, 15);
            //a[entry]['user'] = Meteor.users.find(a[entry].userId).fetch()[0].emails[0].address;
        }
        return a;
    },
    folders: function () {
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
        return subDirs;
    },
    path: function () {
        var a = Session.get('currPath').slice(0);
        a[0] = "home";
        return a;
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
    }
});

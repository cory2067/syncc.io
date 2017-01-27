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
    Session.set('pathString', "");
    Session.set('currPath', []);
});

Template.ProjectList.helpers({
    //get docs in path
    docs: function () {
        console.log("getting relevant docs");

        var pathString = Session.get('pathString');
        //get path
        console.log("Current path string is "+pathString);
        var fullPath = Meteor.userId()+pathString;
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
        console.log("fetching folders");
        var pathString = Session.get('pathString');
        Meteor.call('getSubDir', ['/files/'+Meteor.userId()+pathString], 
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
        return subDirs;
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
        console.log("clicked folder");
        console.log(event.target.textContent);
        var cd = event.target.textContent
        var newPath = Session.get('pathString') + "/"+cd;
        Session.set('pathString', newPath);
        var newPathArray = Session.get('currPath').push(cd);
        Session.set('currPath', newPathArray);
        console.log("path string is now: "+Session.get('currPath'));
        console.log("currPath is now:" + Session.get('pathString'));
    }
});

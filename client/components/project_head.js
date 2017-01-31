import { Tracker } from 'meteor/tracker'
import { Documents } from '../../collections/files'
import { Session } from 'meteor/session'
import { Random } from 'meteor/random'

Template.ProjectHead.events({
    'keyup #search': function(event, template) {
      Session.set("searchQuery", event.target.value.toLowerCase());
    },
    'change #files': function(event, template) {
        Session.set("loading", true);
        console.log("Changed file");
        var file = event.currentTarget.files[0];
        if (file) {
            var uploadInstance = Documents.insert({
                file: file,
                streams: 'dynamic',
                chunkSize: 'dynamic',
                onBeforeUpload: function(file) {
                    if (file.size <= 10485760) {
                        return true;
                    } else {
                        return ('Please upload files less than 10MB');
                        Session.set("loading", false);
                    }
                }
            }, false);
            uploadInstance.on('error', function(error, fileObj) {
                alert('Error during upload: '+error);
            });
            uploadInstance.on('end', function(error, fileObj) {
                if (error) {
                    console.log("error uploading" + error);
                } else {
                    console.log("File " + fileObj.name + " successfully uploaded");
                    Meteor.call("assignFile", [fileObj._id, fileObj.name, Session.get('pathString')]);
                    Meteor.call("updateJSON", Meteor.userId());
                }
                Session.set("loading", false);
            });
            Meteor.call("getPath", function(err, path) {
                var full = path + "/files" + Session.get('pathString')+"/"+file.name;
                var found = Documents.find({path: full}).fetch();
                if(found.length > 0) {
                    ErrorMessage("fileExists");
                    $("#errorBtn").click();
                    //alert("This file already exists. Delete the existing file before uploading again");
                    Session.set("loading", false);
                } else {
                    uploadInstance.start();
                }
            });
        }
    },
    'change #zip': function(event, template) {
        Session.set("loading", true);
        console.log("Changed zip file");
        var file = event.currentTarget.files[0];
        if (file) {
            var uploadInstance = Documents.insert({
                file: file,
                streams: 'dynamic',
                chunkSize: 'dynamic',
                onBeforeUpload: function (file) {
                    if (/zip/i.test(file.extension)) {
                    } else {
                        //alert('Only allowed to add zip files, use the upload files feature instead')
                        $("#errorBtn").click();
                        ErrorMessage("onlyZIP");
                        Session.set("loading", false);
                    }
                    if (file.size <= 10485760) {
                        return true;
                    } else {
                        $("#errorBtn").click();
                        ErrorMessage("tooBig");
                        //alert('Please upload files less than 10MB');
                        Session.set("loading", false);
                    }
                }
            }, false);
            uploadInstance.on('end', function (error, fileObj) {
                if (error) {
                    console.log("Error uploading" + error);
                } else {
                    console.log("Successfully uploaded" + fileObj.name);
                    console.log(Session.get('pathString')+"rsttttttttttttttttttttttttttttt");
                    Meteor.call("assignFile", [fileObj._id, fileObj.name, Session.get('pathString')], function() {
                        Meteor.call('unzip', [fileObj.name, fileObj._storagePath, Session.get('pathString')], function() {
                          Session.set("foldersRendered", Random.id());
                          Session.set("loading", false);
                        });
                    });
                    Meteor.call("updateJSON", Meteor.userId());
                }
            });
            uploadInstance.start();
        }
    },

    'click #new_file': function(event, template) {
        $(function(){
        $("#createNewFile").click(function(){/*
        console.log("-------------------------------new file creater in header");
        var nameInput = $("#fileName").val();
        console.log("You want a new file called"+nameInput+"  calling new file...");
          Meteor.call('newFile', [nameInput, Meteor.userId()], function() {
            Meteor.call("getPath", function(err, path) {
              console.log("user: "+Meteor.userId());
              var full = path + "/files/" +Meteor.userId()+"/"+ nameInput;
              console.log("checking if already exists at "+full);
              var found = Documents.find({path: full}).fetch();
              console.log("This is what was found "+found);
              if(found.length > 1) {
                alert("Please give your file a unique name!");
              } else if(found.length == 1) {
                window.location.href = "/" + found[0]['_id'];
              }
            });
          });
          console.log("--------------------------------end file creater in header");*/
        });
      });
    },
    'click #new_folder': function(event, template) {
        console.log("CLicked new folder");
        $(function(){
        $("#createNewFolder").click(function(){
        });
        });
    }
});

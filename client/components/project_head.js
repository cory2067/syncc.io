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
            }, false);
            uploadInstance.on('error', function(error, fileObj) {
                alert('Error during upload: '+error);
            });
            uploadInstance.on('abort', function(error, fileObj) {
                prompt('Are you sure you want to abort upload?');
            });
            uploadInstance.on('end', function(error, fileObj) {
                if (error) {
                    console.log("error uploading" + error);
                } else {
                    console.log("File " + fileObj.name + " successfully uploaded");
                    Meteor.call("assignFile", [fileObj._id, fileObj.name]);
                    Meteor.call("updateJSON", Meteor.userId());
                }
                Session.set("loading", false);
            });
            uploadInstance.start();
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
                        return true;
                    } else {
                        return 'Only allowed to add zip files, use the upload files feature instead'
                    }
                }
            }, false);
            uploadInstance.on('end', function (error, fileObj) {
                if (error) {
                    console.log("Error uploading" + error);
                } else {
                    console.log("Successfully uploaded" + fileObj.name);
                    Meteor.call("assignFile", [fileObj._id, fileObj.name], function() {
                        Meteor.call('unzip', [fileObj.name, fileObj._storagePath], function() {
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
        console.log("NOT YET");
    }
});

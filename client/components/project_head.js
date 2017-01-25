import { Tracker } from 'meteor/tracker'
import { Documents } from '../../collections/files'

Template.ProjectHead.events({
    'change #files': function(event, template) {
        console.log("Changed file");
        var file = event.currentTarget.files[0];
        if (file) {
            var uploadInstance = Documents.insert({
                file: file,
                streams: 'dynamic',
                chunkSize: 'dynamic',
            }, false);
            uploadInstance.on('end', function(error, fileObj) {
                if (error) {
                    console.log("error uploading");
                } else{
                    console.log("File " + fileObj.name + " successfully uploaded");
                    Meteor.call("updateJSON");
                }
            });
            uploadInstance.start();
        }
    },
    'change #zip': function(event, template) {
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
                    Meteor.call('unzip', fileObj.name);
                    Meteor.call("updateJSON");
                }
            });
            uploadInstance.start();
        }
    },
    'click #new_file': function(event, template) {
        console.log("making new file");
        var nameInput;
        nameInput = prompt("Name of new file", "helloworld.py");
        console.log(nameInput);
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
    },
    'click #new_folder': function(event, template) {
        console.log("NOT YET");
    }
});

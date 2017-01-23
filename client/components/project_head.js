import { Tracker } from 'meteor/tracker'

Template.ProjectHead.events({
    'change #files': function(event, template) {
        console.log("Changed file");
        var file = event.currentTarget.files[0];
        if (file) {
            var uploadInstance = Documents.insert({
                file: file, 
                streams: 'dynamic',
                chunkSize: 'dynamic'
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
        Meteor.call('newFile', nameInput);


    },
    'click #new_folder': function(event, template) {
        console.log("NOT YET");
    }
});

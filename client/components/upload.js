import { Tracker } from 'meteor/tracker'
import fs from 'fs'
Template.ProjectHead.events({
    'change #files': function(event, template) {
        console.log("Changed file");
        var file = event.currentTarget.files[0];
        var reader = new FileReader();
        reader.onload = function(fileLoadEvent) {
            console.log("Calling file storage");
            Meteor.call('storeFile', [file.name, reader.result]);
        };
        reader.readAsBinaryString(file);
    },
    'change #zip': function(event, template) {
        var files = event.target.files;
        var currFile = new FS.File(files[0]);
        currFile.metadata = {owner: Meteor.userId()};
        Documents.insert(currFile, function (err, fileObj) {
            console.log(fileObj);
        });
        var fileName = currFile.original.name;
        var fileId = currFile._id;
        Tracker.autorun(function (c) {
            var fileObj = Documents.findOne(fileId);
            if (fileObj.hasStored('docs')) {
                console.log(fileId);
                console.log("calling update");
                Meteor.call('parseZip',[currFile,fileName, fileId]);
            }
        });

        Meteor.call('updateJSON');

    }
});

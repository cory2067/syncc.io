import { Tracker } from 'meteor/tracker'
Template.ProjectHead.events({
    'change #files': function(event, template) {
        FS.Utility.eachFile(event, function(file) {
            var myFile = new FS.File(file);
            myFile.metadata = {owner: Meteor.userId()};
            Documents.insert(myFile, function (err, fileObj) {
                if (err) {
                    console.log("there was an error", err);
                }
            });
            var fileName = myFile.original.name;
            var fileId = myFile._id;
            Tracker.autorun(function (c) {
                var fileObj = Documents.findOne(fileId);
                if (fileObj.hasStored('docs')) {
                    console.log(fileId);
                    console.log("calling update file");
                    Meteor.call('parseFile',[fileName, fileId]);
                }
            });
            //Meteor.call('updateJSON');
        });
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

        //Meteor.call('updateJSON');

    }
});

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
        });
    },
    'change #zip': function(event, template) {
        var files = event.target.files;
        for (var i = 0, ln = files.length; i < ln; i++) {
            var currFile = new FS.File(files[i]);
            currFile.metadata = {owner: Meteor.userId()};
            Documents.insert(currFile, function (err, fileObj) {
                Meteor.call('parseZip',[currFile.original.name]);
            });
        }
    }
});

Template.UploadForm.events({
    'change #files': function(event, template) {
        FS.Utility.eachFile(event, function(file) {
            var myFile = new FS.File(file);
            myFile.metadata = {owner: Meteor.userId(), path: './'};
            Documents.insert(myFile, function (err, fileObj) {
                if (err) {
                    console.log("there was an error", err);
                }
            });
        });
    },
    'change #folder': function(event, template) {
        var files = event.target.files;
        for (var i = 0, ln = files.length; i < ln; i++) {
            var currFile = new FS.File(files[i]);
            currFile.metadata = {owner: Meteor.userId(), path: files[i].webkitRelativePath};
            Documents.insert(currFile, function (err, fileObj) {
            });
        }
    }
});

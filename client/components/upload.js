Template.UploadForm.events({
    'change #files': function(event, template) {
        FS.Utility.eachFile(event, function(file) {
            Documents.insert(file, function (err, fileObj) {
                if (err) {
                    console.log("there was an error", err);
                }
            });
        });
    }
});

Template.UploadForm.events({
    'change #files': function(event, template) {
        console.log("files changed");
        FS.Utility.eachFile(event, function(file) {
            console.log("each file");
            Documents.insert(file, function (err, fileObj) {
                console.log("callback for insert, err: ", err);
                if (!err) {
                    console.log("inserted without error");
                }
                else {
                    console.log("there was an error", err);
                }
            });
        });
    }
});

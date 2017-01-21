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
            console.log(myFile.hasStored('docs'));
            while (!myFile.hasStored('docs'))
            {
                console.log("calling update");
                Meteor.call('updateJSON');
                break;

            }
        });
    },
    'change #zip': function(event, template) {
        var files = event.target.files;
        var currFile = new FS.File(files[0]);
        currFile.metadata = {owner: Meteor.userId()};
        Documents.insert(currFile, function (err, fileObj) {
            console.log(fileObj);
            fileName = fileObj.original.name;
            fileId = fileObj._id;
            console.log(fileId);
        });
        console.log(currFile.hasStored('docs'));
        while (!currFile.hasStored('docs'))
        {
            console.log("calling update");
            Meteor.call('updateJSON');
            break;

        }

    }
});

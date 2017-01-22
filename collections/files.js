this.Documents = new Meteor.Files({
    debug: true,
    collectionName: 'Documents',
    storagePath: Meteor.absolutePath + '/files',
    namingFunction: function(file){
        var name = file.name;
        return name.substr(0, name.indexOf('.'));
    }
});

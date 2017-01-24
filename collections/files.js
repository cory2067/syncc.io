export const Documents = new Meteor.Files({
    debug: false,
    collectionName: 'Documents',
    storagePath: Meteor.absolutePath + '/files',
    namingFunction: function(file){
        if(file) {
            var name = file.name;
            console.log("Name of thing you're trying to add " + name);
            return name.substr(0, name.indexOf('.'));
        }
    }
});

import { Meteor } from 'meteor/meteor';
import { Changes } from '../collections/changes';
import { CurrJSON } from '../collections/json';
import { EditorContents } from '../collections/editor';
import { Tracker } from 'meteor/tracker'
import fs from 'fs'
import unzip from 'unzip'
import touch from 'touch'
import DirectoryStructureJSON from 'directory-structure-json'

Meteor.startup(() => {
});

Meteor.methods({
    injectFile: function(params) {
      EditorContents.insert({editor: params['editor'], file:params['file'], user:'system', doc: "", refresh:""});
    },
    logServer: function(msg) {
        console.log(msg);
    },
    unzip: function(file) {
        var fileName = file;
        var filePath = Meteor.absolutePath + "/files/"+fileName;
        var outPath = Meteor.absolutePath + "/files";
        //console.log(filePath + " -> " + outPath);
        readStream = fs.createReadStream(filePath);
        console.log("starting unzip");
        var structure;
        //Remove the zip file
        readStream.pipe(unzip.Extract({path: outPath}))
            .on('close', Meteor.bindEnvironment(function() {
                console.log("finished unzip");
                console.log("unlinking "+filePath);
                Documents.unlink(filePath, Meteor.bindEnvironment(function(err) {
                    if (err) {
                        console.log("Couldn't delete " + err);
                    } else {
                        console.log("Successfully deleted");
                        var basepath = outPath + '/' + fileName.substr(0, fileName.indexOf('.'));
                        console.log(basepath+ "    basepath to addd");
                        console.log("Get structure");
                        DirectoryStructureJSON.getStructure(fs, basepath, Meteor.bindEnvironment(function (err, structure, total) {
                            if (err) console.log(err);
                            console.log("structure" + structure);
                            structure = structure;
                            DirectoryStructureJSON.traverseStructure(structure, basepath, 
                            function (folder, path) {
                                console.log('folder found: ', folder.name, 'at path: ', path);
                            }, 
                            function (file, path) {
                                console.log('file found: ', file.name, 'at path: ', path);
                                Documents.addFile(path+'/'+file.name, {
                                    fileName: file.name,
                                    storagePath: path
                                }, function(err) {
                                    if (err) {
                                        console.log("error adding" + err);
                                    } else {
                                        console.log("added successfully");
                                    }
                                });
                            });
                        }));
                    }
                }));
        
        }));
    },
    deleteChanges: function(params){
        Changes.remove({editor: params[0], file: params[1]});
    },
    openFile: function(fileId) {
        fileObj = Documents.find({_id: fileId}).fetch()[0];
        if (fileObj) {
            console.log(fileObj);
            var fileName = fileObj.name;
            var fileId = fileObj._id;
            var filePath = Meteor.absolutePath + "/files/"+fileName;
            //console.log(filePath);
            var parsed;
            var csv = '';

            var stream = fs.createReadStream(filePath);
            console.log("initialized stream");
            // read stream
            stream.on('data', function(chunk) {
                csv += chunk.toString();
            });

            stream.on('end', Meteor.bindEnvironment(function() {
                //parsed = Baby.parse(csv);
                //rows = parsed.data;
                //console.log(rows);
                console.log("return" + csv);
                send(csv);
                return csv;
            }));

            function send(csv) {
                EditorContents.insert({editor: fileId, file:fileName, user:'system', doc: csv, refresh:""}, function(err, id) {
                    console.log(err);
                    console.log(id);
                });
            }
            //EditorContents.insert({editor: 'idk', file:"meme.py", user:'system', doc: csv, refresh:""});
        }
    },
    updateJSON: function() {
        var basepath = Meteor.absolutePath + "/files";
        var curr = CurrJSON.find().fetch();
        DirectoryStructureJSON.getStructure(fs, basepath, Meteor.bindEnvironment(function (err, structure, total) {
            if (err) {
                console.log(err);
            }
            console.log("Total number of folders"+total.folders);
            console.log("Total number of files"+total.files);
            if(!curr.length) {
              console.log("Nothing in JSON yet, inserting...");
              CurrJSON.insert({json:JSON.stringify(structure, null, 4)})
            }
            else {
              console.log("Updating existing JSON");
              CurrJSON.update(curr[0]._id, {$set: {json: JSON.stringify(structure, null, 4)}});
            }
            //console.log("Structure in JSON format:" +newJSON);
        }));
    }, 
    newFile: function(name) {
        var path = Meteor.absolutePath + "/files";
        touch.sync(path+"/"+name);
        Documents.addFile(path+"/"+name, {
            fileName: name
        }, function(err) {
            if (err) {
                console.log("error making new file" + err);
            } else {
                Meteor.call('updateJSON');
            }
        });
    }
});

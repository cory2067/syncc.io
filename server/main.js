import { Meteor } from 'meteor/meteor';
import { Changes } from '../collections/changes';
import { CurrJSON } from '../collections/json';
import { EditorContents } from '../collections/editor';
import fs from 'fs'
import unzip from 'unzip'
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
    storeZip: function(file) {
        console.log("Unzipping zip"+file);

        var fileName = file[0];
        var data = file[1];
        var filePath = Meteor.absolutePath + "/files/"+fileName;
        var outPath = Meteor.absolutePath + "/files";
        fs.writeFile(filePath, data);
        console.log(filePath + " -> " + outPath);
        readStream = fs.createReadStream(filePath);
        readStream.pipe(unzip.Extract({path: outPath}));

        readStream.on('close', function() {
            console.log("unlinking "+filePath);
            //fs.unlink(filePath);
        });


    },
    storeFile: function(file) {
        var info = file[0];
        var data = file[1];
        console.log("received file " + info + "file: " + data);
        var path = Meteor.absolutePath + '/files/'+info;
        fs.writeFile(path, data);
        
    },
    deleteChanges: function(params){
        Changes.remove({editor: params[0], file: params[1]});
    },
    openFile: function(fileId) {
        fileObj = Documents.find({_id: fileId}).fetch()[0];
        console.log(fileObj);
        var fileName = fileObj.original.name;
        var fileId = fileObj._id;
        var filePath = Meteor.absolutePath + "/.meteor/local/cfs/files/docs/"+fileName;
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
    },
    updateJSON: function() {
        var basepath = Meteor.absolutePath + "/.meteor/local/cfs/files/docs";
        var curr = CurrJSON.find().fetch();
        console.log(curr);
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
    }
});

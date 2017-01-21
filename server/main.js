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
    parseZip: function(file) {
        console.log("Unzipping zip"+file[1]);

        var fileName = file[1];
        var fileId = file[2];
        console.log(fileId);
        var filePath = Meteor.absolutePath + "/.meteor/local/cfs/files/docs/docs-"+fileId+"-"+fileName;
        var outPath = Meteor.absolutePath + "/.meteor/local/cfs/files/docs";
        console.log(filePath);
        fs.createReadStream(filePath).pipe(unzip.Extract({path: outPath}));

    },
    parseFile: function(file) {
        var fileName = file[0];
        var fileId = file[1];
        console.log("Parsing file"+ fileName);
        var sourcePath = Meteor.absolutePath + "/.meteor/local/cfs/files/docs/docs-"+fileId+"-"+fileName;
        var desPath = Meteor.absolutePath + "/.meteor/local/cfs/files/docs/"+fileName;
        //fs.rename(sourcePath, desPath);
    },
    deleteChanges: function(params){
        Changes.remove({editor: params[0], file: params[1]});
    },
    openFile: function(fileId) {
        fileObj = Documents.find({_id: fileId}).fetch()[0];
        console.log(fileObj);
        var fileName = fileObj.original.name;
        var fileId = fileObj._id;
        var filePath = Meteor.absolutePath + "/.meteor/local/cfs/files/docs/docs-"+fileId+"-"+fileName;
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
          EditorContents.insert({editor: fileId, file:"meme.py", user:'system', doc: csv, refresh:""}, function(err, id) {
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

import { Meteor } from 'meteor/meteor';
import { Changes } from '../collections/changes'
import fs from 'fs'
import unzip from 'unzip'

Meteor.startup(() => {
});

Meteor.methods({
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
    deleteChanges: function(params){
        Changes.remove({editor: params[0], file: params[1]});
    },
    openFile: function(fileObj) {
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

        stream.on('end', function() {
            //parsed = Baby.parse(csv);
            //rows = parsed.data;
            //console.log(rows);
            console.log("return" + csv);
            return csv;
        });
    }
});

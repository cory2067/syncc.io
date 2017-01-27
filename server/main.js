import { Meteor } from 'meteor/meteor';
import { Changes } from '../collections/changes';
import { EditUsers } from '../collections/editusers';
import { CurrJSON } from '../collections/json';
import { Documents } from '../collections/files'
import { EditorContents } from '../collections/editor';
import { Tracker } from 'meteor/tracker'
import paste from 'better-pastebin';
import fs from 'fs-extra'
import unzip from 'unzip'
import touch from 'touch'
import DirectoryStructureJSON from 'directory-structure-json'

Meteor.startup(() => {
  Meteor.publish('changes', (editor)=>{
    var a = Changes.find({editor: editor});
    if(a) {
      return a
    }
    return this.ready();
  });
  Meteor.publish('editorcontents', (editor)=>{
    var a = EditorContents.find({editor: editor});
    if(a) {
      return a;
    }
    return this.ready();
  });
  Meteor.publish('editusers', (editor)=>{
    var a = EditUsers.find({editor: editor});
    if(a) {
      return a;
    }
    return this.ready();
  });
  Meteor.publish('documents', ()=> {
    var a = Documents.find().cursor;
    //console.log(a);
    if(a) {
      return a;
    }
    return this.ready();
  });
  Meteor.publish('currjson', ()=> {
    var a = CurrJSON.find();
    if(a) {
      return a;
    }
    return this.ready();
  })
});

Meteor.methods({
    injectFile: function(params) {
      EditorContents.insert({editor: params['editor'], file:params['file'], user:'system', doc: "", refresh:""});
    },
    logServer: function(msg) {
        console.log(msg);
    },
    unzip: function(file) {
        var fileName = file[0];
        var id = Meteor.userId();
        console.log("meteor.userId()"+ Meteor.userId());
        var filePath = file[1]+"/"+id+"/"+fileName;
        var outPath = file[1] + "/"+id;
        //console.log(filePath + " -> " + outPath);
        readStream = fs.createReadStream(filePath);
        console.log("starting unzip");
        var structure;
        //Removeo the zip file
        readStream.pipe(unzip.Extract({path: outPath}))
            .on('close', Meteor.bindEnvironment(function() {
                console.log("finished unzip");
                console.log("unlinking "+filePath);
                fs.remove(filePath);

                Documents.remove({path: filePath}, Meteor.bindEnvironment(function(err) {
                    if (err) {
                        console.log("Couldn't delete " + err);
                    } else {
                        console.log("Successfully deleted");
                        var basepath = outPath + '/' + fileName.substr(0, fileName.indexOf('.'));
                        console.log(basepath+ "    basepath to addd");
                        console.log("Get structure");
                        const userId = Meteor.userId();
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
                                    storagePath: path,
                                    userId: Meteor.userId()
                                }, function(err, fileObj) {
                                    if (err) {
                                        console.log("error adding" + err);
                                    } else {
                                        console.log("added successfully");
                                        console.log(fileObj._id);
                                        console.log("id"+userId);
                                        Documents.update({_id: fileObj._id}, {$set: {userId: userId}});
                                    }
                                });
                            });
                        }));
                    }
                }));

        }));
    },
    getPath: function() {
      return Meteor.absolutePath;
    },
    deleteChanges: function(params){
        Changes.remove({editor: params[0], file: params[1]});
    },
    openFile: function(fileId) {
          fileObj = Documents.find({_id: fileId}).fetch()[0];
          if (fileObj) {
              //console.log(fileObj);
              var fileName = fileObj.name;
              var fileId = fileObj._id;;
              var filePath = fileObj._storagePath + "/" + fileName;
              //console.log(filePath);
              var parsed;
              var csv = '';

              var stream = fs.createReadStream(filePath);
              stream.on('error', Meteor.bindEnvironment(function(){
                  console.log("Holy shit I fucked that up!");
                  send("This file doesn't seem to exist anymore.\nHowever, you can still edit here and it will be saved as a new file.");
              }));
              //console.log("initialized stream");
              // read stream
              stream.on('data', function(chunk) {
                  csv += chunk.toString();
              });

              stream.on('end', Meteor.bindEnvironment(function() {
                  //parsed = Baby.parse(csv);
                  //rows = parsed.data;
                  //console.log(rows);
                  //console.log("return" + csv);
                  send(csv);
                  return csv;
              }));
            }
          function send(csv) {
              EditorContents.insert({editor: fileId, file:fileName, user:'system', doc: csv, refresh:""}, function(err, id) {
                  console.log(err);
                  console.log(id);
              });
          }
    },
    updateJSON: function(id) {
        console.log("initially called update JSON");
        console.log("User"+ id);
        if (id) {
            var basepath = Meteor.absolutePath + "/files/"+id;
            console.log("path:" + basepath);
            var curr = CurrJSON.find().fetch();
            DirectoryStructureJSON.getStructure(fs, basepath, Meteor.bindEnvironment(function (err, structure, total) {
                if (err) {
                    console.log(err);
                }
                //console.log("Total number of folders"+total.folders);
                //console.log("Total number of files"+total.files);
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
        } else {
            console.log("NO USER");

        }
    },
    newFile: function(a) {
        var name = a[0];
        var userId = a[1];
        console.log("newFile called" + name +"  for "+userId);
        var path = Meteor.absolutePath + "/files/"+userId;
        console.log("touching "+path+"/"+name);
        fs.ensureDirSync(path, function(err) {
            if (err) {
                console.log("Error ensuring directory");
            }
        });
        touch.sync(path+"/"+name);
        console.log("User: " + Meteor.userId());
        var done = false;
        Documents.addFile(path+"/"+name, {
            fileName: name,
            userId: Meteor.userId()
        }, function(err, fileObj) {
            done = true
            if (err) {
                console.log("error making new file" + err);
            } else {
                console.log("fileId" + fileObj._id+ "     user" + userId);
                Documents.update({_id: fileObj._id}, {$set: {userId: userId}});
                Meteor.call('updateJSON', userId);
            }
        });
        console.log("waiting for file completion");
        while(!done) Meteor.sleep(100);
        console.log("Done newFile");
    },
    writeFile: function(a) {
        var content = a[0];
        var path = a[1];
        var file_name = a[2];
        var buffer = new Buffer(content);
        console.log("trying to write to file nameeeee" + file_name);

        fs.writeFile(path, content, function (err) {
            if (err) {
                console.log("errrrrror"+err);
            }
        });

    },
    assignFile: function(f) {
        var id = f[0];
        var name = f[1];
        console.log("giving to user path: " + Meteor.absolutePath+"/files/"+Meteor.userId());
        var path = Meteor.absolutePath+"/files/"+Meteor.userId();
        Documents.update(id, {$set: {_storagePath: path}});

        var oldPath = Meteor.absolutePath+"/files/"+name;
        var newPath = path+"/"+name;
        Documents.update(id, {$set: {path: newPath}});
        console.log("attempting to move " + oldPath + " to "+ newPath);
        fs.move(oldPath, newPath, function(err) {
            if (err) {
                console.log("error moving" + err);
            } else {
                console.log("success");
            }
        });
    }
});

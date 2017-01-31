import { Meteor } from 'meteor/meteor';
import { Changes } from '../collections/changes';
import { Profiles } from '../collections/profiles';
import { EditUsers } from '../collections/editusers';
import { CurrJSON } from '../collections/json';
import { Documents } from '../collections/files'
import { EditorContents } from '../collections/editor';
import { Tracker } from 'meteor/tracker'
import { Accounts } from 'meteor/accounts-base'
import fs from 'fs-extra'
import unzip from 'unzip'
import touch from 'touch'
import path from 'path'
import dir from 'node-dir'
import { exec } from 'child_process'
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
  Meteor.publish('profiles', ()=> {
    var a = Profiles.find();
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
  });
  Meteor.publish('userList', ()=> {
    return Meteor.users.find();
  });
});

Meteor.methods({
    addFriend: function(email) {
      console.log(email);
      try {
        var result = Accounts.findUserByEmail(email);
        //console.log(Documents.find(editor).fetch());
        var exists = Profiles.find({user: Meteor.userId()}).fetch()[0]['friends'].includes(result._id);
        if(exists) {
          return "exists"
        }
        Profiles.update({user: Meteor.userId()}, {$push: {friends: result._id}});
        return result['_id'];
      } catch (e) {
        console.log(e);
        console.log("It's ok, we're gonna ignore that error and move on.");
        return "err"
      }
    },
    injectFile: function(params) {
      EditorContents.insert({editor: params['editor'], file:params['file'], user:'system', doc: "", refresh:""});
    },
    findUser: function(params) {
      var email = params[0];
      var editor = params[1];
      console.log(email);
      try {
        var result = Accounts.findUserByEmail(email);
        //console.log(Documents.find(editor).fetch());
        var exists = Documents.find(editor).fetch()[0]['collab'].includes(result._id);
        if(exists) {
          return "exists"
        }
        Documents.update(editor, {$push: {collab: result._id}});
        return result['_id'];
      } catch (e) {
        console.log(e);
        console.log("It's ok, we're gonna ignore that error and move on.");
        return "err"
      }
    },
    logServer: function(msg) {
        console.log(msg);
    },
    unzip: function(file) {
        var fileName = file[0];
        var id = Meteor.userId();
        var sessPath = file[2];
        console.log("meteor.userId()"+ Meteor.userId());
        var filePath = file[1]+sessPath+"/"+fileName;
        var outPath = file[1] + sessPath;
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
                                        Documents.update({_id: fileObj._id}, {$set: {collab: [], userId: userId}});
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
        var docs = Documents.find({userId: id}).fetch();
        if (id && docs.length != 0) {
            var basepath = Meteor.absolutePath + "/files/"+id;

            fs.ensureDirSync(basepath, function(err) {
                if (err) {
                    console.log("Error ensuring directory");
                }
            });
            console.log("path:" + basepath);
            var curr = CurrJSON.find({id: id}).fetch();
            DirectoryStructureJSON.getStructure(fs, basepath, Meteor.bindEnvironment(function (err, structure, total) {
                if (err) {
                    console.log(err);
                }
                //console.log("Total number of folders"+total.folders);
                //console.log("Total number of files"+total.files);
                if(!curr.length) {
                    console.log("Nothing in JSON yet, inserting...");
                    CurrJSON.insert({id:id, json:{}})
                }
                else {
                    console.log("Updating existing JSON");
                    CurrJSON.update(curr[0]._id, {$set: {json: JSON.stringify(structure, null, 4)}});
                }
                //console.log("Structure in JSON format:" +newJSON);
            }));
        } else {
            console.log("NO USER");
            var curr = CurrJSON.find({id: id}).fetch();
            if(!curr.length) {
                CurrJSON.insert({id:id, json:{}})
            } else {
                CurrJSON.update(curr[0]._id, {$set: {json: {}}});
            }

        }
    },
    newFile: function(a) {
        var name = a[0];
        var userId = a[1];
        console.log("newFile called" + name +"  for "+userId);
        if(a[2] != "") {
            var path = a[2];
        } else {
            var path = Meteor.absolutePath+"/files/demo/"+a[0];
        }
        console.log("PATHHHH"+path);
        console.log("touching "+path);
        console.log(path.substr(path.indexOf(name)));
        fs.ensureDirSync(path.substr(0, path.indexOf(name)), function(err) {
            if (err) {
                console.log("Error ensuring directory");
            } else {
                console.log(path.substr(path.indexOf(name)) +" should exist");
            }
        });
        touch.sync(path);
        console.log("User: " + Meteor.userId());
        var done = false;
        Documents.addFile(path, {
            fileName: name,
            userId: Meteor.userId()
        }, function(err, fileObj) {
            Documents.update(fileObj._id, {$set: {collab: []}});
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
        var sessPath = f[2];
        console.log("setting you as collaborator");
        Documents.update(id, {$set: {collab: []}});
        console.log("giving to user path: " + Meteor.absolutePath+"/files"+sessPath);
        var path = Meteor.absolutePath+"/files"+sessPath;
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
    },
    getSubDir: function(p) {
        console.log("get sub dir called");
        var srcpath = Meteor.absolutePath+p;
        console.log("path" + srcpath);
        var subdir =  fs.readdirSync(srcpath)
            .filter(file => fs.statSync(path.join(srcpath, file)).isDirectory())
        console.log(subdir);
        return subdir;
    },
    makeDir: function() {
        fs.ensureDir(Meteor.absolutePath+"/files/"+Meteor.userId());
    },
    addCollab: function(a) {
        var userId = a[0];
        var fileId = a[1];
        Documents.update({_id: fileId}, {$push: {collab: userId}});
    },
    deleteCollab: function(a) {
        var userId = a[0];
        var fileId = a[1];
        try {
            Documents.update(fileId, {$pull: {collab: userId}});
        }
        catch(err) {
            console.log("NOT A COLLABORATOR");
        }
    },
    gitClone : function(url) {
      console.log("memeing");
      console.log(url);
      var path = Meteor.absolutePath + "/files/"+Meteor.userId();
      //Git.Clone("https://github.com/next2e/OneNight.git", path).catch(function(err) { console.log(err); });
      //this.unblock();
      var command="cd "+path+"; git clone " + url;
      var done = false;
      var name = url.split('/');
      basepath = path + "/" + name[name.length-1].split('.')[0];
      exec(command,Meteor.bindEnvironment(function(error,stdout,stderr){
        DirectoryStructureJSON.getStructure(fs, basepath, Meteor.bindEnvironment(function (err, structure, total) {
            if (err) console.log(err);
            console.log("structure" + structure);
            var userId = Meteor.userId();
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
                        Documents.update({_id: fileObj._id}, {$set: {collab: [], userId: userId}});
                    }
                });
            });
            done = true;
        }));
      }));
      while(!done) Meteor.sleep(100);
      return "done"
    },
    removeFolder: function(path) {
        var rpath = Meteor.absolutePath+"/files"+path;
        console.log(rpath);
        fs.removeSync(rpath);
        var query = { path: new RegExp('^' + rpath) };
        console.log(query);
        var matches = Documents.remove(query);
    },
    removeFile: function(path) {
        console.log("Deleting file at: "+ path);
        fs.removeSync(path);

    },
    moveFolder: function(a) {
        var pathToFile = a[0];
        var fileName = a[1];
        var folderPath = a[2];
        var fileId = a[3];
        Documents.update(fileId, {$set: {_storagePath: folderPath}});

        var oldPath = pathToFile;
        var newPath = folderPath+"/"+fileName;
        Documents.update(fileId, {$set: {path: newPath}});
        console.log("attempting to move " + oldPath + " to "+ newPath);
        fs.move(oldPath, newPath, function(err) {
            if (err) {
                console.log("error moving" + err);
            } else {
                console.log("success");
            }
        });

    },
    newFolder: function(a) {
        var strPath = a[2];
        console.log("Folder:"+strPath);
        fs.ensureDirSync(strPath, function(err) {
            if (err) {
                console.log("Error ensuring directory");
            }
        });
    }

});

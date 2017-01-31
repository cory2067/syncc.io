import { Template } from 'meteor/templating';
import { Random } from 'meteor/random'
import { EditUsers } from '../../collections/editusers'
import { Session } from 'meteor/session'
import { Tracker } from 'meteor/tracker'
import { Changes } from '../../collections/changes'
import { Profiles } from '../../collections/profiles'
import { EditorContents } from '../../collections/editor'
import { Meteor } from 'meteor/meteor';
import { Documents } from '../../collections/files'

var fileName = ""
var username = "Guest"
var userId = null ;
var lock = ['self'];
var doc = null;
var editId = null;
var init = true;
var docId = null;
var illegals = [];
var profileId = null;
var illegalTimeout = {};
var saveHandle;

Template.EditorPage.onCreated(() => {
  Session.set("ready", false)
  Session.set("loginTimeout", false);
  setTimeout(()=>{Session.set("loginTimeout", true)}, 1000);
  var id = FlowRouter.getParam("editID");
  Meteor.subscribe("changes", id);
  Meteor.subscribe("editorcontents", id);
  Meteor.subscribe("editusers", id, function() {
    Session.set("ready", true);
  });
  Meteor.subscribe("documents");
  Meteor.subscribe("userList");
  Meteor.subscribe("profiles", function() {
    var found = Profiles.find({user: Meteor.userId()}).fetch();
    if(found.length)
      profileId = found[0]._id;
  });

  $(window).bind('beforeunload', function() {
    EditUsers.remove({_id : userId});
    var content = doc.getValue();
    console.log(docId);
    var file = Documents.find({'_id': docId}).fetch();
    console.log(file);
    var path = file[0].path;
    var file_name;
    if(file.length) {
      file_name =  file[0].name;
    }
    //console.log(file_name +"told to write" + content + " to "+ path);
    Meteor.call('writeFile', [content, path, file_name]);
    Meteor.call("logServer", "deelt page beforeunload");
  });
});

Template.EditorPage.onRendered(() => {
    Meteor.call("getPath", function(err, path) {
      $("#jstree").on("activate_node.jstree", (a,b)=>{
        var content = doc.getValue();
        console.log(docId);
        var file = Documents.find({'_id': docId}).fetch();
        console.log(file);
        var pth = file[0].path;
        var file_name;
        if(file.length) {
          file_name =  file[0].name;
        }
        //console.log(file_name +"told to write" + content + " to "+ pth);
        Meteor.call('writeFile', [content, pth, file_name]);

        console.log("moving the fuck on");
        var filePath = $("#jstree").jstree(true).get_path(b.node).join('/');
        var full = path + "/files/"+Meteor.userId()+"/" + filePath;
        console.log(full);
        var found = Documents.find({path: full}).fetch()
        console.log(found);
        if(found.length > 1) {
          console.log("oh hecc this isnt supposed to happen, but im not gonna do anything about it");
        }
        if(found.length) {
          window.location.href = "/" + found[0]['_id'];
        }
      });
    });
    /*if(!Session.get("ready")) {
      console.log("heck you, its not ready yet");
      return;
    }*/
    console.log("ok now its ready thx");
    docId = FlowRouter.getParam("editID");
    lock = ['self'];
    Session.set("lock", ['self']);
    doc = $('.CodeMirror')[0].CodeMirror;
    var id = FlowRouter.getParam("editID");

    $(".file-tabs").css("background-color", $(".CodeMirror").css("background-color"));
    $(".file-tabs").css("color", $(".CodeMirror").css("color"));

    /*etTimeout(function(){
    var updates = EditorContents.find({editor:id,file:fileName}).fetch();
    try{
      console.log(updates)
      console.log(EditorContents.find().fetch());
      doc.setValue(updates[updates.length-2].doc);
    } catch(e) { console.log("FUCK")}
  }, 1000); */

    Tracker.autorun(function (c) {
      if(!Meteor.user() && !Session.get("loginTimeout")) {
        console.log("usr wher u at")
        return;
      }
      if(!Session.get("ready")) {
        console.log("hold up kiddo, ur not ready for this");
        return;
      }
      console.log("ok is goodmeme now");
      c.stop();
      var current = EditUsers.find({editor: id}).fetch();
      if(Meteor.user()) {
        username = Meteor.user()['emails'][0]['address'];
      }
      EditUsers.insert({name: username, editor: id, line: 0, init:true}, function(err, _id) {
          userId = _id;
          Session.set("userId", _id);
          Session.set("editing", true);
          console.log("addd user");
          if(!Documents.find({"_id": id}).fetch().length) {
            console.log("time to die!!!!!!")
            window.location.replace("/notfound");
          }
          if(current.length) {
            console.log("ur not the first one");
            var syncTimeout = setTimeout(()=>{
              console.log("you've timeout out, reloading")
              for(var p=0; p<current.length; p++) {
                EditUsers.remove(current[p]._id);
              }
              location.reload();
            }, 4000);
            EditorContents.find({editor: id}).observe({
              changed: function(changed, o) {
                console.log("sync timeout cancelled");
                console.log(changed);
                if(init){
                  doc.setValue(changed.doc);
                  init = false;
                  EditUsers.update({_id: userId}, {$set: {init: false}});
                  lock.splice(0,1);//remove self from lock
                  Session.set("lock", lock);
                  console.log(lock);
                  clearInterval(syncTimeout);
                }
              }
            });
          } else {
            console.log("ur apparently the first");
            console.log("Opening...." +FlowRouter.getParam("editID"));
            Meteor.call("openFile", FlowRouter.getParam("editID"));
            EditorContents.find({editor: id, user:'system'}).observe({
              added: function(changed, o) {
                console.log("i detectted:");
                //console.log(changed.doc);
                doc.setValue(changed.doc); //wew laddie copy and pasting code
                init = false;              //maybe someday, i'll make this not trash
                EditUsers.update({_id: userId}, {$set: {init: false}});
                lock.splice(0,1); //this is gross, but just delet lock if you're the first to join
                Session.set("lock", lock);
              }
            });
          }

          EditorContents.insert({editor: id, user: userId, doc: "", refresh:""}, function(err, _id) {
            editId = _id;
          });

          //Set save file at intevals
          saveHandle = Meteor.setInterval(function() {
              /*console.log("Interval saving");
              var content = doc.getValue();
              var file = Documents.find({'_id': docId}).fetch();
              var path = file[0].path;
              var file_name;
              if(file.length) {
                  file_name =  file[0].name;
              }
              //console.log(file_name +"told to write" + content + " to "+ path
              Meteor.call('writeFile', [content, path, file_name]);*/

          }, 8000);

          setInterval(() => {
            EditorContents.update({_id: editId}, {$set: {doc: doc.getValue()}});
          },5000); //periodically save
          Changes.find({editor:id}).observe({
              _suppress_initial: true,
              added: function (changes) {
                console.log(changes);
                if(changes['user'] != userId) {
                  //console.log(changes);
                  doc.replaceRange(changes['text'], changes['from'], changes['to'], origin='ignore');

                  //sketchy stuff for special cases when highlighting other user text
                  var removedLen = changes['removed'].length
                  if(changes['removed'][0] == "") {
                      removedLen = 0;
                    }

                  //there's a case when i need to shift the highlighted lines
                  if(removedLen != 1 && !changes['text'][0]) {
                    changes['text'].splice(0,1);
                    changes['from']['line']++;
                    changes['to']['line']++;
                  }

                  if(changes['text'].length || removedLen==1) {
                    var mark = doc.markText({line: changes['from']['line'], ch:0}, {line: changes['to']['line']+changes['text'].length-1}, {className: "editing"});
                    for(var l=changes['from']['line'];l<changes['to']['line']+changes['text'].length;l++) {
                      if(illegals.indexOf(l) > -1) {
                        if(illegalTimeout[l]) {
                          clearInterval(illegalTimeout[l]);
                          illegalTimeout[l] = setTimeout(()=>{illegals.splice(illegals.indexOf(l));}, 1000);
                        }
                        continue;
                      }
                      else {
                        illegals.push(l);
                        illegalTimeout[l] = setTimeout(()=>{illegals.splice(illegals.indexOf(l));}, 1000);
                      }
                      console.log(illegals);
                    }
                    setTimeout(function() {
                      mark.clear();
                    }, 1000);
                  }
                }
              },
              changed: function (changes, old) {
              },
              removed: function (i) {

             }
           });
      });
    });
    EditUsers.find({editor: id}).observe({
      _suppress_initial: true,
      added: function(changed, o) {
        console.log("ADD");
        if(changed['init']) {
          //Meteor.call("deleteChanges", [id, fileName])
          EditorContents.update({_id: editId}, {$set: {doc: doc.getValue(), refresh:Random.id()}});
          lock.push(changed['name']);
          Session.set("lock", lock);
          console.log("loked thanks to " + changed['name'])
          //setTimeout(()=>{lock--; console.log("unloked");}, 5000);
        }
      },
      changed: function(changed, o) {
        console.log("CHANGE");
        if(!changed['init']) {
          var index = lock.indexOf(changed['name']);
          if(index > -1) {
            console.log("unlocked!");
            lock.splice(index, 1);
            Session.set("lock", lock);
          }
        }
      }
    });

    Tracker.autorun(function (c) {
      //console.log("ready bois, time to detect")
      //auto detect file mode
      //https://github.com/codemirror/CodeMirror/edit/master/demo/loadmode.html
      var modeInput = Documents.find({'_id': FlowRouter.getParam("editID")}).fetch();
      if(modeInput.length==0) {
        return;
      }
      //console.log(modeInput);
      var val = modeInput[0].name, m, mode, spec;
      if (m = /.+\.([^.]+)$/.exec(val)) {
        var info = CodeMirror.findModeByExtension(m[1]);
        if (info) {
          mode = info.mode;
          spec = info.mime;
        }
      }
      if (mode) {
        doc.setOption("mode", spec);
      } else {
        console.log("Could not find a mode corresponding to " + val);
      }
    });
});

Template.EditorHead.events({
  "click #downloadBtn": function() {
    var content = doc.getValue();
    $("#downloadContainer").attr("href", 'data:text/plain;charset=utf-8,'
          + encodeURIComponent(content));
    $(".downloadAction")[0].click();
  },
  "click #exportBtn": function() {
    var content = doc.getValue();
    $.post("http://dpaste.com/api/v2/", {content:content, title:fileName}, function(d) {
      $("#pasteBin").val(d);
      //Jessica, do something better with this url (the variable "d")
    });
  }
});

Template.EditorHead.helpers({
  file: function () {
    return Documents.findOne();
  },
  getFileName() {
    var file = Documents.find({'_id': FlowRouter.getParam("editID")}).fetch();
    console.log(file);
    if(file.length) {
      return file[0].name;
    }
    return "Editor";
  },

  getURL(){
    return FlowRouter.getParam("editID");
  },
});

Template.EditorSidebar.helpers({
  editingUsers() {
    return EditUsers.find({editor: FlowRouter.getParam("editID")}).fetch();
  },
  collaborators() {
    console.log("##################################################Getting collaborators");
    var file =  Documents.find({'_id': FlowRouter.getParam("editID")}).fetch();
    console.log(file);
    if(file.length) {
        var collabId = file[0].collab;
        console.log("returning");
        console.log(collabId);
        console.log(Meteor.users.find().fetch());
        var collabEmail = collabId.map(function(id) {
            console.log("id="+id);
            var user =  Meteor.users.find(id).fetch();
            console.log(user);
            if(!user.length) return '';
            console.log(user)
            console.log("User:");
            return user[0].emails[0].address;

        });
        return collabEmail;
    }
    return []
  }
});

Template.EditorSidebar.events({
  "change #modeForm": function() {
    var editor = $('.CodeMirror')[0].CodeMirror;
    var choice = $('#modes').find(":selected").text();
    //console.log("looks like you tried to change mode");
    //console.log("your choice was " + choice);
    if (choice == "autodetect") {
      //console.log("you selected auto");
      var modeInput = Documents.find({'_id': FlowRouter.getParam("editID")}).fetch();
      if(modeInput.length==0) {
        return;
      }
      var val = modeInput[0].name, m, mode, spec;
      //console.log(val);
      if (m = /.+\.([^.]+)$/.exec(val)) {
        var info = CodeMirror.findModeByExtension(m[1]);
        //console.log("logged info is" + info);
        if (info) {
          mode = info.mode;
          spec = info.mime;
          //console.log("logged mode is" + mode);
        }
      }
      if (mode) {
        //console.log("entered")
        editor.setOption("mode", mode);
      } else {
        console.log("Could not find a mode corresponding to " + val);
      }
    }
  },
  "click #collabBtn": function() {
    val = $("#collabUser").val();
    Meteor.call("findUser", [val, FlowRouter.getParam("editID")], function(e,r) {
      if(r == 'err') {
        ErrorMessage("user");
        $("#errorBtn").click();
        //alert("Could not add! Are you sure this user exists?");
      }
    });
  },
});

Template.FileTabs.helpers({
  getFileName() {
    var file = Documents.find({'_id': FlowRouter.getParam("editID")}).fetch();
    console.log(file);
    if(file.length) {
      fileName = file[0].name;
      return file[0].name;
    }
    return "Loading...";
  }
});

Template.EditorConsole.helpers({
  type() {
    var l = false;
    var file = Documents.find({'_id': FlowRouter.getParam("editID")}).fetch();
    console.log(file);
    if(file.length) {
      splitted = file[0].name.split(".");
      e = splitted[splitted.length-1];
      if(e == "js" || e == "py") { l = true }
      return {ext: e, legal:l};
    }
  }
});

Template.EditorPage.helpers({
  lockUser() {
    var l = Session.get("lock");
    if(l && l.length) {
      return l[0];
    }
    else {
      return null;
    }
  },

  editingUsers() {
    return EditUsers.find({editor: FlowRouter.getParam("editID")}).fetch();
  },

  editorOptions() {
      return {
          lineNumbers: true,
          mode: "python",
          theme: "sinusoids",
          keyMap: "default",
          indentUnit: 4,
          indentWithTabs: true,
          autoCloseBrackets: true,
          matchBrackets: true,
          matchTags: true,
          autoCloseTags: true,
          lineWrapping: true
      }
    },

    editorEvents() {
       return {
         "beforeChange": function(doc, change) {
           if(change['origin'] != 'ignore' && change['origin'] != 'setValue') {
             if(lock.length || illegals.indexOf(change['from']['line']) > -1) {
               change.cancel();
               console.log("nice illegal!");
             }
           }
         },
         "change": function(doc, change){
           EditUsers.update({_id:userId}, {$set: {line:doc.getCursor()['line']}});
           if(change['origin'] != 'ignore' && change['origin'] != 'setValue'){
            change['editor'] = FlowRouter.getParam("editID");
            change['user'] = userId;
            change['time'] = (new Date()).toJSON();
            Changes.insert(change);

            if(profileId) {
              if(change['text'].length > 1) {
                var a = change['text'].length - 1;
                Profiles.update(profileId, {$inc: {added: 1}})
              }
              if(change['removed'].length > 1){
                var r = change['removed'].length - 1;
                Profiles.update(profileId, {$inc: {removed: 1}})
              }
            }
          }
         },
        "cursorActivity": function(doc) {
            EditUsers.update({_id:userId}, {$set: {line:doc.getCursor()['line']}});
            EditUsers.update({_id:userId}, {$set: {line1:doc.getCursor()['line']+1}});
        }
      }
    },

  editorCode() {
      return '';
  },

  getFileName() {
    var file = Documents.find({'_id': FlowRouter.getParam("editID")}).fetch();
    console.log(file);
    if(file.length) {
      return file[0].name;
    }
    return "Loading...";
  }
});


Template.EditorPage.events({
    'click #saveFile': function(event, template) {
      var content = doc.getValue();
      console.log(docId);
      var file = Documents.find({'_id': docId}).fetch();
      console.log(file);
      var path = file[0].path;
      var file_name;
      if(file.length) {
        file_name =  file[0].name;
      }
      //console.log(file_name +"told to write" + content + " to "+ path);
      Meteor.call('writeFile', [content, path, file_name]);
    }
});

Template.EditorPage.onDestroyed(function() {
  console.log(":o you're trying to destroy the page");
  EditUsers.remove({_id : userId});
  var content = doc.getValue();
  console.log(docId);
  var file = Documents.find({'_id': docId}).fetch();
  console.log(file);
  var path = file[0].path;
  var file_name;
  if(file.length) {
    file_name =  file[0].name;
  }
  //console.log(file_name +"told to write" + content + " to "+ path);
  Meteor.call('writeFile', [content, path, file_name]);
  Meteor.clearInterval(saveHandle);
});

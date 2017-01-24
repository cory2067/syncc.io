import { Template } from 'meteor/templating';
import { Random } from 'meteor/random'
import { EditUsers } from '../../collections/editusers'
import { Session } from 'meteor/session'
import { Tracker } from 'meteor/tracker'
import { Changes } from '../../collections/changes'
import { EditorContents } from '../../collections/editor'
import { Meteor } from 'meteor/meteor';

var username = "Guest"
var userId = null ;
var lock = ['self'];
var doc = null;
var editId = null;
var init = true;
var docId = null;

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
});

Template.EditorPage.onRendered(() => {
    Meteor.call("getPath", function(err, path) {
      $("#jstree").on("activate_node.jstree", (a,b)=>{
        var filePath = $("#jstree").jstree(true).get_path(b.node).join('/');
        var full = path + "/files/" + filePath;
        var found = Documents.find({path: full}).fetch()
        if(found.length > 1) {
          alert("oh hecc this isnt supposed to happen");
        } else if(found.length == 1) {
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
          if(current.length) {
            console.log("ur not the first one");
            EditorContents.find({editor: id}).observe({
              changed: function(changed, o) {
                console.log("here's what i found:")
                console.log(changed)
                if(init){
                  doc.setValue(changed.doc);
                  init = false;
                  EditUsers.update({_id: userId}, {$set: {init: false}});
                  lock.splice(0,1);//remove self from lock
                  Session.set("lock", lock);
                }
              }
            });
          } else {
            console.log("ur apparently the first");
            console.log(FlowRouter.getParam("editID"));
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
          //Meteor.call("deleteChanges", [id, fileName]);
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

Template.EditorHead.helpers({
  getFileName() {
    var file = Documents.find({'_id': FlowRouter.getParam("editID")}).fetch();
    console.log(file);
    if(file.length) {
      return file[0].name;
    }
    return "Loading...";
  },

  getURL(){
    return FlowRouter.getParam("editID");
  },
});

Template.EditorSidebar.helpers({
  editingUsers() {
    return EditUsers.find({editor: FlowRouter.getParam("editID")}).fetch();
  }
});

Template.FileTabs.helpers({
  getFileName() {
    var file = Documents.find({'_id': FlowRouter.getParam("editID")}).fetch();
    console.log(file);
    if(file.length) {
      return file[0].name;
    }
    return "Loading...";
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
          keyMap: "vim",
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
           if(lock.length && change['origin'] != 'setValue' && change['origin'] != 'ignore') {
             change.cancel();
           }
         },
         "change": function(doc, change){
           EditUsers.update({_id:userId}, {$set: {line:doc.getCursor()['line']}});
           if(change['origin'] != 'ignore' && change['origin'] != 'setValue'){
            change['editor'] = FlowRouter.getParam("editID");
            change['user'] = userId;
            change['time'] = (new Date()).toJSON();
            Changes.insert(change);
          }
         },
        "cursorActivity": function(doc) {
            EditUsers.update({_id:userId}, {$set: {line:doc.getCursor()['line']}});
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
    'click #newFileBtn': function(event, template) {
      $(function(){
        $("#createNewFile").click(function(){
        var nameInput = $("#fileName").val();
        console.log(nameInput);
          Meteor.call('newFile', [nameInput, Meteor.userId()], function() {
            Meteor.call("getPath", function(err, path) {
              var full = path + "/files/" + nameInput;
              var found = Documents.find({path: full}).fetch()
              if(found.length > 1) {
                alert("Please give your file a unique name!");
              } else if(found.length == 1) {
                window.location.href = "/" + found[0]['_id'];
              }
            });
          });
        });
      });
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
  console.log(file_name +"told to write" + content + " to "+ path);
  Meteor.call('writeFile', [content, path, file_name]);
});

import { Template } from 'meteor/templating';
import { Random } from 'meteor/random'
import { EditUsers } from '../../collections/editusers'
import { Session } from 'meteor/session'
import { Tracker } from 'meteor/tracker'
import { Changes } from '../../collections/changes'
import { EditorContents } from '../../collections/editor'

import { Meteor } from 'meteor/meteor';

var fileName = "meme.py";
var username = "Guest"
var userId = null ;
var lock = false;
var doc = null;
var editId = null;

Template.EditorPage.onRendered(() => {
    doc = $('.CodeMirror')[0].CodeMirror;
    var id = FlowRouter.getParam("editID");
    setTimeout(function(){
    var updates = EditorContents.find({editor:id,file:fileName}).fetch();
    try{
      console.log(updates)
      console.log(EditorContents.find().fetch());
      doc.setValue(updates[updates.length-2].doc);
    } catch(e) { console.log("FUCK")}
  }, 1000); //lol

    Changes.find({editor:id, file:fileName}).observe({
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

    Tracker.autorun(function (c) {
      if(!Meteor.user()) {
        return;
      }
      username = Meteor.user()['emails'][0]['address'];
      EditUsers.insert({name: username, editor: id, file: fileName, line: 0}, function(err, _id) {
          userId = _id;
          Session.set("userId", _id);
          Session.set("editing", true)

          EditorContents.insert({editor: id, file:fileName, user: userId, doc: ""}, function(err, _id) {
            editId = _id;
          });
          setInterval(() => {
            EditorContents.update({_id: editId}, {$set: {doc: doc.getValue()}});
          },1000);
      });
    });
    EditorContents.find({editor: id, file:fileName}).observe({
      changed: function(changed, o) {
        //console.log(changed);
      }
    });
    EditUsers.find({editor: id, file:fileName}).observe({
      _suppress_initial: true,
      added: function(changed, o) {
        //Meteor.call("deleteChanges", [id, fileName]);
        EditorContents.update({_id: editId}, {$set: {doc: doc.getValue()}});
        lock = true;
        console.log("loked")
        setTimeout(()=>{lock=false; console.log("unloked");}, 5000);
      }
    });
});

Template.EditorPage.helpers({
  editingUsers() {
    return EditUsers.find({editor: FlowRouter.getParam("editID")}).fetch();
  },

  editorOptions() {
      return {
          lineNumbers: true,
          mode: "python",
          theme: "night",
          keyMap: "vim",
          indentUnit: 4,
          indentWithTabs: true,
          autoCloseBrackets: true,
          matchBrackets: true,
          matchTags: true,
          autoCloseTags: true
      }
    },

    editorEvents() {
       return {
         "beforeChange": function(doc, change) {
           if(lock && change['origin'] != 'setValue' && change['origin'] != 'ignore') {
             change.cancel();
           }
         },
         "change": function(doc, change){
           EditUsers.update({_id:userId}, {$set: {line:doc.getCursor()['line']}});
           if(change['origin'] != 'ignore' && change['origin'] != 'setValue'){
            change['editor'] = FlowRouter.getParam("editID");
            change['file'] = fileName;
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
  }
});

Template.EditorPage.onDestroyed(function() {
  EditUsers.remove({_id : userId});
});

import { Changes } from '../../collections/changes'
import { Template } from 'meteor/templating';
import { Random } from 'meteor/random'
import { EditUsers } from '../../collections/editusers'
import { Docs } from '../../collections/docs'
import { Session } from 'meteor/session'
import { Tracker } from 'meteor/tracker'

var fileName = "meme.py";
var username = "Guest"
var mongoId = null;
var userId = null ;
var lockTimeout = null;

Template.EditorPage.onRendered(() => {
    try {
      username = Meteor.user()['emails'][0]['address'];
    } catch(e) {} //tfw you're too lazy to be bothered with error handling

    var id = FlowRouter.getParam("editID");

    EditUsers.insert({name: username, editor: id, file: fileName, line: [-1, 0]}, function(err, _id) {
        userId = _id;
        Session.set("userId", _id);
        Session.set("editing", true)
    });


    if(!Changes.find({session:id}).fetch().length) {
         Changes.insert({session:id, from:{}, to:{}, text:[], removed:[], origin:[], user:userId})
    }
    mongoId = Changes.find({session:id}).fetch()[0]['_id'];

    Changes.find({session:id}).observe({
       added: function (i) {
       },
       changed: function (changes, old) {
         if(changes['user'] != userId) {
           console.log(Changes.find({session: id}).fetch());
         }
       },
       removed: function (i) {
      }
    });

});

Template.EditorPage.helpers({
  editorID() {
    return FlowRouter.getParam("editID");
  },

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
         "change": function(doc, change){
            //Changes.add(change);
            change['user'] = userId;
            if(change['origin'] != 'ignore') {
              Changes.update(mongoId, {$set: change});
            }
         },
        "cursorActivity": function(doc) {
            l = doc.getCursor()['line'];
            EditUsers.update({_id:userId}, {$set: {line:[l,1]}});
            if(lockTimeout) {
              clearTimeout(lockTimeout)
            }
            lockTimeout = setTimeout(function() {
                EditUsers.update({_id:userId}, {$set: {line:[-1,0]}});
            }, 2000);
        }
      }
    },

  editorCode() {
      return "Code to show in editor";
  }
});

Template.EditorPage.onDestroyed(function() {
  EditUsers.remove({_id : userId});
});

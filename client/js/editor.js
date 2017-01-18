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
var compressTimeout = null;

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
         "beforeChange": function(doc, change){
            //Changes.add(change)
            lineObj = [change['from']['line'], change['text'].length];
            change['user'] = userId;

            EditUsers.update({_id:userId}, {$set: {line:lineObj}});
            clearTimeout(lockTimeout)
            lockTimeout = setTimeout(function() {
                EditUsers.update({_id:userId}, {$set: {line:[-1,0]}});
            }, 1500);

            clearTimeout(compressTimeout);
            compressTimeout = setTimeout(function() {
                l = EditUsers.find({_id:userId}).fetch()[0]['line'][0]
                EditUsers.update({_id:userId}, {$set: {line:[l,1]}});
            }, 500);

            if(change['origin'] != 'ignore') {
              Changes.update(mongoId, {$set: change});
            }
         },
        "cursorActivity": function(doc) {
            //console.log("cursor moved");
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

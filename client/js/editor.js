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
var userMarks = {};

Template.EditorPage.onRendered(() => {
    var doc = $('.CodeMirror')[0].CodeMirror;

    try {
      username = Meteor.user()['emails'][0]['address'];
    } catch(e) {} //tfw you're too lazy to be bothered with error handling

    var id = FlowRouter.getParam("editID");

    EditUsers.insert({name: username, editor: id, file: fileName, line: [-1, 0], revive: ''}, function(err, _id) {
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

    EditUsers.find({editor:id}).observe({
       added: function (i) {
       },
       changed: function (changes, old) {
         if(userMarks[changes['_id']]) {
           userMarks[changes['_id']].clear();
         }
         if(changes['line'][0] != -1 && changes['_id'] != userId) {
            var a = changes['line'][0] //from
            var b = changes['line'][1]+a-1 //to
            var mark = doc.markText({line:a, ch:0}, {line:b}, {className: "locked", readOnly: true});
            userMarks[changes['_id']] = mark;
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
            //Changes.add(change)
            lineObj = [change['from']['line'], change['text'].length];
            change['user'] = userId;

            var hash = Random.id()
            var a = lineObj[0] //from
            var b = lineObj[1]+a-1 //to
            EditUsers.update({_id:userId}, {$set: {line:lineObj, revive:hash}});
            //var mark = doc.markText({line:a, ch:0}, {line:b}, {className: "unlocked"});
            //setTimeout(function() {
            //  mark.clear();
            //}, 1000);

            clearTimeout(lockTimeout)
            lockTimeout = setTimeout(function() {
                EditUsers.update({_id:userId}, {$set: {line:[-1,0]}});
            }, 1000);

            clearTimeout(compressTimeout);
            if(lineObj[1] > 1) {
              compressTimeout = setTimeout(function() {
                  var oldRange = EditUsers.find({_id:userId}).fetch()[0]['line']
                  var l = doc.getCursor()['line'];
                  if(l > oldRange[0] && l < oldRange[0]+oldRange[1]) {
                    EditUsers.update({_id:userId}, {$set: {line:[l,1]}});
                  }
              //    mark.clear();
              }, 500);
            }

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
      return 'for meme in range(6):\n\tbadmeme = meme + 1\n\tprint(badmeme)\n\tprint(meme)\n\tpass';
  }
});

Template.EditorPage.onDestroyed(function() {
  EditUsers.remove({_id : userId});
});

import { Changes } from '../../collections/changes'
import { Template } from 'meteor/templating';
import { Random } from 'meteor/random'

var mongoId = null;
var userHash = Random.id();
Template.EditorPage.onRendered(() => {
  //Meteor.setTimeout(() => {
    var id = FlowRouter.getParam("editID");

    if(!Changes.find({session:id}).fetch().length) {
         Changes.insert({session:id, from:{}, to:{}, text:[], removed:[], origin:[], user:userHash})
    }
    mongoId = Changes.find({session:id}).fetch()[0]['_id'];

    Changes.find({session:id}).observe({
       added: function (i) {
        console.log("ADDED");
       },
       changed: function (changes, old) {
         if(changes['user'] != userHash) {
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
            change['user'] = userHash;
            if(change['origin'] != 'ignore') {
              Changes.update(mongoId, {$set: change});
            }
         }
       }
    },

  editorCode() {
      return "Code to show in editor";
  }
});

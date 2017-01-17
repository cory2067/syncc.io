import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Changes } from '../collections/changes'
import { Random } from 'meteor/random'
import './main.html';

Template.hello.onCreated(function helloOnCreated() {
  // counter starts at 0
  this.counter = new ReactiveVar(0);
});


Template.hello.helpers({
  counter() {
    return Template.instance().counter.get();
  }
});

Template.Header.helpers({
    newEditor() {
      var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      return _.sample(possible, 8).join('');
    }
});

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

Template.HomePage.onRendered(function () {
  this.$('#jstree').jstree({
    core: {
      themes: {
        name: 'proton',
        dots: true,
        icons: true,
        responsive: true
      },
      data: [{
        text: 'Root node', 'children': [{
          text: 'Child node 1'
        }, {
          text: 'Child node 2'
        }]
      }]
    }
  });
});

Template.hello.events({
  'click button'(event, instance) {
    var editor = $('.CodeMirror')[0].CodeMirror;
    var line = editor.getLine(0);
    editor.replaceRange("new stuff\n", {line:0,ch:0}, {line:0,ch:line.length}, origin="ignore");
    // increment the counter when button is clicked
    instance.counter.set(instance.counter.get() + 1);
  },
});

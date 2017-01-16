import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
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

Template.EditorPage.helpers({
  editorOptions() {
      return {
          lineNumbers: true,
          mode: "javascript",
          theme: "night",
          //keyMap: "vim",
          indentUnit: 4,
          indentWithTabs: true,
          autoCloseBrackets: true,
          matchBrackets: true,
          matchTags: true,
          autoCloseTags: true
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
        icons: true
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
    editor.replaceRange("new stuff\n", {line:0,ch:0}, {line:0,ch:line.length});
    // increment the counter when button is clicked
    instance.counter.set(instance.counter.get() + 1);
  },
});

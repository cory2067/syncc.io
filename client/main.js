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

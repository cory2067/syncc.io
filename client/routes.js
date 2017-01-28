import { Session } from 'meteor/session'
import { EditorContents } from '../collections/editor'
import { EditUsers } from '../collections/editusers'

FlowRouter.route('/', {
    action: function(params) {
        BlazeLayout.render('App', {main: 'HomePage'});
    }
});

FlowRouter.route('/neditor', {
    action: function(params) {
        BlazeLayout.render('App', {main: 'NeditorPage'})
    }
});

FlowRouter.route('/editor', {
    action: function(params) {
        BlazeLayout.render('App', {main: 'EditorPage'})
    }
});

FlowRouter.route('/about', {
    action: function(params) {
        BlazeLayout.render('App', {main: 'AboutPage'})
    }
});

FlowRouter.route('/projects', {
    action: function(params) {
        BlazeLayout.render('App', {main: 'ProjectsPage'})
    }
});


FlowRouter.route('/notfound', {
  action: function(params) {
    BlazeLayout.render('App', {main: '404Page'});
  }
});

import closeEditor from '/client/js/editor';
FlowRouter.route('/:editID', {
    action: function(params) {
        /*let a = EditUsers.find({}).fetch();
        console.log(a);
        if(!EditUsers.find({editor: params['editID']}).fetch().length) {
          Meteor.call("openFile", params['editID']);
        }*/
        BlazeLayout.render('App', {main: 'EditorPage'})
    },

    triggersExit: function() {
      Session.set("userID", null);
      Session.set("editing", false);
    }
});

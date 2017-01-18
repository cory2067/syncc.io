import { Session } from 'meteor/session'

FlowRouter.route('/', {
    action: function(params) {
        BlazeLayout.render('App', {main: 'HomePage'});
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

import closeEditor from '/client/js/editor';
FlowRouter.route('/:editID', {
    action: function(params) {
        BlazeLayout.render('App', {main: 'EditorPage'})
    },

    triggersExit: function() {
      Session.set("userID", null);
      Session.set("editing", false);
    }
});

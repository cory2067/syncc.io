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

FlowRouter.route('/:editID', {
    action: function(params) {
        BlazeLayout.render('App', {main: 'EditorPage'})
    }
});

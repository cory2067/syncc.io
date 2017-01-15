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

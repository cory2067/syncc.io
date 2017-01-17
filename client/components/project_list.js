Template.ProjectList.helpers({
    docs: function () {
        return Documents.find({"metadata.owner": Meteor.userId()});
    }
});

Template.ProjectList.events({
    'click #remove': function(event, template) {
        Documents.remove({_id:this._id});
    }
});

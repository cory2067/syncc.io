Template.ProjectList.helpers({
    docs: function () {
        var a = Documents.find({"metadata.owner": Meteor.userId()}).fetch();
        for(var entry=0; entry<a.length; entry++) {
          a[entry]['date'] = a[entry].original.updatedAt.toString().substring(0, 15);
        }
        return a;
    }
});

Template.ProjectList.events({
    'click #remove': function(event, template) {
        Documents.remove({_id:this._id});
    }
});

Template.ProjectList.helpers({
    docs: function () {
        var a = Documents.find({"metadata.owner": Meteor.userId()}).fetch();
        console.log(Meteor.users.find().fetch());
        for(var entry=0; entry<a.length; entry++) {
          a[entry]['date'] = a[entry].original.updatedAt.toString().substring(0, 15);
          a[entry]['user'] = Meteor.users.find(a[entry].metadata.owner).fetch()[0].emails[0].address;
        }
        return a;
    }
});

Template.ProjectList.events({
    'click #remove': function(event, template) {
        Documents.remove({_id:this._id});
    }
});

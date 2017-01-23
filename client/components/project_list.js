import { Meteor } from 'meteor/meteor';

Template.ProjectList.onCreated(()=>{
    Meteor.subscribe('currjson');
    Meteor.subscribe('documents');
    Meteor.subscribe('editusers');
});

Template.ProjectList.helpers({
    docs: function () {
        var a = Documents.find({"userId": Meteor.userId()}).fetch();
        console.log(Meteor.users.find().fetch());
        for(var entry=0; entry<a.length; entry++) {
          //a[entry]['date'] = a[entry].original.updatedAt.toString().substring(0, 15);
          //a[entry]['user'] = Meteor.users.find(a[entry].userId).fetch()[0].emails[0].address;
        }
        return a;
    }
});

Template.ProjectList.events({
    'click #remove': function(event, template) {
        Documents.remove({_id:this._id});
    }
});

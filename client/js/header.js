Template.Header.events({
    'click #editor': function(event, template) {
      var nameInput;
      nameInput = prompt("Name of new file", "helloworld.py");
      console.log(nameInput);
      Meteor.call('newFile', nameInput, function() {
        Meteor.call("getPath", function(err, path) {
          var full = path + "/files/" + nameInput;
          var found = Documents.find({path: full}).fetch()
          if(found.length > 1) {
            alert("Please give your file a unique name!");
          } else if(found.length == 1) {
            window.location.href = "/" + found[0]['_id'];
          }
        });
    });
  }
});

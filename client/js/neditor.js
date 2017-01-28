import { Documents } from '../../collections/files'

Template.NeditorPage.onCreated(() => {
  Meteor.subscribe("documents");
});

Template.NeditorPage.onRendered(() => {
    setTimeout(() => {$("#tree-toggle").click()}, 50);
    Meteor.call("getPath", function(err, path) {
      $("#jstree").on("activate_node.jstree", (a,b)=>{
        var filePath = $("#jstree").jstree(true).get_path(b.node).join('/');
        var full = path + "/files/"+Meteor.userId()+"/" + filePath;
        console.log(full);
        var found = Documents.find({path: full}).fetch()
        console.log(found);
        if(found.length > 1) {
          console.log("oh hecc this isnt supposed to happen, but im not gonna do anything about it");
        }
        if(found.length) {
          window.location.href = "/" + found[0]['_id'];
        }
      });
    });
});

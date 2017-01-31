import { Documents } from '../../collections/files'
import { Session } from 'meteor/session'

Template.ProjectsPage.onCreated(() => {
	Meteor.subscribe("documents");
});

Template.ProjectsPage.onRendered(() => {
	function readfiles(files) {
		//iterate through only the first file dragged
		//multifile support maybe later

		if(files.length) //if there's actually something here
		{
			file = files[0];
			Session.set("loading", true);
      if (file) {
          var uploadInstance = Documents.insert({
              file: file,
              streams: 'dynamic',
              chunkSize: 'dynamic',
              onBeforeUpload: function(file) {
                  if (file.size <= 10485760) {
                      return true;
                  } else {
                      return ('Please upload files less than 10MB');
                      Session.set("loading", false);
                  }
              }
          }, false);
          uploadInstance.on('error', function(error, fileObj) {
              alert('Error during upload: '+error);
          });
          uploadInstance.on('end', function(error, fileObj) {
              if (error) {
                  console.log("error uploading" + error);
              } else {
                  console.log("File " + fileObj.name + " successfully uploaded");
                  Meteor.call("assignFile", [fileObj._id, fileObj.name]);
                  Meteor.call("updateJSON", Meteor.userId());
              }
              Session.set("loading", false);
          });
          Meteor.call("getPath", function(err, path) {
              var full = path + "/files/" + Meteor.userId()+"/"+file.name;
              var found = Documents.find({path: full}).fetch();
              if(found.length > 0) {
                  alert("This file already exists. Delete the existing file before uploading again");
                  Session.set("loading", false);
              } else {
                  uploadInstance.start();
              }
          });
      }
			return true;
		}

		return false;
	}

	var dragarea = document.getElementById('projbgd');
	var dragTimeout = null;
	//the next two lines are mostly for styling (see #wrapper.hover)
	dragarea.ondragover = function () {
		clearTimeout(dragTimeout);
		this.className = 'hover';
		return false;
	 };
	dragarea.ondragleave = function () {
		clearTimeout(dragTimeout);
		dragTimeout = setTimeout(function() {
			console.log("timed out")
			dragarea.className = '';
		}, 300);
		return false;
	};

	dragarea.ondrop = function (e) {
		this.className = '';
		e.preventDefault();
		var filesUploaded = readfiles(e.dataTransfer.files);

		if(!filesUploaded) {
			console.log("kore wa fairu janai desu yo!");
		}
	}
});

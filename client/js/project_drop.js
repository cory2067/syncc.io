import { Documents } from '../../collections/files'
import { Session } from 'meteor/session'
import { Random } from 'meteor/random'

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
			var name = file.name.split('.');
			var zip = name[name.length-1]=='zip';
			Session.set("loading", true);
      if (!zip) {
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
      else {
					console.log("doing the zip")
          var uploadInstance = Documents.insert({
              file: file,
              streams: 'dynamic',
              chunkSize: 'dynamic',
              onBeforeUpload: function (file) {
                  if (/zip/i.test(file.extension)) {
                  } else {
                      alert('Only allowed to add zip files, use the upload files feature instead')
                      Session.set("loading", false);
                  }
                  if (file.size <= 10485760) {
                      return true;
                  } else {
                      alert('Please upload files less than 10MB');
                      Session.set("loading", false);
                  }
              }
          }, false);
          uploadInstance.on('end', function (error, fileObj) {
              if (error) {
                  console.log("Error uploading" + error);
              } else {
                  console.log("Successfully uploaded" + fileObj.name);
                  Meteor.call("assignFile", [fileObj._id, fileObj.name], function() {
                      Meteor.call('unzip', [fileObj.name, fileObj._storagePath], function() {
                        Session.set("foldersRendered", Random.id());
                        Session.set("loading", false);
                      });
                  });
                  Meteor.call("updateJSON", Meteor.userId());
              }
          });
          uploadInstance.start();
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

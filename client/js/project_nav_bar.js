import fs from 'fs'
import DirectoryStructureJSON from 'directory-structure-json'
import { CurrJSON } from '../../collections/json'
import { Tracker } from 'meteor/tracker'
import { Meteor } from 'meteor/meteor';

Template.TreeProj.onCreated(() => {
  Meteor.subscribe("currjson")
});
Template.TreeProj.onRendered(function () {
      this.$('#jstree').jstree({
      "themes": {
        "theme": "apple"
      },
      core: {
        themes: {
          name: 'proton',
          dots: true,
          icons: true,
          responsive: true
        },
        data: {text: "Loading..."}
      }

      });
    /*$("body").click(function() {
      if($('.login-close-text')[0]) {
        $(".login-close-text")[0].click();
      }
      //add exclude if in the accounts-dialog div
    });*/
    Meteor.call("updateJSON", Meteor.userId());
    Tracker.autorun(function(c) {
      var entry = CurrJSON.findOne();
      if(!entry) {
        return;
      }
      var str_JSON = entry.json;
      str_JSON = str_JSON.replace(/name/g, 'text');
      //console.log(str_JSON);
      var tree = JSON.parse(str_JSON);
      $('#jstree').jstree(true).settings.core.data = tree;
      $('#jstree').jstree(true).refresh();
    });
  });

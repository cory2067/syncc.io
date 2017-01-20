import fs from 'fs'
import DirectoryStructureJSON from 'directory-structure-json'
import { CurrJSON } from '../../collections/json'

Template.TreeProj.onRendered(function () {
    /*$("body").click(function() {
      if($('.login-close-text')[0]) {
        $(".login-close-text")[0].click();
      }
      //add exclude if in the accounts-dialog div
    });*/
    

  Meteor.call('updateJSON');
  var tree = CurrJSON.findOne();
  console.log(tree.json);
  this.$('#jstree').jstree({
    'core': {
        'data': JSON.parse(tree.json)
    }
  });
});


import fs from 'fs'
import DirectoryStructureJSON from 'directory-structure-json'
import { CurrJSON } from '../../collections/json'
import { Tracker } from 'meteor/tracker'

Template.TreeProj.onRendered(function () {
    /*$("body").click(function() {
      if($('.login-close-text')[0]) {
        $(".login-close-text")[0].click();
      }
      //add exclude if in the accounts-dialog div
    });*/

    Meteor.call('updateJSON');
    var str_JSON = CurrJSON.findOne().json;
    str_JSON = str_JSON.replace(/name/g, 'text');
    console.log(str_JSON);
    var tree = JSON.parse(str_JSON);
    this.$('#jstree').jstree({
    core: {
      themes: {
        name: 'proton',
        dots: true,
        icons: true,
        responsive: true
      },
      data: (tree)
    }
    });
});

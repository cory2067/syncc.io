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


    var tree = JSON.parse(CurrJSON.findOne().json)
    for(var q=0; q<tree.length; q++){
      console.log('tes')
      tree[q]['text'] = tree[q]['name'];
    }
    console.log(tree);
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

#Do this when Bcrypt breaks
##The Error
'npm ERR! Failed at the bcrypt@1.0.2 install script...'

##The Solution
Do the following one line at a time, and proceed to the next step when a new 'Error' appears.

'''
npm install --save bcrypt-nodejs && npm uninstall --save bcrypt

meteor npm install --save fibers

meteor npm install --save underscore

meteor npm install --save source-map-support
'''



(may need to reclone before doing the above)
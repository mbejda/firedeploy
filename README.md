![](http://res.cloudinary.com/lqyghlh2f/image/upload/v1511753169/Copy_of_oh_javascript_es3xi0.png)

## FireDeploy
FireDeploy is a small CLI tool which can also be used as a dependency module for deploying single page applications to Firebase. It was built for serverless environments and can be used in environments that have memory constraints. I.E AWS Lambda, Google Functions. It does not use heavy dependencies such as firebase, firebase-tools (143mb), firebase-admin and weighs < 10mb.

- Does not use Firebase modules
- Size < 10mb
- Only has 7 dependencies
- Can be used as a module dependency or as a CLI

### Installation
#### Module Dependency
```bash
npm install firedeploy --save
```
#### CLI
```bash
npm install -g firedeploy
```

### Module
Usage Example :
```javascript
 const FireDeploy = require('firedeploy');
 let settings = {
     releaseVersion: "someversion",
     releaseMessage: "hello world!",
     cwd: "./path/to/index.html directory",
     projectId: "Firebase Project Name",
     token: "Firebase CI Token",
     debug: false
 };


 let fireDeploy = new FireDeploy(settings);

 fireDeploy.prepareUpload().then((preparedFiles) => {
     fireDeploy.upload(preparedFiles).then(_ => {
         fireDeploy.release().then(_ => {

         console.log("Done");

         }).catch((e) => {

         })
     }).catch((e) => {

     })
 }).catch((e) => {

 })
```
### Supports Chaining
```javascript
const FireDeploy = require('firedeploy');

 let settings = {

 };

 let fireDeploy = new FireDeploy(settings);
 fireDeploy
     .setVersion("new version")
     .setMessage("New Message")
     .setProjectId("firebaseProject")
     .setCWD("some/project/directory")
     .setToken("ciToken").prepareUpload().then((preparedFiles) => {
         fireDeploy.upload(preparedFiles).then(_ => {
             fireDeploy.release().then(_ => {




             }).catch((e) => {


             })
         }).catch((e) => {


         })
     }).catch((e) => {


     })

```
## CLI
Example Usage :
```bash
$ firedeploy hosting -m "Message" -c "/fireDeploy/spec/test" -p "project name" -t "CI Token"
```
If you are experiencing any issues please create an issue ticket or send me a tweet. [@notmilobejda](https://twitter.com/notMiloBejda)

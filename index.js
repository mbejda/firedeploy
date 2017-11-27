const fs = require('fs');
const tar = require('tar');
const tmp = require('tmp');
const glob = require('glob').sync;
const api = require('./lib/api');
const fsutils = require('./lib/fsutils');


module.exports = class FireDeploy {

    constructor(settings) {

        this.settings = Object.assign({
            releaseVersion:"key-"+Math.floor(Date.now() / 1000),
            releaseMessage:"Deployed by FireDeploy",
            cwd:"./",
            projectId:false,
            token:false,
            ignore:[]
        },settings);


        if(this.settings.token){
            this.setToken(this.settings.token);
        }
    }

    /// create a version key
    createVersion(){
        return "key-"+Math.floor(Date.now() / 1000);
    }

    /// sets the CI token
    setToken(token){
        this.settings.token = token;
        api.setRefreshToken(token);
        return this;
    }

    /// alias for setToken
    setFirebaseToken(token){
        this.settings.token = token;
        api.setRefreshToken(token);
        return this;
    }
    /// set ProjectId
    setProjectId(projectId){
        this.settings.projectId = projectId;
        return this;
    }

    /**
     * convenience method for chaining
     * @param cwd
     * @returns {FireDeploy}
     */
    setCWD(cwd){
        this.settings.cwd = cwd;
        return this;
    }

    /**
     * Convenience method for chaining
     * @param version
     * @returns {FireDeploy}
     */
    setVersion(version){
        if(typeof version !== 'string'){
            throw new Error("Version needs to be a string");
        }
        this.settings.releaseVersion = version;
        return this;
    }

    /**
     * Convenience method
     * @param message
     * @returns {FireDeploy}
     */
    setMessage(message){
        this.settings.releaseMessage = message;
        return this;
    }

    /**
     * Upload project to Firebase
     * @param preparedUpload
     * @param releaseMessage
     * @param releaseVersion
     * @returns {Promise}
     */
    upload(preparedUpload,releaseMessage=this.settings.releaseMessage,releaseVersion=this.settings.releaseVersion){

        return new Promise((resolve,reject)=> {

            if(typeof preparedUpload !== "object"){

                reject({"message":"Missing prepared uploads"});
                return;

            }


            if(!this.settings.token){
                reject({message:`Firebase CI token is missing`});
                return;
            }

            if(typeof releaseVersion != 'string'){
                reject({message:`Version needs to be a string`});
                return;
            }

            if(!this.settings.projectId){
                reject({message:"Missing projectId"});
                return;
            }

            api.request('PUT', `/v1/hosting/${this.settings.projectId}/uploads/${releaseVersion}`, {
                auth: true,
                debug:this.settings.debug,
                query: {
                    fileCount: preparedUpload.manifest.length,
                    message: releaseMessage,
                },
                files: {
                    site: {
                        filename: 'site.tar.gz',
                        stream: preparedUpload.stream,
                        contentType: 'application/x-gzip',
                        knownLength: preparedUpload.size
                    }
                },
                origin: api.deployOrigin
            }).then(function () {

                fs.unlinkSync(preparedUpload.file);
                resolve();
            }).catch(reject);
        });
    }

    /***
     * Create prepare for upload
     * @param publicDir
     * @param ignore
     * @returns {Promise}
     */
    prepareUpload(publicDir=this.settings.cwd,ignore = this.settings.ignore){
        this.ignore = ignore;

        return new Promise((resolve,reject)=> {



            if(!this.settings.token){
                reject({message:`Firebase CI token is missing`});
                return;
            }



            let tmpFile = this.tmpFile;
            let manifest = this.manifest;
            let indexPath = publicDir + '/index.html';


            if(!fsutils.fileExistsSync(indexPath)){
                reject({message:`index.html not found in ${publicDir}`});
                return;
            }

            return tar.c({
                gzip: true,
                file: tmpFile.name,
                cwd: publicDir,
                prefix: 'public',
                follow: true,
                noDirRecurse: true,
                portable: true
            }, manifest.slice(0)).then(function () {
                var stats = fs.statSync(tmpFile.name);
                resolve({
                    file: tmpFile.name,
                    stream: fs.createReadStream(tmpFile.name),
                    manifest: manifest,
                    foundIndex: fsutils.fileExistsSync(indexPath),
                    size: stats.size
                });
            }).catch(reject);
        });
    }

    /**
     * Creates a project release
     * */
    release() {
        return new Promise((resolve, reject) => {


            if (!this.settings.projectId) {
                reject({message: "Missing projectId"});
                return;
            }

            if (!this.settings.token) {
                reject({message: `Firebase CI token is missing`});
                return;
            }

            return api.request('POST', `/v1/projects/${this.settings.projectId}/releases`, {
                data: this.firebase,
                auth: true,
                origin: api.deployOrigin,
                debug: this.settings.debug
            }).then(resolve).catch(reject);
        })
    }

    /**
     * Get firebase release object
     * @returns {{hosting: {version: (string|*|string|number), prefix: string, manifest: Array}}}
     */
    get firebase(){

        return {
            hosting : {
                version:this.settings.releaseVersion,
                prefix:this.settings.releaseVersion+"/",
                manifest:[]
            }
        };

    }

    /**
     * create a temporary file archive that gets uploaded to firebase
     * */
    get tmpFile(){
        return tmp.fileSync({prefix: 'firebase-upload-', postfix: '.tar.gz'});
    }

    /**
     * Get a list of all project files that need to get archived
     * */
    get manifest() {
        return glob('**/*', {
            cwd: this.settings.cwd,
            ignore: ['**/firebase-debug.log'].concat(this.settings.ignore || []),
            nodir: true,
            nosort: true,
            follow: true,
            dot: true
        });
    }

};


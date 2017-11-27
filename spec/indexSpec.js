var fs = require('fs');


describe("Test FireDeploy", function() {
    var FireDeploy = require('../index');


    var settings;

    beforeEach(function() {
        settings = {
            releaseVersion:"release",
            releaseMessage:"test message",
            cwd:__dirname+"/test",
            projectId:"123",
            token:"123",
            ignore:["1.html"]
        };
    });


    it("Project Settings", function() {

        let fireDeploy = new FireDeploy(settings);

        expect(fireDeploy.settings).toEqual(jasmine.objectContaining(settings));


    });

    it("Release Settings", function() {

        let fireDeploy = new FireDeploy(settings);
        expect(fireDeploy.firebase).toEqual(jasmine.objectContaining({
            hosting:{
                version:settings.releaseVersion,
                prefix:settings.releaseVersion+"/",
                manifest:[]
            }
        }));

    });

    it("Setting through convenience methods", function() {

        let fireDeploy = new FireDeploy(settings);

        fireDeploy.setProjectId("1");
        expect(fireDeploy.settings.projectId).toBe("1");

        fireDeploy.setCWD("cwd");
        expect(fireDeploy.settings.cwd).toBe("cwd");

        fireDeploy.setFirebaseToken("token");
        expect(fireDeploy.settings.token).toBe("token");

        fireDeploy.setToken("token2");
        expect(fireDeploy.settings.token).toBe("token2");

        fireDeploy.setMessage("message");
        expect(fireDeploy.settings.releaseMessage).toBe("message");


        expect(fireDeploy.setVersion).toThrowError("version needs to be a string");

    });

    it("checking tmp file", function() {

        let fireDeploy = new FireDeploy(settings);
        expect(fireDeploy.tmpFile.name).toBeDefined();

    });

    it("manifest", function() {

        let fireDeploy = new FireDeploy(settings);

        expect(fireDeploy.manifest).toContain("index.html");

    });

    it("prepareUpload() success", function(done) {

        let fireDeploy = new FireDeploy(settings);
        fireDeploy.prepareUpload().then((preparedUpload)=>{

            fs.unlinkSync(preparedUpload.file);
            expect(preparedUpload.file).toBeDefined();
            done();


        }).catch((error)=>{

            expect(error).not.toBeUndefined();


        })

    });

    it("prepareUpload() without ci token", function(done) {

        delete settings.token;
        let fireDeploy = new FireDeploy(settings);
        fireDeploy.prepareUpload().then((preparedUpload)=>{

            expect(preparedUpload).not.toBeUndefined();


        }).catch((error)=>{

            expect(error.message).not.toBeUndefined();
            done();

        })

    });


    it("upload() without preparedUpload object", function(done) {

        delete settings.token;
        let fireDeploy = new FireDeploy(settings);
        fireDeploy.upload().then(()=>{


        }).catch((error)=>{

            expect(error.message).toEqual('Missing prepared uploads');
            done();

        })

    });


    it("upload() without projectId", function(done) {

        delete settings.projectId;
        let fireDeploy = new FireDeploy(settings);
        fireDeploy.upload({}).then(()=>{


        }).catch((error)=>{

            expect(error.message).toEqual('Missing projectId');
            done();

        })

    });

    it("upload() without ci token", function(done) {

        delete settings.token;
        let fireDeploy = new FireDeploy(settings);
        fireDeploy.upload({}).then(()=>{


        }).catch((error)=>{

            expect(error.message).toEqual('Firebase CI token is missing');
            done();

        })

    });


    it("upload() release version needs to be a string", function(done) {

        settings.releaseVersion = 123;
        let fireDeploy = new FireDeploy(settings);
        fireDeploy.upload({}).then(()=>{


        }).catch((error)=>{

            expect(error.message).toEqual('Version needs to be a string');
            done();

        })

    });


    it("release() without projectId", function() {

        delete settings.projectId;
        let fireDeploy = new FireDeploy(settings);

        fireDeploy.release().then(_=>{}).catch((error)=>{
            expect(error.message).toEqual('Missing projectId');

        });


    });

    it("release() without token", function() {

        delete settings.token;
        let fireDeploy = new FireDeploy(settings);

        fireDeploy.release().then(_=>{}).catch((error)=>{
            expect(error.message).toEqual('Firebase CI token is missing');

        });

    });



});


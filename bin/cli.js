#! /usr/bin/env node
const program = require('commander');
const colors = require('colors');
var CLI_VERSION = require('../package.json').version;


const FireDeploy = require('../index');

program
    .command('hosting')
    .description('Lightweight command line tool for deploying single page applications to Firebase')
    .option("-rv, --releaseVersion [rv]", "version of the deployment")
    .option("-m, --message [m]", "deployment message","Deployed by FireDeploy")
    .option("-c, --cwd <c>", "path to index.html")
    .option("-p, --projectId <p>", "Firebase project name")
    .option("-t, --token <t>", "Firebase CI token")
    .option("-d, --debug [d]", "Debug requests",false)
    .action(function(options,env) {

        return new Promise((resolve, reject) => {

            let settings = {
                releaseVersion: options.releaseVersion ,
                releaseMessage: options.message,
                cwd: options.cwd,
                projectId: options.projectId,
                token: options.token,
                debug:options.debug
            };


            let fireDeploy = new FireDeploy(settings);
            if(!options.releaseVersion) {

                let version = fireDeploy.createVersion();
                fireDeploy.setVersion(version);
                console.log(colors.green(`Deploying version ${version}`));


            }else{

                    console.log(colors.green(`Deploying version ${options.releaseVersion}`));

            }




            fireDeploy.prepareUpload().then((preparedFiles) => {
                fireDeploy.upload(preparedFiles).then(_ => {
                    fireDeploy.release().then(_ => {

                        console.log(colors.green(`Done`));

                        resolve();

                    }).catch((e) => {

                        console.log(colors.red(`Error ${e.message}`));
                        reject(e);

                    })
                }).catch((e) => {

                    console.log(colors.red(`Error ${e.message}`));
                    reject(e);

                })
            }).catch((e) => {

                console.log(colors.red(`Error ${e.message}`));
                reject(e);

            })

        });

    });
program.on('--help', function(){
    let log = `firedeploy hosting -m "Message" -c "/fireDeploy/spec/test" -p "project name" -t "CI Token"`;

    console.log('  Example Usage:  ');
    console.log('');
    console.log(`  $ ${log}`);
    console.log('');
});
program.parse(process.argv);

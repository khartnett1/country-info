'use strict';

/*
Amazon Lambda function in NodeJS that will call the country-information API and then return formatted information to the user.

This template came from Amazon's Lambda repository.

Kevin Hartnett CPSC 470 Project
*/

const AWS = require('aws-sdk');
const qs = require('querystring');
var https = require('https');

var endOfLine = require('os').EOL;

const kmsEncryptedToken = process.env.kmsEncryptedToken;
let token;


function processEvent(event, callback) {
    const params = qs.parse(event.body);
    const requestToken = params.token;
    if (requestToken !== token) {
        console.error(`Request token (${requestToken}) does not match expected`);
        return callback('Invalid request token');
    }

    const user = params.user_name;
    const command = params.command;
    const channel = params.channel_name;
    const commandText = params.text;
    
    if(commandText == 'help') {
        var stringBuilder = {
        "text": "Here are some common commands for the Country bot: */country* contains five options, each of which must be followed by a single word parameter:\n*/country currency* will return the list of countries using a particular currency (ex USD) \n \tex: `/country currency RUB` will yield Russia\n*/country capital* will return the country whose capital is the parameter that is given:\n\tex: `/country capital Budapest` will yield Hungary\n*/country dom* will return the country associated with the top-level domain code entered:\n\tex: `/country dom de` will yield Germany\n*/country callcode* will return the country whose intl call code matches what is given:\n\tex: `/country callcode 20` will yield Egypt\n*/country name* takes in the native country name and outputs the english version:\n\tex: `/country name Deustchland` will yield Germany"
        };
        
        callback(null, stringBuilder);
    }
    var sCmd = commandText.split(' ');
    var options;
    if(sCmd[0] == 'dom') {
     options = {
       host: 'restcountries-v1.p.mashape.com',
       port: 443,
       path: `/alpha/${sCmd[1]}`,
       headers: {
          'X-Mashape-Key': 'JRHXyAwNzcmshJWzqsuwUkKS4pdVp1GQ3IajsnkYNP4mD3SKEq'
        }   
    };
    }
    
    else if(sCmd[0] == 'capital') {
    options = {
       host: 'restcountries-v1.p.mashape.com',
       port: 443,
       path: `/capital/${sCmd[1]}`,
       headers: {
          'X-Mashape-Key': 'JRHXyAwNzcmshJWzqsuwUkKS4pdVp1GQ3IajsnkYNP4mD3SKEq'
        }   
    };
        
    }
    
    else if(sCmd[0] == 'currency') {
        options = {
           host: 'restcountries-v1.p.mashape.com',
           port: 443,
           path: `/currency/${sCmd[1]}`,
           headers: {
              'X-Mashape-Key': 'JRHXyAwNzcmshJWzqsuwUkKS4pdVp1GQ3IajsnkYNP4mD3SKEq'
            }   
    };
    }
    
    else if(sCmd[0] == 'name') {
        options = {
           host: 'restcountries-v1.p.mashape.com',
           port: 443,
           path: `/name/${sCmd[1]}`,
           headers: {
              'X-Mashape-Key': 'JRHXyAwNzcmshJWzqsuwUkKS4pdVp1GQ3IajsnkYNP4mD3SKEq'
        }   
        };
        
    }
    
    else if(sCmd[0] == 'callcode') {
     options = {
       host: 'restcountries-v1.p.mashape.com',
       port: 443,
       path: `/callingcode/${sCmd[1]}`,
       headers: {
          'X-Mashape-Key': 'JRHXyAwNzcmshJWzqsuwUkKS4pdVp1GQ3IajsnkYNP4mD3SKEq'
        }   
    };
        
    }

    else {
     options = {
       host: 'restcountries-v1.p.mashape.com',
       port: 443,
       path: `/callingcode/${sCmd[1]}`,
       headers: {
          'X-Mashape-Key': 'JRHXyAwNzcmshJWzqsuwUkKS4pdVp1GQ3IajsnkYNP4mD3SKEq'
        }   
    };
        
    }

    https.get(options, function(res){
    var body = '';

    res.on('data', function(chunk){
       // if(chunk.includes("404"))
      //      callback(null, { "text" : `No country of that  ${sCmd[0]} found.` });
        body += chunk;

    });


    res.on('end', function(){
        
        var udResponse = "";
        try{
          udResponse = JSON.parse(body);
        }
        catch(e) {
            callback(null,"invalid");
            process.exit();
        }
        if(sCmd[0] == 'capital') {
        if(!body.includes("["))
                callback(null, { "text" : "No country with this capital could be found."});
            callback(null, { "text" : `The country whose capital is ${sCmd[1]} is *${udResponse[0].name}*` });
        }
        
        else if(sCmd[0] == 'dom') {
            if(udResponse.name !== undefined)
                callback(null, { "text" : `The country whose domain code is ${sCmd[1]} is *${udResponse.name}* :flag-${sCmd[1]}:`});
           else
                callback(null, { "text" : "Sorry, this did not match any domain code in the database." });
        }
        
        else if(sCmd[0] == 'callcode') {
            if(udResponse.length < 2)
                callback(null, { "text" : `The country whose calling code is ${sCmd[1]} is *${udResponse[0].name}*` });
            else {
                var cList = '\n';
                for(var i = 0; i < udResponse.length; i++)
                    cList += "• " + udResponse[i].name + '\n';
                callback(null, { "text" : `The countries whose calling code is ${sCmd[1]} are ${cList}` });
            }
        }
        
        else if(sCmd[0] == 'currency') {
        if(!udResponse) {
            callback(null, "no");
        }
            if(udResponse.message !== undefined) {
                callback(null,{ "text":"No country using that currency could be found." });
            }
             if(udResponse.length < 2)
                callback(null, { "text" : `The country that uses currency ${sCmd[1]} is *${udResponse[0].name}*`});
            else {
            var sList = '\n';
            for(var h = 0; h < udResponse.length; h++) {
                sList += '• ' + udResponse[h].name + '\n';
            }
            callback(null, { "text" : `The countries that use currency ${sCmd[1]} are ${sList}` });
            }
        }
        
        else if(sCmd[0] == 'name') {
            if(udResponse.message !== undefined)
                callback(null, { "text" : "No such country could be found."});
            callback(null, { "text" : `The country whose native name is ${sCmd[1]} is *${udResponse[0].name}*` });
        }
        
        
        else {
            var hJson = {
    "attachments": [
        {
            "fallback": "The command entered was invalid.",
            "color": "#ff0000",
            "pretext": "Sorry, you entered an invalid command!",
            "author_name": "Try /country help"
        }
    ]
};
        
            callback(null, hJson);
        }
        
        });

}).on('error', function(e){
      console.log("Got an error: ", e);
      callback(null,"got error");
});
    

}
exports.handler = (event, context, callback) => {
    const done = (err, res) => callback(null, {
        statusCode: err ? '200' : '200',
        body: err ? { "text":"Sorry, there was a problem with that last command."} : JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json',
        },
    }
    );

    if (token) {
        // Container reuse, simply process the event with the key in memory
        processEvent(event, done);
    } else if (kmsEncryptedToken && kmsEncryptedToken !== '<kmsEncryptedToken>') {
        const cipherText = { CiphertextBlob: new Buffer(kmsEncryptedToken, 'base64') };
        const kms = new AWS.KMS();
        kms.decrypt(cipherText, (err, data) => {
            if (err) {
                console.log('Decrypt error:', err);
                return done(err);
            }
            token = data.Plaintext.toString('ascii');
            processEvent(event, done);
        });
    } else {
        done('Token has not been set.');
    }
};


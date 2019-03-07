
"use strict";

const _ = require('lodash');
var request = require('request');
var uniqid = require('uniqid');
const config = require('./config.json');
var express = require('express')
var bodyParser = require('body-parser')
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')

// module variables
const defaultConfig = config.development;
const environment = process.env.NODE_ENV || 'development';
const environmentConfig = config[environment];
const finalConfig = _.merge(defaultConfig, environmentConfig);

// declare a new express app
var app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
});


// exports.handler = async (event, context, callback) => {

//     const req = {
//         'holderName': event.holderName,
//         'accountNumber': event.accountNumber,
//         'amount': event.amount,
//         'accountAccessory': event.accountAccessory,
//         'street': event.street,
//         'city': event.city,
//         'state': event.state,
//         'zipCode': event.zipCode,
//         'customerAccountCode': event.customerId
//     };

//     const response = await ziftChargePurchased(req, context, callback);
//     return response;
// };

const ziftChargePurchased = async (req) => {
    var headers = {
        'User-Agent': 'Super Agent/0.0.1',
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    var options = {
        url: finalConfig.apiUrlProcessing,
        method: 'POST',
        headers: headers,
        form: {
            'requestType': finalConfig.requestType,
            'userName': finalConfig.username,
            'password': finalConfig.password,
            'accountId': finalConfig.accountId,
            'amount': req.amount,
            'accountType': finalConfig.accountType,
            'transactionIndustryType': finalConfig.transactionIndustryType,
            'holderType': finalConfig.holderType,
            'holderName': req.holderName,
            'accountNumber': req.accountNumber,
            'accountAccessory': req.accountAccessory,
            'street': req.street,
            'city': req.city,
            'state': req.state,
            'zipCode': req.zipCode,
            'customerAccountCode': req.customerAccountCode,
            'transactionCode': generateTransactionCode()
        }
    };

    return new Promise(function (resolve, reject) {
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200 && !(~body.indexOf("exception"))) {
                // Print out the response body    
                resolve(response);
            } else {
                reject(response);
            }
        });
    });
};

const generateTransactionCode = () => {
    return uniqid();
};

app.get('/ziftApi', function(req, res) {
    // Add your code here
    res.json({success: 'Zift API...', url: req.url});
});

app.post('/ziftApi', async function(req, res) {
    // const req1 = {
    //     'holderName': event.holderName,
    //     'accountNumber': event.accountNumber,
    //     'amount': event.amount,
    //     'accountAccessory': event.accountAccessory,
    //     'street': event.street,
    //     'city': event.city,
    //     'state': event.state,
    //     'zipCode': event.zipCode,
    //     'customerAccountCode': event.customerId
    // };
    try {
        const response = await ziftChargePurchased(req.body);
        res.status(200).send(response);
    } catch (error) {
        res.status(400).send(error);
    }
    
});

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
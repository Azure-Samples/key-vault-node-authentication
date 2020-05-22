/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for
 * license information.
 */
'use strict';

const util = require('util');
const msRestAzure = require('ms-rest-azure');
const { SecretClient } = require('@azure/keyvault-secrets')
const { DefaultAzureCredential } = require("@azure/identity");
const AuthenticationContext = require('adal-node').AuthenticationContext;
const KeyVaultManagementClient = require('azure-arm-keyvault');
const ResourceManagementClient = require('azure-arm-resource').ResourceManagementClient;
const random_id = require('./random_id');

const dotenv = require('dotenv');
dotenv.config();

// Sample config
const azureLocation = process.env['AZURE_LOCATION'] || 'westus';
const groupName = process.env['AZURE_RESOURCE_GROUP'] || 'azure-sample-group';

// Make sure the required environment variables are set. 
_validateEnvironmentVariables();

// Service principal details for running the sample
const subscriptionId = process.env['AZURE_SUBSCRIPTION_ID'];
const tenantId = process.env['AZURE_TENANT_ID'];
const clientId = process.env['AZURE_CLIENT_ID'];
const objectId = process.env['AZURE_CLIENT_OID'];
const secret = process.env['AZURE_CLIENT_SECRET'];

const vaultName = process.env['VAULT_NAME'];
const url = `https://${vaultName}.vault.azure.net`;

// Random sample keyvault name
const kvName = random_id();

async function authUsingAdalCallback(vaultUri) {

    const credential = new DefaultAzureCredential();
    const secretClient = new SecretClient(url, credential);
    
    const secretName = 'test-secret';
    const secretValue = 'test-secret-value';
    // Using the key vault client, create and retrieve a sample secret.
    console.log("Setting secret 'test-secret'");
    const createSecret_result = await secretClient.setSecret(secretName, secretValue);
    console.log("createSecret_result:", createSecret_result);
    const getSecret_result = await secretClient.getSecret(secretName);
    console.log("getSecret_result:", getSecret_result);
    return getSecret_result;
}

// Sample setup: uses the resource management client to create a sample resource group
// Then creates a key vault in this group and calls the authentication sample with the URI of the new vault. 
function runSample(demoCallback) {
    var resourceClient;
    var kvManagementClient;
    
    msRestAzure.loginWithServicePrincipalSecret(clientId, secret, tenantId)
    .then( (credentials) => {
        resourceClient = new ResourceManagementClient(credentials, subscriptionId);
        kvManagementClient = new KeyVaultManagementClient(credentials, subscriptionId);
        
        // Create sample resource group. 
        console.log("Creating resource group: " + groupName);
        return resourceClient.resourceGroups.createOrUpdate(groupName, { location: azureLocation });
    }).then( () => {
        const kvParams = {
            location: azureLocation,
            properties: {
                sku: { 
                    name: 'standard'
                },
                accessPolicies: [
                    {
                        tenantId: tenantId,
                        objectId: objectId,
                        permissions: {
                            secrets: ['all'],
                        }
                    }
                ],
                enabledForDeployment: false,
                tenantId: tenantId
            },
            tags: {}
        };
            
        console.log("Creating key vault: " + kvName);
            
        // Create the sample key vault using the KV management client.
        return kvManagementClient.vaults.createOrUpdate(groupName, kvName, kvParams);
    }).then( (result) => {
        console.log("Vault created with URI '" + result.properties.vaultUri + "'");
        demoCallback(result.properties.vaultUri);
    })
    .catch( (err) => { 
        console.log(err); 
    });
}

// Small util to validate that we have the correct environment variables set. 
function _validateEnvironmentVariables() {
    var envs = [];
    if (!process.env['AZURE_SUBSCRIPTION_ID']) envs.push('AZURE_SUBSCRIPTION_ID');
    if (!process.env['AZURE_TENANT_ID']) envs.push('AZURE_TENANT_ID');
    if (!process.env['AZURE_CLIENT_ID']) envs.push('AZURE_CLIENT_ID');
    if (!process.env['AZURE_CLIENT_OID']) envs.push('AZURE_CLIENT_OID');
    if (!process.env['AZURE_CLIENT_SECRET']) envs.push('AZURE_CLIENT_SECRET');

    if (envs.length > 0) {
        throw new Error(util.format('please set/export the following environment variables: %s', envs.toString()));
    }
}

// Main entry point.
console.log('Running authentication sample using ADAL callback.');
runSample(authUsingAdalCallback);
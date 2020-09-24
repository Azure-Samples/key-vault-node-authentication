/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for
 * license information.
 */
'use strict';

const util = require('util');
const msRestAzure = require('ms-rest-azure');
const KeyVault = require('azure-keyvault');
const AuthenticationContext = require('adal-node').AuthenticationContext;
const KeyVaultManagementClient = require('azure-arm-keyvault');
const ResourceManagementClient = require('azure-arm-resource').ResourceManagementClient;
const random_id = require('./random_id');

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

// Random sample keyvault name
const kvName = random_id();

// Authenticates to the Azure Key Vault by providing a callback to authenticate using ADAL.
function authUsingAdalCallback(vaultUri) {
    console.log("Using ADAL to authenticate to '" + vaultUri + "'");
    
    // Callback for ADAL authentication.
    const adalCallback = (challenge, callback) => {
        const context = new AuthenticationContext(challenge.authorization);
        return context.acquireTokenWithClientCredentials(challenge.resource, clientId, secret, (err, tokenResponse) => {
            if(err) {
                throw err;
            }
            
            // The KeyVaultCredentials callback expects an error, if any, as the first parameter. 
            // It then expects a value for the HTTP 'Authorization' header, which we compute based upon the access token obtained with the SP client credentials. 
            // The token type will generally equal 'Bearer' - in some user-specific situations, a different type of token may be issued. 
            return callback(null, tokenResponse.tokenType + ' ' + tokenResponse.accessToken);
        });
    };
    
    const keyVaultClient = new KeyVault.KeyVaultClient(new KeyVault.KeyVaultCredentials(adalCallback));
    
    // Using the key vault client, create and retrieve a sample secret.
    console.log("Setting secret 'test-secret'");
    
    keyVaultClient.setSecret(vaultUri, 'test-secret', 'test-secret-value', {})
    .then( (kvSecretBundle, httpReq, httpResponse) => {
        console.log("Secret id: '" + kvSecretBundle.id + "'.");
        var secretId = KeyVault.parseSecretIdentifier(kvSecretBundle.id);
        return keyVaultClient.getSecret(secretId.vault, secretId.name, secretId.version);
    })
    .then( (bundle) => {
        console.log("Successfully retrieved 'test-secret'");
        console.log(bundle);
    })
    .catch( (err) => {
        console.log(err);
    });
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
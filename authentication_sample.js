/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for
 * license information.
 * 
 * This file uses an outdated library.  Please see the readme to find the latest version.
 */
'use strict';

const util = require('util');
const msRestNodeAuth  = require('@azure/ms-rest-nodeauth');
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity')
const { KeyVaultManagementClient } = require('@azure/arm-keyvault');
const { ResourceManagementClient } = require('@azure/arm-resources');
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

function authUsingAAD(vaultUri) {
    console.log("Using AAD to authenticate to '" + vaultUri + "'");
    
    const credentials = new DefaultAzureCredential();
    const secretClient = new SecretClient(vaultUri, credentials);
    
    // Using the key vault client, create and retrieve a sample secret.
    console.log("Setting secret 'test-secret'");
    
    secretClient.setSecret('test-secret', 'test-secret-value')
    .then( (kvSecretBundle) => {
        console.log("Secret id: '" + kvSecretBundle.properties.id + "'.");

        return secretClient.getSecret('test-secret');
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
    
    msRestNodeAuth.loginWithServicePrincipalSecret(clientId, secret, tenantId)
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
console.log('Running authentication sample using AAD.');
runSample(authUsingAAD);

---
page_type: sample
languages:
- javascript
products:
- azure
description: "This sample repo demonstrates how to connect and authenticate to an Azure Key Vault vault."
urlFragment: key-vault-node-authentication
---

# Authentication for Azure Key Vault using the Azure Node SDK

This sample repo demonstrates how to connect and authenticate to an Azure Key Vault vault. 
To do so, it first uses the Key Vault Management Client to create a vault.
The Key Vault client is then used to authenticate to the vault and set/retrieve a sample secret. 

## This sample shows how to do the following operations of Key Vault secret with Key Vault SDK
- Create a sample resource group by the resource management client
- Create a key vault by the Key Vault Management Client
- Create the secret
- Get the secret

## Prerequisites
If you don't have an Azure subscription, please create a **[free account](https://azure.microsoft.com/free/?ref=microsoft.com&amp;utm_source=microsoft.com&amp;utm_medium=docs)** before you begin.
In addition you would need

* [Node](https://nodejs.org/)
    * Please install Node JS. This can be run on Windows, Mac and Linux.
* [Git](https://www.git-scm.com/)
    * Please download git from [here](https://git-scm.com/downloads).
* [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli?view=azure-cli-latest)
    * For the purpose of this tutorial we would work with Azure CLI which is available on Windows, Mac and Linux


## Quickstart

1. If you don't already have it, get [node.js](https://nodejs.org).

2. Clone the repo.

   ```
   git clone https://github.com/Azure-Samples/key-vault-node-authentication.git key-vault
   ```

3. Install the dependencies.

   ```
   cd key-vault
   npm install
   ```

4. Create an Azure service principals, using one of the following:
   - [Azure CLI](https://azure.microsoft.com/documentation/articles/resource-group-authenticate-service-principal-cli/),
   - [PowerShell](https://azure.microsoft.com/documentation/articles/resource-group-authenticate-service-principal/)
   - [Azure Portal](https://azure.microsoft.com/documentation/articles/resource-group-create-service-principal-portal/). 

    This service principal is to run the sample on your azure account.

5. Set the following environment variables using the information from the service principal that you created.

   ```
   export AZURE_SUBSCRIPTION_ID={your subscription id}
   export AZURE_CLIENT_ID={your client id}
   export AZURE_CLIENT_SECRET={your client secret}
   export AZURE_TENANT_ID={your tenant id as a GUID}
   export AZURE_CLIENT_OID={Object id of the service principal}
   ```

> On Windows, use `set` instead of `export`.

6. Run the sample.

    ```
    node authentication_sample.js
    ```

## Use latest Key Vault SDK

The Key Vault secrets SDK here is **@azure/keyvault-secrets**, if you are using the [latest](https://www.npmjs.com/package/@azure/keyvault-secrets) version of the key vault SDK package, please refer to the following examples:

 * [helloworld.ts](https://github.com/Azure/azure-sdk-for-js/blob/master/sdk/keyvault/keyvault-secrets/samples/typescript/src/helloWorld.ts) - Examples for common Key Vault secret tasks:

 * Create a new secret
 * Get the secret
 * Update the secret
 * Delete the secret

## References and further reading

- [Azure SDK for Node.js](https://github.com/Azure/azure-sdk-for-node)
- [Azure KeyVault Documentation](https://azure.microsoft.com/en-us/documentation/services/key-vault/)
- [Key Vault REST API Reference](https://msdn.microsoft.com/en-us/library/azure/dn903609.aspx)
- [Manage Key Vault using CLI](https://azure.microsoft.com/en-us/documentation/articles/key-vault-manage-with-cli/)
- [Storing and using secrets in Azure](https://blogs.msdn.microsoft.com/dotnet/2016/10/03/storing-and-using-secrets-in-azure/)

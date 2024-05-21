## First-time development setup
1. Get Visual Studio Code (working with 1.89.1).
1. Install the [Azure Functions Core Tools and Azurite extensions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-develop-local).
1. Install [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli).
1. Install the [Azure Web PubSub tunnel tool](https://learn.microsoft.com/en-us/azure/azure-web-pubsub/howto-web-pubsub-tunnel-tool?tabs=bash):

    ```
    npm install -g @azure/web-pubsub-tunnel-tool
    ```

1. Install the [Azure Cosmos DB emulator](https://learn.microsoft.com/en-us/azure/cosmos-db/how-to-develop-emulator?tabs=windows%2Ccsharp&pivots=api-nosql), run it, and verify the data explorer UI is available at [https://localhost:8081/_explorer/index.html](https://localhost:8081/_explorer/index.html).
1. In the `scheduler_functions` folder, create a virtual Python environment:

    ```
    python -m venv .venv
    ```

1. In the `scheduler_functions` folder, create a `local.settings.json` with the following contents, where `<connectionString>` is the value from the dev instance of the Azure Web PubSub service under Settings -> Keys -> Primary/Secondary -> Connection string, and `<cosmosEmulatorKey>` is the [well-known key value](https://learn.microsoft.com/en-us/azure/cosmos-db/how-to-develop-emulator?tabs=windows%2Cpython&pivots=api-nosql) for the cosmos emulator. Double check that the DB information is correct. Fill in the API keys as well.

    ```json
    {
        "IsEncrypted": false,
        "Values": {
            "FUNCTIONS_WORKER_RUNTIME": "python",
            "AzureWebJobsStorage": "UseDevelopmentStorage=true",
            "AzureFunctionsJobHost__logging__logLevel__default": "Debug",
            "WebPubSubConnectionString": "<connectionString>",
            "OPENAI_API_KEY": "<key>",
            "LANGCHAIN_API_KEY": "<key>",
            "LANGCHAIN_TRACING_V2": false,
            "COSMOS_DB_URL": "https://localhost:8081",
            "COSMOS_DB_KEY": "<cosmosEmulatorKey>",
            "COSMOS_DATABASE": "chatschedulerdb",
            "COSMOS_EVENT_TABLE": "events"
        },
        "Host": {
            "LocalHttpPort": 7071,
            "CORS": "*",
            "CORSCredentials": false
        }
    }
    ```
1. In Azure's web portal, in the development instance of the Azure Web PubSub service, go to Settings -> Settings, make sure there is a Hub called `chatscheduler` with "Allow anonymous clients" turned on, and an event handler that responds to no System events and "All" User events, with "No Authentication". For local development, set the URL Template to the following:

    ```
    tunnel:///runtime/webhooks/webpubsub
    ```
1. Make sure your identity in that instance has the `Web PubSub Service Owner` role. Use Access Control -> Add role assignment otherwise.
1. Open a terminal with the environment variable `WebPubSubConnectionString` set to the same value as in `local.settings.json`. In Powershell, `$Env:WebPubSubConnectionString="<value>"`.
1. Run `az login` to verify Azure authentication.
1. Start the tunnel to connect the PubSub service to the local functions for local testing, after double checking that the hub name and endpoint match the values in the dev Web PubSub service, and the upstream matches the port where the local functions are being served, as shown in the terminal.

    ```
    awps-tunnel run --hub chatscheduler --endpoint https://chat-scheduler-pub-sub-dev.webpubsub.azure.com --upstream http://localhost:7071
    ```

1. Open the [web UI URL](http://localhost:8071/) shown by that command, turn on Live Trace from the Web PubSub tab, then "Add a Test Client" from the Client tab and create a Websocket client. Connect and send a message and verify the response.
1. In the `scheduler` folder, install npm dependencies:
    ```
    npm install
    ```
1. To enable local network access for testing on another device, a few changes need to be made. Create a `.env.development.local` file with `REACT_APP_API_HOST="http://<your_local_IP>:7071"` using the local network IP address instead of `localhost`. This will override the value in `.env.development` and make sure API calls originating from another device go to the right place. Similarly, change the `COSMOS_DB_URL` in `local.settings.json` to replace `localhost` with the local IP. Now find the Cosmos program folder (in `Program Files`) and execute  `Microsoft.Azure.Cosmos.Emulator.exe /GenKeyFile=cosmos_db_auth_key` [[1](https://stackoverflow.com/questions/55018321/azure-cosmos-db-emulator-on-a-local-area-network)]. The key path can also be replaced with a path in the repo (it is gitignored). Shut down the Cosmos DB emulator if it's running, delete the data dir (`Users/<username>/AppData/Local/CosmosDBEmulator`), and run `CosmosDB.Emulator.exe /AllowNetworkAccess /KeyFile=cosmos_db_auth_key` (or replacing the key path). By default the client will fail to verify this cert, so add the setting `"COSMOS_ALLOW_UNVERIFIED": true` to `local.settings.json -> Values`. DO NOT copy this setting to the production deployment. Now local network debugging should be possible.
## Run app in development
1. Start Azurite to emulate Table, Queue, and Blob storage. Open the Command Palette (F1) -> Azurite: Start.
1. Run the Azure Function App locally with Run and Debug (F5, or from the side bar). Note: There may be a port conflict when restarting the app (running after just having closed it). Try running one more time and it should work.
1. Test that HTTP functions are working by visiting their [URLs](http://localhost:7071/api/negotiate) and verifying responses and logs in the VSCode terminal.
1. Start the PubSub tunnel, as described above.
1. To test that the backend handles abuse protection correctly, run the following in a terminal with `curl` (e.g. Git Bash on Windows), replacing the endpoint with the value from the prod Web PubSub account:
    ```
    curl <endpoint> -X OPTIONS -H "WebHook-Request-Origin: *" -H "ce-awpsversion: 1.0" --ssl-no-revoke -i -v
    ```
1. Run the CosmosDB emulator.
1. Start the React app development server
    ```
    npm start
    ```
1. Note that when running in development, errors may be displayed in a full-screen overlay on top of the actual production error handling. This is a create-react-app feature and will not appear in production.
## Deployment
1. The front end is built and deployed through a github workflow which builds the React app
and publishes to an Azure Static Web app on push. Workflows are added to the repo automatically
when setting up deployments in the Azure Portal. (I rebased the automatic commits).
1. The back end is deployed through another github workflow which publishes to an Azure Function App.
1. (See detailed deployment instructions [here](https://learn.microsoft.com/en-us/azure/azure-web-pubsub/quickstart-serverless?tabs=python))
1. In Azure Portal, in the function app, ensure the API -> CORS Allowed Origins List includes the
domain of the static web app, as well as any custom domains.
1. Add any custom domains to the static web app as well and validate as needed.
1. Ensure Authentication is setup and allows unauthenticated access.
1. In Environment variables, set `AzureWebJobsStorage` to a key from the storage account under Security + networking -> Access keys
1. Set `COSMOS_DB_URL` and `COSMOS_DB_KEY` to the URI and read-write key from the Cosmos DB NoSQL account under Settings -> Keys.
1. Set `WebPubSubConnectionString` to a Settings -> Keys -> Primary/Secondary -> Connection string from the production Web PubSub account rather than the dev account.
1. Copy over any other relevant environment variables from `local.settings.json` that are not set, including `COSMOS_DATABASE`, `COSMOS_EVENT_TABLE`, and the API-related keys and settings. The log level setting can be skipped. Again, DO NOT copy `COSMOS_ALLOW_UNVERIFIED` if it is set.
1. Set `AzureWebJobsSecretStorageType` to `blob`. This will prevent the key that connects PubSub and the function app from re-generating on deployment. Save the environment variable changes.
1. Note the `webpubsub_extension` key from Function -> App keys in the function app and make sure the event handler in the production Web PubSub instance is the same as the dev instance, except with the following endpoint, replacing the the function app name and using the `webpubsub_extension` key:
    ```
    https://<FUNCTIONAPP_NAME>.azurewebsites.net/runtime/webhooks/webpubsub?code=<APP_KEY>
    ```
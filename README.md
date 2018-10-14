# Appcelerator iOS and Android Push notifications

Register your device via API to save into a MySQL database see: https://github.com/roysinclair/php-push-notifications

Send push notification to iOS and Android
 
iOS create Badge
 
Remove user from notifications

## Getting Started

First import the project see installation note below

Open tiapp.xml

Set your sender id for Android <property name="gcm.senderid">YOUR_SENDER_ID</property>

To get GCM sender ID:

1. Open the Google Developers Console.
2. If you haven't created an API project yet, click Create Project.
3. Find your API project and click Project Name.
4. You can find Project Number. You will use it as the GCM sender ID.

Open app/alloy.js
 
Set var ENV = "live or local";

Set Alloy.Globals.WEBAPP set the website URI to load 

### Prerequisites

Appcelerator

PHP API available here - https://github.com/roysinclair/php-push-notifications

### Installing

https://docs.axway.com/bundle/Appcelerator_Studio_allOS_en/page/importing_an_existing_project.html

## Authors

* **Roy Sincalir**

## Credits
ti.goosh - https://github.com/caffeinalab/ti.goosh 

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

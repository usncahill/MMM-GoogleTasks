# MMM-GoogleTasks
Module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/) smart mirror. Displays tasks from Google Tasks.

### Example
![Example of MMM-GoogleTasks](images/sample.png?raw=true "Example screenshot")

### Dependencies
1. The [Google Node.js client library](https://github.com/google/google-api-nodejs-client/): For authentication and Google Tasks API (v1). See Installation for instructions

## Installation
To install the module, use your terminal to:
1. Navigate to your MagicMirror's modules folder, e.g. `MagicMirror/modules`.
2. Clone the module:<br />`git clone https://github.com/usncahill/MMM-GoogleTasks.git`
3. Install Google API:<br />`npm install googleapis`

## Authentication Setup
Google Tasks API an authenticated OAuth2 client:
1. Go [here](https://developers.google.com/tasks/quickstart/nodejs), and click "Enable the Google Tasks API" button. Follow the steps.
2. After the directions,
* Browse to [console.cloud.google.com/apis/credentials](console.cloud.google.com/apis/credentials) page of the  project created in Step 1,
* Click the download button on the Actions column of the OAuth 2.0 Client IDs table, and
* Save the file as `credentials.json` in your MMM-GoogleTasks directory (`MagicMirror/modules/MMM-GoogleTasks`).
4. [Enable Google Tasks API](https://console.cloud.google.com/apis/library/tasks.googleapis.com). Select the same project as in Step 1.
5. Run authenticate.js:<br />`node ./authenticate.js` from your MMM-GoogleTasks directory.
6. Follow the script instructions and it should print your lists. Copy the ListID of the list you want.
7. Save the desired listID and a unique listName for this list in the config.js.
8. Rename the generated token.json as follows: `tokenLISTNAME.json`, e.g. `tokenJeff.json` where `listName='Jeff'`.
9. Repeat all steps for each user for multi-user support.

## Using the module

### MagicMirror² Configuration

To use this module, add the following configuration block to the modules array in the `config/config.js` file:
```js
var config = {
    modules: [
        ...
        {
            module: 'MMM-GoogleTasks',
            header: "Google Tasks",
            position: "top_left",
            config: {
                listID: "MDbG9uZ2V4YW1wbGVzdHJpbmc",
                listName: "Foo"
                ...
                // See below for Configuration Options
            }
        },
        ...
    ]
}
```

### Configuration Options

| Option                  | Details
|------------------------ |--------------
| `listID`                | *Required* - List ID printed from authenticate.js (see installation)
| `listName`              | *Required* - Unique list name used to differentiate token.json for multiple lists.
| `maxResults`            | *Optional* - Max number of list items to retrieve. <br><br> **Possible values:** `0` - `100` <br> **Default value:** `10`
| `width`                 | *Optional* - sets the module width. <br>**Default value:** `320` px 
| `showCompleted`         | *Optional* - Show completed task items <br><br> **Possible values:** `true`  `false` <br> **Default value:** `false`
| `dateFormat`            | *Optional* - Format to use for due date <br><br> **Possible values:** See [Moment.js formats](http://momentjs.com/docs/#/parsing/string-format/) <br> **Default value:** `MMM Do` (e.g. Jan 18th)
| `updateInterval`        | *Optional* - Interval at which content updates (minutes) <br>Tasks API has default maximum of 50,000 calls per day. <br> **Default value:** `5` minutes
| `animationSpeed`        | Speed of the update animation. (seconds) <br><br> **Possible values:** `0` - `5` <br> **Default value:** `2` seconds
| `tableClass`            | Name of the classes issued from `main.css`. <br><br> **Possible values:** `xsmall`  `small`  `medium`  `large`  `xlarge` <br> **Default value:** `small`
| `sortOrder`             | Using `SortBy` element, determines which direction to sort. <br><br> **Possible values:** `ascending`  `descending` <br> **Default value:** `ascending`
| `sortBy`                | Which Google Task subelement to use for sorting <br><br> **Possible values:** `due`  `updated`  `title`<br> **Default value:** `due`
| `groupSubTasks`         | Whether to group sub tasks under their parents or list them on their own.<br><br> **Possible values:** `true`  `false` <br> **Default value:** `true`
| `taskIcon`              | Icon to use as bullet point for each task, something from the [iconify icon set](https://icon-sets.iconify.design/).  <br>**Default value:** `bx:square-rounded`

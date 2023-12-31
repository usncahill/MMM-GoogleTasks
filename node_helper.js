var NodeHelper = require("node_helper");
const {google} = require('googleapis');
const fs = require('fs');

module.exports = NodeHelper.create({

    start: function() {
        
        console.log(this.name + ":Starting node helper for: " + this.name);

        this.oAuth2Client = {};
        this.service = {};
        this.config = {};
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "MODULE_READY") {
            this.config[payload.listID] = payload; // save config stuff for later as needed
            
            this.authenticate(payload.listID);
/*             } else {
                // Check if tasks service is already running, avoids running authentication twice
                console.log(this.name + ":Task service for list: " + payload.listID + " already running.");
                this.sendSocketNotification("SERVICE_READY", {});
            } */
        } else if (notification === "REQUEST_UPDATE") {
            this.getList(payload.listID);
        }
    },

    authenticate: function(listID) {
        var self = this;

        fs.readFile(self.path + '/credentials.json', (err, content) => {
            if (err) {
                var payload = {code: err.code, message: err.message, details: err.details};

                self.sendSocketNotification("TASKS_API_ERROR", payload);
                return console.log(this.name + ":Error loading credentials file:", err);
            }
            // Authorize a client with credentials, then call the Google Tasks API.
            authorize(JSON.parse(content), listID, self.startTasksService);
          });

        function authorize(credentials, listID, callback) {
            const {client_secret, client_id, redirect_uris} = credentials.installed;
            self.oAuth2Client[listID] = new google.auth.OAuth2(
                client_id, client_secret, redirect_uris[0]);
          
            // Check if we have previously stored a token.
            fs.readFile(self.path + '/token' + self.config[listID].listName + '.json', (err, token) => {
                if (err) return console.log(this.name + ":Error loading token");
                self.oAuth2Client[listID].setCredentials(JSON.parse(token));
                callback(self.oAuth2Client[listID], self, listID);
            });
        }
    },

    startTasksService: function(auth, self, listID) {
        self.service[listID] = google.tasks({version: 'v1', auth});
        self.sendSocketNotification("SERVICE_READY", {});
    },

    getList: function(listID) {
        var self = this;

        if(!self.service[listID]) {
            if (self.config.verbose) { console.log(this.name + ":Refresh required (??)"); }
            return;
        }

        self.service[listID].tasks.list({
            tasklist: listID,
            maxResults: self.config[listID].maxResults,
            showCompleted: self.config[listID].showCompleted,
            showHidden: self.config[listID].showHidden,
        }, (err, res) => {
            if (err) {
                var payload = {code: err.code, message: err.message, details: err.details};
                self.sendSocketNotification("TASKS_API_ERROR", payload);
                return console.error(this.name + ":The API returned an error: " + err);
            }

            // Testing
            /* 
            const tasksList = res.data.items;
            console.log(tasksList);
            if (tasksList) {
                tasksList.forEach((task) => {
                    console.log(task);
                });
            } else {
                console.log('No tasks found.');
            }
             */

            var payload = {id: listID, items: res.data.items};
            self.sendSocketNotification("UPDATE_DATA", payload);
        });
    },
});

Module.register("MMM-GoogleTasks", {
	// Default module config.
	defaults: {

		listID: "", // List ID (see authenticate.js)
		maxResults: 10,		
		showCompleted: false, 	//set showCompleted and showHidden true
		dateFormat: "MMM Do", 	// Format to display dates (moment.js formats)
		updateInterval: 100000, // Time between content updates (millisconds)
		animationSpeed: 2000, 	// Speed of the update animation (milliseconds)
		tableClass: "small", 	// Name of the classes issued from main.css
		sortOrder: "ascending", // [ascending, descending]
		sortBy: "due", 		// [due, updated, default, title]
		groupSubTasks: true, 	// [true, false]
		taskIcon: "bx:square-rounded", // something from the iconify icon set		
	},
	
	// Define required scripts
	getScripts: function () {
		return ["moment.js"];
	},

	// Define required scripts.
	getStyles: function () {
		return ["MMM-GoogleTasks.css"];
	},

	// Define start sequence
	start: function() {

		Log.info("Starting module: " + this.name);
		this.tasks;
		this.loaded = false;


		this.ASCENDING = 1;
		this.DESCENDING = -1;
		this.sortOrderVal = 1;


		if (this.config.sortOrder == "ascending") {
			this.sortOrderVal = this.ASCENDING;
		} else if (this.config.sortOrder == "descending") {
			this.sortOrderVal = this.DESCENDING;
		}

		Log.info("set sort order.");

		if (!this.config.listID) {
			Log.log("config listID required");
		} else {
			this.sendSocketNotification("MODULE_READY", {});
		}

		// API requies completed config settings if showCompleted
		if (!this.config.showCompleted) {
			// delete this.config.completedMin;
			// delete this.config.completedMax;
		} else {
			this.config.showHidden = true;
		}
	},

	socketNotificationReceived: function(notification, payload) {
		var self = this;

		if (notification === "SERVICE_READY") {
			
			self.sendSocketNotification("REQUEST_UPDATE", self.config);
			
			// Create repeating call to node_helper get list
			setInterval(function() {
				self.sendSocketNotification("REQUEST_UPDATE", self.config);
			}, self.config.updateInterval);

		// Check if payload id matches module id
		} else if (notification === "UPDATE_DATA" && payload.id === self.config.listID) {
			// Handle new data
			self.loaded = true;
			if (payload.items) {
			   	self.tasks = payload.items;
				self.updateDom(self.config.animationSpeed)
			} else {
				self.tasks = null;
				Log.info("No tasks found.")
				self.updateDom(self.config.animationSpeed)
			}
		}
	},

	getDom: function() {

		var wrapper = document.createElement('div');
		wrapper.className = "container ";
		wrapper.className += this.config.tableClass;

		var numTasks = 0;
		var taskList = this.tasks;
		
		if (taskList) {
			var numTasks = Object.keys(taskList).length;
		}

		if (!taskList) {
			// @TODO: add error checking here and report something useful
			wrapper.innerHTML = (this.loaded) ? "EMPTY" : "LOADING";
			wrapper.className = this.config.tableClass + " dimmed";
			return wrapper;
		}

		// sort the list according to the chosen sort order
		if (this.config.sortOrder.toLowerCase() == "ascending") {
	        	switch(this.config.sortBy) {
  	                      case "title":
	                                taskList = taskList.sort(this.compare_title_ascending);
        	                        break;
            			case "due":
					taskList = taskList.sort(this.compare_dueDate_ascending);
                			break;
	            		case "updated":
        	        		taskList = taskList.sort(this.compare_updated_ascending);
                			break;
            			default:
                			// do nothing, use default sort order from Google
                			// This applies as well if the argument is a typo
					break;
        		}
		} else if (this.config.sortOrder.toLowerCase() == "descending")  {
                        switch(this.config.sortBy) {
                              case "title":
                                        taskList = taskList.sort(this.compare_title_descending);
                                        break;
                                case "due":
                                        taskList = taskList.sort(this.compare_dueDate_descending);
                                        break;
                                case "updated":
                                        taskList = taskList.sort(this.compare_updated_descending);
                                        break;
                                default:
                                        // do nothing, use default sort order from Google
                                        // This applies as well if the argument is a typo
                                        break;
                        }
		}

		var titleWrapper, dateWrapper, noteWrapper;

		//@TODO remove references to completed tasks.  I don't think this is necessary in this MM context.



		// build a dictionary to track parent/child relationships if subtasks
        	parents = {};

        	// this loop is just to identify which tasks have subtasks, and build a dictionary of those tasks
        	// where the key is the id of the parent, and the value is an array of indices into the master task list
        	// of the child tasks
    		for (i = 0; i < taskList.length; i++) {

    			if  (taskList[i].parent) {

                		if (parents[taskList[i].parent]) {
                    			// If this task already has a child, simply add the next one.
                    			parents[taskList[i].parent].push(i);
                		} else {
                    			// If this is the first child, need to initialize the array.
                    			parents[taskList[i].parent] = Array();
                    			parents[taskList[i].parent].push(i);
                		}
    			}
    		}

		icon1 = "<span class=\"iconify\" data-icon=\"";
		icon2 = "\"></span>";
		task_icon = this.config.taskIcon; //"bx:square-rounded";


		//mdi:square-rounded-outline
		//akar-icons:circle

        	// next loop displays the tasks.
        	task_count = 0;
		groupSubTasks = this.config.groupSubTasks;

	        for (i = 0; i < taskList.length; i++) {

        		// if groupsubtasks is true, and it doesn't have parents, display outerloop
            		// if groupsubtasks is false, regardless, display outerloop
            		// otherwise, don't display outer loop, means we're grouping by subtask and this one has parents (is child)
            		// ignore items that have parents; they'll get displayed in the subloop underneath their parents.

            		if (!groupSubTasks || (!taskList[i].parent && groupSubTasks)) {
                		task_count++;
                		// Display the top level tasks

				item = taskList[i];
                        	titleWrapper = document.createElement('div');
                        	titleWrapper.className = "item title";
				titleWrapper.innerHTML = icon1 + task_icon + icon2 + item.title;

                        	//titleWrapper.innerHTML = "<i class=\"fa fa-circle-thin\" ></i>" + item.title; // this one works

                        	// If item is completed change icon to checkmark
                        	if (item.status === 'completed') {
                                	titleWrapper.innerHTML = "<i class=\"fa fa-check\" ></i>" + item.title;
                        	}

                        	if (groupSubTasks && item.parent) {
                                	titleWrapper.className = "item child";
                        	}

                        	if (item.notes) {
                                	noteWrapper = document.createElement('div');
                                	noteWrapper.className = "item notes light";
                                	noteWrapper.innerHTML = item.notes.replace(/\n/g , "<br>");
                                	titleWrapper.appendChild(noteWrapper);
                        	}

                        	dateWrapper = document.createElement('div');
                        	dateWrapper.className = "item date light";

                        	if (item.due) {
                                	var date = moment(item.due);
                                	dateWrapper.innerHTML = date.utc().format(this.config.dateFormat);
                        	}

                        	// Create borders between parent items
                        	if (numTasks < this.tasks.length-1 && !this.tasks[numTasks+1].parent) {
                                	titleWrapper.style.borderBottom = "1px solid #666";
                                	dateWrapper.style.borderBottom = "1px solid #666";
                        	}

                        	wrapper.appendChild(titleWrapper);
                        	wrapper.appendChild(dateWrapper);

                		// Display subtasks under this task; they will be internally also sorted according to the overall sort order
                		// This mechanism works because there can be only one level of subtasks within Google Tasks
                		// If there were multiple levels, would probably want recursion
                		// This inner loop only gets displayed if we're grouping by subtasks
                		if (parents[taskList[i].id] && groupSubTasks) {
                    			for (j = 0; j < parents[taskList[i].id].length; j++ ) {
                        
                        			// We're going to use this a couple times; abstract it a little for simplification and readability
                        			index = parents[taskList[i].id][j];

                                		item = taskList[index];
                                		titleWrapper = document.createElement('div');
                                		titleWrapper.className = "item title";

                                		//titleWrapper.innerHTML = "<i class=\"" + task_icon + "\" ></i>" + item.title;
						titleWrapper.innerHTML = icon1 + task_icon + icon2 + item.title;

                                		// If item is completed change icon to checkmark
                                		if (item.status === 'completed') {
                                        		titleWrapper.innerHTML = "<i class=\"fa fa-check\" ></i>" + item.title;
                                		}

                                		if (item.parent) {
							//@TODO based on if clauses, this should always be true if we are here.  Can remove this?
                                	        	titleWrapper.className = "item child";
                                		}

                                		if (item.notes) {
                                        		noteWrapper = document.createElement('div');
                                        		noteWrapper.className = "item notes light";
                                        		noteWrapper.innerHTML = item.notes.replace(/\n/g , "<br>");
                                        		titleWrapper.appendChild(noteWrapper);
                                		}

                                		dateWrapper = document.createElement('div');
                                		dateWrapper.className = "item date light";

                                		if (item.due) {
                                        		var date = moment(item.due);
                                        		dateWrapper.innerHTML = date.utc().format(this.config.dateFormat);
                                		}

                                		// Create borders between parent items
                                		if (numTasks < this.tasks.length-1 && !this.tasks[numTasks+1].parent) {
                                        		titleWrapper.style.borderBottom = "1px solid #666";
                                        		dateWrapper.style.borderBottom = "1px solid #666";
                                		}

	                	                wrapper.appendChild(titleWrapper);
        		                        wrapper.appendChild(dateWrapper);
                    			}
                		}
            		}
        	}

		return wrapper;
	},


	// Compare Google TasksList item based on due date
	compare_dueDate_ascending: function(itemA, itemB) {
		// Treat undefined dates like today
    		today = new Date();

    		dueA = itemA.due;
    		dueB = itemB.due;

    		if (!dueA) {
        		dueA = today;
    		} else {
			dueA = new Date(dueA);
		}

    		if (!dueB) {
        		dueB = today;
    		} else {
			dueB = new Date(dueB);
		}

		return (isFinite(dueA = dueA.valueOf()) && isFinite(dueB = dueB.valueOf()) ? (dueA>dueB)-(dueA<dueB) : NaN); // * this.sortOrderVal;
	}, 

        compare_dueDate_descending: function(itemA, itemB) {
                // Treat undefined dates like today
                today = new Date();

                dueA = itemA.due;
                dueB = itemB.due;

                if (!dueA) {
                        dueA = today;
                } else {
                        dueA = new Date(dueA);
                }

                if (!dueB) {
                        dueB = today;
                } else {
                        dueB = new Date(dueB);
                }

                return (isFinite(dueA = dueA.valueOf()) && isFinite(dueB = dueB.valueOf()) ? (dueA>dueB)-(dueA<dueB) : NaN) * -1;
        }, 

	// Compare Google TaskLIst item based on updated date
	compare_updated_ascending: function(itemA, itemB) {
    		// Treat undefined dates like today
    		today = new Date();

	   	updateA = itemA.updated;
    		updateB = itemB.updated;

	    	if (!updateA) {
        		updateA = today;
    		} else {
			updateA = new Date(updateA);
		}

	    	if (!updateB) {
        		updateB = today;
    		} else {
			updateB = new Date(updateB);
		}

		return (isFinite(updateA = updateA.valueOf()) && isFinite(updateB = updateB.valueOf()) ? (updateA>updateB)-(updateA<updateB) : NaN);
	},

        // Compare Google TaskLIst item based on updated date
        compare_updated_descending: function(itemA, itemB) {
                // Treat undefined dates like today
                today = new Date();

                updateA = itemA.updated;
                updateB = itemB.updated;

                if (!updateA) {
                        updateA = today;
                } else {
                        updateA = new Date(updateA);
                }

                if (!updateB) {
                        updateB = today;
                } else {
                        updateB = new Date(updateB);
                }

                return (isFinite(updateA = updateA.valueOf()) && isFinite(updateB = updateB.valueOf()) ? (updateA>updateB)-(updateA<updateB) : NaN) * -1;
        },

        // Compare Google TaskLIst item based on  alphabetical title
        compare_title_ascending: function(itemA, itemB) {

                updateA = itemA.title;
                updateB = itemB.title;

                if (!updateA) {
                        updateA = "";
                }

                if (!updateB) {
                        updateB = "";
                }

		return updateA.toLowerCase().localCompare(updateB.toLowerCase()) * this.sortOrderVal;
        },
        // Compare Google TaskLIst item based on  alphabetical title
        compare_title_descending: function(itemA, itemB) {

                updateA = itemA.title;
                updateB = itemB.title;

                if (!updateA) {
                        updateA = "";
                }

                if (!updateB) {
                        updateB = "";
                }

                return updateA.toLowerCase().localCompare(updateB.toLowerCase()) * this.sortOrderVal * -1;
        },

});

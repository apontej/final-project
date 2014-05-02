// Map team names from Sports-Reference listing to listing in new-master-id
var mapteams = { 
				"Louisiana State": "LSU", 
				"St. John's (NY)": "St. John's", 
				"Southern California": "USC", 
				"Nevada-Las Vegas": "UNLV",
				"Texas-El Paso": "UTEP",
				"Central Florida": "UCF",
				"Alabama-Birmingham": "UAB",
				"College of Charleston": "Charleston",
				"Loyola (IL)": "Loyola Chicago",
				"Texas Christian": "TCU",
				"Detroit Mercy": "Detroit",
				"Virginia Military Institute": "Virginia Military",
				"California-Irvine": "UC Irvine",
				"Mississippi": "Ole Miss"};

// Margins
var margin = {
	top:10,
	right:150,
	bottom:50,
	left:30
};

// Width
var width1 = 1000 - margin.left - margin.right;

// Bounding box for poll graph
var bbPoll = {
	x: margin.left,
	y: margin.top,
	w: width1,
	h: 600
}

// Define all variables
var dataset, teams, teamline, weeks, conferences, currentYear, currentPoll,
	maxRk, maxWk, allNodes, xsvg, brush, maxCount, confCanvas, chart,
	confXScale, confYScale, confXAxis, confXsvg, moversObj;

var topMovers = {};

var pathHighlighted = 0;

var origStroke = 2;
var hoverStroke = 2;

// Create svg canvas for poll graph
var canvas = d3.select("#pollgraph").append("svg").attr({
	width: bbPoll.w + margin.left + margin.right,
	height: bbPoll.h + margin.top + margin.bottom
});
var svg = canvas.append("g").attr({
	transform: "translate(" + margin.left + "," + margin.top + ")"
	});

// Create d3-tips

// Tooltip displayed when hovering over node
var nodetip = d3.tip()
				.attr("class", "d3-tip")
				.offset([-10,0])
				.html(function(d) {
					friendly_full = getIDsBy(undefined,undefined,undefined,d.School,undefined).friendly_full;
					retVal = "";
					retVal += '<img src="data/logos/' + friendly_full + '.gif" width="75" height="50" /><br />' + friendly_full;
					retVal += "<br />Week: " + d.Wk + ", Rank: " + d.Rk;
					return retVal;
				})

// Tooltip displayed when hovering over conference bar
var conftip = d3.tip()
				.attr("class", "d3-tip")
				.direction('w')
				.offset([0,0])
				.html(function(d) {
					retVal = "";
					schools = d.schools;
					confFull = getFullConference(d.conf);
					retVal += '<p style="text-align:center;"><span style="text-decoration:underline;">' + confFull + "</span><br />";
					schools.forEach(function(school) {
						retVal += school + "<br />";
					})
					return retVal;
				})

// Bind tooltips to svg group
svg.call(nodetip);

// Years that are missing a Coaches poll
var missingCoaches = {
	"1992-93": 1,
	"1993-94": 1,
	"1994-95": 1,
	"1995-96": 1,
	"1996-97": 1,
	"1997-98": 1,
	"1998-99": 1,
	"1999-00": 1,
	"2000-01": 1,
	"2001-02": 1
}

// Function for displaying the poll graph
function displayPoll(thePoll, year) {
	// Set up the URL for pulling csv data
	baseUrl = "data/poll-data/";
	// If no poll is defined, use the last selected poll
	if (thePoll === undefined) {
		thePoll = currentPoll;
	} else { // If poll is defined, set currentPoll var to that poll
		currentPoll = thePoll;
	}
	// If no year is defined, use the last selected year
	if (year === undefined) {
		year = currentYear;
	} else { // If year is defined, set currentYear var to that year
		currentYear = year;
	}

	// Check if the selected year is missing the coaches poll, these years are 1992-93
	// to 2001-02 seasons. If so, set the poll to AP and check the AP radio button.
	if (missingCoaches[year] == 1) {
		thePoll = "AP";
		currentPoll = thePoll;
		document.getElementById('radioap').checked = true;
	}
	// Construct the path to the appropriate file.
	thePollPath = baseUrl + year + "-" + thePoll + ".csv";

	d3.csv(thePollPath, function(error, data) {
		// Instantiate all needed variables
		teams = {};
		teamlines = [];
		weeks = [];
		conferences = {};
		dataset = data;
		maxRk = 0;
		allNodes = [];
		moversObj = {};

		// Iterate through the dataset and remove all non poll data lines
		for (var i=0;i<dataset.length;i++) {
			if (dataset[i].Wk === "Wk") {
				dataset.splice(i,1);
			}
		}

		// Iterate through the dataset and start building the teams object
		for (var i=0;i<dataset.length;i++) {
			line = dataset[i];
			school = line.School;
			strWeek = line.Wk;
			week = parseInt(strWeek);
			line.Wk = week;
			rank = parseInt(line.Rk);
			line.Rk = rank;
			// If week is not in weeks array, add it
			if (weeks.indexOf(line.Wk) === -1) {
				weeks.push(line.Wk);
			}
			// Check for existence of a * in the school name. If found, remove it and all
			// text following it.
			starIndex = school.indexOf("*");
			if (starIndex > 0) {
				school = school.substring(0,starIndex);
				line.School = school;
			} else if (/\sR/g.test(school)) { // Special case where there is no star but want to remove text after school name
				if (!/\sR[a-z]/g.test(school)) {
					lastIndex = school.lastIndexOf("R");
					school = school.substring(0,lastIndex-1);
					line.School = school;
				}
			} else if (/\sT/g.test(school)) { // Another special case similar to last
				if (!/\sT[a-z]/g.test(school)) {
					lastIndex = school.lastIndexOf("T");
					school = school.substring(0,lastIndex-1);
					line.School = school;
				}
			}
			// If school name is in mapteams, change the school name to the mapped value
			if (mapteams[school] !== undefined) {
				school = mapteams[school];
			}
			// If the school has been added to teams object, add the line to its array,
			// otherwise, create a new array
			if (teams[school]) {
				teams[school].push(line);
			} else {
				teams[school] = [line];
			}

			// Build a list of conferences along with a count of number of teams ranked in
			// a given week for that conference as well as a list of the schools
			conf = line.Conf;
			if (conferences[conf]) {
				if (conferences[conf][week]) {
					conferences[conf][week]["count"]++;
					conferences[conf][week]["schools"].push(school);
				} else {
					conferences[conf][week] = {"count": 1, "schools": [school]};
				}
			} else {
				conferences[conf] = {};
				conferences[conf][week] = {"count": 1, "schools": [school]};
			}

			// Find max rank
			if (line.Rk > maxRk) {
				maxRk = line.Rk;
			}
		}

		// Find any missing rank data and interpolate it, i.e. when a team is unranked in a
		// given week, it is not listed in the original data, we need to add an entry for
		// that week and give it a rank of 27 to indicate being unranked.
		for (var school in teams) {
			rankedWeeks = [];
			ranks = teams[school];
			ranks.forEach(function(d) {
				rankedWeeks.push(d.Wk);
				// Build the allNodes array while we're in here and looping through all schools
				espnid = getIDsBy(undefined,undefined,undefined,school,undefined).espn_id;
				allNodes.push({"School": school, "espnid": espnid, "Rk": d.Rk, "Wk": d.Wk});
			})

			// Compare all weeks to this team's ranked weeks, find the difference and add
			// data for missing weeks
			if (rankedWeeks.length !== weeks.length) {
				var diff = [];
				var j=0;
				for (var i=0;i<weeks.length;i++) {
					if (rankedWeeks.indexOf(weeks[i]) === -1) {
						diff.push(weeks[i]);
					}
				}
				diff.forEach(function(d) {
					teams[school].push({"Wk": d, "Rk": (maxRk + 2)});
				})
			}
			// Sort the team's array by week
			ranks = teams[school];
			ranks.sort(function(a,b) {
				return d3.ascending(a.Wk, b.Wk);
			})
			// Build object with all rank changes keyed by week
			ranks.forEach(function(d, i) {
				if (i > 0) {
					change = ranks[i-1].Rk - ranks[i].Rk
					if (ranks[i-1].Rk === 27) change--;
					ranks[i].Chng = change;
					if (moversObj[d.Wk]) {
						moversObj[d.Wk].push({"School": school, "Change": change});
					} else {
						moversObj[d.Wk] = [{"School": school, "Change": change}];
					}
				}
			})
		}

		// Function call to build the list of top mover's per week
		findTopMovers();

		// Find the max week for this poll
		maxWk = d3.max(weeks, function(d) { return d; });

		// Build the d3 scales
		xscale = d3.scale.linear().domain([1,maxWk]).range([bbPoll.x,bbPoll.w-100]);
		brushscale = d3.scale.linear().domain([1,maxWk]).range([bbPoll.x,bbPoll.w-100]);
		yscale = d3.scale.linear().domain([1,maxRk + 1]).range([bbPoll.y+20,bbPoll.h]);

		// Create the axes for the poll graph
		xaxis = d3.svg.axis()
					.scale(xscale)
					.orient("bottom")
					.ticks(20);

		yaxis = d3.svg.axis()
					.scale(yscale)
					.orient("left")
					.ticks(25);

		// Define the d3 line to be used
		teamline = d3.svg.line().x(function(d) { return xscale(d.Wk); })
									.y(function(d) { return yscale(d.Rk); })

		// Remove defs, if exists
		svg.selectAll("defs").remove();

		// Add the clip-path to contain everything within the proper view
	    svg.append("defs").append("clipPath")
	        .attr("id", "clip")
	        .append("rect")
	        .attr("width", (bbPoll.w-100)-bbPoll.x+5)
	        .attr("height", bbPoll.h-10)
	        .attr("x", bbPoll.x)
	        .attr("y", bbPoll.y);

		count = 1;

		// Remove all circles if they are shown and remove all paths, text labels, and axes
		hideCircles();
		svg.selectAll('.teampath')
			.remove();
		svg.selectAll(".teamtext")
			.remove();
		svg.selectAll(".axis")
			.remove();
		svg.selectAll(".node")
			.remove();

		// Iterate through all keys in teams object and build the poll graph
		for (var school in teams) {
			// get the espnid of the school, so it can be used for html class
			espnid = getIDsBy(undefined,undefined,undefined,school,undefined).espn_id;
			espnid = "x" + espnid.toString();

			// Add the svg path for this school
			svg.append("g").classed("teampath", true).append("path")
				.attr("d", teamline(teams[school]))
				.classed(espnid, true)
				.classed("teampath", true)
				.style("fill", "none")
				.style("stroke-width", origStroke)
				.style("stroke", searchColor(school))
				.on("click", function(d) {
					var thePath = d3.select(this);
					theClass = getClassFromPath(thePath);
					showCircles(theClass,thePath);
				})
				.on("mouseover", function(d) {
					d3.select("body").style("cursor", "pointer");
				})
				.on("mouseout", function(d) {
					d3.select("body").style("cursor", "default");
				})
				.style("clip-path", "url(#clip)")
			count++;

			// By default, add a text label to the right of the graph if the current team
			// is ranked in the top 25 in the last week.
			lastRk = teams[school][teams[school].length-1].Rk;
			if (lastRk < (maxRk + 2)) {
				svg.append("text")
					.classed("teamtext", true)
					.attr("transform", "translate("+(bbPoll.w-90)+","+yscale(lastRk)+")")
					.attr("dy", ".25em")
					.attr("text-anchor", "start")
					.style("fill", searchColor(school))
					.text(lastRk + ": " + school)
					.on("click", function() {
						theSchool = this.innerHTML;
						theSchool = theSchool.substring((theSchool.indexOf(" ")+1));
						return showCircles(undefined,undefined,theSchool);
					})
					.on("mouseover", function(d) {
						d3.select("body").style("cursor", "pointer");
					})
					.on("mouseout", function(d) {
						d3.select("body").style("cursor", "default");
					})
			}

		}

		// Add hidden nodes on top of the svg paths that can be hovered over to access
		// additional information
		nodes = svg.selectAll(".node")
					.data(allNodes)
					.enter()
					.append("g")
					.classed("node", true)
					.append("circle")
						.attr("r", 5)
						.attr("fill", function(d) { return searchColor(d.School); })
						.style("display", "none")
						.attr("class", function(d) { return "x" + d.espnid + " circ"; })
						.attr("transform", function(d) {
							return "translate("+xscale(d.Wk)+","+yscale(d.Rk)+")";
						})
						.on("mouseover", function(d) {
							nodetip.show(d);
						})
						.on("mouseout", function(d) {
							nodetip.hide(d);
						})

		// If the brush is defined, clear it
		if (brush !== undefined) {
			d3.selectAll(".brush").call(brush.clear());
		}
		// Init the brush
		brush = d3.svg.brush().x(brushscale).on("brush", brushed);

		// Create the svg element for displaying the brush
		be1 = svg.append("g").attr("class", "brush").call(brush);
		be1.selectAll("rect")
			.attr("y", 600)
			.attr("height", 23);

		// Build the x axis svg element
		xsvg = svg.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0,600)")
			.call(xaxis)
			.selectAll("text")
				.attr("class", "xaxis-label")
				.on("mouseover", function() {
					d3.select("body").style("cursor", "pointer");
				})
				.on("mouseout", function() {
					d3.select("body").style("cursor", "default");
				})
				.on("click", function(d) {
					updateConfBar(d);
					d3.selectAll(".xaxis-label").style("font-weight", "normal");
					d3.select(this).style("font-weight", "bold");
					return updateMoversTable(d);
				})

		// Add a label for the x axis
		svg.append("text")
			.attr("transform", "translate(375,640)")
			.style("text-anchor", "middle")
			.text("Week");

		// Build the y axis svg element
		svg.append("g")
			.attr("class", "axis")
			.attr("transform", "translate("+margin.left+",0)")
			.call(yaxis)
			.selectAll("text")
				.style("display", function(d) {
					if (d === (maxRk+1)) {
						return "none";
					} else {
						return "block";
					}
				})

		// Add a label for the y axis
		svg.append("text")
			.attr("transform", "translate(0,300) rotate(-90)")
			.style("text-anchor", "middle")
			.text("Rank");

		// Update the two secondary graphs/charts with data from the first week of the current poll
		updateMoversTable(1);
		updateConfBar(1);

	}) // end d3.csv
} // end function

// The function called when brushing
function brushed() {
	if (!d3.event.sourceEvent) return;

	// Round the brush values to the nearest whole number (week)
	var extent0 = brush.extent(),
		extent1 = extent0.map(function(d) { return Math.round(d); });

	if (extent1[0] > extent1[1]) {
		extent1[0] = Math.floor(extent0[0]);
		extent1[1] = Math.ceil(extent0[1]);
	}

	// Update the brush with the rounded values
	d3.select(this).transition()
		.call(brush.extent(extent1))
		.call(brush.event);
	// Change the xscale domain to that of the brush's extent or if brush is empty, change
	// it back to the default
	xscale.domain(brush.empty() ? brushscale.domain(): brush.extent());

	// Update the text labels to the right of the graph with the top 25 ranked teams for the
	// last week that is brushed
	svg.selectAll(".teamtext")
			.remove();
	for (var school in teams) {
		espnid = getIDsBy(undefined,undefined,undefined,school).espn_id;
		svg.select("path.x"+espnid).attr("d", teamline(teams[school]));

		lastRk = teams[school][extent1[1]-1].Rk;
		if (lastRk < (maxRk + 2)) {
			svg.append("text")
				.classed("teamtext", true)
				.attr("transform", "translate("+(bbPoll.w-90)+","+yscale(lastRk)+")")
				.attr("dy", ".25em")
				.attr("text-anchor", "start")
				.style("fill", searchColor(school))
				.text(lastRk + ": " + school)
				.on("click", function() {
					theSchool = this.innerHTML;
					theSchool = theSchool.substring((theSchool.indexOf(" ")+1));
					return showCircles(undefined,undefined,theSchool);
				})
				.on("mouseover", function(d) {
					d3.select("body").style("cursor", "pointer");
				})
				.on("mouseout", function(d) {
					d3.select("body").style("cursor", "default");
				})
		}
	}
	// Move all the circles to their new scaled positions based on the brushed scale
	svg.selectAll(".circ").attr("transform", function(d) { return "translate("+xscale(d.Wk) + "," + yscale(d.Rk) + ")"; })
}

// Get the class of an svg path from the svg element
function getClassFromPath(thePath) {
	theClass = thePath[0][0].className.animVal;
	tpi = theClass.indexOf("teampath");
	theClass = theClass.substring(1,(tpi-1));
	return theClass;
}

// Highlight a path by making all other paths more transparent
function highlightPath(thePath,school) {

	d3.selectAll("path.teampath")
			.style("opacity", 0.25)
			.style("stroke-width", 1);

	if (thePath) {
		thePath.style("stroke-width", hoverStroke)
				.style("opacity", 1);
	}
	if (school) {
		school = getIDsBy(undefined,undefined,undefined,school,undefined).espn_id;
		school = "x" + school.toString();
		thePath = d3.select("path."+school);
		thePath.style("stroke-width", hoverStroke)
				.style("opacity", 1);
	}
}

// Show the circles for a selected school
function showCircles(espnid,thePath,schoolname) {
	if (schoolname !== undefined) {
		espnid = getIDsBy(undefined,undefined,undefined,schoolname,undefined).espn_id;
		thePath = d3.select(".x"+espnid);
	}
	if (pathHighlighted === 0) {
		highlightPath(thePath);
		d3.selectAll("circle.x"+espnid)
			.style("display", "block");
		pathHighlighted = espnid;
	} else if (pathHighlighted === espnid) {
		d3.selectAll("circle.x"+espnid)
			.style("display", "none");
		backToNormal();
		pathHighlighted = 0;
	} else if (pathHighlighted > 0) {
		console.log(espnid, pathHighlighted);
		d3.selectAll("circle.x"+pathHighlighted)
			.style("display", "none");
		d3.selectAll("circle.x"+espnid)
			.style("display", "block");
		backToNormal();
		highlightPath(thePath);
		pathHighlighted = espnid;
	}
}

// Hide all the circles
function hideCircles() {
	d3.selectAll("circle.x"+pathHighlighted)
		.style("display", "none");
	pathHighlighted = 0;
}

// Find the top 7 movers in each week of the current poll
function findTopMovers() {
	for (var week in moversObj) {
		changes = moversObj[week];
		changes.sort(function(a,b) {
			return d3.descending(Math.abs(a.Change), Math.abs(b.Change));
		})
		topM = changes.splice(0,7);
		topM.sort(function(a,b) {
			return d3.descending(a.Change, b.Change);
		})
		topMovers[week] = topM;
	}
}

// Variables needed for the movers table.
var moversTable, moversThead, moversTbody, moversRows, moversColumns, moversCells;

// Create an HTML table to display the movers' data.
function createMoversTable() {
	moversColumns = ["School", "Change"];
	var dummydata = [];
	for (var i=0;i<7;i++) {
		dummydata.push({"School": i, "Change": i});
	}

	moversTable = d3.select("#movers").append("table")
					.style("display", "none")
					.attr("width", "300px")
					.attr("height", "300px");

	moversThead = moversTable.append("thead");
	moversTbody = moversTable.append("tbody");

	moversThead.append("tr")
			.selectAll("th")
			.data(moversColumns)
			.enter()
			.append("th")
				.text(function(column) { return column; })
				.attr("align", function(d,i) { return i===0?"left":"center"; })
				.attr("width", function(d,i) { return i===0?"200px":"100px"; })

	moversRows = moversTbody.selectAll("tr")
				.data(dummydata)
				.enter()
				.append("tr");

	return moversTable;
}

// Update the movers table with the selected week's data
function updateMoversTable(week) {
	var moversData = topMovers[week];

	moversTable.style("display", "block");

	moversTbody.selectAll("tr").remove();

	if (moversData !== undefined) {

		moversRows = moversTbody.selectAll("tr")
					.data(moversData)
					.enter()
					.append("tr");

		moversCells = moversRows.selectAll("td")
					.data(function(row) {
						return moversColumns.map(function(column) {
							return {column: column, value: row[column]};
						})
					})
					.enter()
					.append("td")
						.html(function(d) { return d.value; })
						.attr("align", function(d,i) { return i===0?"left":"center"; })
	} else {
		moversRows = moversTbody.selectAll("tr")
						.data([1])
						.enter()
						.append("tr");

		moversCells = moversRows.selectAll("td")
					.data(["No changes in first week of season"])
					.enter()
					.append("td")
						.html(function(d) { return d; })
						.attr("colspan", 2);
	}
}

// Create the conference bar chart
function createConfBar() {
	confCanvas = d3.select("#confBar").append("svg").attr({
		width: 400,
		height: 300
	})

	chart = confCanvas.append("g").attr({
		transform: "translate(0,20)"
	});

	confXScale = d3.scale.ordinal().rangeRoundBands([0,400]);
	confYScale = d3.scale.linear().rangeRound([250,0]);

	confXAxis = d3.svg.axis()
					.scale(confXScale)
					.orient("bottom");

	confXsvg = chart.append("g")
					.attr("class", "axis")
					.attr("transform", "translate(0,250)");

	chart.call(conftip);

}
// Variables needed for the conference bar chart
var currConfs,confCounts;

// Update the conference bar chart with the selected week's data
function updateConfBar(week) {
	currConfs = [];
	confCounts = [];
	for (var conf in conferences) {
		if (conferences[conf][week]) {
			currConfs.push(conf);
			theConfObj = conferences[conf][week];
			theConfObj["conf"] = conf;
			confCounts.push(theConfObj);
		}
	}

	confXScale.domain(currConfs);
	confXsvg.call(confXAxis)
		.selectAll("text")
			.style("font-size", "7pt");
	maxCount = d3.max(confCounts, function(d) { return d.count; });
	confYScale.domain([0,maxCount]);

	chart.selectAll("rect").remove();
	chart.selectAll(".barValue").remove();

	chart.selectAll("rect")
			.data(confCounts)
			.enter()
			.append("rect")
			.attr("class", "bars")
			.attr("fill", "lightsteelblue")
			.attr("height", function(d) { return (250-confYScale(d.count)); })
			.attr("width", ((400/confCounts.length)-2))
			.attr("transform", function(d,i) { return "translate(" + confXScale(currConfs[i]) + "," + confYScale(d.count) + ")"; })
			.on("mouseover", function(d) {
				conftip.show(d);
			})
			.on("mouseout", function(d) {
				conftip.hide(d);
			})

	chart.selectAll(".barValue")
			.data(confCounts)
			.enter()
			.append("text")
			.text(function(d) {
				return d.count;
			})
			.attr("class", "barValue")
			.attr("text-anchor", "middle")
			.attr("x", function(d, i) {
				return i * (400 /confCounts.length) + (400 / confCounts.length - 2) /2;
			})
			.attr("y", function(d) {
				return (confYScale(d.count) + 24);
			})
			.on("mouseover", function(d) {
				conftip.show(d);
			})
			.on("mouseout", function(d) {
				conftip.hide(d);
			})
}

// Function used for returning all paths to normal opacity
function backToNormal() {
	d3.selectAll("path.teampath")
					.style("opacity", 1)
					.style("stroke-width", origStroke);
}

// Call displayPoll function when the year selector is changed
d3.select("#yearselect").on("change", change)
function change() {
	displayPoll(undefined,d3.select("#yearselect").property("value"));
}
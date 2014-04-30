// Load the teamcolors file and function for searching for a school's main color
var teamcolors;

d3.text("data/teamcolors.csv", function(error, data) {
	teamcolors = d3.csv.parseRows(data);
})

function searchColor(school) {
	for (var i=0;i<teamcolors.length;i++) {
		if (teamcolors[i][0] === school) {
			if ((teamcolors[i][1] === "#FFFFFF")/* || (teamcolors[i][1] === "#000000")*/) {
				return teamcolors[i][2];
			} else if (teamcolors[i][1] === "") {
				return "#000000";
			} else {
				return teamcolors[i][1];
			}
		}
	}
}
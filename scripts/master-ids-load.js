// Load the master id list and create a function for obtaining missing data based on known data
var master_ids;

d3.csv("data/new-master-id.csv", function(error, data) {
	master_ids = data;
})

function getIDsBy(espn_id, sports_ref_id, teamrankings_id, friendly_school, friendly_full) {
	var retVal;
	if (espn_id) {
		master_ids.forEach(function(d) {
			if (d.espn_id == espn_id) {
				retVal = d;
			}
		})
		return retVal;
	}
	if (sports_ref_id) {
		master_ids.forEach(function(d) {
			if (d.sports_ref_id == sports_ref_id) {
				retVal = d;
			}
		})
		return retVal;
	}
	if (teamrankings_id) {
		master_ids.forEach(function(d) {
			if (d.teamrankings_id == teamrankings_id) {
				retVal = d;
			}
		})
		return retVal;
	}
	if (friendly_school) {
		master_ids.forEach(function(d) {
			if (d.friendly_school === friendly_school) {
				retVal = d;
			}
		})
		return retVal;
	}
	if (friendly_full) {
		master_ids.forEach(function(d) {
			if (d.friendly_full === friendly_full) {
				retVal = d;
			}
		})
		return retVal;
	}
}
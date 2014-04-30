var conferences_list;

d3.csv("data/conferences.csv", function(error, data) {
	conferences_list = data;
})

function getFullConference(short_conf) {
	for (var i=0;i<conferences_list.length;i++) {
		if (conferences_list[i].conf_short === short_conf) {
			return conferences_list[i].conf_full;
		}
	}
}
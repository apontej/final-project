//$(document).ready(function() { // removed for debugging
  
  // much borrowed from
  // http://bl.ocks.org/mbostock/4063318

  console.log('iron');

  var margin = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
  }
  var width = 960 - margin.left - margin.right;
  var height = 150 - margin.top - margin.bottom;
  //var width = 960;
  //var height = 136;

  var dataset;
  var datesPlayed = {};
  var confsPlayed = {};

  var cellSize = 17;

  var day = d3.time.format('%w'); // weekday as integer
  var week = d3.time.format('%U'); // week # of the year
  var percent = d3.format('.1%');
  var dateFormat = d3.time.format('%Y-%m-%d');

  var colorScale = d3.scale.quantize()
    .range(
      d3.range(11)
        .map(function(d) {
          return 'q' + d + '-11';
        })
    );

  // console.log(d3.range(2012, 2014));
  
  // var svg = d3.select('body').selectAll('svg')
  //   .data(d3.range(2012, 2014))
  //   .enter()
  //     .append('svg')
  //     .attr('width', width)
  //     .attr('height', height)
  //     .attr('class', 'RdYlGn')
  //     .append('g')
  //       .attr('transform', 'translate(' 
  //         + (((width + margin.left + margin.right) 
  //           - (cellSize * 53)) / 2) + ','
  //           + ((height + margin.top + margin.bottom) 
  //             - (cellSize * 7) - 22) + ')')

  // var rect = svg.selectAll('.day')
  //   .data(function(d) {
  //     return d3.time.days(new Date(d, 10, 1),
  //       new Date(d + 1, 3, 30));
  //     //return d3.time.days(new Date(d, 10, 1),
  //     //  new Date(d + 1, 03, 30));
  //   })
  //   .enter()
  //     .append('rect')
  //     .attr('class', 'day')
  //     .attr('width', cellSize)
  //     .attr('height', cellSize)
  //     .attr('x', function (d) {
  //       return week(d) * cellSize;
  //     })
  //     .attr('y', function(d) {
  //       return day(d) * cellSize;
  //     })
  //     .datum(dateFormat)

  // rect
  //   .append('title')
  //   .text(function(d) {
  //     return d; 
  //   })

  // svg
  //   .selectAll('.month')
  //   .data(function(d) {
  //     return d3.time.months(new Date(d, 10, 1),
  //       new Date(d + 1, 3, 30));
  //     // return d3.time.months(new Date(d, 10, 1),
  //       // new Date(d + 1, 03, 30));
  //   })
  //   .enter()
  //     .append('path')
  //     .attr('class', 'month')
  //     .attr('d', monthPath);

  d3.csv('../data/all-games.csv', function(error, csv) {
    // some routine data formatting
    dataset = csv.map(function(d) {
      return {
        away_espn_id: d.away_espn_id,
        away_friendly_school: d.away_friendly_school,
        away_score: +d.away_score,
        conf_friendly: d.conf_friendly,
        date: dateFormat(new Date(d.date_time)),
        espn_game_id: d.espn_game_id,
        home_espn_id: d.home_espn_id,
        home_friendly_school: d.home_friendly_school,
        home_score: +d.home_score
      }
    });

    
    // set up count of games played on every day of season;
    // note: max # of games on a date is 154
    
    // get the season start and end dates
    var extent = d3.extent(dataset, function(d) { 
      return d.date; 
    });

    // calculate # of games each day
    dataset.forEach(function(d) {
      var date = dateFormat.parse(d.date);
      date = (+date / 1000).toString();
      //date = date.toString();
      // create datesPlayed object
      if (datesPlayed[date]) {
        datesPlayed[date]++;
      } else {
        datesPlayed[date] = 1;
      }
      // create confsPlayed object
      conf = d.conf_friendly;
      if (confsPlayed[date]) {
        if (confsPlayed[date][conf]) {
          confsPlayed[date][conf]++;
        } else {
          confsPlayed[date][conf] = 1;
        }
      } else {
        confsPlayed[date] = {};
        confsPlayed[date][conf] = 1;
      }

      // if (confsPlayed[conf]) {
      //   if (confsPlayed[conf][date]) {
      //     confsPlayed[conf][date]++;
      //   } else {
      //     confsPlayed[conf][date] = 1;
      //   }
      // } else {
      //   confsPlayed[conf] = {};
      //   confsPlayed[conf][date] = 1;
      // }
    }); // end forEach()


    // calculate max # of games played
    maxGames = 0;

    for (var date in datesPlayed) {
      if (datesPlayed[date] > maxGames) {
        maxGames = datesPlayed[date];
      }
    }

    // // set up domain of color scale from 0 games to maxGames games
    // colorScale
    //   .domain([0,maxGames]);

    // rect.filter(function(d) { return d in datesPlayed; })
    //     .attr("class", function(d) { if (datesPlayed[d]) { return "day " + colorScale(datesPlayed[d]); } else { return "day"; } })
    //     .on("click", function(d) { 
    //       if (confsPlayed[d]) { 
    //         console.log(confsPlayed[d]);
    //         string = ""; 
    //         for (var conf in confsPlayed[d]) {
    //           console.log(confsPlayed[d][conf]);
    //           string = string + conf + ": " + confsPlayed[d][conf] + "\n"; 
    //         }
    //         window.alert(string); 
    //       } 
    //     })
    //     .select("title")
    //       .text(function(d) { if (datesPlayed[d]) { return d + ": " + datesPlayed[d]; } });


    // set up domain of color scale
    //colorScale
      //.domain([0, buckets - 1, 154]) // MAGIC # ALERT 

  }); // end d3.csv()

  var jsondata;

  d3.json("datesPlayed.json", function(error, json) {
    jsondata = json;
  })

  var parser = function(data) {
    var dates = {};
    for (var date in datesPlayed) {
      dates[date] = datesPlayed[date];
    }
    return dates;
  }

  var cal = new CalHeatMap();
  cal.init({
    data: datesPlayed,
    dataType: "json",
    start: new Date(2012, 10),
    id: "cal-heatmap",
    domain: "month",
    subDomain: "x_day",
    range: 6
  });
  
  var xscale,yscale,yaxis,ysvg;

  //var confBarVis = d3.select("body").append("svg").attr({width:350, height:550} );

  function createConfBarVis() {
    xscale = d3.scale.linear().range([50,300]);
    yscale = d3.scale.ordinal().range([0,500]);

    yaxis = d3.svg.axis()
                .scale(yscale)
                .orient("left");

    ysvg = confBarVis.append("g")
              .attr("class", "axis")
              .attr("transform", "translate(50,0)");
  }

  function updateConfBarVis(confs) {
    maxGames = 0;
    confsArray = [];
    for (var conf in confs) {
      confsArray.push(conf);
      if (confs[conf] > maxGames) {
        maxGames = confs[conf];
      }
    }

    xscale.domain([0,maxGames]);
    yscale.domain(confsArray);
    ysvg.call(yaxis);
  }

  // nifty!
  // stolen from http://bl.ocks.org/mbostock/4063318
  function monthPath(t0) {
    var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0);
    var d0 = +day(t0);
    var w0 = +week(t0);
    var d1 = +day(t1);
    var w1 = +week(t1);
    return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
      + "H" + w0 * cellSize + "V" + 7 * cellSize
      + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
      + "H" + (w1 + 1) * cellSize + "V" + 0
      + "H" + (w0 + 1) * cellSize + "Z";
  };
  
//}); // end .ready() // removed for debugging
    var saveToFile = function(object, filename){
        var blob, blobText;
        blobText = [JSON.stringify(object)];
        blob = new Blob(blobText, {
            type: "text/plain;charset=utf-8"
        });
        saveAs(blob, filename);
    }
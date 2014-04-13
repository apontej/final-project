  var plays = []; // hold all our play objects
  var play = null;
  var awayId, homeId, fileName;
  var baseUrl =  'http://espn.go.com/ncb/playbyplay?gameId=';
  var indexId = 7; 
  // index of espn id after splitting on '/' on a team's url

  var saveJsonToFile = function(object, filename){
      var blob, blobText;
      blobText = [JSON.stringify(object)];
      blob = new Blob(blobText, {
          type: "text/plain;charset=utf-8"
      });
      saveAs(blob, filename);
  }

  var saveCsvToFile = function(arrayOfLines, fileName) {
      /* adds linebreaks at the end*/
      var blob, blobText;
      blobText = arrayOfLines.map(function(d) {
        if (d.endsWith("\n")) {
          return d;
        } else {
          return d + "\n";
        }
      });
      blob = new Blob(blobText, {
        type: "text/plain;charset=utf-8"
      });
      return saveAs(blob, fileName);
    };

    String.prototype.endsWith = function(suffix) {
       return this.indexOf(suffix, this.length - suffix.length) !== -1;
     };

  // take a team's espn url and parse out the espn id
  var getTeamIdFromLink = function(link) {
    return link.split('/')[indexId].trim();
  }

var dataset;
d3.csv('../data/all-gameids-2012-13.csv', function(error, data) {
  dataset = data;
})

function getPbP(gameid) {  
  console.log(gameid);
  //d3.csv('../data/all-gameids-2012-13.csv', function(error, data) {
    // grab 200 ids to scrape
    // var idsToScrape = [];
    // for (var i = start; i < stop; i++) {
    //   //console.log(data[i].game_id);
    //   idsToScrape.push(data[i].game_id);
    // }

    // idsToScrape.forEach(function(d,i) {
      $.ajax({
        url: baseUrl + gameid,
        //url: 'http://espn.go.com/ncb/playbyplay?gameId=323152168',
        type: 'GET',
        async: false,
        success: function(data, textStatus) {

          plays = [];
          outputStr = "clock,away_score,home_score\n";
          plays.push(outputStr);

          awayId
            = getTeamIdFromLink($(data.responseText)
              .find('.team.away h3 a')
              .attr('href'));
          homeId
            = getTeamIdFromLink($(data.responseText)
              .find('.team.home h3 a')
              .attr('href'));

          // grab all the rows
          var rows = $(data.responseText).
            find('.mod-data.mod-pbp tbody tr');
          var numRows = rows.length;

          if (numRows > 0) {
          // dynamically establish baseline number of <td>s in each row
          var numTDsInRow = $(rows[0]).find('td').length;

          // grab all the <td>s in each row, and process them
          rows.each(function(i) {
            outputStr = "";
            // initialize a new object in our plays array ...
            //plays[i] = {}; 
            // ... and grab hold of it
            //play = plays[i]; 

            // process each <td>
            var tds = $(this).find('td');
            tds.each(function(k) {
              
              // if we're in the first <td>
              if (k % numTDsInRow === 0 
                && $(this).attr('colspan') != 4) { 
                // note: there's a blank line, which we want to ignore,
                // after the end of the the 1st half; 
                // the blank line can be identified
                // by <td colspan=4>; so make sure colspan != 4
                // before we write anything
                  //play['c'] = $(this).text().trim()
                  outputStr += $(this).text().trim() + ",";
              } else if (k % numTDsInRow === 1) { 
                // we're in the second <td>: away team's play;
                // check that there are more than 2 <td>s in this row;
                // if there aren't, there's been a gameply stoppage 
                // like a timeout or end of half;
                // we'll note the score at the end of a half, as well
                // as that a half has ended; we'll not  
                // mention when timeout has happened
                if (tds.length > 2) {
                  //play['away_play'] = $(this).text().trim();
                } else { // ... play stoppage
                  var stoppageEvent = $(this).children().text(); 
                  // twist back to grab the score from the previous row
                  var score = $(this).parent('tr')
                    .prev('tr').find('td:nth-child(3)').text().trim();
                  //play['away_play'] = '';
                  // away score is listed first ... 
                  //play['as'] = score.split('-')[0]; 
                  outputStr += score.split('-')[0] + ",";
                  // ... and team_score is last
                  //play['hs'] = score.split('-')[1];
                  outputStr += score.split('-')[1] + "\n"; 
                  //play['home_play'] = '';
                  // and note the event that stopped the game
                  //play['stoppage'] = stoppageEvent;
                }
              } else if (k % numTDsInRow === 2) {
                // we're in the third <td>, the one with the score;
                // we probably don't need to check number 
                // of <td>s at this
                // point, but we will just to be safe
                if (tds.length > 2) {
                  var score = $(this).text().trim().split('-');
                  //play['as'] = score[0];
                  outputStr += score[0] + ",";
                  //play['hs'] = score[1];
                  outputStr += score[1] + "\n";
                } else {
                  //play['as'] = '';
                  outputStr += ",";
                  //play['hs'] = '';
                  outputStr += "\n";
                  //play['home_play'] = '';
                  //play['stoppage'] = '';
                }
              } else if (k % numTDsInRow === 3) {
                // we're in the third <td>: the home play;
                // again, check tds.length just to be safe
                if (tds.length > 2) {
                  //play['home_play'] = $(this).text().trim();
                } else {
                  //play['home_play'] = '';
                }
              }
            });
          if (outputStr.length > 0) {
            plays.push(outputStr);
          }
          });
          
          }

          /****** SAVE JSON **********
          ***************************/
          //console.log(plays);
          var fileName =  awayId + '-' + homeId + '-' + gameid
            + '.csv';

          saveCsvToFile(plays, fileName);
          /***************************
          ***************************/

          //http://stackoverflow.com/questions/11257062/
          //  converting-json-object-to-csv-format-in-javascript
          function convertToCSV(objArray) {
            var array = 
              typeof objArray 
                != 'object' ? JSON.parse(objArray) : objArray;

            var arrOfStr = []
            arrOfStr.push('clock,away_play,score,home_play');
            for (var i = 0; i < array.length; i++) {
              var str = '';
              var line = '';
              for (var index in array[i]) {
                if (line != '') {
                  line += ',';
                }

                line += array[i][index];
              }

              str += line + '\r\n';
              arrOfStr.push(str);
            }

            return arrOfStr;
          }

          //convert plays array to CSV
          //var csv = convertToCSV(plays);
          //saveCsvToFile(csv, 'temp.csv'); // temp name for now

        } // end success
      }); // end $.ajax()
    //}); // end data.forEach()
  //}); // end d3.csv()
}

function runner(start, stop) {
  for (var i=start;i<stop;i++) {
    d = dataset[i];
    getPbP(d.gameid);
  }
}
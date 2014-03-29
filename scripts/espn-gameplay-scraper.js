$(document).ready(function() {

  var plays = []; // hold all our play objects
  var play = null;

  var saveToFile = function(arrayOfLines, fileName) {
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

  
  $.ajax({
    url: 'http://espn.go.com/ncb/playbyplay?gameId=400502374',
    //url: 'http://espn.go.com/ncb/playbyplay?gameId=323152168',
    type: 'GET',
    success: function(data, textStatus) {

      // grab all the rows
      var rows = $(data.responseText).find('.mod-data.mod-pbp tbody tr');
      var numRows = rows.length;

      // grab all the TDs
      var tds = $(rows).find('td');
      
      // dynamically establish baseline number of TDs in each row
      var numTDsInRow = $(rows[0]).find('td').length;

      // grab all the TDs in each row, and process them
      rows.each(function(i) {
        plays[i] = {}; // initialize a new object in our plays array ...
        play = plays[i]; // ... and grab hold of it

        // process each TD
        var tds = $(this).find('td');
        tds.each(function(k) {
          if (k % numTDsInRow === 0) { 
            // we're in the first TD;
              play['clock'] = $(this).text().trim()
          } else if (k % numTDsInRow === 1) { 
            // we're in the second TD;
            // check that there are more than 2 TDs in this row;
            // if there aren't, something is unusual about this play,
            // like a timeout or end of half, 
            // in which case we'll only note the clock
            if (tds.length > 2) {
              play['away_play'] = $(this).text().trim();
            } else {
              play['away_play'] = '';
              play['score'] = '';
              play['home_play'] = '';
            }
          } else if (k % numTDsInRow === 2) {
            // we're in the third TD;
            // we probably don't need to check number of TDs at this
            // point, but we will just to be safe
            if (tds.length > 2) {
              play['score'] = $(this).text().trim();
            } else {
              play['score'] = '';
              play['home_play'] = '';
            }
          } else if (k % numTDsInRow === 3) {
            // we're in the third TD;
            // again, check tds.length just to be safe
            if (tds.length > 2) {
              play['home_play'] = $(this).text().trim();
            } else {
              play['home_play'] = '';
            }
          }
        });
        
      });
      
      //var data = JSON.stringify(plays); // make JSON 
      //var data = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(plays));
      //$('body').append('<div>').attr('id', 'container');
      //$('<a href="data:' + data + '" download="data.json">download JSON</a>').appendTo('#container');

      //http://stackoverflow.com/questions/11257062/converting-json-object-to-csv-format-in-javascript
      function convertToCSV(objArray) {
        var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;

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

      var csv = convertToCSV(plays);
      saveToFile(csv, 'temp.csv'); // temp name for now

    } // end success
  }); // end $.ajax()
}); 

var fs = require('fs'),
  http = require('http'),
  PNG = require('pngjs').PNG;


function startApp() {
  var inImg = process.argv[2],
    mode = process.argv[3],
    idx = 3,
    msg, msgLength, step, stepWidth, stepHeight, outImg, sep, swp, encodedChar;

  if(inImg.indexOf('.png') !== (inImg.length - 4)) {  // check extension
    console.log('Incorrect file format. Please, enter file in PNG format.');
    return;
  }

  function codeImage() {
    swp = (((this.width * (this.height - 1)) + 1) * 4) - 1; // south west pixel
    sep = (this.width * this.height * 4) - 1;               // south east pixel
    if (mode === '-encode') {
      msg = process.argv[4];
      if (!msg) {  // check availability to encode
        console.log('Empty message. Please, enter message to encode');
        return;
      }

      if (!process.argv[5]) {  // check availability to encode
        console.log('Incorrect step. Please, enter correct step to encode');
        return;
      }
      step = process.argv[5].split('x');
      stepWidth = +step[0];
      stepHeight = +step[1];
      outImg = process.argv[6];


      if ((msg.length * (this.width * stepHeight + stepWidth) * 4) > this.data.length) {  // check availability to encode
        console.log('Message or step is too big for this file');
        return;
      }

      this.data[idx] = msg.length;
      this.data[swp] = stepWidth;
      this.data[sep] = stepHeight;
      for (var i = 0; i < msg.length; i++) {
        idx = idx + ((this.width * stepHeight + stepWidth) * 4);
        encodedChar = msg.charCodeAt(i);
        if (encodedChar > 127) {  // check ASCII
          console.log('Message contains symbol which is not from ASCII table');
          return;
        }
        if (idx === swp || idx === sep) {
          this.data[idx - 4] = encodedChar;
        } else {
          this.data[idx] = encodedChar;
        }
      }
      if (outImg) {
        this.pack().pipe(
          fs.createWriteStream(outImg)
            .on('finish', function () {
              console.log(outImg + ' has been encoded, message=\"' + msg + '\", pattern=' + stepWidth + 'x' + stepHeight);
            })
        );
      }
    } else if (mode === '-decode') {
      msg = '';
      msgLength = this.data[idx];
      stepWidth = this.data[swp];
      stepHeight = this.data[sep];
      for (var j = 0; j < msgLength; j++) {
        idx = idx + ((this.width * stepHeight + stepWidth) * 4);
        if (idx === swp || idx === sep) {
          msg = msg + String.fromCharCode(this.data[idx - 4]);
        } else {
          msg = msg + String.fromCharCode(this.data[idx]);
        }
      }
      console.log(inImg + ' was decoded, message=\"' + msg + '\", pattern=' + stepWidth + 'x' + stepHeight);
    }
  }

  if (inImg.indexOf('http://') === 0) {           // check for url in input
    http.get(inImg, function (res) {
      if (res.statusCode === 200) {
        var len = parseInt(res.headers['content-length'], 10);
        var downloaded = 0;
        res.pipe(new PNG({
            filterType: 4
          }))
          .on('parsed', codeImage);
          res.on('data', (chunk) => {
            downloaded += chunk.length;
            console.log("Downloading " + (100.0 * downloaded / len).toFixed(2) + "% " + downloaded + " bytes");
          })
      }
    }).on('error', (e) => {
      console.log(`Got error: ${e.message}`);
    });
  } else if (inImg) {
    fs.stat(inImg, function(err, stat) {
      if(err) {
        console.log('Got error: ' + err);
        return;
      }
      var len = parseInt(stat.size);
      var downloaded = 0;
      fs.createReadStream(inImg)
        .pipe(new PNG({
          filterType: 4
        })).on('data', (chunk) => {
          downloaded += chunk.length;
          console.log("Reading " + (100.0 * downloaded / len).toFixed(2) + "% " + downloaded + " bytes");
        })
        .on('parsed', codeImage);
    });
  }
}

startApp();

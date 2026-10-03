/* ===== qrcode-generator 2.0.4 (tools/vendor/qrcode-generator/qrcode.js), inlined so the QR code on the book pages is made
   here with no network access. Copyright (c) 2009 Kazuhiko Arase, MIT licence (see the header that follows and
   tools/vendor/qrcode-generator/LICENSE). The word "QR Code" is a registered trademark of DENSO WAVE INCORPORATED. ===== */
//---------------------------------------------------------------------
//
// QR Code Generator for JavaScript
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//
// The word 'QR Code' is registered trademark of
// DENSO WAVE INCORPORATED
//  http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------

var qrcode = function() {

  //---------------------------------------------------------------------
  // qrcode
  //---------------------------------------------------------------------

  /**
   * qrcode
   * @param typeNumber 1 to 40
   * @param errorCorrectionLevel 'L','M','Q','H'
   */
  var qrcode = function(typeNumber, errorCorrectionLevel) {

    var PAD0 = 0xEC;
    var PAD1 = 0x11;

    var _typeNumber = typeNumber;
    var _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel];
    var _modules = null;
    var _moduleCount = 0;
    var _dataCache = null;
    var _dataList = [];

    var _this = {};

    var makeImpl = function(test, maskPattern) {

      _moduleCount = _typeNumber * 4 + 17;
      _modules = function(moduleCount) {
        var modules = new Array(moduleCount);
        for (var row = 0; row < moduleCount; row += 1) {
          modules[row] = new Array(moduleCount);
          for (var col = 0; col < moduleCount; col += 1) {
            modules[row][col] = null;
          }
        }
        return modules;
      }(_moduleCount);

      setupPositionProbePattern(0, 0);
      setupPositionProbePattern(_moduleCount - 7, 0);
      setupPositionProbePattern(0, _moduleCount - 7);
      setupPositionAdjustPattern();
      setupTimingPattern();
      setupTypeInfo(test, maskPattern);

      if (_typeNumber >= 7) {
        setupTypeNumber(test);
      }

      if (_dataCache == null) {
        _dataCache = createData(_typeNumber, _errorCorrectionLevel, _dataList);
      }

      mapData(_dataCache, maskPattern);
    };

    var setupPositionProbePattern = function(row, col) {

      for (var r = -1; r <= 7; r += 1) {

        if (row + r <= -1 || _moduleCount <= row + r) continue;

        for (var c = -1; c <= 7; c += 1) {

          if (col + c <= -1 || _moduleCount <= col + c) continue;

          if ( (0 <= r && r <= 6 && (c == 0 || c == 6) )
              || (0 <= c && c <= 6 && (r == 0 || r == 6) )
              || (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
            _modules[row + r][col + c] = true;
          } else {
            _modules[row + r][col + c] = false;
          }
        }
      }
    };

    var getBestMaskPattern = function() {

      var minLostPoint = 0;
      var pattern = 0;

      for (var i = 0; i < 8; i += 1) {

        makeImpl(true, i);

        var lostPoint = QRUtil.getLostPoint(_this);

        if (i == 0 || minLostPoint > lostPoint) {
          minLostPoint = lostPoint;
          pattern = i;
        }
      }

      return pattern;
    };

    var setupTimingPattern = function() {

      for (var r = 8; r < _moduleCount - 8; r += 1) {
        if (_modules[r][6] != null) {
          continue;
        }
        _modules[r][6] = (r % 2 == 0);
      }

      for (var c = 8; c < _moduleCount - 8; c += 1) {
        if (_modules[6][c] != null) {
          continue;
        }
        _modules[6][c] = (c % 2 == 0);
      }
    };

    var setupPositionAdjustPattern = function() {

      var pos = QRUtil.getPatternPosition(_typeNumber);

      for (var i = 0; i < pos.length; i += 1) {

        for (var j = 0; j < pos.length; j += 1) {

          var row = pos[i];
          var col = pos[j];

          if (_modules[row][col] != null) {
            continue;
          }

          for (var r = -2; r <= 2; r += 1) {

            for (var c = -2; c <= 2; c += 1) {

              if (r == -2 || r == 2 || c == -2 || c == 2
                  || (r == 0 && c == 0) ) {
                _modules[row + r][col + c] = true;
              } else {
                _modules[row + r][col + c] = false;
              }
            }
          }
        }
      }
    };

    var setupTypeNumber = function(test) {

      var bits = QRUtil.getBCHTypeNumber(_typeNumber);

      for (var i = 0; i < 18; i += 1) {
        var mod = (!test && ( (bits >> i) & 1) == 1);
        _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
      }

      for (var i = 0; i < 18; i += 1) {
        var mod = (!test && ( (bits >> i) & 1) == 1);
        _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
      }
    };

    var setupTypeInfo = function(test, maskPattern) {

      var data = (_errorCorrectionLevel << 3) | maskPattern;
      var bits = QRUtil.getBCHTypeInfo(data);

      // vertical
      for (var i = 0; i < 15; i += 1) {

        var mod = (!test && ( (bits >> i) & 1) == 1);

        if (i < 6) {
          _modules[i][8] = mod;
        } else if (i < 8) {
          _modules[i + 1][8] = mod;
        } else {
          _modules[_moduleCount - 15 + i][8] = mod;
        }
      }

      // horizontal
      for (var i = 0; i < 15; i += 1) {

        var mod = (!test && ( (bits >> i) & 1) == 1);

        if (i < 8) {
          _modules[8][_moduleCount - i - 1] = mod;
        } else if (i < 9) {
          _modules[8][15 - i - 1 + 1] = mod;
        } else {
          _modules[8][15 - i - 1] = mod;
        }
      }

      // fixed module
      _modules[_moduleCount - 8][8] = (!test);
    };

    var mapData = function(data, maskPattern) {

      var inc = -1;
      var row = _moduleCount - 1;
      var bitIndex = 7;
      var byteIndex = 0;
      var maskFunc = QRUtil.getMaskFunction(maskPattern);

      for (var col = _moduleCount - 1; col > 0; col -= 2) {

        if (col == 6) col -= 1;

        while (true) {

          for (var c = 0; c < 2; c += 1) {

            if (_modules[row][col - c] == null) {

              var dark = false;

              if (byteIndex < data.length) {
                dark = ( ( (data[byteIndex] >>> bitIndex) & 1) == 1);
              }

              var mask = maskFunc(row, col - c);

              if (mask) {
                dark = !dark;
              }

              _modules[row][col - c] = dark;
              bitIndex -= 1;

              if (bitIndex == -1) {
                byteIndex += 1;
                bitIndex = 7;
              }
            }
          }

          row += inc;

          if (row < 0 || _moduleCount <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    };

    var createBytes = function(buffer, rsBlocks) {

      var offset = 0;

      var maxDcCount = 0;
      var maxEcCount = 0;

      var dcdata = new Array(rsBlocks.length);
      var ecdata = new Array(rsBlocks.length);

      for (var r = 0; r < rsBlocks.length; r += 1) {

        var dcCount = rsBlocks[r].dataCount;
        var ecCount = rsBlocks[r].totalCount - dcCount;

        maxDcCount = Math.max(maxDcCount, dcCount);
        maxEcCount = Math.max(maxEcCount, ecCount);

        dcdata[r] = new Array(dcCount);

        for (var i = 0; i < dcdata[r].length; i += 1) {
          dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
        }
        offset += dcCount;

        var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
        var rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);

        var modPoly = rawPoly.mod(rsPoly);
        ecdata[r] = new Array(rsPoly.getLength() - 1);
        for (var i = 0; i < ecdata[r].length; i += 1) {
          var modIndex = i + modPoly.getLength() - ecdata[r].length;
          ecdata[r][i] = (modIndex >= 0)? modPoly.getAt(modIndex) : 0;
        }
      }

      var totalCodeCount = 0;
      for (var i = 0; i < rsBlocks.length; i += 1) {
        totalCodeCount += rsBlocks[i].totalCount;
      }

      var data = new Array(totalCodeCount);
      var index = 0;

      for (var i = 0; i < maxDcCount; i += 1) {
        for (var r = 0; r < rsBlocks.length; r += 1) {
          if (i < dcdata[r].length) {
            data[index] = dcdata[r][i];
            index += 1;
          }
        }
      }

      for (var i = 0; i < maxEcCount; i += 1) {
        for (var r = 0; r < rsBlocks.length; r += 1) {
          if (i < ecdata[r].length) {
            data[index] = ecdata[r][i];
            index += 1;
          }
        }
      }

      return data;
    };

    var createData = function(typeNumber, errorCorrectionLevel, dataList) {

      var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel);

      var buffer = qrBitBuffer();

      for (var i = 0; i < dataList.length; i += 1) {
        var data = dataList[i];
        buffer.put(data.getMode(), 4);
        buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
        data.write(buffer);
      }

      // calc num max data.
      var totalDataCount = 0;
      for (var i = 0; i < rsBlocks.length; i += 1) {
        totalDataCount += rsBlocks[i].dataCount;
      }

      if (buffer.getLengthInBits() > totalDataCount * 8) {
        throw 'code length overflow. ('
          + buffer.getLengthInBits()
          + '>'
          + totalDataCount * 8
          + ')';
      }

      // end code
      if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
        buffer.put(0, 4);
      }

      // padding
      while (buffer.getLengthInBits() % 8 != 0) {
        buffer.putBit(false);
      }

      // padding
      while (true) {

        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break;
        }
        buffer.put(PAD0, 8);

        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break;
        }
        buffer.put(PAD1, 8);
      }

      return createBytes(buffer, rsBlocks);
    };

    _this.addData = function(data, mode) {

      mode = mode || 'Byte';

      var newData = null;

      switch(mode) {
      case 'Numeric' :
        newData = qrNumber(data);
        break;
      case 'Alphanumeric' :
        newData = qrAlphaNum(data);
        break;
      case 'Byte' :
        newData = qr8BitByte(data);
        break;
      case 'Kanji' :
        newData = qrKanji(data);
        break;
      default :
        throw 'mode:' + mode;
      }

      _dataList.push(newData);
      _dataCache = null;
    };

    _this.isDark = function(row, col) {
      if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
        throw row + ',' + col;
      }
      return _modules[row][col];
    };

    _this.getModuleCount = function() {
      return _moduleCount;
    };

    _this.make = function() {
      if (_typeNumber < 1) {
        var typeNumber = 1;

        for (; typeNumber < 40; typeNumber++) {
          var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, _errorCorrectionLevel);
          var buffer = qrBitBuffer();

          for (var i = 0; i < _dataList.length; i++) {
            var data = _dataList[i];
            buffer.put(data.getMode(), 4);
            buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
            data.write(buffer);
          }

          var totalDataCount = 0;
          for (var i = 0; i < rsBlocks.length; i++) {
            totalDataCount += rsBlocks[i].dataCount;
          }

          if (buffer.getLengthInBits() <= totalDataCount * 8) {
            break;
          }
        }

        _typeNumber = typeNumber;
      }

      makeImpl(false, getBestMaskPattern() );
    };

    _this.createTableTag = function(cellSize, margin) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var qrHtml = '';

      qrHtml += '<table style="';
      qrHtml += ' border-width: 0px; border-style: none;';
      qrHtml += ' border-collapse: collapse;';
      qrHtml += ' padding: 0px; margin: ' + margin + 'px;';
      qrHtml += '">';
      qrHtml += '<tbody>';

      for (var r = 0; r < _this.getModuleCount(); r += 1) {

        qrHtml += '<tr>';

        for (var c = 0; c < _this.getModuleCount(); c += 1) {
          qrHtml += '<td style="';
          qrHtml += ' border-width: 0px; border-style: none;';
          qrHtml += ' border-collapse: collapse;';
          qrHtml += ' padding: 0px; margin: 0px;';
          qrHtml += ' width: ' + cellSize + 'px;';
          qrHtml += ' height: ' + cellSize + 'px;';
          qrHtml += ' background-color: ';
          qrHtml += _this.isDark(r, c)? '#000000' : '#ffffff';
          qrHtml += ';';
          qrHtml += '"/>';
        }

        qrHtml += '</tr>';
      }

      qrHtml += '</tbody>';
      qrHtml += '</table>';

      return qrHtml;
    };

    _this.createSvgTag = function(cellSize, margin, alt, title) {

      var opts = {};
      if (typeof arguments[0] == 'object') {
        // Called by options.
        opts = arguments[0];
        // overwrite cellSize and margin.
        cellSize = opts.cellSize;
        margin = opts.margin;
        alt = opts.alt;
        title = opts.title;
      }

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      // Compose alt property surrogate
      alt = (typeof alt === 'string') ? {text: alt} : alt || {};
      alt.text = alt.text || null;
      alt.id = (alt.text) ? alt.id || 'qrcode-description' : null;

      // Compose title property surrogate
      title = (typeof title === 'string') ? {text: title} : title || {};
      title.text = title.text || null;
      title.id = (title.text) ? title.id || 'qrcode-title' : null;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var c, mc, r, mr, qrSvg='', rect;

      rect = 'l' + cellSize + ',0 0,' + cellSize +
        ' -' + cellSize + ',0 0,-' + cellSize + 'z ';

      qrSvg += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"';
      qrSvg += !opts.scalable ? ' width="' + size + 'px" height="' + size + 'px"' : '';
      qrSvg += ' viewBox="0 0 ' + size + ' ' + size + '" ';
      qrSvg += ' preserveAspectRatio="xMinYMin meet"';
      qrSvg += (title.text || alt.text) ? ' role="img" aria-labelledby="' +
          escapeXml([title.id, alt.id].join(' ').trim() ) + '"' : '';
      qrSvg += '>';
      qrSvg += (title.text) ? '<title id="' + escapeXml(title.id) + '">' +
          escapeXml(title.text) + '</title>' : '';
      qrSvg += (alt.text) ? '<description id="' + escapeXml(alt.id) + '">' +
          escapeXml(alt.text) + '</description>' : '';
      qrSvg += '<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>';
      qrSvg += '<path d="';

      for (r = 0; r < _this.getModuleCount(); r += 1) {
        mr = r * cellSize + margin;
        for (c = 0; c < _this.getModuleCount(); c += 1) {
          if (_this.isDark(r, c) ) {
            mc = c*cellSize+margin;
            qrSvg += 'M' + mc + ',' + mr + rect;
          }
        }
      }

      qrSvg += '" stroke="transparent" fill="black"/>';
      qrSvg += '</svg>';

      return qrSvg;
    };

    _this.createDataURL = function(cellSize, margin) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      return createDataURL(size, size, function(x, y) {
        if (min <= x && x < max && min <= y && y < max) {
          var c = Math.floor( (x - min) / cellSize);
          var r = Math.floor( (y - min) / cellSize);
          return _this.isDark(r, c)? 0 : 1;
        } else {
          return 1;
        }
      } );
    };

    _this.createImgTag = function(cellSize, margin, alt) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;

      var img = '';
      img += '<img';
      img += '\u0020src="';
      img += _this.createDataURL(cellSize, margin);
      img += '"';
      img += '\u0020width="';
      img += size;
      img += '"';
      img += '\u0020height="';
      img += size;
      img += '"';
      if (alt) {
        img += '\u0020alt="';
        img += escapeXml(alt);
        img += '"';
      }
      img += '/>';

      return img;
    };

    var escapeXml = function(s) {
      var escaped = '';
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charAt(i);
        switch(c) {
        case '<': escaped += '&lt;'; break;
        case '>': escaped += '&gt;'; break;
        case '&': escaped += '&amp;'; break;
        case '"': escaped += '&quot;'; break;
        default : escaped += c; break;
        }
      }
      return escaped;
    };

    var _createHalfASCII = function(margin) {
      var cellSize = 1;
      margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      var y, x, r1, r2, p;

      var blocks = {
        '██': '█',
        '█ ': '▀',
        ' █': '▄',
        '  ': ' '
      };

      var blocksLastLineNoMargin = {
        '██': '▀',
        '█ ': '▀',
        ' █': ' ',
        '  ': ' '
      };

      var ascii = '';
      for (y = 0; y < size; y += 2) {
        r1 = Math.floor((y - min) / cellSize);
        r2 = Math.floor((y + 1 - min) / cellSize);
        for (x = 0; x < size; x += 1) {
          p = '█';

          if (min <= x && x < max && min <= y && y < max && _this.isDark(r1, Math.floor((x - min) / cellSize))) {
            p = ' ';
          }

          if (min <= x && x < max && min <= y+1 && y+1 < max && _this.isDark(r2, Math.floor((x - min) / cellSize))) {
            p += ' ';
          }
          else {
            p += '█';
          }

          // Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
          ascii += (margin < 1 && y+1 >= max) ? blocksLastLineNoMargin[p] : blocks[p];
        }

        ascii += '\n';
      }

      if (size % 2 && margin > 0) {
        return ascii.substring(0, ascii.length - size - 1) + Array(size+1).join('▀');
      }

      return ascii.substring(0, ascii.length-1);
    };

    _this.createASCII = function(cellSize, margin) {
      cellSize = cellSize || 1;

      if (cellSize < 2) {
        return _createHalfASCII(margin);
      }

      cellSize -= 1;
      margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      var y, x, r, p;

      var white = Array(cellSize+1).join('██');
      var black = Array(cellSize+1).join('  ');

      var ascii = '';
      var line = '';
      for (y = 0; y < size; y += 1) {
        r = Math.floor( (y - min) / cellSize);
        line = '';
        for (x = 0; x < size; x += 1) {
          p = 1;

          if (min <= x && x < max && min <= y && y < max && _this.isDark(r, Math.floor((x - min) / cellSize))) {
            p = 0;
          }

          // Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
          line += p ? white : black;
        }

        for (r = 0; r < cellSize; r += 1) {
          ascii += line + '\n';
        }
      }

      return ascii.substring(0, ascii.length-1);
    };

    _this.renderTo2dContext = function(context, cellSize) {
      cellSize = cellSize || 2;
      var length = _this.getModuleCount();
      for (var row = 0; row < length; row++) {
        for (var col = 0; col < length; col++) {
          context.fillStyle = _this.isDark(row, col) ? 'black' : 'white';
          context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }

    return _this;
  };

  //---------------------------------------------------------------------
  // qrcode.stringToBytes
  //---------------------------------------------------------------------

  qrcode.stringToBytesFuncs = {
    'default' : function(s) {
      var bytes = [];
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charCodeAt(i);
        bytes.push(c & 0xff);
      }
      return bytes;
    }
  };

  qrcode.stringToBytes = qrcode.stringToBytesFuncs['default'];

  //---------------------------------------------------------------------
  // qrcode.createStringToBytes
  //---------------------------------------------------------------------

  /**
   * @param unicodeData base64 string of byte array.
   * [16bit Unicode],[16bit Bytes], ...
   * @param numChars
   */
  qrcode.createStringToBytes = function(unicodeData, numChars) {

    // create conversion map.

    var unicodeMap = function() {

      var bin = base64DecodeInputStream(unicodeData);
      var read = function() {
        var b = bin.read();
        if (b == -1) throw 'eof';
        return b;
      };

      var count = 0;
      var unicodeMap = {};
      while (true) {
        var b0 = bin.read();
        if (b0 == -1) break;
        var b1 = read();
        var b2 = read();
        var b3 = read();
        var k = String.fromCharCode( (b0 << 8) | b1);
        var v = (b2 << 8) | b3;
        unicodeMap[k] = v;
        count += 1;
      }
      if (count != numChars) {
        throw count + ' != ' + numChars;
      }

      return unicodeMap;
    }();

    var unknownChar = '?'.charCodeAt(0);

    return function(s) {
      var bytes = [];
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charCodeAt(i);
        if (c < 128) {
          bytes.push(c);
        } else {
          var b = unicodeMap[s.charAt(i)];
          if (typeof b == 'number') {
            if ( (b & 0xff) == b) {
              // 1byte
              bytes.push(b);
            } else {
              // 2bytes
              bytes.push(b >>> 8);
              bytes.push(b & 0xff);
            }
          } else {
            bytes.push(unknownChar);
          }
        }
      }
      return bytes;
    };
  };

  //---------------------------------------------------------------------
  // QRMode
  //---------------------------------------------------------------------

  var QRMode = {
    MODE_NUMBER :    1 << 0,
    MODE_ALPHA_NUM : 1 << 1,
    MODE_8BIT_BYTE : 1 << 2,
    MODE_KANJI :     1 << 3
  };

  //---------------------------------------------------------------------
  // QRErrorCorrectionLevel
  //---------------------------------------------------------------------

  var QRErrorCorrectionLevel = {
    L : 1,
    M : 0,
    Q : 3,
    H : 2
  };

  //---------------------------------------------------------------------
  // QRMaskPattern
  //---------------------------------------------------------------------

  var QRMaskPattern = {
    PATTERN000 : 0,
    PATTERN001 : 1,
    PATTERN010 : 2,
    PATTERN011 : 3,
    PATTERN100 : 4,
    PATTERN101 : 5,
    PATTERN110 : 6,
    PATTERN111 : 7
  };

  //---------------------------------------------------------------------
  // QRUtil
  //---------------------------------------------------------------------

  var QRUtil = function() {

    var PATTERN_POSITION_TABLE = [
      [],
      [6, 18],
      [6, 22],
      [6, 26],
      [6, 30],
      [6, 34],
      [6, 22, 38],
      [6, 24, 42],
      [6, 26, 46],
      [6, 28, 50],
      [6, 30, 54],
      [6, 32, 58],
      [6, 34, 62],
      [6, 26, 46, 66],
      [6, 26, 48, 70],
      [6, 26, 50, 74],
      [6, 30, 54, 78],
      [6, 30, 56, 82],
      [6, 30, 58, 86],
      [6, 34, 62, 90],
      [6, 28, 50, 72, 94],
      [6, 26, 50, 74, 98],
      [6, 30, 54, 78, 102],
      [6, 28, 54, 80, 106],
      [6, 32, 58, 84, 110],
      [6, 30, 58, 86, 114],
      [6, 34, 62, 90, 118],
      [6, 26, 50, 74, 98, 122],
      [6, 30, 54, 78, 102, 126],
      [6, 26, 52, 78, 104, 130],
      [6, 30, 56, 82, 108, 134],
      [6, 34, 60, 86, 112, 138],
      [6, 30, 58, 86, 114, 142],
      [6, 34, 62, 90, 118, 146],
      [6, 30, 54, 78, 102, 126, 150],
      [6, 24, 50, 76, 102, 128, 154],
      [6, 28, 54, 80, 106, 132, 158],
      [6, 32, 58, 84, 110, 136, 162],
      [6, 26, 54, 82, 110, 138, 166],
      [6, 30, 58, 86, 114, 142, 170]
    ];
    var G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
    var G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
    var G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

    var _this = {};

    var getBCHDigit = function(data) {
      var digit = 0;
      while (data != 0) {
        digit += 1;
        data >>>= 1;
      }
      return digit;
    };

    _this.getBCHTypeInfo = function(data) {
      var d = data << 10;
      while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
        d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15) ) );
      }
      return ( (data << 10) | d) ^ G15_MASK;
    };

    _this.getBCHTypeNumber = function(data) {
      var d = data << 12;
      while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
        d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18) ) );
      }
      return (data << 12) | d;
    };

    _this.getPatternPosition = function(typeNumber) {
      return PATTERN_POSITION_TABLE[typeNumber - 1];
    };

    _this.getMaskFunction = function(maskPattern) {

      switch (maskPattern) {

      case QRMaskPattern.PATTERN000 :
        return function(i, j) { return (i + j) % 2 == 0; };
      case QRMaskPattern.PATTERN001 :
        return function(i, j) { return i % 2 == 0; };
      case QRMaskPattern.PATTERN010 :
        return function(i, j) { return j % 3 == 0; };
      case QRMaskPattern.PATTERN011 :
        return function(i, j) { return (i + j) % 3 == 0; };
      case QRMaskPattern.PATTERN100 :
        return function(i, j) { return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 == 0; };
      case QRMaskPattern.PATTERN101 :
        return function(i, j) { return (i * j) % 2 + (i * j) % 3 == 0; };
      case QRMaskPattern.PATTERN110 :
        return function(i, j) { return ( (i * j) % 2 + (i * j) % 3) % 2 == 0; };
      case QRMaskPattern.PATTERN111 :
        return function(i, j) { return ( (i * j) % 3 + (i + j) % 2) % 2 == 0; };

      default :
        throw 'bad maskPattern:' + maskPattern;
      }
    };

    _this.getErrorCorrectPolynomial = function(errorCorrectLength) {
      var a = qrPolynomial([1], 0);
      for (var i = 0; i < errorCorrectLength; i += 1) {
        a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0) );
      }
      return a;
    };

    _this.getLengthInBits = function(mode, type) {

      if (1 <= type && type < 10) {

        // 1 - 9

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 10;
        case QRMode.MODE_ALPHA_NUM : return 9;
        case QRMode.MODE_8BIT_BYTE : return 8;
        case QRMode.MODE_KANJI     : return 8;
        default :
          throw 'mode:' + mode;
        }

      } else if (type < 27) {

        // 10 - 26

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 12;
        case QRMode.MODE_ALPHA_NUM : return 11;
        case QRMode.MODE_8BIT_BYTE : return 16;
        case QRMode.MODE_KANJI     : return 10;
        default :
          throw 'mode:' + mode;
        }

      } else if (type < 41) {

        // 27 - 40

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 14;
        case QRMode.MODE_ALPHA_NUM : return 13;
        case QRMode.MODE_8BIT_BYTE : return 16;
        case QRMode.MODE_KANJI     : return 12;
        default :
          throw 'mode:' + mode;
        }

      } else {
        throw 'type:' + type;
      }
    };

    _this.getLostPoint = function(qrcode) {

      var moduleCount = qrcode.getModuleCount();

      var lostPoint = 0;

      // LEVEL1

      for (var row = 0; row < moduleCount; row += 1) {
        for (var col = 0; col < moduleCount; col += 1) {

          var sameCount = 0;
          var dark = qrcode.isDark(row, col);

          for (var r = -1; r <= 1; r += 1) {

            if (row + r < 0 || moduleCount <= row + r) {
              continue;
            }

            for (var c = -1; c <= 1; c += 1) {

              if (col + c < 0 || moduleCount <= col + c) {
                continue;
              }

              if (r == 0 && c == 0) {
                continue;
              }

              if (dark == qrcode.isDark(row + r, col + c) ) {
                sameCount += 1;
              }
            }
          }

          if (sameCount > 5) {
            lostPoint += (3 + sameCount - 5);
          }
        }
      };

      // LEVEL2

      for (var row = 0; row < moduleCount - 1; row += 1) {
        for (var col = 0; col < moduleCount - 1; col += 1) {
          var count = 0;
          if (qrcode.isDark(row, col) ) count += 1;
          if (qrcode.isDark(row + 1, col) ) count += 1;
          if (qrcode.isDark(row, col + 1) ) count += 1;
          if (qrcode.isDark(row + 1, col + 1) ) count += 1;
          if (count == 0 || count == 4) {
            lostPoint += 3;
          }
        }
      }

      // LEVEL3

      for (var row = 0; row < moduleCount; row += 1) {
        for (var col = 0; col < moduleCount - 6; col += 1) {
          if (qrcode.isDark(row, col)
              && !qrcode.isDark(row, col + 1)
              &&  qrcode.isDark(row, col + 2)
              &&  qrcode.isDark(row, col + 3)
              &&  qrcode.isDark(row, col + 4)
              && !qrcode.isDark(row, col + 5)
              &&  qrcode.isDark(row, col + 6) ) {
            lostPoint += 40;
          }
        }
      }

      for (var col = 0; col < moduleCount; col += 1) {
        for (var row = 0; row < moduleCount - 6; row += 1) {
          if (qrcode.isDark(row, col)
              && !qrcode.isDark(row + 1, col)
              &&  qrcode.isDark(row + 2, col)
              &&  qrcode.isDark(row + 3, col)
              &&  qrcode.isDark(row + 4, col)
              && !qrcode.isDark(row + 5, col)
              &&  qrcode.isDark(row + 6, col) ) {
            lostPoint += 40;
          }
        }
      }

      // LEVEL4

      var darkCount = 0;

      for (var col = 0; col < moduleCount; col += 1) {
        for (var row = 0; row < moduleCount; row += 1) {
          if (qrcode.isDark(row, col) ) {
            darkCount += 1;
          }
        }
      }

      var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
      lostPoint += ratio * 10;

      return lostPoint;
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // QRMath
  //---------------------------------------------------------------------

  var QRMath = function() {

    var EXP_TABLE = new Array(256);
    var LOG_TABLE = new Array(256);

    // initialize tables
    for (var i = 0; i < 8; i += 1) {
      EXP_TABLE[i] = 1 << i;
    }
    for (var i = 8; i < 256; i += 1) {
      EXP_TABLE[i] = EXP_TABLE[i - 4]
        ^ EXP_TABLE[i - 5]
        ^ EXP_TABLE[i - 6]
        ^ EXP_TABLE[i - 8];
    }
    for (var i = 0; i < 255; i += 1) {
      LOG_TABLE[EXP_TABLE[i] ] = i;
    }

    var _this = {};

    _this.glog = function(n) {

      if (n < 1) {
        throw 'glog(' + n + ')';
      }

      return LOG_TABLE[n];
    };

    _this.gexp = function(n) {

      while (n < 0) {
        n += 255;
      }

      while (n >= 256) {
        n -= 255;
      }

      return EXP_TABLE[n];
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // qrPolynomial
  //---------------------------------------------------------------------

  function qrPolynomial(num, shift) {

    if (typeof num.length == 'undefined') {
      throw num.length + '/' + shift;
    }

    var _num = function() {
      var offset = 0;
      while (offset < num.length && num[offset] == 0) {
        offset += 1;
      }
      var _num = new Array(num.length - offset + shift);
      for (var i = 0; i < num.length - offset; i += 1) {
        _num[i] = num[i + offset];
      }
      return _num;
    }();

    var _this = {};

    _this.getAt = function(index) {
      return _num[index];
    };

    _this.getLength = function() {
      return _num.length;
    };

    _this.multiply = function(e) {

      var num = new Array(_this.getLength() + e.getLength() - 1);

      for (var i = 0; i < _this.getLength(); i += 1) {
        for (var j = 0; j < e.getLength(); j += 1) {
          num[i + j] ^= QRMath.gexp(QRMath.glog(_this.getAt(i) ) + QRMath.glog(e.getAt(j) ) );
        }
      }

      return qrPolynomial(num, 0);
    };

    _this.mod = function(e) {

      if (_this.getLength() - e.getLength() < 0) {
        return _this;
      }

      var ratio = QRMath.glog(_this.getAt(0) ) - QRMath.glog(e.getAt(0) );

      var num = new Array(_this.getLength() );
      for (var i = 0; i < _this.getLength(); i += 1) {
        num[i] = _this.getAt(i);
      }

      for (var i = 0; i < e.getLength(); i += 1) {
        num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i) ) + ratio);
      }

      // recursive call
      return qrPolynomial(num, 0).mod(e);
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // QRRSBlock
  //---------------------------------------------------------------------

  var QRRSBlock = function() {

    var RS_BLOCK_TABLE = [

      // L
      // M
      // Q
      // H

      // 1
      [1, 26, 19],
      [1, 26, 16],
      [1, 26, 13],
      [1, 26, 9],

      // 2
      [1, 44, 34],
      [1, 44, 28],
      [1, 44, 22],
      [1, 44, 16],

      // 3
      [1, 70, 55],
      [1, 70, 44],
      [2, 35, 17],
      [2, 35, 13],

      // 4
      [1, 100, 80],
      [2, 50, 32],
      [2, 50, 24],
      [4, 25, 9],

      // 5
      [1, 134, 108],
      [2, 67, 43],
      [2, 33, 15, 2, 34, 16],
      [2, 33, 11, 2, 34, 12],

      // 6
      [2, 86, 68],
      [4, 43, 27],
      [4, 43, 19],
      [4, 43, 15],

      // 7
      [2, 98, 78],
      [4, 49, 31],
      [2, 32, 14, 4, 33, 15],
      [4, 39, 13, 1, 40, 14],

      // 8
      [2, 121, 97],
      [2, 60, 38, 2, 61, 39],
      [4, 40, 18, 2, 41, 19],
      [4, 40, 14, 2, 41, 15],

      // 9
      [2, 146, 116],
      [3, 58, 36, 2, 59, 37],
      [4, 36, 16, 4, 37, 17],
      [4, 36, 12, 4, 37, 13],

      // 10
      [2, 86, 68, 2, 87, 69],
      [4, 69, 43, 1, 70, 44],
      [6, 43, 19, 2, 44, 20],
      [6, 43, 15, 2, 44, 16],

      // 11
      [4, 101, 81],
      [1, 80, 50, 4, 81, 51],
      [4, 50, 22, 4, 51, 23],
      [3, 36, 12, 8, 37, 13],

      // 12
      [2, 116, 92, 2, 117, 93],
      [6, 58, 36, 2, 59, 37],
      [4, 46, 20, 6, 47, 21],
      [7, 42, 14, 4, 43, 15],

      // 13
      [4, 133, 107],
      [8, 59, 37, 1, 60, 38],
      [8, 44, 20, 4, 45, 21],
      [12, 33, 11, 4, 34, 12],

      // 14
      [3, 145, 115, 1, 146, 116],
      [4, 64, 40, 5, 65, 41],
      [11, 36, 16, 5, 37, 17],
      [11, 36, 12, 5, 37, 13],

      // 15
      [5, 109, 87, 1, 110, 88],
      [5, 65, 41, 5, 66, 42],
      [5, 54, 24, 7, 55, 25],
      [11, 36, 12, 7, 37, 13],

      // 16
      [5, 122, 98, 1, 123, 99],
      [7, 73, 45, 3, 74, 46],
      [15, 43, 19, 2, 44, 20],
      [3, 45, 15, 13, 46, 16],

      // 17
      [1, 135, 107, 5, 136, 108],
      [10, 74, 46, 1, 75, 47],
      [1, 50, 22, 15, 51, 23],
      [2, 42, 14, 17, 43, 15],

      // 18
      [5, 150, 120, 1, 151, 121],
      [9, 69, 43, 4, 70, 44],
      [17, 50, 22, 1, 51, 23],
      [2, 42, 14, 19, 43, 15],

      // 19
      [3, 141, 113, 4, 142, 114],
      [3, 70, 44, 11, 71, 45],
      [17, 47, 21, 4, 48, 22],
      [9, 39, 13, 16, 40, 14],

      // 20
      [3, 135, 107, 5, 136, 108],
      [3, 67, 41, 13, 68, 42],
      [15, 54, 24, 5, 55, 25],
      [15, 43, 15, 10, 44, 16],

      // 21
      [4, 144, 116, 4, 145, 117],
      [17, 68, 42],
      [17, 50, 22, 6, 51, 23],
      [19, 46, 16, 6, 47, 17],

      // 22
      [2, 139, 111, 7, 140, 112],
      [17, 74, 46],
      [7, 54, 24, 16, 55, 25],
      [34, 37, 13],

      // 23
      [4, 151, 121, 5, 152, 122],
      [4, 75, 47, 14, 76, 48],
      [11, 54, 24, 14, 55, 25],
      [16, 45, 15, 14, 46, 16],

      // 24
      [6, 147, 117, 4, 148, 118],
      [6, 73, 45, 14, 74, 46],
      [11, 54, 24, 16, 55, 25],
      [30, 46, 16, 2, 47, 17],

      // 25
      [8, 132, 106, 4, 133, 107],
      [8, 75, 47, 13, 76, 48],
      [7, 54, 24, 22, 55, 25],
      [22, 45, 15, 13, 46, 16],

      // 26
      [10, 142, 114, 2, 143, 115],
      [19, 74, 46, 4, 75, 47],
      [28, 50, 22, 6, 51, 23],
      [33, 46, 16, 4, 47, 17],

      // 27
      [8, 152, 122, 4, 153, 123],
      [22, 73, 45, 3, 74, 46],
      [8, 53, 23, 26, 54, 24],
      [12, 45, 15, 28, 46, 16],

      // 28
      [3, 147, 117, 10, 148, 118],
      [3, 73, 45, 23, 74, 46],
      [4, 54, 24, 31, 55, 25],
      [11, 45, 15, 31, 46, 16],

      // 29
      [7, 146, 116, 7, 147, 117],
      [21, 73, 45, 7, 74, 46],
      [1, 53, 23, 37, 54, 24],
      [19, 45, 15, 26, 46, 16],

      // 30
      [5, 145, 115, 10, 146, 116],
      [19, 75, 47, 10, 76, 48],
      [15, 54, 24, 25, 55, 25],
      [23, 45, 15, 25, 46, 16],

      // 31
      [13, 145, 115, 3, 146, 116],
      [2, 74, 46, 29, 75, 47],
      [42, 54, 24, 1, 55, 25],
      [23, 45, 15, 28, 46, 16],

      // 32
      [17, 145, 115],
      [10, 74, 46, 23, 75, 47],
      [10, 54, 24, 35, 55, 25],
      [19, 45, 15, 35, 46, 16],

      // 33
      [17, 145, 115, 1, 146, 116],
      [14, 74, 46, 21, 75, 47],
      [29, 54, 24, 19, 55, 25],
      [11, 45, 15, 46, 46, 16],

      // 34
      [13, 145, 115, 6, 146, 116],
      [14, 74, 46, 23, 75, 47],
      [44, 54, 24, 7, 55, 25],
      [59, 46, 16, 1, 47, 17],

      // 35
      [12, 151, 121, 7, 152, 122],
      [12, 75, 47, 26, 76, 48],
      [39, 54, 24, 14, 55, 25],
      [22, 45, 15, 41, 46, 16],

      // 36
      [6, 151, 121, 14, 152, 122],
      [6, 75, 47, 34, 76, 48],
      [46, 54, 24, 10, 55, 25],
      [2, 45, 15, 64, 46, 16],

      // 37
      [17, 152, 122, 4, 153, 123],
      [29, 74, 46, 14, 75, 47],
      [49, 54, 24, 10, 55, 25],
      [24, 45, 15, 46, 46, 16],

      // 38
      [4, 152, 122, 18, 153, 123],
      [13, 74, 46, 32, 75, 47],
      [48, 54, 24, 14, 55, 25],
      [42, 45, 15, 32, 46, 16],

      // 39
      [20, 147, 117, 4, 148, 118],
      [40, 75, 47, 7, 76, 48],
      [43, 54, 24, 22, 55, 25],
      [10, 45, 15, 67, 46, 16],

      // 40
      [19, 148, 118, 6, 149, 119],
      [18, 75, 47, 31, 76, 48],
      [34, 54, 24, 34, 55, 25],
      [20, 45, 15, 61, 46, 16]
    ];

    var qrRSBlock = function(totalCount, dataCount) {
      var _this = {};
      _this.totalCount = totalCount;
      _this.dataCount = dataCount;
      return _this;
    };

    var _this = {};

    var getRsBlockTable = function(typeNumber, errorCorrectionLevel) {

      switch(errorCorrectionLevel) {
      case QRErrorCorrectionLevel.L :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
      case QRErrorCorrectionLevel.M :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
      case QRErrorCorrectionLevel.Q :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
      case QRErrorCorrectionLevel.H :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
      default :
        return undefined;
      }
    };

    _this.getRSBlocks = function(typeNumber, errorCorrectionLevel) {

      var rsBlock = getRsBlockTable(typeNumber, errorCorrectionLevel);

      if (typeof rsBlock == 'undefined') {
        throw 'bad rs block @ typeNumber:' + typeNumber +
            '/errorCorrectionLevel:' + errorCorrectionLevel;
      }

      var length = rsBlock.length / 3;

      var list = [];

      for (var i = 0; i < length; i += 1) {

        var count = rsBlock[i * 3 + 0];
        var totalCount = rsBlock[i * 3 + 1];
        var dataCount = rsBlock[i * 3 + 2];

        for (var j = 0; j < count; j += 1) {
          list.push(qrRSBlock(totalCount, dataCount) );
        }
      }

      return list;
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // qrBitBuffer
  //---------------------------------------------------------------------

  var qrBitBuffer = function() {

    var _buffer = [];
    var _length = 0;

    var _this = {};

    _this.getBuffer = function() {
      return _buffer;
    };

    _this.getAt = function(index) {
      var bufIndex = Math.floor(index / 8);
      return ( (_buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
    };

    _this.put = function(num, length) {
      for (var i = 0; i < length; i += 1) {
        _this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
      }
    };

    _this.getLengthInBits = function() {
      return _length;
    };

    _this.putBit = function(bit) {

      var bufIndex = Math.floor(_length / 8);
      if (_buffer.length <= bufIndex) {
        _buffer.push(0);
      }

      if (bit) {
        _buffer[bufIndex] |= (0x80 >>> (_length % 8) );
      }

      _length += 1;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrNumber
  //---------------------------------------------------------------------

  var qrNumber = function(data) {

    var _mode = QRMode.MODE_NUMBER;
    var _data = data;

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _data.length;
    };

    _this.write = function(buffer) {

      var data = _data;

      var i = 0;

      while (i + 2 < data.length) {
        buffer.put(strToNum(data.substring(i, i + 3) ), 10);
        i += 3;
      }

      if (i < data.length) {
        if (data.length - i == 1) {
          buffer.put(strToNum(data.substring(i, i + 1) ), 4);
        } else if (data.length - i == 2) {
          buffer.put(strToNum(data.substring(i, i + 2) ), 7);
        }
      }
    };

    var strToNum = function(s) {
      var num = 0;
      for (var i = 0; i < s.length; i += 1) {
        num = num * 10 + chatToNum(s.charAt(i) );
      }
      return num;
    };

    var chatToNum = function(c) {
      if ('0' <= c && c <= '9') {
        return c.charCodeAt(0) - '0'.charCodeAt(0);
      }
      throw 'illegal char :' + c;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrAlphaNum
  //---------------------------------------------------------------------

  var qrAlphaNum = function(data) {

    var _mode = QRMode.MODE_ALPHA_NUM;
    var _data = data;

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _data.length;
    };

    _this.write = function(buffer) {

      var s = _data;

      var i = 0;

      while (i + 1 < s.length) {
        buffer.put(
          getCode(s.charAt(i) ) * 45 +
          getCode(s.charAt(i + 1) ), 11);
        i += 2;
      }

      if (i < s.length) {
        buffer.put(getCode(s.charAt(i) ), 6);
      }
    };

    var getCode = function(c) {

      if ('0' <= c && c <= '9') {
        return c.charCodeAt(0) - '0'.charCodeAt(0);
      } else if ('A' <= c && c <= 'Z') {
        return c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
      } else {
        switch (c) {
        case ' ' : return 36;
        case '$' : return 37;
        case '%' : return 38;
        case '*' : return 39;
        case '+' : return 40;
        case '-' : return 41;
        case '.' : return 42;
        case '/' : return 43;
        case ':' : return 44;
        default :
          throw 'illegal char :' + c;
        }
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qr8BitByte
  //---------------------------------------------------------------------

  var qr8BitByte = function(data) {

    var _mode = QRMode.MODE_8BIT_BYTE;
    var _data = data;
    var _bytes = qrcode.stringToBytes(data);

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _bytes.length;
    };

    _this.write = function(buffer) {
      for (var i = 0; i < _bytes.length; i += 1) {
        buffer.put(_bytes[i], 8);
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrKanji
  //---------------------------------------------------------------------

  var qrKanji = function(data) {

    var _mode = QRMode.MODE_KANJI;
    var _data = data;

    var stringToBytes = qrcode.stringToBytesFuncs['SJIS'];
    if (!stringToBytes) {
      throw 'sjis not supported.';
    }
    !function(c, code) {
      // self test for sjis support.
      var test = stringToBytes(c);
      if (test.length != 2 || ( (test[0] << 8) | test[1]) != code) {
        throw 'sjis not supported.';
      }
    }('\u53cb', 0x9746);

    var _bytes = stringToBytes(data);

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return ~~(_bytes.length / 2);
    };

    _this.write = function(buffer) {

      var data = _bytes;

      var i = 0;

      while (i + 1 < data.length) {

        var c = ( (0xff & data[i]) << 8) | (0xff & data[i + 1]);

        if (0x8140 <= c && c <= 0x9FFC) {
          c -= 0x8140;
        } else if (0xE040 <= c && c <= 0xEBBF) {
          c -= 0xC140;
        } else {
          throw 'illegal char at ' + (i + 1) + '/' + c;
        }

        c = ( (c >>> 8) & 0xff) * 0xC0 + (c & 0xff);

        buffer.put(c, 13);

        i += 2;
      }

      if (i < data.length) {
        throw 'illegal char at ' + (i + 1);
      }
    };

    return _this;
  };

  //=====================================================================
  // GIF Support etc.
  //

  //---------------------------------------------------------------------
  // byteArrayOutputStream
  //---------------------------------------------------------------------

  var byteArrayOutputStream = function() {

    var _bytes = [];

    var _this = {};

    _this.writeByte = function(b) {
      _bytes.push(b & 0xff);
    };

    _this.writeShort = function(i) {
      _this.writeByte(i);
      _this.writeByte(i >>> 8);
    };

    _this.writeBytes = function(b, off, len) {
      off = off || 0;
      len = len || b.length;
      for (var i = 0; i < len; i += 1) {
        _this.writeByte(b[i + off]);
      }
    };

    _this.writeString = function(s) {
      for (var i = 0; i < s.length; i += 1) {
        _this.writeByte(s.charCodeAt(i) );
      }
    };

    _this.toByteArray = function() {
      return _bytes;
    };

    _this.toString = function() {
      var s = '';
      s += '[';
      for (var i = 0; i < _bytes.length; i += 1) {
        if (i > 0) {
          s += ',';
        }
        s += _bytes[i];
      }
      s += ']';
      return s;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // base64EncodeOutputStream
  //---------------------------------------------------------------------

  var base64EncodeOutputStream = function() {

    var _buffer = 0;
    var _buflen = 0;
    var _length = 0;
    var _base64 = '';

    var _this = {};

    var writeEncoded = function(b) {
      _base64 += String.fromCharCode(encode(b & 0x3f) );
    };

    var encode = function(n) {
      if (n < 0) {
        // error.
      } else if (n < 26) {
        return 0x41 + n;
      } else if (n < 52) {
        return 0x61 + (n - 26);
      } else if (n < 62) {
        return 0x30 + (n - 52);
      } else if (n == 62) {
        return 0x2b;
      } else if (n == 63) {
        return 0x2f;
      }
      throw 'n:' + n;
    };

    _this.writeByte = function(n) {

      _buffer = (_buffer << 8) | (n & 0xff);
      _buflen += 8;
      _length += 1;

      while (_buflen >= 6) {
        writeEncoded(_buffer >>> (_buflen - 6) );
        _buflen -= 6;
      }
    };

    _this.flush = function() {

      if (_buflen > 0) {
        writeEncoded(_buffer << (6 - _buflen) );
        _buffer = 0;
        _buflen = 0;
      }

      if (_length % 3 != 0) {
        // padding
        var padlen = 3 - _length % 3;
        for (var i = 0; i < padlen; i += 1) {
          _base64 += '=';
        }
      }
    };

    _this.toString = function() {
      return _base64;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // base64DecodeInputStream
  //---------------------------------------------------------------------

  var base64DecodeInputStream = function(str) {

    var _str = str;
    var _pos = 0;
    var _buffer = 0;
    var _buflen = 0;

    var _this = {};

    _this.read = function() {

      while (_buflen < 8) {

        if (_pos >= _str.length) {
          if (_buflen == 0) {
            return -1;
          }
          throw 'unexpected end of file./' + _buflen;
        }

        var c = _str.charAt(_pos);
        _pos += 1;

        if (c == '=') {
          _buflen = 0;
          return -1;
        } else if (c.match(/^\s$/) ) {
          // ignore if whitespace.
          continue;
        }

        _buffer = (_buffer << 6) | decode(c.charCodeAt(0) );
        _buflen += 6;
      }

      var n = (_buffer >>> (_buflen - 8) ) & 0xff;
      _buflen -= 8;
      return n;
    };

    var decode = function(c) {
      if (0x41 <= c && c <= 0x5a) {
        return c - 0x41;
      } else if (0x61 <= c && c <= 0x7a) {
        return c - 0x61 + 26;
      } else if (0x30 <= c && c <= 0x39) {
        return c - 0x30 + 52;
      } else if (c == 0x2b) {
        return 62;
      } else if (c == 0x2f) {
        return 63;
      } else {
        throw 'c:' + c;
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // gifImage (B/W)
  //---------------------------------------------------------------------

  var gifImage = function(width, height) {

    var _width = width;
    var _height = height;
    var _data = new Array(width * height);

    var _this = {};

    _this.setPixel = function(x, y, pixel) {
      _data[y * _width + x] = pixel;
    };

    _this.write = function(out) {

      //---------------------------------
      // GIF Signature

      out.writeString('GIF87a');

      //---------------------------------
      // Screen Descriptor

      out.writeShort(_width);
      out.writeShort(_height);

      out.writeByte(0x80); // 2bit
      out.writeByte(0);
      out.writeByte(0);

      //---------------------------------
      // Global Color Map

      // black
      out.writeByte(0x00);
      out.writeByte(0x00);
      out.writeByte(0x00);

      // white
      out.writeByte(0xff);
      out.writeByte(0xff);
      out.writeByte(0xff);

      //---------------------------------
      // Image Descriptor

      out.writeString(',');
      out.writeShort(0);
      out.writeShort(0);
      out.writeShort(_width);
      out.writeShort(_height);
      out.writeByte(0);

      //---------------------------------
      // Local Color Map

      //---------------------------------
      // Raster Data

      var lzwMinCodeSize = 2;
      var raster = getLZWRaster(lzwMinCodeSize);

      out.writeByte(lzwMinCodeSize);

      var offset = 0;

      while (raster.length - offset > 255) {
        out.writeByte(255);
        out.writeBytes(raster, offset, 255);
        offset += 255;
      }

      out.writeByte(raster.length - offset);
      out.writeBytes(raster, offset, raster.length - offset);
      out.writeByte(0x00);

      //---------------------------------
      // GIF Terminator
      out.writeString(';');
    };

    var bitOutputStream = function(out) {

      var _out = out;
      var _bitLength = 0;
      var _bitBuffer = 0;

      var _this = {};

      _this.write = function(data, length) {

        if ( (data >>> length) != 0) {
          throw 'length over';
        }

        while (_bitLength + length >= 8) {
          _out.writeByte(0xff & ( (data << _bitLength) | _bitBuffer) );
          length -= (8 - _bitLength);
          data >>>= (8 - _bitLength);
          _bitBuffer = 0;
          _bitLength = 0;
        }

        _bitBuffer = (data << _bitLength) | _bitBuffer;
        _bitLength = _bitLength + length;
      };

      _this.flush = function() {
        if (_bitLength > 0) {
          _out.writeByte(_bitBuffer);
        }
      };

      return _this;
    };

    var getLZWRaster = function(lzwMinCodeSize) {

      var clearCode = 1 << lzwMinCodeSize;
      var endCode = (1 << lzwMinCodeSize) + 1;
      var bitLength = lzwMinCodeSize + 1;

      // Setup LZWTable
      var table = lzwTable();

      for (var i = 0; i < clearCode; i += 1) {
        table.add(String.fromCharCode(i) );
      }
      table.add(String.fromCharCode(clearCode) );
      table.add(String.fromCharCode(endCode) );

      var byteOut = byteArrayOutputStream();
      var bitOut = bitOutputStream(byteOut);

      // clear code
      bitOut.write(clearCode, bitLength);

      var dataIndex = 0;

      var s = String.fromCharCode(_data[dataIndex]);
      dataIndex += 1;

      while (dataIndex < _data.length) {

        var c = String.fromCharCode(_data[dataIndex]);
        dataIndex += 1;

        if (table.contains(s + c) ) {

          s = s + c;

        } else {

          bitOut.write(table.indexOf(s), bitLength);

          if (table.size() < 0xfff) {

            if (table.size() == (1 << bitLength) ) {
              bitLength += 1;
            }

            table.add(s + c);
          }

          s = c;
        }
      }

      bitOut.write(table.indexOf(s), bitLength);

      // end code
      bitOut.write(endCode, bitLength);

      bitOut.flush();

      return byteOut.toByteArray();
    };

    var lzwTable = function() {

      var _map = {};
      var _size = 0;

      var _this = {};

      _this.add = function(key) {
        if (_this.contains(key) ) {
          throw 'dup key:' + key;
        }
        _map[key] = _size;
        _size += 1;
      };

      _this.size = function() {
        return _size;
      };

      _this.indexOf = function(key) {
        return _map[key];
      };

      _this.contains = function(key) {
        return typeof _map[key] != 'undefined';
      };

      return _this;
    };

    return _this;
  };

  var createDataURL = function(width, height, getPixel) {
    var gif = gifImage(width, height);
    for (var y = 0; y < height; y += 1) {
      for (var x = 0; x < width; x += 1) {
        gif.setPixel(x, y, getPixel(x, y) );
      }
    }

    var b = byteArrayOutputStream();
    gif.write(b);

    var base64 = base64EncodeOutputStream();
    var bytes = b.toByteArray();
    for (var i = 0; i < bytes.length; i += 1) {
      base64.writeByte(bytes[i]);
    }
    base64.flush();

    return 'data:image/gif;base64,' + base64;
  };

  //---------------------------------------------------------------------
  // returns qrcode function.

  return qrcode;
}();

// multibyte support
!function() {

  qrcode.stringToBytesFuncs['UTF-8'] = function(s) {
    // http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
    function toUTF8Array(str) {
      var utf8 = [];
      for (var i=0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
          utf8.push(0xc0 | (charcode >> 6),
              0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
          utf8.push(0xe0 | (charcode >> 12),
              0x80 | ((charcode>>6) & 0x3f),
              0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
          i++;
          // UTF-16 encodes 0x10000-0x10FFFF by
          // subtracting 0x10000 and splitting the
          // 20 bits of 0x0-0xFFFFF into two halves
          charcode = 0x10000 + (((charcode & 0x3ff)<<10)
            | (str.charCodeAt(i) & 0x3ff));
          utf8.push(0xf0 | (charcode >>18),
              0x80 | ((charcode>>12) & 0x3f),
              0x80 | ((charcode>>6) & 0x3f),
              0x80 | (charcode & 0x3f));
        }
      }
      return utf8;
    }
    return toUTF8Array(s);
  };

}();

(function (factory) {
  if (typeof define === 'function' && define.amd) {
      define([], factory);
  } else if (typeof exports === 'object') {
      module.exports = factory();
  }
}(function () {
    return qrcode;
}));

/* ===== Form TK-1 ===== */
/* The pictures come from nbh-pictos.js, the shared pictogram library kept beside the forms (one copy serves
   Forms SM-1, VS-1 and TK-1; the one-file edition carries it once and puts it in when a form opens). Without
   the file the form still works: photos, the drawn tokens and avatars, and words; the picture chooser says so. */
if(!window.NBH_PICTOS){window.NBH_PICTOS={};window.NBH_PICTO_CATS={};window.NBH_PICTO_ORDER=[];window.NBH_PICTO_LICENSE='';window.picto=function(){return '';};window.NBH_PICTOS_MISSING=true;}
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const n=parseFloat(String(v==null?'':v));return isFinite(n)?n:null;};
const KEYS=window.NBH_PICTO_ORDER||[],P=window.NBH_PICTOS||{},CATS=window.NBH_PICTO_CATS||{};

/* ---------------- the pictures drawn in this form: tokens and avatars (72 x 72, like the library) ---------------- */
const EYES='<ellipse cx="29.5" cy="33" rx="4.4" ry="5.3" fill="#fff" stroke="#333" stroke-width="1"/><ellipse cx="42.5" cy="33" rx="4.4" ry="5.3" fill="#fff" stroke="#333" stroke-width="1"/><circle cx="30.4" cy="34.2" r="2.8" fill="#222"/><circle cx="43.4" cy="34.2" r="2.8" fill="#222"/><circle cx="31.3" cy="33" r="1" fill="#fff"/><circle cx="44.3" cy="33" r="1" fill="#fff"/>';
const GRIN='<path d="M26 41.5h20c-1.6 7.5-18.4 7.5-20 0z" fill="#fff" stroke="#333" stroke-width="1.3" stroke-linejoin="round"/><path d="M28.5 44.5h15" stroke="#333" stroke-width=".9"/>';
/* the assessor's smiling star from tokens.svg (the first card's star, rendered at 512 px with its shading; tools/forms/TK-1/star-token.png) */
const STAR_PNG='data:image/png;base64,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';
const TOK={
  star:{l:'Star',img:STAR_PNG},
  star2:{l:'Star (drawn)',s:'<path d="M36 4.5l9.4 20.8 22.6 2.4-16.8 15.3 4.7 22.3L36 53.9 16.1 65.3l4.7-22.3L4 27.7l22.6-2.4z" fill="#FFD83D" stroke="#E2A400" stroke-width="2.2" stroke-linejoin="round"/><path d="M36 12.5l6.4 14.1 15.4 1.6-11.5 10.5 3.2 15.2-6.2-3.5" fill="none" stroke="#FFF1A6" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>'+EYES+GRIN},
  smiley:{l:'Smiley',s:'<circle cx="36" cy="36" r="30" fill="#FFD83D" stroke="#E2A400" stroke-width="2.2"/>'+EYES+'<path d="M23 43c4 9 22 9 26 0" fill="none" stroke="#333" stroke-width="2.6" stroke-linecap="round"/>'},
  thumb:{l:'Thumbs up',s:'<path d="M9 33h11v30H9z" fill="#F4C27F" stroke="#333" stroke-width="2" stroke-linejoin="round"/><path d="M20 35c7-5 11-13 11.5-22 .3-4 6-5 8-1.5 2 3.5 1 10-1.5 16h18c3.3 0 5.5 2.2 5.5 5s-2.2 5-5.5 5c3 0 4.5 2 4.5 4.5S58.5 46.5 55.5 46.5c3 0 4.5 2 4.5 4.5s-2 4.5-5 4.5c2.3 0 3.5 1.8 3.5 3.8S57 63 54.5 63H20z" fill="#F4C27F" stroke="#333" stroke-width="2" stroke-linejoin="round"/>'},
  check:{l:'Check',s:'<circle cx="36" cy="36" r="30" fill="#3EA850" stroke="#2A7A38" stroke-width="2.2"/><path d="M19.5 37.5l10.5 10.5 22.5-22.5" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'},
  coin:{l:'Coin',s:'<circle cx="36" cy="36" r="30" fill="#F2C230" stroke="#B8860B" stroke-width="2.2"/><circle cx="36" cy="36" r="22" fill="none" stroke="#D9A520" stroke-width="2"/><text x="36" y="47.5" font-family="Arial,Helvetica,sans-serif" font-size="32" font-weight="700" text-anchor="middle" fill="#8A5A00">$</text>'},
  heart:{l:'Heart',s:'<path d="M36 64S7 46 7 25.5C7 17 13.5 10.5 22 10.5c6 0 11 3.2 14 8.3 3-5.1 8-8.3 14-8.3 8.5 0 15 6.5 15 15C65 46 36 64 36 64z" fill="#E8463C" stroke="#B3261E" stroke-width="2.2" stroke-linejoin="round"/><path d="M17 21c2-4 6-6 10-6" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>'}
};
const FACE=(skin,hairBack,hair,shirt,extra)=>'<rect width="72" height="72" fill="#eef2f5"/>'+(hairBack||'')+'<path d="M16 72c0-12 9-19 20-19s20 7 20 19z" fill="'+shirt+'"/><path d="M30 50h12v6H30z" fill="'+skin+'"/><circle cx="36" cy="33" r="16.5" fill="'+skin+'"/>'+hair+'<circle cx="30" cy="34.5" r="2.2" fill="#222"/><circle cx="42" cy="34.5" r="2.2" fill="#222"/><path d="M30.5 41.5q5.5 4 11 0" stroke="#b05a3a" stroke-width="1.6" fill="none" stroke-linecap="round"/><ellipse cx="26.5" cy="39.5" rx="2.6" ry="1.5" fill="#f3a7a0" opacity=".7"/><ellipse cx="45.5" cy="39.5" rx="2.6" ry="1.5" fill="#f3a7a0" opacity=".7"/>'+(extra||'');
const AV={
  boy:{l:'Boy',s:FACE('#f6d2b4','','<path d="M19.5 32c0-12 7.5-19 16.5-19s16.5 7 16.5 19c-3-5.5-8.5-8.5-16.5-8.5S22.5 26.5 19.5 32z" fill="#3b2a1a"/>','#4fc3c3')},
  girl:{l:'Girl',s:FACE('#f6d2b4','<path d="M17 58V34c0-12 8.5-21 19-21s19 9 19 21v24z" fill="#5a3b1a"/>','<path d="M19.5 32c0-12 7.5-19 16.5-19s16.5 7 16.5 19c-4-4.5-9-6.5-16.5-6.5S23.5 27.5 19.5 32z" fill="#5a3b1a"/>','#f28cb1','<circle cx="52" cy="23" r="3.6" fill="#e75480"/><circle cx="57" cy="19" r="3.6" fill="#e75480"/><circle cx="54.5" cy="21.5" r="1.6" fill="#ffc0cb"/>')},
  child:{l:'Child',s:FACE('#e9c1a0','','<path d="M19.5 32c0-12 7.5-19 16.5-19s16.5 7 16.5 19c-3.5-5-9-7.5-16.5-7.5S23 27 19.5 32z" fill="#6b4a2b"/>','#8ab4f8')}
};
const own=(d,cls,extra)=>d.img?'<img class="'+(cls||'ic')+'" src="'+d.img+'" alt=""'+(extra||'')+'>':'<svg class="'+(cls||'ic')+'" viewBox="0 0 72 72" aria-hidden="true"'+(extra||'')+'>'+d.s+'</svg>';

/* ---------------- state ---------------- */
/* the colours of the assessor's Illustrator files: the band, then the Choices, Targets, Board and Tokens tabs */
const DEF={c_frame:'#698da9',c_ch:'#acd69b',c_tg:'#e3c5e8',c_bd:'#aac4dd',c_tk:'#f9e988'};
const TABS=[['ch','CHOICES','c_ch'],['tg','TARGETS','c_tg'],['bd','BOARD','c_bd'],['tk','TOKENS','c_tk']];
const WORDS=['zero','one','two','three','four','five','six','seven','eight','nine','ten'];
function cello(k,l){return{k:k||'',ph:'',l:l||''};}
/* the instruction texts: the assessor's, reviewed against the literature (v21.42; the Sources paragraph is on the Guide) */
const TXT0={
  tb:'__**FIRST-THEN**__:\nFirst-Then means that access to something your learner likes comes only after they first do something they like less. When a more preferred activity is made to depend on a less preferred one, the less preferred one becomes more likely: the Premack principle, or grandma\u2019s rule. It works when the preferred activity is available only through the board, so keep the THEN item put away at other times. A picture of the skill you are teaching your learner goes on the front of this page under the word **FIRST**. The picture of the activity your learner will earn goes under the word **THEN**.\n\n__**Tokens**__:\nThis page is also where your learner places each {token} as it is earned. Give the {token} right after the behavior, with brief praise, and let the learner put it in the next box. There are {n} boxes, so when the {n}th {token} is earned, your learner gets the THEN item at once. Keep the exchange immediate when the board is new; a longer wait can be built in later.\n\n__**Not So FAST**__: Before starting, decide how much of the behavior earns one {token}: how many responses, or how long. For example, three problems answered, or two minutes of staying seated. This is the schedule of reinforcement, and it must not ask too much. When a skill is brand new, give a {token} after every correct response or every short stretch of the behavior. As the skill becomes reliable, raise the requirement a little at a time; if the behavior falls apart after a step up, you raised it too fast: go back one step.',
  cb:'A **Picture Choice Board** shows your learner pictures of items and activities before a task begins, so they can choose what they are working for. Learners often prefer to choose, and choosing has lowered problem behavior during tasks, but choice does not make a weak item strong: every picture should be something your learner values.\n\n**Prerequisite Skills:** Your learner needs to be able to scan an array of pictures and select the picture of an item or activity they want.\n\n__**Steps:**__\n1. Show the learner the choice board and let them select an item to work for.\n***If necessary, spend some time pairing the picture of the item with the actual object.***\n2. As necessary, use prompting to assist the learner with the selection.\n3. Once the learner selects a picture, turn to the next page and place the picture in the green box under the word \u201cThen.\u201d\n\n**Note:** The six pictures should come from a preference assessment and change as preferences change; an item the learner can get freely, or has just had plenty of, loses value. Once your learner makes good progress, make sure the skill holds up without choosing a picture first. Check that the chosen item works as reinforcement: the skill it follows should be happening more. If it is not, the item is not a reinforcer for that behavior, whatever the learner picked.',
  te:'A **Token Economy** is a program in which tokens are earned for specific behaviors and later exchanged for things the learner wants. Token economies are powerful because they work across settings and because one token can be exchanged for many different back-up reinforcers, which keeps the tokens valuable when any one item has lost its appeal. Tokens also bridge the gap between the moment the behavior happens and the moment the real reinforcer is delivered, which helps teach waiting. A token used this way is a *generalized conditioned reinforcer*.\n\n## Before You Start\nA token is only a piece of paper until it has been exchanged for things the learner values. Think about this: would you rather receive a blank piece of paper or a 100 dollar bill? Most people say the bill, because they have a history of exchanging bills for valuable things. The bill\u2019s value was learned, or conditioned. Our goal is the same for these tokens. If the tokens are not yet valuable to the student, do the steps below before starting the token economy, and keep going until the student reaches for the token.\n\n**1. Sampling (pairing):** Give the {token}, then exchange it right away for the back-up reinforcer. Repeat several times.\n**2. Coaching:** Prompt the student to do the target response, give the {token}, and exchange it right away.\n**3. Conditioning:** Give the {token} immediately after the target response, exchange it right away, then begin to require more tokens before each exchange. The test that it has worked: the behavior that earns tokens goes up.',
  tt:'**Teaching Targets:** This page is for selecting which behaviors you target: a replacement behavior from the behavior plan, or a new skill. **This page is where you choose what to teach your learner!** A replacement behavior should do the same job for the learner as the problem behavior did (the function found in the assessment), and it should be easier for the learner than the problem behavior. Work on one target on the board at a time, and agree on what counts, so every adult gives the {token} for the same thing.\n\n**Prerequisite Skills:** Make sure the learner has the skills a new skill depends on before teaching it. For example, make sure the learner can attend to an instructor for a short, set time before teaching academic skills that require attending for longer and then answering questions. Another example: before teaching a learner to raise a hand, select a picture, or make a gesture for attention, make sure the learner can make the movement.\n\n__**Steps:**__\n1. Select the skill you would like to teach your learner from the choices on the front of this page. If the skill you are working on is not there, write its name on the blank picture.\n2. Now place the picture of the skill in the gray box on the next page under the word \u201cFirst.\u201d',
  h1:'STEP 1 : YOUR LEARNER PICKS SOMETHING TO EARN\nA **Picture Choice Board** shows your learner pictures of items and activities before a task begins, so they can choose what they are working for. Learners often prefer to choose, and choosing has lowered problem behavior during tasks, but choice does not make a weak item strong: every picture should be something your learner values.\n\n**Prerequisite Skills:** Your learner needs to be able to scan an array of pictures and select the picture of an item or activity they want.\n\n__**Steps:**__\n1. Show the learner the choice board and let them select an item to work for.\n***If necessary, spend some time pairing the picture of the item with the actual object.***\n2. As necessary, use prompting to assist the learner with the selection.\n3. Once the learner selects a picture, turn to the next page and place the picture in the green box under the word \u201cThen.\u201d\n\n**Note:** There are plenty of extra picture choices in the \u201cextras book\u201d, and if you don\u2019t see an image choice that your learner wants, use the __OTHER__ image to write in the name of the item/activity. The six pictures should come from a preference assessment and change as preferences change; an item the learner can get freely, or has just had plenty of, loses value. Once your learner makes good progress, make sure the skill holds up without choosing a picture first. Check that the chosen item works as reinforcement: the skill it follows should be happening more. If it is not, the item is not a reinforcer for that behavior, whatever the learner picked.',
  h2:'STEP 2 : YOU SELECT WHAT TO TEACH YOUR LEARNER\n**Teaching Targets:** This page is for selecting which behaviors you target: a replacement behavior from the behavior plan, or a new skill. **This page is where you choose what to teach your learner!** A replacement behavior should do the same job for the learner as the problem behavior did (the function found in the assessment), and it should be easier for the learner than the problem behavior. Work on one target on the board at a time, and agree on what counts, so every adult gives the {token} for the same thing.\n\n**Prerequisite Skills:** Make sure the learner has the skills a new skill depends on before teaching it. For example, make sure the learner can attend to an instructor for a short, set time before teaching academic skills that require attending for longer and then answering questions. Another example: before teaching a learner to raise a hand, select a picture, or make a gesture for attention, make sure the learner can make the movement.\n\n__**Steps:**__\n1. Select the skill you would like to teach your learner from the choices on the front of this page. If the skill you are working on is not there, write its name on the blank picture.\n2. Now place the picture of the skill in the gray box on the next page under the word \u201cFirst.\u201d',
  h3:'STEP 3 : DELIVER TOKEN ({TOKENS}), REINFORCE BEHAVIOR\nPlace the picture of the skill you are teaching your learner under the word **FIRST**. The picture of the activity your learner will earn goes under the word **THEN**.\n\n__**Tokens**__:\nThis page is also where your learner places each {token} as it is earned. Give the {token} right after the behavior, with brief praise, and let the learner put it in the next box. There are {n} boxes, so when the {n}th {token} is earned, your learner gets the THEN item at once. Keep the exchange immediate when the board is new; a longer wait can be built in later.\n\n__**Not So FAST**__: Before starting, decide how much of the behavior earns one {token}: how many responses, or how long. For example, three problems answered, or two minutes of staying seated. This is the schedule of reinforcement, and it must not ask too much. When a skill is brand new, give a {token} after every correct response or every short stretch of the behavior. As the skill becomes reliable, raise the requirement a little at a time; if the behavior falls apart after a step up, you raised it too fast: go back one step.'
};
const CREDIT0='To find more resources and information visit\nwww.Behavior-Charts.com';
function blank(){return{meta:Object.assign({poss:'s',layout:'ft',avatar:'av:boy',n:'5',wm:'20',order:'all',sp_card:'ch:0',sp_size:'large',panel:'light',pagesize:'8.82',credit:CREDIT0},DEF),chk:{pg_ch:true,pg_tg:true,pg_bd:true,pg_tk:true,pg_how:false,cs_ch:true,cs_tg:true,cs_tk:true,qrframe:true},photos:[],photo:[cello()],tok:[cello('tk:star')],bg:[cello(),cello()],sp:[cello()],ch:Array.from({length:6},()=>cello()),tg:Array.from({length:6},()=>cello()),ft:[cello(),cello()],caps:[],txt:Object.assign({},TXT0)};}
let S=blank();
const nTok=()=>Math.max(3,Math.min(10,Math.round(num(S.meta.n)||5)));
function ensure(){
  if(!S.meta||typeof S.meta!=='object')S.meta={};if(!S.chk||typeof S.chk!=='object')S.chk={};if(!Array.isArray(S.photos))S.photos=[];
  const six=k=>{if(!Array.isArray(S[k]))S[k]=[];while(S[k].length<6)S[k].push(cello());S[k].length=6;};six('ch');six('tg');
  const fix=(k,n,def)=>{if(!Array.isArray(S[k])||S[k].length!==n)S[k]=def();};fix('ft',2,()=>[cello(),cello()]);fix('tok',1,()=>[cello('tk:star')]);fix('photo',1,()=>[cello()]);fix('bg',2,()=>[cello(),cello()]);fix('sp',1,()=>[cello()]);
  if(!S.txt||typeof S.txt!=='object')S.txt={};Object.keys(TXT0).forEach(k=>{if(typeof S.txt[k]!=='string')S.txt[k]=TXT0[k];});
  Object.keys(DEF).forEach(k=>{if(!/^#[0-9a-f]{6}$/i.test(S.meta[k]||''))S.meta[k]=DEF[k];});
  if(!Array.isArray(S.caps))S.caps=[];const n=nTok();if(S.caps.length!==n)S.caps=defCaps(n,tokName());
}
/* ---------------- tokens and captions ---------------- */
function defTokName(){const o=S.tok[0];if(o.k&&o.k.startsWith('tk:')&&TOK[o.k.slice(3)])return TOK[o.k.slice(3)].l;if(o.k&&P[o.k])return P[o.k].l;if(o.ph){const p=photo(o.ph);if(p&&p.label)return p.label;}return 'Token';}
function tokName(){return String(S.meta.tokname||'').trim()||defTokName();}
function plural(w){return /\s/.test(w)||/s$/i.test(w)?w:w+'s';}
function defCaps(n,name){const out=[];for(let i=0;i<n;i++)out.push({a:i===0?'Hurry and Get':(i%2?'Great Job':'Way To Go'),b:i===0?'Your First '+name+'!':i===1?'Keep Going!':'Just '+(n-i)+' More!'});return out;}
function recaps(all){const n=nTok(),d=defCaps(n,tokName());if(all||S.caps.length!==n){S.caps=d;return;}S.caps.forEach((c,i)=>{if(/^Your First .*!$/.test(c.b))c.b=d[i].b;});}

/* ---------------- pictures ---------------- */
function photo(id){return S.photos.find(p=>p.id===id);}
function pic(o,cls,style){if(!o)return '';const ex=style?' style="'+style+'"':'';
  if(o.ph){const p=photo(o.ph);return p?'<img class="'+(cls||'')+'" src="'+p.img+'" alt=""'+ex+'>':'';}
  if(o.k&&o.k.startsWith('tk:')&&TOK[o.k.slice(3)])return own(TOK[o.k.slice(3)],cls,ex);
  if(o.k&&o.k.startsWith('av:')&&AV[o.k.slice(3)])return own(AV[o.k.slice(3)],cls,ex);
  if(o.k&&P[o.k])return picto(o.k,cls||'',ex);return '';}
const has=o=>!!(o&&(o.k||o.ph));
function lbl(o){if(!o)return '';if(o.l)return o.l;if(o.ph){const p=photo(o.ph);return p?p.label:'';}if(o.k&&o.k.startsWith('tk:')&&TOK[o.k.slice(3)])return TOK[o.k.slice(3)].l;if(o.k&&o.k.startsWith('av:')&&AV[o.k.slice(3)])return AV[o.k.slice(3)].l;return o.k&&P[o.k]?P[o.k].l:'';}
function pickCell(r,i,o){return '<div class="pick" data-r="'+r+'" data-i="'+i+'"><span class="pv">'+pic(o,'')+'</span><button type="button" data-pick="1">'+(has(o)?'Change':'Choose')+'</button></div>';}
let PICK=null;
function pickDlg(){let d=$('#pickDlg');if(d)return d;d=document.createElement('dialog');d.id='pickDlg';
  d.innerHTML='<div class="pd-head"><b>Choose a picture</b><select id="pdCat"><option value="">All</option><option value="_photos">My photos</option><option value="_own">Tokens and avatars drawn here</option>'+Object.entries(CATS).map(([k,v])=>'<option value="'+k+'">'+esc(v)+'</option>').join('')+'</select><input id="pdQ" placeholder="search" aria-label="Search pictures"><button type="button" id="pdPhoto">Upload a photo</button><button type="button" id="pdNone">No picture</button><button type="button" id="pdClose">Close</button></div><div class="pd-grid" id="pdGrid"></div><div class="pd-foot">'+esc(window.NBH_PICTO_LICENSE||'')+' Photos are resized to thumbnails and saved inside the form’s file. The tokens and avatars are drawn in this form.</div>';
  document.body.appendChild(d);
  const grid=()=>{const c=$('#pdCat').value,q=($('#pdQ').value||'').toLowerCase();let h='';
    const ownList=PICK&&PICK.first==='tok'?[['tk:',TOK],['av:',AV]]:[['av:',AV],['tk:',TOK]];
    if(!c||c==='_photos')h+=S.photos.filter(p=>!q||p.label.toLowerCase().includes(q)).map(p=>'<button type="button" data-ph="'+p.id+'"><img src="'+p.img+'" alt="">'+esc(p.label||'photo')+'<span class="pd-x" data-phdel="'+p.id+'" title="Remove this photo" role="button" style="display:block;color:#8E2A2A;font-size:10px">remove</span></button>').join('');
    if(!c||c==='_own')ownList.forEach(([pre,set])=>{h+=Object.entries(set).filter(([k,v])=>!q||v.l.toLowerCase().includes(q)).map(([k,v])=>'<button type="button" data-k="'+pre+k+'">'+own(v,'')+esc(v.l)+'</button>').join('');});
    if(c!=='_photos'&&c!=='_own')h+=KEYS.filter(k=>(!c||P[k].c===c)&&(!q||P[k].l.toLowerCase().includes(q)||k.includes(q))).map(k=>'<button type="button" data-k="'+k+'">'+picto(k,'')+esc(P[k].l)+'</button>').join('');
    $('#pdGrid').innerHTML=(window.NBH_PICTOS_MISSING?'<p class="hint">The picture library file <b>nbh-pictos.js</b> is not beside this form, so no library pictures are listed. Put it in the same folder as the form, or use a photo or one of the pictures drawn here.</p>':'')+(h||'<p class="hint">Nothing matches.</p>');};
  $('#pdCat',d).addEventListener('change',grid);$('#pdQ',d).addEventListener('input',grid);
  $('#pdGrid',d).addEventListener('click',async e=>{const x=e.target.closest('[data-phdel]');
    if(x){e.preventDefault();e.stopPropagation();if(!(await nbhUI.confirm('Remove this photo?\nAnything using it loses the picture.',{ok:'Remove',danger:true})))return;const id=x.dataset.phdel;S.photos=S.photos.filter(p=>p.id!==id);['photo','tok','bg','sp','ch','tg','ft'].forEach(k=>S[k].forEach(o=>{if(o.ph===id)o.ph='';}));grid();renderAll();return;}
    const b=e.target.closest('button[data-k],button[data-ph]');if(!b||!PICK)return;const o=PICK.arr[PICK.i];if(b.dataset.k){o.k=b.dataset.k;o.ph='';}else{o.ph=b.dataset.ph;o.k='';}d.close();PICK.done();});
  $('#pdNone',d).addEventListener('click',()=>{if(PICK){PICK.arr[PICK.i].k='';PICK.arr[PICK.i].ph='';d.close();PICK.done();}});
  $('#pdClose',d).addEventListener('click',()=>d.close());
  $('#pdPhoto',d).addEventListener('click',()=>$('#photoIn').click());
  d.grid=grid;return d;}
function openPick(arr,i,done,first){PICK={arr,i,done,first};const d=pickDlg();$('#pdQ',d).value='';$('#pdCat',d).value=first==='tok'||first==='av'?'_own':'';d.grid();if(d.showModal)d.showModal();else d.setAttribute('open','');}
/* v21.42a: pictures keep print quality. An SVG is kept as the vector it is (it prints sharp at any size); a photo or PNG is kept at up to
   1200 px on its long side, which is 300 dpi on a 4 in card and about 420 dpi on the 2.85 in boxes, as a JPEG at 0.86 (PNG when it has transparency). */
function addPhoto(file,cb){const mk=(img,label)=>({id:'p'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36),label:(label||'photo').replace(/\.[^.]+$/,'').slice(0,30),img});
  const name=file.name||'photo';
  if(/svg/i.test(file.type)||/\.svg$/i.test(name)){const r=new FileReader();r.onload=()=>{const txt=String(r.result||'');if(!/<svg[\s>]/i.test(txt))return;const p=mk('data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(txt))),name);S.photos.push(p);cb(p);};r.readAsText(file);return;}
  const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas'),s=Math.min(1,1200/Math.max(im.width,im.height));c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);const g=c.getContext('2d');g.drawImage(im,0,0,c.width,c.height);
    let alpha=false;if(/png|gif|webp/i.test(file.type)){try{const d=g.getImageData(0,0,c.width,c.height).data;for(let i=3;i<d.length;i+=Math.max(4,Math.floor(d.length/4000)*4)){if(d[i]<250){alpha=true;break;}}}catch(e){}}
    const p=mk(alpha?c.toDataURL('image/png'):c.toDataURL('image/jpeg',0.86),name);S.photos.push(p);cb(p);};im.src=r.result;};r.readAsDataURL(file);}
$('#photoIn').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(!f)return;addPhoto(f,p=>{if(PICK){PICK.arr[PICK.i].ph=p.id;PICK.arr[PICK.i].k='';const d=$('#pickDlg');if(d&&d.open)d.close();PICK.done();PICK=null;}else renderAll();});});
document.addEventListener('click',e=>{const b=e.target.closest('.pick button[data-pick]');if(!b)return;const g=b.parentNode,r=g.dataset.r,i=+g.dataset.i;openPick(S[r],i,()=>{if(r==='tok')recaps(false);renderAll();},r==='tok'?'tok':r==='photo'?'av':'');});

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});fitAll();}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

/* ---------------- the editing tables ---------------- */
function rowsTbl(k){const id=k==='ch'?'#chTbl':'#tgTbl';$(id+' tbody').innerHTML=S[k].map((o,i)=>'<tr><td class="num">'+(i+1)+'</td><td>'+pickCell(k,i,o)+'</td><td><input data-r="'+k+'" data-i="'+i+'" data-f="l" name="'+k+'.'+i+'.l" value="'+esc(o.l)+'" placeholder="'+esc(lbl({k:o.k,ph:o.ph})||'(empty box)')+'" aria-label="Label '+(i+1)+'"></td></tr>').join('');
  const sel=$(k==='ch'?'#chSpareSel':'#tgSpareSel'),v=sel.value;sel.innerHTML=S[k].map((o,i)=>'<option value="'+i+'">'+(i+1)+'. '+esc(lbl(o)||'(empty)')+'</option>').join('');if(v)sel.value=v;}
function renderTbls(){
  rowsTbl('ch');rowsTbl('tg');
  $('#capTbl tbody').innerHTML=S.caps.map((c,i)=>'<tr><td class="num">'+(i+1)+'</td><td><input data-r="caps" data-i="'+i+'" data-f="a" name="caps.'+i+'.a" value="'+esc(c.a)+'" aria-label="Caption above slot '+(i+1)+'"></td><td><input data-r="caps" data-i="'+i+'" data-f="b" name="caps.'+i+'.b" value="'+esc(c.b)+'" aria-label="Caption below slot '+(i+1)+'"></td></tr>').join('');
  const put=(id,r,i)=>{const el=$(id);if(el)el.outerHTML=pickCell(r,i,S[r][i]).replace('class="pick"','class="pick" id="'+id.slice(1)+'"');};
  put('#phPick','photo',0);put('#tokPick','tok',0);put('#bgChPick','bg',0);put('#bgTgPick','bg',1);put('#spPick','sp',0);put('#ftFirst','ft',0);put('#ftThen','ft',1);
  const sp=$('#spCard'),v=S.meta.sp_card||'ch:0';sp.innerHTML='<optgroup label="Choices">'+S.ch.map((o,i)=>'<option value="ch:'+i+'">'+(i+1)+'. '+esc(lbl(o)||'(empty)')+'</option>').join('')+'</optgroup><optgroup label="Targets">'+S.tg.map((o,i)=>'<option value="tg:'+i+'">'+(i+1)+'. '+esc(lbl(o)||'(empty)')+'</option>').join('')+'</optgroup><option value="tok">The token ('+esc(tokName())+')</option><option value="own">A card made on the spot (label and picture below)</option>';sp.value=v;if(sp.value!==v)sp.value='ch:0';
  $('#wmPct').textContent=String(Math.max(5,Math.min(25,num(S.meta.wm)||12)));
  renderSetup();
}
function renderSetup(){const m=S.meta,v=$('#setupVerdict');const nch=S.ch.filter(has).length,ntg=S.tg.filter(has).length;
  if(!m.client&&!m.first&&!nch&&!ntg){v.innerHTML='<div class="verdict v-mid"><b>Setup not started.</b> The student and the first name as it prints, the photo, the tokens; then the Choices and Targets pages.</div>';return;}
  const miss=[];if(!m.first)miss.push('the first name (the Board prints a line to write on)');if(!has(S.photo[0]))miss.push('a photo (the '+esc(lbl({k:m.avatar||'av:boy'})||'avatar').toLowerCase()+' avatar prints instead)');if(nch<6)miss.push((6-nch)+' of the six choices');if(ntg<6)miss.push((6-ntg)+' of the six targets');
  v.innerHTML='<div class="verdict '+(miss.length?'v-mid':'v-ok')+'"><b>'+(miss.length?'Still open:':'Set up.')+'</b> '+(miss.length?miss.join('; ')+'.':'')+' '+nTok()+' '+esc(plural(tokName()).toLowerCase())+' to earn; '+(m.layout==='rules'?'Rules-row':'First-Then')+' board'+(m.qr?'; QR code on every page':'; no QR code')+'.</div>';}

/* ---------------- the QR code (qrcode-generator, inlined above; type 0 = automatic, error correction M) ---------------- */
/* the QR code, made here by qrcode-generator. Plain: black modules, level M. Framed (the default, the assessor's style from the
   Choices file): slate modules, rounded slate finder rings with a green core, SCAN ME in a clear square in the middle, level H
   so the words cost nothing. The core is a deeper green than the tab (#6aa55a): a pale core is read as white by decoders. */
const QR_SLATE='#698da9',QR_CORE='#6aa55a';
function qrSvg(url,frame){url=String(url||'').trim();if(!url||typeof qrcode!=='function')return '';
  try{const ec=frame?'H':'M';const q=qrcode(0,ec);q.addData(url);q.make();const n=q.getModuleCount(),m=2,sz=n+2*m;let d='';
    const inFinder=(r,c)=>(r<7&&c<7)||(r<7&&c>=n-7)||(r>=n-7&&c<7);
    let w=Math.round(n*.3);if((n-w)%2)w++;const c0=(n-w)/2;const inMid=(r,c)=>frame&&r>=c0&&r<c0+w&&c>=c0&&c<c0+w;
    for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c)&&!(frame&&inFinder(r,c))&&!inMid(r,c))d+='M'+(c+m)+' '+(r+m)+'h1v1h-1z';
    let f='';const col=frame?QR_SLATE:'#000';
    if(frame){const fp=(x,y)=>'<rect class="fd" x="'+(x+.5)+'" y="'+(y+.5)+'" width="6" height="6" rx="1.7" fill="none" stroke="'+QR_SLATE+'" stroke-width="1"/><rect class="fd" x="'+(x+2)+'" y="'+(y+2)+'" width="3" height="3" rx=".8" fill="'+QR_CORE+'"/>';
      f=fp(m,m)+fp(m+n-7,m)+fp(m,m+n-7)+
        '<text x="'+(m+n/2)+'" y="'+(m+c0+w*.36)+'" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="'+(w*.3).toFixed(2)+'" text-anchor="middle" fill="'+QR_SLATE+'">SCAN</text>'+
        '<text x="'+(m+n/2)+'" y="'+(m+c0+w*.9)+'" font-family="Arial,Helvetica,sans-serif" font-weight="400" font-size="'+(w*.52).toFixed(2)+'" text-anchor="middle" fill="'+QR_SLATE+'">ME</text>';}
    return '<svg viewBox="0 0 '+sz+' '+sz+'" shape-rendering="crispEdges" data-modules="'+n+'" data-ec="'+ec+'" data-mid="'+(frame?c0+','+w:'')+'" role="img" aria-label="QR code"><rect width="'+sz+'" height="'+sz+'" fill="#fff"/><path class="mod" d="'+d+'" fill="'+col+'"/>'+f+'</svg>';}catch(e){return '';}}
let QRC={url:null,svg:''};
function qrBox(){const u=String(S.meta.qr||'').trim(),fr=!!S.chk.qrframe;if(!u)return '';if(QRC.url!==u||QRC.fr!==fr){QRC={url:u,fr,svg:qrSvg(u,fr)};}return QRC.svg?'<div class="qr">'+QRC.svg+'</div>':'';}

/* ---------------- the pages ----------------
   Measurements are in points of the trimmed 8.82 x 5.82 in page (the assessor's Choices file; the fronts and backs
   artboard scaled by 0.9904 to it). --s scales the page: 1 for 8.82 in, 1.2472 for the 11 in wide page and for
   "Fill the Letter page", where the page is 8.5 in tall and only the white space between the elements grows. */
const PW=635.04,PH=419.04,BW=616.22,PANW=597.64,PANH=410.72,BDH=288.31,STRIP=126.61;
function pageMode(){const m=S.meta.pagesize;return m==='11'||m==='fill'?m:'8.82';}
function scl(){return pageMode()==='8.82'?1:11*72/PW;}
const IN=v=>v.toFixed(3)+'in';
const pt=v=>(v*scl()/72).toFixed(4)+'in';
function strip(){const n=nTok(),rows=n>5?2:1;if(rows===1)return{n,rows,sz:110.53,pitch:119.9,rowPitch:0,band:STRIP,cap:11.9};
  const mode=pageMode();if(mode==='8.82')return{n,rows,sz:110.53,pitch:119.9,rowPitch:118,band:STRIP+118,cap:11.9};
  /* on a Letter-high page the two rows must fit under the panel: 87 pt slots */
  return{n,rows,sz:87,pitch:95.5,rowPitch:95.5,band:8.75+87*2+95.5-87+7.35,cap:9.4};}
/* the canvas: page height in points (the Board grows by a second token row; "fill" is the sheet's 8.5 in) */
function canvasH(kind){const mode=pageMode();if(mode==='fill')return 612/scl();return kind==='bd'?PH-STRIP+strip().band:PH;}
function pgOpen(kind,side,cls){const i=TABS.findIndex(t=>t[0]===kind),t=TABS[i];const col=S.meta[t[2]]||DEF[t[2]];const s=scl(),mode=pageMode();
  const ch=canvasH(kind),wIn=PW*s/72,hIn=ch*s/72,cx=(11-wIn)/2,cy=mode==='fill'?0:(8.5-hIn)/2;
  let trim='';if(mode!=='fill'){const x1=cx+wIn,y1=cy+hIn;[[cx-.3,cy],[x1,cy],[cx-.3,y1],[x1,y1]].forEach(([x,y])=>{trim+='<i class="trim h" style="left:'+IN(x)+';top:'+IN(y)+'"></i>';});[[cx,cy-.3],[x1,cy-.3],[cx,y1],[x1,y1]].forEach(([x,y])=>{trim+='<i class="trim v" style="left:'+IN(x)+';top:'+IN(y)+'"></i>';});}
  const letters=t[1].split('').map(ch=>'<i>'+ch+'</i>').join('');
  return '<div class="pg '+side+(side==='back'?' bk':'')+(s!==1?' big':'')+(cls?' '+cls:'')+'" data-kind="'+kind+'" data-side="'+side+'" style="--s:'+s.toFixed(4)+'">'+trim+'<div class="cv" style="left:'+IN(cx)+';top:'+IN(cy)+';height:'+IN(hIn)+'"><div class="tab" style="top:'+pt(i*104.76)+';background:'+esc(col)+'">'+letters+'</div><div class="band" style="background:'+esc(S.meta.c_frame||DEF.c_frame)+'">';}
const pgClose='</div></div></div>';
function wmHtml(o){if(!has(o))return '';const op=Math.max(5,Math.min(30,num(S.meta.wm)||20))/100;return '<div class="wm" style="opacity:'+op+'">'+pic(o,'').replace('<svg ','<svg preserveAspectRatio="xMidYMid slice" ')+'</div>';}
function cardHtml(o,size,opts){opts=opts||{};const other=opts.other,blank=opts.blank;const st=(opts.w?'width:'+IN(opts.w)+';height:'+IN(opts.h):'width:'+IN(size)+';height:'+IN(size));
  return '<div class="card'+(opts.ul?' ul':'')+(opts.cls?' '+opts.cls:'')+'" style="'+st+'"><div class="cl">'+(blank?'&nbsp;':esc(other?'Other':(lbl(o)||'')))+'</div><div class="cp">'+(other||blank?'<div class="lines"><i></i><i></i><i></i></div>':pic(o,''))+'</div></div>';}
function tokCard(size){return '<div class="card tok" style="width:'+IN(size)+';height:'+IN(size)+'"><div class="cp">'+pic(S.tok[0],'')+'</div></div>';}
function pageGrid(kind){const bg=S.bg[kind==='ch'?0:1];const pcls=S.meta.panel==='grey'?'grey':'light';
  const title=kind==='ch'?'<span class="ul">What Are You Earning?</span>':'<span class="ul">First:</span> Teaching Targets';
  const boxes=[['c1','r1'],['c2','r1'],['c3','r1'],['c1','r2'],['c2','r2'],['c3','r2']].map((c,i)=>'<div class="bx '+c[0]+' '+c[1]+'"><span class="dot"></span>'+(i===5?qrBox():'')+'</div>').join('');
  return pgOpen(kind,'front')+'<div class="panel '+pcls+'">'+wmHtml(bg)+'<div class="ttl" data-frac=".97">'+title+'</div>'+boxes+'</div>'+pgClose;}
function stripHtml(){const d=strip();const per=Math.ceil(d.n/d.rows);let h='<div class="strip" style="height:'+pt(d.band)+'">';
  for(let r=0;r<d.rows;r++){const k=Math.min(per,d.n-r*per);const left0=k===5?19.27:(PANW-(k*d.sz+(k-1)*(d.pitch-d.sz)))/2+15.38;
    h+=S.caps.slice(r*per,r*per+k).map((c,i)=>'<div class="slot'+(d.sz<100?' sm':'')+'" style="left:'+pt(left0+i*d.pitch)+';top:'+pt(9.44+r*d.rowPitch)+';width:'+pt(d.sz+2)+';height:'+pt(d.sz+2)+'"><span class="ca">'+esc(c.a)+'</span><span class="dot"></span><span class="cb">'+esc(c.b)+'</span></div>').join('');}
  return h+'</div>';}
function nameTitle(){const f=String(S.meta.first||'').trim();const ap=S.meta.poss==='bare'&&/s$/i.test(f)?'’':'’s';const st=String(S.meta.setting||'').trim();
  return (f?esc(f)+ap:'<span class="blank"></span>’s')+' '+(S.meta.layout==='rules'&&st?esc(st)+' ':'')+'Chart';}
function photoHtml(side){const o=S.photo[0];const inner=has(o)?pic(o,''):pic({k:S.meta.avatar||'av:boy'},'');return '<div class="bd-photo '+side+'">'+inner+'</div>';}
function presetBox(o,cls,ul,cx){return '<div class="bx ft '+cls+'"'+(cx!=null?' style="left:'+pt(cx-74.94)+'"':'')+'>'+(has(o)?cardHtml(o,0,{ul}):'<span class="dot"></span>')+'</div>';}
function pageBoard(){const d=strip();const panelH=pageMode()==='fill'?null:BDH;
  let inner;
  if(S.meta.layout==='rules'){const rules=S.tg.filter(has).slice(0,5);while(rules.length<2)rules.push(S.tg[rules.length]||cello());
    const k=rules.length,ph=panelH||(612/scl()-STRIP-6.8),avail=ph-100-10,earn=Math.min(146.88,avail-48),rp=Math.min(173,avail-50),cw=(PANW-14-8-(earn+2)-20-(k-1)*10)/k;
    inner=photoHtml('r')+'<div class="ttl rules" data-frac="1"><span class="ul">'+nameTitle()+'</span></div><div class="rulesrow"><div class="rr">'+rules.map(o=>'<div class="rule" style="width:'+pt(cw)+'"><div class="rl">'+esc(lbl(o))+'</div><div class="rp" style="height:'+pt(rp)+'">'+pic(o,'')+'</div></div>').join('')+'</div><div class="earn"><div class="lab">Earn</div><div class="bx ft green" style="width:'+pt(earn+3)+';height:'+pt(earn+3)+'"><span class="dot"></span></div></div></div>';}
  else inner=photoHtml('l')+photoHtml('r')+'<div class="ttl bd" data-frac=".8"><span class="ul">'+nameTitle()+'</span></div><div class="ftlab" style="left:'+pt(163.62)+'">First</div><div class="ftlab" style="left:'+pt(432.04)+'">Then</div>'+presetBox(S.ft[0],'grey',false,163.62)+presetBox(S.ft[1],'green',true,432.04);
  return pgOpen('bd','front')+'<div class="panel" style="bottom:'+pt(d.band)+'">'+inner+qrBox()+'</div>'+stripHtml()+pgClose;}
function parkRows(n){const per=n<=3?n:n<=4?2:n<=6?3:n<=8?4:5;const rows=Math.ceil(n/per);const out=[];let left=n;for(let r=0;r<rows;r++){const k=Math.min(per,Math.ceil(left/(rows-r)));out.push(k);left-=k;}return out;}
function pageTokens(){const n=nTok(),rows=parkRows(n);const sz=112.53;
  const xs=k=>{if(k===1)return[(PANW-sz)/2];const pitch=k<=3?226.1:(PANW-16-sz)/(k-1);const w=(k-1)*pitch+sz;return Array.from({length:k},(_,i)=>(PANW-w)/2+i*pitch);};
  let boxes='';rows.forEach((k,r)=>{const anchor=rows.length===1?'top:'+pt(147.5):r===0?'top:'+pt(107.22):'bottom:'+pt(38.12);xs(k).forEach(x=>{boxes+='<div class="ybx" style="left:'+pt(x)+';'+anchor+'"><span class="dot"></span></div>';});});
  const corner=S.tok[0].k==='tk:star'||has(S.tok[0])?tokCard(55*scl()/72):'';
  return pgOpen('tk','front')+'<div class="panel"><div class="tkcorner l">'+corner+'</div><div class="tkcorner r">'+corner+'</div><div class="ttl tk" data-frac=".8"><span class="ul">Tokens!!!</span></div>'+boxes+'<div class="foot">See Instructions On The Back</div>'+qrBox()+'</div>'+pgClose;}
const BACKT={ch:['cb','Choice Board'],tg:['tt','Teaching Targets'],bd:['tb','Token Board'],tk:['te','Token Economy']};
function inline(s){s=esc(s);return s.replace(/\*\*\*(.+?)\*\*\*/g,'<b><i>$1</i></b>').replace(/__(.+?)__/g,'<u>$1</u>').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\*(.+?)\*/g,'<i>$1</i>');}
function fill(t){const n=nTok(),tn=tokName();return String(t||'').replace(/\{n\}th/g,WORDS[n]==='one'?'first':WORDS[n]==='two'?'second':WORDS[n]==='three'?'third':WORDS[n]==='five'?'fifth':WORDS[n]==='eight'?'eighth':WORDS[n]==='nine'?'ninth':WORDS[n]+'th').replace(/\{n\}/g,WORDS[n]).replace(/\{TOKENS\}/g,plural(tn).toUpperCase()).replace(/\{tokens\}/g,plural(tn)).replace(/\{token\}/g,tn.toLowerCase());}
function md(t){return fill(t).replace(/\r/g,'').split(/\n\s*\n/).map(p=>{p=p.trim();if(!p)return '';let h='';if(/^##\s*/.test(p)){const i=p.indexOf('\n');h='<h4>'+inline((i<0?p:p.slice(0,i)).replace(/^##\s*/,''))+'</h4>';p=i<0?'':p.slice(i+1).trim();}return h+(p?'<p>'+inline(p).replace(/\n/g,'<br>')+'</p>':'');}).join('');}
function pageBack(kind,cont){const [key,title]=BACKT[kind];const credit=kind==='tk'&&!cont&&String(S.meta.credit||'').trim();
  return pgOpen(kind,'back',cont?'contd':'')+'<div class="tband"></div><div class="bttl">'+esc(title)+'</div><div class="bbody fit" data-min="'+(11*scl()).toFixed(2)+'"'+(credit?' style="padding-bottom:'+pt(78)+'"':'')+'>'+(cont?'<p class="cont">'+esc(title)+', continued</p>'+cont:md(S.txt[key]))+'</div>'+(credit?'<div class="credit">'+esc(credit).replace(/\n/g,' <br>')+'</div>':'')+pgClose;}
function stepHtml(key){const t=fill(S.txt[key]||'').replace(/\r/g,'');const i=t.indexOf('\n');const head=i<0?t:t.slice(0,i),body=i<0?'':t.slice(i+1);return '<div class="step">'+esc(head.trim())+'</div>'+md(body);}
function pagesHowto(){return '<div class="pg front" data-kind="how1"><div class="howto"><div class="h1">HOW TO USE</div><div class="cols"><div class="col bbody fit" style="height:6.6in">'+stepHtml('h1')+'</div><div class="col bbody fit" style="height:6.6in">'+stepHtml('h2')+'</div></div></div></div>'+
  '<div class="pg front" data-kind="how2"><div class="howto"><div class="h1">HOW TO USE</div><div class="bbody fit" style="height:6.6in;max-width:8.2in;margin:0 auto">'+stepHtml('h3')+'</div></div></div>';}
/* card sheets: a grid of cards with light grey cut lines in the gaps (the lines sit at the gap centres) */
function sheetGrid(cols,rows,w,h,gap,pageW,pageH,inner,cls){const W=cols*w+(cols-1)*gap,H=rows*h+(rows-1)*gap;
  return '<div class="cardsheet'+(cls?' '+cls:'')+'" style="left:'+IN((pageW-W)/2)+';top:'+IN(Math.max(.3,(pageH-H)/2))+';width:'+IN(W)+';height:'+IN(H)+';grid-template-columns:repeat('+cols+','+IN(w)+');grid-auto-rows:'+IN(h)+';gap:'+IN(gap)+';background-image:linear-gradient(to right,#c4c4c4 1px,transparent 1px),linear-gradient(to bottom,#c4c4c4 1px,transparent 1px);background-size:'+IN(w+gap)+' '+IN(h+gap)+';background-position:'+IN(w+gap/2)+' '+IN(h+gap/2)+'">'+inner+'</div>';}
const cardIn=()=>148.88*scl()/72, tokIn=()=>108.01*scl()/72;
function sheetCards(kind){const list=S[kind].filter(o=>has(o)||o.l);const ul=kind==='ch';const sz=cardIn();const cards=list.map(o=>cardHtml(o,sz,{ul})).concat([cardHtml(null,sz,{ul,other:true})]);const cols=Math.max(1,Math.floor((10.4+.12)/(sz+.12)));
  return '<div class="pg front'+(scl()!==1?' big':'')+'" data-kind="cards-'+kind+'" style="--s:'+scl().toFixed(4)+'">'+sheetGrid(cols,Math.ceil(cards.length/cols),sz,sz,.12,11,8.5,cards.join(''),'top')+'</div>';}
function sheetTokens(){const d=strip(),sz=tokIn();return '<div class="pg front'+(scl()!==1?' big':'')+'" data-kind="cards-tk" style="--s:'+scl().toFixed(4)+'">'+sheetGrid(5,Math.ceil(d.n/5),sz,sz,.15,11,8.5,Array.from({length:d.n},()=>tokCard(sz)).join(''),'top')+'</div>';}
function spareCard(){const v=S.meta.sp_card||'ch:0';if(v==='tok')return{tok:true};if(v==='own')return{o:{k:S.sp[0].k,ph:S.sp[0].ph,l:S.meta.sp_label||''}};const m=/^(ch|tg):(\d)$/.exec(v);return{o:m?S[m[1]][+m[2]]:S.ch[0]};}
function sheetSpare(){const big=S.meta.sp_size!=='small',cols=big?5:6,sz=big?1.5:1.25,gap=.06,rows=Math.floor((10.4+gap)/(sz+gap)),c=spareCard();
  /* an empty card (an empty slot, or a card made on the spot with no label and no picture) prints write-in lines, not a blank box */
  const empty=!c.tok&&(!c.o||(!has(c.o)&&!String(lbl(c.o)||'').trim()));
  const one=c.tok?tokCard(sz):cardHtml(c.o,sz,{ul:true,cls:'sp',blank:empty});
  return '<div class="pg port front" data-kind="spare" style="--s:1">'+sheetGrid(cols,rows,sz,sz,gap,8.5,11,Array.from({length:cols*rows},()=>one).join(''),'spare')+'</div>';}
function pageFront(kind){return kind==='ch'||kind==='tg'?pageGrid(kind):kind==='bd'?pageBoard():pageTokens();}
const PGNAME={ch:'Choices',tg:'Targets',bd:'Board',tk:'Tokens'};
function bookPages(){const c=S.chk,order=S.meta.order||'all';const kinds=TABS.map(t=>t[0]).filter(k=>c['pg_'+k]);const pages=[];
  const fronts=()=>kinds.forEach(k=>pages.push({label:PGNAME[k]+' (front)',html:pageFront(k)}));
  const duplex=()=>kinds.forEach(k=>{pages.push({label:PGNAME[k]+' (front)',html:pageFront(k)});pages.push({label:PGNAME[k]+' (back: '+BACKT[k][1]+')',html:pageBack(k)});});
  const howto=()=>{if(c.pg_how){const h=pagesHowto().split('</div></div></div>');pages.push({label:'How to use, Steps 1 and 2',html:h[0]+'</div></div></div>'});pages.push({label:'How to use, Step 3',html:h[1]+'</div></div></div>'});}};
  const cards=()=>{if(c.cs_ch)pages.push({label:'Card sheet: the choices',html:sheetCards('ch')});if(c.cs_tg)pages.push({label:'Card sheet: the targets',html:sheetCards('tg')});if(c.cs_tk)pages.push({label:'Card sheet: the tokens',html:sheetTokens()});};
  if(order==='fronts')fronts();else if(order==='duplex'){duplex();howto();}else if(order==='cards')cards();else if(order==='spare')pages.push({label:'A sheet of one card (portrait)',html:sheetSpare()});else{duplex();howto();cards();}
  return pages;}
/* a back whose text does not fit at the floor size continues on a second back page; in a duplex order a blank sheet keeps
   every back on the reverse of its front */
function paginate(root,dup){let guard=0;
  for(let pg=root.querySelector('.pg.back');pg&&guard++<40;pg=pg.nextElementSibling){
    if(!pg.classList.contains('back'))continue;const body=pg.querySelector('.bbody');if(!body)continue;
    fitOne(body);if(!tooFull(body))continue;
    /* the credit line gives way first: one small line at the foot, and the text gets the room back */
    if(pg.querySelector('.credit')&&!pg.classList.contains('compact')){pg.classList.add('compact');body.style.paddingBottom=pt(26);fitOne(body);if(!tooFull(body))continue;}
    body.dataset.fixed=body.style.fontSize||getComputedStyle(body).fontSize;
    const kids=[...body.children].filter(e=>!e.classList.contains('cont'));const moved=[];
    while(tooFull(body)&&kids.length>1){const k=kids.pop();moved.unshift(k);k.remove();}
    if(!moved.length)continue;
    const tmp=document.createElement('div');tmp.innerHTML=(dup?'<div class="pg front blank" data-kind="blank" data-label="blank sheet (keeps the next back on the reverse of its front)"></div>':'')+pageBack(pg.dataset.kind,moved.map(e=>e.outerHTML).join(''));
    const nodes=[...tmp.children];nodes[nodes.length-1].dataset.label=pg.dataset.label+', continued';let after=pg;nodes.forEach(n=>{after.insertAdjacentElement('afterend',n);after=n;});}
}
function relabel(root){root.querySelectorAll('.pglabel').forEach(e=>e.remove());const pgs=[...root.querySelectorAll('.pg')];
  pgs.forEach((p,i)=>{const l=document.createElement('p');l.className='pglabel';l.textContent='Sheet '+(i+1)+' of '+pgs.length+': '+(p.dataset.label||'');p.insertAdjacentElement('beforebegin',l);});return pgs.length;}
function renderOut(){
  const pages=bookPages(),order=S.meta.order||'all',mode=pageMode();
  $('#book').innerHTML=pages.map(p=>p.html.replace(/^<div class="pg /,'<div data-label="'+esc(p.label)+'" class="pg ')).join('');
  $('#chOut').innerHTML='<div class="book">'+pageGrid('ch')+'</div>';$('#tgOut').innerHTML='<div class="book">'+pageGrid('tg')+'</div>';$('#bdOut').innerHTML='<div class="book">'+pageBoard()+'</div>';
  $('#bkOut').innerHTML='<div class="book">'+TABS.map(t=>pageBack(t[0])).join('')+pagesHowto()+'</div>';
  const n=measured(()=>{fitAll();paginate($('#book'),/^(duplex|all)$/.test(order));paginate($('#bkOut'),false);return relabel($('#book'));});
  const size=mode==='fill'?'the full 8.5 in height':mode==='11'?'the 11 x 7.26 in page centred with trim marks':'the 8.82 x 5.82 in page centred with trim marks';
  $('#prevLine').textContent=n+' sheet'+(n===1?'':'s')+', '+(order==='fronts'?'the fronts only':order==='duplex'?'fronts and backs interleaved for a duplex printer (long-edge flip)':order==='cards'?'the card sheets only':order==='spare'?'one portrait sheet of a single card':'fronts and backs interleaved, then '+(S.chk.pg_how?'the how-to insert, then ':'')+'the card sheets')+'. Letter'+(order==='spare'?' portrait':' landscape, '+size)+'; print at 100%.';
  syncState();
}
/* the fits need the pages laid out: the sections that hold a book are shown off screen while measuring when their view is not the current one */
function measured(fn){const secs=['preview','backs','choices','targets','board'].map(v=>$('section.only-'+v)).filter(Boolean);const forced=secs.filter(s=>getComputedStyle(s).display==='none');
  forced.forEach(s=>{s.style.cssText='display:block!important;position:absolute;left:-30000px;top:0;width:12in;visibility:hidden';});
  try{return fn();}finally{forced.forEach(s=>{s.style.cssText='';});}}
/* fits measured on the laid-out page: a title to a share of the panel width, a rules-row label to two lines, a back's text
   to its panel (12.3 pt down to 11 pt, at the page's scale), a card label to its card */
/* "too full" keeps 3 % in hand: the fit runs on the zoomed screen preview, and the printed page lays the same lines out a few pixels taller */
function tooFull(el){const r=el.getBoundingClientRect();if(!r.height)return false;const k=r.height/(el.offsetHeight||1)||1,cs=getComputedStyle(el);let bottom=r.top;for(const c of el.children){const cb=c.getBoundingClientRect().bottom+(parseFloat(getComputedStyle(c).marginBottom)||0)*k;if(cb>bottom)bottom=cb;}const limit=r.bottom-((parseFloat(cs.borderBottomWidth)||0)+(parseFloat(cs.paddingBottom)||0)+Math.max(2,el.clientHeight*.03))*k;return bottom>limit;}
function fitOne(el){if(!el.clientHeight)return;if(el.dataset.fixed){el.style.fontSize=el.dataset.fixed;return;}el.style.fontSize='';const min=num(el.dataset.min)||8;let fs=parseFloat(getComputedStyle(el).fontSize)*72/96,g=0;while(tooFull(el)&&fs>min&&g++<30){fs=Math.max(min,fs-.25);el.style.fontSize=fs+'pt';}}
function fitAll(){
  $$('.fit').forEach(fitOne);
  $$('.ttl[data-frac]').forEach(el=>{if(!el.clientWidth)return;el.style.fontSize='';const cs=getComputedStyle(el);const room=(el.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight))*(num(el.dataset.frac)||.8);let fs=parseFloat(cs.fontSize),g=0;/* the text's width in the title's own layout units: the range is measured on screen, so divide out any zoom in effect (the book's preview zoom, the polish layer's fit-to-window) */const w=()=>{const r=document.createRange();r.selectNodeContents(el);const k=el.getBoundingClientRect().width/(el.offsetWidth||1)||1;return r.getBoundingClientRect().width/k;};while(w()>room&&fs>16&&g++<80){fs-=1;el.style.fontSize=fs+'px';}});
  $$('.card .cl').forEach(el=>{if(!el.clientWidth)return;el.style.fontSize='';let fs=parseFloat(getComputedStyle(el).fontSize),g=0;while(el.scrollWidth>el.clientWidth+1&&fs>8&&g++<40){fs-=1;el.style.fontSize=fs+'px';}});
  $$('.rule .rl').forEach(el=>{if(!el.clientHeight)return;el.style.fontSize='';el.style.maxHeight='2.1em';let fs=parseFloat(getComputedStyle(el).fontSize),g=0;const lo=fs*.77;while(el.scrollHeight>el.clientHeight+1&&fs>lo&&g++<20){fs-=1;el.style.fontSize=fs+'px';}if(el.scrollHeight>el.clientHeight+1)el.style.maxHeight='';});
}
window.addEventListener('beforeprint',fitAll);

/* ---------------- events ---------------- */
let tOut=0;function renderOutSoon(){clearTimeout(tOut);tOut=setTimeout(renderOut,180);}
document.addEventListener('input',e=>{const el=e.target;
  if(el.id==='tkState'){restoreState(el.value);return;}
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined&&el.type!=='checkbox'){const a=S[el.dataset.r];if(!a||!a[+el.dataset.i])return;a[+el.dataset.i][el.dataset.f]=el.value;renderOutSoon();return;}
  if(el.dataset.b!==undefined){S.txt[el.dataset.b]=el.value;renderOutSoon();return;}
  if(el.dataset.m!==undefined){const k=el.dataset.m;if(k==='n')return;S.meta[k]=el.value;if(k==='wm')$('#wmPct').textContent=el.value;if(k==='tokname'){recaps(false);renderTbls();}renderOutSoon();}});
document.addEventListener('change',e=>{const el=e.target;if(el.id==='tkState')return;
  if(el.dataset.c!==undefined){S.chk[el.dataset.c]=!!el.checked;renderOut();return;}
  if(el.dataset.m!==undefined){const k=el.dataset.m;if(k==='n'){if(S.meta.n!==el.value){S.meta.n=el.value;ensure();recaps(true);renderAll();}return;}S.meta[k]=el.value;if(k==='sp_card'||k==='layout'||k==='avatar')renderTbls();renderOut();}});
$('#capReset').addEventListener('click',()=>{recaps(true);renderAll();});
$('#colReset').addEventListener('click',()=>{Object.assign(S.meta,DEF);renderAll();});
$('#bkReset').addEventListener('click',async()=>{if(await nbhUI.confirm('Restore the default text of the four backs?\nYour edits to them are replaced.',{ok:'Restore',danger:true})){['tb','cb','te','tt'].forEach(k=>{S.txt[k]=TXT0[k];});renderAll();}});
$('#howReset').addEventListener('click',async()=>{if(await nbhUI.confirm('Restore the default how-to text?\nYour edits to the three steps are replaced.',{ok:'Restore',danger:true})){['h1','h2','h3'].forEach(k=>{S.txt[k]=TXT0[k];});renderAll();}});
$('#chClear').addEventListener('click',async()=>{if(await nbhUI.confirm('Empty the six choices?\nEvery picture and label is removed.',{ok:'Empty',danger:true})){S.ch=Array.from({length:6},()=>cello());renderAll();}});
$('#tgClear').addEventListener('click',async()=>{if(await nbhUI.confirm('Empty the six targets?\nEvery picture and label is removed.',{ok:'Empty',danger:true})){S.tg=Array.from({length:6},()=>cello());renderAll();}});
function spare(kind,sel){S.meta.sp_card=kind+':'+sel.value;S.meta.order='spare';renderAll();setView('preview');setTimeout(()=>{fitAll();window.print();},80);}
$('#chSpare').addEventListener('click',()=>spare('ch',$('#chSpareSel')));$('#tgSpare').addEventListener('click',()=>spare('tg',$('#tgSpareSel')));

/* ---------------- meta + render ---------------- */
function bindMeta(){$$('[data-m]').forEach(el=>{const k=el.dataset.m;if(S.meta[k]!==undefined&&(S.meta[k]!==''||k==='credit'))el.value=S.meta[k];else if(el.tagName==='SELECT'||el.type==='color'||el.type==='range'){S.meta[k]=el.value;}else el.value='';});
  $$('[data-c]').forEach(el=>{el.checked=!!S.chk[el.dataset.c];});$$('[data-b]').forEach(el=>{el.value=S.txt[el.dataset.b]||'';});$$('input[data-r="ft"]').forEach(el=>{el.value=S.ft[+el.dataset.i].l||'';});}
function syncState(){const t=$('#tkState');if(t)t.value=JSON.stringify(S);}
function restoreState(v){let d=null;try{d=JSON.parse(v);}catch(e){d=null;}const next=d&&fromFile({form:'TK-1',S:d});if(next){S=next;renderAll();}}
function renderAll(){ensure();bindMeta();renderTbls();renderOut();}

/* ---------------- printing ---------------- */
$('#printBtn').addEventListener('click',()=>{setView('preview');setTimeout(()=>{fitAll();window.print();},80);});
/* ---------------- save, load, csv, clear, sim ---------------- */
$('#saveBtn').addEventListener('click',()=>{const nm=(S.meta.client||'student').replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'TK-1',rev:'2026-10',saved:new Date().toISOString(),S},null,1)],{type:'application/json'}));
  const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');a.download=`TK-1_${nm}_${ymd}.json`;document.body.appendChild(a);a.click();a.remove();});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
function fromFile(d){
  if(!d||typeof d!=='object'||d.form!=='TK-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v),obj=k=>s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])?s[k]:{};
  Object.keys(obj('meta')).forEach(k=>{o.meta[k]=str(s.meta[k]).slice(0,2000);});Object.keys(obj('chk')).forEach(k=>{o.chk[k]=!!s.chk[k];});Object.keys(obj('txt')).forEach(k=>{if(k in TXT0)o.txt[k]=str(s.txt[k]).slice(0,20000);});
  const okImg=v=>/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<900000;
  o.photos=Array.isArray(s.photos)?s.photos.slice(0,60).map(p=>({id:str(p&&p.id).slice(0,20),label:str(p&&p.label).slice(0,30),img:str(p&&p.img)})).filter(p=>p.id&&okImg(p.img)):[];
  const ids=new Set(o.photos.map(p=>p.id));const okK=k=>!!(P[k]||(k.startsWith('tk:')&&TOK[k.slice(3)])||(k.startsWith('av:')&&AV[k.slice(3)]));
  const arr=(k,n)=>Array.isArray(s[k])?s[k].slice(0,n).map(x=>{const r={k:str(x&&x.k),ph:str(x&&x.ph),l:str(x&&x.l).slice(0,60)};if(!okK(r.k))r.k='';if(!ids.has(r.ph))r.ph='';return r;}):null;
  const ch=arr('ch',6);if(ch)o.ch=ch;const tg=arr('tg',6);if(tg)o.tg=tg;const ft=arr('ft',2);if(ft&&ft.length===2)o.ft=ft;const tok=arr('tok',1);if(tok&&tok.length)o.tok=tok;const ph=arr('photo',1);if(ph&&ph.length)o.photo=ph;const bg=arr('bg',2);if(bg&&bg.length===2)o.bg=bg;const sp=arr('sp',1);if(sp&&sp.length)o.sp=sp;
  o.caps=Array.isArray(s.caps)?s.caps.slice(0,10).map(c=>({a:str(c&&c.a).slice(0,40),b:str(c&&c.b).slice(0,40)})):[];
  return o;
}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='TK-1'?d.form:'';const next=other?null:fromFile(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved TK-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form TK-1. Nothing was changed.':'That file could not be read as a saved TK-1 form. Nothing was changed.');return;}
    const prev=S;S=next;try{renderAll();}catch(err){S=prev;renderAll();alert('That file could not be read as a saved TK-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});
$('#csvBtn').addEventListener('click',()=>{const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
  const out=[['Page','Position','Picture','Label']];S.ch.forEach((o,i)=>out.push(['Choices',i+1,o.ph?'photo':o.k,lbl(o)]));S.tg.forEach((o,i)=>out.push(['Targets',i+1,o.ph?'photo':o.k,lbl(o)]));S.ft.forEach((o,i)=>out.push(['Board',i?'Then':'First',o.ph?'photo':o.k,lbl(o)]));S.caps.forEach((c,i)=>out.push(['Token slot',i+1,c.a,c.b]));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='TK-1_'+(S.meta.client||'student').replace(/[^\w-]+/g,'_')+'.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();renderAll();setView('setup');}});
async function loadSim(){if(!(await nbhUI.confirm('Load a simulated book?\nEvery page is filled with a sample student. Anything already entered will be replaced.',{ok:'Load'})))return;S=blank();
  Object.assign(S.meta,{client:'SIMULATED – Sample Student',sid:'SIM-000',grade:'2',site:'Elementary, self-contained classroom',first:'Sam',poss:'s',setting:'',layout:'ft',avatar:'av:boy',n:'5',tokname:'',qr:'https://example.org/token-board/how-to-use',credit:CREDIT0,order:'all',sp_card:'ch:0',sp_size:'large'});
  S.chk.pg_how=true;S.chk.qrframe=true;
  S.ch=['ipad','puzzle','ball','bubbles','lego','drawing'].map(k=>cello(k));S.tg=['sitting','raisehand','writing','waiting','alldone','reading'].map(k=>cello(k));
  S.tg[3].l='Waiting';S.ch[0].l='Tablet';
  renderAll();setView('preview');nbhUI.toast('Simulator loaded: Sam’s book with six choices, six targets, five stars and a sample QR link.',{kind:'ok'});}
$('#simBtn').addEventListener('click',loadSim);
$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
renderAll();

/* v21.42 the case: hooks. The Targets take the case's replacement behaviors (Form TB-1) and acquisition
   objectives (Form GB-1) when all six are empty, the Choices the reinforcer menu (Form PA-1) in its rank order;
   a label that names a library picture gets the picture. The picker adds what is ticked to the empty slots. */
function matchPicto(w){const lw=String(w||'').toLowerCase().trim();if(!lw)return '';let k=KEYS.find(k=>P[k].l.toLowerCase()===lw);if(k)return k;k=KEYS.find(k=>P[k].l.length>3&&lw.includes(P[k].l.toLowerCase()));return k||'';}
function cellFor(w){w=String(w||'').trim();return{k:matchPicto(w),ph:'',l:w.slice(0,40)};}
window.__nbhFactsIn=function(f){let n=0;const empty=a=>a.every(o=>!has(o)&&!o.l);
  if(empty(S.tg)){const words=[];(f.behaviors||[]).forEach(b=>{const w=b.isRep?b.label:b.rep;if(w&&!words.includes(w))words.push(w);});((f.goals&&f.goals.acq)||[]).forEach(g=>{if(g.beh&&!words.includes(g.beh))words.push(g.beh);});words.slice(0,6).forEach((w,i)=>{S.tg[i]=cellFor(w);n++;});}
  if(empty(S.ch)&&(f.menu||[]).length){f.menu.slice().sort((a,b)=>(a.rank==null?99:a.rank)-(b.rank==null?99:b.rank)).slice(0,6).forEach((x,i)=>{S.ch[i]=cellFor(x.name);n++;});}
  if(n)renderAll();return {filled:n,note:n?undefined:'the case holds no replacement behavior, objective or reinforcer menu yet'};};
window.__nbhFactsPick=function(sel){let n=0;const put=(a,w)=>{w=String(w||'').trim();if(!w)return false;const slot=a.find(o=>!has(o)&&!o.l);if(!slot)return false;Object.assign(slot,cellFor(w));return true;};
  (sel.behaviors||[]).forEach(b=>{if(put(S.tg,b.isRep?b.label:(b.rep||b.label)))n++;});((sel.goals&&sel.goals.acq)||[]).forEach(g=>{if(put(S.tg,g.beh))n++;});((sel.goals&&sel.goals.red)||[]).forEach(g=>{if(put(S.tg,g.beh))n++;});(sel.menu||[]).forEach(m=>{if(put(S.ch,m.name))n++;});
  renderAll();return {filled:n,note:n?'':'the six slots are full; empty one first'};};

/* ===== qrcode-generator 2.0.4 (tools/vendor/qrcode-generator/qrcode.js), inlined so the QR code on the sheet is made
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

/* ===== Form SM-1 ===== */
/* The pictures come from nbh-pictos.js, the shared pictogram library kept beside the forms (one copy serves
   Form SM-1 and Form VS-1; the one-file edition carries it once and puts it in when a form opens). Without
   the file the form still works: photos and words, no library pictures, and the picture chooser says so. */
if(!window.NBH_PICTOS){window.NBH_PICTOS={};window.NBH_PICTO_CATS={};window.NBH_PICTO_ORDER=[];window.NBH_PICTO_LICENSE='';window.picto=function(){return '';};window.NBH_PICTOS_MISSING=true;}
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const n=parseFloat(String(v==null?'':v).replace('%',''));return isFinite(n)?n:null;};
const pct=v=>v==null?'—':(Math.round(v*10)/10).toFixed(0)+'%';

/* ---- v21.33: clock times are picked (type="time", stored HH:MM). Older files with typed text are converted. ---- */
function toHM24(v){const t=String(v==null?"":v).trim().toLowerCase();if(!t)return "";if(/^\d{2}:\d{2}$/.test(t))return t;
  const m=/^(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?m?\.?$/.exec(t);if(!m)return "";let h=+m[1],mi=m[2]?+m[2]:0;if(h>23||mi>59)return "";
  if(m[3]==="p"&&h<12)h+=12;else if(m[3]==="a"&&h===12)h=0;else if(!m[3]&&h>=1&&h<=6)h+=12;return String(h).padStart(2,"0")+":"+String(mi).padStart(2,"0");}
function fmtHM(v){const t=toHM24(v);if(!t)return String(v==null?'':v);let h=+t.slice(0,2);const ap=h>=12?'pm':'am';h=h%12||12;return h+':'+t.slice(3)+' '+ap;}

/* ---- v21.33: a row can be deleted anywhere. delCell() renders the x at the end of a row; rowDel() removes
   the row and re-keys whatever else refers to it by index, after a confirm when the row holds an entry. ---- */
const delCell=(r,i,what)=>'<td class="nx noprint"><button type="button" class="rowDel noprint" data-del="'+r+'" data-i="'+i+'" title="Delete this '+(what||'row')+'" aria-label="Delete '+(what||'row')+' '+(i+1)+'">&times;</button></td>';
document.addEventListener('click',e=>{const b=e.target.closest('button.rowDel[data-del]');if(!b)return;e.preventDefault();rowDel(b.dataset.del,+b.dataset.i);});

/* ---- v21.33: save a graph as a PNG (the SVG serialised and drawn on a canvas at 2x) ---- */
function graphFile(id,who){const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');return id+'_graph_'+((String(who||'').trim()||'student').replace(/\s+/g,'_').replace(/[^\w-]+/g,'').replace(/_+/g,'_')||'student')+'_'+ymd+'.png';}
function svgToPng(svg,fname){if(!svg)return;const vb=(svg.getAttribute('viewBox')||'').split(/[\s,]+/).map(Number);const W=vb[2]||svg.clientWidth||900,H=vb[3]||svg.clientHeight||320;
  const c=svg.cloneNode(true);c.setAttribute('width',W);c.setAttribute('height',H);c.removeAttribute('id');c.removeAttribute('class');c.removeAttribute('style');if(!c.getAttribute('font-family'))c.setAttribute('font-family','system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif');
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(c)],{type:'image/svg+xml;charset=utf-8'}));const im=new Image();
  im.onload=()=>{const cv=document.createElement('canvas');cv.width=W*2;cv.height=H*2;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);x.drawImage(im,0,0,cv.width,cv.height);URL.revokeObjectURL(url);
    cv.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=fname;document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),0);},'image/png');};
  im.onerror=()=>{URL.revokeObjectURL(url);alert('The graph could not be drawn as an image.');};im.src=url;}

/* ---- the pictures a sheet can carry: the shared pictogram library (window.NBH_PICTOS) or an uploaded photo ---- */
const ICON_KEYS=window.NBH_PICTO_ORDER||[];
/* (v21.62) My pictures: the practice's own pictures, taken with the camera (nbh-pictures.js beside the forms; without it the
   picker has no My pictures). A chosen one goes into the cell as a photo does, at 256 px. */
const MINE=!!window.NBHPIC;
if(MINE)NBHPIC.on(()=>{const d=$('#pickDlg');if(d&&d.open)d.grid();});
const icon=(k,cls)=>window.NBH_PICTOS&&window.NBH_PICTOS[k]?picto(k,cls||'ic'):'';
const pic=(o,cls)=>o&&o.img?'<img class="'+(cls||'ic')+'" src="'+o.img+'" alt="">':icon(o&&o.icon,cls);
const face=(happy,cls)=>'<svg class="'+(cls||'face')+'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="'+(happy?'#c9e6c6':'#f0cfcf')+'" stroke="#333" stroke-width="1.4"/><circle cx="8.5" cy="10" r="1.4" fill="#333"/><circle cx="15.5" cy="10" r="1.4" fill="#333"/><path d="'+(happy?'M7.5 14.5 q4.5 4.5 9 0':'M7.5 16.5 q4.5 -4.5 9 0')+'" fill="none" stroke="#333" stroke-width="1.6" stroke-linecap="round"/></svg>';
/* the picker dialog: one for the whole form */
let PICK=null;
function pickDlg(){let d=$('#pickDlg');if(d)return d;d=document.createElement('dialog');d.id='pickDlg';
  d.innerHTML='<div class="pd-head"><b>Choose a picture</b><select id="pdCat"><option value="">All</option>'+(MINE?'<option value="_mine">My pictures</option>':'')+Object.entries(window.NBH_PICTO_CATS||{}).map(([k,v])=>'<option value="'+k+'">'+esc(v)+'</option>').join('')+'</select><input id="pdQ" placeholder="search" aria-label="Search pictures"><button type="button" id="pdPhoto">Upload a photo</button>'+(MINE?'<button type="button" id="pdCam">Take a photo</button><button type="button" id="pdLib">My pictures\u2026</button>':'')+'<button type="button" id="pdNone">No picture</button><button type="button" id="pdClose">Close</button></div><div class="pd-grid" id="pdGrid"></div><div class="pd-foot">'+esc(window.NBH_PICTO_LICENSE||'')+' A photo is resized to a thumbnail and saved inside the form\'s file.</div>';
  document.body.appendChild(d);
  const grid=()=>{const c=$('#pdCat').value,q=($('#pdQ').value||'').toLowerCase();let h='';
    if(MINE&&(!c||c==='_mine'))h+=NBHPIC.buttons(NBHPIC.list().filter(p=>!q||(p.label||'').toLowerCase().includes(q)));
    if(c!=='_mine')h+=ICON_KEYS.filter(k=>{const p=NBH_PICTOS[k];return (!c||p.c===c)&&(!q||p.l.toLowerCase().includes(q)||k.includes(q));}).map(k=>'<button type="button" data-k="'+k+'">'+picto(k,'')+esc(NBH_PICTOS[k].l)+(NBH_PICTOS[k].o?'<span class="pd-yours">yours</span>':'')+'</button>').join('');
    $('#pdGrid').innerHTML=(window.NBH_PICTOS_MISSING?'<p class="hint">The picture library file <b>nbh-pictos.js</b> is not beside this form, so no pictures are listed. Put it in the same folder as the form, or use a photo.</p>':'')+(h||'<p class="hint">Nothing matches.</p>');};
  const useLib=pic=>{NBHPIC.toPhoto(pic,256,380000).then(p=>{if(!PICK)return;PICK.arr[PICK.i].img=p.img;PICK.arr[PICK.i].icon='';d.close();PICK.done();});};
  $('#pdCat',d).addEventListener('change',grid);$('#pdQ',d).addEventListener('input',grid);
  $('#pdGrid',d).addEventListener('click',e=>{const b=e.target.closest('button[data-k],button[data-lib]');if(!b||!PICK)return;if(b.dataset.lib){const pic=NBHPIC.get(b.dataset.lib);if(pic)useLib(pic);return;}PICK.arr[PICK.i].icon=b.dataset.k;PICK.arr[PICK.i].img='';d.close();PICK.done();});
  $('#pdNone',d).addEventListener('click',()=>{if(PICK){PICK.arr[PICK.i].icon='';PICK.arr[PICK.i].img='';d.close();PICK.done();}});
  $('#pdClose',d).addEventListener('click',()=>d.close());
  $('#pdPhoto',d).addEventListener('click',()=>$('#photoIn').click());
  if(MINE){$('#pdCam',d).addEventListener('click',()=>{NBHPIC.open({use:!!PICK}).then(pic=>{if(!pic)return;if(PICK)useLib(pic);else grid();});});
    $('#pdLib',d).addEventListener('click',()=>{NBHPIC.manage().then(grid);});}
  d.grid=grid;return d;}
function openPick(arr,i,done){PICK={arr,i,done};const d=pickDlg();$('#pdQ',d).value='';d.grid();if(MINE)NBHPIC.all();if(d.showModal)d.showModal();else d.setAttribute('open','');}
$('#photoIn').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(!f||!PICK)return;const r=new FileReader();
  r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas'),s=Math.min(1,256/Math.max(im.width,im.height));c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      PICK.arr[PICK.i].img=c.toDataURL('image/jpeg',0.82);PICK.arr[PICK.i].icon='';const d=$('#pickDlg');if(d&&d.open)d.close();PICK.done();};im.src=r.result;};r.readAsDataURL(f);});
function pickCell(r,i,o){return '<div class="pick" data-r="'+r+'" data-i="'+i+'"><span class="pv">'+(pic(o,'')||'')+'</span><button type="button" data-pick="1">'+(o.img||o.icon?'Change':'Choose')+'</button></div>';}

/* ---- defaults the sheets ship with ---- */
const LEVELS=[
  {pts:'1',desc:'10 or more prompts; not on time for class: gone for more than 10 minutes'},
  {pts:'2',desc:'No more than 8 prompts; not on time for class: gone for more than 8 minutes'},
  {pts:'3',desc:'No more than 6 prompts; not on time for class: gone for more than 6 minutes'},
  {pts:'4',desc:'No more than 4 prompts to finish the task; not on time for class: gone more than 4 minutes'},
  {pts:'5',desc:'No prompts or redirects to finish the task; on time for class'}
];
const LADDER=[
  {ph:'0',what:'Teacher rates only. The student sees the sheet and the rating at the end of each period; no points depend on it yet.',when:'3 to 5 school days; the record sets the first goal from the mean.'},
  {ph:'1',what:'The student rates every period; the teacher rates every period independently; points follow the match table. Honest Nos are praised.',when:'Agreement at or above 80% and the goal met on 4 of the last 5 days.'},
  {ph:'2',what:'The teacher matches half the periods, chosen beforehand by coin or dice; the student does not know which until the comparison. Unmatched periods earn the student&rsquo;s rating.',when:'Agreement at or above 90% on the matched periods for two weeks.'},
  {ph:'3',what:'One matched period a day, drawn at random; the rest earn the student&rsquo;s rating.',when:'Agreement at or above 90% for two weeks.'},
  {ph:'4',what:'The student rates alone; one surprise match a week. The reward follows the student&rsquo;s own total.',when:'Goal at its ceiling for four weeks.'},
  {ph:'5',what:'The sheet is retired; a verbal self-report at the end of the day and the plan&rsquo;s own data (Form PR-1).',when:'Exit on the plan&rsquo;s criteria.'}
];
const FADE=[
  {what:'Every period rated, reward the same day.',when:'Agreement at or above 80% and the goal met on 4 of 5 days for two weeks (phase 2 of the ladder or beyond).'},
  {what:'Only the hardest half of the periods rated; the rest are assumed met unless the teacher notes otherwise.',when:'Goal met on 4 of 5 days for two weeks with no rise in the unrated periods&rsquo; behavior on the plan&rsquo;s data.'},
  {what:'One rating at the end of each half day.',when:'Two weeks at criterion.'},
  {what:'One end-of-day self-rating; the reward moves to a weekly total with a small daily acknowledgment.',when:'Three weeks at criterion with agreement held on the surprise checks.'},
  {what:'A verbal self-report at the end of the day, no sheet; the plan&rsquo;s own data continue.',when:'Four weeks at criterion.'},
  {what:'Retired. The behavior is monitored on Form PR-1 and a sheet returns only if the data call for it.',when:'Exit on the plan&rsquo;s criteria.'}
];
const BCRULES=[
  'The reward is immediate: it follows the task as soon as the task is done, the same day where possible.',
  'The first contract asks for a small step, something the student has already done at least sometimes.',
  'The reward comes often and in small amounts rather than rarely and in large ones.',
  'The contract rewards accomplishment, what the student did, not obedience or attitude.',
  'The reward follows the performance, never comes first.',
  'The contract is fair: the size of the task matches the size of the reward.',
  'The terms are clear: anyone reading it would know exactly what counts and what is earned.',
  'The contract is honest: what it promises is delivered, every time it is earned.',
  'The contract is positive: it says what the student will do and earn, not what will happen if they do not.',
  'The contract is used systematically: the record is kept and the terms are followed as written.'
];
const FID=[
  'The sheet is on the desk at the start with the day&rsquo;s reward chosen and written on it.',
  'The student rates within a minute of the end of each period, with one prompt at most.',
  'The teacher rates independently, before seeing the student&rsquo;s rating or without looking at it.',
  'Ratings are compared out loud, match points written, and an honest No praised as warmly as a Yes.',
  'Disagreements are not argued; the teacher&rsquo;s rating stands, with one sentence on what was seen.',
  'Points are totalled and the goal checked at the time written on the Reinforcement sheet.',
  'The reward is delivered the same day when earned; nothing is removed when it is not.',
  'The day is entered on the Record (points, possible, matches) and the sheet is filed.',
  'The home note goes home and comes back signed (if used).'
];
const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday'];

/* ---------------- state ---------------- */
function blank(){return{meta:{},chk:{},sys:'',tg:[],per:[],lv:LEVELS.map(l=>({pts:l.pts,desc:l.desc})),lad:LADDER.map(()=>({on:false,note:''})),fade:FADE.map(()=>({on:false,note:''})),fid:FID.map(()=>({in:'',note:''})),bck:BCRULES.map(()=>({in:'',note:''})),log:[],wk:{},d:{},store:[],per2:[]};}
let S=blank();
function ensure(){
  if(!Array.isArray(S.tg))S.tg=[];if(!Array.isArray(S.per))S.per=[];if(!Array.isArray(S.log))S.log=[];
  if(!Array.isArray(S.lv)||S.lv.length!==5)S.lv=LEVELS.map(l=>({pts:l.pts,desc:l.desc}));
  if(!Array.isArray(S.lad)||S.lad.length!==LADDER.length)S.lad=LADDER.map(()=>({on:false,note:''}));
  if(!Array.isArray(S.fid)||S.fid.length!==FID.length)S.fid=FID.map(()=>({in:'',note:''}));
  if(!Array.isArray(S.fade)||S.fade.length!==FADE.length)S.fade=FADE.map(()=>({on:false,note:''}));
  if(!Array.isArray(S.bck)||S.bck.length!==BCRULES.length)S.bck=BCRULES.map(()=>({in:'',note:''}));
  if(!S.wk||typeof S.wk!=='object')S.wk={};
  while(S.tg.length<2)S.tg.push({word:'',def:'',cue:'',ex:'',nex:'',icon:'',img:'',goal:''});
  while(S.per.length<4)S.per.push({t:'',label:'',icon:'',img:''});
  S.per.forEach(p=>{const h=toHM24(p.t);if(h)p.t=h;});
  if(typeof smEnsure==='function')smEnsure();   /* v21.45 the design, the store, the second schedule (sm-v2-ui.js) */
}

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
function setSys(v){S.sys=v;document.body.className=document.body.className.replace(/\bsys-\S+/g,'').trim()+(v?' sys-'+v:'');
  $$('#sysOpt label').forEach(l=>{l.classList.toggle('on',l.dataset.sys===v);l.querySelector('input').checked=l.dataset.sys===v;});}
$('#sysOpt').addEventListener('change',e=>{if(e.target.name==='sys'){setSys(e.target.value);renderAll();}});

/* ---------------- rows ---------------- */
function renderT(){
  const tb=$('#tTbl tbody');tb.innerHTML=S.tg.map((r,i)=>`<tr><td class="num">${i+1}</td>
    <td><input data-r="tg" data-i="${i}" data-f="word" value="${esc(r.word)}" placeholder="I stayed in my area"></td>
    <td><input data-r="tg" data-i="${i}" data-f="def" value="${esc(r.def)}" placeholder="seated or standing within the taped area for the whole period, except with permission"></td>
    <td><input data-r="tg" data-i="${i}" data-f="cue" value="${esc(r.cue)}" placeholder="Bottom on the chair"></td>
    <td><input data-r="tg" data-i="${i}" data-f="ex" value="${esc(r.ex)}"></td>
    <td><input data-r="tg" data-i="${i}" data-f="nex" value="${esc(r.nex)}"></td>
    <td>${pickCell('tg',i,r)}<input data-r="tg" data-i="${i}" data-f="goal" value="${esc(r.goal||'')}" placeholder="goal % (school sheet)" style="margin-top:4px;font-size:11px"></td>${delCell('tg',i,'target')}</tr>`).join('');
}
function renderP(){
  const tb=$('#pTbl tbody');tb.innerHTML=S.per.map((r,i)=>`<tr><td class="num">${i+1}</td>
    <td><input type="time" data-r="per" data-i="${i}" data-f="t" value="${esc(toHM24(r.t)||r.t)}" aria-label="Period ${i+1} time"></td>
    <td><input data-r="per" data-i="${i}" data-f="label" value="${esc(r.label)}" placeholder="Reading"></td>
    <td>${pickCell('per',i,r)}</td>${delCell('per',i,'period')}</tr>`).join('');
}
function renderRub(){
  $('#rubTbl tbody').innerHTML=S.lv.map((l,i)=>`<tr><td class="num">${i+1}</td><td><input data-r="lv" data-i="${i}" data-f="pts" value="${esc(l.pts)}" style="text-align:center"></td><td><input data-r="lv" data-i="${i}" data-f="desc" value="${esc(l.desc)}"></td></tr>`).join('');
}
function renderLad(){
  $('#ladTbl tbody').innerHTML=LADDER.map((l,i)=>`<tr${S.lad[i].on?' style="background:#F4F8F7"':''}><td class="num">${l.ph}</td><td class="num"><input type="checkbox" data-r="lad" data-i="${i}" data-f="on"${S.lad[i].on?' checked':''} aria-label="Phase ${l.ph} in use"></td><td>${l.what}</td><td>${l.when}</td><td><input data-r="lad" data-i="${i}" data-f="note" value="${esc(S.lad[i].note)}" placeholder="started, agreement, moved on"></td></tr>`).join('');
}
function renderFade(){
  $('#fadeTbl tbody').innerHTML=FADE.map((l,i)=>`<tr${S.fade[i].on?' style="background:#F4F8F7"':''}><td class="num">${i+1}</td><td class="num"><input type="checkbox" data-r="fade" data-i="${i}" data-f="on"${S.fade[i].on?' checked':''} aria-label="Fading step ${i+1} in use"></td><td>${l.what}</td><td>${l.when}</td><td><input data-r="fade" data-i="${i}" data-f="note" value="${esc(S.fade[i].note)}" placeholder="started, data, moved on"></td></tr>`).join('');
}
function renderBck(){
  $('#bcTbl tbody').innerHTML=BCRULES.map((t,i)=>`<tr><td class="num">${i+1}</td><td>${t}</td><td><select data-r="bck" data-i="${i}" data-f="in" aria-label="Rule ${i+1} met"><option value=""></option><option${S.bck[i].in==='Yes'?' selected':''}>Yes</option><option${S.bck[i].in==='No'?' selected':''}>No</option></select></td><td><input data-r="bck" data-i="${i}" data-f="note" value="${esc(S.bck[i].note)}"></td></tr>`).join('');
  const n=S.bck.filter(x=>x.in==='Yes').length,no=S.bck.filter(x=>x.in==='No').length;
  $('#bcVerdict').innerHTML=no?'<div class="verdict v-no"><b>'+no+' rule'+(no===1?'':'s')+' not met.</b> Rewrite the contract before anyone signs it; a contract that fails a rule is usually one that pays late, asks too much, or is not kept.</div>':n===BCRULES.length?'<div class="verdict v-ok"><b>All ten rules met.</b> Ready to sign.</div>':'';
}
function renderFid(){
  $('#fidTbl tbody').innerHTML=FID.map((t,i)=>`<tr><td class="num">${i+1}</td><td>${t}</td><td><select data-r="fid" data-i="${i}" data-f="in" aria-label="Step ${i+1} in the plan"><option value=""></option><option${S.fid[i].in==='Yes'?' selected':''}>Yes</option><option${S.fid[i].in==='No'?' selected':''}>No</option><option${S.fid[i].in==='N/A'?' selected':''}>N/A</option></select></td><td><input data-r="fid" data-i="${i}" data-f="note" value="${esc(S.fid[i].note)}"></td></tr>`).join('');
}
function renderL(){
  $('#lTbl tbody').innerHTML=S.log.map((r,i)=>{const p=num(r.pts),q=num(r.poss),m=num(r.m),n=num(r.n);
    return `<tr><td class="num">${i+1}</td><td><input data-r="log" data-i="${i}" data-f="date" value="${esc(r.date)}"></td><td><input data-r="log" data-i="${i}" data-f="ph" value="${esc(r.ph)}" style="text-align:center"></td><td><input data-r="log" data-i="${i}" data-f="goal" value="${esc(r.goal)}" style="text-align:center"></td><td><input data-r="log" data-i="${i}" data-f="pts" value="${esc(r.pts)}" style="text-align:center"></td><td><input data-r="log" data-i="${i}" data-f="poss" value="${esc(r.poss)}" style="text-align:center"></td><td class="num">${p!=null&&q?pct(p/q*100):'—'}</td><td><input data-r="log" data-i="${i}" data-f="m" value="${esc(r.m)}" style="text-align:center"></td><td><input data-r="log" data-i="${i}" data-f="n" value="${esc(r.n)}" style="text-align:center"></td><td class="num">${m!=null&&n?pct(m/n*100):'—'}</td><td class="num"><input type="checkbox" data-r="log" data-i="${i}" data-f="met"${r.met?' checked':''} aria-label="Goal met on day ${i+1}"></td><td><input data-r="log" data-i="${i}" data-f="tgp" value="${esc(r.tgp||'')}" placeholder="80,67,100" style="text-align:center"></td><td><input data-r="log" data-i="${i}" data-f="note" value="${esc(r.note)}"></td>${delCell('log',i,'day')}</tr>`;}).join('');
}
function renderWk(){
  const t=$('#wkTbl');if(S.sys!=='rubric'){t.innerHTML='';return;}
  const maxp=Math.max(...S.lv.map(l=>num(l.pts)||0));
  let h='<thead><tr><th style="width:16%">Period</th>'+DAYS.map(d=>'<th>'+d+'</th>').join('')+'</tr></thead><tbody>';
  S.per.forEach((p,pi)=>{h+='<tr><td class="lk">'+esc(p.t?fmtHM(p.t):'')+' '+esc(p.label||('Period '+(pi+1)))+'</td>'+DAYS.map((d,di)=>{const k='d'+di+'_p'+pi,v=S.wk[k]||'';
    return '<td><select data-wk="'+k+'" aria-label="'+d+' period '+(pi+1)+'"><option value=""></option>'+S.lv.map((l,li)=>'<option value="'+(li+1)+'"'+(String(li+1)===String(v)?' selected':'')+'>'+(li+1)+' · '+esc(l.desc.slice(0,38))+'</option>').join('')+'</select></td>';}).join('')+'</tr>';});
  const tot=DAYS.map((d,di)=>{let pts=0,n=0;const cnt=[0,0,0,0,0];S.per.forEach((p,pi)=>{const v=num(S.wk['d'+di+'_p'+pi]);if(v){pts+=num(S.lv[v-1].pts)||0;n++;cnt[v-1]++;}});return{pts,n,cnt};});
  h+='<tr><td class="lk">Total points</td>'+tot.map(t=>'<td class="num"><b>'+t.pts+'</b> of '+(t.n*maxp)+(t.n?' ('+pct(t.pts/(t.n*maxp)*100)+')':'')+'</td>').join('')+'</tr>';
  S.lv.forEach((l,li)=>{h+='<tr><td class="lk">Level '+(li+1)+'</td>'+tot.map(t=>'<td class="num">'+(t.n?pct(t.cnt[li]/t.n*100):'—')+'</td>').join('')+'</tr>';});
  h+='<tr><td class="lk">Week total</td><td class="num" colspan="5"><b>'+tot.reduce((s,t)=>s+t.pts,0)+'</b> of '+tot.reduce((s,t)=>s+t.n*maxp,0)+'</td></tr></tbody>';
  t.innerHTML=h;
}
document.addEventListener('input',e=>{const el=e.target;
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined&&el.type!=='checkbox'){S[el.dataset.r][+el.dataset.i][el.dataset.f]=el.value;
    if(el.dataset.r==='log'){const tr=el.closest('tr');const r=S.log[+el.dataset.i],p=num(r.pts),q=num(r.poss),m=num(r.m),n=num(r.n);tr.children[6].textContent=p!=null&&q?pct(p/q*100):'—';tr.children[9].textContent=m!=null&&n?pct(m/n*100):'—';renderRecord();}
    else if(el.dataset.r==='tg'||el.dataset.r==='per'||el.dataset.r==='lv'){renderSheet();renderPoints();if(el.dataset.r==='per'||el.dataset.r==='lv')renderWkSoon();}
    return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;if(/^(il_|iv_|mp_|goal|sh_|nick|client|menu|sm_|t_rem|when|pf_|ci_|smp_)/.test(el.dataset.m)){renderPoints();renderSheet();}if(/^bc_/.test(el.dataset.m)||el.dataset.m==='client')renderBc();if(el.dataset.m==='goal'||el.dataset.m==='r_base')renderRecord();}
});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined){if(el.type==='checkbox')S[el.dataset.r][+el.dataset.i][el.dataset.f]=el.checked;else S[el.dataset.r][+el.dataset.i][el.dataset.f]=el.value;
    if(el.dataset.r==='lad'){renderLad();renderRecord();}if(el.dataset.r==='fade')renderFade();if(el.dataset.r==='bck')renderBck();if(el.dataset.r==='log')renderRecord();return;}
  if(el.dataset.c!==undefined){S.chk[el.dataset.c]=!!el.checked;renderSheet();renderPoints();renderSetup();}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;renderPoints();renderSheet();renderSetup();renderBc();}
  if(el.dataset.wk!==undefined){S.wk[el.dataset.wk]=el.value;renderWk();}
});
document.addEventListener('click',e=>{const b=e.target.closest('.pick button[data-pick]');if(!b)return;const g=b.parentNode,r=g.dataset.r,i=+g.dataset.i;openPick(S[r],i,()=>{if(r==='tg')renderT();else if(r==='per')renderP();else if(typeof smRepick==='function')smRepick(r);renderSheet();});});
let wkT=0;function renderWkSoon(){clearTimeout(wkT);wkT=setTimeout(renderWk,250);}
$('#addT').addEventListener('click',()=>{if(S.tg.length>=6)return;S.tg.push({word:'',def:'',cue:'',ex:'',nex:'',icon:'',img:'',goal:''});renderT();renderSheet();renderPoints();renderSetup();});
$('#delT').addEventListener('click',async ()=>{if(S.tg.length<=1)return;const r=S.tg[S.tg.length-1];if((r.word||r.def)&&!(await nbhUI.confirm('Remove the last target?\nIts name, definition, cues and examples are deleted.',{ok:'Remove',danger:true})))return;S.tg.pop();renderT();renderSheet();renderPoints();renderSetup();});
$('#addP').addEventListener('click',()=>{if(S.per.length>=16)return;S.per.push({t:'',label:'',icon:'',img:''});renderP();renderSheet();renderPoints();renderWk();});
$('#delP').addEventListener('click',async ()=>{if(S.per.length<=1)return;const r=S.per[S.per.length-1];if((r.t||r.label)&&!(await nbhUI.confirm('Remove the last period?\nIts time, label and icon are deleted.',{ok:'Remove',danger:true})))return;S.per.pop();renderP();renderSheet();renderPoints();renderWk();});
$('#addL').addEventListener('click',()=>{S.log.push({date:'',ph:curPhase(),goal:S.meta.goal||'',pts:'',poss:String(possible().poss||''),m:'',n:'',met:false,tgp:'',note:''});renderL();renderRecord();});
$('#delL').addEventListener('click',async ()=>{if(!S.log.length)return;const r=S.log[S.log.length-1];if((r.date||r.pts)&&!(await nbhUI.confirm('Remove the last day?\nIts date, points and note are deleted from the Record.',{ok:'Remove',danger:true})))return;S.log.pop();renderL();renderRecord();});
$('#wkAdd').addEventListener('click',()=>{const maxp=Math.max(...S.lv.map(l=>num(l.pts)||0));let added=0;
  DAYS.forEach((d,di)=>{let pts=0,n=0;S.per.forEach((p,pi)=>{const v=num(S.wk['d'+di+'_p'+pi]);if(v){pts+=num(S.lv[v-1].pts)||0;n++;}});
    if(n){const poss=n*maxp,g=num(S.meta.goal);S.log.push({date:d,ph:curPhase(),goal:S.meta.goal||'',pts:String(pts),poss:String(poss),m:'',n:'',met:g!=null?pts/poss*100>=g:false,tgp:'',note:'from the week grid'});added++;}});
  renderL();renderRecord();if(!added)alert('No period has a level yet.');});
$('#wkClear').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear the week grid?\nEvery level entered for the week is removed.',{ok:'Clear',danger:true})){S.wk={};renderWk();}});
function curPhase(){const i=S.lad.findIndex(x=>x.on);return i<0?'':LADDER[i].ph;}
/* the Record's per-target percents (tgp) are a comma list in target order and the week grid is keyed d<day>_p<period>,
   so deleting a target or a period drops its own values and re-keys the rest */
async function rowDel(r,i){const row=S[r]&&S[r][i];if(!row)return;
  if(r==='tg'){const n=S.log.filter(x=>{const a=String(x.tgp||'').split(',');return a.length>i&&String(a[i]).trim()!=='';}).length;
    if((row.word||row.def||row.cue||row.ex||row.nex||row.icon||row.img||row.goal||n)&&!(await nbhUI.confirm('Delete this target?'+(n?'\nIts per-target percent on '+n+' day'+(n===1?'':'s')+' of the Record will be dropped; later targets move up.':''),{ok:'Delete',danger:true})))return;
    S.tg.splice(i,1);S.log.forEach(x=>{if(!x.tgp)return;const a=String(x.tgp).split(',');if(a.length>i){a.splice(i,1);x.tgp=a.join(',');}});
    if(!S.tg.length)S.tg.push({word:'',def:'',cue:'',ex:'',nex:'',icon:'',img:'',goal:''});renderT();renderL();renderSheet();renderPoints();renderSetup();renderRecord();}
  else if(r==='per'){const n=Object.keys(S.wk).filter(k=>{const m=/^d\d_p(\d+)$/.exec(k);return m&&+m[1]===i&&S.wk[k];}).length;
    if((row.t||row.label||row.icon||row.img||n)&&!(await nbhUI.confirm('Delete this period?'+(n?'\nIts '+n+' level'+(n===1?'':'s')+' in the week grid will be dropped; later periods move up.':''),{ok:'Delete',danger:true})))return;
    S.per.splice(i,1);const w={};Object.keys(S.wk).forEach(k=>{const m=/^(d\d)_p(\d+)$/.exec(k);if(!m){w[k]=S.wk[k];return;}const pi=+m[2];if(pi===i)return;w[m[1]+'_p'+(pi>i?pi-1:pi)]=S.wk[k];});S.wk=w;
    if(!S.per.length)S.per.push({t:'',label:'',icon:'',img:''});renderP();renderSheet();renderPoints();renderWk();}
  else if(r==='log'){if((row.date||row.pts||row.m||row.tgp||row.note)&&!(await nbhUI.confirm('Delete this row?\nThe day it holds is deleted from the Record.',{ok:'Delete',danger:true})))return;S.log.splice(i,1);renderL();renderRecord();}
}
$('#smPngBtn').addEventListener('click',()=>svgToPng($('#logPlot'),graphFile('SM-1',S.meta.client)));
document.addEventListener('click',e=>{const b=e.target.closest('button.sm-png');if(!b)return;svgToPng(b.parentNode.querySelector('svg'),graphFile('SM-1',S.meta.client).replace('_graph_','_graph_sheet_'));});

/* ---------------- points ---------------- */
function mp(){return{yy:num(S.meta.mp_yy)??2,nn:num(S.meta.mp_nn)??1,yn:num(S.meta.mp_yn)??0,ny:num(S.meta.mp_ny)??0};}
function possible(){
  const P=S.per.length,T=S.tg.length,sys=S.sys;let poss=0,unit='points';
  if(sys==='match'){const m=mp();poss=P*T*Math.max(m.yy,m.nn,m.yn,m.ny);}
  else if(sys==='contract'||sys==='smiley')poss=P*T;
  else if(sys==='rubric')poss=P*Math.max(...S.lv.map(l=>num(l.pts)||0));
  else if(sys==='interval'){poss=num(S.meta.iv_n)||0;unit='intervals';}
  else if(sys==='interlock'){poss=1;unit='session';}
  else if(sys==='perf'){poss=num(S.meta.pf_n)||5;unit='sessions';}
  else if(sys==='cico')poss=P*T*2;
  {const v=typeof smV2Poss==='function'?smV2Poss(sys,P,T):null;if(v!=null)poss=v;}   /* v21.45 a rating style chosen on the Design page */
  const g=num(S.meta.goal);const need=g!=null&&poss?Math.ceil(poss*g/100):null;
  return{poss,need,g,unit};
}
function renderPoints(){
  const p=possible(),m=$('#ptMetrics');
  m.innerHTML=`<div class="metric"><b>Points possible per day</b><div class="val">${p.poss||'—'}</div><div class="sub">${esc(p.unit)} · ${S.per.length} period${S.per.length===1?'':'s'} × ${S.tg.length} target${S.tg.length===1?'':'s'}</div></div>
    <div class="metric"><b>Goal</b><div class="val">${p.g!=null?pct(p.g):'—'}</div><div class="sub">${p.need!=null?p.need+' of '+p.poss+' '+esc(p.unit):'enter a goal percent'}</div></div>
    <div class="metric"><b>System</b><div class="val" style="font-size:16px">${esc({match:'Self & Match',contract:'Contract',rubric:'Rubric point sheet',interval:'Cued intervals',interlock:'Interlocking session',smiley:'Expectations and earns',perf:'Performance count',cico:'Check-in / check-out'}[S.sys]||'not chosen')}</div><div class="sub">${S.chk.weekly?'weekly sheet':'one sheet per day'}${S.chk.pict?' · pictorial':''}</div></div>`;
  const gt=$('[data-m="goal_txt"]');if(gt&&!S.meta.goal_txt)gt.placeholder=p.need!=null?`If I earn ${p.need} of ${p.poss} points, I earn my reward.`:'filled from the goal';
  renderIl();
}
function ilRows(){
  const dir=S.meta.il_dir||'dec',init=num(S.meta.il_init)??20,step=num(S.meta.il_step)??2,every=Math.max(1,num(S.meta.il_every)??2),len=num(S.meta.il_len)??16,chk=Math.max(1,num(S.meta.il_chk)??1);
  const floor=num(S.meta.il_floor)??0,cap=num(S.meta.il_cap)??init;const rows=[];
  for(let t=0;t<=len;t+=chk){const k=Math.floor(t/every);let req=dir==='inc'?init+k*step:init-k*step;req=Math.max(floor,Math.min(cap,req));rows.push({t,req});}
  return rows;
}
function renderIl(){const el=$('#ilPreview');if(!el)return;if(!S.meta.il_init&&!S.meta.il_dir){el.textContent='';return;}
  const r=ilRows();el.innerHTML='<b>Requirement by minute:</b> '+r.map(x=>x.t+' min → '+x.req).join(' · ');}

/* ---------------- setup verdict ---------------- */
function renderSetup(){
  const m=S.meta,out=[];
  if(/Not yet/.test(m.r_disc||''))out.push('The student cannot yet tell the target from its absence: start at phase 0 (teacher rates only) and run the discrimination practice on the Teach sheet before any rating depends on the student.');
  if(/pictures|read aloud/.test(m.r_read||'')&&!S.chk.pict)out.push('The student needs pictures: tick <b>Pictorial sheet</b> on the System sheet so the faces and period pictures print.');
  if(m.r_pa==='No')out.push('No reinforcer assessment: run a brief MSWO (Form PA-1) before the first day, or the goal will be set against a reward that may not be one.');
  if(m.func==='Automatic')out.push('An automatically maintained behavior does not respond to a point sheet on its own; the sheet can track a replacement behavior while the plan treats the function.');
  if(S.chk.pict&&S.tg.length>4)out.push('A pictorial sheet with '+S.tg.length+' targets is dense: the original Self &amp; Match sheets carry fewer targets with larger cells. Drop to four, or print the student-size sheet and let it run to two pages.');
  if(S.sys==='cico'&&/Escape|Automatic/.test(m.func||''))out.push('Check-in / check-out works best when the behavior is maintained by adult attention (March &amp; Horner, 2002; Hawken et al., 2014); for an escape function add a break request and a demand change from the plan, or choose another system.');
  const gr=parseInt(m.grade,10);if(gr>=6&&!S.chk.pocket&&['match','contract','cico'].includes(S.sys))out.push('A middle or high school student may prefer the pocket card (System sheet): the same system on an index card with no pictures.');
  const sv=$('#sysVerdict');if(sv)sv.innerHTML=(S.chk.pict&&S.tg.length>4)?'<div class="verdict v-mid">Pictorial sheet with more than four targets: the cells will be small. Four or fewer reads best; or tick the student-size print.</div>':'';
  $('#setupVerdict').innerHTML=out.length?'<div class="verdict v-mid">'+out.map(x=>'<div>'+x+'</div>').join('')+'</div>':(m.client?'<div class="verdict v-ok"><b>Ready to design.</b> Targets next, then the system and the goal.</div>':'');
}

/* ---------------- the student's sheet ---------------- */
function sheetTitle(){if(S.meta.sh_title)return S.meta.sh_title;const n=S.meta.nick||S.meta.client||'My';const poss=n==='My'?'My':n+'’s';
  return{match:poss+' Self & Match Sheet',contract:poss+' Self-Monitoring Contract',rubric:poss+' Point Sheet',interval:poss+' On-Task Check',interlock:'Self-Monitoring with an Interlocking Schedule',smiley:poss+' Self-Monitoring',perf:poss+' Work Count',cico:poss+' Daily Progress Report'}[S.sys]||poss+' Sheet';}
function tgHead(t,i,span){const q=S.tg[i];return '<th class="q" colspan="'+(span||1)+'">'+(S.chk.pict&&!S.chk.pocket?pic(q,'ic'):'')+'<b>'+esc(q.word||('Target '+(i+1)))+'</b>'+(q.cue?'<span class="cue">• '+esc(q.cue)+'</span>':'')+'</th>';}
function perCell(p,i){return '<td class="per">'+esc(p.t?fmtHM(p.t)+' ':'')+esc(p.label||('Period '+(i+1)))+(S.chk.pict&&!S.chk.pocket?pic(p,'ic'):'')+'</td>';}
const yn=()=>smRateKey()!=='auto'?smRateCell(S.chk.pocket?14:20):S.chk.pict&&!S.chk.pocket?face(true)+face(false):'<div class="yn">YES<br>NO</div>';
/* v21.45 a rating style chosen on the Design page replaces the sheet type's own marks */
const smC=def=>smRateKey()!=='auto'?smRateCell(S.chk.pocket?14:20):def;
const circles=n=>Array.from({length:n},(_,i)=>'<span class="circ">'+(i+1)+'</span>').join('');
function sheetHead(extra){const m=S.meta,p=possible();
  const goal=m.goal_txt||(p.need!=null?'If I earn '+p.need+' of '+p.poss+' '+p.unit+', I earn my reward.':'');
  return '<div class="sm-head"><div><div class="sm-line">Name: <span class="bl">'+esc(m.client||'')+'</span> &nbsp; Date: <span class="bl" style="min-width:110px">'+esc(m.sh_date||'')+'</span></div>'+
    '<div class="sm-title">'+esc(sheetTitle())+'</div>'+(goal?'<div class="sm-line">'+esc(goal)+'</div>':'')+
    '<div class="sm-line">Reward I’m working for: <span class="bl">'+esc(m.sh_reward||'')+'</span></div></div>'+(extra||'')+(typeof smPhoto==='function'?smPhoto(S.chk.pocket?44:68,'classic'):'')+'</div>';}   /* v21.48 the photo, when the Design page shows it */
function matchKey(){const k=mp();const f=(y)=>S.chk.pict&&!S.chk.pocket?face(y,'face'):(y?'Yes':'No');
  if(S.chk.pocket)return '<div class="sm-line" style="font-size:10px">Points: both Yes '+k.yy+' · both No '+k.nn+' · mismatch '+k.yn+(k.ny!==k.yn?' / '+k.ny:'')+'</div>';
  return '<table class="key"><tr><th>If student says</th><th>If teacher says</th><th>Points</th></tr><tr><td>'+f(true)+'</td><td>'+f(true)+'</td><td>'+k.yy+'</td></tr><tr><td>'+f(false)+'</td><td>'+f(false)+'</td><td>'+k.nn+'</td></tr><tr><td>'+f(true)+'</td><td>'+f(false)+'</td><td>'+k.yn+'</td></tr>'+(k.ny!==k.yn?'<tr><td>'+f(false)+'</td><td>'+f(true)+'</td><td>'+k.ny+'</td></tr>':'')+'</table>';}
function graphStrip(){ /* a bar per day the student colors in; the goal line drawn */
  const g=num(S.meta.goal);const W=520,H=120,L=34,B=20,T=8;const X=i=>L+i*((W-L-10)/5),bw=(W-L-10)/5-10,Y=v=>T+(H-T-B)*(1-v/100);
  let s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="My week: a bar for each day">';
  [0,25,50,75,100].forEach(p=>{s+='<line x1="'+L+'" y1="'+Y(p)+'" x2="'+(W-10)+'" y2="'+Y(p)+'" stroke="#bbb" stroke-width="1"/><text x="'+(L-4)+'" y="'+(Y(p)+4)+'" font-size="10" text-anchor="end" fill="#333" font-family="system-ui,sans-serif">'+p+'%</text>';});
  DAYS.forEach((d,i)=>{s+='<rect x="'+(X(i)+5)+'" y="'+T+'" width="'+bw+'" height="'+(H-T-B)+'" fill="#fff" stroke="#111" stroke-width="1.5"/><text x="'+(X(i)+5+bw/2)+'" y="'+(H-6)+'" font-size="11" text-anchor="middle" fill="#111" font-family="system-ui,sans-serif">'+d.slice(0,3)+'</text>';});
  if(g!=null)s+='<line x1="'+L+'" y1="'+Y(g)+'" x2="'+(W-10)+'" y2="'+Y(g)+'" stroke="#9b4e15" stroke-width="2.5" stroke-dasharray="6 4"/><text x="'+(W-12)+'" y="'+(Y(g)-4)+'" font-size="10" text-anchor="end" fill="#9b4e15" font-family="system-ui,sans-serif">my goal '+g+'%</text>';
  return '<div class="graph"><b>My week: color the bar up to my percent</b>'+s+'</svg><button type="button" class="tool noprint sm-png">Save graph as image</button></div>';}
function evalBox(){return '<div class="evalbox"><b>My goal today:</b> <span class="bl" style="min-width:240px">'+esc(S.meta.smp_goal||'')+'</span> &nbsp; <b>I met it:</b> &nbsp;YES &nbsp;/&nbsp; NO<br><b>What helped me:</b> <span class="bl" style="min-width:60%"></span><br><b>Next time I will:</b> <span class="bl" style="min-width:60%"></span></div>';}
function tearOff(){const m=S.meta;return '<div class="tear"><span class="cut">✂ tear here, send home, bring back signed</span><br><b>Home note</b> &nbsp; '+esc(m.client||'')+' &nbsp; Date: <span class="bl" style="min-width:90px"></span><br>Today I earned <span class="bl" style="min-width:50px"></span> of <span class="bl" style="min-width:50px"></span> '+esc(possible().unit)+'. I <b>did</b> / <b>did not</b> meet my goal. My reward was: <span class="bl" style="min-width:160px"></span><br>Teacher: <span class="bl" style="min-width:140px"></span> &nbsp; Parent signature: <span class="bl" style="min-width:160px"></span> &nbsp; One good thing from today: <span class="bl" style="min-width:220px"></span></div>';}
function sheetFoot(opts){const m=S.meta,p=possible();const g=p.g!=null?'GOAL: '+pct(p.g):'';opts=opts||{};
  return '<div class="sm-foot"><div><b>I earned <span class="bl" style="min-width:60px"></span> '+esc(opts.unit||'points')+'. I <i>DID</i> or <i>DID NOT</i> earn my reward.</b>'+
    (m.when?'<div class="sm-line" style="font-size:11px">Reward time: '+esc(m.when)+'</div>':'')+
    '<div class="sm-line">Teacher initials: <span class="bl" style="min-width:80px"></span> Student initials: <span class="bl" style="min-width:80px"></span></div></div>'+
    '<div class="src">'+esc(g)+(opts.src?'<br>'+opts.src:'')+'<br>Form SM-1</div></div>'+((S.chk.eval||S.chk.graph)&&!S.chk.pocket?'<div class="extras">'+(S.chk.eval?evalBox():'')+(S.chk.graph?graphStrip():'')+'</div>':'')+(S.chk.home&&!S.chk.pocket?tearOff():'');}
function rrKey(){return /one reminder/.test(S.meta.t_rem||'')&&!S.chk.pocket?'<div class="legend"><b>R R</b> in the teacher&rsquo;s box: one tally per reminder given; a Yes allows one reminder.</div>':'';}
function renderSheet(){
  const out=$('#sheetOut');out.className=(S.chk.big?'sm-big ':'')+(S.chk.pocket&&['match','contract','cico'].includes(S.sys)?'sm-pocket':'');
  if(!S.sys){out.innerHTML='<p class="hint">Choose a system on the System sheet; the student’s sheet appears here.</p>';return;}
  const T=S.tg,P=S.per,rem=/one reminder/.test(S.meta.t_rem||'');
  let h='';const warn=S.chk.pict&&!S.chk.pocket&&T.length>4?'<div class="warn">Pictorial sheet with '+T.length+' targets: four or fewer reads better for a young student.</div>':'';
  if(S.sys==='match'){
    h=sheetHead(matchKey())+rrKey()+'<table class="sm"><thead><tr><th rowspan="2" style="width:13%"></th>'+T.map((t,i)=>tgHead(t,i,2)).join('')+'<th colspan="3" style="width:16%">Number of points</th></tr>'+
      '<tr>'+T.map(()=>'<th>Student</th><th class="t">Teacher</th>').join('')+'<th>Yes match</th><th>No match</th><th>Total</th></tr></thead><tbody>'+
      P.map((p,i)=>'<tr>'+perCell(p,i)+T.map(()=>'<td>'+yn()+'</td><td class="t">'+yn()+(rem?'<div class="rr">R R</div>':'')+'</td>').join('')+'<td></td><td></td><td class="tot"></td></tr>').join('')+
      '<tr class="totals"><td colspan="'+(1+T.length*2)+'">Total</td><td class="w"></td><td class="w"></td><td class="w"></td></tr></tbody></table>'+sheetFoot({src:'After Salter &amp; Croce (2006)'});
  }else if(S.sys==='contract'){
    if(S.chk.weekly){
      const legend='<div class="legend">'+T.map((t,i)=>'<b>'+(i+1)+' = '+esc(t.word||('Target '+(i+1)))+'</b>').join('')+' &nbsp; Tick the box when you did it; the teacher initials the day.</div>';
      h=sheetHead()+legend+'<table class="sm wk"><thead><tr><th style="width:16%">Period</th>'+DAYS.map(d=>'<th>'+d+'<br><span style="font-weight:400;font-size:10.5px">Date ______</span></th>').join('')+'</tr></thead><tbody>'+
        P.map((p,i)=>'<tr>'+perCell(p,i)+DAYS.map(()=>'<td class="wkc">'+T.map((t,ti)=>'<span class="box"></span>'+(ti+1)+' ').join('')+'</td>').join('')+'</tr>').join('')+
        '<tr><td class="per">Teacher initials</td>'+DAYS.map(()=>'<td style="height:26px"></td>').join('')+'</tr>'+
        '<tr class="totals"><td>Checks (of '+(P.length*T.length)+')</td>'+DAYS.map(()=>'<td class="w"></td>').join('')+'</tr><tr class="totals"><td>Week total</td><td class="w" colspan="5"></td></tr></tbody></table>'+sheetFoot({unit:'checks'});
    }else{
      h=sheetHead()+'<table class="sm sm-contract"><thead><tr><th style="width:16%">Period</th>'+T.map((t,i)=>tgHead(t,i,1)).join('')+'<th style="width:11%">Teacher initials</th></tr></thead><tbody>'+
        P.map((p,i)=>'<tr>'+perCell(p,i)+T.map(()=>'<td class="chk">'+smC(S.chk.pict&&!S.chk.pocket?face(true)+face(false):'<span class="mbox" style="margin:0"></span>')+'</td>').join('')+'<td></td></tr>').join('')+
        '<tr class="totals"><td>Total checks</td>'+T.map(()=>'<td class="w"></td>').join('')+'<td class="w"></td></tr></tbody></table>'+sheetFoot({unit:'checks'});
    }
  }else if(S.sys==='rubric'){
    const days=S.chk.weekly?DAYS:['Today'];const maxp=Math.max(...S.lv.map(l=>num(l.pts)||0));const n=S.lv.length;
    const cell=()=>S.chk.rubmatch?'<div class="rrow"><span class="who">Me</span>'+circles(n)+'</div><div class="rrow"><span class="who">Teacher</span>'+circles(n)+'<span class="mbox" title="match"></span></div>':'<div class="rrow">'+circles(n)+'</div>';
    h=sheetHead()+'<table class="sm rub" style="margin-bottom:8px"><thead><tr><th style="width:70%">Level</th><th>Points</th></tr></thead><tbody>'+S.lv.map((l,i)=>'<tr><td class="lv l'+(i+1)+'">'+esc(l.desc)+'</td><td>'+esc(l.pts)+'</td></tr>').join('')+'</tbody></table>'+
      '<div class="legend">Circle the level each period'+(S.chk.rubmatch?'; the teacher circles too, and ticks the box when the two match':'')+'.</div>'+
      '<table class="sm"><thead><tr><th style="width:16%">Period</th>'+days.map(d=>'<th>'+d+'<br><span style="font-weight:400;font-size:10.5px">Date ______</span></th>').join('')+'</tr></thead><tbody>'+
      P.map((p,i)=>'<tr>'+perCell(p,i)+days.map(()=>'<td>'+cell()+'</td>').join('')+'</tr>').join('')+
      '<tr class="totals"><td>Total points (of '+(P.length*maxp)+')</td>'+days.map(()=>'<td class="w"></td>').join('')+'</tr>'+(S.chk.weekly?'<tr class="totals"><td>Week total</td><td class="w" colspan="5"></td></tr>':'')+'</tbody></table>'+sheetFoot();
  }else if(S.sys==='interval'){
    const n=num(S.meta.iv_n)||10,len=num(S.meta.iv_len)||3,q=S.meta.iv_q||'Was I working?';
    h=sheetHead('<table class="key"><tr><th>Cue</th><td>'+esc(S.meta.iv_cue||'timer')+(/^Variable/.test(S.meta.iv_timing||'')?' about every ':' every ')+len+' min'+(/^Variable/.test(S.meta.iv_timing||'')?' (varies)':'')+'</td></tr><tr><th>Activity</th><td>'+esc(S.meta.iv_act||'')+'</td></tr><tr><th>Teacher matches</th><td>'+esc(S.meta.iv_match||'')+'</td></tr></table>')+
      '<div class="sm-dir">When the cue comes, ask yourself <b>'+esc(q)+'</b> and circle the answer. Then go straight back to work.</div>'+
      '<table class="sm"><thead><tr><th style="width:10%">Interval</th><th style="width:12%">'+(/^Variable/.test(S.meta.iv_timing||'')?'Minute<br><span style="font-weight:400;font-size:10px">write it in</span>':'Minute')+'</th><th>'+esc(q)+'<br><span style="font-weight:400">Student</span></th><th class="t">Teacher</th><th style="width:14%">Match</th></tr></thead><tbody>'+
      Array.from({length:n},(_,i)=>'<tr><td>'+(i+1)+'</td><td>'+(/^Variable/.test(S.meta.iv_timing||'')?'':((i+1)*len))+'</td><td>'+yn()+'</td><td class="t">'+yn()+'</td><td></td></tr>').join('')+
      '<tr class="totals"><td colspan="2">Yes answers</td><td class="w">___ of '+n+' = ___%</td><td class="w">___ of '+n+'</td><td class="w">___ of ___</td></tr></tbody></table>'+sheetFoot({unit:'intervals'});
  }else if(S.sys==='interlock'){
    const rows=ilRows(),dir=S.meta.il_dir||'dec',unit=S.meta.il_unit==='min'?'minutes of engagement':'items';
    const every=num(S.meta.il_every)??2,step=num(S.meta.il_step)??2,init=num(S.meta.il_init)??20;
    h='<div class="sm-head"><div><div class="sm-title">Self-Monitoring with an Interlocking Schedule of Reinforcement</div><div class="sm-line"><b>'+(dir==='inc'?'Increasing requirement as time elapses: preventing slow responding and improving fluency':'Decreasing requirement as time elapses: preventing ratio strain and improving quality')+'</b></div>'+
      '<div class="sm-line">Name: <span class="bl">'+esc(S.meta.client||'')+'</span> Date: <span class="bl" style="min-width:100px">'+esc(S.meta.sh_date||'')+'</span> Task: <span class="bl">'+esc(S.meta.il_task||'')+'</span></div></div></div>'+
      '<div class="sm-dir"><b>Directions</b><ol><li><b>Start the task.</b> Start a stopwatch the moment the student begins. The initial requirement to earn the reinforcer is <b>'+init+' '+esc(unit)+'</b>.</li>'+
      '<li><b>Check engagement every minute.</b> At the end of each minute the student circles Yes or No under Self-check for their own on-task behavior; the staff member independently circles Yes or No under Teacher-check, and writes the '+esc(unit)+' done so far.</li>'+
      '<li><b>Track the interlocking requirement.</b> For every '+every+' full minute'+(every===1?'':'s')+' that elapse the requirement '+(dir==='inc'?'rises':'falls')+' by '+step+(dir==='inc'?', so finishing sooner costs less.':', so taking time for quality costs nothing.')+'</li>'+
      '<li><b>Deliver the reinforcer.</b> The session ends when both conditions are met at the same minute: the '+esc(unit)+' done reach the number required at that minute, and the student and the teacher both circled Yes. Tick the box, praise the pacing and the quality, and deliver the reinforcer at once.</li></ol></div>'+
      '<table class="sm sm-il"><thead><tr><th colspan="2">Task engagement</th><th colspan="3">Two conditions</th><th rowspan="2" style="width:12%">Both conditions met</th></tr><tr><th class="t">Teacher-check</th><th>Self-check</th><th>Minutes elapsed</th><th>'+esc(unit)+' done</th><th>'+esc(unit)+' required</th></tr></thead><tbody>'+
      rows.map(r=>'<tr><td class="t"><span class="yes">Yes</span> &nbsp; <span class="no">No</span></td><td><span class="yes">Yes</span> &nbsp; <span class="no">No</span></td><td>'+r.t+'</td><td></td><td class="req">'+r.req+'</td><td><span style="display:inline-block;width:16px;height:16px;border:1.5px solid #111"></span></td></tr>').join('')+
      '</tbody></table><div class="sm-line" style="margin-top:8px">Comments: <span class="bl" style="min-width:80%"></span></div><div class="sm-foot"><div></div><div class="src">After the school’s session sheet (pp. 64–70) · Form SM-1</div></div>';
  }else if(S.sys==='smiley'){
    const inrow=S.meta.sm_inrow||'2',earn=(S.meta.sm_earn||'').split('\n').map(x=>x.trim()).filter(Boolean),tiers=(S.meta.sm_tiers||'').split('\n').map(x=>x.trim()).filter(Boolean);
    h='<div class="sm-head"><div><div class="sm-line">Name: <span class="bl">'+esc(S.meta.client||'')+'</span></div><div class="sm-title">'+esc(sheetTitle())+'</div><div class="sm-line">Date: <span class="bl" style="min-width:110px">'+esc(S.meta.sh_date||'')+'</span></div></div></div>'+
      '<div style="display:flex;gap:12px;align-items:flex-start"><table class="sm" style="flex:1"><thead><tr><th style="width:18%">Schedule</th><th colspan="'+T.length+'">I should be…</th><th style="width:9%">'+esc(inrow)+' in a row?</th></tr><tr><th></th>'+T.map((t,i)=>tgHead(t,i,1)).join('')+'<th></th></tr></thead><tbody>'+
      P.map((p,i)=>'<tr>'+perCell(p,i)+T.map(()=>'<td>'+smC(face(true,'face'))+'</td>').join('')+'<td><span class="mbox" style="margin:0"></span></td></tr>').join('')+
      '<tr class="totals"><td>Day’s total</td>'+T.map(()=>'<td class="w">____ / '+P.length+' = ____%</td>').join('')+'<td class="w"></td></tr>'+
      '<tr class="totals"><td>Goal</td>'+T.map(t=>'<td class="w">'+(t.goal?esc(t.goal)+'%':'______%')+'</td>').join('')+'<td class="w"></td></tr></tbody></table>'+
      '<div style="width:30%;border:1.5px solid #111;padding:8px;font-size:12px"><div style="font-weight:700;text-align:center;border-bottom:1.5px solid #111;padding-bottom:4px;margin-bottom:6px">'+esc(inrow)+' in a row<br>I can earn…</div>'+(earn.length?earn.map(e=>'<div style="padding:2px 0;border-bottom:1px dotted #999">'+esc(e)+'</div>').join(''):'<div style="color:#666">(list the earns on the Reinforcement sheet)</div>')+'<div style="padding:2px 0">Other: ________</div></div></div>'+
      '<div class="sm-line" style="margin-top:8px"><b>Total smiley faces earned: ______</b></div>'+
      '<div style="display:flex;gap:12px;align-items:flex-start;margin-top:6px"><table class="key"><tr><th colspan="2">End of the day rewards</th></tr>'+(tiers.length?tiers.map(t=>{const m=/^(\S+)\s+(.*)$/.exec(t);return '<tr><td><b>'+esc(m?m[1]:t)+'</b></td><td>'+esc(m?m[2]:'')+'</td></tr>';}).join(''):'<tr><td>10+</td><td>________</td></tr><tr><td>16+</td><td>________</td></tr>')+'</table>'+
      '<div style="font-size:12.5px">Teacher initials: ________<br>Student initials: ________'+(S.chk.home?'<br>Parent initials: ________':'')+'</div></div>'+(S.chk.eval?evalBox():'')+(S.chk.graph?graphStrip():'')+(S.chk.home?tearOff():'')+'<div class="sm-foot"><div></div><div class="src">After the school’s self-monitoring sheets · Form SM-1</div></div>';
  }else if(S.sys==='perf'){
    const n=Math.max(1,Math.min(10,num(S.meta.pf_n)||5)),mins=S.meta.pf_min||'',goal=num(S.meta.pf_goal),top=Math.max(goal||0,num(S.meta.pf_max)||20),what=S.meta.pf_what||'items',corr=S.meta.pf_kind==='correct',week=S.meta.pf_span==='week';
    const labels=week?DAYS.slice(0,n):Array.from({length:n},(_,i)=>'Session '+(i+1));
    /* the student's graph: one column per session, the count axis, the goal line */
    const W=520,H=200,L=36,B=24,T=10,cw=(W-L-10)/n;const Y=v=>T+(H-T-B)*(1-v/top);
    let g='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="My count graph">';
    const ticks=[];for(let v=0;v<=top;v+=Math.max(1,Math.round(top/5)))ticks.push(v);if(ticks[ticks.length-1]!==top)ticks.push(top);
    ticks.forEach(v=>{g+='<line x1="'+L+'" y1="'+Y(v)+'" x2="'+(W-10)+'" y2="'+Y(v)+'" stroke="#bbb"/><text x="'+(L-4)+'" y="'+(Y(v)+4)+'" font-size="10" text-anchor="end" fill="#333" font-family="system-ui,sans-serif">'+v+'</text>';});
    labels.forEach((d,i)=>{g+='<rect x="'+(L+i*cw+6)+'" y="'+T+'" width="'+(cw-12)+'" height="'+(H-T-B)+'" fill="#fff" stroke="#111" stroke-width="1.5"/><text x="'+(L+i*cw+cw/2)+'" y="'+(H-7)+'" font-size="10.5" text-anchor="middle" fill="#111" font-family="system-ui,sans-serif">'+esc(week?d.slice(0,3):String(i+1))+'</text>';});
    if(goal!=null)g+='<line x1="'+L+'" y1="'+Y(goal)+'" x2="'+(W-10)+'" y2="'+Y(goal)+'" stroke="#9b4e15" stroke-width="2.5" stroke-dasharray="6 4"/><text x="'+(W-12)+'" y="'+(Y(goal)-4)+'" font-size="10" text-anchor="end" fill="#9b4e15" font-family="system-ui,sans-serif">my goal: '+goal+'</text>';
    g+='</svg>';
    h=sheetHead('<table class="key"><tr><th>I count</th><td>'+esc(what)+'</td></tr><tr><th>Each session</th><td>'+esc(mins?mins+' minutes':'')+'</td></tr><tr><th>My goal</th><td>'+(goal!=null?goal+' '+esc(what):'')+'</td></tr></table>')+
      '<div class="sm-dir">When the timer rings, count your '+esc(what)+', write the number, and color the bar on the graph up to that number. Then circle whether you reached your goal.</div>'+
      '<div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap"><table class="sm" style="flex:1;min-width:280px"><thead><tr><th style="width:26%">'+(week?'Day':'Session')+'</th><th>Minutes</th><th>'+esc(what)+' done</th>'+(corr?'<th>Correct</th>':'')+'<th>Goal reached?</th><th class="t">Teacher check</th></tr></thead><tbody>'+
      labels.map(d=>'<tr><td class="per">'+esc(d)+'</td><td>'+esc(mins)+'</td><td style="height:30px"></td>'+(corr?'<td></td>':'')+'<td class="yn">YES &nbsp; NO</td><td class="t"></td></tr>').join('')+
      '<tr class="totals"><td>Sessions at goal</td><td class="w" colspan="'+(corr?5:4)+'">____ of '+n+'</td></tr></tbody></table><div class="graph" style="flex:1;min-width:300px;margin-top:0"><b>My graph: color each bar up to my count</b>'+g+'<button type="button" class="tool noprint sm-png">Save graph as image</button></div></div>'+sheetFoot({unit:'sessions at goal'});
  }else if(S.sys==='cico'){
    const key=S.meta.ci_key||'2 = Yes, met the expectation · 1 = Partly, with a reminder · 0 = No',goal=num(S.meta.ci_goal)??80,poss=P.length*T.length*2;
    h=sheetHead('<table class="key"><tr><th>Points</th><td style="text-align:left">'+esc(key)+'</td></tr><tr><th>Daily goal</th><td>'+goal+'% ('+Math.ceil(poss*goal/100)+' of '+poss+' points)</td></tr><tr><th>Mentor</th><td>'+esc(S.meta.ci_mentor||'')+'</td></tr></table>')+
      '<div class="inout"><div><b>Check-in '+esc(S.meta.ci_in?'· '+S.meta.ci_in.split(';')[0]:'')+'</b>Mentor initials: <span class="bl" style="min-width:60px"></span> &nbsp; Card and materials ready: YES / NO<br>My goal today: <span class="bl" style="min-width:60%"></span></div>'+
      '<div><b>Check-out '+esc(S.meta.ci_out?'· '+S.meta.ci_out.split(';')[0]:'')+'</b>Points earned: <span class="bl" style="min-width:50px"></span> of '+poss+' = <span class="bl" style="min-width:50px"></span>% &nbsp; Goal met: YES / NO<br>Mentor initials: <span class="bl" style="min-width:60px"></span> &nbsp; Reward: <span class="bl" style="min-width:140px"></span></div></div>'+
      '<table class="sm cico"><thead><tr><th style="width:18%">Period</th>'+T.map((t,i)=>tgHead(t,i,1)).join('')+'<th style="width:11%">Teacher initials</th></tr></thead><tbody>'+
      P.map((p,i)=>'<tr>'+perCell(p,i)+T.map(()=>'<td>'+smC('<span class="sc">0 1 2</span>')+'</td>').join('')+'<td></td></tr>').join('')+
      '<tr class="totals"><td>Points</td>'+T.map(()=>'<td class="w">____ of '+(P.length*2)+'</td>').join('')+'<td class="w"></td></tr></tbody></table>'+
      '<div class="sm-line" style="margin-top:6px">Teacher comment (one line, something that went well): <span class="bl" style="min-width:60%"></span></div>'+
      sheetFoot({src:'After the Behavior Education Program card (Crone, Hawken &amp; Horner, 2010)'})+(S.meta.ci_home&&/^Yes/.test(S.meta.ci_home)&&!S.chk.home&&!S.chk.pocket?tearOff():'');
  }
  if(S.chk.pocket&&['match','contract','cico'].includes(S.sys)){const body=h.replace(/<div class="sm-foot">[\s\S]*$/,'').replace(/<div class="inout">[\s\S]*?<\/div><\/div>/,'');const card='<div class="card">'+body+'<div class="sm-line" style="margin-top:4px">I earned ____ · Goal met: Y / N · Teacher: ______ · Student: ______'+(S.sys==='cico'?' · Check-in: ____ Check-out: ____':'')+'</div></div>';h=card+card;}
  out.innerHTML=warn+h;
}

/* ---------------- the contract document ---------------- */
function renderBc(){
  const m=S.meta,out=$('#bcOut');if(!out)return;const bl=(w)=>'<span class="bl" style="min-width:'+(w||120)+'px"></span>';
  const st=m.bc_student||m.client||'',tc=m.bc_teacher||'',pa=m.bc_parent||'';
  const v=(k,w)=>m[k]?esc(m[k]):bl(w);
  let h='<h3>Behavior Contract</h3><div class="sub">between '+(st?esc(st):bl(140))+(tc?' and '+esc(tc):'')+(pa?' and '+esc(pa):'')+'</div>';
  h+='<h4>What I will do</h4><div class="clause"><p>'+(m.bc_task?esc(m.bc_task):'I, '+bl(140)+', agree to '+bl(300)+'.')+'</p><p><b>How much, how well:</b> '+v('bc_how',240)+'</p><p><b>When and where:</b> '+v('bc_when',240)+'</p><p><b>Who records it:</b> '+v('bc_record',240)+'</p></div>';
  h+='<h4>What I earn</h4><div class="clause"><p><b>Reward:</b> '+v('bc_rw',240)+' &nbsp; <b>How much:</b> '+v('bc_rwmuch',120)+'</p><p><b>When:</b> '+v('bc_rwwhen',200)+' &nbsp; <b>From:</b> '+v('bc_rwwho',140)+'</p>'+(m.bc_bonus?'<p><b>Bonus:</b> '+esc(m.bc_bonus)+'</p>':'')+'</div>';
  h+='<h4>What the adults will do</h4><div class="clause"><p>'+v('bc_adult',300)+'</p></div>';
  h+='<h4>If the task is not done</h4><div class="clause"><p>'+(/^A stated/.test(m.bc_pen||'')&&m.bc_pentext?esc(m.bc_pentext):'Nothing is earned that day, and nothing already earned is taken away. The contract starts again the next day.')+'</p></div>';
  h+='<h4>Changing the contract</h4><div class="clause"><p>'+(m.bc_renego?esc(m.bc_renego):'Either of us may ask for a meeting to change the contract. Changes are written here and signed again; nobody changes it alone.')+' Review date: '+v('bc_review',110)+'.</p></div>';
  h+='<h4>Task record</h4><table class="ct"><tr><th style="width:14%">Date</th><th>Task done (initials)</th><th>Reward given (initials)</th><th>Date</th><th>Task done (initials)</th><th>Reward given (initials)</th></tr>'+Array.from({length:7},()=>'<tr><td style="height:22px"></td><td></td><td></td><td></td><td></td><td></td></tr>').join('')+'</table>';
  h+='<div class="sig"><div>Student: '+esc(st)+'<br>Signature and date</div><div>Teacher: '+esc(tc)+'<br>Signature and date</div>'+(pa?'<div>Parent: '+esc(pa)+'<br>Signature and date</div>':'')+'<div>Witness<br>Signature and date</div></div>';
  h+='<p class="sub" style="margin-top:10px">Starts '+esc(m.bc_start||'________')+' · '+(m.bc_voice?esc(m.bc_voice)+' · ':'')+'After Homme, Csanyi, Gonzales &amp; Rechs (1970) · Form SM-1</p>';
  out.innerHTML=h;
}

/* ---------------- the record ---------------- */
function rows(){return S.log.map(r=>({...r,p:num(r.pts),q:num(r.poss),m:num(r.m),n:num(r.n),g:num(r.goal),ph:String(r.ph||''),tp:String(r.tgp||'').split(',').map(x=>num(x))})).map(r=>({...r,pc:r.p!=null&&r.q?r.p/r.q*100:null,ag:r.m!=null&&r.n?r.m/r.n*100:null}));}
function renderRecord(){
  const R=rows(),v=$('#logVerdict'),M=$('#logMetrics'),RU=$('#logRules');
  const base=R.filter(r=>r.ph==='0'&&r.pc!=null),bm=base.length?base.reduce((s,r)=>s+r.pc,0)/base.length:null;
  const sug=bm!=null?Math.max(50,Math.min(80,Math.round((bm+10)/5)*5)):null;
  const tx=R.filter(r=>r.ph!=='0'&&r.pc!=null),last=tx.slice(-5),met=last.filter(r=>r.met).length;
  const agr=last.filter(r=>r.ag!=null),agm=agr.length?agr.reduce((s,r)=>s+r.ag,0)/agr.length:null;
  const mean=tx.length?tx.reduce((s,r)=>s+r.pc,0)/tx.length:null;
  M.innerHTML=`<div class="metric"><b>Baseline mean</b><div class="val">${bm!=null?pct(bm):'—'}</div><div class="sub">${base.length} teacher-only day${base.length===1?'':'s'}${sug!=null?' · suggested first goal '+sug+'%':''}</div></div>
    <div class="metric"><b>Mean since self-rating began</b><div class="val">${mean!=null?pct(mean):'—'}</div><div class="sub">${tx.length} day${tx.length===1?'':'s'}</div></div>
    <div class="metric"><b>Goal met, last 5 days</b><div class="val">${last.length?met+' of '+last.length:'—'}</div><div class="sub">current goal ${S.meta.goal?pct(num(S.meta.goal)):'—'}</div></div>
    <div class="metric"><b>Agreement, last 5 days</b><div class="val">${agm!=null?pct(agm):'—'}</div><div class="sub">student and teacher ratings</div></div>`;
  const TM=$('#tgMetrics');if(TM){const last5=R.slice(-5);TM.innerHTML=S.tg.map((t,i)=>{const vals=last5.map(r=>r.tp[i]).filter(x=>x!=null);const mn=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;return '<div class="metric"><b>Target '+(i+1)+', last 5 days</b><div class="val">'+(mn!=null?pct(mn):'—')+'</div><div class="sub">'+esc(t.word||'')+(t.goal?' · goal '+esc(t.goal)+'%':'')+'</div></div>';}).join('');}
  if(!R.length){v.innerHTML='<div class="verdict v-mid"><b>No days yet.</b> Enter the teacher-only days as phase 0; the record will suggest a first goal.</div>';RU.innerHTML='';drawLog(R);return;}
  const rules=[];
  if(last.length>=5){
    if(met>=4)rules.push(['ok','Goal met on '+met+' of the last 5 days: raise the goal by the step on the Reinforcement sheet'+(num(S.meta.cc_cap)!=null&&num(S.meta.goal)!=null&&num(S.meta.goal)>=num(S.meta.cc_cap)?' (it is at the ceiling: hold it and move down the matching ladder instead)':'')+'.']);
    else if(met<2)rules.push(['no','Goal met on '+met+' of the last 5 days: lower the goal to a level the student has reached, re-check the reward with a brief MSWO, and look at fidelity before anything else.']);
    else rules.push(['mid','Goal met on '+met+' of the last 5 days: hold the goal.']);
  }else rules.push(['mid','Fewer than five days since self-rating began: no decision yet.']);
  /* agreement is judged only where the system has a teacher match: Self & Match, cued intervals, the interlocking
     session, and the rubric with the teacher matching; a contract, the expectations sheet, check-in/check-out and the
     performance count have no second rating */
  const matched=['match','interval','interlock'].includes(S.sys)||(S.sys==='rubric'&&!!S.chk.rubmatch);
  if(!matched){}
  else if(agm!=null){
    if(agm<80)rules.push(['no','Agreement '+pct(agm)+' over the last five days: move back one phase on the matching ladder and re-run the rating practice.']);
    else if(agm>=90&&met>=4)rules.push(['ok','Agreement '+pct(agm)+' and the goal met on 4 of 5: the next phase of the matching ladder is due.']);
    else rules.push(['mid','Agreement '+pct(agm)+': stay on the current phase.']);
  }else if(tx.length)rules.push(['mid','No matches entered for the last five days: agreement cannot be judged.']);
  const ph=curPhase();
  v.innerHTML='<div class="verdict '+(rules.some(r=>r[0]==='no')?'v-no':rules.some(r=>r[0]==='ok')?'v-ok':'v-mid')+'"><b>Phase '+(ph||'?')+' · '+R.length+' day'+(R.length===1?'':'s')+' recorded.</b> '+esc(rules[0][1])+'</div>';
  RU.innerHTML='<ul style="font-family:var(--sans);font-size:12.5px;margin:4px 0 4px 18px">'+rules.map(r=>'<li>'+esc(r[1])+'</li>').join('')+'</ul><p class="hint">The thresholds (4 of 5, 2 of 5, 80%, 90%) are the form’s working conventions, written on the Reinforcement and Teach sheets; change them there if the team uses others.</p>';
  drawLog(R);
}
function drawLog(R){
  const W=900,H=320,L=56,Rg=20,T=18,B=48,n=Math.max(R.length,10);const X=i=>L+(i+0.5)*(W-L-Rg)/n,Y=v=>T+(H-T-B)*(1-v/100);
  let s='<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="#fff"/>';
  [0,25,50,75,100].forEach(p=>{s+='<line x1="'+L+'" y1="'+Y(p)+'" x2="'+(W-Rg)+'" y2="'+Y(p)+'" stroke="#e3e8ea"/><text x="'+(L-6)+'" y="'+(Y(p)+4)+'" font-size="11" text-anchor="end" fill="#5B6B6B" font-family="system-ui,sans-serif">'+p+'%</text>';});
  s+='<line x1="'+L+'" y1="'+Y(0)+'" x2="'+(W-Rg)+'" y2="'+Y(0)+'" stroke="#182e43"/><line x1="'+L+'" y1="'+T+'" x2="'+L+'" y2="'+Y(0)+'" stroke="#182e43"/>';
  /* phase changes as dashed lines, the goal as a stepped line */
  let prev=null;R.forEach((r,i)=>{if(prev!==null&&r.ph!==prev){const x=X(i)-(W-L-Rg)/n/2;s+='<line x1="'+x.toFixed(1)+'" y1="'+T+'" x2="'+x.toFixed(1)+'" y2="'+Y(0)+'" stroke="#182e43" stroke-dasharray="4 4"/><text x="'+(x+4).toFixed(1)+'" y="'+(T+12)+'" font-size="11" fill="#182e43" font-family="system-ui,sans-serif">phase '+esc(r.ph)+'</text>';}prev=r.ph;});
  let gp='';R.forEach((r,i)=>{if(r.g!=null){const x0=X(i)-(W-L-Rg)/n/2,x1=X(i)+(W-L-Rg)/n/2;gp+='M'+x0.toFixed(1)+' '+Y(r.g).toFixed(1)+' L'+x1.toFixed(1)+' '+Y(r.g).toFixed(1)+' ';}});
  if(gp)s+='<path d="'+gp+'" stroke="#9b4e15" stroke-width="2" fill="none"/>';
  let d='';R.forEach((r,i)=>{if(r.pc==null){d+='|';return;}d+=(d&&!d.endsWith('|')?'L':'M')+X(i).toFixed(1)+' '+Y(r.pc).toFixed(1)+' ';});
  d.split('|').forEach(seg=>{if(seg.trim())s+='<path d="'+seg+'" fill="none" stroke="#2f5568" stroke-width="2"/>';});
  /* a thin line per target when per-target percents were entered */
  const TC=['#5C9E31','#9B4E15','#5b3f78','#b1860b','#8E2A2A'];S.tg.forEach((t,ti)=>{let dd='';R.forEach((r,i)=>{const v=r.tp[ti];if(v==null){dd+='|';return;}dd+=(dd&&!dd.endsWith('|')?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)+' ';});dd.split('|').forEach(seg=>{if(seg.trim())s+='<path d="'+seg+'" fill="none" stroke="'+TC[ti%5]+'" stroke-width="1.2" stroke-dasharray="3 3"/>';});});
  R.forEach((r,i)=>{if(r.pc==null)return;s+='<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(r.pc).toFixed(1)+'" r="4.5" fill="'+(r.ph==='0'?'#fff':r.met?'#2F6B37':'#2f5568')+'" stroke="#2f5568" stroke-width="1.5"/>';
    if(r.ag!=null)s+='<rect x="'+(X(i)-3).toFixed(1)+'" y="'+(Y(r.ag)-3).toFixed(1)+'" width="6" height="6" fill="#76a2a3"/>';
    s+='<text x="'+X(i).toFixed(1)+'" y="'+(Y(0)+14)+'" font-size="10" text-anchor="middle" fill="#5B6B6B" font-family="system-ui,sans-serif">'+esc(String(r.date||i+1).slice(0,6))+'</text>';});
  s+='<text x="'+((L+W-Rg)/2)+'" y="'+(H-6)+'" font-size="11" text-anchor="middle" fill="#5B6B6B" font-family="system-ui,sans-serif">Percent of points (line; filled green when the goal was met; hollow in the teacher-only phase) · goal (brown) · agreement (small squares) · per-target percents (thin dashed lines)</text>';
  $('#logPlot').innerHTML=s;
}

/* ---------------- meta + render ---------------- */
function bindMeta(){$$('[data-m]').forEach(el=>{el.value=S.meta[el.dataset.m]||'';});$$('[data-c]').forEach(el=>{el.checked=!!S.chk[el.dataset.c];});}
function renderAll(){ensure();bindMeta();setSys(S.sys);renderT();renderP();renderRub();renderLad();renderFade();renderFid();renderBck();renderL();renderWk();renderPoints();renderSetup();renderSheet();renderBc();renderRecord();}

/* ---------------- toolbar ---------------- */
$('#printBtn').addEventListener('click',()=>window.print());
function sheetOrientation(){if(S.chk.pocket&&['match','contract','cico'].includes(S.sys))return 'portrait';if(S.sys==='match'||S.sys==='interval'||S.sys==='interlock'||S.sys==='smiley'||S.sys==='perf')return 'landscape';if(S.chk.weekly)return 'landscape';return 'portrait';}
function printAlone(cls,orient){document.body.classList.add(cls);
  const st=document.createElement('style');st.textContent='@media print{@page{size:letter '+orient+';margin:0.5in}}';document.head.appendChild(st);
  const off=()=>{document.body.classList.remove(cls);st.remove();window.removeEventListener('afterprint',off);};
  window.addEventListener('afterprint',off);setTimeout(()=>{window.print();setTimeout(off,1500);},30);}
$('#sheetPrintBtn').addEventListener('click',()=>{if(!S.sys){alert('Choose a system first; there is no sheet yet.');return;}printAlone('sm-sheet-only',sheetOrientation());});
$('#bcPrintBtn').addEventListener('click',()=>{renderBc();printAlone('sm-bc-only','portrait');});
$('#saveBtn').addEventListener('click',()=>{
  const nm=(S.meta.client||'student').replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'SM-1',rev:'2026-10',saved:new Date().toISOString(),S},null,1)],{type:'application/json'}));
  const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  a.download=`SM-1_${nm}_${ymd}.json`;document.body.appendChild(a);a.click();a.remove();});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
function fromFile(d){
  if(!d||typeof d!=='object'||d.form!=='SM-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v),obj=k=>s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])?s[k]:{};
  Object.keys(obj('meta')).forEach(k=>{o.meta[k]=str(s.meta[k]);});Object.keys(obj('chk')).forEach(k=>{o.chk[k]=!!s.chk[k];});
  o.sys=['match','contract','rubric','interval','interlock','smiley','perf','cico'].includes(s.sys)?s.sys:'';
  const arr=(k,fields,n)=>Array.isArray(s[k])?s[k].slice(0,n||50).map(x=>{const r={};fields.forEach(f=>{r[f]=f==='on'||f==='met'?!!(x&&x[f]):str(x&&x[f]);});return r;}):null;
  o.tg=arr('tg',['word','def','cue','ex','nex','icon','img','goal'],6)||[];o.per=arr('per',['t','label','icon','img'],16)||[];
  const okImg=v=>/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<400000?v:'';o.tg.forEach(x=>{x.img=okImg(x.img);});o.per.forEach(x=>{x.img=okImg(x.img);});
  const lv=arr('lv',['pts','desc'],5);if(lv&&lv.length===5)o.lv=lv;
  const lad=arr('lad',['on','note'],LADDER.length);if(lad&&lad.length===LADDER.length)o.lad=lad;
  const fid=arr('fid',['in','note'],FID.length);if(fid&&fid.length===FID.length)o.fid=fid;
  const fade=arr('fade',['on','note'],FADE.length);if(fade&&fade.length===FADE.length)o.fade=fade;
  const bck=arr('bck',['in','note'],BCRULES.length);if(bck&&bck.length===BCRULES.length)o.bck=bck;
  o.log=arr('log',['date','ph','goal','pts','poss','m','n','met','tgp','note','src'],400)||[];   /* src (v21.46): 'ipad:yyyy-mm-dd' for a row a day rated on the iPad wrote */
  Object.keys(obj('wk')).forEach(k=>{if(/^d[0-4]_p\d+$/.test(k))o.wk[k]=str(s.wk[k]);});
  o.tg.forEach(t=>{if(!window.NBH_PICTOS||!NBH_PICTOS[t.icon])t.icon='';});o.per.forEach(p=>{if(!window.NBH_PICTOS||!NBH_PICTOS[p.icon])p.icon='';});
  return o;
}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='SM-1'?d.form:'';
    const next=other?null:fromFile(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved SM-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form SM-1. Nothing was changed.':'That file could not be read as a saved SM-1 form. Nothing was changed.');return;}
    const prev=S;S=next;try{renderAll();}catch(err){S=prev;renderAll();alert('That file could not be read as a saved SM-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});
$('#csvBtn').addEventListener('click',()=>{
  const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
  const out=[['Day','Date','Phase','Goal %','Points','Possible','%','Matches','Ratings','Agreement %','Goal met','Per target %','Note']];
  rows().forEach((r,i)=>out.push([i+1,r.date,r.ph,r.goal,r.pts,r.poss,r.pc==null?'':r.pc.toFixed(1),r.m,r.n,r.ag==null?'':r.ag.toFixed(1),r.met?'yes':'no',r.tgp||'',r.note]));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='SM-1_record.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();renderAll();setView('setup');}});

/* ---------------- simulation ---------------- */
async function loadSim(){
  if(!(await nbhUI.confirm('Load a simulated system?\nEvery sheet is filled with a worked example. Anything already entered will be replaced.',{ok:'Load'})))return;
  const off=x=>{const m=x.getMonth(),d=x.getDate(),w=x.getDay(),n=Math.ceil(d/7),last=d+7>new Date(x.getFullYear(),m+1,0).getDate();
    return !(w%6)||(m===0&&(d<=2||(w===1&&n===3)))||(m===1&&w===1&&n===3)||(m===4&&w===1&&last)||(m===5&&d===19)||(m===6&&d===4)||(m===8&&w===1&&n===1)||(m===10&&(d===11||(w===4&&n===4)||(w===5&&d>=23&&d<=29)))||(m===11&&d>=24);};
  const fmt=d=>(d.getMonth()+1)+'/'+d.getDate();const step=(n,dir)=>{const d=new Date();d.setHours(12,0,0,0);while(off(d))d.setDate(d.getDate()-1);for(let k=n;k>0;){d.setDate(d.getDate()+dir);if(!off(d))k--;}return d;};
  const D=n=>fmt(step(n,-1)),F=n=>fmt(step(n,1)),Y=n=>{const d=step(n,-1);return (d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2);};
  S=blank();S.sys='match';
  S.meta={client:'SIMULATED – Sample Student',sid:'SIM-000',grade:'3',nick:'Sam',plan:'BIP dated '+Y(30)+' (Form TD-1): break card and a 2-minute task start; replacement skills from GB-1',func:'Escape or avoidance',
    setting:'General education classroom (Ms. R.), specials, lunch and recess',rater:'Ms. R. in class; the paraeducator at specials, lunch and recess',bcba:'Joshua Newsome, M.A., BCBA',date:Y(16),start:Y(15),review:Y(0),
    r_perf:'Yes: the behavior is in the repertoire',rf_class:'Activities and privileges (free time, a game, a walk, helper)',rf_closed:'No: only through the sheet (closed)',rf_mag:'from phase 3, free time grows from 5 to 10 minutes and Friday adds a game with a friend',r_disc:'With practice (teach first with examples and non-examples)',r_read:'Needs pictures and faces',r_pa:'Yes, menu carried in below',r_base:'4 school days, teacher rating only',
    r_hist:'A clip chart last year, moved down in front of the class; Sam tore up two point sheets in the spring. Nothing with the student rating himself.',
    t_reduce:'Leaving the work area and tipping the desk (escape); the targets are the plan’s replacement behaviors',t_rem:'A Yes allows one reminder (the teacher tallies reminders in the R R box)',
    mp_yy:'2',mp_nn:'1',mp_yn:'0',mp_ny:'0',goal:'75',goal_txt:'',menu:'Extra recess with a friend (5 min) · Line leader · Drawing time at the back table · Feed the class fish · Teacher helper',
    when:'Same day, at the end of the sheet',bonus:'A sticker on the sheet when every rating in the day matches',never:'Points are never taken away; a mismatch earns 0 and nothing more is said; the sheet is never shown to the class',
    homeNote:'The sheet goes home in the folder; a parent initials it; a goal day earns five minutes of praise and a story, not a second reward',group:'',
    cc_up:'Met on 4 of the last 5 school days',cc_step:'5 points',cc_down:'Met on fewer than 2 of 5 days, or Sam stops choosing a reward',cc_cap:'90',
    tr_ex:'For each target: the teacher and the para act out three examples and three non-examples; Sam labels each with a face card until 9 of 10 are right, two days running.',
    tr_prac:'Two practice periods on '+Y(17)+': Sam rated, Ms. R. rated, they compared; an honest sad face was praised each time it was earned.',tr_acc:'Agreement at or above 80% on 3 practice days',
    tr_dis:'Ms. R.’s rating stands; Sam may ask once what she saw; no argument on the sheet',tr_who:'J. Newsome with Ms. R., '+Y(18)+' and '+Y(17),
    gen_set:'Specials next (art, music), with the para rating; the same sheet travels in the folder',gen_thin:'Rate three periods instead of six once phase 3 holds; then a weekly goal',gen_exit:'Goal at 90% with checks faded for four weeks and the plan data on PR-1 holding',
    iv_q:'Was I working?',iv_len:'3',iv_n:'10',iv_cue:'Tactile timer (vibrating prompt)',iv_timing:'Variable: the length varies around the average, so the cue cannot be predicted',iv_match:'Half of the intervals, chosen beforehand',iv_act:'independent math practice',
    il_dir:'dec',il_unit:'items',il_init:'20',il_step:'2',il_every:'2',il_len:'16',il_chk:'1',il_task:'Math worksheet, problems 1 to 20',il_floor:'6',il_cap:'20',
    sm_inrow:'2',sm_earn:'Show my work\nShare my interest\nTake a walk\nDraw a picture\nTeacher helper\nClass thumbs up',sm_tiers:'10+ Free time\n16+ Play a game',
    pf_what:'math problems completed',pf_kind:'correct',pf_n:'5',pf_min:'10',pf_goal:'12',pf_max:'20',pf_span:'day',
    ci_key:'2 = Yes, met the expectation · 1 = Partly, with a reminder · 0 = No',ci_mentor:'Mr. Ortiz, front office',ci_in:'8:10; greet, card out, goal said aloud, materials check',ci_out:'2:55; total the points, praise or problem-solve, copy home',ci_goal:'80',ci_home:'Yes, signed and returned next morning',
    smp_goal:'“Stay in my area and use my break card” (Sam chose it from two)',smp_eval:'At check-out Sam circles YES or NO on the goal and says one thing that helped',smp_instr:'At the cue: “Am I in my area? Yes, keep going.” Taught aloud, then whispered, then silent',smp_selfr:'Sam picks the reward from the menu when the total meets the goal, after Ms. R. initials the total',
    bc_student:'',bc_teacher:'Ms. R.',bc_parent:'Sam’s father',bc_start:Y(10),bc_review:F(4),bc_voice:'Negotiated line by line',bc_task:'Earn the goal on my point sheet',bc_how:'At least 4 of 5 school days in the week',bc_when:'Every school day, all six periods, Room 12 and specials',bc_record:'Ms. R. initials the task record each day the goal is met',bc_adult:'Ms. R. will rate every period and give the daily reward the same day; Dad will read the home note each night and sign on Friday',bc_rw:'Extra recess with a friend',bc_rwmuch:'10 minutes',bc_rwwhen:'Friday at 2:40',bc_rwwho:'Ms. R.',bc_bonus:'Five days in a row earns lunch with a friend in the classroom',bc_pen:'None: a day the task is not done earns nothing, and nothing is lost',bc_pentext:'',bc_renego:'Either of us may ask for a meeting; the contract is rewritten, never changed by one side',
    sh_date:'',sh_title:'',sh_reward:'',decision:'Week 3: goal raised from 75 to 80 on '+Y(2)+' (met 4 of 5). Matching stays at every period until agreement holds at 90.',sv:'Sam chose the sheet with faces over the one with words and asks for the recess reward most days.'};
  S.chk={pict:true,home:true,weekly:false,big:false,graph:true,eval:true,pocket:false,rubmatch:true};
  /* v21.45 the design and the reward store */
  S.d={look:'bright',rate:'thumbs',av:'faceboy2',wf:true,mid:'18 points by lunch = 5 minutes of drawing at the back table',cstrip:false};
  S.store=[{n:'Line leader',icon:'lineup',img:'',p:'8',tier:'s'},{n:'Drawing time',icon:'drawing',img:'',p:'10',tier:'s'},{n:'Teacher helper',icon:'helper',img:'',p:'12',tier:'m'},{n:'Feed the class fish',icon:'pet',img:'',p:'15',tier:'m'},{n:'Extra recess with a friend',icon:'playground',img:'',p:'20',tier:'b'}];
  S.tg=[{word:'I stayed in my area',def:'Seated or standing within the taped area for the whole period, except with permission or a break card',cue:'Bottom on the chair',ex:'At the desk while the class works; at the carpet during meeting',nex:'Wandering to the window; under the table',icon:'stayarea',img:'',goal:'80'},
    {word:'I followed directions the first time',def:'Starts the task within 10 s of the direction, with at most one reminder',cue:'Start within 10 seconds',ex:'Opens the book when asked',nex:'Says “no” and waits for a third prompt',icon:'follow',img:'',goal:'80'},
    {word:'I used kind words and hands',def:'No hitting, pushing, grabbing or name-calling; asks for help or a break with the card',cue:'Gentle and respectful',ex:'Asks for a turn; uses the break card',nex:'Pushes a chair; calls a peer a name',icon:'safehands',img:'',goal:'90'}];
  S.per=[{t:'8:30',label:'Arrival',icon:'arrival',img:''},{t:'9:15',label:'Reading',icon:'reading',img:''},{t:'10:00',label:'Math',icon:'math',img:''},{t:'11:00',label:'Specials',icon:'art',img:''},{t:'12:15',label:'Lunch and recess',icon:'lunch',img:''},{t:'1:30',label:'Centers',icon:'centers',img:''}];
  S.fade.forEach((f,i)=>{f.on=i===0;f.note=i===0?'From '+Y(11)+'; every period rated':'';});S.bck.forEach(b=>{b.in='Yes';});
  S.lad.forEach((l,i)=>{l.on=i===1;l.note=i===0?'Days 1 to 4 ('+Y(15)+' to '+Y(12)+'): mean 58%; first goal set at 70':i===1?'From '+Y(11)+'; agreement 75% in week 1, 88% in week 2, 92% in week 3':'';});
  S.fid.forEach((f,i)=>{f.in='Yes';f.note=i===2?'Ms. R. rates on her clipboard before Sam shows his sheet':i===8?'Returned 9 of 11 days':'';});
  const base=[52,61,56,64],g1=70,g2=75,g3=80;
  const days=[[g1,'0',52,36,null,null],[g1,'0',61,36,null,null],[g1,'0',56,36,null,null],[g1,'0',64,36,null,null],
    [g1,'1',64,36,13,18],[g1,'1',72,36,14,18],[g1,'1',69,36,13,18],[g1,'1',78,36,15,18],[g1,'1',75,36,15,18],
    [g1,'1',81,36,16,18],[g1,'1',78,36,16,18],[g1,'1',83,36,17,18],[g1,'1',86,36,16,18],[g1,'1',72,36,16,18],
    [g2,'1',83,36,17,18],[g2,'1',89,36,17,18],[g2,'1',78,36,16,18],[g2,'1',86,36,17,18],[g2,'1',92,36,18,18],
    [g3,'1',83,36,17,18],[g3,'1',89,36,17,18]];
  S.log=days.map((d,i)=>{const pts=Math.round(36*d[2]/100);const tp=[Math.min(100,d[2]+8),Math.max(0,d[2]-10),Math.min(100,d[2]+4)];return{date:D(days.length-1-i),ph:d[1],goal:String(d[0]),pts:String(pts),poss:'36',m:d[4]==null?'':String(d[4]),n:d[5]==null?'':String(d[5]),met:d[1]!=='0'&&pts/36*100>=d[0],tgp:tp.join(','),note:i===4?'first day rating':i===14?'goal raised to 75':i===19?'goal raised to 80':''};});
  S.meta.goal='80';
  if(typeof smRSim==='function')smRSim();   /* v21.46 today's first periods rated on the iPad (sm-rate.js) */
  renderAll();setView('sheet');
  nbhUI.toast('Simulation loaded: '+'a simulated third-grader’s pictorial Self & Match sheet with three targets over six periods.',{kind:'ok'});
}
$('#simBtn').addEventListener('click',loadSim);

$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
/* v21.45 the first render is at the end of the script (build.sh), once the v2 parts (sm-v2-*.js) are defined */

/* v21.31 the case: hooks. The targets a student self-monitors are stated positively, so an empty target
   table takes the acquisition objectives from Form GB-1 and the paired replacements named on Form TB-1,
   not the problem behaviors themselves; the problem behaviors go to the "reduction target" line, the
   function to its field, and the ranked menu from Form PA-1 to the reward menu. The picker adds whatever
   is ticked as a target row, so a reduction target can be written in when the team wants it on the sheet.
   One skill is one row (with Form TB-1 passing a skill shared by several behaviors under one name): a replacement
   target defined on Form TB-1 under the name of a row already made fills that row's empty definition, examples and
   non-examples, and the picker places a name already on the sheet no second time, filling only its empty fields. */
const nbhSmRow=o=>Object.assign({word:'',def:'',cue:'',ex:'',nex:'',icon:'',img:'',goal:''},o);
const nbhSmK=s=>String(s||'').trim().replace(/\s+/g,' ').toLowerCase();
const nbhSmFill=(r,o)=>{let k=0;['def','ex','nex'].forEach(f=>{if(o[f]&&!r[f]){r[f]=o[f];k++;}});return k;};
window.__nbhFactsIn=function(f){
  let n=0;const behs=f.behaviors||[],acq=(f.goals&&f.goals.acq)||[];
  if(S.tg.every(t=>!t.word&&!t.def)){
    const rows=[];
    acq.forEach(g=>{if(g.beh&&rows.length<5&&!rows.some(r=>r.word===g.beh))rows.push(nbhSmRow({word:g.beh,def:g.cond?'given '+g.cond:''}));});
    behs.forEach(b=>{const w=b.isRep?b.label:b.rep;if(!w)return;const had=rows.find(r=>r.word===w);
      if(had){if(b.isRep)nbhSmFill(had,{def:b.def||'',ex:b.ex||'',nex:b.nex||''});return;}
      if(rows.length<5)rows.push(nbhSmRow(b.isRep?{word:b.label,def:b.def,ex:b.ex||'',nex:b.nex||''}:{word:w}));});
    if(rows.length){while(rows.length<2)rows.push(nbhSmRow({}));S.tg=rows;n+=rows.filter(r=>r.word).length;}
  }
  const red=behs.filter(b=>!b.isRep);
  if(!S.meta.t_reduce&&red.length){S.meta.t_reduce=red.map(b=>b.label+(b.rep?' (replaced by '+b.rep+')':'')).join('; ');n++;}
  if(!S.meta.func&&f.fn){const v=nbhCase.optionFor(document.querySelector('[data-m="func"]'),f.fn.key||f.fn.label);if(v){S.meta.func=v;n++;}}
  if(!S.meta.menu&&(f.menu||[]).length){S.meta.menu=nbhCase.menuLine(f.menu,5);n++;}
  if(n)renderAll();return {filled:n};
};
window.__nbhFactsPick=function(sel){
  let n=0;const dup=[];
  const add=o=>{const had=nbhSmK(o.word)?S.tg.find(t=>nbhSmK(t.word)===nbhSmK(o.word)):null;
    if(had){if(nbhSmFill(had,o))return true;if(dup.indexOf(had.word)<0)dup.push(had.word);return false;}
    if(S.tg.length>=5&&!S.tg.some(t=>!t.word&&!t.def))return false;const slot=S.tg.find(t=>!t.word&&!t.def);if(slot)Object.assign(slot,nbhSmRow(o));else S.tg.push(nbhSmRow(o));return true;};
  sel.behaviors.forEach(b=>{const w=b.isRep?b.label:(b.rep||b.label);if(add({word:w,def:w===b.label?b.def:'',ex:w===b.label?(b.ex||''):'',nex:w===b.label?(b.nex||''):''}))n++;});
  sel.goals.acq.forEach(g=>{if(add({word:g.beh,def:g.cond?'given '+g.cond:''}))n++;});
  sel.goals.red.forEach(g=>{if(add({word:g.beh,def:'no '+(g.ml||'more')+' than '+(g.tgt||'the target level')}))n++;});
  if(sel.fn){const v=nbhCase.optionFor(document.querySelector('[data-m="func"]'),sel.fn.key||sel.fn.label);if(v){S.meta.func=v;n++;}}
  if(sel.menu.length){S.meta.menu=[S.meta.menu,sel.menu.map(m=>m.name).join(', ')].filter(Boolean).join(', ');n++;}
  renderAll();
  const notes=[];if(dup.length)notes.push((dup.length===1?dup[0]+' is':dup.join(', ')+' are')+' already on the sheet.');
  if(S.tg.length>=5)notes.push('The sheet holds at most five targets.');
  return {filled:n,note:notes.join(' ')};
};

/* ===== sm-themes.js ===== */
/* Form SM-1, the interest themes' pictures: OpenMoji (https://openmoji.org), CC BY-SA 4.0. Made by
   tools/forms/SM-1/make-themes.py; do not edit by hand. */
const SM_THEME_ART={"sports":["<g><path fill=\"#FFFFFF\" stroke=\"none\" d=\"M65,36c0,1.61-0.13,3.19-0.39,4.73c-0.71,4.39-2.42,8.45-4.89,11.94c0,0,0,0,0,0.01 c-4.24,6.03-10.73,10.37-18.24,11.8C39.7,64.82,37.87,65,36,65c-0.5,0-1-0.01-1.49-0.04h-0.07c-0.47-0.03-0.94-0.06-1.41-0.11 c-0.04,0-0.08-0.01-0.1201-0.01c-0.39-0.04-0.78-0.09-1.17-0.15c-0.11-0.02-0.23-0.03-0.34-0.05c-0.3-0.05-0.59-0.1-0.89-0.16 c-0.47-0.09-0.94-0.19-1.41-0.31c-0.19-0.04-0.39-0.09-0.58-0.14c-0.26-0.07-0.52-0.15-0.78-0.23c-0.23-0.07-0.47-0.14-0.71-0.22 c-0.2401-0.0699-0.47-0.15-0.7-0.24c-0.19-0.07-0.38-0.14-0.57-0.21c-0.11-0.03-0.21-0.07-0.32-0.12 c-0.39-0.16-0.78-0.32-1.16-0.4901c-0.52-0.23-1.03-0.48-1.54-0.74c-0.23-0.12-0.45-0.24-0.68-0.37 c-0.26-0.14-0.51-0.28-0.76-0.43c-0.28-0.17-0.56-0.33-0.84-0.51c-0.08-0.05-0.16-0.11-0.2401-0.16 c-0.39-0.25-0.78-0.52-1.15-0.79c-0.32-0.22-0.63-0.46-0.93-0.69c-0.03-0.02-0.05-0.04-0.08-0.0699 c-0.27-0.21-0.53-0.42-0.78-0.64c-0.13-0.1-0.26-0.21-0.38-0.32c-0.1-0.09-0.19-0.17-0.29-0.26c-0.02-0.01-0.03-0.02-0.04-0.03 c-0.03-0.03-0.06-0.06-0.09-0.08c-0.02-0.01-0.03-0.03-0.04-0.04c-0.02-0.01-0.03-0.02-0.04-0.04c-0.13-0.11-0.25-0.22-0.37-0.34 c-0.13-0.12-0.25-0.23-0.36-0.35c-0.02-0.02-0.04-0.04-0.05-0.06c-0.1-0.1-0.2-0.19-0.3-0.28 c-0.1517-0.1517-0.2917-0.3225-0.4401-0.4795c-0.0066-0.0068-0.0134-0.0137-0.02-0.0205 c0.0008,0.0004,0.0015,0.0009,0.0023,0.0013c-0.3342-0.3544-0.6707-0.7049-0.9923-1.0813c-0.24-0.28-0.48-0.57-0.71-0.87 c-0.3199-0.41-0.6299-0.82-0.93-1.25c-2.46-3.51-4.16-7.59-4.87-12.01C7.12,39.11,7,37.57,7,36c0-6.17,1.92-11.89,5.22-16.59 C15.41,14.83,19.9,11.22,25.15,9.11C28.5,7.74,32.16,7,36,7c3.83,0,7.49,0.74,10.83,2.1c2.52,1,4.86,2.36,6.97,4.02 c0.56,0.43,1.11,0.89,1.64,1.38h0.01c0.53,0.48,1.04,0.98,1.53,1.5c0.75,0.77,1.44,1.58,2.09,2.44c0.21,0.28,0.43,0.57,0.63,0.86 v0.01c0,0,0-0.01,0.01,0c0.5,0.69,0.97,1.42,1.39,2.17c0.15,0.25,0.29,0.5,0.4301,0.76c0.17,0.31,0.33,0.61,0.47,0.92 c0.11,0.21,0.21,0.42,0.31,0.64c0.16,0.32,0.3,0.64,0.43,0.96c0.16,0.36,0.3,0.72,0.43,1.09c0.11,0.28,0.21,0.56,0.3,0.85 c0.08,0.23,0.16,0.47,0.2401,0.72c0.1,0.32,0.19,0.64,0.28,0.96c0.06,0.23,0.12,0.45,0.17,0.68c0.1801,0.71,0.33,1.42,0.44,2.15 c0.04,0.21,0.07,0.42,0.1,0.64c0.05,0.32,0.09,0.65,0.12,0.97c0.02,0.14,0.04,0.28,0.05,0.41c0.03,0.35,0.06,0.7,0.07,1.06 c0.02,0.15,0.03,0.29,0.03,0.44C64.99,35.15,65,35.57,65,36z\"/><path fill=\"#D0CFCE\" stroke=\"none\" d=\"M65,36c0,1.61-0.13,3.19-0.39,4.73c-0.71,4.39-2.42,8.45-4.89,11.94c0,0,0,0,0,0.01 c-4.24,6.03-10.73,10.37-18.24,11.8C39.7,64.82,37.87,65,36,65c-0.5,0-1-0.01-1.49-0.04h-0.07c-0.47-0.03-0.94-0.06-1.41-0.11 c-0.04,0-0.08-0.01-0.1201-0.01c-0.39-0.04-0.78-0.09-1.17-0.15c-0.11-0.02-0.23-0.03-0.34-0.05c-0.3-0.05-0.59-0.1-0.89-0.16 c-0.47-0.09-0.94-0.19-1.41-0.31c-0.19-0.04-0.39-0.09-0.58-0.14c-0.26-0.07-0.52-0.15-0.78-0.23c-0.23-0.07-0.47-0.14-0.71-0.22 c-0.2401-0.0699-0.47-0.15-0.7-0.24c-0.19-0.07-0.38-0.14-0.57-0.21c-0.11-0.03-0.21-0.07-0.32-0.12 c-0.39-0.16-0.78-0.32-1.16-0.4901c-0.26-0.12-0.52-0.24-0.77-0.36c-0.26-0.12-0.51-0.25-0.77-0.38 c-0.23-0.12-0.45-0.24-0.68-0.37c-0.26-0.14-0.51-0.28-0.76-0.43c-0.28-0.17-0.56-0.33-0.84-0.51 c-0.08-0.05-0.16-0.11-0.2401-0.16c-0.39-0.25-0.78-0.52-1.15-0.79c-0.32-0.22-0.63-0.46-0.93-0.69 c-0.03-0.02-0.05-0.04-0.08-0.0699c-0.27-0.21-0.53-0.42-0.78-0.64c-0.02-0.01-0.04-0.03-0.0601-0.05 c-0.2599-0.22-0.52-0.45-0.78-0.68c-0.02-0.01-0.03-0.02-0.04-0.04c-0.26-0.25-0.53-0.49-0.78-0.75 c-0.26-0.26-0.51-0.52-0.76-0.78c3.99,2.34,8.6,3.77,13.52,3.95c0.38,0.02,0.76,0.03,1.14,0.03c6.76,0,12.99-2.31,17.92-6.2 c5.99-4.71,10.08-11.73,10.92-19.72c0.11-1.01,0.16-2.04,0.16-3.08c0-2.07-0.22-4.08-0.63-6.02v-0.01 c-1.11-5.25-3.63-9.95-7.15-13.73c1.06,0.63,2.09,1.33,3.06,2.08c0.56,0.44,1.11,0.9,1.64,1.38c0,0,0-0.01,0.01,0 c0.53,0.49,1.04,0.98,1.53,1.5c0.98,1.03,1.9,2.14,2.72,3.31c0.5,0.7,0.97,1.42,1.4,2.17c0.15,0.25,0.29,0.5,0.4301,0.76 c0.17,0.31,0.33,0.61,0.47,0.92c0.11,0.21,0.21,0.42,0.31,0.64c0.16,0.32,0.3,0.64,0.43,0.96c0.16,0.36,0.3,0.72,0.43,1.09 c0.11,0.28,0.21,0.56,0.3,0.85c0.08,0.23,0.16,0.47,0.2401,0.72c0.1,0.32,0.19,0.64,0.28,0.96c0.06,0.23,0.12,0.45,0.17,0.68 c0.1801,0.71,0.33,1.42,0.44,2.15c0.04,0.21,0.07,0.42,0.1,0.64c0.05,0.32,0.09,0.65,0.12,0.97c0.02,0.14,0.04,0.28,0.05,0.41 c0.03,0.35,0.06,0.7,0.07,1.06c0.02,0.15,0.03,0.29,0.03,0.44C64.99,35.15,65,35.57,65,36z\"/></g><g/><g/><g/><g><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M65,36c0,1.61-0.13,3.19-0.39,4.73c-0.71,4.39-2.42,8.45-4.89,11.94c0,0,0,0,0,0.01c-4.24,6.03-10.73,10.37-18.24,11.8 C39.7,64.82,37.87,65,36,65c-0.5,0-1-0.01-1.49-0.04h-0.07c-0.47-0.03-0.94-0.06-1.41-0.11c-0.04,0-0.08-0.01-0.1201-0.01 c-0.39-0.04-0.78-0.09-1.17-0.15c-0.11-0.02-0.23-0.03-0.34-0.05c-0.3-0.05-0.59-0.1-0.89-0.16c-0.47-0.09-0.94-0.19-1.41-0.31 c-0.19-0.04-0.39-0.09-0.58-0.14c-0.26-0.07-0.52-0.15-0.78-0.23c-0.23-0.07-0.47-0.14-0.71-0.22 c-0.2401-0.0699-0.47-0.15-0.7-0.24c-0.19-0.07-0.38-0.14-0.57-0.21c-0.11-0.03-0.21-0.07-0.32-0.12 c-0.39-0.16-0.78-0.32-1.16-0.4901c-0.52-0.23-1.03-0.48-1.54-0.74c-0.23-0.12-0.45-0.24-0.68-0.37 c-0.26-0.14-0.51-0.28-0.76-0.43c-0.28-0.17-0.56-0.33-0.84-0.51c-0.08-0.05-0.16-0.11-0.2401-0.16 c-0.39-0.25-0.78-0.52-1.15-0.79c-0.32-0.22-0.63-0.46-0.93-0.69c-0.03-0.02-0.05-0.04-0.08-0.0699 c-0.27-0.21-0.53-0.42-0.78-0.64c-0.13-0.1-0.26-0.21-0.38-0.32c-0.1-0.09-0.19-0.17-0.29-0.26c-0.02-0.01-0.03-0.02-0.04-0.03 c-0.03-0.03-0.06-0.06-0.09-0.08c-0.02-0.01-0.03-0.03-0.04-0.04c-0.02-0.01-0.03-0.02-0.04-0.04c-0.13-0.11-0.25-0.22-0.37-0.34 c-0.13-0.12-0.25-0.23-0.36-0.35c-0.02-0.02-0.04-0.04-0.05-0.06c-0.1-0.1-0.2-0.19-0.3-0.28 c-0.1517-0.1517-0.2917-0.3225-0.4401-0.4795c-0.0066-0.0068-0.0134-0.0137-0.02-0.0205 c0.0008,0.0004,0.0015,0.0009,0.0023,0.0013c-0.3342-0.3544-0.6707-0.7049-0.9923-1.0813c-0.24-0.28-0.48-0.57-0.71-0.87 c-0.3199-0.41-0.6299-0.82-0.93-1.25c-2.46-3.51-4.16-7.59-4.87-12.01C7.12,39.11,7,37.57,7,36c0-6.17,1.92-11.89,5.22-16.59 C15.41,14.83,19.9,11.22,25.15,9.11C28.5,7.74,32.16,7,36,7c3.83,0,7.49,0.74,10.83,2.1c2.52,1,4.86,2.36,6.97,4.02 c0.56,0.43,1.11,0.89,1.64,1.38h0.01c0.53,0.48,1.04,0.98,1.53,1.5c0.75,0.77,1.44,1.58,2.09,2.44c0.21,0.28,0.43,0.57,0.63,0.86 v0.01c0,0,0-0.01,0.01,0c0.5,0.69,0.97,1.42,1.39,2.17c0.15,0.25,0.29,0.5,0.4301,0.76c0.17,0.31,0.33,0.61,0.47,0.92 c0.11,0.21,0.21,0.42,0.31,0.64c0.16,0.32,0.3,0.64,0.43,0.96c0.16,0.36,0.3,0.72,0.43,1.09c0.11,0.28,0.21,0.56,0.3,0.85 c0.08,0.23,0.16,0.47,0.2401,0.72c0.1,0.32,0.19,0.64,0.28,0.96c0.06,0.23,0.12,0.45,0.17,0.68c0.1801,0.71,0.33,1.42,0.44,2.15 c0.04,0.21,0.07,0.42,0.1,0.64c0.05,0.32,0.09,0.65,0.12,0.97c0.02,0.14,0.04,0.28,0.05,0.41c0.03,0.35,0.06,0.7,0.07,1.06 c0.02,0.15,0.03,0.29,0.03,0.44C64.99,35.15,65,35.57,65,36z\"/><path fill=\"#000000\" stroke=\"none\" d=\"M34.2366,28.0728l-6.1555,4.4722c-1.0515,0.7639-1.4914,2.118-1.0898,3.3541l2.3512,7.2362 c0.4016,1.2361,1.5535,2.0729,2.8532,2.0729h7.6086c1.2997,0,2.4515-0.8369,2.8532-2.0729l2.3512-7.2362 c0.4016-1.2361-0.0383-2.5902-1.0898-3.3541l-6.1555-4.4722C36.7119,27.3089,35.2881,27.3089,34.2366,28.0728z\"/><path fill=\"#000000\" stroke=\"none\" d=\"M46.28,10.18l-8.41,4.12c-0.59,0.28-1.23,0.42-1.87,0.41c-0.57-0.0099-1.14-0.14-1.68-0.39l-8.61-4.1 c-0.42-0.2-0.64-0.67-0.56-1.11C28.5,7.74,32.16,7,36,7c3.83,0,7.49,0.74,10.83,2.1C46.91,9.53,46.7,9.98,46.28,10.18z\"/><path fill=\"#000000\" stroke=\"none\" d=\"M30.51,64.48c-0.47-0.09-0.94-0.19-1.41-0.31c-0.19-0.04-0.39-0.09-0.58-0.14c-0.26-0.07-0.52-0.15-0.78-0.23 c-0.23-0.07-0.47-0.14-0.71-0.22c-0.2401-0.0699-0.47-0.15-0.7-0.24c-0.19-0.07-0.38-0.14-0.57-0.21 c-0.11-0.03-0.21-0.07-0.32-0.12c-0.39-0.16-0.78-0.32-1.16-0.4901c-0.522-0.2304-1.0333-0.4806-1.5386-0.741 c-0.2299-0.1179-0.4554-0.2423-0.6817-0.3661c-0.2557-0.1407-0.509-0.2849-0.7601-0.4332 c-0.2823-0.1659-0.5635-0.3326-0.8397-0.5077c-0.0818-0.0522-0.1609-0.108-0.2422-0.161 c-3.1296-2.0298-5.849-4.6387-7.9878-7.691c0.19-0.34,0.58-0.55,1.01-0.5l9.34,1.14c0.64,0.08,1.24,0.3,1.76,0.65 c0.49,0.33,0.91,0.76,1.22,1.27l2.82,4.59l2.19,3.58C30.79,63.71,30.76,64.16,30.51,64.48z\"/><path fill=\"#000000\" stroke=\"none\" d=\"M15.16,31.37c-0.14,0.58-0.41,1.13-0.79,1.61l-5.9,7.3c-0.28,0.34-0.73,0.46-1.11,0.33C7.12,39.11,7,37.57,7,36 c0-6.17,1.92-11.89,5.22-16.59c0.42,0.05,0.79,0.35,0.88,0.79l2.08,9.33C15.32,30.14,15.31,30.77,15.16,31.37z\"/><path fill=\"#000000\" stroke=\"none\" d=\"M59.72,52.67c0,0,0,0,0,0.01c-4.24,6.03-10.73,10.37-18.24,11.8c-0.26-0.32-0.29-0.78-0.07-1.15L46.4,55.19 c0.3199-0.52,0.74-0.95,1.24-1.28c0.52-0.34,1.11-0.56,1.74-0.64l9.31-1.14C59.13,52.08,59.53,52.31,59.72,52.67z\"/><path fill=\"#000000\" stroke=\"none\" d=\"M65,36c0,1.61-0.13,3.19-0.39,4.73c-0.36,0.08-0.75-0.04-1-0.35l-5.25-6.5l-0.73-0.9c-0.78-0.96-1.08-2.23-0.8-3.45 l1.06-4.75v-0.01l1.04-4.69c0.08-0.39,0.39-0.6899,0.77-0.77c0-0.01,0-0.01,0.01,0c0.5,0.69,0.97,1.42,1.39,2.17 c0.15,0.25,0.29,0.5,0.4301,0.76c0.17,0.31,0.33,0.61,0.47,0.92c0.11,0.21,0.21,0.42,0.31,0.64c0.16,0.32,0.3,0.64,0.43,0.96 c0.16,0.36,0.3,0.72,0.43,1.09c0.11,0.28,0.21,0.56,0.3,0.85c0.08,0.23,0.16,0.47,0.2401,0.72c0.1,0.32,0.19,0.64,0.28,0.96 c0.06,0.23,0.12,0.45,0.17,0.68c0.1801,0.71,0.33,1.42,0.44,2.15c0.04,0.21,0.07,0.42,0.1,0.64c0.05,0.32,0.09,0.65,0.12,0.97 c0.02,0.14,0.04,0.28,0.05,0.41c0.03,0.35,0.06,0.7,0.07,1.06c0.02,0.15,0.03,0.29,0.03,0.44C64.99,35.15,65,35.57,65,36z\"/><line x1=\"36\" x2=\"36\" y1=\"14.7122\" y2=\"27.4999\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"44.9889\" x2=\"56.8125\" y1=\"33.9902\" y2=\"31.3266\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"41.5906\" x2=\"47.6376\" y1=\"44.6172\" y2=\"53.9126\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"30.394\" x2=\"24.3434\" y1=\"44.6059\" y2=\"53.9126\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"27.0013\" x2=\"15.1636\" y1=\"34.0188\" y2=\"31.3728\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/></g>","<g><path fill=\"#fcea2b\" d=\"m41.5853,12.081l-21.3404-.1065c.072.333,2.1834,8.7995,3.9434,17.6035.112.562.239,1.1.373,1.616.04.154.084.3.126.451.1.365.207.721.32,1.064.051.154.1.3.156.453.1213.3413.249.6713.383.99.049.117.1.236.147.35.183.413.376.81.582,1.183l.01.019c.2198.3981.4604.7843.721,1.157l.025.034c.2309.3262.4792.6397.744.939.042.047.085.093.128.139.2358.258.4852.5034.747.735.042.037.084.076.127.112,2.0451,1.6637,4.6303,2.5178,7.264,2.4.9852.0032,1.968-.1,2.931-.308,4.4137-10.1309,4.3193-19.5704,2.613-28.831Z\"/><path fill=\"#f1b31c\" d=\"m41.5853,12.081c.6086,9.4384,1.8951,17.5-3.112,29.828,4.706-1.027,8.576-5.732,9.922-12.46,1.457-7.282,3.1185-16.6378,3.1935-16.9758,0,0-10.0035-.3922-10.0035-.3922Z\"/><path fill=\"#fcea2b\" d=\"m31.4213,51.333h-3.871v7.167h10.958v-7.167h-7.087Z\"/><path fill=\"#f1b31c\" d=\"m43.8833,51.333h-5.375v7.167h5.375v-7.167Z\"/><circle cx=\"36.0373\" cy=\"24.581\" r=\"4\" fill=\"#f1b31c\"/></g><g><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m52.219,11.832c.1581,0,.275.1446.2389.2984-.2055.8767-.9426,4.2922-3.5876,17.5156-1.588,7.942-5.5,12.572-12.833,12.572s-11.245-4.5-12.833-12.443c-2.414-11.8492-3.667-17.943-3.667-17.943h32.6817Z\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m23.0443,31.479s.079-.261-5.421-3.928c-2.528-1.683-5.459-3.9-5.459-6.943s2.5-5.11,5.539-5.11h1.513\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m48.7113,31.766s.079-.261,5.579-3.928c2.528-1.683,5.541-3.9,5.541-6.943-.0146-2.842-2.3303-5.1341-5.1723-5.1196-.0963.0005-.1926.0037-.2887.0096h-2.154\"/><rect x=\"26.5503\" y=\"50.332\" width=\"18.333\" height=\"9.167\" fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"/><circle cx=\"36.0373\" cy=\"24.581\" r=\"5\" fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"/><line x1=\"36.0373\" x2=\"36.0373\" y1=\"50.332\" y2=\"42.218\" fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"/></g>","<g><circle cx=\"36\" cy=\"36\" r=\"29\" fill=\"#F4AA41\"/><path fill=\"#E27022\" d=\"M50.7,11c4.8,5.2,7.8,12.1,7.8,19.8c0,16-13,29-29,29c-5.4,0-10.4-1.5-14.7-4C20.1,61.4,27.7,65,36,65 c16,0,29-13,29-29C65,25.3,59.3,16,50.7,11z\"/></g><g/><g/><g/><g><line x1=\"7\" x2=\"65\" y1=\"36\" y2=\"36\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"36\" x2=\"36\" y1=\"7\" y2=\"65\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M55.2,57.7c-5.6-5.6-9-13.2-9-21.8c0-8.5,3.4-16.2,9-21.8\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M16.9,14.2c5.6,5.6,9,13.3,9,21.8s-3.4,16.2-9,21.8\"/><circle cx=\"36\" cy=\"36\" r=\"29\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/></g>","<g><line x1=\"36\" x2=\"36\" y1=\"4.2\" y2=\"67.7\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"38.9\" x2=\"33.1\" y1=\"35.9\" y2=\"35.9\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"38.9\" x2=\"33.1\" y1=\"30.9\" y2=\"30.9\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"38.9\" x2=\"33.1\" y1=\"40.9\" y2=\"40.9\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"25.6\" x2=\"46.5\" y1=\"58.6\" y2=\"58.6\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"23.6\" x2=\"48.4\" y1=\"16\" y2=\"16\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/></g><g><path fill=\"#A57939\" d=\"M35.9,4c-11,6.4-18.3,18.3-18.3,31.9S25,61.5,36,67.9h0.1C47,61.5,54.4,49.6,54.4,36 C54.4,22.3,47,10.4,35.9,4\"/><path fill=\"#6A462F\" d=\"M41.7,8.1c5.8,7.9,9.2,18.8,7.4,29.1C47,48.9,39.6,58.4,29.9,63.5c1.9,1.7,3.9,3.2,6.1,4.5h0.1 c11-6.4,18.3-18.3,18.3-31.9C54.4,25.3,49.1,14.9,41.7,8.1z\"/><line x1=\"36\" x2=\"36\" y1=\"4.2\" y2=\"67.7\" fill=\"none\" stroke=\"#FFFFFF\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"38.9\" x2=\"33.1\" y1=\"35.9\" y2=\"35.9\" fill=\"none\" stroke=\"#FFFFFF\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"38.9\" x2=\"33.1\" y1=\"30.9\" y2=\"30.9\" fill=\"none\" stroke=\"#FFFFFF\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"38.9\" x2=\"33.1\" y1=\"40.9\" y2=\"40.9\" fill=\"none\" stroke=\"#FFFFFF\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"25.6\" x2=\"46.5\" y1=\"58.6\" y2=\"58.6\" fill=\"none\" stroke=\"#FFFFFF\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"23.6\" x2=\"48.4\" y1=\"16\" y2=\"16\" fill=\"none\" stroke=\"#FFFFFF\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/></g><g/><g/><g/><g><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M35.9,4c-11,6.4-18.3,18.3-18.3,31.9S25,61.5,36,67.9h0.1C47,61.5,54.4,49.6,54.4,36C54.4,22.3,47,10.4,35.9,4\"/></g>"],"space":["<g><circle cx=\"48.4645\" cy=\"23.7594\" r=\"2.1014\" fill=\"#fff\"/><path fill=\"#fcea2b\" d=\"m16.12,48.114c-3.1584,3.1634-4.6518,7.5601-3.97,11.688,4.128.6763,8.5223-.8196,11.683-3.977,3.1584-3.1634,4.6518-7.5601,3.97-11.688-4.128-.6763-8.5223.8196-11.683,3.977Z\"/><path fill=\"#61b2e4\" d=\"m31.973,45.839c-.1919.966-.6657,1.8536-1.3616,2.5507-.3389.3373-.7246.6241-1.1452.8516,2.1626,2.9716,3.7579,6.2847,4.6952,9.7506.7092-.6216,1.3906-1.2786,2.0417-1.9685,1.9136-2.0343,3.5491-4.3376,4.8516-6.8326,1.2507-2.4201,2.1751-4.9922,2.7442-7.6354-3.7285,1.9544-7.7719,3.0771-11.826,3.2837h0Z\"/><path fill=\"#92d3f5\" d=\"m14.923,35.749c-.69.65-1.3472,1.3303-1.9691,2.0383,3.4682.9313,6.7846,2.521,9.7604,4.6784.2264-.414.5104-.7939.8435-1.1281.6949-.6935,1.5791-1.1665,2.5417-1.3598.2106-4.0507,1.3364-8.0899,3.293-11.814.0019-.0037.0037-.0074.0056-.0112-2.645.5687-5.2188,1.4928-7.6405,2.7434-2.496,1.303-4.7999,2.9389-6.8346,4.853h0Z\"/><path fill=\"#ea5a47\" d=\"m34.821,20.747c-5.2314,5.2507-8.3665,12.1635-8.7228,19.233,1.6376-.3318,3.3326.1781,4.515,1.3584,1.186,1.1868,1.6956,2.8903,1.356,4.5332,7.0754-.3609,13.9919-3.5024,19.242-8.7398,6.7117-6.7229,9.8843-16.067,8.4337-24.839-1.7318-.2827-3.5044-.3879-5.2915-.3141-7.1741.2926-14.2097,3.4508-19.532,8.7677l-.0004.0006Zm10.249-.5291c1.8412-1.8413,4.8269-1.8418,6.6687-.0012.0004.0004.0008.0008.0012.0012,1.8418,1.8407,1.8424,4.8255.0012,6.6667-.0004.0004-.0008.0008-.0012.0012-1.8419,1.8404-4.8274,1.8398-6.6685-.0014-1.8417-1.8406-1.8424-4.8252-.0014-6.6665Z\"/><path fill=\"#f1b31c\" d=\"m26.538,52.037c-.8756.9831-1.8894,1.8467-3.0072,2.5617-3.4907,2.2228-7.7244,2.8345-11.441,1.653-.1495,1.1964-.1293,2.3916.06,3.5496,4.128.6763,8.5223-.8195,11.683-3.9769,1.1048-1.1131,2.0209-2.3956,2.7055-3.7874h-.0003Z\"/><path fill=\"#d22f27\" d=\"m26.204,38.687c-.033.4281-.0559.8558-.0684,1.283,1.6271-.316,3.305.1967,4.4773,1.3682,1.186,1.1868,1.6956,2.8903,1.356,4.5332,7.075-.3618,13.9907-3.5038,19.24-8.7412,1.4932-1.5067,2.8266-3.1619,3.9746-4.9339-1.3472,1.2267-2.8051,2.3344-4.353,3.3074-7.5574,4.7109-16.6938,5.8918-24.627,3.1832h.0005Z\"/><path fill=\"#61b2e4\" d=\"m24.039,48.551c.8703-.4372,1.7206-.9178,2.5501-1.438,2.4433-1.5323,4.6776-3.4046,6.6294-5.5552l.0028-.0028c1.8803-2.0911,3.4745-4.4187,4.7329-6.9122.061-.1204.0967-.252.1047-.3867-3.3985-.7533-14.846,10.251-14.0199,14.2949h0Z\"/></g><g><path d=\"m48.405,29.49c-3.2761,0-5.941-2.6641-5.941-5.9392s2.6649-5.9392,5.941-5.9392,5.941,2.6641,5.941,5.9392-2.6649,5.9392-5.941,5.9392Zm0-9.8987c-2.1839,0-3.9607,1.7757-3.9607,3.9595s1.7768,3.9595,3.9607,3.9595,3.9607-1.7758,3.9607-3.9595-1.7769-3.9595-3.9607-3.9595Z\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.949\" d=\"m20.653,45.063c-1.678.7083-3.2222,1.7475-4.5331,3.0508-3.1581,3.1631-4.6517,7.5594-3.9703,11.687,4.128.6762,8.5221-.8196,11.683-3.9769,1.3043-1.3104,2.3446-2.8541,3.0537-4.5318\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.949\" d=\"m14.923,35.749c-.69.65-1.3472,1.3303-1.9691,2.0383,3.4682.9313,6.7846,2.521,9.7604,4.6784.2264-.414.5104-.7939.8435-1.1281.6949-.6935,1.5791-1.1665,2.5417-1.3598.2106-4.0507,1.3364-8.0899,3.293-11.814.0019-.0037.0037-.0074.0056-.0112-2.645.5687-5.2188,1.4928-7.6405,2.7434-2.496,1.303-4.7999,2.9389-6.8346,4.853h0Z\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.949\" d=\"m31.973,45.839c-.1919.966-.6657,1.8536-1.3616,2.5507-.3389.3373-.7246.6241-1.1452.8516,2.1626,2.9716,3.7579,6.2847,4.6952,9.7506.7092-.6216,1.3906-1.2786,2.0417-1.9685,1.9136-2.0343,3.5491-4.3376,4.8516-6.8326,1.2507-2.4201,2.1751-4.9922,2.7442-7.6354-3.7285,1.9544-7.7719,3.0771-11.826,3.2837h0Z\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.949\" d=\"m31.83,43.345c.2696.8863.2506,1.6919.1371,2.5245,7.0759-.3611,13.993-3.5031,19.243-8.7412,6.7106-6.7215,9.8836-16.063,8.4351-24.834-8.7712-1.4365-18.108,1.742-24.823,8.4508-5.2322,5.2509-8.3679,12.164-8.7242,19.234.9413-.1907,1.8984-.0942,2.7693.2387\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.949\" d=\"m37.072,34.196h-.0002c-2.4156,1.2183-4.6724,2.7626-6.6996,4.5844-2.0849,1.8911-3.9,4.0556-5.3844,6.4211-.5039.8031-.9684,1.6273-1.3917,2.4694\"/></g>","<g><circle cx=\"36.1456\" cy=\"36.4282\" r=\"22.5428\" fill=\"#ea5a47\"/><path fill=\"#d22f27\" d=\"M52.5238,20.931A22.5441,22.5441,0,0,1,16.2821,47.0757,22.5423,22.5423,0,1,0,52.5238,20.931Z\"/><path fill=\"#f1b31c\" d=\"M52.7935,22.7551c7.6746-.9256,13.1384-.0236,14.1918,2.8489C68.8256,30.6221,56.51,39.7536,39.4777,46S7.1461,53.2415,5.3059,48.2235c-1.07-2.9183,2.6472-7.2279,9.2958-11.552l.0766,1.5538c-2.5091,2.2523-3.7143,4.3411-3.1382,5.9122,1.4336,3.909,13.3515,3.1334,26.6194-1.7323s22.8616-11.9789,21.428-15.8879c-.5527-1.5073-2.6644-2.3181-5.8112-2.4664Z\"/></g><g><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M17.1562,46.5937A21.5389,21.5389,0,1,1,55.9267,27.9065\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M57.6771,37.1641a21.5552,21.5552,0,0,1-34.892,16.1641\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M52.7935,22.7551c7.6746-.9256,13.1384-.0236,14.1918,2.8489C68.8256,30.6221,56.51,39.7536,39.4777,46S7.1461,53.2415,5.3059,48.2235c-1.07-2.9183,2.6472-7.2279,9.2958-11.552\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M53.7763,24.0509c3.1468.1483,5.2585.9591,5.8112,2.4664,1.4336,3.909-8.16,11.0223-21.428,15.8879S12.9737,48.0465,11.54,44.1375c-.5761-1.5711.6291-3.66,3.1382-5.9122\"/></g>","<g><polygon fill=\"#FCEA2B\" stroke=\"none\" points=\"35.9928,10.7363 27.7913,27.3699 9.4394,30.0436 22.7245,42.9838 19.5962,61.2637 36.0084,52.6276 52.427,61.2515 49.2851,42.9739 62.5606,30.0239 44.2067,27.3638\"/></g><g/><g/><g/><g><polygon fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" points=\"35.9928,10.7363 27.7913,27.3699 9.4394,30.0436 22.7245,42.9838 19.5962,61.2637 36.0084,52.6276 52.427,61.2515 49.2851,42.9739 62.5606,30.0239 44.2067,27.3638\"/></g>","<g><path fill=\"#d0cfce\" stroke=\"none\" d=\"M60.81,45.25c-0.06,0.01-0.12,0.02-0.18,0.03c-0.07,0-0.14,0.01-0.22,0.02c0.08-0.01,0.16-0.02,0.24-0.03 C60.71,45.27,60.76,45.26,60.81,45.25z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M60.65,45.27c-0.01,0-0.01,0-0.02,0.01c-0.07,0-0.14,0.01-0.22,0.02C60.49,45.29,60.57,45.28,60.65,45.27z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M60.81,45.25c-0.06,0.01-0.12,0.02-0.18,0.03c-0.07,0-0.14,0.01-0.22,0.02c0.08-0.01,0.16-0.02,0.24-0.03 C60.71,45.27,60.76,45.26,60.81,45.25z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M61.66,46.07c-0.3,0.3-4.65,0.55-10.69,0.73c-1.62,0.04-3.36,0.08-5.17,0.12c-1.18,0.02-2.4,0.04-3.64,0.05 c-0.42,0-0.83,0.01-1.25,0.01c-0.12,0.01-0.23,0.01-0.35,0.01C39.91,47,39.26,47,38.6,47.01c-1.01,0.01-2.02,0.02-3.04,0.02 c-3.04,0.02-6.08,0.01-8.92-0.02c-1.15-0.01-2.27-0.03-3.34-0.04c-0.16-0.01-0.31-0.01-0.47-0.01c-0.51-0.01-1.01-0.02-1.5-0.03 c-5.98-0.15-10.32-0.42-10.76-0.86c-0.71-0.72-0.77-1.43-0.61-1.98c0.17-0.65,0.61-1.09,0.61-1.09l10.22-7.15h30.65L61.66,43 c0,0,0.29,0.59,0.4,1.28C62.17,44.88,62.14,45.59,61.66,46.07z\"/><polygon fill=\"#9b9b9a\" stroke=\"none\" points=\"40.7961,36.5366 48.75,46.5833 61.2917,45.98 62.1128,44.9583 61.2561,42.7175 51.4,35.85 40.56,36\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M40.97,45.97c-0.21,0-0.42,0.01-0.63,0.01h-0.46c0.21-0.01,0.42-0.01,0.63-0.01H40.97z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M46.22,45.89c-0.11,0-0.22,0-0.32,0.01c-0.2,0-0.4,0-0.6,0.01h-0.17c0.1-0.01,0.2-0.01,0.3-0.01 c0.2,0,0.4-0.01,0.6-0.01H46.22z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M51.36,45.76c0,0.01,0,0.01,0,0.01c-0.23,0-0.46,0.01-0.7,0.02C50.9,45.78,51.13,45.77,51.36,45.76z\"/><path fill=\"#9b9b9a\" stroke=\"none\" d=\"M50.97,46.8c-1.63,3.04-7.43,5.3-14.38,5.39c0.1-0.08,0.19-0.18,0.28-0.27c1.29-1.29,2.42-2.63,3.38-3.96 c0.23-0.33,0.45-0.65,0.66-0.98c1.67-0.01,3.31-0.03,4.89-0.06C47.61,46.88,49.35,46.84,50.97,46.8z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M40.91,46.98c-0.21,0.33-0.43,0.65-0.66,0.98c-0.96,1.33-2.09,2.67-3.38,3.96 c-0.09,0.09-0.18,0.19-0.28,0.27c-0.15,0.01-0.31,0.01-0.47,0.01c-0.87,0-1.73-0.03-2.56-0.1c-0.88-0.07-1.73-0.17-2.55-0.31 c-4.63-0.76-8.24-2.53-9.61-4.75c-0.03-0.04-0.05-0.07-0.07-0.11c1.96,0.04,4.1,0.07,6.34,0.09c0.13,0,0.25-0.01,0.38,0 c4.02,0.03,8.35,0.02,12.51-0.03C40.68,46.99,40.79,46.99,40.91,46.98z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M40.97,45.97c-0.21,0-0.42,0.01-0.63,0.01h-0.46c0.21-0.01,0.42-0.01,0.63-0.01H40.97z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M46.22,45.89c-0.11,0-0.22,0-0.32,0.01c-0.2,0-0.4,0-0.6,0.01h-0.17c0.1-0.01,0.2-0.01,0.3-0.01 c0.2,0,0.4-0.01,0.6-0.01H46.22z\"/><path fill=\"#9b9b9a\" stroke=\"none\" d=\"M40.97,45.97c-0.21,0-0.42,0.01-0.63,0.01c0.06,0,0.12,0,0.17-0.01H40.97z\"/><path fill=\"#9b9b9a\" stroke=\"none\" d=\"M45.9,45.9c-0.2,0-0.4,0-0.6,0.01c0.04,0,0.09,0,0.13-0.01H45.9z\"/><path fill=\"#9b9b9a\" stroke=\"none\" d=\"M46.22,45.89c-0.11,0-0.22,0-0.32,0.01c0.05,0,0.09-0.01,0.13-0.01H46.22z\"/><path fill=\"#9b9b9a\" stroke=\"none\" d=\"M51.94,45.75c-0.11,0-0.22,0-0.33,0.01c0.03,0,0.05,0,0.08-0.01H51.94z\"/><path fill=\"#9b9b9a\" stroke=\"none\" d=\"M53.46,45.7c-0.11,0-0.22,0-0.33,0.01c0.04,0,0.07,0,0.1-0.01H53.46z\"/><path fill=\"#9b9b9a\" stroke=\"none\" d=\"M55.39,45.62c-0.13,0.01-0.26,0.01-0.39,0.02c0.03,0,0.06,0,0.08-0.01C55.19,45.63,55.29,45.63,55.39,45.62 z\"/><path fill=\"#9b9b9a\" stroke=\"none\" d=\"M60.81,45.25c-0.06,0.01-0.12,0.02-0.18,0.03c-0.07,0-0.14,0.01-0.22,0.02c0.08-0.01,0.16-0.02,0.24-0.03 C60.71,45.27,60.76,45.26,60.81,45.25z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M15.65,45.7h-0.08c-0.11-0.01-0.22-0.02-0.32-0.02c0.09,0,0.18,0.01,0.27,0.01 C15.57,45.69,15.61,45.7,15.65,45.7z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M16.25,45.73c-0.21-0.01-0.41-0.02-0.6-0.03c0.18,0.01,0.35,0.02,0.53,0.02 C16.2,45.73,16.23,45.73,16.25,45.73z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M20.9,45.9c-0.07-0.01-0.13-0.01-0.19-0.01h0.18L20.9,45.9z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M40.97,45.97c-0.21,0-0.42,0.01-0.63,0.01h-0.46c0.21-0.01,0.42-0.01,0.63-0.01H40.97z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M46.22,45.89c-0.11,0-0.22,0-0.32,0.01c-0.2,0-0.4,0-0.6,0.01h-0.17c0.1-0.01,0.2-0.01,0.3-0.01 c0.2,0,0.4-0.01,0.6-0.01H46.22z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M51.41,45.76c-0.02,0.01-0.04,0.01-0.05,0.01c-0.23,0-0.46,0.01-0.7,0.02c0.24-0.01,0.47-0.02,0.7-0.03 H51.41z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M60.65,45.27c-0.01,0-0.01,0-0.02,0.01c-0.07,0-0.14,0.01-0.22,0.02C60.49,45.29,60.57,45.28,60.65,45.27z\"/><path fill=\"#9b9b9a\" stroke=\"none\" d=\"M52.04,45.74c-0.03,0-0.07,0-0.1,0.01c-0.11,0-0.22,0-0.33,0.01c0.03,0,0.05,0,0.08-0.01 C51.81,45.75,51.93,45.75,52.04,45.74z\"/><path fill=\"#9b9b9a\" stroke=\"none\" d=\"M53.54,45.69c-0.02,0-0.05,0-0.08,0.01c-0.11,0-0.22,0-0.33,0.01c0.04,0,0.07,0,0.1-0.01 C53.34,45.7,53.44,45.7,53.54,45.69z\"/><path fill=\"#9b9b9a\" stroke=\"none\" d=\"M55.39,45.62c-0.13,0.01-0.26,0.01-0.39,0.02c0.03,0,0.06,0,0.08-0.01C55.19,45.63,55.29,45.63,55.39,45.62 z\"/><path fill=\"#9b9b9a\" stroke=\"none\" d=\"M60.81,45.25c-0.06,0.01-0.12,0.02-0.18,0.03c-0.07,0-0.14,0.01-0.22,0.02c0.08-0.01,0.16-0.02,0.24-0.03 C60.71,45.27,60.76,45.26,60.81,45.25z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M11.03,45.24c-0.02,0-0.04-0.01-0.06-0.01c-0.03-0.01-0.06-0.02-0.09-0.03c0.04,0.01,0.08,0.02,0.13,0.03 C11.02,45.23,11.02,45.24,11.03,45.24z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M15.65,45.7h-0.08c-0.02-0.01-0.03-0.01-0.05-0.01C15.57,45.69,15.61,45.7,15.65,45.7z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M11.03,45.24c-0.02,0-0.04-0.01-0.06-0.01c-0.03-0.01-0.06-0.02-0.09-0.03c0.04,0.01,0.08,0.02,0.13,0.03 C11.02,45.23,11.02,45.24,11.03,45.24z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M15.65,45.7h-0.08c-0.02-0.01-0.03-0.01-0.05-0.01C15.57,45.69,15.61,45.7,15.65,45.7z\"/><path fill=\"#61b2e4\" stroke=\"none\" d=\"M51.4,35.75v0.1H41.03c1.03-4.9-0.35-10.21-4.16-14.01c-0.09-0.1-0.19-0.19-0.29-0.28 C44.45,21.79,50.83,27.96,51.4,35.75z\"/><path fill=\"#92d3f5\" stroke=\"none\" d=\"M41.03,35.85h-20.2v-0.09c0.19-2.67,1.07-5.16,2.46-7.28c2.3-3.5,5.98-6,10.27-6.72 c0.83-0.14,1.69-0.21,2.56-0.21c0.15,0,0.31,0,0.46,0.01c0.1,0.09,0.2,0.18,0.29,0.28C40.68,25.64,42.06,30.95,41.03,35.85z\"/><path fill=\"#92d3f5\" stroke=\"none\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M52.04,41.4402c0,0.31-0.07,0.61-0.2,0.88 c-0.02,0.05-0.04,0.09-0.07,0.14c-0.35,0.61-1.02,1.03-1.77,1.03c-0.18,0-0.35-0.02-0.51-0.08c-0.53-0.13-0.99-0.48-1.25-0.95 c-0.19-0.3-0.29-0.65-0.29-1.02c0-0.55,0.22-1.06,0.6-1.42c0.24-0.27,0.57-0.46,0.94-0.55c0.16-0.05,0.33-0.07,0.51-0.07 C51.12,39.4002,52.04,40.3202,52.04,41.4402z\"/><path fill=\"#92d3f5\" stroke=\"none\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M38.195,41.4402c0,0.31-0.07,0.61-0.2,0.88 c-0.02,0.05-0.04,0.09-0.07,0.14c-0.35,0.61-1.02,1.03-1.77,1.03c-0.18,0-0.35-0.02-0.51-0.08c-0.53-0.13-0.99-0.48-1.25-0.95 c-0.19-0.3-0.29-0.65-0.29-1.02c0-0.55,0.22-1.06,0.6-1.42c0.24-0.27,0.57-0.46,0.94-0.55c0.16-0.05,0.33-0.07,0.51-0.07 C37.275,39.4002,38.195,40.3202,38.195,41.4402z\"/><path fill=\"#92d3f5\" stroke=\"none\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M24.445,41.4402c0,0.31-0.07,0.61-0.2,0.88 c-0.02,0.05-0.04,0.09-0.07,0.14c-0.35,0.61-1.02,1.03-1.77,1.03c-0.18,0-0.35-0.02-0.51-0.08c-0.53-0.13-0.99-0.48-1.25-0.95 c-0.19-0.3-0.29-0.65-0.29-1.02c0-0.55,0.22-1.06,0.6-1.42c0.24-0.27,0.57-0.46,0.94-0.55c0.16-0.05,0.33-0.07,0.51-0.07 C23.525,39.4002,24.445,40.3202,24.445,41.4402z\"/></g><g/><g/><g/><g><path fill=\"none\" stroke=\"#000000\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M52.04,41.4402c0,0.31-0.07,0.61-0.2,0.88 c-0.02,0.05-0.04,0.09-0.07,0.14c-0.35,0.61-1.02,1.03-1.77,1.03c-0.18,0-0.35-0.02-0.51-0.08c-0.53-0.13-0.99-0.48-1.25-0.95 c-0.19-0.3-0.29-0.65-0.29-1.02c0-0.55,0.22-1.06,0.6-1.42c0.24-0.27,0.57-0.46,0.94-0.55c0.16-0.05,0.33-0.07,0.51-0.07 C51.12,39.4002,52.04,40.3202,52.04,41.4402z\"/><path fill=\"none\" stroke=\"#000000\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M38.195,41.4402c0,0.31-0.07,0.61-0.2,0.88 c-0.02,0.05-0.04,0.09-0.07,0.14c-0.35,0.61-1.02,1.03-1.77,1.03c-0.18,0-0.35-0.02-0.51-0.08c-0.53-0.13-0.99-0.48-1.25-0.95 c-0.19-0.3-0.29-0.65-0.29-1.02c0-0.55,0.22-1.06,0.6-1.42c0.24-0.27,0.57-0.46,0.94-0.55c0.16-0.05,0.33-0.07,0.51-0.07 C37.275,39.4002,38.195,40.3202,38.195,41.4402z\"/><path fill=\"none\" stroke=\"#000000\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M24.445,41.4402c0,0.31-0.07,0.61-0.2,0.88 c-0.02,0.05-0.04,0.09-0.07,0.14c-0.35,0.61-1.02,1.03-1.77,1.03c-0.18,0-0.35-0.02-0.51-0.08c-0.53-0.13-0.99-0.48-1.25-0.95 c-0.19-0.3-0.29-0.65-0.29-1.02c0-0.55,0.22-1.06,0.6-1.42c0.24-0.27,0.57-0.46,0.94-0.55c0.16-0.05,0.33-0.07,0.51-0.07 C23.525,39.4002,24.445,40.3202,24.445,41.4402z\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M61.66,46.07c-0.3,0.3-4.65,0.55-10.69,0.73c-1.62,0.04-3.36,0.08-5.17,0.12c-1.18,0.02-2.4,0.04-3.64,0.05 c-0.42,0-0.83,0.01-1.25,0.01c-0.12,0.01-0.23,0.01-0.35,0.01C39.91,47,39.26,47,38.6,47.01c-1.01,0.01-2.02,0.02-3.04,0.02 c-3.04,0.02-6.08,0.01-8.92-0.02c-1.15-0.01-2.27-0.03-3.34-0.04c-0.16-0.01-0.31-0.01-0.47-0.01c-0.51-0.01-1.01-0.02-1.5-0.03 c-5.98-0.15-10.32-0.42-10.76-0.86c-0.71-0.72-0.77-1.43-0.61-1.98c0.17-0.65,0.61-1.09,0.61-1.09l10.22-7.15h30.65L61.66,43 c0,0,0.29,0.59,0.4,1.28C62.17,44.88,62.14,45.59,61.66,46.07z\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M42.16,46.97c-0.42,0.01-0.84,0.01-1.26,0.02c0.01,0,0.01-0.01,0.01-0.01C41.33,46.98,41.74,46.97,42.16,46.97z\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M50.97,46.8c-1.63,3.04-7.43,5.3-14.38,5.39c-0.15,0.01-0.31,0.01-0.47,0.01c-0.87,0-1.73-0.03-2.56-0.1 c-0.88-0.07-1.73-0.17-2.55-0.31c-4.63-0.76-8.24-2.53-9.61-4.75c-0.03-0.04-0.05-0.07-0.07-0.11c0.49,0.01,0.99,0.02,1.5,0.03 c0.16,0,0.31,0,0.47,0.01c1.07,0.01,2.19,0.03,3.34,0.04c2.84,0.03,5.88,0.04,8.92,0.02c1.02,0,2.03-0.01,3.04-0.02 c0.66-0.01,1.31-0.01,1.96-0.02h0.34c0.42-0.01,0.84-0.01,1.26-0.02c1.24-0.01,2.46-0.03,3.64-0.05 C47.61,46.88,49.35,46.84,50.97,46.8z\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M40.91,46.98c0,0,0,0.01-0.01,0.01h-0.34C40.68,46.99,40.79,46.99,40.91,46.98z\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M42.16,46.97c-0.42,0.01-0.84,0.01-1.26,0.02h-0.34c0.12,0,0.23,0,0.35-0.01C41.33,46.98,41.74,46.97,42.16,46.97z\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M51.4,35.75v0.1H20.83v-0.09c0.19-2.67,1.07-5.16,2.46-7.28c2.3-3.5,5.98-6,10.27-6.72c0.83-0.14,1.69-0.21,2.56-0.21 c0.15,0,0.31,0,0.46,0.01C44.45,21.79,50.83,27.96,51.4,35.75z\"/></g>"],"animals":["<g><path fill=\"#f4aa41\" d=\"m24.473,15.1583l-5.0799,1.9352-7.2963,7.901-4.1377,10.5005,1.291,5.3405c1.2554,3.7911,3.3357,6.4338,7.0626,9.2506l2.6874-2.5839s3.8218,7.7098,10.7384,8.9598c0,0,10.2616,1.936,15.5949-.8765,1.4899-.7857,2.5141-1.8291,3.2921-2.5939,2.0702-2.0351,3.033-3.5201,4.5413-5.2395h0s1.6701,1.8077,1.6701,1.8077l1.838-.0557,5.0169-7.2292,2.0032-5.0703-.0215-4.255-2.1735-5.6141-4.8333-7.4167s-2.6368-4.2558-8.1667-3.9167c0,0-6.5-4.8333-11.8333-4.0833s-3.6104-.6772-12.1937,3.2395Z\"/><polygon fill=\"#ea5a47\" points=\"36 46.7324 32.9167 49.1491 30.4167 49.1491 30.9413 53.0386 31.362 56.0539 32.1667 58.3991 35 59.8991 39.5833 59.3158 40.4429 57.1116 41.1441 52.9335 41.9167 49.3158 39.9167 49.5658 36 46.7324\"/><polygon fill=\"#3f3f3f\" points=\"32.5 36.9188 30.9167 40.6688 33.0833 41.9188 34.3333 42.4188 38.6667 42.5855 41.5833 40.3355 39.8333 37.0855 32.5 36.9188\"/></g><g><path d=\"m29.5059,30.1088s-1.8051,1.2424-2.7484.6679c-.9434-.5745-1.2424-1.8051-.6679-2.7484s1.805-1.2424,2.7484-.6679.6679,2.7484.6679,2.7484Z\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m33.1089,37.006h6.1457c.4011,0,.7634.2397.9203.6089l1.1579,2.7245-2.1792,1.1456c-.6156.3236-1.3654-.0645-1.4567-.754\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m34.7606,40.763c-.1132.6268-.7757.9895-1.3647.7471l-2.3132-.952,1.0899-2.9035c.1465-.3901.5195-.6486.9362-.6486\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m30.4364,50.0268s-.7187,8.7934,3.0072,9.9375c2.6459.8125,5.1497.5324,6.0625-.25.875-.75,2.6323-4.4741,1.8267-9.6875\"/><path d=\"m44.2636,30.1088s1.805,1.2424,2.7484.6679,1.2424-1.8051.6679-2.7484c-.5745-.9434-1.805-1.2424-2.7484-.6679s-.6679,2.7484-.6679,2.7484Z\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m25.6245,42.8393c-.475,3.6024,2.2343,5.7505,4.2847,6.8414,1.1968.6367,2.6508.5182,3.7176-.3181l2.581-2.0233,2.581,2.0233c1.0669.8363,2.5209.9548,3.7176.3181,2.0504-1.0909,4.7597-3.239,4.2847-6.8414\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m19.9509,28.3572c-2.3166,5.1597-.5084,13.0249.119,15.3759.122.4571.0755.9355-.1271,1.3631l-1.9874,4.1937c-.623,1.3146-2.3934,1.5533-3.331.4409-3.1921-3.7871-8.5584-11.3899-6.5486-16.686,7.0625-18.6104,15.8677-18.1429,15.8677-18.1429,2.8453-1.9336,13.1042-6.9375,24.8125.875,0,0,8.6323-1.7175,14.9375,16.9375,1.8036,5.3362-3.4297,12.8668-6.5506,16.6442-.9312,1.127-2.7162.8939-3.3423-.4272l-1.9741-4.1656c-.2026-.4275-.2491-.906-.1271-1.3631.6275-2.3509,2.4356-10.2161.119-15.3759\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m52.6309,46.4628s-3.0781,6.7216-7.8049,8.2712\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m19.437,46.969s3.0781,6.0823,7.8049,7.632\"/><line x1=\"36.2078\" x2=\"36.2078\" y1=\"47.3393\" y2=\"44.3093\" fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"/></g>","<g><path fill=\"#f4aa41\" d=\"m58.2673,11.3469s-10.4076,2.3754-15.5743,6.7088c0,0-9-2.5-13.8333.1667,0,0-9.6549-6.7318-15.6549-6.7318,0,0-5.0326,3.75.3216,21.0651,0,0-2.6667,10.6667,1.6667,16.3333.7823,1.023,1.6026,1.9862,2.4217,2.8779,3.4268,3.7306,7.5912,6.7046,12.1937,8.8205l1.696.7797c1.5277.7023,3.1777,1.1,4.8576,1.1707h0c.9304.0392,1.8573-.1359,2.7093-.5118l4.5429-2.0042c3.8082-1.6801,7.2734-4.0872,10.0486-7.1894,1.1585-1.295,2.2135-2.71,2.8635-4.11,4.4736-10.6191,1.5314-16.2624,1.5314-16.2624l1.2356-7.1292c.8094-3.1482.8268-6.4477.0506-9.6043l-1.0768-4.3796Z\"/><path fill=\"#fff\" d=\"m30.8377,47.3355s-7.3487,2.8338-1.0987,9.3338c0,0-1.6971,4.2984,3.5271,4.6285.6823.0431,2.7339.0635,2.7339.0635l1.5797.0367c.4833.0112.9656-.0228,1.4424-.1026,1.8709-.3132,3.9279-.7821,3.181-4.5878,0,0,7.5513-6.3722-1.3654-9.3722l-4.875,2-5.125-1.9999Z\"/></g><g><ellipse cx=\"45.0854\" cy=\"38.1033\" rx=\"1.6461\" ry=\"2.8119\"/><ellipse cx=\"26.8427\" cy=\"38.1033\" rx=\"1.6461\" ry=\"2.8119\"/><polyline fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" points=\"31.9328 47.2287 36.037 50.0204 39.8495 47.2287\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m36.037,50.0204v4.2708s-1.1042,3.6875-5.5417,2.875\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m15.8717,48.4759c-4.8928-7.2535-2.0014-15.8722-2.0014-15.8722,0,0-5.25-14.875-.4375-21.25,0,0,9.1875,1.5,15.6875,7.375,4.5946-1.9379,9.1575-2.0128,13.6875-.1437,6.5-5.875,15.6875-7.375,15.6875-7.375,4.8125,6.375-.4375,21.25-.4375,21.25,0,0,2.8914,8.6187-2.0014,15.8722\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m14.7453,15.1037s12.8125,6.1875,10.0625,11.8125\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m24.8491,50.8753s-9.3615-.458-13.6525,7.5243\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m35.8911,49.8767v4.2708s1.1042,3.6875,5.5417,2.875\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m57.1828,14.96s-12.8125,6.1875-10.0625,11.8125\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m47.2048,54.6836s8.2116,2.2454,8.6795,11.2958\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m48.079,50.7316s9.3615-.458,13.6525,7.5243\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m31.3859,60.7598c3.88,1.6845,5.6481,1.8093,9.3021,0\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m25.4446,54.6836s-8.2116,2.2454-8.6795,11.2958\"/></g>","<g><path fill=\"#3f3f3f\" d=\"m11.9757,19.2767s-.3253,2.1644-.1301,2.4924,1.8214,2.23,2.0817,2.23,1.9516.1968,1.9516.1968l1.1059-2.23-1.3011-2.23-2.4069-.9838-1.3011.5247Z\"/><polygon fill=\"#3f3f3f\" points=\"17.0448 11.1712 16.9178 13.7029 18.5051 15.6777 20.2195 15.6777 21.1084 14.3934 20.7274 11.6315 18.1651 9.7531 17.0448 11.1712\"/><path fill=\"#3f3f3f\" d=\"m26.4409,8.0392l-.5941,1.9061.064,1.8344.9599,1.6638,1.6339.3148,1.0537-1.6586v-2.5959s-1.7239-1.8702-2.0572-1.8702c-.3333.0001-1.0603.4057-1.0603.4057Z\"/><path fill=\"#3f3f3f\" d=\"m34.9124,11.8983l-1.2414,2.1037s.2538,3.1341.5038,3.3841,2.4519.9704,2.4519.9704l1.711-1.9378-.0327-3.3291-1.4997-1.6604-1.8929.469Z\"/><path fill=\"#3f3f3f\" d=\"m22.6372,21.3816c-.0833.25-1.8308,3.208-1.8308,3.208l.3333,3.5833-1.1667,3.3333.6667,3.3333,3.0942,1.6432,2.7207-.9913,2.8051-2.5098,3.8976,1.0272c.7819.1921,1.6072-.036,2.1765-.6054.8367-.8369,1.6757-2.1015,1.624-2.2567-.0833-.25-.2953-3.0006-.2953-3.0006,0,0-2.2417-3.1558-2.9917-2.9892,0,0-1.0548-4.4404-4.2214-5.3571-3.1667-.9167-4.4502-.0844-4.4502-.0844l-2.3622,1.6662Z\"/><path fill=\"#3f3f3f\" d=\"m35.7755,41.081s-1.8649,2.5979-1.6982,2.8479,1.045,3.0372,1.045,3.0372c0,0,2.3333.4567,2.4167.2067.0833-.25.9144-2.2641.9144-2.2641l-.5878-3.0045-2.0901-.8231Z\"/><polygon fill=\"#3f3f3f\" points=\"44.171 35.5855 42.421 38.5021 44.2426 42.1522 47.0877 40.7521 47.5573 38.2245 46.6524 35.9249 44.171 35.5855\"/><path fill=\"#3f3f3f\" d=\"m53.6913,38.0631c-.0833.25-2.3255,3.1891-2.3255,3.1891l.9167,3.1667,1.9583-.5763,1.5032-2.1488-.073-2.5248-1.9797-1.1058Z\"/><path fill=\"#3f3f3f\" d=\"m58.6422,46.0333l-1.798,2.3723-.4994,2.2225.874,1.0738,2.2725-.4745s1.6482-1.9942,1.6482-2.2442-.1249-2.2008-.1249-2.2008l-2.3723-.7492Z\"/><path fill=\"#3f3f3f\" d=\"m40.3568,50.3528c-.1975.9874-1.0242,3.0563-1.0242,3.0563,0,0-2.6816,1.7442-2.8482,2.0775-.1667.3333-.9047,2.7141-.9047,2.7141l.8712,2.6136,2.178,1.5079,4.7916-1.2733,3.3508,3.1162s2.8217,1.2827,4.155-.134c1.3333-1.4167,1.8094-3.8199,1.8094-3.8199l-1.2398-3.1833.3016-4.1215s-1.7229-4.7152-4.3896-5.2152c-2.6667-.4999-6.8013,1.4116-7.0513,2.6616Z\"/></g><g><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m34.2042,25.0412c-.0364-.2205-.0784-.4413-.134-.6623-1.0117-4.0167-4.871-6.5074-8.6199-5.5631s-5.9678,4.9659-4.9561,8.9826c.0557.221.1233.4353.1957.6468-1.1533,1.1787-1.6914,2.9682-1.2371,4.7717.6745,2.6778,3.2473,4.3382,5.7466,3.7087,1.6833-.424,3.7084-3.5122,3.9147-3.5641.2063-.052,3.4527,1.7084,5.136,1.2844,2.4993-.6295,3.9785-3.3106,3.3041-5.9884-.4544-1.8035-1.7759-3.1246-3.35-3.6163Z\"/><ellipse cx=\"19.0131\" cy=\"12.9337\" rx=\"2.6883\" ry=\"3.7635\" transform=\"translate(-3.3852 7.7286) rotate(-21.1428)\" fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"/><ellipse cx=\"14.1245\" cy=\"21.5483\" rx=\"2.6882\" ry=\"3.7633\" transform=\"translate(-9.6423 11.6) rotate(-34.0429)\" fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"/><ellipse cx=\"36.1312\" cy=\"14.8264\" rx=\"3.7634\" ry=\"2.6883\" transform=\"translate(18.6437 49.7474) rotate(-85.7103)\" fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m27.1536,6.7703c1.3727-.2023,3.0014,1.9274,3.2082,3.3312.303,2.0562-.642,4.1486-2.1108,4.3651s-2.9052-1.2749-3.2082-3.3312.642-4.1486,2.1108-4.3651Z\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m52.0157,56.9056c.0775-.2096.1503-.4223.2113-.6418,1.1089-3.991-1.0118-8.0652-4.7367-9.1002s-7.6434,1.3613-8.7523,5.3523c-.061.2196-.1083.4393-.1501.6589-1.5855.4534-2.9387,1.742-3.4366,3.534-.7393,2.6606.6745,5.3768,3.1578,6.0668,1.6725.4647,4.9607-1.2164,5.1656-1.1594s2.1545,3.1934,3.8271,3.6581c2.4832.69,5.0956-.9076,5.8349-3.5682.4978-1.7922.0033-3.5942-1.121-4.8005Z\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2.0001\" d=\"m42.4003,38.5324c.3105-2.0552,1.7481-3.5436,3.2165-3.3236s2.409,2.0648,2.101,4.1204-1.7454,3.5249-3.2165,3.3236c-1.481-.2026-2.4122-2.0604-2.101-4.1204Z\"/><ellipse cx=\"36.2975\" cy=\"44.1831\" rx=\"2.6883\" ry=\"3.7635\" transform=\"translate(-3.2653 2.8982) rotate(-4.3759)\" fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"/><ellipse cx=\"58.7502\" cy=\"48.9832\" rx=\"3.7636\" ry=\"2.6884\" transform=\"translate(-14.6955 70.3534) rotate(-56.043)\" fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2.0001\"/><ellipse cx=\"53.6913\" cy=\"41.331\" rx=\"3.7634\" ry=\"2.6883\" transform=\"translate(-4.3103 76.3571) rotate(-68.7157)\" fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"/></g>","<g><path fill=\"#E27022\" stroke=\"none\" d=\"M17.1228,5.3057L13.7993,9.348l-2.1112,12.8954l2.5003,11.9161l-2.5003,5.0356l0.4829,11.3882l2.2344,4.5 c0,0,6.9323-3.3333,8.7656,3.9167l12.9023,3.8333l13.216-4.25l0.715-2.439l3.5745-2.2785l3.5235,0.5481l2.5725-6.1293L60.3119,42 l-1.7215-6.5752l-0.7776-1.2636l1.4468-4.7673l0.2177-8.9431l-0.9631-9.823l-1.7047-3.8692L54.171,4.6667l-5.1846,6.5784 l-5.482,6.707H42.171l-5.1591-1.4108l-9.1742,0.5805l-4.75-5.0384l-3.2746-5.1667L17.1228,5.3057\"/><path fill=\"#FFFFFF\" stroke=\"none\" d=\"M11.3377,45.0833c6.0422-0.6554,11.9908,4.5417,15.9913,10.0022h0l6.0087,2.2478l2.6566,0.7608 L39.046,57.25l5.7089-2.0836c0,0,5.0827-11.2498,15.9161-10.1392l-2.0833,8.2542L56.9002,55l-3.1875-0.8438l-3.0625,1.3865 l-1.5173,3.0909c0,0-3.5452,4.4554-12.8684,4.4497c-5.8283-0.0036-12.2601-1.375-13.473-4.484 c-0.8609-2.2069-3.8288-5.0369-3.8288-5.0369l-4.493,0.3564L11.3377,45.0833z\"/><path fill=\"#d0cfce\" stroke=\"none\" d=\"M28.796,60.9583c0,0-0.3695,3.5417,1.3778,5.0417c1.7472,1.5,6.4139,1.7083,6.4139,1.7083l5.9583-1.7917 c0,0,1.7083-1.6667,0.875-5l-2.75,0.7917l-6.4972,0.2083L28.796,60.9583z\"/><path fill=\"#FFFFFF\" stroke=\"none\" d=\"M57.671,7.375l-3.0417,2.0417L50.171,15.375L48.6294,22.5l0.2083,1.9583c0,0,5,8.375,11.25,0.2917 l-0.5833-8.5833l-0.9167-7.25L57.671,7.375z\"/><path fill=\"#FFFFFF\" stroke=\"none\" d=\"M14.2714,7.375l3.0417,2.0417l4.4583,5.9583l1.5417,7.125l-0.2083,1.9583c0,0-5,8.375-11.25,0.2917 l0.5833-8.5833l0.9167-7.25L14.2714,7.375z\"/></g><g/><g/><g/><g><path fill=\"#000000\" stroke=\"none\" d=\"M29.0454,41.681c0,0-3.0393,1.5997-4.5092,1.0171c-1.4698-0.5826-2.2313-2.14-1.7007-3.4785 c0.5306-1.3386,2.1522-1.9514,3.622-1.3688C27.9274,38.4334,29.0454,41.681,29.0454,41.681z\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M35.9943,56.9292c-1.513-0.2346-2.7355-0.9125-3.641-2.075v-0.698\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M16.9156,10.2884c0,0,7.7517,5.915,5.3244,13.6668\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M23.6069,58.0941c-1.4877-3.2886-4.481-4.3848-5.1857-4.2282l-3.5235,0.5481c-2.6622-2.6622-3.132-10.1791-3.132-10.1791 c-0.4337-4.7705,1.0302-8.0757,2.4227-10.0754l-0.3869-0.7301c-2.5056-6.1857-1.0179-15.6601-0.4698-21.6892 c0.3975-4.3723,2.6068-5.9162,3.7911-6.4345c0.4153-0.1818,0.8959-0.0599,1.1789,0.2943 c1.2956,1.6213,5.3162,6.5744,9.1241,10.4468c1.6822,1.7107,2.4508,3.2218,2.748,4.4518\"/><path fill=\"#000000\" stroke=\"none\" d=\"M42.9546,41.681c0,0,3.0393,1.5997,4.5092,1.0171c1.4698-0.5826,2.2313-2.14,1.7007-3.4785s-2.1522-1.9514-3.622-1.3688 C44.0726,38.4334,42.9546,41.681,42.9546,41.681z\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M36.0733,61.7083v-4.7791c1.513-0.2346,2.7355-0.9125,3.641-2.075v-0.698\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M43.7468,50.1562l1.1745,5.8367c0,0,0,6.6555-7.4385,6.1074h-2.8978c-7.4385,0.5481-7.4385-6.1074-7.4385-6.1074l1.1745-5.8367\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M55.0844,10.2884c0,0-7.7517,5.915-5.3244,13.6668\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M48.3931,58.0941c1.4877-3.2886,4.481-4.3848,5.1857-4.2282l3.5235,0.5481c2.6622-2.6622,3.132-10.1791,3.132-10.1791 c0.4336-4.7691-1.0294-8.0739-2.4216-10.0737l0.3858-0.7317c2.5056-6.1857,1.0179-15.6601,0.4698-21.6892 c-0.3975-4.3723-2.6068-5.9162-3.7911-6.4345C54.4619,5.1239,53.9814,5.2458,53.6983,5.6 c-1.2956,1.6213-5.3162,6.5744-9.1241,10.4468c-1.7324,1.7618-2.4958,3.3118-2.7734,4.5611\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M41.6672,65.4494c-3.804,2.0509-7.418,2.0886-10.8055,0\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M29.0178,17.9521c0,0,6.0552-3.1842,13.7809-0.1044\"/></g>"],"dinos":["<g><path fill=\"#B1CC33\" stroke=\"#B1CC33\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"1.8\" d=\"M38,55c0,0,9,4,12-8S38,55,38,55z\"/><path fill=\"#B1CC33\" stroke=\"#B1CC33\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"1.8\" d=\"M39,48c0,0,6.125-2.6797,6.6514,0.8374c0.1505,1.0055-0.2436,2.0175-0.9153,2.7807l-4.736,5.3818L40,57 c0.0019,0.0006,6.4303,1.91,5.1667,3.4167C43.0002,62.9998,34.0014,61.0003,34,61l0-0.0001l1-4.9998L34.9999,56 C19.003,59.9992,15.0015,45.0056,15,45h0c0.005,0.0041,14.1677,11.6649,20.0833,1.8333C41,37,38.1667,17.1667,50.5833,17.5833 c8.358,0.2805,9.844,4.7143,9.9224,7.583c0.0381,1.393-0.2557,2.417-0.2557,2.417c-0.0778,0.5793-0.1852,1.086-0.3188,1.53 c-1.1539,3.8354-4.2597,2.9991-7.0978,3.97c-3.1663,1.0832-2.0836,4.4158-2.0833,4.4167l0.0001,0C56.5,36.0001,56,43,54,41 c-2-2-3.1666,1.3332-3.1666,1.3332l-0.0001,0.0002C50.8333,42.3336,51,49,49,51\"/><path fill=\"#5C9E31\" stroke=\"#5C9E31\" stroke-miterlimit=\"10\" stroke-width=\"1.8\" d=\"M51,43c2,0,4,3,4,3 c1,4-4.4167,8.3333-4.4167,8.3333S62,57,52.6667,57.3333C43.3333,57.6667,46,55,46,55l0,0c0,0,3-2,5-9\"/></g><g/><g/><g/><g><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M43,41c0,0,2-3.8333,4.5-1.4167C50,42,47,43,46,42s-2,2-2,2\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M39,48c0,0,6.125-2.6797,6.6514,0.8374c0.1505,1.0055-0.2436,2.0174-0.9153,2.7807L40,57c0,0,6.4305,1.9098,5.1667,3.4167 C43,63,34,61,34,61l1-5c-16,4-20-11-20-11s14.1667,11.6667,20.0833,1.8333s3.0833-29.6667,15.5-29.25 c8.358,0.2805,9.844,4.7143,9.9224,7.583c0.0381,1.393-0.2557,2.417-0.2557,2.417c-0.0778,0.5793-0.1852,1.086-0.3188,1.53 c-1.1539,3.8354-4.2597,2.9991-7.0978,3.97C49.6667,34.1667,50.75,37.5,50.75,37.5C56.5,36,56,43,54,41 s-3.1667,1.3333-3.1667,1.3333S51,49,49,51\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M54.5,44.8333c3.5,2.8333-3.9167,9.5-3.9167,9.5S62,57,52.6667,57.3333C43.3333,57.6667,46,55,46,55\"/></g>","<g><path fill=\"#A57939\" stroke=\"none\" d=\"M5,52c0,0,15-3,17-10s14.6667-11.1667,20.8333-8.5833c0,0,6.3333,0.5833,8.25-7.4167C53,18,55,9,62,10 s6.1667,6.3333,4.0833,7.1667C64,18,61,18,60,19.5s-2.1667,16.1667-6.5833,19.8333c0,0-4.9167,6.5-4.6667,9.5833 C49,52,50.5833,61.25,47,61c-3.6293-0.2532-3-7-3-8s-8-3-11-1s-2.1667,8-4.5833,8.5S23.5,60.8333,22.75,59.9167 C22,59,23.3494,53.229,22.25,51.25\"/></g><g/><g/><g/><g><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5,52c0,0,15-3,17-10 s14.6667-11.1667,20.8333-8.5833c0,0,6.3333,0.5833,8.25-7.4167C53,18,55,9,62,10s6.1667,6.3333,4.0833,7.1667C64,18,61,18,60,19.5 s-2.1667,16.1667-6.5833,19.8333c0,0-4.9167,6.5-4.6667,9.5833C49,52,50.5833,61.25,47,61c-3.6293-0.2532-3-7-3-8s-8-3-11-1 s-2.1667,8-4.5833,8.5S23.5,60.8333,22.75,59.9167C22,59,23.3494,53.229,22.25,51.25\"/></g>","<g><path fill=\"#D0CFCE\" stroke=\"#D0CFCE\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"1.8\" d=\"M28.8,9.1c-0.4-0.7,1.6-4.2,4.6-4.4c3-0.3,5.2,1.5,4.4,3.6s-2.1,2.2-2.8,2.3l3.2,1.7c-0.8,2.1-7.8,2.7-6.5,5.6l-4,0.4 c0.1-1.5,0-3.7-1.5-4.9c-1.1-0.9-2.8-1.1-4.2-1.6c-2-0.7-2-2.7-1.4-4C21.3,6.4,22.4,5,24,5c1,0,2,0,3,1L28.8,9.1z\"/><polygon fill=\"#9B9B9A\" points=\"63,57 56.4,49.1 53,40 45,34 40,34 36,22 40,34 36,22 32,24 24.2,22.1 19,34 17,46 9,57\"/><path fill=\"#EA5A47\" d=\"M33.7,22.3c1.4,0.4,0.8,2.1,1.5,4.4c0.4,1.4,0.3,1.8,0.3,2c-0.5,1.3-1.2,1.2-1.7,2.4 c-0.4,1.1,0.7,1.6,0.4,3s-1.7,2.7-2.7,2.4c-0.8-0.2-1.1-1.3-1.3-1.8c-0.5-1.8,0.2-3.5,0.4-4.1c0.8-1.8,1.7-2.2,1.5-3.3 c-0.1-1-1-1.6-1.3-1.8c-0.8-0.6-2.1-1-3.1-0.6c-1.9,0.8-2.4,4.6-2,7.4c0.4,2.2,2.8,7,2.2,8.7c-0.2,0.7-2-3.1-3.2-1.5 c-1.1,1.4,0.4,5.3-1.8,6.6c-1.3,0.7-1.7-3.9-1.8-3.9c-0.3,0-1,1.5-0.3-2.1c0.4-2.4,1.7-1.4,2.1-4c0.2-1.5,0.1-4-0.1-6 c-0.3-3-1.4-2.7-1.1-5.1c0.1-0.8,0.8-1.5,2-2.1c0.5-0.2,0.2-1.9,2.4-1.8c3.6,0.2,4.1,1.4,5.2,1.3C32.7,22.3,33,22.1,33.7,22.3z\"/></g><g/><g/><g/><g><polyline fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" points=\"63,56 56.4,49.1 53,40\"/><polyline fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" points=\"24,22 19,34 17,46 9,56\"/><polyline fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" points=\"40,34 36,22 34.4,22.8\"/><polyline fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" points=\"40,34 45,34 53,40 52,46 53,51 51,53 48,56\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"1.8\" d=\"M33.7,22.3c1.4,0.4,0.8,2.1,1.5,4.4c0.4,1.4,0.3,1.8,0.3,2c-0.5,1.3-1.2,1.2-1.7,2.4c-0.4,1.1,0.7,1.6,0.4,3s-1.7,2.7-2.7,2.4 c-0.8-0.2-1.1-1.3-1.3-1.8c-0.5-1.8,0.2-3.5,0.4-4.1c0.8-1.8,1.7-2.2,1.5-3.3c-0.1-1-1-1.6-1.3-1.8c-0.8-0.6-2.1-1-3.1-0.6 c-1.9,0.8-2.4,4.6-2,7.4c0.4,2.2,2.8,7,2.2,8.7c-0.2,0.7-2-3.1-3.2-1.5c-1.1,1.4,0.4,5.3-1.8,6.6c-1.3,0.7-1.7-3.9-1.8-3.9 c-0.3,0-1,1.5-0.3-2.1c0.4-2.4,1.7-1.4,2.1-4c0.2-1.5,0.1-4-0.1-6c-0.3-3-1.4-2.7-1.1-5.1c0.1-0.8,0.8-1.5,2-2.1 c0.5-0.2,0.2-1.9,2.4-1.8c3.6,0.2,4.1,1.4,5.2,1.3C32.7,22.3,33,22.1,33.7,22.3z\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M24.2,16.3c-0.4-1.6-3.3-2.4-6.5-1.7\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M35,18.9c2.7-1.9,6.7-0.9,8.9,2.3\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M22.8,19.9c-1.5-1.6-8.5-4.1-9.8,4.2\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M27,6c-1-1-2-1-3-1c-1.6,0-2.7,1.4-3.4,2.7C20,9,20,11,22,11.7c1.3,0.5,3.1,0.7,4.2,1.6c1.5,1.2,1.5,3.4,1.5,4.9\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M34.9,10.5c0.7-0.1,2-0.2,2.8-2.3s-1.4-3.9-4.4-3.6s-5,3.8-4.6,4.4\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M31.6,17.9c-1.3-2.9,5.7-3.5,6.5-5.6\"/></g>","<g><path fill=\"#fff\" d=\"M36,64c12.8581,0,20.9609-11.9773,20.9609-26.1572,0-14.6517-8.4161-29.8428-20.9609-29.8428S15.0391,23.1911,15.0391,37.8428c0,14.1799,8.1028,26.1572,20.9609,26.1572Z\"/><path fill=\"#d0cfce\" d=\"M56.96,37.84c0,14.18-8.1,26.16-20.96,26.16s-20.96-11.98-20.96-26.16c2.8265,16.4205,17.6473,18.9809,26.64,12.4926,9.6972-6.9967,12.8887-31.6694-.01-41.2326,9.34,3.73,15.29,16.4301,15.29,28.7401h0Z\"/></g><g><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M36,64c12.8581,0,20.9609-11.9773,20.9609-26.1572,0-14.6517-8.4161-29.8428-20.9609-29.8428S15.0391,23.1911,15.0391,37.8428c0,14.1799,8.1028,26.1572,20.9609,26.1572Z\"/></g>"],"art":["<g><path fill=\"#A57939\" stroke=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M59,36c-0.25-0.75-0.71-2.1-2-3c-1.56-1.08-3.63-1.01-4-1c-0.76,0.03-1.18,0.16-2,0c-0.58-0.12-1.53-0.3-2-1 c-0.4-0.59-0.15-1.08,0-3c0.12-1.51,0.17-2.27,0-3c-0.37-1.58-1.49-2.56-2-3c-1.05-0.92-2.38-1.56-5-2c-1.82-0.31-4.75-0.6-9,0 c-2.15,0.3-5.46,0.87-8,1.72c-1.77,0.58-3.74,1.41-6,3c-0.02,0.01-0.04,0.02-0.05,0.03c-3.44,2.24-5.39,6.2-5.22,10.31 C14.64,57.13,54.56,59.91,59,41C59.09,40.4,59.79,38.35,59,36z M38.21,30.12c-1.53,0-2.76-1.24-2.76-2.76 c0-1.53,1.23-2.76,2.76-2.76h2.71c1.52,0,2.76,1.23,2.76,2.76c0,0.76-0.31,1.45-0.81,1.95s-1.19,0.81-1.95,0.81H38.21z\"/><circle cx=\"20\" cy=\"33\" r=\"3\" fill=\"#61B2E4\" stroke=\"none\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><circle cx=\"25\" cy=\"42\" r=\"3\" fill=\"#5C9E31\" stroke=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><circle cx=\"35\" cy=\"45\" r=\"3\" fill=\"#FCEA2B\" stroke=\"none\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><circle cx=\"45\" cy=\"44\" r=\"3\" fill=\"#D22F27\" stroke=\"none\" stroke-miterlimit=\"10\" stroke-width=\"2\"/></g><g/><g/><g/><g><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M59,36c-0.25-0.75-0.71-2.1-2-3c-1.56-1.08-3.63-1.01-4-1c-0.76,0.03-1.18,0.16-2,0c-0.58-0.12-1.53-0.3-2-1 c-0.4-0.59-0.15-1.08,0-3c0.12-1.51,0.17-2.27,0-3c-0.37-1.58-1.49-2.56-2-3c-1.05-0.92-2.38-1.56-5-2c-1.82-0.31-4.75-0.6-9,0 c-2.15,0.3-5.46,0.87-8,1.72c-1.77,0.58-3.74,1.41-6,3c-0.02,0.01-0.04,0.02-0.05,0.03c-3.44,2.24-5.39,6.2-5.22,10.31 C14.64,57.13,54.56,59.91,59,41C59.09,40.4,59.79,38.35,59,36z M38.21,30.12c-1.53,0-2.76-1.24-2.76-2.76 c0-1.53,1.23-2.76,2.76-2.76h2.71c1.52,0,2.76,1.23,2.76,2.76c0,0.76-0.31,1.45-0.81,1.95s-1.19,0.81-1.95,0.81H38.21z\"/><circle cx=\"20\" cy=\"33\" r=\"3\" fill=\"none\" stroke=\"#000000\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><circle cx=\"25\" cy=\"42\" r=\"3\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><circle cx=\"35\" cy=\"45\" r=\"3\" fill=\"none\" stroke=\"#000000\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><circle cx=\"45\" cy=\"44\" r=\"3\" fill=\"none\" stroke=\"#000000\" stroke-miterlimit=\"10\" stroke-width=\"2\"/></g>","<g><path fill=\"#a57939\" stroke=\"#a57939\" stroke-miterlimit=\"10\" stroke-width=\"2.0863\" d=\"M27.4213,52.1412 c-1.1308,3.0553-2.6697,4.5942-5.6852,6.1955s-11.2248-0.0889-9.5042-1.8095c2.3084-2.3084,3.6596-3.1597,3.2026-6.031 c-0.5824-3.6603,4.2087-6.1331,4.2087-6.1331s2.0935-1.1422,4.1931-0.8545c2.2812,0.3125,4.9498,4.9497,4.9498,4.9497 L27.4213,52.1412z\"/><path fill=\"#92d3f5\" stroke=\"none\" d=\"M45.8565,36.851c-7.0488,6.5155-12.4768,10.4313-15.8703,12.6073l-7.6389-7.6751 c2.1789-3.3949,6.0918-8.8147,12.5932-15.8482c4.7694-5.1598,9.7635-9.9137,13.8015-12.4485 c2.9438-1.8479,6.597-1.5717,8.8659,0.6971l0,0c2.2688,2.2688,2.5449,5.9222,0.697,8.8659 C55.7702,27.0875,51.0162,32.0816,45.8565,36.851\"/><polygon fill=\"#61b2e4\" stroke=\"none\" points=\"26.8108,35.5092 36.0461,44.7445 30.2121,48.8995 22.9382,41.5646\"/></g><g/><g/><g/><g><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M45.8565,36.851c-7.0488,6.5155-12.4768,10.4313-15.8703,12.6073l-7.6389-7.6751c2.1789-3.3949,6.0918-8.8147,12.5932-15.8482 c4.7694-5.1598,9.7635-9.9137,13.8015-12.4485c2.9438-1.8479,6.597-1.5717,8.8659,0.6971l0,0 c2.2688,2.2688,2.5449,5.9222,0.697,8.8659C55.7702,27.0875,51.0162,32.0816,45.8565,36.851\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M19.6432,44.3631c0,0-4.7911,2.4728-4.2087,6.1331c0.457,2.8713-0.8942,3.7226-3.2026,6.031 c-1.7206,1.7206,6.4887,3.4108,9.5042,1.8095s4.5544-3.1402,5.6852-6.1955\"/><line x1=\"27.4304\" x2=\"36.5691\" y1=\"35.2569\" y2=\"44.3958\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/></g>","<g><polygon fill=\"#EA5A47\" stroke=\"none\" points=\"15.8466,59.4954 23.6833,54.7934 16.8591,47.9691 12.157,55.8059\"/><polygon fill=\"#EA5A47\" stroke=\"none\" points=\"24.5167,55.6267 16.8728,47.9829 16.0257,47.1357 53.2503,9.9112 61.7413,18.4022\"/><polygon fill=\"#d22f27\" stroke=\"none\" points=\"28.4351,51.7084 20.7912,44.0645 19.9441,43.2174 49.7237,13.4377 58.2147,21.9287\"/></g><g/><g/><g/><g><polygon fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2.2166\" points=\"24.5167,55.6267 16.8728,47.9829 16.0257,47.1357 53.2503,9.9112 61.7413,18.4022\"/><polygon fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2.2166\" points=\"15.8466,59.4954 23.6833,54.7934 16.8591,47.9691 12.157,55.8059\"/><line x1=\"19.9938\" x2=\"28.4028\" y1=\"43.267\" y2=\"51.676\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2.2166\"/><line x1=\"49.7735\" x2=\"58.1823\" y1=\"13.4874\" y2=\"21.8964\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2.2166\"/></g>","<g><path fill=\"#ea5a47\" d=\"m64.05 7.95v5.121c-27.56 0-51.03 23.42-51.03 50.98h-5.067c0-30.99 25.11-56.1 56.1-56.1z\"/><path fill=\"#f4aa41\" d=\"m64.05 13.07v5.12c-24.4 0-45.86 21.46-45.86 45.86h-5.178c0-27.56 23.48-50.98 51.04-50.98z\"/><path fill=\"#fcea2b\" d=\"m64.05 18.19v5.121c-21.51 0-40.74 19.25-40.74 40.74h-5.121c0-24.4 21.46-45.86 45.86-45.86z\"/><path fill=\"#b1cc33\" d=\"m64.05 23.31v5.121c-18.88 0-35.61 16.83-35.61 35.62l-5.131-8.8e-5c0-21.48 19.23-40.74 40.74-40.74z\"/><path fill=\"#92d3f5\" d=\"m64.05 28.43v5.12c-16.34 0-30.5 14.22-30.5 30.5h-5.11c0-18.78 16.73-35.62 35.61-35.62z\"/><path fill=\"#b399c8\" d=\"m64.05 33.55v5.121c-14.02 0-25.38 11.36-25.38 25.38h-5.121c0-16.28 14.16-30.5 30.5-30.5z\"/></g><g stroke-miterlimit=\"10\"><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"m64.05 7.95v5.121c-27.56 0-51.04 23.42-51.04 50.98h-5.063c0-30.99 25.11-56.1 56.1-56.1z\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"m64.05 13.07v5.12c-24.4 0-45.86 21.46-45.86 45.86h-5.174c0-27.56 23.47-50.98 51.03-50.98z\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"m64.05 18.19v5.121c-21.51 0-40.74 19.25-40.74 40.74h-5.121c0-24.4 21.46-45.86 45.86-45.86z\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"m64.05 23.31v5.121c-18.88 0-35.61 16.83-35.61 35.62h-5.131c0-21.48 19.23-40.74 40.74-40.74z\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"m64.05 28.43v5.12c-16.34 0-30.5 14.22-30.5 30.5h-5.11c0-18.78 16.73-35.62 35.61-35.62z\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"m64.05 33.55v5.121c-14.02 0-25.38 11.36-25.38 25.38h-5.121c0-16.28 14.16-30.5 30.5-30.5z\"/></g>"],"music":["<g><polygon fill=\"#3F3F3F\" stroke=\"none\" points=\"26.324,22.8117 51.6188,17.5516 51.5493,12.875 26.105,18.5407\"/><circle cx=\"20.7561\" cy=\"51.59\" r=\"5.7867\" fill=\"#3F3F3F\" stroke=\"none\"/><circle cx=\"46.2061\" cy=\"46.0127\" r=\"5.787\" fill=\"#3F3F3F\" stroke=\"none\"/></g><g/><g/><g/><g><polygon fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" points=\"51.6188,17.5516 26.1735,23.2225 26.105,18.5407 51.5493,12.875\"/><circle cx=\"20.7563\" cy=\"51.5901\" r=\"5.7868\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"26.105\" x2=\"26.5431\" y1=\"18.5407\" y2=\"51.5901\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><circle cx=\"46.2063\" cy=\"46.0129\" r=\"5.7868\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"51.555\" x2=\"51.9931\" y1=\"12.9635\" y2=\"46.0129\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/></g>","<g><path fill=\"#EA5A47\" stroke=\"none\" d=\"M33.0751,48.3332c2.3369-0.9131,4.8243-2.2304,5.129-2.5878c0.1191-0.1397,0.4553-2.3764,0.5129-2.4946 c-0.7393,0.0313-3.7431-0.8208-4.6161-1.0258c-1.6875-0.3936-4.8421-5.8358-4.1731-7.7401c0.5156-1.4688,3.6835-7.064,3.6835-7.064 s-0.7169-0.5712-1.8532-0.381c-0.7231,0.1211-1.979,0.9429-2.1567,1.1504c-1.1455,1.3379-3.2272,6.7993-4.1032,8.1597 c-0.9385,1.4541-2.1622,2.3806-3.8234,2.6111c-1.4424,0.2002-3.8944,0.9347-6.2714,2.7277 c-2.7988,2.1103-5.1115,8.3067-1.632,13.0323c0.8211,1.1148,6.0415,4.6902,10.2347,3.7535 c3.6128-0.807,6.8309-3.4038,7.1573-6.4578C31.172,51.9363,31.0877,49.1105,33.0751,48.3332z\"/><ellipse cx=\"22.7523\" cy=\"47.7785\" rx=\"5.4696\" ry=\"5.4697\" transform=\"matrix(0.9999 -0.0158 0.0158 0.9999 -0.751 0.3649)\" fill=\"#FFFFFF\" stroke=\"none\"/><path fill=\"#a57939\" stroke=\"none\" d=\"M58.0079,14.3936c-0.0625,0.0039-5.6067,2.7464-6.6692,3.3904c-1.541,1.0313-2.5045,3.7789-2.6432,3.9146 L25.7707,43.4169c0.4381,0.4626,1.6745,1.6307,1.9548,2.1867l23.8869-22.6504c-0.0875-0.0921,1.9549-0.3566,3.3142-1.9664 c0.3054-0.3617,1.1459-1.5814,2.2198-2.5511c1.074-0.9697,2.3815-1.6893,2.75-2.4187 C60.653,14.5197,58.5105,14.3609,58.0079,14.3936z\"/><path fill=\"#EA5A47\" stroke=\"none\" d=\"M32.3593,41.0938c-0.0801,0.0596-0.1554,0.1276-0.2148,0.2158c0.0591-0.0877,0.1377-0.1514,0.2163-0.2139 L32.3593,41.0938z\"/><path fill=\"#EA5A47\" stroke=\"none\" d=\"M28.0857,44.1359c-0.0324-0.0472-0.0661-0.0932-0.0998-0.1396 C28.0196,44.0427,28.0533,44.0888,28.0857,44.1359z\"/></g><g/><g/><g/><g><line x1=\"20.8988\" x2=\"23.2618\" y1=\"46.9101\" y2=\"49.1996\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M52.3386,22.2637c0,0,1.3423-0.0178,2.2362-0.5799c0.8941-0.562,1.0716-1.066,1.0637-1.542s0.7356-2.3263,2.3062-2.7289 c1.5708-0.4028,2.4877-1.2997,2.128-2.2506c-0.3598-0.9508-2.1142-0.6964-2.5538-0.6898 c-0.4397,0.0066-3.1881,1.6713-3.1881,1.6713s-3.5106,2.3476-3.9665,2.9203c-0.4557,0.5728-0.5206,1.0193-0.5206,1.0193 L26.2045,43.1537\"/><ellipse cx=\"22.7523\" cy=\"47.7785\" rx=\"5.4696\" ry=\"5.4697\" transform=\"matrix(0.9999 -0.0158 0.0158 0.9999 -0.751 0.3649)\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M30.1674,38.3398c-0.6184-1.6047-0.6911-3.4291-0.0767-5.1788c0.8444-2.4046,3.2143-5.4706,3.2061-5.5286 c-0.036-0.2561-2.4648-0.6658-4.0754,1.2156c-1.6106,1.8814-1.9747,3.5723-2.4923,4.7953 c-0.5176,1.223-0.6392,1.4866-1.4695,2.7743c-0.7821,1.2129-2.3485,2.2248-3.7112,2.4143 c-1.3627,0.1894-3.5669,0.6275-6.2429,2.6452c-3.1998,2.4126-5.3398,8.5125-1.546,13.664 c1.7344,2.355,6.314,5.2555,11.4299,3.3176c3.7656-1.4265,5.0953-3.635,5.5126-4.6436c0.5701-1.378,0.8892-3.167,0.9549-3.6356 c0.1095-0.7806-0.0477-1.6554,1.7554-2.3604c1.8031-0.7051,3.987-1.7099,4.5698-2.3949c0.6572-0.7728,0.7207-1.5145,0.4697-2.1736 c-0.1366,0.0216-1.1682,0.3697-3.1645-0.0969c-1.9963-0.4665-2.0687-1.1225-2.3125-1.2866\"/></g>","<g><path fill=\"#EA5A47\" stroke=\"none\" d=\"M58.7568,59.0674V37.2188H13.0186v21.8486H58.7568z\"/><path fill=\"#a57939\" stroke=\"none\" d=\"M23.9005,30.2761c0.29,0.3853,0.7142,0.6346,1.1935,0.7018c0.4827,0.0603,0.9547-0.0583,1.3402-0.3482 c0,0,0,0,0-0.0018c0.7974-0.5995,0.9565-1.7382,0.3554-2.5346c-0.3554-0.4713-0.8982-0.7197-1.4463-0.7197 c-0.3802,0-0.762,0.1186-1.0874,0.3643C23.4585,28.339,23.2994,29.4786,23.9005,30.2761z\"/><path fill=\"#a57939\" stroke=\"none\" d=\"M46.5235,30.5392c0.6857-0.8679,0.5369-2.1317-0.3291-2.8185c-0.3683-0.2909-0.8073-0.432-1.2443-0.432 c-0.5917,0-1.1793,0.2617-1.5752,0.7613c-0.6857,0.8669-0.5389,2.1307,0.3293,2.8185c0.4231,0.331,0.9502,0.4897,1.4772,0.4193 C45.7143,31.225,46.1904,30.9585,46.5235,30.5392z\"/><path fill=\"#D22F27\" stroke=\"none\" d=\"M47.6811,54.4482l-0.0571,4.6192h11.1328V37.2188H47.894l-0.0804,6.5125l0.08-0.0038c0.5527,0,1,0.4473,1,1 v8.7442c0,0.5527-0.4473,1-1,1L47.6811,54.4482z\"/></g><g/><g/><g/><g><line x1=\"35.8153\" x2=\"35.8153\" y1=\"44.728\" y2=\"53.4721\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"23.7365\" x2=\"23.7365\" y1=\"44.728\" y2=\"53.4721\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"47.894\" x2=\"47.894\" y1=\"44.728\" y2=\"53.4721\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><ellipse cx=\"25.3401\" cy=\"29.1791\" rx=\"2\" ry=\"2\" transform=\"matrix(0.7984 -0.6021 0.6021 0.7984 -12.4611 21.141)\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"38.7754\" x2=\"50.2932\" y1=\"19.0461\" y2=\"10.3592\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"26.9369\" x2=\"31.9778\" y1=\"27.9748\" y2=\"24.1728\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><ellipse cx=\"44.9438\" cy=\"29.2341\" rx=\"2\" ry=\"2\" transform=\"matrix(0.6204 -0.7843 0.7843 0.6204 -5.8665 46.3483)\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"21.3373\" x2=\"43.3752\" y1=\"10.5619\" y2=\"27.9934\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><rect x=\"12.0184\" y=\"36.2187\" width=\"47.7389\" height=\"23.8488\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/></g>","<g><rect x=\"13.6299\" y=\"13.0801\" width=\"45.6611\" height=\"45.6621\" fill=\"#FFFFFF\" stroke=\"none\"/><rect x=\"32.8642\" y=\"12.2618\" width=\"7.0732\" height=\"30.5028\" fill=\"#3F3F3F\" stroke=\"none\"/><rect x=\"46.0632\" y=\"12.1986\" width=\"6.8837\" height=\"30.7554\" fill=\"#3F3F3F\" stroke=\"none\"/><rect x=\"19.6653\" y=\"11.8539\" width=\"7.5783\" height=\"31.3528\" fill=\"#3F3F3F\" stroke=\"none\"/></g><g/><g/><g/><g><rect x=\"12.6294\" y=\"12.0802\" width=\"47.6616\" height=\"47.6616\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><rect x=\"19.6398\" y=\"12.0702\" width=\"7.4038\" height=\"30.9107\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><rect x=\"32.7584\" y=\"12.0702\" width=\"7.4037\" height=\"30.9107\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><rect x=\"45.8769\" y=\"12.0702\" width=\"7.4037\" height=\"30.9107\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"24.5448\" x2=\"24.5448\" y1=\"47.433\" y2=\"59.7418\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"36.4602\" x2=\"36.4602\" y1=\"47.433\" y2=\"59.7418\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><line x1=\"48.3756\" x2=\"48.3756\" y1=\"47.433\" y2=\"59.7418\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/></g>"],"vehicles":["<g><path fill=\"#ea5a47\" stroke=\"none\" d=\"M64.8,44l-1.1-0.6c-0.4-0.2-0.6-0.6-0.5-1c0.3-1.9,0.5-8.5-9.7-11.5c-0.2-0.1-0.4-0.1-0.6-0.1l-19.6,0.1 c-0.4,0-0.8,0.1-1.1,0.3l-10.3,6.9c-0.2,0.1-0.4,0.2-0.6,0.2c-1.9-0.1-3.7,0.1-5.6,0.4c-5.4,1.1-7.6,4-8.4,5.5 c-0.2,0.3-0.2,0.7-0.2,1c0.1,2.4-1.5,5.1,0.9,7.3l19.4-0.1l20.4-0.5l16.1-0.2c0.9-0.1001,2.4-1.4,2.8-2.2001 C68.4,46.8,65,44.1,64.8,44z\"/><path fill=\"#9b9b9a\" stroke=\"none\" d=\"M17.3,46.4c-2.2,0-4,1.8-4,4c0,2.2,1.8,4,4,4s4-1.8,4-4C21.3,48.2,19.5,46.4,17.3,46.4z\"/><path fill=\"#9b9b9a\" stroke=\"none\" d=\"M57.1,46.4c-2.2,0-4,1.8-4,4c0,2.2,1.8,4,4,4c2.2,0,4-1.8,4-4C61.1,48.2,59.3,46.4,57.1,46.4z\"/><path fill=\"#92d3f5\" stroke=\"none\" d=\"M56.1,39.3V35c0-0.9-0.8-1.7-1.7-1.7l0,0H33.2c-0.1,0-0.2,0-0.2,0.1l-8,5.7c-0.2,0.1-0.2,0.4-0.1,0.6 c0.1,0.1,0.2,0.2,0.3,0.2c5.6,0,27.2-0.2,30.4-0.1C55.9,39.8,56.1,39.6,56.1,39.3C56.1,39.4,56.1,39.4,56.1,39.3z\"/><polygon fill=\"#fcea2b\" stroke=\"none\" points=\"8.9,40.5 12.9,42.1 10.8,45 5.8,45.1\"/></g><g/><g/><g/><g><line x1=\"47.6\" x2=\"27\" y1=\"51\" y2=\"51.4\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8.1,51.4 c-0.9-0.2-1.7-0.5-1.8-1c-0.1-1-0.3-3.8-0.3-5.1c0-0.5,0.1-1.1,0.4-1.5c1.1-2,4.8-6.8,14.9-6.4l10.3-6.9c0.5-0.3,1.1-0.5,1.6-0.5 l19.6-0.1c0.3,0,0.6,0,0.9,0.1c2.2,0.6,11.7,4,10.4,12.6l1.1,0.6c0.5,0.2,0.9,0.7,1,1.2c0.4,1.4,0.3,2.9-0.2,4.3\"/><polyline fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" points=\"24.9,39.9 55.1,39.7 55.1,35.2\"/><circle cx=\"17.3\" cy=\"50.4\" r=\"5\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"/><circle cx=\"57.1\" cy=\"50.4\" r=\"5\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"/><polyline fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" points=\"12.3,42.9 10.5,45.1 6.8,45\"/></g>","<g><path fill=\"#EA5A47\" d=\"M7.7037,46.5833L7.7037,46.5833z\"/><path fill=\"#3F3F3F\" d=\"M67.19,30.9498v9.26c0,0.19-0.05,0.37-0.15,0.51c-0.07-0.01-0.15-0.02-0.23-0.02H6.75 c-0.09-0.14-0.14-0.31-0.14-0.49v-9.26c0-0.55,0.46-1,1.03-1h58.51c0.02,0,0.05,0,0.0699,0.01 C66.77,29.9897,67.19,30.4197,67.19,30.9498z\"/><path fill=\"#EA5A47\" d=\"M27.14,49.6598h-9.62c0.58-2.11,2.51-3.66,4.81-3.66S26.56,47.5497,27.14,49.6598z\"/><rect x=\"31.4074\" y=\"25.4404\" width=\"4.1482\" height=\"4.5232\" fill=\"#3F3F3F\"/><path fill=\"#3F3F3F\" d=\"M27.2963,31.732h-6.7407c-0.0205,0-0.0371-0.0165-0.0371-0.037v-6.3704 c0-1.3295,1.0779-2.4074,2.4074-2.4074h2.2963c1.166,0,2.1111,0.9452,2.1111,2.1111v6.6667 C27.3333,31.7155,27.3168,31.732,27.2963,31.732z\"/><rect x=\"9.5556\" y=\"18.695\" width=\"3.1111\" height=\"11.6296\" fill=\"#3F3F3F\"/><path fill=\"#3F3F3F\" d=\"M7.56,37.73v-6.78c0-0.55,0.45-1,1-1H45.5V18.1h20.72v12.75c0.01,0.03,0.01,0.07,0.01,0.1v6.6125 L7.56,37.73z\"/><rect x=\"53.7037\" y=\"14.9172\" width=\"4.5926\" height=\"3.1852\" fill=\"#3F3F3F\"/><path fill=\"#EA5A47\" d=\"M45.27,50.9998c0,2.76-2.24,5-5,5s-5-2.24-5-5c0-0.46,0.06-0.91,0.19-1.34c0.44-1.63,1.7-2.9301,3.31-3.42 c0.48-0.16,0.98-0.24,1.5-0.24c0.93,0,1.79,0.25,2.53,0.69c1.11,0.65,1.94,1.71,2.28,2.97 C45.21,50.0898,45.27,50.5397,45.27,50.9998z\"/><line x1=\"29.8241\" x2=\"32.9907\" y1=\"48.692\" y2=\"48.692\" fill=\"none\"/><path fill=\"#EA5A47\" d=\"M68,41.8798v0.82c0,0.65-0.53,1.18-1.19,1.18H65v4.71c0,0.59-0.48,1.07-1.07,1.07h-5.81 c-0.13-0.46-0.32-0.89-0.57-1.29c-0.88-1.42-2.46-2.37-4.25-2.37c-1.39,0-2.64,0.56-3.55,1.48c-0.59,0.6-1.04,1.34-1.27,2.1801 h-3.4c-0.34-1.26-1.17-2.32-2.28-2.97c-0.74-0.44-1.6-0.69-2.53-0.69c-0.52,0-1.02,0.08-1.5,0.24c-1.61,0.49-2.87,1.79-3.31,3.42 h-8.32c-0.58-2.11-2.51-3.66-4.81-3.66s-4.23,1.55-4.81,3.66H9.04c-1.2599,0-2.28-1.02-2.28-2.28v-3.5H5.19 c-0.66,0-1.19-0.53-1.19-1.18v-0.82c0-0.65,0.53-1.18,1.19-1.18h61.62c0.08,0,0.16,0.01,0.23,0.02 C67.59,40.8298,68,41.3098,68,41.8798z\"/><path fill=\"#EA5A47\" d=\"M58.3,50.9998c0,2.76-2.24,5-5,5c-2.77,0-5-2.24-5-5c0-0.46,0.06-0.91,0.18-1.34 c0.23-0.84,0.68-1.58,1.27-2.1801c0.91-0.92,2.16-1.48,3.55-1.48c1.79,0,3.37,0.95,4.25,2.37c0.25,0.4,0.44,0.83,0.57,1.29 C58.24,50.0898,58.3,50.5397,58.3,50.9998z\"/><path fill=\"#EA5A47\" d=\"M27.33,50.9998c0,2.76-2.24,5-5,5s-5-2.24-5-5c0-0.46,0.06-0.91,0.19-1.34c0.58-2.11,2.51-3.66,4.81-3.66 s4.23,1.55,4.81,3.66C27.27,50.0898,27.33,50.5397,27.33,50.9998z\"/><path d=\"M57.3333,29.9636h-8v-8.6342c0-0.5523,0.4477-1,1-1h7V29.9636z\"/></g><g/><g/><g/><g><rect x=\"31.4074\" y=\"25.4404\" width=\"4.1482\" height=\"4.5232\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M27.33,25.0298v4.92h-6.81v-4.63c0-1.32,1.08-2.4,2.41-2.4h2.29C26.39,22.9197,27.33,23.8597,27.33,25.0298z\"/><rect x=\"9.56\" y=\"18.6998\" width=\"3.11\" height=\"11.25\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M66.23,37.5598v-6.61c0-0.03,0-0.07-0.01-0.1v-12.75H58.3h-4.6h-8.2v11.85h-9.94h-4.15h-4.08\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M7.56,37.7298v-6.78c0-0.55,0.45-1,1-1h1\"/><line x1=\"20.52\" x2=\"12.67\" y1=\"29.9498\" y2=\"29.9498\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><rect x=\"53.7037\" y=\"14.9172\" width=\"4.5926\" height=\"3.1852\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M7.7037,44.5833v3.1087c0,0.5523,0.4477,1,1,1h6.2088\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M60.4028,48.692H64c0.5523,0,1-0.4477,1-1v-3.8118\"/><line x1=\"29.8241\" x2=\"32.9907\" y1=\"48.692\" y2=\"48.692\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" d=\"M68,41.8798v0.82c0,0.65-0.53,1.18-1.19,1.18H5.19c-0.66,0-1.19-0.53-1.19-1.18v-0.82c0-0.65,0.53-1.18,1.19-1.18h61.62 C67.47,40.6998,68,41.2297,68,41.8798z\"/><circle cx=\"53.2962\" cy=\"51\" r=\"5.0001\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><circle cx=\"40.273\" cy=\"51\" r=\"5.0001\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><circle cx=\"22.3332\" cy=\"51\" r=\"5.0001\" fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\"/><polyline fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" stroke-width=\"2\" points=\"57.162,21.297 57.162,29.9636 50.2454,29.9636\"/></g>","<g><path fill=\"#9B9B9A\" d=\"M43.2237,23.5985L37.7003,22.78l-21.3-3.547c-2.5478-0.4214-5.1427,0.4102-6.971,2.234l-3.579,3.573 c-0.3903,0.3907-0.3901,1.0238,0.0005,1.4142c0.114,0.1139,0.2538,0.1986,0.4075,0.2468l20.929,6.568l3.8119,1.1561\"/><path fill=\"#9B9B9A\" d=\"M36.1513,37.924l2.394,6.663l6.575,20.954c0.1654,0.527,0.7266,0.8201,1.2535,0.6548 c0.1538-0.0482,0.2936-0.1329,0.4075-0.2468l3.578-3.578c1.8248-1.8278,2.6569-4.4229,2.235-6.971l-3.549-21.311l-0.893-5.915 L36.1513,37.924z\"/><path fill=\"#D0CFCE\" d=\"M9.3413,49.6l8.619,3.716c0.2418,0.1044,0.4326,0.2998,0.531,0.544l3.5481,8.8l3.9609-4.01l-0.691-5.951 c-0.0351-0.3033,0.0702-0.606,0.286-0.822l28.8-28.794c1.0236-1.2048,1.3221-2.8662,0.782-4.352l0,0l-0.157-0.585 c-0.1859-0.6966-0.7258-1.2433-1.42-1.438l-0.579-0.159c-1.4628-0.5363-3.102-0.2238-4.265,0.813l-28.856,28.812 c-0.2199,0.2198-0.5297,0.3248-0.838,0.284l-5.846-0.776L9.3413,49.6z\"/></g><g/><g/><g/><g><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M48.3723,36.082 l3.243,19.472c0.3715,2.2297-0.3566,4.5016-1.955,6.1l-3.578,3.578l-6.534-20.824\"/><path fill=\"none\" stroke=\"#000000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M27.2233,32.2 l-20.659-6.482l3.578-3.578c1.5985-1.5984,3.8703-2.3265,6.1001-1.955l19.472,3.243\"/><path fill=\"none\" stroke=\"#000000\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M56.1423,18.469l-0.158-0.585 c-0.2797-1.0374-1.0847-1.8511-2.119-2.142l-0.579-0.159c-1.8103-0.6506-3.8324-0.2362-5.241,1.074l-28.853,28.808l-6.339-0.842 l-5.253,5.312l9.964,4.3l0,0l4.1171,10.206l5.371-5.428l-0.747-6.428l28.8-28.795C56.3978,22.3393,56.7954,20.2989,56.1423,18.469z\"/></g>","<g><path fill=\"#fff\" d=\"m38.4759,25.1614l-.248,10.5806h.8266s4.877-6.1169,8.5141-6.1996l-.0827-4.877-9.01.496Z\"/><rect x=\"26.682\" y=\"28.3643\" width=\"3.1666\" height=\"4.4166\" fill=\"#3f3f3f\"/><path fill=\"#b1cc33\" d=\"m51.0954,20.2843s-9.8301-1.17-16.1602.58l-.5,10.5799s-18.8398,1.5901-22.5898,5.5901l1.25,13.5h40.25s1.1543-10.4774.4938-19.4245c-.3326-4.5061-1.7792-8.367-2.7438-10.8255Zm-11.2621,17.2806l-2.6789.0313.1406-12.6345c5.3893-1.8888,11.6402.0726,11.6402.0726l.0701,4.9c-7.85,2.07-9.172,7.6306-9.172,7.6306Z\"/><path fill=\"#3f3f3f\" d=\"m11.4801,42.5186s16.6362-2.6442,30.9971-3.035c0,0,4.0063-4.2064,6.0381-4.911,1.9375-.6719,4.8815-1.2129,5.2787-.875.4009.341.2324,2.6722.331,5.9151l-.7213,11.9543-41.0612-.2137-.8624-8.8347Z\"/><circle cx=\"52.98\" cy=\"46.5898\" r=\"5\" fill=\"#ea5a47\"/><circle cx=\"15.02\" cy=\"51.5898\" r=\"3\" fill=\"#ea5a47\"/><path fill=\"#fcea2b\" d=\"m14.07,41.1351h1.7578c.9668,0,1.7578-.45,1.7578-1v-2.12c-.1406.2258.3418-1-.625-1l-1.4721.3355c-.4164.0949-.7386.425-.8233.8437l-.5952,2.9408Z\"/></g><g><path d=\"m52.9805,35.59c-6.0654,0-11,4.9346-11,11s4.9346,11,11,11,11-4.9346,11-11-4.9346-11-11-11Zm4,11c0,2.2061-1.7939,4-4,4s-4-1.7939-4-4,1.7939-4,4-4,4,1.7939,4,4Z\"/><path d=\"m15.02,45.59c-3.3086,0-6,2.6914-6,6s2.6914,6,6,6,6-2.6914,6-6-2.6914-6-6-6Zm0,8c-1.103,0-2-.8975-2-2s.897-2,2-2,2,.8975,2,2-.897,2-2,2Z\"/><polyline fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" points=\"26.682 32.2999 26.682 28.3643 29.8486 28.3643 29.8486 31.8513\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m26.682,32.2999c-5.1431.7998-11.7743,2.1973-14.4066,4.3368-.2664.2165-.4129.5443-.3812.8861l.6871,6.5445\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m29.8486,31.8513c-.9401.1207-2.0161.2697-3.1666.4487\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m52.8185,30.467c-.3456-3.6951-.8852-8.0548-1.7199-10.1861,0,0-10.8333-1.1666-17.1666.5834l-.5,10.5833s-1.4378.1282-3.5834.4037\"/><line x1=\"22.5153\" x2=\"40.3521\" y1=\"50.5309\" y2=\"50.5309\" fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m40.3521,43.4723c1.537-6.9462,8.414-11.3309,15.36-9.7939,2.792.6178,5.1703,2.0984,6.9165,4.0996\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m48.9672,23.6688s-5.919-.8771-11.669.2895l-.2845,13.4635h2.5016s2.875-4.6409,9.5223-6.8492l-.0704-6.9038Z\"/><path stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m28.1193,28.3643s.3381-3.5834-1.2846-3.5834\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m37.0168,37.2787h2.6602s2.7485-4.8599,9.3606-6.7061\"/><path fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m17.044,38.0151v2.12c0,.55-.4501,1-1,1h-1\"/></g>"]};

/* ===== sm-library.json: the target library (wording written for the practice; editable once placed) ===== */
const SM_LIBRARY={"_about":"This is the SM-1 target library: starting targets with wording written for the practice, each one editable after it is placed on the student's sheet.","entries":[{"id":"task_start_y","group":"Task engagement","word":"I start my work","def":"Begins the assigned task (materials out and pencil, eyes, or hands on the work) within 1 minute of the direction to start, with no more than one reminder.","cue":"Start right away","ex":"Writes their name on the worksheet within a minute of “Start your math page”","nex":"Rolls a pencil on the desk for 3 minutes after the direction","icon":"deskwriting1","goal":"80","age":"young"},{"id":"task_start_o","group":"Task engagement","word":"I get started on time","def":"Begins the first item of the assigned task (writing, reading, typing, or opening the named material) within 1 minute of the direction to start, without a second prompt.","cue":"Start within 1 minute","ex":"Opens the laptop to the assignment and types the first answer within a minute of the bell work direction","nex":"Keeps talking to a peer until the teacher repeats the direction","icon":"timer","goal":"80","age":"older"},{"id":"on_task","group":"Task engagement","word":"I keep working","def":"At each check during independent work (for example, a signal every 5 minutes), eyes are on the task materials and the student is writing, reading, using the materials, or asking about the task.","cue":"Eyes on my work","ex":"Is writing the next spelling word when the signal sounds","nex":"Is looking out the window with the pencil down when the signal sounds","icon":"desk","goal":"80","age":"all"},{"id":"finish_work","group":"Task engagement","word":"I finish my work","def":"Completes all assigned items, or the amount agreed for the student, by the end of the work period and places the work in the finished tray or hands it to the adult.","cue":"Finish, then turn in","ex":"Answers all 10 problems and puts the page in the tray before the timer ends","nex":"Answers 4 of 10 problems and puts the page in the desk","icon":"finished","goal":"75","age":"all"},{"id":"quiet_desk","group":"Task engagement","word":"I work quietly","def":"During independent work, stays at the assigned desk with voice off or at a whisper heard only by the person next to them, except to ask the adult a question after raising a hand.","cue":"Whisper or no voice","ex":"Works silently at the desk and raises a hand to ask a question","nex":"Sings or calls out across the room during independent work","icon":"quiet","goal":"80","age":"all"},{"id":"follow_first","group":"Following directions","word":"I follow directions the first time","def":"Starts doing what the adult asked within 10 seconds of the first direction and completes it, without a repeated direction.","cue":"Start within 10 seconds","ex":"Puts the book away and lines up within 10 seconds of “Books away, line up”","nex":"Says “in a minute” and starts only after the direction is given a third time","icon":"follow","goal":"80","age":"all"},{"id":"listen_teacher","group":"Following directions","word":"I listen to the teacher","def":"While the teacher is talking to the group or to the student, eyes are toward the teacher or the named material, voice is off, and hands are still or on the named material for the whole talk.","cue":"Eyes up, voice off","ex":"Looks at the board and stays quiet while the teacher explains the activity","nex":"Talks to a neighbor while the teacher gives the directions","icon":"listening","goal":"80","age":"all"},{"id":"change_y","group":"Changes and transitions","word":"I am okay with changes","def":"When an adult tells the student about a change in the plan or schedule, the student answers in a calm voice (says “okay,” nods, or asks a question) and goes to the new activity within 1 minute.","cue":"Plans can change","ex":"Says “okay” when recess moves inside and walks to the gym with the class","nex":"Shouts and drops to the floor when told recess is inside today","icon":"ok","goal":"75","age":"young"},{"id":"change_o","group":"Changes and transitions","word":"I handle schedule changes","def":"When a change to the day's schedule is announced, the student responds at a conversational voice level (acknowledges it or asks about the new plan) and begins the new activity within 2 minutes.","cue":"Check the new plan","ex":"Asks “When is art now?” and then starts the substitute activity","nex":"Argues for 5 minutes and refuses to start the substitute activity","icon":"calendar","goal":"75","age":"older"},{"id":"transition","group":"Changes and transitions","word":"I move to the next activity","def":"Within 1 minute of the transition signal, puts away the current materials and walks to the next activity or area, with no more than one reminder.","cue":"Clean up, go next","ex":"Puts crayons in the bin and walks to the carpet within a minute of the bell","nex":"Keeps coloring at the table after the class has moved to the carpet","icon":"next","goal":"80","age":"all"},{"id":"end_preferred","group":"Changes and transitions","word":"I stop when time is up","def":"When the timer sounds or the adult says time is up for a chosen activity, the student stops and puts away or hands over the item within 30 seconds, using a calm voice and body.","cue":"Timer rings, all done","ex":"Turns off the tablet and hands it to the adult when the timer rings","nex":"Holds the tablet away from the adult and keeps playing after the timer","icon":"alldone","goal":"75","age":"all"},{"id":"ask_help","group":"Coping and asking","word":"I ask for help","def":"When unable to continue a task, the student raises a hand, shows the help card, or says “Can you help me?” and waits at the task for the adult, instead of leaving the task or putting it away.","cue":"Hand up or card","ex":"Raises a hand and says “I don't get number 3” when stuck","nex":"Crumples the worksheet and puts their head down when stuck","icon":"askhelp","goal":"80","age":"all"},{"id":"ask_break","group":"Coping and asking","word":"I ask for a break","def":"Requests a break by handing over the break card or saying “Break, please” in a calm voice, goes to the agreed break area, and returns to the activity within 1 minute of the break timer ending.","cue":"Card, break, come back","ex":"Hands the break card to the teacher, sits in the break corner, returns when the timer ends","nex":"Leaves the room without asking or stays in the break area after the timer","icon":"cardbreak","goal":"80","age":"all"},{"id":"calm_strategy","group":"Coping and asking","word":"I use my calm-down plan","def":"When one of the student's listed triggers occurs (for example, a hard task, a “no,” or a peer conflict), the student uses a taught strategy (slow breaths, counting to 10, squeezing a fidget, the calm corner) within 1 minute and returns to the activity.","cue":"Breathe and count","ex":"Takes three slow breaths after losing a game and joins the next round","nex":"Throws the game pieces after losing and refuses the next round","icon":"breathe","goal":"75","age":"all"},{"id":"wait_turn","group":"Coping and asking","word":"I wait my turn","def":"When told to wait or when another person has the turn or the adult's attention, the student stays in place with hands to self and voice quiet for the stated wait time, without grabbing, calling out, or repeating the request.","cue":"Hands down, I wait","ex":"Stands in line with hands down until the teacher says “Your turn”","nex":"Grabs the ball from a peer or calls the teacher's name over and over","icon":"waiting","goal":"80","age":"all"},{"id":"accept_no_y","group":"Accepting no and feedback","word":"I am okay with no","def":"When an adult says “no,” “not now,” or “wait,” the student responds within 10 seconds in a calm voice (says “okay,” nods, or picks another choice) and asks again no more than once.","cue":"Okay, maybe later","ex":"Says “okay” and picks the puzzle when told the tablet is not available","nex":"Cries and asks for the tablet again and again after hearing “no”","icon":"no","goal":"70","age":"young"},{"id":"accept_no_o","group":"Accepting no and feedback","word":"I accept no calmly","def":"When a request is denied, the student responds at a conversational voice level within 10 seconds (acknowledges it, asks when it will be possible, or chooses another option) and does not argue or repeat the request more than once.","cue":"Okay, then what's next","ex":"Says “Fine, can I go at lunch?” when told no to leaving early","nex":"Argues and raises their voice for several minutes after the answer","icon":"no","goal":"75","age":"older"},{"id":"accept_feedback_y","group":"Accepting no and feedback","word":"I fix my mistakes","def":"When an adult points out a mistake, the student looks at the work, says “okay” or nods, and starts the correction within 30 seconds without tearing, erasing all of it, or leaving the task.","cue":"Oops, try again","ex":"Erases the backwards 3 and writes it again after the teacher points to it","nex":"Tears up the paper when the teacher points to the mistake","icon":"ok","goal":"75","age":"young"},{"id":"accept_feedback_o","group":"Accepting no and feedback","word":"I accept feedback","def":"When an adult gives a correction on work or behavior, the student listens without interrupting, says “okay” or asks one question about it, and makes the change or carries on with the task within 1 minute.","cue":"Listen, then adjust","ex":"Says “okay” and rewrites the thesis sentence after the teacher's comment","nex":"Says “That's not wrong” and stops working on the essay","icon":"thankyou","goal":"75","age":"older"},{"id":"safe_body","group":"Safety and space","word":"I keep safe hands and feet","def":"Hands, feet, and objects stay to self for the whole period: no hitting, kicking, pushing, grabbing, or throwing objects toward people, including when upset or waiting.","cue":"Hands and feet still","ex":"Keeps hands in lap while waiting next to a peer on the carpet","nex":"Pushes a peer in line; throws a pencil toward a classmate","icon":"safehands","goal":"90","age":"all"},{"id":"stay_area","group":"Safety and space","word":"I stay in my area","def":"Remains seated or standing within the assigned place (desk, carpet spot, or taped area) for the whole period, except when given permission or using the break card.","cue":"Bottom on the chair","ex":"Stays at the desk while the class works; stays on the carpet spot during meeting","nex":"Walks to the window without asking; crawls under the table","icon":"stayarea","goal":"80","age":"all"},{"id":"kind_words","group":"Social","word":"I use kind words","def":"Speaks to peers using polite or neutral words (please, thank you, names, helpful comments) for the whole period, with no name-calling, teasing, threats, or swearing.","cue":"Kind and friendly","ex":"Says “Can I have a turn, please?” to a peer","nex":"Calls a peer a name after losing a game","icon":"kindwords","goal":"85","age":"all"},{"id":"raise_hand_y","group":"Social","word":"I raise my hand","def":"During group lessons, raises a hand and waits to be called on before speaking, with no calling out during the lesson.","cue":"Hand up, wait","ex":"Raises a hand and answers after the teacher says their name","nex":"Shouts the answer before the teacher calls on anyone","icon":"raisehand","goal":"80","age":"young"},{"id":"talk_turns_o","group":"Social","word":"I take turns talking","def":"During class discussion or group work, waits until the speaker finishes or the student is called on before speaking, with no talking over a peer or the teacher.","cue":"Let them finish","ex":"Waits for a peer to finish the point, then adds their own","nex":"Talks over a peer who is answering the teacher","icon":"myturntalk","goal":"80","age":"older"},{"id":"personal_space","group":"Social","word":"I give others space","def":"Stays about an arm's length from others when sitting, standing in line, or talking, and touches others' bodies or belongings only after asking and getting a yes.","cue":"Arm's length away","ex":"Stands an arm's length behind the peer in line","nex":"Leans on a peer during circle; takes a peer's pencil without asking","icon":"gentle","goal":"85","age":"all"},{"id":"respect_staff_o","group":"Social","word":"I speak respectfully to staff","def":"Speaks to adults at a conversational voice level, using polite or neutral words, for the whole period, including when disagreeing, with no swearing, insults, or yelling.","cue":"Calm voice, polite words","ex":"Says “I don't agree, can we talk after class?” to the teacher","nex":"Swears at the teacher when asked to put the phone away","icon":"teacher","goal":"85","age":"older"}]};

/* ===== sm-v2-core.js ===== */
/* ===== Form SM-1 v2 (v21.45): the sheet's design. =====
   S.d holds the design: the look (classic, bright, theme, clean, discreet), the interest theme, the colour, the rating style
   and its points, the word for the adult who rates, the avatar, the "I'm working for" box, the QR code. S.store is the
   reward store (a name, a picture, a price, a tier). "classic" with the rating style "As the sheet type has it" is the form
   as it was before v21.45: an older file opens to exactly the sheet it had. */

/* ---------------- rating styles ---------------- */
/* each level: the glyph's key, its points and its spoken word (the walkthrough reads it); bin marks a two-level style */
const SM_RATES={
  auto:{l:'As the sheet type has it',note:'faces, Yes / No or 0 1 2, as each sheet type had it before'},
  faces2:{l:'Smiles (2)',bin:1,lv:[['fh',1,'smile'],['fs',0,'frown']]},
  faces3:{l:'Smiles (3)',lv:[['fh',2,'smile'],['fn',1,'straight face'],['fs',0,'frown']]},
  thumbs:{l:'Thumbs up / down',bin:1,lv:[['tu',1,'thumbs up'],['td',0,'thumbs down']]},
  pm:{l:'Plus / minus',bin:1,lv:[['t:+',1,'plus'],['t:−',0,'minus']]},
  check:{l:'Check / x',bin:1,lv:[['t:✓',1,'check'],['t:✗',0,'x']]},
  yn:{l:'Yes / No',bin:1,lv:[['w:Yes',1,'yes'],['w:No',0,'no']]},
  p012:{l:'Points 0-1-2',lv:[['t:2',2,'two'],['t:1',1,'one'],['t:0',0,'zero']]},
  s15:{l:'Scale 1 to 5',lv:[['t:5',5,'five'],['t:4',4,'four'],['t:3',3,'three'],['t:2',2,'two'],['t:1',1,'one']]},
  stars3:{l:'Stars, color 0 to 3',count:3,lv:[['st',3,'three stars'],['st',2,'two stars'],['st',1,'one star'],['st',0,'no stars']]},
  color3:{l:'Color: green, yellow, red',lv:[['cg',2,'green'],['cy',1,'yellow'],['cr',0,'red']]},
  pics:{l:'Pictures you choose',lv:null},
  words:{l:'The student’s own words',lv:null}
};
const SM_RATE_ORDER=['auto','faces2','faces3','thumbs','pm','check','yn','p012','s15','stars3','color3','pics','words'];
function smD(){return S.d||(S.d={});}
function smRateKey(){const k=smD().rate;return SM_RATES[k]?k:'auto';}
/* the levels of the chosen style, with the points edited on the Design sheet (rv: "2,1,0") */
function smLevels(k){k=k||smRateKey();const R=SM_RATES[k];if(!R||k==='auto')return null;const d=smD();let lv;
  if(k==='pics'){const keys=String(d.rpics||'happy,calm,sad').split(',').map(x=>x.trim()).filter(Boolean).slice(0,3);lv=keys.map((x,i)=>['p:'+x,keys.length-1-i,(window.NBH_PICTOS&&NBH_PICTOS[x]?NBH_PICTOS[x].l:x).toLowerCase()]);}
  else if(k==='words'){const w=String(d.rwords||'Nailed it|Almost|Not yet').split('|').map(x=>x.trim()).filter(Boolean).slice(0,4);lv=w.map((x,i)=>['w:'+x,w.length-1-i,x]);}
  else lv=R.lv.map(x=>x.slice());
  const rv=String(d.rv||'').split(',').map(x=>num(x));if(rv.length===lv.length&&rv.every(v=>v!=null))lv.forEach((x,i)=>{x[1]=rv[i];});
  return lv;}
function smRateMax(){const lv=smLevels();return lv?Math.max(...lv.map(x=>x[1])):null;}
function smRateBin(){const k=smRateKey();if(k==='auto')return true;const lv=smLevels();return lv&&lv.length===2;}

/* the glyphs: drawn here so they print the same everywhere, and readable in black and white (shape or label, not colour) */
const SM_THUMB='M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z';
function smGlyph(key,sz,tint){sz=sz||24;const S2='width="'+sz+'" height="'+sz+'"';tint=tint!==false;
  const f=(fill)=>tint?fill:'#fff';
  if(key==='fh'||key==='fs'||key==='fn'){const m=key==='fh'?'M8 14.5q4 4 8 0':key==='fs'?'M8 16.6q4-4 8 0':'M8 15.4h8';
    return '<svg class="g" '+S2+' viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.3" fill="'+f(key==='fh'?'#dff3d8':key==='fs'?'#fde0dc':'#fff4c9')+'" stroke="#333" stroke-width="1.3"/><circle cx="8.6" cy="9.6" r="1.2" fill="#333"/><circle cx="15.4" cy="9.6" r="1.2" fill="#333"/><path d="'+m+'" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round"/></svg>';}
  if(key==='tu'||key==='td')return '<svg class="g" '+S2+' viewBox="-2 -2 28 28" aria-hidden="true"><path d="'+SM_THUMB+'" fill="'+f(key==='tu'?'#dff3d8':'#fde0dc')+'" stroke="#333" stroke-width="1.2" stroke-linejoin="round"'+(key==='td'?' transform="rotate(180 12 12)"':'')+'/></svg>';
  if(key==='st')return '<svg class="g" '+S2+' viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17.2l-6 3.3 1.3-6.7-5-4.6 6.8-.8z" fill="#fff" stroke="#333" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  if(key==='cg'||key==='cy'||key==='cr'){const c={cg:'#7cc56b',cy:'#f5d04a',cr:'#ef7a6a'}[key],l={cg:'G',cy:'Y',cr:'R'}[key];
    return '<svg class="g" '+S2+' viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.3" fill="'+(tint?c:'#fff')+'" stroke="#333" stroke-width="1.3"/><text x="12" y="16.2" text-anchor="middle" font-size="11" font-weight="700" font-family="Arial,sans-serif" fill="#222">'+l+'</text></svg>';}
  if(key.slice(0,2)==='p:'){const k=key.slice(2);return '<span class="g gp" style="width:'+sz+'px;height:'+sz+'px">'+(window.NBH_PICTOS&&NBH_PICTOS[k]?picto(k,''):'')+'</span>';}
  if(key.slice(0,2)==='t:')return '<span class="g gt" style="width:'+sz+'px;height:'+sz+'px;font-size:'+Math.round(sz*.58)+'px">'+esc(key.slice(2))+'</span>';
  if(key.slice(0,2)==='w:')return '<span class="g gw" style="min-width:'+sz+'px;height:'+sz+'px;font-size:'+Math.max(9,Math.round(sz*.42))+'px">'+esc(key.slice(2))+'</span>';
  return '';}
/* one rating cell: the levels side by side to circle; stars are coloured in, as many as earned */
function smRateCell(sz,tint){const lv=smLevels();if(!lv)return '';const k=smRateKey();
  if(SM_RATES[k].count)return '<span class="gset gstars">'+Array.from({length:SM_RATES[k].count},()=>smGlyph('st',sz)).join('')+'</span>';
  return '<span class="gset">'+lv.map(x=>smGlyph(x[0],sz,tint)).join('')+'</span>';}
/* the key: what each level is worth */
function smRateKeyHTML(sz){const lv=smLevels();if(!lv)return '';const k=smRateKey();
  if(SM_RATES[k].count)return '<span class="rkey">'+smGlyph('st',sz||16)+' each star = 1 point</span>';
  return '<span class="rkey">'+lv.map(x=>smGlyph(x[0],sz||16)+' = '+x[1]).join(' &nbsp; ')+'</span>';}

/* ---------------- points ---------------- */
/* the points possible when a rating style is chosen (null keeps the form's own count) */
function smV2Poss(sys,P,T){if(smRateKey()==='auto')return null;const mx=smRateMax();if(mx==null)return null;
  if(sys==='match'){if(smRateBin())return null;return P*T*(mx+smBonus());}
  if(sys==='contract'||sys==='smiley'||sys==='cico')return P*T*mx;
  if(sys==='interval'){const n=num(S.meta.iv_n)||0;return smRateBin()?null:n*mx;}
  return null;}
function smBonus(){const b=num(smD().mbonus);return b==null?1:b;}

/* ---------------- looks and themes ---------------- */
const SM_LOOKS={classic:'Classic (the form’s own sheet)',bright:'Bright (elementary)',theme:'Interest theme',clean:'Clean (middle and high school)',discreet:'Discreet pocket cards (teens)'};
const SM_THEMES={
  sports:{l:'Sports',c:'#256d3b',a:'#ffd84d',t:'Game Plan',tot:'Final score',store:'Prize locker',mid:'Halftime check',goal:'Goal'},
  space:{l:'Space',c:'#2d2f7a',a:'#ffcf4a',t:'Mission Log',tot:'Mission total',store:'Space station store',mid:'Launch check',goal:'Target'},
  animals:{l:'Animals',c:'#a5531c',a:'#f6c26b',t:'Paw-some Day',tot:'Total paws',store:'Treat shop',mid:'Check-in',goal:'Goal'},
  dinos:{l:'Dinosaurs',c:'#2f6b45',a:'#f08a3c',t:'Dino Day',tot:'Dino total',store:'Dino den',mid:'Roar check',goal:'Goal'},
  art:{l:'Art',c:'#7b3fa0',a:'#ff8fb1',t:'Masterpiece Day',tot:'My total',store:'Art supply store',mid:'Midday check',goal:'Goal'},
  music:{l:'Music',c:'#1f4e79',a:'#ff7a59',t:'My Day’s Song',tot:'Total beats',store:'Music shop',mid:'Halfway check',goal:'Goal'},
  vehicles:{l:'Vehicles',c:'#b03a2e',a:'#f4d03f',t:'Road Trip',tot:'Miles today',store:'Garage store',mid:'Pit stop',goal:'Goal'}
};
/* v21.46 the plain and colour themes: no pictures and the plain words; Plain is black on white, for a black-and-white printer */
const SM_COL_W={t:'Point Sheet',tot:'Today I earned',store:'My reward store',mid:'Midday check',goal:'My goal',col:1};
[['plain','Plain','#222222','#222222'],['ocean','Ocean blue','#1f5fa8','#ffd166'],['sky','Sky blue','#2b8ccf','#fff3b0'],['teal','Teal','#11867f','#ffd166'],
 ['forest','Forest green','#2e7d4f','#f9c74f'],['lime','Lime green','#5b9a1e','#fff3b0'],['sunset','Sunset orange','#d35f1f','#ffe08a'],['gold','Gold','#a87400','#fff3b0'],
 ['cherry','Cherry red','#b8322c','#ffd166'],['rose','Rose pink','#c2386f','#ffe3a3'],['berry','Berry purple','#6f3a9a','#ffb3d1'],['slate','Slate gray','#4a5866','#ffd166'],
 ['rainbow','Rainbow','#5b4bc4','#ffd166']].forEach(([k,l,c,a])=>{SM_THEMES[k]=Object.assign({l,c,a},SM_COL_W);});
function smLook(){const l=smD().look;return SM_LOOKS[l]?l:'classic';}
function smTheme(){const t=smD().theme;return SM_THEMES[t]?t:'sports';}
function smAccent(){const d=smD();if(/^#[0-9a-f]{6}$/i.test(d.accent||''))return d.accent;const l=smLook();return l==='theme'?SM_THEMES[smTheme()].c:l==='clean'?'#1d3b5a':l==='discreet'?'#333333':'#1fa3a6';}
function smTeacher(){const w=String(smD().tw||'').trim();return w||'Teacher';}
function smArt(i,sz){const a=(typeof SM_THEME_ART!=='undefined'&&SM_THEME_ART[smTheme()])||[];const s=a[i%Math.max(1,a.length)];return s?'<svg class="art" width="'+sz+'" height="'+sz+'" viewBox="0 0 72 72" aria-hidden="true">'+s+'</svg>':'';}
/* the name on a sheet: the first name on the bright and theme looks, initials on the clean and discreet ones (Design) */
function smName(){const m=S.meta,d=smD();const full=String(m.client||'').trim(),nick=String(m.nick||'').trim();
  const ini=s=>String(s||'').replace(/\(.*?\)/g,'').split(/[\s–-]+/).filter(w=>/^[A-Za-z]/.test(w)).map(w=>w[0].toUpperCase()+'.').join('');
  const mode=d.nm||(['clean','discreet'].includes(smLook())?'ini':'nick');
  if(mode==='full')return full;if(mode==='ini')return ini(full)||ini(nick);return nick||full;}
/* v21.48 the student's photo on the sheet (Design: Student's photo). phs: '' the look's own way (Bright shows the picture chosen,
   the other looks none), 'show', 'blank' (an empty circle to glue a printed photo onto) or 'off' */
function smPhotoMode(look){const v=smD().phs;look=look||smLook();if(v==='off')return '';if(v==='blank')return 'blank';
  if(v==='show'||(!v&&look==='bright'))return smAvatar(10)?'show':'';return '';}
function smPhoto(sz,look){const m=smPhotoMode(look);if(!m)return '';
  if(m==='blank')return '<div class="v2-ph v2-ph-blank" style="width:'+sz+'px;height:'+sz+'px"><span>photo</span></div>';
  return '<div class="v2-ph" style="width:'+sz+'px;height:'+sz+'px">'+smAvatar(sz-6)+'</div>';}
function smPoss(n){return n===1?'':'s';}
function smAvatar(sz){const d=smD();if(d.avimg)return '<img class="av-img" src="'+d.avimg+'" alt="" style="width:'+sz+'px;height:'+sz+'px">';
  if(d.av&&window.NBH_PICTOS&&NBH_PICTOS[d.av])return '<span class="av-pic" style="width:'+sz+'px;height:'+sz+'px">'+picto(d.av,'')+'</span>';return '';}

/* ---------------- QR code (qrcode-generator, inlined by build.sh) ---------------- */
function smQR(url,sz){if(!url||typeof qrcode!=='function')return '';try{const q=qrcode(0,'M');q.addData(url);q.make();const n=q.getModuleCount(),c=sz/(n+2);let r='';
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(q.isDark(y,x))r+='M'+((x+1)*c).toFixed(2)+' '+((y+1)*c).toFixed(2)+'h'+c.toFixed(2)+'v'+c.toFixed(2)+'h-'+c.toFixed(2)+'z';
    return '<svg class="qr" width="'+sz+'" height="'+sz+'" viewBox="0 0 '+sz+' '+sz+'" role="img" aria-label="QR code"><rect width="'+sz+'" height="'+sz+'" fill="#fff"/><path d="'+r+'" fill="#111"/></svg>';}catch(e){return '';}}

/* ---------------- the reward store ---------------- */
function smStore(){return (Array.isArray(S.store)?S.store:[]).filter(x=>x&&(String(x.n||'').trim()||x.icon||x.img));}
function smStorePic(o,sz){return o.img?'<img src="'+o.img+'" alt="" style="width:'+sz+'px;height:'+sz+'px;object-fit:cover;border-radius:6px">':(o.icon&&window.NBH_PICTOS&&NBH_PICTOS[o.icon]?'<span class="sp" style="width:'+sz+'px;height:'+sz+'px">'+picto(o.icon,'')+'</span>':'');}
const SM_TIERS={s:'Small',m:'Medium',b:'Big'};
function smStoreHTML(kind){const st=smStore();if(!st.length)return '';const th=SM_THEMES[smTheme()],look=smLook(),d=smD();
  const ttl=look==='theme'?th.store:look==='clean'?'Points to spend':'My reward store';
  const sorted=st.slice().sort((a,b)=>(num(a.p)??1e9)-(num(b.p)??1e9));
  if(kind==='list')return '<div class="v2-box v2-store-list"><h4>'+esc(ttl)+'</h4>'+sorted.map(o=>'<div class="sl"><span>'+esc(o.n||'')+'</span><b>'+esc(o.p||'')+'</b></div>').join('')+(d.bank?'<div class="sl bank"><span>My bank</span><b>____</b></div>':'')+'</div>';
  if(kind==='line')return '<div class="v2-store-line"><b>'+esc(ttl)+':</b> '+sorted.map(o=>esc(o.n||'')+' '+esc(o.p||'')).join(' · ')+'</div>';
  const tiers=d.tiers&&sorted.some(o=>o.tier);
  const tile=o=>'<div class="tile">'+smStorePic(o,look==='theme'?34:40)+'<div class="tn">'+esc(o.n||'')+'</div><span class="pr">'+esc(o.p||'')+'</span></div>';
  let body='';if(tiers){['s','m','b'].forEach(t=>{const g=sorted.filter(o=>(o.tier||'s')===t);if(g.length)body+='<div class="tier"><span class="tl">'+SM_TIERS[t]+'</span>'+g.map(tile).join('')+'</div>';});}
  else body='<div class="tiles">'+sorted.slice(0,8).map(tile).join('')+'</div>';
  return '<div class="v2-box v2-store"><h4>'+esc(ttl)+' <span class="hint2">points needed</span></h4>'+body+(d.bank?'<div class="bank">Points I save go in my bank: ______</div>':'')+'</div>';}

/* ---------------- the model every look draws ---------------- */
const SM_V2_SYS=['match','contract','smiley','cico','interval','rubric'];
function smModel(){const sys=S.sys,T=S.tg,P=smRows(),p=possible(),d=smD(),tw=smTeacher();
  const raters=sys==='match'||sys==='interval'?['me','t']:sys==='rubric'?(S.chk.rubmatch?['me','t']:['me']):sys==='cico'?['t']:['me'];
  let tg=T.map((t,i)=>({word:t.word||('Target '+(i+1)),cue:t.cue||'',pic:pic(t,''),i}));
  if(sys==='interval')tg=[{word:S.meta.iv_q||'Was I working?',cue:'',pic:'',i:0}];
  if(sys==='rubric')tg=[{word:'How I did',cue:'circle my level (the key above)',pic:'',i:0}];   /* one level per period, as the classic rubric sheet */
  const goal=S.meta.goal_txt||(p.need!=null?'Goal: '+p.need+' of '+p.poss:'');
  return {sys,tg,rows:P,raters,p,goal,tw,match:sys==='match'||sys==='interval'||(sys==='rubric'&&S.chk.rubmatch),init:sys==='contract'||sys==='cico'};}
/* the rows: the periods (or the alternate day's), the intervals of a cued-interval sheet */
function smRows(){if(S.sys==='interval'){const n=num(S.meta.iv_n)||10,len=num(S.meta.iv_len)||3,vr=/^Variable/.test(S.meta.iv_timing||'');return Array.from({length:n},(_,i)=>({t:'',label:'Check '+(i+1),sub:vr?'':'minute '+((i+1)*len),pic:''}));}
  const src=smD().alt&&Array.isArray(S.per2)&&S.per2.some(x=>x.label||x.t)?S.per2:S.per;
  return src.map((r,i)=>({t:r.t?fmtHM(r.t):'',label:r.label||('Period '+(i+1)),sub:'',pic:pic(r,'')}));}
/* a rating cell for the sheet type (rubric: the level circles) */
function smCell(sys,sz){if(sys==='rubric'){const n=S.lv.length;return '<span class="gset">'+Array.from({length:n},(_,i)=>smGlyph('t:'+(i+1),sz,false)).join('')+'</span>';}
  if(smRateKey()==='auto'){if(sys==='cico')return '<span class="gset">'+['2','1','0'].map(x=>smGlyph('t:'+x,sz,false)).join('')+'</span>';if(sys==='smiley')return '<span class="gset">'+smGlyph('fh',sz)+'</span>';
    if(sys==='contract')return '<span class="gset">'+smGlyph('t:✓',sz,false)+'</span>';return '<span class="gset">'+smGlyph('fh',sz)+smGlyph('fs',sz)+'</span>';}
  return smRateCell(sz);}
function smKeyLine(m,short){const k=smRateKey();if(m.sys==='rubric')return short?'<span class="rkey">1 to '+S.lv.length+': the levels on the sheet</span>':'<table class="v2-lv">'+S.lv.map((l,i)=>'<tr class="l'+(i+1)+'"><td><b>'+(i+1)+'</b></td><td>'+esc(l.desc)+'</td><td>'+esc(l.pts)+' pt'+(String(l.pts)==='1'?'':'s')+'</td></tr>').join('')+'</table>';
  if(m.sys==='match'&&short){const mm=mp();return smRateBin()?'Same as '+esc(m.tw.toLowerCase())+': yes '+mm.yy+', no '+mm.nn+', different '+mm.yn:esc(m.tw)+'’s rating + '+smBonus()+' if the same';}
  if(m.sys==='match'){const mm=mp();return smRateBin()?'<span class="rkey">Same answer as '+esc(m.tw.toLowerCase())+' = '+mm.yy+' point'+smPoss(mm.yy)+' for yes, '+mm.nn+' for an honest no · different = '+mm.yn+'</span>':'<span class="rkey">'+esc(m.tw)+'’s rating counts · same rating as '+esc(m.tw.toLowerCase())+' = +'+smBonus()+' bonus · '+smRateKeyHTML(14).replace(/^<span class="rkey">|<\/span>$/g,'')+'</span>';}
  if(k==='auto'&&m.sys==='cico')return '<span class="rkey">'+esc(S.meta.ci_key||'2 = met · 1 = with a reminder · 0 = not yet')+'</span>';
  return k==='auto'?'':smRateKeyHTML(15);}

/* ---------------- the four looks ---------------- */
function smV2Sheet(){const look=smLook();if(look==='classic'||!S.sys)return null;
  if(!SM_V2_SYS.includes(S.sys)||(S.chk.weekly&&look!=='discreet'))return null;   /* perf, interlock and weekly sheets: the classic layout in the look's colours */
  const m=smModel();return look==='discreet'?smDiscreet(m):smLookSheet(m,look);}
function smHeadRight(m,look){const d=smD();let h='';
  if(m.p.need!=null)h+='<div class="v2-goal"><span>'+(look==='theme'?esc(SM_THEMES[smTheme()].goal):'My goal')+'</span><b>'+m.p.need+'</b><span>of '+m.p.poss+'</span></div>';
  if(d.wf!==false&&d.wf!=='0')h+='<div class="v2-wf"><span>I’m working for:</span><div class="box">'+(S.meta.sh_reward?esc(S.meta.sh_reward):'<i>draw it or<br>write it here</i>')+'</div></div>';
  return h;}
function smLookSheet(m,look){const d=smD(),th=SM_THEMES[smTheme()],acc=smAccent();const name=smName();
  const rr=m.sys==='match'&&/one reminder/.test(S.meta.t_rem||'');   /* a Yes allows one reminder: the adult tallies them under the rating */
  const many=m.tg.length*m.raters.length,lvn=(smLevels()||[0,0]).length,wide=many*Math.max(2,lvn),sz=look==='clean'?(wide>24?16:19):wide>30?17:wide>20?21:wide>12?25:30;
  const title=smTitle(look),dt=S.meta.sh_date?esc(S.meta.sh_date):'________';
  let h='<div class="v2 look-'+look+(look==='theme'?' theme-'+smTheme()+(th.col?' theme-col':''):'')+'" style="--acc:'+acc+';--acc2:'+(look==='theme'?th.a:'#f7c948')+'">';
  /* header */
  if(look==='clean')h+='<div class="v2-head">'+(smPhoto(56,'clean')?'<div class="v2-hl">'+smPhoto(56,'clean'):'')+'<div><div class="v2-title">'+esc(title)+'</div><div class="v2-sub">'+esc(name)+(S.meta.grade?' · Grade '+esc(S.meta.grade):'')+' · Date '+dt+'</div></div>'+(smPhoto(56,'clean')?'</div>':'')+'<div class="v2-meta">'+(m.p.need!=null?'Goal <b>'+(m.p.g!=null?pct(m.p.g):'')+'</b> ('+m.p.need+' of '+m.p.poss+')':'')+(d.wf!==false&&d.wf!=='0'?'<br>Working for: <span class="bl" style="min-width:150px">'+esc(S.meta.sh_reward||'')+'</span>':'')+'</div></div><div class="v2-keyline">'+smKeyLine(m)+'</div>';
  else{const pm=smPhotoMode(look);h+='<div class="v2-head">'+(look==='theme'?(smPhoto(64,'theme')||smArt(0,58)):(pm==='show'?'<div class="v2-av">'+smAvatar(64)+'</div>':pm==='blank'?'<div class="v2-av v2-ph-blank"><span>photo</span></div>':''))+'<div class="v2-ht"><div class="v2-title">'+esc(title)+'</div><div class="v2-sub">Date '+dt+' &nbsp; '+(m.match?'Me + '+esc(m.tw.toLowerCase())+'. Same answer = points!':m.sys==='cico'?esc(m.tw)+' rates each period.':'I rate each period.')+'</div></div>'+(look==='theme'?smArt(1,50):'')+'<div class="v2-hr">'+smHeadRight(m,look)+'</div></div>';
    const kl=smKeyLine(m);if(kl)h+='<div class="v2-keyline">'+kl+'</div>';}
  /* the table */
  const who=r=>r==='me'?'Me':esc(m.tw);
  h+='<table class="v2-t"><thead><tr><th class="c0" rowspan="'+(m.raters.length>1?2:1)+'">'+(m.sys==='interval'?'Check':look==='clean'?(parseInt(S.meta.grade,10)>=6?'Class':'Period'):'My day')+'</th>'+
    m.tg.map(t=>'<th class="tg" colspan="'+m.raters.length+'">'+(t.pic&&look!=='clean'?'<span class="tp">'+t.pic+'</span>':'')+'<b>'+esc(t.word)+'</b>'+(t.cue?'<small>'+esc(t.cue)+'</small>':'')+'</th>').join('')+
    (m.match?'<th class="mc" rowspan="'+(m.raters.length>1?2:1)+'">Same<br>answer</th>':'')+(m.init?'<th class="mc" rowspan="1">'+esc(m.tw)+'<br>initials</th>':'')+'<th class="pc" rowspan="'+(m.raters.length>1?2:1)+'">'+(look==='theme'?'Points':'My<br>points')+'</th></tr>'+
    (m.raters.length>1?'<tr class="who">'+m.tg.map(()=>m.raters.map(r=>'<th class="'+r+'">'+who(r)+'</th>').join('')).join('')+(m.init?'<th></th>':'')+'</tr>':'')+'</thead><tbody>';
  h+=m.rows.map(r=>'<tr><th class="c0">'+(r.pic&&look!=='clean'?'<span class="rp">'+r.pic+'</span>':'')+'<span class="rl"><b>'+esc(r.label)+'</b>'+(r.t||r.sub?'<small>'+esc(r.t||r.sub)+'</small>':'')+'</span></th>'+
    m.tg.map(()=>m.raters.map(x=>'<td class="'+x+'">'+smCell(m.sys,x==='t'?Math.round(sz*.86):sz)+(x==='t'&&rr?'<div class="rr">R R</div>':'')+'</td>').join('')).join('')+(m.match?'<td class="mc"></td>':'')+(m.init?'<td class="mc"></td>':'')+'<td class="pc"></td></tr>').join('');
  const span=1+m.tg.length*m.raters.length+(m.match?1:0)+(m.init?1:0);
  h+='<tr class="tot"><th colspan="'+span+'">'+(look==='theme'?esc(th.tot):'Today I earned')+'</th><td class="pc">/ '+(m.p.poss||'')+'</td></tr></tbody></table>';
  /* below the table */
  const below=[];const st=smStore();
  if(st.length)below.push(smStoreHTML(look==='clean'?'list':'tiles'));
  if(d.mid)below.push('<div class="v2-box v2-mid"><h4>'+esc(look==='theme'?th.mid:'Midday check')+'</h4>'+esc(d.mid)+'</div>');
  if(d.cstrip&&(S.meta.bc_task||S.meta.bc_rw))below.push(smContractStrip());
  if(d.qr)below.push('<div class="v2-box v2-qr">'+smQR(d.qr,look==='clean'?64:76)+'<div>'+esc(d.qrlab||'Watch how my sheet works')+'</div></div>');
  if(below.length)h+='<div class="v2-below">'+below.join('')+'</div>';
  if(S.chk.eval||S.chk.graph)h+='<div class="extras">'+(S.chk.eval?evalBox():'')+(S.chk.graph?graphStrip():'')+'</div>';
  if(rr)h=h.replace('<div class="v2-keyline">','<div class="v2-keyline"><span class="rkey"><b>R R</b> under '+esc(m.tw.toLowerCase())+'’s rating: one tally per reminder; a Yes allows one.</span> &nbsp; ');
  if(S.chk.home)h+=smTear();
  h+='<div class="v2-foot">'+esc(d.credit===false?'':'Form SM-1')+'</div></div>';
  return h;}
function smTitle(look){if(S.meta.sh_title)return S.meta.sh_title;const nm=smName(),poss=nm?nm+'’s':'My';
  if(look==='theme'&&!SM_THEMES[smTheme()].col)return poss+' '+SM_THEMES[smTheme()].t;
  if(look==='clean')return {match:'Self-Monitoring Report',cico:'Daily Progress Report',smiley:'Daily Expectations',contract:'Self-Monitoring Contract',interval:'On-Task Check',rubric:'Daily Point Sheet'}[S.sys]||'Daily Report';
  return poss+' '+({match:'Self & Match Sheet',contract:'Check Sheet',smiley:'Super Sheet',cico:'Daily Report',interval:'On-Task Check',rubric:'Point Sheet'}[S.sys]||'Sheet');}
function smTear(){const full=esc(S.meta.client||'');let t=tearOff();if(full)t=t.replace(full,esc(smName()));return t;}
function smContractStrip(){const m=S.meta;return '<div class="v2-box v2-contract"><h4>My contract</h4><span>'+esc(m.bc_task||'')+(m.bc_how?' ('+esc(m.bc_how)+')':'')+(m.bc_rw?' → '+esc(m.bc_rw)+(m.bc_rwwhen?', '+esc(m.bc_rwwhen):''):'')+'</span><span class="sg">'+esc(smName()||'Student')+' ________ &nbsp; '+esc(m.bc_teacher||smTeacher())+' ________</span></div>';}
/* the discreet look: day cards, initials only, two to six to a page */
function smDiscreet(m){const d=smD(),n=[1,2,4,6].includes(+d.cards)?+d.cards:(S.chk.weekly?6:2);const name=smName();
  const days=S.chk.weekly||n>1?['Monday','Tuesday','Wednesday','Thursday','Friday']:['Today'];
  const short=t=>{const w=String(t.word||'').replace(/^I\s+/i,'');return w.charAt(0).toUpperCase()+w.slice(1);};
  const ph=smPhoto(30,'discreet');const card=day=>'<div class="dc"><div class="dch">'+(ph?'<span class="dch-l">'+ph+'<b>'+esc(day)+'</b></span>':'<b>'+esc(day)+'</b>')+'<span>'+esc(name)+(m.p.need!=null?' · goal '+m.p.need+'/'+m.p.poss:'')+'</span></div><table><tr><th></th>'+m.rows.map((r,i)=>{const w=r.label.split(/[\s,/]+/)[0];return '<th title="'+esc(r.label)+'">'+(m.rows.length>8?i+1:esc(w.length>9?w.slice(0,8)+'.':w))+'</th>';}).join('')+'</tr>'+
    m.tg.map(t=>m.raters.map(x=>'<tr><td class="gl">'+esc(short(t))+(m.raters.length>1?' <i>('+(x==='me'?'me':esc(m.tw.toLowerCase()))+')</i>':'')+'</td>'+m.rows.map(()=>'<td>'+smCell(m.sys,13)+'</td>').join('')+'</tr>').join('')).join('')+
    '<tr><td class="gl">'+esc(m.tw)+' initials</td>'+m.rows.map(()=>'<td class="in"></td>').join('')+'</tr></table><div class="dcf"><span>Total ____ / '+(m.p.poss||'')+'</span>'+(smStore().length?'<span>Spend ____</span>':'')+'<span>'+smKeyLine(m,true).replace(/<(?!svg|\/svg|path|circle|text|\/text|span|\/span)[^>]+>/g,'')+'</span></div></div>';
  const cards=[];for(let i=0;i<n;i++){if(i===5&&n===6){cards.push('<div class="dc wk"><div class="dch"><b>My week</b><span>'+esc(name)+'</span></div><div class="bars">'+['M','T','W','Th','F'].map(x=>'<div><i></i><span>'+x+'</span></div>').join('')+'</div><div class="dcf"><span>Days at goal ____ / 5</span>'+(S.meta.bc_rw?'<span>'+esc(S.meta.bc_rw)+'</span>':'')+'</div></div>');break;}cards.push(card(days[i%days.length]));}
  let h='<div class="v2 look-discreet" style="--acc:'+smAccent()+'"><div class="dgrid n'+n+'">'+cards.join('')+'</div>'+(smStore().length?smStoreHTML('line'):'')+'<div class="v2-foot">Form SM-1</div></div>';return h;}

/* ===== sm-v2-ui.js ===== */
/* ===== Form SM-1 v2 (v21.45): the Design sheet, the reward store, the target library, the schedules, the quick starts,
   the live preview, the printing extras and the contract's link to the sheet. ===== */

/* ---------------- state: the v2 parts of a saved file ---------------- */
function smEnsure(){if(!S.d||typeof S.d!=='object'||Array.isArray(S.d))S.d={};if(!Array.isArray(S.store))S.store=[];if(!Array.isArray(S.per2))S.per2=[];
  S.per2.forEach(p=>{const h=toHM24(p.t);if(h)p.t=h;});}
const SM_D_KEYS={look:'s',theme:'s',accent:'s',rate:'s',rv:'s',rpics:'s',rwords:'s',mbonus:'s',tw:'s',nm:'s',av:'s',avimg:'img',wf:'b',mid:'s',qr:'s',qrlab:'s',cstrip:'b',cards:'s',bank:'b',tiers:'b',alt:'b',nofit:'b',bcpic:'b',phs:'s',rshow:'b',rspeak:'b',rchime:'b',rcue:'s',pin:'s'};   /* v21.46 the r… keys and pin: rating on the iPad (sm-rate.js) */
function smFromFile(s,o){const okImg=v=>typeof v==='string'&&/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<400000?v:'';
  const str=v=>v==null||typeof v==='object'?'':String(v);o.d={};
  const d=s.d&&typeof s.d==='object'&&!Array.isArray(s.d)?s.d:{};
  Object.keys(SM_D_KEYS).forEach(k=>{if(!(k in d))return;const t=SM_D_KEYS[k];o.d[k]=t==='b'?!!d[k]:t==='img'?okImg(d[k]):str(d[k]);});
  if(o.d.look&&!SM_LOOKS[o.d.look])delete o.d.look;if(o.d.theme&&!SM_THEMES[o.d.theme])delete o.d.theme;if(o.d.rate&&!SM_RATES[o.d.rate])delete o.d.rate;
  if(o.d.av&&!(window.NBH_PICTOS&&NBH_PICTOS[o.d.av]))o.d.av='';
  if(o.d.phs&&!['show','blank','off'].includes(o.d.phs))delete o.d.phs;
  o.store=Array.isArray(s.store)?s.store.slice(0,16).map(x=>({n:str(x&&x.n),icon:window.NBH_PICTOS&&NBH_PICTOS[str(x&&x.icon)]?str(x.icon):'',img:okImg(x&&x.img),p:str(x&&x.p),tier:['s','m','b'].includes(x&&x.tier)?x.tier:''})):[];
  o.per2=Array.isArray(s.per2)?s.per2.slice(0,16).map(x=>({t:str(x&&x.t),label:str(x&&x.label),icon:window.NBH_PICTOS&&NBH_PICTOS[str(x&&x.icon)]?str(x.icon):'',img:okImg(x&&x.img)})):[];
  return o;}

/* ---------------- re-render everything the design touches ---------------- */
function smRedraw(){renderPoints();renderSheet();renderSetup();}
document.addEventListener('input',e=>{const el=e.target;if(el.dataset.d!==undefined&&el.type!=='checkbox'&&el.type!=='radio'){smD()[el.dataset.d]=el.value;smRedraw();if(el.dataset.d==='rv'||el.dataset.d==='rwords')smRenderDesignRates();return;}
  if(el.dataset.r==='store'||el.dataset.r==='per2'){renderSheet();}});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.d===undefined)return;
  if(el.type==='checkbox')smD()[el.dataset.d]=el.checked;else smD()[el.dataset.d]=el.value;smRedraw();smRenderDesign();
  if(['bank','tiers'].includes(el.dataset.d))smRenderStore();if(el.dataset.d==='alt')smRenderSched();if(el.dataset.d==='bcpic')renderBc();});

function smRepick(r){if(r==='store')smRenderStore();else if(r==='per2')smRenderSched();}

/* ---------------- the Design sheet ---------------- */
const SM_LOOK_SW={classic:'linear-gradient(#fff,#fff)',bright:'linear-gradient(100deg,#1fa3a6,#2bb3a0 55%,#f7c948)',theme:'repeating-linear-gradient(90deg,#256d3b 0 18px,#2d7a43 18px 36px)',clean:'linear-gradient(#fff 0 70%,#1d3b5a 70% 76%,#fff 76%)',discreet:'repeating-linear-gradient(0deg,#fff 0 9px,#c3c9ce 9px 10px)'};
function smRenderDesign(){const el=$('#smDesign');if(!el)return;const d=smD(),look=smLook();
  const pk='<input type="radio" name="smLook"';
  let h='<h3>The look</h3><div class="sm2-looks">'+Object.entries(SM_LOOKS).map(([k,l])=>'<label class="'+(k===look?'on':'')+'"><div class="sw" style="background:'+SM_LOOK_SW[k]+';border:1px solid #d5dde3"></div><span>'+pk+' data-d="look" value="'+k+'"'+(k===look?' checked':'')+'> '+esc(l)+'</span></label>').join('')+'</div>';
  if(look==='theme'){const tb=([k,t])=>'<button type="button" data-smtheme="'+k+'" class="'+(k===smTheme()?'on':'')+'">'+(t.col?'<span class="sw2 sw2-'+k+'" style="background:'+t.c+'"></span>':typeof SM_THEME_ART!=='undefined'&&SM_THEME_ART[k]?'<svg class="art" viewBox="0 0 72 72">'+SM_THEME_ART[k][0]+'</svg>':'')+esc(t.l)+'</button>';
    const E=Object.entries(SM_THEMES);h+='<div><b>Theme with pictures</b></div><div class="sm2-themes">'+E.filter(x=>!x[1].col).map(tb).join('')+'</div><div><b>Plain or one colour</b> <span class="hint">(no pictures; Plain prints well in black and white)</span></div><div class="sm2-themes">'+E.filter(x=>x[1].col).map(tb).join('')+'</div>';}
  if(look!=='classic')h+='<div class="sm2-row"><label>Colour <input type="color" data-d="accent" value="'+esc(/^#[0-9a-f]{6}$/i.test(d.accent||'')?d.accent:smAccent())+'"></label><button type="button" class="tool" id="smAccReset">Back to the look&rsquo;s colour</button>'+
    '<label>Name on the sheet <select data-d="nm"><option value="">'+(['clean','discreet'].includes(look)?'Initials (this look&rsquo;s default)':'First name (this look&rsquo;s default)')+'</option><option value="nick"'+(d.nm==='nick'?' selected':'')+'>First name</option><option value="ini"'+(d.nm==='ini'?' selected':'')+'>Initials only</option><option value="full"'+(d.nm==='full'?' selected':'')+'>Full name</option></select></label>'+
    '<label>The adult who rates is called <input data-d="tw" value="'+esc(d.tw||'')+'" placeholder="Teacher" style="width:120px"></label></div>';
  /* v21.48 the student's photo, on every look */
  h+='<div class="sm2-row sm2-av"><b>Student&rsquo;s photo</b><span class="avp" id="smAvP">'+(smAvatar(52)||'<span class="hint">none chosen</span>')+'</span><button type="button" class="tool" id="smAvBtn">'+(d.av||d.avimg?'Change the photo':'Add a photo or picture')+'</button>'+(d.av||d.avimg?'<button type="button" class="tool" id="smAvNone">Remove it</button>':'')+
    '<label>On the sheet <select data-d="phs"><option value="">'+(look==='bright'?'Shown (this look&rsquo;s way)':'Not shown (this look&rsquo;s way)')+'</option><option value="show"'+(d.phs==='show'?' selected':'')+'>Shown</option><option value="blank"'+(d.phs==='blank'?' selected':'')+'>A blank circle to glue a printed photo onto</option><option value="off"'+(d.phs==='off'?' selected':'')+'>Not shown</option></select></label>'+
    '<span class="hint">Take one with the iPad&rsquo;s camera, upload one, or use a library picture (the boy or girl headshot). The photo stays inside this form&rsquo;s saved file and on this device; it is shown on the Rate page too.</span></div>';
  if(look==='discreet')h+='<div class="sm2-row"><label>Cards on a page <select data-d="cards">'+[['','2 (or 6 for a weekly sheet)'],['1','1'],['2','2'],['4','4'],['6','6: Monday to Friday and the week’s graph']].map(([v,l])=>'<option value="'+v+'"'+(String(d.cards||'')===v?' selected':'')+'>'+l+'</option>').join('')+'</select></label></div>';
  if(look!=='classic')h+='<div class="sm2-row"><label class="ck"><input type="checkbox" data-d="wf"'+(d.wf===false?'':' checked')+'> &ldquo;I&rsquo;m working for&rdquo; box (the reward chosen before the day starts)</label>'+
    '<label class="ck"><input type="checkbox" data-d="cstrip"'+(d.cstrip?' checked':'')+'> The contract&rsquo;s line on the sheet (from the Contract page)</label></div>'+
    '<div class="sm2-row"><label style="flex:1">Midday check (optional) <input data-d="mid" value="'+esc(d.mid||'')+'" placeholder="e.g., 18 points by lunch = 5 minutes of catch at recess" style="width:100%"></label></div>'+
    '<div class="sm2-row"><label style="flex:1">QR code link (optional): the walkthrough video saved to your drive, or any page for the team <input data-d="qr" value="'+esc(d.qr||'')+'" placeholder="https://" inputmode="url" style="width:100%"></label><label>Under the code <input data-d="qrlab" value="'+esc(d.qrlab||'')+'" placeholder="Watch how my sheet works"></label></div>';
  h+='<h3>How the student rates</h3><p class="hint">One choice for every sheet type. Each style has its points (edit them below); stars are coloured in, one point each. A rubric point sheet keeps its own five levels. With Self &amp; Match, a two-choice style uses the Match Points table (System page); a style with more levels counts '+esc(smTeacher().toLowerCase())+'&rsquo;s rating, plus a bonus when the student&rsquo;s rating is the same.</p><div id="smRates"></div>';
  el.innerHTML=h;smRenderDesignRates();}
function smRenderDesignRates(){const el=$('#smRates');if(!el)return;const d=smD(),k=smRateKey();
  let h='<div class="sm2-rates">'+SM_RATE_ORDER.map(r=>{const keep=d.rate;d.rate=r;const cell=r==='auto'?'<span class="hint">'+esc(SM_RATES.auto.note)+'</span>':smRateCell(26);d.rate=keep;
    return '<label class="'+(r===k?'on':'')+'"><input type="radio" name="smRate" data-d="rate" value="'+r+'"'+(r===k?' checked':'')+'>'+cell+'<b>'+esc(SM_RATES[r].l)+'</b></label>';}).join('')+'</div>';
  if(k!=='auto'){const lv=smLevels();h+='<div class="sm2-row"><label>Points for each level, in order <input data-d="rv" value="'+esc(d.rv||'')+'" placeholder="'+lv.map(x=>x[1]).join(',')+'" style="width:110px"></label><span>'+smRateKeyHTML(18)+'</span>'+
    (S.sys==='match'&&!smRateBin()?'<label>Bonus when the ratings are the same <input data-d="mbonus" value="'+esc(d.mbonus||'')+'" placeholder="1" style="width:50px"></label>':'')+'</div>';
    if(k==='words')h+='<div class="sm2-row"><label style="flex:1">The words, best first, separated by | <input data-d="rwords" value="'+esc(d.rwords||'')+'" placeholder="Nailed it|Almost|Not yet" style="width:100%"></label></div>';
    if(k==='pics')h+='<div class="sm2-row">'+String(d.rpics||'happy,calm,sad').split(',').slice(0,3).map((x,i)=>'<span class="sm2-av"><span class="avp">'+(window.NBH_PICTOS&&NBH_PICTOS[x.trim()]?picto(x.trim(),''):'')+'</span><button type="button" class="tool" data-smrpic="'+i+'">Picture '+(i+1)+'</button></span>').join('')+'<span class="hint">best first</span></div>';
    if(S.sys==='interval'&&!smRateBin())h+='<p class="hint">A cued-interval sheet with more than two levels asks &ldquo;How well was I working?&rdquo;: change the question on the System page to match.</p>';}
  el.innerHTML=h;}
document.addEventListener('click',e=>{const t=e.target.closest('[data-smtheme]');if(t){smD().theme=t.dataset.smtheme;smRedraw();smRenderDesign();return;}
  if(e.target.closest('#smAccReset')){smD().accent='';smRedraw();smRenderDesign();return;}
  if(e.target.closest('#smAvBtn')){const tmp=[{icon:smD().av||'',img:smD().avimg||''}];openPick(tmp,0,()=>{smD().av=tmp[0].icon||'';smD().avimg=tmp[0].img||'';smRedraw();smRenderDesign();});return;}
  if(e.target.closest('#smAvNone')){smD().av='';smD().avimg='';smRedraw();smRenderDesign();return;}
  const rp=e.target.closest('[data-smrpic]');if(rp){const keys=String(smD().rpics||'happy,calm,sad').split(',').map(x=>x.trim());while(keys.length<3)keys.push('');const i=+rp.dataset.smrpic;const tmp=[{icon:keys[i]||'',img:''}];
    openPick(tmp,0,()=>{if(tmp[0].img){alert('A rating picture comes from the library (a photo cannot be used as a rating choice).');return;}keys[i]=tmp[0].icon||keys[i];smD().rpics=keys.join(',');smRedraw();smRenderDesignRates();});}});

/* ---------------- the reward store ---------------- */
function smRenderStore(){const el=$('#smStore');if(!el)return;const d=smD();if(!S.store.length)S.store.push({n:'',icon:'',img:'',p:'',tier:''});
  el.innerHTML='<div class="tools"><button type="button" class="tool" id="smStAdd">Add a reward</button><button type="button" class="tool" id="smStDel">Remove last</button><button type="button" class="tool" id="smStMenu">Fill from the reward menu above</button></div>'+
    '<div class="grid-wrap"><table class="rt sm2-store"><thead><tr><th style="width:4%">#</th><th style="width:38%">Reward (as the student says it)</th><th style="width:22%">Picture</th><th style="width:12%">Points</th><th style="width:16%">Tier</th><th class="nx noprint"></th></tr></thead><tbody>'+
    S.store.map((o,i)=>'<tr><td class="num">'+(i+1)+'</td><td><input data-r="store" data-i="'+i+'" data-f="n" value="'+esc(o.n)+'" placeholder="Drawing time"></td><td>'+pickCell('store',i,o)+'</td><td><input data-r="store" data-i="'+i+'" data-f="p" value="'+esc(o.p)+'" placeholder="10" inputmode="numeric"></td>'+
      '<td><select data-r="store" data-i="'+i+'" data-f="tier"><option value=""></option>'+Object.entries(SM_TIERS).map(([k,l])=>'<option value="'+k+'"'+(o.tier===k?' selected':'')+'>'+l+'</option>').join('')+'</select></td>'+delCell('store',i,'reward')+'</tr>').join('')+'</tbody></table></div>'+
    '<div class="ckrow"><label class="ck"><input type="checkbox" data-d="tiers"'+(d.tiers?' checked':'')+'> Group the store by tier (small, medium, big)</label><label class="ck"><input type="checkbox" data-d="bank"'+(d.bank?' checked':'')+'> A bank: points not spent are saved for a bigger reward</label></div>'+
    (smStore().length&&smLook()==='classic'?'<p class="hint">The store prints on the Bright, Theme, Clean and Discreet looks (Design page) and on My Reward Menu.</p>':'');}
document.addEventListener('click',async e=>{
  if(e.target.closest('#smStAdd')){if(S.store.length>=16)return;S.store.push({n:'',icon:'',img:'',p:'',tier:''});smRenderStore();return;}
  if(e.target.closest('#smStDel')){if(S.store.length<=1)return;const r=S.store[S.store.length-1];if((r.n||r.p||r.icon||r.img)&&!(await nbhUI.confirm('Remove the last reward?',{ok:'Remove',danger:true})))return;S.store.pop();smRenderStore();renderSheet();return;}
  if(e.target.closest('#smStMenu')){const items=String(S.meta.menu||'').split(/\s*(?:·|\n|;)\s*/).map(x=>x.trim()).filter(Boolean);if(!items.length){alert('The reward menu above is empty.');return;}
    const have=new Set(smStore().map(o=>String(o.n).toLowerCase()));const prices=[5,8,10,12,15,20,25,30];let k=smStore().length;
    S.store=smStore();items.forEach(n=>{if(have.has(n.toLowerCase()))return;S.store.push({n,icon:smGuessIcon(n),img:'',p:String(prices[Math.min(k,prices.length-1)]),tier:''});k++;});smRenderStore();renderSheet();return;}
  const del=e.target.closest('button.rowDel[data-del="store"],button.rowDel[data-del="per2"]');if(del){e.stopImmediatePropagation();const r=del.dataset.del,i=+del.dataset.i,row=S[r][i];
    if((row.n||row.p||row.label||row.t||row.icon||row.img)&&!(await nbhUI.confirm(r==='store'?'Delete this reward?':'Delete this period of the second schedule?',{ok:'Delete',danger:true})))return;S[r].splice(i,1);if(r==='store')smRenderStore();else smRenderSched();renderSheet();}},true);
/* a picture for a reward from its words: the library labels and a few common rewards */
function smGuessIcon(n){const l=String(n).toLowerCase(),P=window.NBH_PICTOS||{};const map=[[/recess|playground|outside/,'playground'],[/draw|color/,'drawing'],[/line leader|line/,'lineup'],[/fish|pet|dog|cat/,'pet'],[/ipad|tablet/,'ipad'],[/computer/,'computer'],[/lego/,'lego'],[/game/,'game'],[/book|story|read/,'story'],[/music|song/,'musicfun'],[/dance/,'dance'],[/helper|job/,'helper'],[/sticker/,'sticker'],[/free time|choice/,'freetime'],[/snack|treat/,'snackfun'],[/puzzle/,'puzzle'],[/ball|catch|sport/,'ball'],[/bubble/,'bubbles'],[/walk/,'walkfun'],[/video|youtube/,'video'],[/swing/,'swing'],[/bike/,'bike'],[/play-?doh|clay/,'playdough']];
  for(const [re,k] of map)if(re.test(l)&&P[k])return k;const hit=Object.keys(P).find(k=>P[k].l&&l.includes(P[k].l.toLowerCase()));return hit||'';}

/* ---------------- the target library ---------------- */
const SM_LIB=(typeof SM_LIBRARY!=='undefined'&&SM_LIBRARY.entries)||[];
function smLibDlg(){let d=$('#smLibDlg');if(d)return d;d=document.createElement('dialog');d.id='smLibDlg';d.setAttribute('aria-label','Target library');
  d.innerHTML='<div class="lb-head"><b>Add targets from the library</b><select id="smLibAge"><option value="">All ages</option><option value="young">Younger students (K to 3)</option><option value="older">Older students (4 to 12)</option></select><input id="smLibQ" placeholder="search" aria-label="Search the library"></div><div class="lb-list" id="smLibList"></div><div class="lb-foot"><span class="hint" id="smLibN"></span><button type="button" class="tool" id="smLibClose">Cancel</button><button type="button" class="tool primary" id="smLibAdd">Add the chosen targets</button></div>';
  document.body.appendChild(d);const sel=new Set();
  const list=()=>{const a=$('#smLibAge',d).value,q=($('#smLibQ',d).value||'').toLowerCase();let g='',h='';
    SM_LIB.filter(x=>(!a||x.age===a||x.age==='all')&&(!q||(x.word+' '+x.def+' '+x.group).toLowerCase().includes(q))).forEach(x=>{if(x.group!==g){g=x.group;h+='<div class="lb-g">'+esc(g)+'</div>';}
      h+='<div class="lb-it'+(sel.has(x.id)?' on':'')+'" data-lib="'+esc(x.id)+'" role="checkbox" aria-checked="'+sel.has(x.id)+'" tabindex="0"><span class="tp">'+(window.NBH_PICTOS&&NBH_PICTOS[x.icon]?picto(x.icon,''):'')+'</span><span><b>'+esc(x.word)+'</b><small>'+esc(x.def)+'</small></span></div>';});
    $('#smLibList',d).innerHTML=h||'<p class="hint">Nothing matches.</p>';const room=6-S.tg.filter(t=>t.word||t.def).length;$('#smLibN',d).textContent=sel.size+' chosen · room for '+Math.max(0,room)+' more on the sheet';};
  $('#smLibAge',d).addEventListener('change',list);$('#smLibQ',d).addEventListener('input',list);
  const tog=it=>{const id=it.dataset.lib;if(sel.has(id))sel.delete(id);else sel.add(id);list();};
  $('#smLibList',d).addEventListener('click',e=>{const it=e.target.closest('[data-lib]');if(it)tog(it);});
  $('#smLibList',d).addEventListener('keydown',e=>{const it=e.target.closest('[data-lib]');if(it&&(e.key===' '||e.key==='Enter')){e.preventDefault();tog(it);}});
  $('#smLibClose',d).addEventListener('click',()=>d.close());
  $('#smLibAdd',d).addEventListener('click',()=>{const n=smLibPlace([...sel]);sel.clear();d.close();if(n)nbhUI.toast(n+' target'+(n===1?'':'s')+' added from the library. Edit the wording on the Targets page to fit the student.',{kind:'ok'});});
  d.list=list;d.sel=sel;return d;}
/* place library entries: empty rows first, then new rows, up to six; a target already on the sheet is not placed twice */
function smLibPlace(ids){let n=0;const have=new Set(S.tg.map(t=>String(t.word||'').trim().toLowerCase()).filter(Boolean));
  ids.map(id=>SM_LIB.find(x=>x.id===id)).filter(Boolean).forEach(x=>{if(have.has(x.word.toLowerCase()))return;let row=S.tg.find(t=>!t.word&&!t.def&&!t.cue);
    if(!row){if(S.tg.length>=6)return;row={word:'',def:'',cue:'',ex:'',nex:'',icon:'',img:'',goal:''};S.tg.push(row);}
    Object.assign(row,{word:x.word,def:x.def,cue:x.cue,ex:x.ex,nex:x.nex,icon:x.icon,img:'',goal:x.goal||''});have.add(x.word.toLowerCase());n++;});
  renderT();renderSheet();renderPoints();renderSetup();return n;}
document.addEventListener('click',e=>{if(e.target.closest('#smLibBtn')){if(!SM_LIB.length){alert('The library is not in this copy of the form.');return;}const d=smLibDlg();$('#smLibQ',d).value='';const g=parseInt(S.meta.grade,10);$('#smLibAge',d).value=isFinite(g)?(g<=3?'young':'older'):'';d.list();d.showModal();}});

/* ---------------- schedules ---------------- */
const SM_SCHED={
  elem:{l:'Elementary day',rows:[['08:00','Arrival and morning meeting','arrival'],['08:30','Reading','reading'],['09:30','Writing','writing'],['10:15','Math','math'],['11:15','Specials','art'],['12:00','Lunch and recess','lunch'],['12:45','Science or social studies','science'],['13:30','Centers','centers'],['14:15','Pack up and dismissal','dismissal']]},
  half:{l:'Half day (morning)',rows:[['08:00','Arrival','arrival'],['08:30','Reading','reading'],['09:30','Math','math'],['10:30','Recess','recess'],['11:00','Centers','centers']]},
  ms:{l:'Middle school, seven periods',rows:[['08:05','ELA','reading'],['08:55','Math','math'],['09:45','Science','science'],['10:35','Social studies','library'],['11:25','Lunch','lunch'],['12:10','PE','pe'],['13:00','Advisory','classroom']]},
  hs:{l:'High school, seven periods',rows:[['07:30','1st period',''],['08:25','2nd period',''],['09:20','3rd period',''],['10:15','4th period',''],['11:10','Lunch',''],['11:45','5th period',''],['12:40','6th period',''],['13:35','7th period','']]},
  block:{l:'High school block, four periods',rows:[['07:30','Block 1',''],['09:10','Block 2',''],['10:50','Lunch',''],['11:25','Block 3',''],['13:05','Block 4','']]}
};
function smRenderSched(){const el=$('#smSched');if(!el)return;const d=smD();
  let h='<div class="sm2-row"><label>Start from a schedule <select id="smSchedSel"><option value="">choose…</option>'+Object.entries(SM_SCHED).map(([k,v])=>'<option value="'+k+'">'+esc(v.l)+'</option>').join('')+'</select></label>'+
    '<span>or rows every <input id="smEvN" value="15" inputmode="numeric" style="width:48px"> minutes, <input id="smEvC" value="8" inputmode="numeric" style="width:44px"> rows, from <input type="time" id="smEvT" value="09:00"></span><button type="button" class="tool" id="smEvGo">Make the rows</button></div>'+
    '<div class="ckrow"><label class="ck"><input type="checkbox" data-d="alt"'+(d.alt?' checked':'')+'> A second schedule for another kind of day (specials day, early release); the sheet shows it while this is ticked</label></div>';
  if(d.alt){if(!S.per2.length)S.per2=S.per.map(p=>Object.assign({},p));
    h+='<div class="tools"><button type="button" class="tool" id="smP2Add">Add a period</button><button type="button" class="tool" id="smP2Copy">Copy the regular day</button></div><div class="grid-wrap"><table class="rt"><thead><tr><th style="width:5%">#</th><th style="width:22%">Time</th><th style="width:38%">Label</th><th>Picture</th><th class="nx noprint"></th></tr></thead><tbody>'+
      S.per2.map((r,i)=>'<tr><td class="num">'+(i+1)+'</td><td><input type="time" data-r="per2" data-i="'+i+'" data-f="t" value="'+esc(toHM24(r.t)||r.t)+'"></td><td><input data-r="per2" data-i="'+i+'" data-f="label" value="'+esc(r.label)+'"></td><td>'+pickCell('per2',i,r)+'</td>'+delCell('per2',i,'period')+'</tr>').join('')+'</tbody></table></div>'+
      '<p class="hint">The Record and the week grid follow the regular day&rsquo;s periods; the second schedule changes only the printed sheet.</p>';}
  el.innerHTML=h;}
async function smUseSched(rows,label){const has=S.per.some(p=>p.t||p.label);if(has&&!(await nbhUI.confirm('Replace the periods with the '+label+'?\nThe current periods and their pictures are replaced; the Record keeps its days.',{ok:'Replace'})))return false;
  S.per=rows.map(([t,l,ic])=>({t,label:l,icon:window.NBH_PICTOS&&NBH_PICTOS[ic]?ic:'',img:''}));renderP();renderSheet();renderPoints();renderWk();return true;}
document.addEventListener('change',e=>{if(e.target.id==='smSchedSel'){const k=e.target.value;e.target.value='';if(SM_SCHED[k])smUseSched(SM_SCHED[k].rows,SM_SCHED[k].l.toLowerCase());}});
document.addEventListener('click',e=>{if(e.target.closest('#smEvGo')){const n=Math.max(1,Math.min(60,num($('#smEvN').value)||15)),c=Math.max(1,Math.min(16,num($('#smEvC').value)||8)),t0=toHM24($('#smEvT').value)||'09:00';
    const m0=+t0.slice(0,2)*60+ +t0.slice(3,5);smUseSched(Array.from({length:c},(_,i)=>{const m=m0+i*n;return [String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0'),'Check '+(i+1),''];}),'rows every '+n+' minutes');}
  if(e.target.closest('#smP2Add')){if(S.per2.length<16){S.per2.push({t:'',label:'',icon:'',img:''});smRenderSched();}}
  if(e.target.closest('#smP2Copy')){S.per2=S.per.map(p=>Object.assign({},p));smRenderSched();renderSheet();}});

/* ---------------- quick starts ---------------- */
const SM_QS=[
  {id:'young',ic:'stayarea',t:'Young student: pictures, Self & Match',x:'Thumbs up or down for the student and the teacher, pictures for each period, a reward store with prices. Kindergarten to grade 3.',sys:'match',chk:{pict:true,graph:true,home:true,pocket:false,weekly:false},d:{look:'bright',rate:'thumbs'},lib:['stay_area','follow_first','kind_words'],sched:'elem'},
  {id:'expect',ic:'calm',t:'Expectations sheet with the student’s interest',x:'Three smiles per expectation, a sports (or space, animals…) sheet, a midday check, the reward store.',sys:'smiley',chk:{pict:true,pocket:false,weekly:false},d:{look:'theme',theme:'sports',rate:'faces3',mid:'Half the points by lunch = 5 minutes of a game at recess'},lib:['task_start_y','change_y','kind_words'],sched:'elem'},
  {id:'ontask',ic:'timer',t:'On-task checks during independent work',x:'A cue every few minutes: “Was I working?” The student and the teacher answer; the matches count.',sys:'interval',chk:{pict:true,pocket:false},d:{look:'bright',rate:'faces2'},lib:[],sched:'',meta:{iv_q:'Was I working?',iv_len:'3',iv_n:'10',iv_cue:'Tactile timer (vibrating prompt)',iv_timing:'Fixed: every interval the same length',iv_match:'Every interval',iv_act:'independent work'}},
  {id:'cico',ic:'teacher',t:'Middle school Check-In / Check-Out',x:'0, 1 or 2 points per class, a mentor at both ends of the day, points to spend, a clean report.',sys:'cico',chk:{pict:false,pocket:false,weekly:false},d:{look:'clean',rate:'p012'},lib:['task_start_o','on_task','respect_staff_o'],sched:'ms'},
  {id:'teen',ic:'ok',t:'High school pocket cards',x:'Plus or minus, initials only, a card a day and the week’s graph, the student and the teacher both rate.',sys:'match',chk:{pict:false,pocket:false,weekly:false},d:{look:'discreet',rate:'pm',cards:'6'},lib:['task_start_o','talk_turns_o','respect_staff_o'],sched:'hs'},
  {id:'rubric',ic:'check',t:'Point sheet with levels',x:'One rating from 1 to 5 each period, each level described; the student and the teacher both circle.',sys:'rubric',chk:{rubmatch:true,pict:true,pocket:false,weekly:false},d:{look:'clean'},lib:[],sched:'elem'}
];
function smRenderQS(){const el=$('#smQS');if(!el)return;el.innerHTML='<p class="hint">Start from a common arrangement and change anything after: it sets the sheet type, the look and the rating, and fills the targets and the day where they are empty (nothing you have entered is replaced).</p><div class="sm2-qs">'+
  SM_QS.map(q=>'<button type="button" data-qs="'+q.id+'"><span class="qi">'+(window.NBH_PICTOS&&NBH_PICTOS[q.ic]?picto(q.ic,''):'')+'</span><span><b>'+esc(q.t)+'</b><small>'+esc(q.x)+'</small></span></button>').join('')+'</div>';}
async function smQuick(id){const q=SM_QS.find(x=>x.id===id);if(!q)return;
  if(!(await nbhUI.confirm('Use “'+q.t+'”?\nThe sheet type, the look and the rating style change. Targets and periods are filled only where they are empty.',{ok:'Use it'})))return;
  S.sys=q.sys;Object.assign(S.chk,q.chk||{});const keep={tw:smD().tw,av:smD().av,avimg:smD().avimg,qr:smD().qr,qrlab:smD().qrlab,accent:''};S.d=Object.assign({},smD(),{rv:'',mbonus:'',cards:''},q.d,keep);
  if(q.meta)Object.keys(q.meta).forEach(k=>{if(!S.meta[k])S.meta[k]=q.meta[k];});
  if(q.lib.length&&S.tg.every(t=>!t.word&&!t.def)){S.tg=[];smLibPlace(q.lib);}
  if(q.sched&&S.per.every(p=>!p.t&&!p.label))S.per=SM_SCHED[q.sched].rows.map(([t,l,ic])=>({t,label:l,icon:window.NBH_PICTOS&&NBH_PICTOS[ic]?ic:'',img:''}));
  if(!smStore().length&&S.meta.menu)$('#smStMenu')&&$('#smStMenu').click();
  renderAll();setView('sheet');nbhUI.toast('“'+q.t+'” is set. Change the targets, the day, the look or the rating on their pages.',{kind:'ok'});}
document.addEventListener('click',e=>{const b=e.target.closest('[data-qs]');if(b)smQuick(b.dataset.qs);});

/* ---------------- the live preview ---------------- */
let SMPV=false;
function smPrevUI(){if(!$('#smPrevBtn')){const b=document.createElement('button');b.type='button';b.id='smPrevBtn';b.className='noprint';b.textContent='Preview the sheet';b.setAttribute('aria-expanded','false');document.body.appendChild(b);
    const p=document.createElement('div');p.id='smPrev';p.className='noprint';p.hidden=true;p.innerHTML='<div class="ph">The student&rsquo;s sheet, as it prints<button type="button" class="tool" id="smPrevGo">Open the Sheet page</button><button type="button" class="tool" id="smPrevX" aria-label="Close the preview">×</button></div><div class="pb" id="smPrevB" title="Open the Sheet page"><div class="pi" id="smPrevI"></div></div>';document.body.appendChild(p);}
  }
function smPrevDraw(){const p=$('#smPrev');if(!p||p.hidden)return;const i=$('#smPrevI'),src=$('#sheetOut');i.className='pi '+src.className;i.innerHTML=src.innerHTML;i.querySelectorAll('button').forEach(b=>b.remove());
  const w=p.clientWidth||440,k=w/980;i.style.transform='scale('+k+')';$('#smPrevB').style.height=Math.min(window.innerHeight*.55,i.scrollHeight*k)+'px';}
document.addEventListener('click',e=>{if(e.target.closest('#smPrevBtn')){SMPV=!SMPV;$('#smPrev').hidden=!SMPV;$('#smPrevBtn').setAttribute('aria-expanded',String(SMPV));$('#smPrevBtn').textContent=SMPV?'Hide the preview':'Preview the sheet';smPrevDraw();}
  if(e.target.closest('#smPrevX')){SMPV=false;$('#smPrev').hidden=true;$('#smPrevBtn').textContent='Preview the sheet';}
  if(e.target.closest('#smPrevGo')||e.target.closest('#smPrevB'))setView('sheet');});
window.addEventListener('resize',()=>{if(SMPV)smPrevDraw();});

/* ---------------- the sheet page: fit, and the extra prints ---------------- */
const SM_PAGE={landscape:[960,720],portrait:[720,960]};
function smFit(){const out=$('#sheetOut');if(!out||!S.sys)return {k:1,h:0};const o=sheetOrientation(),[W,H]=SM_PAGE[o];
  const m=document.createElement('div');m.className=out.className;m.style.cssText='position:absolute;left:-10000px;top:0;width:'+W+'px;visibility:hidden';m.innerHTML=out.innerHTML;document.body.appendChild(m);
  const sw=m.scrollWidth,sh=m.scrollHeight;m.remove();const k=Math.min(1,W/Math.max(W,sw),H/Math.max(1,sh));return {k,h:sh,w:sw,o,W,H};}
function smRenderSheetTools(){const el=$('#smSheetTools');if(!el)return;if(!S.sys){el.innerHTML='';return;}const f=smFit(),d=smD();
  const multi=(smLook()==='discreet')||(S.sys==='perf'||S.sys==='interlock');
  el.innerHTML=(f.h?'<div class="sm2-fit '+(f.k>=.985?'ok':'big')+'">'+(f.k>=.985?'Fits on one '+f.o+' page.':'Runs past one '+f.o+' page at full size'+(d.nofit?': it will print on two pages.':': it prints shrunk to '+Math.round(f.k*100)+'% to fit one page.')+(f.k<.8?' That is small: fewer periods or targets, or a looser look, reads better.':''))+
      (f.k<.985?' <label class="ck" style="display:inline-flex;margin-left:8px"><input type="checkbox" data-d="nofit"'+(d.nofit?' checked':'')+'> print at full size instead</label>':'')+'</div>':'')+
    '<div class="sm2-prints"><button type="button" class="tool" id="smPrWeek">Print a week (Monday to Friday)</button>'+(multi?'':'<button type="button" class="tool" id="smPrHalf">Print two half-size copies on a page</button>')+
    '<button type="button" class="tool" id="smPrMenu"'+(smStore().length?'':' disabled title="Add rewards to the store on the Reinforcement page"')+'>Print My Reward Menu</button><button type="button" class="tool" id="smPrGuide">Print How to Run This Sheet (staff)</button><button type="button" class="tool" id="smPrPrac"'+(S.tg.some(t=>t.ex||t.nex)?'':' disabled title="Write an example and a non-example for a target on the Targets page"')+'>Print a rating practice page</button></div>';}
/* the sheet printed alone: shrunk to one page unless the user asked for full size */
const smPrintAlone0=printAlone;
printAlone=function(cls,orient){if(cls==='sm-sheet-only'&&!smD().nofit){const f=smFit();if(f.k<.985){const st=document.createElement('style');st.textContent='@media print{#sheetOut{zoom:'+f.k.toFixed(3)+'}}';document.head.appendChild(st);const off=()=>{st.remove();window.removeEventListener('afterprint',off);};window.addEventListener('afterprint',off);setTimeout(off,60000);}}
  return smPrintAlone0(cls,orient);};
function smExtraPrint(html,orient){const x=$('#smExtraOut');x.innerHTML=html;printAlone('sm-extra-only',orient);const off=()=>{x.innerHTML='';window.removeEventListener('afterprint',off);};window.addEventListener('afterprint',off);}
function smSheetAs(day){const keep=S.meta.sh_date;S.meta.sh_date=day;renderSheet();const h=$('#sheetOut').innerHTML,c=$('#sheetOut').className;S.meta.sh_date=keep;renderSheet();return {h,c};}
document.addEventListener('click',e=>{if(!S.sys&&e.target.closest('#smSheetTools button'))return;
  if(e.target.closest('#smPrWeek')){const f=smFit(),z=smD().nofit?1:f.k;smExtraPrint(DAYS.map(dn=>{const r=smSheetAs(dn+' ________');return '<div class="pg"><div class="'+r.c+'" style="zoom:'+z.toFixed(3)+'">'+r.h+'</div></div>';}).join(''),sheetOrientation());}
  if(e.target.closest('#smPrHalf')){const f=smFit(),k=Math.min(720/Math.max(1,f.w||960),470/Math.max(1,f.h||720));const c=$('#sheetOut').className,h=$('#sheetOut').innerHTML;smExtraPrint('<div class="pg"><div class="'+c+'" style="zoom:'+k.toFixed(3)+'">'+h+'</div><div style="border-top:1.5px dashed #999;margin:12px 0;font-size:10px;color:#888">✂</div><div class="'+c+'" style="zoom:'+k.toFixed(3)+'">'+h+'</div></div>','portrait');}
  if(e.target.closest('#smPrMenu'))smExtraPrint(smMenuPage(),'portrait');
  if(e.target.closest('#smPrGuide'))smExtraPrint(smGuidePage(),'portrait');
  if(e.target.closest('#smPrPrac'))smExtraPrint(smPracticePage(),'portrait');});
function smMenuPage(){const st=smStore().slice().sort((a,b)=>(num(a.p)??1e9)-(num(b.p)??1e9)),nm=smName()||'My';
  return '<div class="pg sm2-pg"><h2 style="font:700 34px &quot;Avenir Next&quot;,Avenir,&quot;URW Gothic&quot;,system-ui,sans-serif;color:#c27c00;text-align:center">'+esc(nm==='My'?'My':nm+'’s')+' Reward Menu</h2><p class="sub" style="text-align:center;font-size:16px">Points I need for each reward'+(smD().bank?' · points I save stay in my bank':'')+'</p><div class="sm2-menu">'+
    st.map(o=>'<div class="it">'+smStorePic(o,84)+esc(o.n||'')+'<br><span class="pr">'+esc(o.p||'')+'</span></div>').join('')+'</div><p class="sub" style="margin-top:16px;text-align:right">Form SM-1</p></div>';}
function smGuidePage(){const m=S.meta,p=possible(),tw=smTeacher(),lv=smLevels(),sysN={match:'Self & Match',contract:'Self-monitoring contract',rubric:'Rubric point sheet',interval:'Cued intervals',interlock:'Interlocking schedule session',smiley:'Expectations and earns',perf:'Performance count',cico:'Check-in / check-out'}[S.sys]||'';
  const rate=lv?(SM_RATES[smRateKey()].count?'colors in 0 to 3 stars':'circles one of: '+lv.map(x=>x[2]+' ('+x[1]+')').join(', ')):'rates as the sheet shows';
  const steps=[];steps.push('<b>Before the day.</b> The student chooses a reward from the store'+(smStore().length?' ('+smStore().map(o=>esc(o.n)+' '+esc(o.p)).join(', ')+')':'')+' and writes it, or puts its picture, in the &ldquo;working for&rdquo; box. Say the goal aloud: '+(p.need!=null?p.need+' of '+p.poss+' '+esc(p.unit):'the goal on the sheet')+'.');
  if(S.sys==='interval')steps.push('<b>At each cue</b> ('+esc(m.iv_cue||'timer')+', about every '+esc(m.iv_len||'3')+' minutes) the student asks &ldquo;'+esc(m.iv_q||'Was I working?')+'&rdquo; and '+rate+', then goes straight back to work. '+esc(tw)+' rates '+esc(m.iv_match||'the same intervals')+' without looking at the student&rsquo;s sheet.');
  else steps.push('<b>At the end of each period</b> the student '+rate+' for each target. '+(['match','rubric','interval'].includes(S.sys)?esc(tw)+' rates too, on their own, before seeing the student&rsquo;s rating, then the two compare: ':'')+(S.sys==='match'?(smRateBin()?'the same answer earns the points in the key (an honest no still earns).':esc(tw)+'&rsquo;s rating counts and a matching rating earns a bonus point.'):S.sys==='cico'?esc(tw)+' writes 0, 1 or 2 and initials.':'')+(/one reminder/.test(m.t_rem||'')?' A yes allows one reminder; tally reminders in the R R box.':''));
  steps.push('<b>Say what you saw,</b> in one sentence, in the student&rsquo;s terms (&ldquo;You stayed in your area the whole time&rdquo;). Praise honest ratings, including an honest no.');
  steps.push('<b>Never</b> take points away, argue about a rating, or show the sheet to the class. '+esc(m.never||''));
  steps.push('<b>At the end of the day</b> the student adds up the points with you. If the goal is met, the reward is delivered '+esc((m.when||'the same day').toLowerCase())+'. Initial the sheet'+(S.chk.home?' and send the home note':'')+'.');
  steps.push('<b>Record the day</b> on the Record page of Form SM-1: the points, the points possible'+(['match','interval'].includes(S.sys)?', the matches and the ratings compared':'')+'.');
  return '<div class="pg sm2-pg"><h2>How to Run This Sheet</h2><p class="sub">'+esc(smName()||'')+' · '+esc(sysN)+(m.rater?' · Rated by '+esc(m.rater):'')+(m.bcba?' · '+esc(m.bcba):'')+'</p><ol>'+steps.map(s=>'<li>'+s+'</li>').join('')+'</ol>'+
    '<div class="box"><b>The targets</b><table style="margin-top:6px"><tr><th style="width:26%">On the sheet</th><th>What it looks like (the definition)</th><th style="width:22%">Example</th><th style="width:22%">Not an example</th></tr>'+S.tg.filter(t=>t.word||t.def).map(t=>'<tr><td>'+esc(t.word)+'</td><td>'+esc(t.def)+'</td><td>'+esc(t.ex)+'</td><td>'+esc(t.nex)+'</td></tr>').join('')+'</table></div>'+
    (m.cc_up?'<div class="box"><b>When the goal changes.</b> Raise it when '+esc(m.cc_up)+(m.cc_step?', by '+esc(m.cc_step):'')+'. '+(m.cc_down?'Lower it, or change the reward, when '+esc(m.cc_down)+'.':'')+'</div>':'')+'<p class="sub" style="text-align:right">Form SM-1</p></div>';}
function smPracticePage(){const items=[];S.tg.forEach(t=>{if(t.ex)items.push({t,s:t.ex,yes:true});if(t.nex)items.push({t,s:t.nex,yes:false});});
  const order=items.map((x,i)=>({x,k:(i*7+3)%11})).sort((a,b)=>a.k-b.k).map(a=>a.x).slice(0,10);const lv=smLevels()||[['fh',1],['fs',0]];const bin=lv.length===2;
  const cell=smRateKey()==='auto'?smGlyph('fh',28)+smGlyph('fs',28):smRateCell(28);
  return '<div class="pg sm2-pg"><h2>Practice: How Did It Go?</h2><p class="sub">'+esc(smName()||'')+' · Read each one (or listen). Circle how it went'+(bin?'':': the best rating if it was done, the lowest if it was not')+'.</p><table>'+order.map((o,i)=>'<tr><td style="width:5%;text-align:center">'+(i+1)+'</td><td style="width:26%"><b>'+esc(o.t.word)+'</b></td><td>'+esc(o.s)+'</td><td style="width:22%;text-align:center">'+cell+'</td></tr>').join('')+'</table>'+
    '<p class="sub" style="margin-top:18px;font-size:11px">Answer key for the adult: '+order.map((o,i)=>(i+1)+' '+(o.yes?'yes':'no')).join(' · ')+'</p><p class="sub" style="text-align:right">Form SM-1 · the targets&rsquo; own examples and non-examples</p></div>';}

/* ---------------- the contract, linked to the sheet ---------------- */
function smRenderBcTools(){const el=$('#smBcTools');if(!el)return;el.innerHTML='<div class="sm2-row" style="margin:8px 0"><button type="button" class="tool" id="smBcFill">Fill the empty lines from the sheet</button><label class="ck"><input type="checkbox" data-d="bcpic"'+(smD().bcpic?' checked':'')+'> Pictures on the contract (for a younger student)</label><label class="ck"><input type="checkbox" data-d="cstrip"'+(smD().cstrip?' checked':'')+'> Put the contract&rsquo;s line on the sheet</label></div>';}
document.addEventListener('click',e=>{if(!e.target.closest('#smBcFill'))return;const m=S.meta,p=possible();let n=0;const set=(k,v)=>{if(!m[k]&&v){m[k]=v;n++;}};
  set('bc_task','Earn my goal on my '+({match:'Self & Match sheet',cico:'daily progress report',smiley:'self-monitoring sheet'}[S.sys]||'point sheet'));
  set('bc_how',p.need!=null?'At least '+p.need+' of '+p.poss+' '+p.unit+' a day, on 4 of 5 school days':'');
  set('bc_when','Every school day'+(S.per.length?', '+S.per.length+' period'+(S.per.length===1?'':'s'):''));
  set('bc_record',(m.rater||smTeacher())+' initials the sheet each day');const st=smStore();
  set('bc_rw',st.length?st.slice().sort((a,b)=>(num(b.p)??0)-(num(a.p)??0))[0].n:String(m.menu||'').split(/\s*(?:·|\n|;)\s*/)[0]||'');
  set('bc_rwwhen',m.when||'');bindMeta();renderBc();renderSheet();nbhUI.toast(n?n+' line'+(n===1?'':'s')+' filled from the sheet; read them and change any.':'Nothing was empty: every line already had your words.',{kind:'ok'});});
const smRenderBc0=renderBc;
renderBc=function(){smRenderBc0();const out=$('#bcOut');if(!out||!smD().bcpic)return;const tg=S.tg.filter(t=>t.word&&(t.icon||t.img)),st=smStore(),rw=String(S.meta.bc_rw||'').toLowerCase();
  const r=st.find(o=>o.n&&rw.includes(String(o.n).toLowerCase()))||null;
  const strip='<div class="bc-pics" style="display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap;margin:6px 0 10px;font:600 13px &quot;Avenir Next&quot;,Avenir,system-ui,sans-serif">'+tg.map(t=>'<div style="text-align:center;width:96px">'+pic(t,'')+'<div>'+esc(t.word)+'</div></div>').join('')+(r?'<div style="font-size:30px;padding:0 6px">→</div><div style="text-align:center;width:110px">'+smStorePic(r,64)+'<div>'+esc(r.n)+'</div></div>':'')+'</div>';
  const h3=out.querySelector('h3');if(h3)h3.insertAdjacentHTML('afterend',strip);out.querySelectorAll('.bc-pics svg,.bc-pics img').forEach(x=>{x.style.width=x.style.width||'64px';x.style.height=x.style.height||'64px';});};

/* ---------------- wiring into the form's renders ---------------- */
const smRenderSheet0=renderSheet;
renderSheet=function(){smEnsure();const out=$('#sheetOut');const v=typeof smV2Sheet==='function'&&S.sys?smV2Sheet():null;
  if(v!=null){out.className='v2out'+(S.chk.big?' sm-big':'');out.innerHTML=v;}else{smRenderSheet0();const l=smLook();if(l!=='classic'&&S.sys){out.classList.add('look-'+l);out.style.setProperty('--acc',smAccent());}else out.style.removeProperty('--acc');}
  smRenderSheetTools();if(SMPV)smPrevDraw();};
const smRenderAll0=renderAll;
renderAll=function(){smEnsure();smRenderAll0();smRenderDesign();smRenderStore();smRenderSched();smRenderQS();smRenderBcTools();smPrevUI();};
const smFromFile0=fromFile;
fromFile=function(d){const o=smFromFile0(d);if(!o)return o;return smFromFile(d.S,o);};

/* ===== sm-rate.js ===== */
/* ===== Form SM-1 (v21.46): rating on the iPad. =====
   The Rate page: at the end of each period the student taps a rating for each target instead of circling it, the adult taps
   theirs where the system has a match (Self & Match, cued intervals, the rubric with the teacher matching), and the points,
   the match and the goal follow as they tap. A day is kept in S.days under its date (yyyy-mm-dd): the ratings by cell
   ("period_target": the level's place in the rating style, 0 the highest), the reminders by period, the reward worked for and
   the one chosen, a note, and when it was finished. Finish the day writes the day to the Record as one row (updated, not
   repeated, if it is finished again). The Student screen fills the iPad with the student's part; holding the adult's button
   (and the PIN, when one is set) opens the adult's part. A cue timer for cued intervals, a chime when a period ends, read
   aloud by the iPad's own voice, and a printed day report. Everything stays in the form's file on this device.

   How the points are counted, the same as on paper:
   - one rater (contract, expectations, check-in/check-out): the points of the level tapped;
   - Self & Match, a two-level style: the Match Points table (System page): both yes, both no, student yes and adult no,
     student no and adult yes; a style with more levels: the adult's level plus the bonus when the two are the same;
   - cued intervals and the rubric with the adult matching: the adult's level;
   - a period the adult does not rate (the matching ladder thins the matching to a sample): the student's rating counts as
     if it were matched, as Rhode, Morgan and Young (1983) did once matching was faded. */

const SMR_SYS=['match','contract','smiley','cico','interval','rubric'];
const SMR={date:'',sel:-1,mode:'me',modeSet:false,kid:false,ac:null,wl:null,cue:false,cueAt:0,cueLen:0,begun:-2,hold:0,tick:0};
function smRISO(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function smRDateOf(iso){const p=String(iso).split('-').map(Number);return new Date(p[0],p[1]-1,p[2],12);}
function smRLong(iso){try{return smRDateOf(iso).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});}catch(e){return iso;}}
function smRShort(iso){const d=smRDateOf(iso);return (d.getMonth()+1)+'/'+d.getDate();}
function smREmpty(){return {alt:false,me:{},t:{},rem:{},wf:'',rw:'',spent:'',note:'',fin:'',sig:''};}
function smREnsure(){if(!S.days||typeof S.days!=='object'||Array.isArray(S.days))S.days={};}
function smRDay(iso,make){smREnsure();iso=iso||SMR.date;if(!S.days[iso]&&make)S.days[iso]=smREmpty();return S.days[iso]||null;}
function smRAny(day){return !!day&&(Object.keys(day.me).length+Object.keys(day.t).length)>0;}
function smRHM(d){d=d||new Date();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}

/* ---------------- the levels, the rows and the points ---------------- */
/* the levels tapped on this sheet: the rating style chosen on the Design page, or the sheet type's own (as on paper) */
function smRLv(){const sys=S.sys;
  if(sys==='rubric')return S.lv.map((l,i)=>['t:'+(i+1),num(l.pts)||0,String(l.desc||'').trim()||'level '+(i+1)]);
  const lv=smLevels();if(lv)return lv;
  if(sys==='cico')return [['t:2',2,'2'],['t:1',1,'1'],['t:0',0,'0']];
  if(sys==='contract')return [['t:✓',1,'done'],['t:✗',0,'not yet']];
  if(sys==='smiley')return [['fh',1,'smile'],['fs',0,'not yet']];
  return [['fh',1,'yes'],['fs',0,'no']];}
function smRModel(day){const sys=S.sys;if(!SMR_SYS.includes(sys))return null;const m=smModel(),lv=smRLv(),bin=lv.length===2;
  let rows;if(sys==='interval')rows=m.rows.map(r=>({t:'',label:r.label,sub:r.sub,pic:''}));
  else{const src=day&&day.alt&&S.per2.some(x=>x.label||x.t)?S.per2:S.per;rows=src.map((r,i)=>({t:toHM24(r.t),label:r.label||('Period '+(i+1)),sub:r.t?fmtHM(r.t):'',pic:pic(r,'')}));}
  const mm=mp(),bonus=smBonus(),mx=Math.max(...lv.map(x=>x[1]));
  const maxc=sys==='match'?(bin?Math.max(mm.yy,mm.nn,mm.yn,mm.ny):mx+bonus):mx;
  return {sys,lv,bin,raters:m.raters,rows,tg:m.tg,tw:m.tw,maxc,mm,bonus,match:m.raters.length>1};}
function smRSig(M){return M.sys+'|'+M.lv.map(x=>x[0]).join(',')+'|'+M.rows.length+'|'+M.tg.length;}
function smRVal(M,day,r,t){const k=r+'_'+t,ok=v=>Number.isInteger(v)&&v>=0&&v<M.lv.length;const a=ok(day.me[k])?day.me[k]:null,b=ok(day.t[k])?day.t[k]:null;
  let p=0,done=false;
  if(M.raters.length===1){const v=M.raters[0]==='me'?a:b;if(v!=null){p=M.lv[v][1];done=true;}}
  else if(M.sys==='match'&&M.bin){if(a!=null){done=true;const q=M.mm;p=b==null?(a===0?q.yy:q.nn):a===0?(b===0?q.yy:q.yn):(b===0?q.ny:q.nn);}}
  else if(M.sys==='match'){if(a!=null){done=true;p=b!=null?M.lv[b][1]+(a===b?M.bonus:0):M.lv[a][1];}else if(b!=null)p=0;}
  else if(a!=null||b!=null){done=a!=null;p=M.lv[b!=null?b:a][1];}
  return {a,b,p,done,both:a!=null&&b!=null,same:a!=null&&b!=null&&a===b};}
function smRTotals(M,day){let pts=0,m=0,n=0,wait=0;const tp=M.tg.map(()=>0);
  M.rows.forEach((r,ri)=>M.tg.forEach((t,ti)=>{const v=smRVal(M,day,ri,ti);pts+=v.p;tp[ti]+=v.p;if(v.both){n++;if(v.same)m++;}if(M.match&&v.a!=null&&v.b==null)wait++;}));
  const poss=M.rows.length*M.tg.length*M.maxc,g=num(S.meta.goal),need=g!=null&&poss?Math.ceil(poss*g/100):null,per=M.rows.length*M.maxc;
  return {pts,poss,need,g,m,n,wait,tp:tp.map(x=>per?Math.round(x/per*100):'')};}
/* whose rating the buttons set: the student's or the adult's; a one-rater sheet has only that rater (the adult may correct the student's) */
function smRWho(M){return M.raters.length===1?M.raters[0]:SMR.mode;}
function smRRowDone(M,day,ri,who){return M.tg.every((t,ti)=>day[who][ri+'_'+ti]!=null);}
function smRRowAny(M,day,ri,who){return M.tg.some((t,ti)=>day[who][ri+'_'+ti]!=null);}
/* the period to rate now: the first one already begun that is not rated yet, else the next one not rated */
function smRNow(M,day){const who=smRWho(M);
  if(M.sys==='interval'){const i=M.rows.findIndex((r,ri)=>!smRRowDone(M,day,ri,who));return i<0?M.rows.length-1:i;}
  const today=SMR.date===smRISO(),hm=smRHM();const begun=M.rows.map((r,i)=>i).filter(i=>!today||!M.rows[i].t||M.rows[i].t<=hm);
  const un=begun.find(i=>!smRRowDone(M,day,i,who));if(un!=null)return un;
  const f=M.rows.findIndex((r,ri)=>!smRRowDone(M,day,ri,who));return f>=0?f:begun.length?begun[begun.length-1]:0;}   /* all begun ones rated: the next one */
function smRBank(){if(!smD().bank)return null;let b=0;Object.keys(S.days||{}).sort().forEach(k=>{const d=S.days[k];if(!d.fin)return;const M=smRModel(d);if(!M)return;b+=smRTotals(M,d).pts-(num(d.spent)||0);});return b;}

/* ---------------- drawing ---------------- */
function smRG(M,i,sz){const x=M.lv[i];const R=SM_RATES[smRateKey()];
  if(x[0]==='st'&&R&&R.count){const n=R.count,f=n-i;return '<span class="gstars">'+Array.from({length:n},(_,j)=>{const s=smGlyph('st',Math.round(sz*.6));return j<f?s.replace('fill="#fff"','fill="#f5c518"'):s;}).join('')+'</span>';}
  return smGlyph(x[0],sz);}
function smRWord(M,i){const w=String(M.lv[i][2]||'');return w.charAt(0).toUpperCase()+w.slice(1);}
function smRStu(){return smName()||'Student';}
function smRRender(){const host=$('#smRate');if(!host)return;smREnsure();if(!SMR.date)SMR.date=smRISO();
  const acc=smAccent();host.style.setProperty('--acc',acc);
  if(!S.sys){host.innerHTML='<div class="smr-empty">Choose the system on the System page first; the student then rates it here.</div>';return;}
  const day=smRDay()||smREmpty(),M=smRModel(day);
  if(!M){host.innerHTML='<div class="smr-empty">The '+({perf:'performance count',interlock:'interlocking session'}[S.sys]||'')+' sheet is kept on paper. Rating on the iPad works with Self &amp; Match, the contract, expectations and earns, check-in/check-out, cued intervals and the rubric point sheet.</div>';return;}
  if(SMR.sel<0||SMR.sel>=M.rows.length)SMR.sel=smRNow(M,day);
  if(!SMR.kid&&!SMR.modeSet&&M.raters.length===1&&M.raters[0]==='t')SMR.mode='t';   /* check-in/check-out: the adult rates */
  const T=smRTotals(M,day),kid=SMR.kid,teach=SMR.mode==='t';
  let h='';
  /* the top: who, the date, the mode, the day's buttons */
  h+='<div class="smr-top"><div class="smr-who">'+(smAvatar(46)||'')+'<b>'+esc(smName()?smName()+'’s day':'My day')+'</b>'+
    (kid?'<span class="smr-date">'+esc(smRLong(SMR.date))+'</span>':'<input type="date" id="smRDate" value="'+esc(SMR.date)+'" aria-label="The day rated">')+'</div>';
  if(!kid)h+='<div class="smr-modes" role="group" aria-label="Who is rating">'+(M.raters.includes('me')||M.raters.length===1?'<button type="button" data-rmode="me" aria-pressed="'+!teach+'">'+esc(smRStu())+(M.raters[0]==='t'&&M.raters.length===1?' sees':' rates')+'</button>':'')+'<button type="button" data-rmode="t" aria-pressed="'+teach+'">'+esc(M.tw)+(M.raters.includes('t')?' rates':' checks')+'</button></div>'+
    '<div class="smr-acts"><button type="button" class="smr-b pri" id="smRKid">Student screen</button><button type="button" class="smr-b" id="smRFin"'+(smRAny(day)?'':' disabled')+'>'+(day.fin?'Finish again':'Finish the day')+'</button><button type="button" class="smr-b" id="smRPrint"'+(smRAny(day)?'':' disabled')+'>Print the day</button></div>';
  else h+='<div class="smr-kidbar">'+(teach?'<button type="button" class="smr-b" data-rmode="me">Back to '+esc(smRStu())+'</button><button type="button" class="smr-b" id="smRKidOff">Leave the student screen</button>':'<button type="button" class="smr-hold" id="smRHold" aria-label="'+esc(M.tw)+': press and hold">'+esc(M.tw)+'<i></i></button>')+'</div>';
  h+='</div>';
  if(day.sig&&day.sig!==smRSig(M)&&smRAny(day))h+='<div class="smr-warn">This day was rated on a sheet that has changed since (the system, the rating style, the periods or the targets). Its ratings are shown on the sheet as it is now: check them before you finish the day.</div>';
  if(!kid&&S.per2.some(x=>x.label||x.t)&&S.sys!=='interval')h+='<div class="smr-alt" role="group" aria-label="Today’s schedule"><span>Today’s schedule:</span><button type="button" data-ralt="0" aria-pressed="'+!day.alt+'">Regular</button><button type="button" data-ralt="1" aria-pressed="'+!!day.alt+'">Second schedule</button></div>';
  /* the goal */
  const st=smStore(),wfI=st.find(o=>o.n&&o.n===day.wf),wfP=wfI?num(wfI.p):null,bank=smRBank();
  const W=v=>Math.max(0,Math.min(100,T.poss?v/T.poss*100:0)).toFixed(1)+'%';
  h+='<div class="smr-goal"><div class="smr-gl"><span><b class="big">'+T.pts+'</b> point'+smPoss(T.pts)+' '+(T.need!=null?(T.pts>=T.need?'<span class="smr-met">Goal reached!</span>':'· '+(T.need-T.pts)+' more to my goal of '+T.need):'of '+T.poss)+'</span>'+
    (bank!=null?'<span class="smr-bank">In my bank: <b>'+bank+'</b></span>':'')+'</div><div class="smr-bar'+(wfP!=null&&wfP!==T.need&&wfP<=T.poss?' rw':'')+'" role="img" aria-label="'+T.pts+' of '+T.poss+' points'+(T.need!=null?', goal '+T.need:'')+'"><div class="smr-fill" style="width:'+W(T.pts)+'"></div>'+
    (T.need!=null?'<div class="smr-mk" style="left:'+W(T.need)+'"><span>goal '+T.need+'</span></div>':'')+(wfP!=null&&wfP!==T.need&&wfP<=T.poss?'<div class="smr-mk rw" style="left:'+W(wfP)+'"><span>'+esc(wfI.n)+' '+wfP+'</span></div>':'')+'</div>'+
    (teach&&T.wait?'<div class="smr-wait">'+T.wait+' rating'+smPoss(T.wait)+' not matched yet: '+(T.wait===1?'it counts':'they count')+' as the student rated, until you rate '+(T.wait===1?'it':'them')+'.</div>':'')+'</div>';
  /* what the student is working for */
  if(st.length){h+='<div class="smr-wf"><b>'+(day.fin?'I chose:':'I’m working for:')+'</b><div class="smr-tiles">'+st.map((o,i)=>{const p=num(o.p),on=day.fin?o.n===day.rw:o.n===day.wf,can=!day.fin||p==null||p<=T.pts+(bank!=null?bank:0);
      return '<button type="button" class="smr-tile'+(on?' on':'')+(can?'':' dim')+'" data-rwf="'+i+'" aria-pressed="'+on+'">'+smStorePic(o,kid?54:38)+'<span>'+esc(o.n||'')+'</span>'+(o.p?'<i>'+esc(o.p)+'</i>':'')+'</button>';}).join('')+'</div></div>';}
  else if(S.meta.sh_reward)h+='<div class="smr-wf"><b>I’m working for:</b> '+esc(S.meta.sh_reward)+'</div>';
  /* the period card */
  h+=smRCard(M,day,T);
  /* the day at a glance */
  if(!kid||teach)h+=smRGrid(M,day,T);
  if(kid){h+='<div class="smr-foot">'+esc(smRLong(SMR.date))+' · Form SM-1</div>';}
  else{h+=smRSettings(M)+smRDays();}
  host.innerHTML=h;
  if(SMR.cue)smRCount();}
function smRCard(M,day,T){const ri=SMR.sel,row=M.rows[ri],who=smRWho(M),teach=SMR.mode==='t',kid=SMR.kid;
  const ro=M.raters.length===1&&M.raters[0]==='t'&&!teach;   /* check-in/check-out: the student sees the adult's ratings */
  const sz=kid?64:44;
  let h='<div class="smr-card" id="smRCard"><div class="smr-ph"><button type="button" class="nav" data-rgo="-1" aria-label="Previous period"'+(ri>0?'':' disabled')+'>&lsaquo;</button>'+
    '<div class="smr-pt">'+(row.pic?'<span class="rpic">'+row.pic+'</span>':'')+'<span><b>'+esc(row.label)+'</b>'+(row.sub?'<small>'+esc(row.sub)+'</small>':'')+'</span><button type="button" class="smr-say" data-rsay="p" aria-label="Read it aloud">'+smRSpk()+'</button></div>'+
    '<button type="button" class="nav" data-rgo="1" aria-label="Next period"'+(ri<M.rows.length-1?'':' disabled')+'>&rsaquo;</button></div>';
  h+='<div class="smr-dots" role="group" aria-label="Periods">'+M.rows.map((r,i)=>'<button type="button" data-rsel="'+i+'" class="'+(smRRowDone(M,day,i,who)?'done':smRRowAny(M,day,i,who)?'half':'')+(i===ri?' cur':'')+'" aria-label="'+esc(r.label)+(smRRowDone(M,day,i,who)?', rated':'')+'"'+(i===ri?' aria-current="true"':'')+'></button>').join('')+'</div>';
  if(M.sys==='interval'&&!SMR.kid||M.sys==='interval'&&teach)h+=smRCueBar();
  if(ro)h+='<p class="smr-note">'+esc(M.tw)+' rates each period on this sheet.</p>';
  else if(teach&&M.raters.length===1)h+='<p class="smr-note">'+esc(smRStu())+' rates this sheet; a tap here corrects the rating.</p>';
  M.tg.forEach((t,ti)=>{const v=smRVal(M,day,ri,ti),cur=who==='me'?v.a:v.b;
    h+='<div class="smr-q"><div class="smr-qw">'+(t.pic?'<span class="tpic">'+t.pic+'</span>':'')+'<span><b>'+esc(t.word)+'</b>'+(t.cue?'<small>'+esc(t.cue)+'</small>':'')+'</span><button type="button" class="smr-say" data-rsay="'+ti+'" aria-label="Read it aloud">'+smRSpk()+'</button></div>';
    h+='<div class="smr-opts" role="group" aria-label="'+esc(t.word)+'">'+M.lv.map((x,i)=>'<button type="button" class="smr-o'+(cur===i?' on':'')+'" data-rt="'+ti+'" data-rl="'+i+'" aria-pressed="'+(cur===i)+'"'+(ro?' disabled':'')+'>'+smRG(M,i,sz)+'<span>'+esc(smRWord(M,i))+'</span></button>').join('')+'</div>';
    /* the match, once both have rated (the adult sees the student's rating first only when the Settings say so) */
    if(M.match){let r='';const nm=esc(smRStu()),tw=esc(M.tw);
      if(teach){if(v.a==null)r='<span class="smr-mute">'+nm+' has not rated this yet.</span>';else if(v.b==null&&!smD().rshow)r='<span class="smr-mute">'+nm+' has rated. Rate it yourself to see the match.</span>';else r=nm+': '+smRG(M,v.a,22)+' '+esc(smRWord(M,v.a));}
      else if(v.b!=null)r=tw+': '+smRG(M,v.b,22)+' '+esc(smRWord(M,v.b));
      if(v.both)r+=v.same?' <b class="smr-same">Same answer! +'+v.p+'</b>':' <b class="smr-diff">Different answers'+(v.p?': '+v.p+' point'+smPoss(v.p):'')+'</b>';
      if(r)h+='<div class="smr-stu">'+r+'</div>';}
    h+='</div>';});
  /* reminders (the adult's tally) and the period's points */
  const pp=M.tg.reduce((s,t,ti)=>s+smRVal(M,day,ri,ti).p,0),rem=day.rem[ri]||0;
  h+='<div class="smr-end">';
  if(teach&&M.raters.includes('t'))h+='<div class="smr-rem"><span>Reminders this period</span><button type="button" data-rrem="-1" aria-label="One less"'+(rem?'':' disabled')+'>&minus;</button><b aria-live="polite">'+rem+'</b><button type="button" data-rrem="1" aria-label="One more">+</button></div>';
  const done=smRRowDone(M,day,ri,who);
  if(done&&!ro){const waitT=!teach&&M.match&&!smRRowDone(M,day,ri,'t');h+='<div class="smr-done">'+(waitT?'All rated! Show '+esc(M.tw.toLowerCase())+'.':'This period: <b>'+pp+'</b> point'+smPoss(pp)+'.')+'</div>';}
  if(ri<M.rows.length-1&&(done||ro))h+='<button type="button" class="smr-b pri smr-next" data-rgo="1">Next: '+esc(M.rows[ri+1].label)+' &rsaquo;</button>';
  h+='</div>';
  if(teach&&!SMR.kid)h+='<label class="smr-nl">Note for the day <textarea data-rnote rows="2" placeholder="What happened, what helped (prints on the day report)">'+esc(day.note)+'</textarea></label>';
  return h+'</div>';}
function smRSpk(){return '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';}
function smRGrid(M,day,T){const who=r=>r==='me'?esc(smRStu()):esc(M.tw);const two=M.raters.length>1;
  let h='<div class="smr-grid"><table><thead><tr><th rowspan="'+(two?2:1)+'">'+(M.sys==='interval'?'Check':'Period')+'</th>'+M.tg.map(t=>'<th colspan="'+M.raters.length+'">'+esc(t.word)+'</th>').join('')+'<th rowspan="'+(two?2:1)+'">R</th><th rowspan="'+(two?2:1)+'">Points</th></tr>'+
    (two?'<tr>'+M.tg.map(()=>M.raters.map(r=>'<th class="w">'+who(r)+'</th>').join('')).join('')+'</tr>':'')+'</thead><tbody>';
  M.rows.forEach((r,ri)=>{let p=0;h+='<tr class="'+(ri===SMR.sel?'cur':'')+'" data-rsel="'+ri+'"><th>'+esc(r.label)+(r.sub?' <small>'+esc(r.sub)+'</small>':'')+'</th>'+M.tg.map((t,ti)=>{const v=smRVal(M,day,ri,ti);p+=v.p;return M.raters.map(x=>{const l=x==='me'?v.a:v.b;return '<td class="'+(v.both?(v.same?'sm':'df'):'')+'">'+(l!=null?smRG(M,l,18):'<span class="smr-blank">·</span>')+'</td>';}).join('');}).join('')+'<td>'+(day.rem[ri]?'R'.repeat(Math.min(5,day.rem[ri])):'')+'</td><td class="p">'+(smRRowAny(M,day,ri,M.raters[0])||smRRowAny(M,day,ri,'t')?p:'')+'</td></tr>';});
  h+='<tr class="tot"><th colspan="'+(1+M.tg.length*M.raters.length+1)+'">Today'+(M.match&&T.n?' · same answer '+T.m+' of '+T.n+' ('+Math.round(T.m/T.n*100)+'%)':'')+'</th><td class="p">'+T.pts+' / '+T.poss+'</td></tr></tbody></table></div>';
  return h;}
function smRCueBar(){const iv=num(S.meta.iv_len)||3,vr=/^Variable/.test(S.meta.iv_timing||'');
  return '<div class="smr-cue">'+(SMR.cue?'<span>Next check in <b id="smRCount">…</b></span><button type="button" class="smr-b" id="smRCueOff">Stop the cue timer</button>':'<button type="button" class="smr-b pri" id="smRCueOn">Start the cue timer</button><span class="smr-mute">a cue every '+(vr?'about ':'')+iv+' minute'+smPoss(iv)+(vr?' (variable)':'')+': '+(smD().rcue==='flash'?'the screen flashes':'a chime and the screen flashes')+'</span>')+'</div>';}
function smRSettings(M){const d=smD();
  return '<details class="smr-set"><summary>Settings for rating on the iPad</summary>'+
    (M.match?'<label class="ck"><input type="checkbox" data-d="rshow"'+(d.rshow?' checked':'')+'> Show '+esc(M.tw.toLowerCase())+' the student’s rating before '+esc(M.tw.toLowerCase())+' rates (off: the match stays independent)</label>':'')+
    '<label class="ck"><input type="checkbox" data-d="rspeak"'+(d.rspeak?' checked':'')+'> Read each period’s questions aloud when it opens, and the rating tapped (the iPad’s own voice)</label>'+
    (M.sys!=='interval'?'<label class="ck"><input type="checkbox" data-d="rchime"'+(d.rchime?' checked':'')+'> Chime when a period ends and open it for rating (the times on the schedule; the iPad stays awake while the Rate page or the Student screen is open)</label>':
     '<label>The cue <select data-d="rcue"><option value=""'+(d.rcue!=='flash'?' selected':'')+'>A soft chime and the screen flashes</option><option value="flash"'+(d.rcue==='flash'?' selected':'')+'>The screen flashes, no sound (for a quiet room)</option></select></label>')+
    '<label>PIN for '+esc(M.tw.toLowerCase())+'’s part on the Student screen <input data-d="pin" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" value="'+esc(d.pin||'')+'" placeholder="none" style="width:8em"></label>'+
    '<p class="hint">On the Student screen the student sees only their part. '+esc(M.tw)+'’s part opens by holding '+esc(M.tw.toLowerCase())+'’s button for a second, and the PIN when one is set: it keeps the student on their part; it is not a lock on the file.</p></details>';}
function smRDays(){const ks=Object.keys(S.days||{}).filter(k=>smRAny(S.days[k])).sort().reverse();if(!ks.length)return '';
  return '<div class="smr-days"><h3>Days rated on the iPad</h3><table><thead><tr><th>Day</th><th>Points</th><th>Goal</th><th>Same answer</th><th>Reward</th><th></th></tr></thead><tbody>'+ks.map(k=>{const d=S.days[k],M=smRModel(d);if(!M)return '';const T=smRTotals(M,d);
    return '<tr'+(k===SMR.date?' class="cur"':'')+'><td>'+esc(smRLong(k))+(d.fin?'':' <i>(not finished)</i>')+'</td><td>'+T.pts+' / '+T.poss+'</td><td>'+(T.need==null?'—':T.pts>=T.need?'met':'not met')+'</td><td>'+(M.match&&T.n?T.m+' of '+T.n:'—')+'</td><td>'+esc(d.rw||'')+'</td><td class="b"><button type="button" class="smr-b" data-ropen="'+k+'">Open</button><button type="button" class="smr-b" data-rprint="'+k+'">Print</button><button type="button" class="smr-b" data-rdel="'+k+'" aria-label="Delete '+esc(smRLong(k))+'">Delete</button></td></tr>';}).join('')+'</tbody></table></div>';}

/* ---------------- the printed day report ---------------- */
function smRPage(iso){const day=S.days[iso];const M=smRModel(day);if(!M)return '';const T=smRTotals(M,day),two=M.raters.length>1,acc=smAccent();
  const who=r=>r==='me'?esc(smRStu()):esc(M.tw);
  let h='<div class="pg sm2-pg smr-pg" style="--acc:'+acc+'"><h2>'+esc(smName()?smName()+'’s day':'The day')+': '+esc(smRLong(iso))+'</h2><p class="sub">'+esc(S.meta.client||'')+(S.meta.client?' · ':'')+'rated on the iPad'+(day.fin?', finished '+esc(new Date(day.fin).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})):', not finished')+' · '+esc(({match:'Self & Match',contract:'Contract',smiley:'Expectations and earns',cico:'Check-in / check-out',interval:'Cued intervals',rubric:'Rubric point sheet'})[M.sys])+'</p>';
  h+='<table class="smr-ptab"><thead><tr><th rowspan="'+(two?2:1)+'">'+(M.sys==='interval'?'Check':'Period')+'</th>'+M.tg.map(t=>'<th colspan="'+M.raters.length+'">'+esc(t.word)+'</th>').join('')+(two?'<th rowspan="2">Same</th>':'')+'<th rowspan="'+(two?2:1)+'">Reminders</th><th rowspan="'+(two?2:1)+'">Points</th></tr>'+(two?'<tr>'+M.tg.map(()=>M.raters.map(r=>'<th>'+who(r)+'</th>').join('')).join('')+'</tr>':'')+'</thead><tbody>';
  M.rows.forEach((r,ri)=>{let p=0,sm=0,bo=0;h+='<tr><th>'+esc(r.label)+(r.sub?'<br><small>'+esc(r.sub)+'</small>':'')+'</th>'+M.tg.map((t,ti)=>{const v=smRVal(M,day,ri,ti);p+=v.p;if(v.both){bo++;if(v.same)sm++;}return M.raters.map(x=>{const l=x==='me'?v.a:v.b;return '<td>'+(l!=null?smRG(M,l,20)+'<span class="w">'+esc(smRWord(M,l))+'</span>':'—')+'</td>';}).join('');}).join('')+
    (two?'<td>'+(bo?sm+' of '+bo:'—')+'</td>':'')+'<td>'+(day.rem[ri]||'')+'</td><td class="p">'+p+'</td></tr>';});
  h+='</tbody></table><div class="smr-sum"><div><b>'+T.pts+' of '+T.poss+'</b> points ('+(T.poss?Math.round(T.pts/T.poss*100):0)+'%)</div><div>'+(T.need!=null?'Goal '+T.need+' ('+pct(T.g)+'): <b>'+(T.pts>=T.need?'met':'not met')+'</b>':'No goal set')+'</div>'+
    (M.match?'<div>Same answer: <b>'+(T.n?T.m+' of '+T.n+' ('+Math.round(T.m/T.n*100)+'%)':'—')+'</b></div>':'')+(day.wf?'<div>Working for: <b>'+esc(day.wf)+'</b></div>':'')+(day.rw?'<div>Reward chosen: <b>'+esc(day.rw)+'</b></div>':'')+'</div>';
  if(M.tg.length>1)h+='<p class="sub">By target: '+M.tg.map((t,i)=>esc(t.word)+' '+T.tp[i]+'%').join(' · ')+'</p>';
  if(day.note)h+='<div class="box"><b>Note:</b> '+esc(day.note)+'</div>';
  h+='<div class="smr-sig"><span>'+esc(M.tw)+' ____________________</span><span>Parent or guardian ____________________</span><span>Date ________</span></div><div class="smr-pf">Form SM-1 · rated on the iPad</div></div>';
  return h;}

/* ---------------- sound, voice, wake, the cue timer ---------------- */
function smRAudio(){try{if(!SMR.ac){const C=window.AudioContext||window.webkitAudioContext;if(C){SMR.ac=new C();const b=SMR.ac.createBuffer(1,1,22050),s=SMR.ac.createBufferSource();s.buffer=b;s.connect(SMR.ac.destination);s.start(0);}}if(SMR.ac&&SMR.ac.state==='suspended')SMR.ac.resume();}catch(e){}}
function smRChime(){if(smD().rcue==='flash'&&S.sys==='interval')return;smRAudio();const C=SMR.ac;if(!C)return;
  try{const t=C.currentTime;[[659.25,0],[987.77,.22]].forEach(([f,d])=>{const o=C.createOscillator(),g=C.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0.0001,t+d);g.gain.exponentialRampToValueAtTime(0.22,t+d+0.03);g.gain.exponentialRampToValueAtTime(0.0001,t+d+0.9);o.connect(g);g.connect(C.destination);o.start(t+d);o.stop(t+d+1);});}catch(e){}}
function smRFlash(){const c=$('#smRCard');if(!c)return;c.classList.remove('smr-flash');void c.offsetWidth;c.classList.add('smr-flash');setTimeout(()=>c.classList.remove('smr-flash'),1800);}
function smRSay(text){try{if(!window.speechSynthesis||!text)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=0.95;speechSynthesis.speak(u);}catch(e){}}
function smRSayPeriod(M){const r=M.rows[SMR.sel];if(!r)return;smRSay(r.label+'. '+M.tg.map(t=>t.word).join('. '));}
async function smRWake(on){try{if(on){if(!SMR.wl&&navigator.wakeLock&&document.visibilityState==='visible'){SMR.wl=await navigator.wakeLock.request('screen');SMR.wl.addEventListener&&SMR.wl.addEventListener('release',()=>{SMR.wl=null;});}}
  else if(SMR.wl&&!SMR.kid&&!SMR.cue&&!document.body.classList.contains('view-rate')){const w=SMR.wl;SMR.wl=null;await w.release();}}catch(e){SMR.wl=null;}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&(SMR.kid||SMR.cue||document.body.classList.contains('view-rate')&&smD().rchime))smRWake(true);});
function smRCueNext(){const avg=(num(S.meta.iv_len)||3)*60000,vr=/^Variable/.test(S.meta.iv_timing||'');return vr?avg*(1/3+Math.random()*4/3):avg;}
function smRCount(){const el=$('#smRCount');if(!el)return;const s=Math.max(0,Math.round((SMR.cueAt-Date.now())/1000));el.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function smRTick(){const on=SMR.kid||document.body.classList.contains('view-rate');if(!on||!S.sys)return;
  if(SMR.cue){if(Date.now()>=SMR.cueAt){SMR.cueAt=Date.now()+smRCueNext();const day=smRDay()||smREmpty(),M=smRModel(day);if(M){const i=M.rows.findIndex((r,ri)=>!smRRowDone(M,day,ri,'me'));if(i>=0)SMR.sel=i;else SMR.cue=false;}
      smRRender();smRChime();smRFlash();if(M&&smD().rspeak)smRSayPeriod(M);}else smRCount();return;}
  if(smD().rchime&&S.sys!=='interval'&&SMR.date===smRISO()){const day=smRDay()||smREmpty(),M=smRModel(day);if(!M)return;const hm=smRHM();let k=-1;M.rows.forEach((r,i)=>{if(r.t&&r.t<=hm)k=i;});
    if(SMR.begun===-2){SMR.begun=k;return;}
    if(k>SMR.begun){const ended=k-1;SMR.begun=k;if(ended>=0&&!smRRowDone(M,day,ended,smRWho(M))){SMR.sel=ended;smRRender();smRChime();smRFlash();nbhUI.toast('Time to rate '+M.rows[ended].label+'.',{kind:'ok'});if(smD().rspeak)smRSayPeriod(M);}}}}
SMR.tick=setInterval(smRTick,1000);

/* ---------------- the Student screen ---------------- */
/* the page behind the Student screen is made inert, so a keyboard or VoiceOver stays on the student's part */
let SMR_INERT=[];
function smRInert(on){SMR_INERT.forEach(e=>{e.inert=false;});SMR_INERT=[];if(!on)return;
  for(let n=$('#smRWrap');n&&n.parentElement&&n!==document.body;n=n.parentElement)for(const sib of n.parentElement.children)if(sib!==n&&!sib.inert&&!/^(SCRIPT|STYLE|LINK|DIALOG)$/.test(sib.tagName)&&sib.id!=='smRFx'){sib.inert=true;SMR_INERT.push(sib);}}
function smRKid(on){SMR.kid=on;document.body.classList.toggle('smr-kid',on);SMR.mode='me';SMR.sel=-1;smRInert(on);
  try{if(on){const el=document.documentElement,f=el.requestFullscreen||el.webkitRequestFullscreen;if(f){const p=f.call(el);if(p&&p.catch)p.catch(()=>{});}}
    else if(document.fullscreenElement||document.webkitFullscreenElement){const f=document.exitFullscreen||document.webkitExitFullscreen;if(f){const p=f.call(document);if(p&&p.catch)p.catch(()=>{});}}}catch(e){}
  smRWake(on);smRRender();const w=$('#smRWrap');if(w){w.scrollTop=0;if(on)try{w.scrollIntoView({block:'start'});}catch(e){}}if(!on)setView('rate');}
function smRGate(){const pin=String(smD().pin||'').replace(/\D/g,'');if(!pin){SMR.mode='t';smRRender();return;}
  let d=$('#smRPin');if(!d){d=document.createElement('dialog');d.id='smRPin';d.className='smr-pin';document.body.appendChild(d);}
  let v='';const draw=()=>{d.innerHTML='<p>'+esc(smTeacher())+'’s PIN</p><div class="smr-pd">'+Array.from({length:pin.length},(_,i)=>'<i class="'+(i<v.length?'on':'')+'"></i>').join('')+'</div><div class="smr-pk">'+[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k=>k===''?'<span></span>':'<button type="button" data-k="'+k+'">'+k+'</button>').join('')+'</div><button type="button" class="smr-b" data-k="x">Cancel</button>';};
  draw();d.onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;const k=b.dataset.k;if(k==='x'){d.close();return;}if(k==='⌫')v=v.slice(0,-1);else if(v.length<pin.length)v+=k;draw();
    if(v.length===pin.length){if(v===pin){d.close();SMR.mode='t';smRRender();}else{v='';d.classList.add('no');setTimeout(()=>{d.classList.remove('no');draw();},450);}}};
  if(d.showModal)d.showModal();else d.setAttribute('open','');}
document.addEventListener('pointerdown',e=>{if(e.target.closest('#smRate'))smRAudio();const h=e.target.closest('#smRHold');if(!h)return;h.classList.add('holding');clearTimeout(SMR.hold);SMR.hold=setTimeout(()=>{h.classList.remove('holding');smRGate();},1000);});
['pointerup','pointercancel','pointerleave'].forEach(t=>document.addEventListener(t,e=>{if(!SMR.hold)return;const h=$('#smRHold');if(h&&(t!=='pointerleave'||e.target===h)){h.classList.remove('holding');clearTimeout(SMR.hold);SMR.hold=0;}},true));

/* ---------------- taps ---------------- */
function smRSet(ti,l){const day=smRDay(SMR.date,true),M=smRModel(day),who=smRWho(M),k=SMR.sel+'_'+ti;const before=smRTotals(M,day).pts;
  if(!day.sig)day.sig=smRSig(M);if(day[who][k]===l)delete day[who][k];else day[who][k]=l;
  const T=smRTotals(M,day);smRRender();
  if(smD().rspeak&&day[who][k]===l)smRSay(smRWord(M,l));
  if(T.need!=null&&before<T.need&&T.pts>=T.need&&!day.fin)smRParty(T);}
function smRParty(T){let fx=$('#smRFx');if(!fx){fx=document.createElement('div');fx.id='smRFx';document.body.appendChild(fx);}
  const calm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches,C=['#f5c518','#e5484d','#1f6fd1','#3fa34d','#f08c00','#7b3fa0'];
  let c='';if(!calm)for(let i=0;i<70;i++)c+='<i style="left:'+(Math.random()*100).toFixed(1)+'%;background:'+C[i%C.length]+';animation-delay:'+(Math.random()*.8).toFixed(2)+'s;animation-duration:'+(1.8+Math.random()*1.4).toFixed(2)+'s;transform:rotate('+Math.round(Math.random()*360)+'deg)"></i>';
  fx.innerHTML='<div class="smr-conf">'+c+'</div><div class="smr-party" role="status"><div class="smr-pbig">'+smGlyph('st',84).replace('fill="#fff"','fill="#f5c518"')+'</div><b>'+(smName()?esc(smName())+', you':'You')+' reached your goal!</b><span>'+T.pts+' points today</span><button type="button" class="smr-b pri" id="smRFxOk">Yay!</button></div>';
  fx.hidden=false;smRChime();clearTimeout(SMR.fx);SMR.fx=setTimeout(()=>{fx.hidden=true;},7000);}
async function smRFinish(){const day=smRDay();if(!smRAny(day))return;const M=smRModel(day),T=smRTotals(M,day),met=T.need!=null&&T.pts>=T.need;
  if(!(await nbhUI.confirm('Finish '+smRLong(SMR.date)+'?\n'+T.pts+' of '+T.poss+' points'+(T.need!=null?(met?': the goal is met.':': the goal ('+T.need+') is not met.'):'.')+(T.wait?'\n'+T.wait+' rating'+smPoss(T.wait)+' not matched count as the student rated.':'')+'\nThe day goes into the Record as one row'+(day.fin?' (its row is updated)':'')+'.',{ok:'Finish the day'})))return;
  const row={date:smRShort(SMR.date),ph:curPhase(),goal:S.meta.goal||'',pts:String(T.pts),poss:String(T.poss),m:M.match?String(T.m):'',n:M.match?String(T.n):'',met,tgp:['match','contract','smiley','cico'].includes(M.sys)?T.tp.join(','):'',
    note:'Rated on the iPad'+(day.note?': '+day.note.replace(/\s+/g,' ').slice(0,200):''),src:'ipad:'+SMR.date};
  let i=S.log.findIndex(r=>r.src==='ipad:'+SMR.date);
  if(i<0){const j=S.log.findIndex(r=>!r.src&&String(r.date||'').trim()===row.date);if(j>=0&&(await nbhUI.confirm('The Record already has a row for '+row.date+', entered by hand. Replace it with the day rated on the iPad?\nCancel keeps it and adds a row.',{ok:'Replace'})))i=j;}
  if(i>=0)S.log[i]=Object.assign({},S.log[i],row);else S.log.push(row);
  day.fin=new Date().toISOString();renderL();renderRecord();smRRender();
  nbhUI.toast('The day is in the Record: '+T.pts+' of '+T.poss+' points'+(T.need!=null?(met?', goal met.':', goal not met.'):'.')+(smStore().length?' Tap the reward chosen.':''),{kind:'ok'});}
document.addEventListener('click',async e=>{const t=e.target;if(t.closest('#smRFxOk')){$('#smRFx').hidden=true;return;}
  if(!t.closest('#smRate'))return;smRAudio();const day0=smRDay()||smREmpty(),M=smRModel(day0);let b;
  if((b=t.closest('[data-rl]'))&&M){smRSet(+b.dataset.rt,+b.dataset.rl);return;}
  if((b=t.closest('[data-rgo]'))&&M){SMR.sel=Math.max(0,Math.min(M.rows.length-1,SMR.sel+(+b.dataset.rgo)));smRRender();if(smD().rspeak&&SMR.mode==='me')smRSayPeriod(M);return;}
  if((b=t.closest('[data-rsel]'))&&M){SMR.sel=+b.dataset.rsel;smRRender();return;}
  if((b=t.closest('[data-rsay]'))&&M){const k=b.dataset.rsay;if(k==='p')smRSayPeriod(M);else{const q=M.tg[+k];smRSay(q.word+(q.cue?'. '+q.cue:''));}return;}
  if((b=t.closest('[data-rmode]'))){SMR.mode=b.dataset.rmode;SMR.modeSet=true;smRRender();return;}
  if((b=t.closest('[data-rrem]'))){const d=smRDay(SMR.date,true),r=SMR.sel;d.rem[r]=Math.max(0,Math.min(99,(d.rem[r]||0)+(+b.dataset.rrem)));if(!d.rem[r])delete d.rem[r];smRRender();return;}
  if((b=t.closest('[data-ralt]'))){const d=smRDay(SMR.date,true),v=b.dataset.ralt==='1';if(d.alt===v)return;
    if(smRAny(d)&&!(await nbhUI.confirm('Change today’s schedule? The ratings already tapped stay with the period in the same place on the other schedule.',{ok:'Change'})))return;d.alt=v;SMR.sel=-1;smRRender();return;}
  if((b=t.closest('[data-rwf]'))){const o=smStore()[+b.dataset.rwf];if(!o)return;const d=smRDay(SMR.date,true);
    if(d.fin){const same=d.rw===o.n;d.rw=same?'':o.n;d.spent=same||!smD().bank?'':(o.p||'');}else d.wf=d.wf===o.n?'':o.n;smRRender();return;}
  if(t.closest('#smRKid')){smRKid(true);return;}
  if(t.closest('#smRKidOff')){smRKid(false);return;}
  if((b=t.closest('#smRHold'))&&e.detail===0){smRGate();return;}   /* a keyboard press opens it at once */
  if(t.closest('#smRFin')){smRFinish();return;}
  if(t.closest('#smRPrint')){smExtraPrint(smRPage(SMR.date),'landscape');return;}
  if(t.closest('#smRCueOn')){smRAudio();SMR.cue=true;SMR.cueAt=Date.now()+smRCueNext();smRWake(true);smRRender();return;}
  if(t.closest('#smRCueOff')){SMR.cue=false;smRWake(false);smRRender();return;}
  if((b=t.closest('[data-ropen]'))){SMR.date=b.dataset.ropen;SMR.sel=-1;smRRender();$('#smRate').scrollIntoView({block:'start'});return;}
  if((b=t.closest('[data-rprint]'))){smExtraPrint(smRPage(b.dataset.rprint),'landscape');return;}
  if((b=t.closest('[data-rdel]'))){const k=b.dataset.rdel;if(!(await nbhUI.confirm('Delete the ratings of '+smRLong(k)+'? Its row in the Record is deleted with them.',{ok:'Delete',danger:true})))return;
    delete S.days[k];const i=S.log.findIndex(r=>r.src==='ipad:'+k);if(i>=0)S.log.splice(i,1);renderL();renderRecord();smRRender();return;}});
document.addEventListener('change',e=>{const el=e.target;if(el.id==='smRDate'){if(/^\d{4}-\d{2}-\d{2}$/.test(el.value)){SMR.date=el.value;SMR.sel=-1;SMR.begun=-2;}smRRender();return;}
  if(el.closest&&el.closest('#smRate')&&el.dataset.d!==undefined){if(el.dataset.d==='pin'){smD().pin=String(el.value).replace(/\D/g,'').slice(0,6);}smRRender();}});
document.addEventListener('input',e=>{const el=e.target;if(el.dataset&&el.dataset.rnote!==undefined){const d=smRDay(SMR.date,true);d.note=el.value.slice(0,2000);}});
document.addEventListener('keydown',e=>{if(!SMR.kid)return;if(e.key==='Escape'&&SMR.mode==='t'){smRKid(false);}});

/* ---------------- hooks: the views, a saved file, the simulation ---------------- */
const smRSetView0=setView;
setView=function(v){smRSetView0(v);if(v==='rate'){SMR.sel=-1;SMR.begun=-2;SMR.modeSet=false;smRRender();if(smD().rchime)smRWake(true);}else smRWake(false);};
const smRRenderAll0=renderAll;
renderAll=function(){smREnsure();smRRenderAll0();smRRender();};
function smRFromFile(s,o){o.days={};const D=s&&s.days&&typeof s.days==='object'&&!Array.isArray(s.days)?s.days:{};
  const str=(v,n)=>v==null||typeof v==='object'?'':String(v).slice(0,n);
  const cells=v=>{const r={};if(v&&typeof v==='object'&&!Array.isArray(v))Object.keys(v).slice(0,800).forEach(c=>{if(/^\d{1,2}_\d$/.test(c)&&Number.isInteger(v[c])&&v[c]>=0&&v[c]<10)r[c]=v[c];});return r;};
  Object.keys(D).slice(0,1000).forEach(k=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(k))return;const x=D[k];if(!x||typeof x!=='object'||Array.isArray(x))return;
    const rem={};if(x.rem&&typeof x.rem==='object'&&!Array.isArray(x.rem))Object.keys(x.rem).slice(0,60).forEach(c=>{if(/^\d{1,2}$/.test(c)&&Number.isInteger(x.rem[c])&&x.rem[c]>0&&x.rem[c]<100)rem[c]=x.rem[c];});
    o.days[k]={alt:!!x.alt,me:cells(x.me),t:cells(x.t),rem,wf:str(x.wf,120),rw:str(x.rw,120),spent:str(x.spent,8).replace(/[^\d.]/g,''),note:str(x.note,2000),fin:/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(str(x.fin,40))?str(x.fin,40):'',sig:str(x.sig,400)};});
  if(o.d)o.d.pin=String(o.d.pin||'').replace(/\D/g,'').slice(0,6);if(o.d&&!o.d.pin)delete o.d.pin;
  if(o.d&&o.d.rcue&&o.d.rcue!=='flash')delete o.d.rcue;
  return o;}
const smRFromFile0=fromFile;
fromFile=function(d){const o=smRFromFile0(d);if(!o)return o;return smRFromFile(d.S,o);};
/* the simulation: the first three periods of today rated on the iPad, one rating different, two reminders */
function smRSim(){const iso=smRISO();S.days={};
  S.days[iso]={alt:false,me:{'0_0':0,'0_1':0,'0_2':0,'1_0':0,'1_1':1,'1_2':0,'2_0':0,'2_1':0,'2_2':0},t:{'0_0':0,'0_1':0,'0_2':0,'1_0':0,'1_1':1,'1_2':0,'2_0':0,'2_1':1,'2_2':0},
    rem:{'1':1,'2':2},wf:'Feed the class fish',rw:'',spent:'',note:'',fin:'',sig:''};
  SMR.date=iso;SMR.sel=-1;}

/* ===== walk-script.json: the narration's words (read when nbh-sm1-narration.js is not beside the form) ===== */
window.SM_WALK_SCRIPT=[{"id":"intro","text":"This is your self-monitoring sheet. It helps you notice how you are doing during the day, and it shows what you are working for."},{"id":"targets","text":"Across the top are your goals. Each goal says what to do, in your own words, with a picture to help you remember it."},{"id":"rows","text":"Down the side is your day, one row for each part of it. You check yourself at the end of each part."},{"id":"rows_iv","text":"Down the side are your checks. When the timer gives you the signal, stop for a moment and check yourself. Then go right back to work."},{"id":"rate_thumbs","text":"When a part of the day ends, ask yourself: did I do it? Circle the thumbs up if you did, or the thumbs down if you did not."},{"id":"rate_faces2","text":"When a part of the day ends, ask yourself: did I do it? Circle the smile if you did, or the frown if you did not."},{"id":"rate_faces3","text":"When a part of the day ends, ask yourself: how did I do? Circle the smile if you did it the whole time, the straight face if you did it some of the time, or the frown if not yet."},{"id":"rate_pm","text":"When a part of the day ends, ask yourself: did I do it? Circle the plus if you did, or the minus if you did not."},{"id":"rate_check","text":"When a part of the day ends, ask yourself: did I do it? Circle the check mark if you did, or the X if you did not."},{"id":"rate_yn","text":"When a part of the day ends, ask yourself: did I do it? Circle yes if you did, or no if you did not."},{"id":"rate_p012","text":"When a part of the day ends, ask yourself: how did I do? Circle two if you did it, one if you needed a reminder, or zero if not yet."},{"id":"rate_s15","text":"When a part of the day ends, ask yourself: how well did I do? Circle a number from one to five. Five means you did it really well."},{"id":"rate_stars3","text":"When a part of the day ends, ask yourself: how did I do? Color in the stars you earned: three stars for your very best, fewer when it was harder."},{"id":"rate_color3","text":"When a part of the day ends, ask yourself: how did I do? Circle green if you did it, yellow if you did part of it, or red if not yet."},{"id":"rate_any","text":"When a part of the day ends, ask yourself: how did I do? Circle the choice that shows it. The key at the top tells you what each one means."},{"id":"rate_check1","text":"When a part of the day ends, ask yourself: did I do it? If you did, put a check in the box."},{"id":"rate_rubric","text":"When a part of the day ends, look at the levels at the top of your sheet, and circle the level that matches how you did."},{"id":"rate_iv","text":"At each signal, ask yourself: was I working? Circle your answer, and get straight back to your work."},{"id":"honest","text":"Be honest. This sheet is about noticing, not about being perfect."},{"id":"match_teacher","text":"Your teacher rates you too, without looking at your sheet first. Then the two of you compare."},{"id":"match_points","text":"When your answer matches your teacher's answer, you earn points, even when the answer is no. Telling the truth always pays."},{"id":"match_bonus","text":"Your teacher's rating gives you your points, and when your rating is the same as your teacher's, you earn a bonus point too."},{"id":"teacher_rates","text":"Your teacher fills in your points for each part of the day, and initials it. At the end of the day, you look at them together."},{"id":"count","text":"At the end of the day, count your points and write the total at the bottom of your sheet."},{"id":"goal","text":"Your goal is at the top. When your points reach your goal, you earn your reward."},{"id":"midday","text":"There is also a midday check. Reach it by lunch, and you earn a little something extra, right then."},{"id":"store","text":"Here is your reward store. Each reward shows how many points it costs. Before the day starts, choose what you are working for, and put it in the box at the top."},{"id":"reward_plain","text":"Before the day starts, choose what you are working for, from your reward menu. Then you know what your points are for."},{"id":"bank","text":"Points you do not spend can go in your bank, so you can save up for something bigger."},{"id":"contract","text":"Your contract is a promise you and your teacher make together. It says what you will do, and what you will earn. You both sign it."},{"id":"adults","text":"For the adults: rate on your own before you look at the student's sheet. Praise honest ratings, even an honest no. Never take points away, and give the reward the way it was promised."},{"id":"outro","text":"Notice, rate, be honest, and count. Every day you practice, it gets a little easier. You can do this!"}];

/* ===== walk.js ===== */
/* (v21.45) Form SM-1, the Walkthrough view: a narrated walkthrough of the student's own sheet that plays like a video. It is
   built live from the sheet as the Sheet page draws it (the look, the targets, the day, the rating style, the store, the goal,
   the contract), laid out once per build as a timeline; renderAt(t) sets every element to its state at time t as a pure
   function of t, so playing, seeking, the chapters and Save as video (nbh-tk1-video.js, Form TK-1's, beside the form) draw the
   same frames. The player (clock, narration, controls, full screen) is Form TK-1's (tools/forms/TK-1/walk.js), copied here; the
   narration is walk-audio.js (made by make-narration.py from walk-script.json), kept beside the form as nbh-sm1-narration.js.
   Without it the captions are timed from their word counts and the device's voice reads them. The lines that play depend on the
   sheet: the rating style chooses its own line, Self & Match adds the matching, the store, the bank, the midday check and the
   contract each add theirs. The sheet itself (S) is never changed. */
(function(){
'use strict';
/* Save as video (nbh-tk1-video.js) names the file and the dialog's words for this form */
window.NBH_WALK_INFO={file:'Self-monitoring sheet walkthrough',from:'from this sheet: its targets, pictures, names and rewards',what:'sheet'};
const SW=1280,SH=720,PAUSE=.4;
const CHOF={intro:'sheet',targets:'sheet',rows:'sheet',rows_iv:'sheet',honest:'rate',match_teacher:'match',match_points:'match',match_bonus:'match',teacher_rates:'match',
  count:'points',goal:'points',midday:'points',store:'rewards',reward_plain:'rewards',bank:'rewards',contract:'contract',adults:'adults',outro:'adults'};
const CHAPS=[['sheet','Your sheet'],['rate','Rating'],['match','Matching'],['points','Points'],['rewards','Rewards'],['contract','Contract'],['adults','For the adults']];
/* the narration as written in walk-script.json, used only when walk-audio.js is not beside the form (its texts always win) */
const FB=(function(){const o={};(window.SM_WALK_SCRIPT||[]).forEach(l=>{o[l.id]=l.text;});return o;})();
/* ---------------- small helpers ---------------- */
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const ease=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
const easeOut=u=>1-Math.pow(1-u,3);
const easeIn=u=>u*u;
const bump=(t,t0,d)=>{const u=(t-t0)/d;return u<=0||u>=1?0:Math.sin(Math.PI*u);};
const f2=v=>(Math.round(v*100)/100).toString();
function div(cls,html){const d=document.createElement('div');if(cls)d.className=cls;if(html)d.innerHTML=html;return d;}
function css(el,p,v){const c=el._wk||(el._wk={});if(c[p]!==v){c[p]=v;el.style[p]=v;}}
function txt(el,v){if(el._wkT!==v){el._wkT=v;el.textContent=v;}}
function tog(el,c,on){const k='_wkC'+c;if(el[k]!==on){el[k]=on;el.classList.toggle(c,on);}}
const audioLines=()=>(typeof WALK_AUDIO!=='undefined'&&WALK_AUDIO&&WALK_AUDIO.lines&&typeof WALK_AUDIO.lines==='object')?WALK_AUDIO.lines:null;
function line(id){const L=audioLines();const l=L&&L[id];const t=String((l&&l.t)||FB[id]||'');const words=t.split(/\s+/).filter(Boolean).length;
  const d=l&&+l.d>0?+l.d:Math.max(1.5,words*.4);return{t,d,a:l&&typeof l.a==='string'?l.a:''};}
/* where each word starts in its recording (seconds from the start of the clip, by the character it starts at), taken from the
   voice's own phoneme lengths for that very clip (a mark at every word, at its audible start); a line whose text has changed since
   falls back to its share of the characters. Made by a script outside the repo; keyed by a hash of the text. */
const MK={};   /* SM-1: no measured word marks; a line's words are placed by their share of its characters */
const hash=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h.toString(16);};
/* the time (s into the clip) the voice reaches character i: the measured marks, joined by straight lines */
function onsetFn(id,text,d){const m=MK[id];const pts=[[0,.05]];
  if(m&&m.h===hash(text))m.o.forEach(p=>{if(p[0]>0&&p[0]<text.length&&p[1]>pts[pts.length-1][1])pts.push(p);});
  pts.push([text.length,Math.max(pts[pts.length-1][1]+.1,d-.15)]);pts.sort((a,b)=>a[0]-b[0]);
  return i=>{if(i<=0)return pts[0][1];for(let k=1;k<pts.length;k++){const a=pts[k-1],b=pts[k];if(i<=b[0])return a[1]+(b[1]-a[1])*(i-a[0])/Math.max(1,b[0]-a[0]);}return pts[pts.length-1][1];};}
function present(id){const L=audioLines();return L?!!L[id]:id in FB;}

/* ---------------- keyframe tracks: numeric states eased in and out, moves along a gentle arc ---------------- */
function Track(st){this.k=[{t:-1e9,st:Object.assign({},st)}];}
Track.prototype.last=function(){return this.k[this.k.length-1];};
Track.prototype.hold=function(t){const L=this.last();if(t>L.t)this.k.push({t,st:Object.assign({},L.st)});return this;};
Track.prototype.set=function(t,st){this.hold(t);const L=this.last();this.k.push({t:Math.max(t,L.t),st:Object.assign({},L.st,st)});return this;};
Track.prototype.move=function(t0,t1,st,arc,ez){this.hold(t0);const L=this.last();this.k.push({t:Math.max(t1,L.t),st:Object.assign({},L.st,st),arc:arc||0,ez:ez||ease});return this;};
Track.prototype.at=function(t){const k=this.k;let lo=0,hi=k.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(k[m].t<=t)lo=m;else hi=m-1;}
  if(lo>=k.length-1)return k[lo].st;const a=k[lo],b=k[lo+1],span=b.t-a.t;if(span<=0)return b.st;
  const u0=(t-a.t)/span,u=(b.ez||ease)(u0),o={};for(const p in b.st){const va=a.st[p],vb=b.st[p];o[p]=va+(vb-va)*u;}
  if(b.arc){const dx=b.st.x-a.st.x,dy=b.st.y-a.st.y,len=Math.hypot(dx,dy);if(len>1){let nx=-dy/len,ny=dx/len;if(ny>0||(ny===0&&nx>0)){nx=-nx;ny=-ny;}const h=b.arc*len*4*u*(1-u);o.x+=nx*h;o.y+=ny*h;}}
  return o;};
/* discrete steps (which page a card is on, a hand's pose) */
function Steps(v){this.k=[{t:-1e9,v}];}
Steps.prototype.set=function(t,v){const L=this.k[this.k.length-1];this.k.push({t:Math.max(t,L.t),v});return this;};
Steps.prototype.at=function(t){const k=this.k;let lo=0,hi=k.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(k[m].t<=t)lo=m;else hi=m-1;}return{v:k[lo].v,since:t-k[lo].t,prev:lo>0?k[lo-1].v:k[lo].v};};


/* ---------------- the DOM of the view ---------------- */
let DOM=null;
function dom(){if(DOM&&DOM.stage&&DOM.stage.isConnected)return DOM;const g=id=>document.getElementById(id);const stage=g('wkStage');if(!stage)return null;
  DOM={sec:stage.closest('section'),player:g('wkPlayer'),frame:g('wkFrame'),stage,big:g('wkBig'),cap2:g('wkCap2'),play:g('wkPlay'),restart:g('wkRestart'),seek:g('wkSeek'),time:g('wkTime'),cc:g('wkCc'),snd:g('wkSnd'),fs:g('wkFs'),chaps:g('wkChaps'),note:g('wkNote'),tx:g('wkTx')};const sk=DOM.seek;DOM.sfill=sk&&sk.querySelector('.wk-sfill');DOM.sthumb=sk&&sk.querySelector('.wk-sthumb');
  let m=DOM.frame.querySelector('.wk-msg');if(!m){m=div('wk-msg');m.setAttribute('role','status');m.hidden=true;DOM.frame.appendChild(m);}DOM.msg=m;
  wire();return DOM;}

/* ---------------- the build ---------------- */
let B=null;
function tempShow(sec){if(!sec||getComputedStyle(sec).display!=='none')return()=>{};const old=sec.style.cssText;
  sec.style.cssText='display:block!important;position:absolute;left:-30000px;top:0;width:12in;visibility:hidden';return()=>{sec.style.cssText=old;};}
function build(){const D=dom();if(!D)return null;stop(true);
  const restore=tempShow(D.sec);
  try{fit();B=compose(D);}
  finally{restore();}
  uiBuilt();pos=clamp(pos,0,B.D);renderAt(pos);ui();
  return{duration:B.D,cues:cuesOut(),chapters:chapsOut()};}
const cuesOut=()=>B?B.cues.map(c=>({id:c.id,start:c.start,dur:c.dur,narr:c.narr,text:c.text,chapter:c.chapter})):[];
const chapsOut=()=>B?B.chapters.map(c=>({id:c.id,label:c.label,start:c.start})):[];

const CREDIT_WALK='Created by Joshua Newsome, BCBA';
const HAND='"Bradley Hand","Chalkboard SE","Segoe Print","Comic Sans MS","Comic Neue",cursive';
/* the pencils: a yellow pencil for the student, a blue pen for the adult; drawn along +x, the tip at the left end */
const PENCIL='<svg viewBox="0 0 150 26" width="150" height="26" aria-hidden="true"><path d="M2 13 L24 4 H130 a6 6 0 0 1 6 6 v6 a6 6 0 0 1 -6 6 H24 Z" fill="#f6c343" stroke="#5a4210" stroke-width="2"/><path d="M2 13 L24 4 V22 Z" fill="#f2d7b0" stroke="#5a4210" stroke-width="2" stroke-linejoin="round"/><path d="M2 13 L10 9.8 V16.2 Z" fill="#333"/><rect x="128" y="4" width="16" height="18" rx="4" fill="#ef8fa6" stroke="#5a4210" stroke-width="2"/><rect x="120" y="4" width="8" height="18" fill="#c9ced3" stroke="#5a4210" stroke-width="2"/><path d="M30 9 H118" stroke="#e0a92a" stroke-width="2"/></svg>';
const PEN='<svg viewBox="0 0 150 26" width="150" height="26" aria-hidden="true"><path d="M2 13 L18 7 H132 a5 5 0 0 1 5 5 v2 a5 5 0 0 1 -5 5 H18 Z" fill="#1f4e8c" stroke="#0e2440" stroke-width="2"/><path d="M2 13 L18 7 V19 Z" fill="#c9ced3" stroke="#0e2440" stroke-width="2" stroke-linejoin="round"/><path d="M2 13 L8 10.8 V15.2 Z" fill="#0e2440"/><rect x="96" y="3" width="30" height="5" rx="2" fill="#c9ced3" stroke="#0e2440" stroke-width="1.5"/></svg>';

/* the line each rating style reads */
function rateLine(){const sys=S.sys;if(sys==='rubric')return 'rate_rubric';if(sys==='interval')return 'rate_iv';if(sys==='cico'&&smRateKey()==='auto')return '';
  const k=smRateKey();if(k!=='auto')return ['pics','words'].includes(k)?'rate_any':'rate_'+k;
  if(sys==='contract')return 'rate_check1';if(sys==='smiley')return 'rate_any';return S.chk.pict&&!S.chk.pocket?'rate_faces2':'rate_yn';}

function compose(D){
  const st=D.stage;st.innerHTML='';
  const layer=c=>{const d=div('wk-L '+(c||''));st.appendChild(d);return d;};
  const Lpaper=layer('smw-cam'),Lfx=layer('smw-fx'),Lpen=layer('smw-pens');
  const cap=div('wk-cap');st.appendChild(cap);
  const cred=div('wk-credit');cred.textContent=CREDIT_WALK;st.appendChild(cred);
  const notes=[];
  if(!S.sys){notes.push('Choose a sheet type on the System page first: the walkthrough is built from the student’s sheet.');}
  if(!audioLines())notes.push('The recorded narration (nbh-sm1-narration.js) is not beside this form: the captions are read by the device’s own voice where it has one.');
  /* the sheet, drawn as the Sheet page draws it, without its buttons, the reflection boxes and the home note */
  renderSheet();const so=$('#sheetOut');
  const paper=div('smw-paper');const inner=div(so.className,so.innerHTML);inner.id='wkSheet';paper.appendChild(inner);Lpaper.appendChild(paper);
  inner.querySelectorAll('button,.extras,.tear,.sm2-fit').forEach(e=>e.remove());
  if(!S.sys)inner.innerHTML='<p style="font:600 28px var(--bk);padding:60px">Choose a sheet type on the System page, and the student’s sheet appears here.</p>';
  const PW=1000;inner.style.width=PW+'px';const PH=Math.max(200,inner.offsetHeight);
  const prel=el=>{if(!el)return null;const r=el.getBoundingClientRect(),c=inner.getBoundingClientRect();const k=c.width/(inner.offsetWidth||1)||1;return{x:(r.left-c.left)/k,y:(r.top-c.top)/k,w:r.width/k,h:r.height/k};};
  const q=s=>inner.querySelector(s),qa=s=>[...inner.querySelectorAll(s)];
  const uni=rs=>{rs=rs.filter(Boolean);if(!rs.length)return null;const x=Math.min(...rs.map(r=>r.x)),y=Math.min(...rs.map(r=>r.y));return{x,y,w:Math.max(...rs.map(r=>r.x+r.w))-x,h:Math.max(...rs.map(r=>r.y+r.h))-y};};
  /* the camera: the whole sheet, or a part of it brought close */
  const s0=Math.min(1220/PW,640/PH),HOME={x:(SW-PW*s0)/2,y:Math.max(14,(SH-90-PH*s0)/2+6),s:s0};
  const cam=new Track(HOME);
  const view=r=>{if(!r)return HOME;const s=clamp(Math.min(1150/r.w,470/r.h),s0,1.75);return{x:SW/2-(r.x+r.w/2)*s,y:300-(r.y+r.h/2)*s,s};};
  const camTo=(t0,t1,r)=>cam.move(t0,t1,view(r));
  const toStage=(t,r)=>{const c=cam.at(t);return{x:c.x+r.x*c.s,y:c.y+r.y*c.s,w:r.w*c.s,h:r.h*c.s};};
  /* overlays */
  const fxs=[];
  const mkFx=(cls,html,box,init,parent)=>{const e=div('wk-o '+cls,html);if(box){e.style.left=f2(box.x)+'px';e.style.top=f2(box.y)+'px';if(box.w!=null)e.style.width=f2(box.w)+'px';if(box.h!=null)e.style.height=f2(box.h)+'px';}(parent||Lfx).appendChild(e);
    const fx={el:e,tr:new Track(Object.assign({o:0,s:1,dy:0,dx:0},init||{}))};fxs.push(fx);return fx;};
  const sub=(el,init)=>{const fx={el,tr:new Track(Object.assign({o:0,s:1,dy:0,dx:0},init||{}))};fxs.push(fx);return fx;};
  const pulse=(fx,t0,dur)=>{fx.tr.move(t0,t0+.3,{o:1});fx.tr.move(t0+Math.max(.35,dur-.4),t0+dur,{o:0});};
  /* a glow on the paper (it moves with the camera) */
  const glow=(r,t0,dur,pad)=>{if(!r)return;const p=pad||6;const g=mkFx('wk-glow smw-pglow','',{x:r.x-p,y:r.y-p,w:r.w+2*p,h:r.h+2*p},null,inner);pulse(g,t0,dur);};
  /* a pencil mark: a circle round a glyph, a check, a number written in */
  const marks=[];
  const ring=(r,t0,t1,col)=>{if(!r)return null;const pad=4,w=r.w+2*pad,h=r.h+2*pad;const e=div('smw-mark','<svg viewBox="0 0 '+f2(w+6)+' '+f2(h+6)+'" width="'+f2(w+6)+'" height="'+f2(h+6)+'"><ellipse cx="'+f2(w/2+3)+'" cy="'+f2(h/2+3)+'" rx="'+f2(w/2)+'" ry="'+f2(h/2)+'" fill="none" stroke="'+(col||'#2b4a9b')+'" stroke-width="3.2" stroke-linecap="round" pathLength="100" stroke-dasharray="100 100" stroke-dashoffset="100" transform="rotate(-8 '+f2(w/2+3)+' '+f2(h/2+3)+')"/></svg>');
    e.style.left=f2(r.x-pad-3)+'px';e.style.top=f2(r.y-pad-3)+'px';inner.appendChild(e);const m={el:e,path:e.querySelector('ellipse'),t0,t1,kind:'ring',cx:r.x+r.w/2,cy:r.y+r.h/2,rx:w/2,ry:h/2};marks.push(m);return m;};
  const write=(r,text,t0,t1,col,size)=>{if(!r)return null;const e=div('smw-write',esc(text));e.style.left=f2(r.x)+'px';e.style.top=f2(r.y)+'px';e.style.width=f2(r.w)+'px';e.style.height=f2(r.h)+'px';e.style.color=col||'#2b4a9b';e.style.fontFamily=HAND;e.style.fontSize=f2(size||Math.min(28,r.h*.7))+'px';inner.appendChild(e);
    const m={el:e,t0,t1,kind:'write',cx:r.x+r.w/2,cy:r.y+r.h/2,rx:Math.min(r.w,40)/2,ry:6};marks.push(m);return m;};
  /* the pencils: a pencil travels to a mark and draws it (the tip follows the stroke), then rests at the side */
  const pens=[];const mkPen=(svg,rest)=>{const e=div('smw-pen',svg);Lpen.appendChild(e);const p={el:e,tr:new Track({x:rest.x,y:rest.y,o:0,a:-38}),rest,draws:[]};pens.push(p);return p;};
  const PS=mkPen(PENCIL,{x:120,y:760}),PT=mkPen(PEN,{x:1160,y:760});
  const penPt=(mk,u,t)=>{const c=cam.at(t),k=c.s;let x,y;if(mk.kind==='ring'){const a=-Math.PI/2+u*2*Math.PI;x=mk.cx+Math.cos(a)*mk.rx;y=mk.cy+Math.sin(a)*mk.ry;}else{x=mk.cx+mk.rx*(2*u-1);y=mk.cy+Math.sin(u*Math.PI*6)*3;}return{x:c.x+x*k,y:c.y+y*k};};
  const draw=(pen,m,lead)=>{if(!m)return;const a=penPt(m,0,m.t0),b=penPt(m,1,m.t1);pen.tr.set(m.t0-(lead||.6)-.01,{o:1});pen.tr.move(m.t0-(lead||.6),m.t0,{x:a.x,y:a.y},.08);m.pt=penPt;pen.draws.push(m);pen.tr.set(m.t1,{x:b.x,y:b.y});};
  const penAway=(pen,t0)=>{pen.tr.move(t0,t0+.7,{x:pen.rest.x,y:pen.rest.y});pen.tr.set(t0+.7,{o:0});};
  /* the parts of the sheet the scenes point at */
  const m=typeof smModel==='function'&&S.sys?smModel():{raters:['me'],tg:[],rows:[]};
  const disc=!!q('.dc');
  const tbl=disc?q('.dc table'):q('table.v2-t')||qa('table.sm').find(t=>t.querySelector('tbody'))||q('table.sm');
  const body=tbl?[...tbl.querySelectorAll('tbody tr, tr')].filter(r=>!r.classList.contains('tot')&&!r.classList.contains('totals')&&!r.classList.contains('who')&&r.querySelector('td')):[];
  const glyphs=td=>td?[...td.querySelectorAll('.gset > .g, .gset > svg, svg.face, .yn, .sc, .mbox, .gstars .g')]:[];
  const rateCells=tr=>[...tr.querySelectorAll('td')].filter(td=>glyphs(td).length);
  /* per row: the student's cells and the adult's, in target order (the discreet cards: one card row per target and rater) */
  let rowsCells=[];
  if(disc){const meRows=body.filter(r=>!/\((teacher|[^)]*)\)/i.test(r.textContent)||/\(me\)/i.test(r.textContent)).filter(r=>rateCells(r).length),tRows=body.filter(r=>/\(/.test(r.textContent)&&!/\(me\)/i.test(r.textContent)&&rateCells(r).length);
    const nP=meRows[0]?rateCells(meRows[0]).length:0;for(let i=0;i<nP;i++)rowsCells.push({tr:null,me:meRows.map(r=>rateCells(r)[i]),t:tRows.map(r=>rateCells(r)[i]),mc:null,pc:null});}
  else rowsCells=body.map(tr=>{const c=rateCells(tr);const t=c.filter(x=>x.classList.contains('t')),me=c.filter(x=>!x.classList.contains('t'));const tds=[...tr.querySelectorAll('td')];
    return{tr,me,t,mc:tr.querySelector('td.mc')||null,pc:tr.querySelector('td.pc')||tds[tds.length-1]||null};}).filter(r=>r.me.length||r.t.length);
  const R0=rowsCells[0]||{me:[],t:[]};
  const R={head:prel(q('.v2-head')||q('.sm-head')||q('.dch')),targets:uni(qa('thead th.tg, th.q').map(prel))||prel(tbl&&tbl.querySelector('tr')),
    rows:uni(qa('tbody th.c0, td.per').map(prel))||uni(body.map(r=>prel(r.firstElementChild))),
    goal:prel(q('.v2-goal'))||prel(q('.sm-head .sm-line:nth-child(3)'))||prel(q('.v2-meta')),wf:prel(q('.v2-wf .box')),
    tot:prel(q('tr.tot'))||prel(q('tr.totals'))||prel(q('.dcf')),store:prel(q('.v2-store'))||prel(q('.v2-store-list'))||prel(q('.v2-store-line')),
    tiles:qa('.v2-store .tile, .v2-store-list .sl').map(prel),mid:prel(q('.v2-mid')),contract:prel(q('.v2-contract')),key:prel(q('.v2-keyline'))||prel(q('table.key'))||prel(q('.v2-lv')),
    tbl:prel(tbl),row0:uni([...(R0.me||[]),...(R0.t||[])].map(prel).concat(R0.tr?[prel(R0.tr)]:[]))};
  const bin=smRateBin(),lv=smLevels(),k=smRateKey(),stars=k!=='auto'&&SM_RATES[k].count;
  /* which glyph a rating circles: 0 the best, the last one the lowest */
  const gl=(td,j)=>{const g=glyphs(td);if(!g.length)return null;if(stars)return prel(g[0].parentNode);return prel(g[Math.max(0,Math.min(g.length-1,j))]);};
  const nG=td=>Math.max(1,glyphs(td).length);
  const tw=smTeacher();
  /* the story: the student's answers in the first row (yes, yes, not yet), the adult's the same; a few totals written in */
  const meAns=R0.me.map((td,i)=>i===R0.me.length-1&&R0.me.length>1?nG(td)-1:0);
  const hasMatch=m.raters.includes('me')&&m.raters.includes('t')&&R0.t.length>0,teacherOnly=!m.raters.includes('me');
  const ptsOf=(a,b)=>{if(S.sys!=='match')return null;const mm=mp();if(bin){if(a!==b)return mm.yn;return a===0?mm.yy:mm.nn;}const v=(lv&&lv[b]?lv[b][1]:0);return v+(a===b?smBonus():0);};
  const SC={};
  SC.intro=K=>{cam.move(K.t,K.t+.1,HOME);glow(R.head,K.t+.4,2.4);const tw0=Math.max(K.t+2.4,K.at('working for',.8)-.15);if(R.wf)glow(R.wf,tw0,1.8,8);return K.d;};
  SC.targets=K=>{camTo(K.t+.1,K.t+1.1,R.targets&&R.tbl?{x:R.tbl.x,y:R.targets.y-6,w:R.tbl.w,h:R.targets.h+60}:R.targets);const ths=qa('thead th.tg, th.q').map(prel);
    ths.forEach((r,i)=>glow(r,Math.max(K.t+1.2+i*.55,K.at('each goal',.4)-.2+i*.55),1.6));const tp=Math.max(K.t+2.5,K.at('picture',.85)-.2);qa('thead th.tg .tp, th.q svg, th.q img').map(prel).forEach((r,i)=>glow(r,tp+i*.2,1.4,4));return K.d;};
  SC.rows=K=>{camTo(K.t+.1,K.t+1.1,uni([R.rows,R.row0]));const rs=disc?qa('.dc tr:first-child th').map(prel).slice(1):qa('tbody th.c0, td.per').map(prel);rs.slice(0,9).forEach((r,i)=>glow(r,K.t+1.2+i*.32,1.2,3));return K.d;};
  SC.rows_iv=K=>{const t=SC.rows(K);return t;};
  /* the rating: the student's pencil circles each answer in the first row as the line names the choices */
  const rateScene=K=>{camTo(K.t+.1,K.t+1,uni([R.row0,R.targets]));if(R.key)glow(R.key,K.t+.6,2,4);let t=Math.max(K.t+1.6,K.at('circle',.45)-.1);
    if(teacherOnly){return K.d;}
    R0.me.forEach((td,i)=>{const r=gl(td,meAns[i]);const mk=stars?null:ring(r,t,t+.55,'#2b4a9b');if(stars){const g=glyphs(td),n=meAns[i]===0?3:1;g.slice(0,n).forEach((e,j)=>{const x=prel(e);const f=div('smw-fill','');f.style.cssText='left:'+f2(x.x)+'px;top:'+f2(x.y)+'px;width:'+f2(x.w)+'px;height:'+f2(x.h)+'px';inner.appendChild(f);marks.push({el:f,t0:t+j*.25,t1:t+j*.25+.2,kind:'fill',cx:x.x+x.w/2,cy:x.y+x.h/2,rx:x.w/2,ry:x.h/2});});draw(PS,marks[marks.length-1],.6);}
      else draw(PS,mk,i?.45:.7);t+=stars?1:.95;});
    penAway(PS,t+.2);return Math.max(K.d,t+.6-K.t);};
  ['rate_thumbs','rate_faces2','rate_faces3','rate_pm','rate_check','rate_yn','rate_p012','rate_s15','rate_stars3','rate_color3','rate_any','rate_check1','rate_rubric','rate_iv'].forEach(id=>{SC[id]=rateScene;});
  SC.honest=K=>{const last=R0.me[R0.me.length-1];const r=last?gl(last,meAns[R0.me.length-1]):null;if(r)glow(r,Math.max(K.t+.3,K.at('honest',.1)-.1),2.6,8);return K.d;};
  /* the adult rates the same row with a pen, on their own, then the two compare: a check in Same answer, the points written in */
  SC.match_teacher=K=>{camTo(K.t+.1,K.t+1,uni([R.row0,R.targets]));let t=Math.max(K.t+1.2,K.at('rates you too',.3)+.2);
    R0.t.forEach((td,i)=>{const mk=ring(gl(td,meAns[i]),t,t+.55,'#b8322a');draw(PT,mk,i?.45:.8);t+=.9;});penAway(PT,t+.1);
    const tc=Math.max(t+.3,K.at('compare',.85)-.2);R0.me.forEach((td,i)=>{const a=prel(td),b=prel(R0.t[i]);if(a&&b)glow(uni([a,b]),tc+i*.3,1.2,2);});return Math.max(K.d,tc+R0.me.length*.3+1.2-K.t);};
  SC.match_points=SC.match_bonus=K=>{let t=Math.max(K.t+.6,K.at('match',.25)+.1);let sum=0;
    R0.me.forEach((td,i)=>{const p=ptsOf(meAns[i],meAns[i]);sum+=p||0;const a=prel(td),b=prel(R0.t[i]);if(!a||!b)return;const u=uni([a,b]);const bub=mkFx('smw-plus','+'+(p==null?1:p),{x:0,y:0},null,inner);bub.el.style.left=f2(u.x+u.w/2-20)+'px';bub.el.style.top=f2(u.y-6)+'px';
      bub.tr.move(t+i*.6,t+i*.6+.3,{o:1,dy:-10},0,easeOut);bub.tr.move(t+i*.6+1.6,t+i*.6+2,{o:0});});
    const tw1=t+R0.me.length*.6+.3;if(R0.mc){const mk=write(prel(R0.mc),'✓ '+R0.me.length,tw1,tw1+.4,'#2b7a3b');draw(PT,mk,.6);}if(R0.pc){const mk=write(prel(R0.pc),String(sum||''),tw1+.7,tw1+1.1,'#2b4a9b');draw(PS,mk,.6);}
    const tn=Math.max(tw1+1.2,K.at('even when',.45)-.15);const last=R0.me[R0.me.length-1];if(last&&R0.t.length){glow(uni([prel(last),prel(R0.t[R0.t.length-1])]),tn,2.2,6);}
    penAway(PS,tw1+1.6);penAway(PT,tw1+1.4);return Math.max(K.d,tn+2.2-K.t);};
  SC.teacher_rates=K=>{camTo(K.t+.1,K.t+1,uni([R.row0,R.targets]));let t=K.t+1.3;(R0.t.length?R0.t:R0.me).forEach((td,i)=>{const mk=ring(gl(td,i===2?1:0),t,t+.55,'#b8322a');draw(PT,mk,i?.45:.8);t+=.9;});penAway(PT,t);return Math.max(K.d,t+.6-K.t);};
  /* the day's points: the other rows' totals written in, then the total */
  SC.count=K=>{cam.move(K.t+.1,K.t+1.1,view(uni([R.tbl,R.tot])));let t=K.t+1.3,sum=0;const per=Math.max(1,Math.round((m.p.poss||12)/Math.max(1,rowsCells.length)));
    rowsCells.forEach((rc,i)=>{if(!rc.pc||disc)return;const have=rc.pc.textContent.trim()||(i===0&&rc.pc.querySelector('.smw-write'));let v=i===0&&R0.me.length?R0.me.reduce((s,td,j)=>s+(ptsOf(meAns[j],meAns[j])||0),0):Math.max(0,per-((i*7)%3));
      sum+=v;if(i===0&&R0.pc&&marks.some(x=>x.el.parentNode===inner&&x.kind==='write'))return;const mk=write(prel(rc.pc),String(v),t,t+.3,'#2b4a9b');draw(PS,mk,i?.35:.7);t+=.5;});
    const tr=q('tr.tot td.pc')||q('tr.totals td.w:last-child');const tt=Math.max(t+.3,K.at('write the total',.5)-.1);if(tr){const mk=write(prel(tr),String(sum||Math.round((m.p.poss||10)*.86)),tt,tt+.4,'#2b4a9b',24);draw(PS,mk,.6);}penAway(PS,tt+.9);
    B_total=sum||Math.round((m.p.poss||10)*.86);return Math.max(K.d,tt+1.2-K.t);};
  let B_total=0;
  SC.goal=K=>{camTo(K.t+.1,K.t+1,R.goal?uni([R.goal,R.head]):R.head);if(R.goal)glow(R.goal,K.t+.9,2.4,6);const tr=Math.max(K.t+2,K.at('reach your goal',.6)-.15);
    const badge=mkFx('smw-badge','<b>'+(B_total||'')+'</b> points · goal '+(m.p.need!=null?m.p.need:'')+' <span>✓</span>',{x:SW/2-170,y:470,w:340},{s:.7,dy:10});badge.tr.move(tr,tr+.4,{o:1,s:1,dy:0},0,easeOut);badge.tr.move(K.t+K.d+.2,K.t+K.d+.6,{o:0});return K.d+.4;};
  SC.midday=K=>{camTo(K.t+.1,K.t+1,R.mid);if(R.mid)glow(R.mid,K.t+.9,K.d-1,6);return K.d;};
  /* the store: each reward lit in turn, then the one chosen goes up to the "working for" box */
  SC.store=K=>{camTo(K.t+.1,K.t+1.1,uni([R.store,R.wf]));const tl=R.tiles.filter(Boolean);const tc=Math.max(K.t+1.2,K.at('how many points',.4)-.2);tl.forEach((r,i)=>glow(r,tc+i*.35,1.3,3));
    const tp=Math.max(tc+tl.length*.35+.3,K.at('choose what',.62)-.15);const pick=tl.length?tl[Math.min(tl.length-1,1)]:null;
    if(pick&&R.wf){const tile=qa('.v2-store .tile')[Math.min(tl.length-1,1)];const fly=mkFx('smw-fly',tile?tile.innerHTML:'',{x:pick.x,y:pick.y,w:pick.w,h:pick.h},{o:0},inner);fly.el.style.background='#fff8e3';
      const dx=R.wf.x+R.wf.w/2-(pick.x+pick.w/2),dy=R.wf.y+R.wf.h/2-(pick.y+pick.h/2),sc=Math.min(1,R.wf.h/pick.h);fly.tr.set(tp,{o:1});fly.tr.move(tp+.1,tp+1.3,{dx,dy,s:sc},.12);glow(R.wf,tp+1.2,1.6,6);}
    return Math.max(K.d,tp+2.9-K.t);};
  SC.reward_plain=K=>{cam.move(K.t+.1,K.t+1,HOME);if(R.wf)glow(R.wf,K.t+1,2,6);else if(R.head)glow(R.head,K.t+1,2);return K.d;};
  SC.bank=K=>{const bank=mkFx('smw-badge smw-bank','<b>Bank</b> + '+(Math.max(0,(B_total||10)-10))+' points saved',{x:SW/2-170,y:470,w:340},{s:.7,dy:10});const t=K.t+.6;bank.tr.move(t,t+.4,{o:1,s:1,dy:0},0,easeOut);bank.tr.move(K.t+K.d-.1,K.t+K.d+.3,{o:0});return K.d+.3;};
  /* the contract: a card with its words, signed by the student and the adult */
  SC.contract=K=>{const mm=S.meta;cam.move(K.t,K.t+.8,HOME);
    const card=mkFx('smw-card smw-contract','<h3>My Contract</h3><p><b>I will:</b> '+esc(mm.bc_task||'reach my goal on my sheet')+(mm.bc_how?' ('+esc(mm.bc_how)+')':'')+'</p><p><b>I earn:</b> '+esc(mm.bc_rw||'the reward I choose')+(mm.bc_rwwhen?', '+esc(mm.bc_rwwhen):'')+'</p>'+
      '<div class="sg"><div><svg viewBox="0 0 220 50" width="220" height="50"><path class="sig1" d="M8 34 C 30 4, 40 44, 60 22 S 90 8, 104 30 S 140 40, 160 18 S 196 26, 212 30" fill="none" stroke="#2b4a9b" stroke-width="3" stroke-linecap="round" pathLength="100" stroke-dasharray="100 100" stroke-dashoffset="100"/></svg><span>'+esc(smName()||'Student')+'</span></div>'+
      '<div><svg viewBox="0 0 220 50" width="220" height="50"><path class="sig2" d="M10 30 C 26 10, 44 40, 62 24 C 80 8, 92 36, 118 28 C 140 20, 160 34, 182 22 L 210 26" fill="none" stroke="#b8322a" stroke-width="3" stroke-linecap="round" pathLength="100" stroke-dasharray="100 100" stroke-dashoffset="100"/></svg><span>'+esc(mm.bc_teacher||tw)+'</span></div></div>',{x:300,y:60,w:680},{dy:16});
    card.tr.move(K.t+.4,K.t+1,{o:1,dy:0},0,easeOut);const ts=Math.max(K.t+2,K.at('sign',.85)-.4);
    const s1=card.el.querySelector('.sig1'),s2=card.el.querySelector('.sig2');marks.push({el:card.el,path:s1,t0:ts,t1:ts+1.1,kind:'sig'});marks.push({el:card.el,path:s2,t0:ts+1.2,t1:ts+2.2,kind:'sig'});
    card.tr.move(Math.max(K.t+K.d,ts+2.6),Math.max(K.t+K.d,ts+2.6)+.5,{o:0});return Math.max(K.d,ts+3.1-K.t);};
  /* for the adults: four points, each lit as it is read */
  SC.adults=K=>{cam.move(K.t,K.t+.8,HOME);const tips=[['Rate on your own','before you look at the student’s sheet'],['Praise honest ratings','even an honest no'],['Never take points away',''],['Give the reward','the way it was promised']];
    const card=mkFx('smw-card smw-tips','<h3>For the adults</h3>'+tips.map((x,i)=>'<div class="tp" data-i="'+i+'"><b>'+(i+1)+'</b><p><strong>'+esc(x[0])+'</strong>'+(x[1]?' '+esc(x[1]):'')+'</p></div>').join(''),{x:290,y:40,w:700},{dy:16});
    card.tr.move(K.t+.3,K.t+.9,{o:1,dy:0},0,easeOut);const rows=[...card.el.querySelectorAll('.tp')].map(e=>sub(e,{o:.35,h:0}));
    const at=[['rate on your own',.12],['praise',.45],['never take',.68],['give the reward',.86]].map((a,i)=>Math.max(K.t+1+i*.5,K.at(a[0],a[1])-.2));
    rows.forEach((fx,i)=>{fx.tr.move(at[i],at[i]+.35,{o:1,h:1});fx.tr.move((at[i+1]||K.t+K.d)-.05,(at[i+1]||K.t+K.d)+.3,{h:0});});card.tr.move(K.t+K.d,K.t+K.d+.4,{o:0});return K.d+.4;};
  SC.outro=K=>{cam.move(K.t,K.t+1,HOME);const words=['Notice','Rate','Be honest','Count'];
    const box=mkFx('smw-words',words.map(w=>'<span>'+esc(w)+'</span>').join(''),{x:140,y:250,w:1000},{o:1});const ws=[...box.el.querySelectorAll('span')].map(e=>sub(e,{s:.6,dy:12}));
    const at=[['notice',.05],['rate',.15],['honest',.28],['count',.42]].map((a,i)=>Math.max(K.t+.5+i*.45,K.at(a[0],a[1])-.15));ws.forEach((fx,i)=>fx.tr.move(at[i],at[i]+.4,{o:1,s:1,dy:0},0,easeOut));
    const veil=mkFx('smw-veil','',{x:0,y:0,w:SW,h:SH});veil.el.style.zIndex='0';veil.tr.move(K.t+.2,K.t+.8,{o:.55});return K.d+.6;};

  /* ---- the timeline: the lines this sheet needs ---- */
  const ids=['intro'];if(S.sys){ids.push(S.sys==='interval'?'rows_iv':'targets');if(S.sys!=='interval')ids.push('rows');else ids.splice(1,0,'targets');
    const rl=S.sys==='cico'?'':rateLine();if(rl){ids.push(rl);ids.push('honest');}
    if(hasMatch&&S.sys==='match'){ids.push('match_teacher');ids.push(bin?'match_points':'match_bonus');}else if(hasMatch)ids.push('match_teacher');else if(teacherOnly)ids.push('teacher_rates');
    ids.push('count');if(m.p&&m.p.need!=null)ids.push('goal');if(smD().mid&&R.mid)ids.push('midday');
    if(smStore().length&&R.store)ids.push('store');else ids.push('reward_plain');if(smD().bank&&smStore().length)ids.push('bank');
    if(S.meta.bc_task||S.meta.bc_rw)ids.push('contract');ids.push('adults');}
  ids.push('outro');
  let T=0;const cues=[];
  ids.filter(id=>present(id)).forEach(id=>{const ln=line(id),low=ln.t.toLowerCase(),on=onsetFn(id,ln.t,ln.d),T0=T;
    const K={id,t:T0,d:ln.d,text:ln.t,at:(ph,fr,from)=>{const i=low.indexOf(String(ph).toLowerCase(),from>0?from:0);return i<0?T0+ln.d*fr:T0+on(i);}};
    const need=(SC[id]?SC[id](K):ln.d)||0;const dur=Math.max(ln.d+PAUSE,need+.1);
    cues.push({id,start:T0,dur,narr:ln.d,text:ln.t,chapter:CHOF[id]||(id.indexOf('rate_')===0?'rate':'sheet'),chunks:chunks(id,ln.t,T0,on),a:ln.a});T+=dur;});
  cam.move(T-1.2,T-.2,HOME);
  const chapters=CHAPS.map(([id,label])=>{const c=cues.find(q=>q.chapter===id);return c?{id,label,start:c.start}:null;}).filter(Boolean);
  return{D:T,cues,chapters,cam,paper,inner,fxs,marks,pens,cap,notes};
}
/* captions: a line in pieces of up to two caption lines; each piece shows a moment before the voice reaches its first word */
const CAPLEAD=.12;
function chunks(id,text,T,on){const parts=(text.match(/[^.!?]+[.!?]+["”]?\s*|[^.!?]+$/g)||[text]).map(s=>s.trim()).filter(Boolean);const out=[];
  parts.forEach(p=>{if(p.length<=120){out.push(p);return;}const mid=p.length/2;let best=-1;p.replace(/[,;:] /g,(m,i)=>{if(best<0||Math.abs(i-mid)<Math.abs(best-mid))best=i;return m;});if(best<0){out.push(p);return;}out.push(p.slice(0,best+1));out.push(p.slice(best+2));});
  const merged=[];out.forEach(p=>{const L=merged[merged.length-1];if(L&&(L+' '+p).length<=96)merged[merged.length-1]=L+' '+p;else merged.push(p);});
  let cur=0;return merged.map((p,k)=>{const i=Math.max(cur,text.indexOf(p.slice(0,12),cur));cur=i+1;return{t:k?T+Math.max(0,on(i)-CAPLEAD):T,text:p};});}

/* ---------------- renderAt: the stage at time t ---------------- */
let RMQ=null;const reduced=()=>{try{RMQ=RMQ||window.matchMedia('(prefers-reduced-motion: reduce)');return !!RMQ.matches;}catch(e){return false;}};
function cueAt(t){if(!B)return null;const c=B.cues;let lo=0,hi=c.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(c[m].start<=t)lo=m;else hi=m-1;}return c[lo];}
function renderAt(t){if(!B)build();if(!B)return;t=clamp(+t||0,0,B.D);const cue=cueAt(t);
  const v=reduced()&&cue?Math.min(B.D,cue.start+cue.dur-.02):t;
  const c=B.cam.at(v);css(B.paper,'transform','translate('+f2(c.x)+'px,'+f2(c.y)+'px) scale('+c.s.toFixed(4)+')');
  for(const fx of B.fxs){const s=fx.tr.at(v);css(fx.el,'opacity',f2(s.o));css(fx.el,'visibility',s.o>.001?'visible':'hidden');css(fx.el,'transform',s.dy||s.dx||s.s!==1?'translate('+f2(s.dx||0)+'px,'+f2(s.dy)+'px) scale('+s.s.toFixed(4)+')':'none');
    if(s.h!=null)css(fx.el,'backgroundColor',s.h>.01?'rgba(255,205,90,'+f2(.42*s.h)+')':'transparent');}
  /* the marks: a circle or a signature drawn along its length; a number written in; a star coloured */
  for(const mk of B.marks){const u=clamp((v-mk.t0)/Math.max(.01,mk.t1-mk.t0),0,1);
    if(mk.kind==='ring'||mk.kind==='sig'){const dv=f2(100*(1-u));if(mk.path._dv!==dv){mk.path._dv=dv;mk.path.setAttribute('stroke-dashoffset',dv);}   /* an attribute, so Save as video's painter sees it too */
if(mk.kind==='ring'){css(mk.el,'visibility',u>0?'visible':'hidden');}}
    else{css(mk.el,'opacity',f2(u));css(mk.el,'visibility',u>0?'visible':'hidden');if(mk.kind==='write')css(mk.el,'clipPath','inset(0 '+f2(100*(1-u))+'% 0 0)');}}
  /* the pencils: on their track, or following the stroke they draw */
  for(const p of B.pens){let s=p.tr.at(v),x=s.x,y=s.y;
    for(const d of p.draws)if(v>=d.t0&&v<=d.t1){const P=d.pt(d,(v-d.t0)/Math.max(.01,d.t1-d.t0),v);x=P.x;y=P.y;break;}
    css(p.el,'opacity',f2(s.o));css(p.el,'visibility',s.o>.001?'visible':'hidden');css(p.el,'transform','translate('+f2(x)+'px,'+f2(y-13)+'px) rotate('+f2(s.a)+'deg)');}
  let ct='';if(cue){for(const ch of cue.chunks)if(ch.t<=t+.001)ct=ch.text;}
  txt(B.cap,ct);css(B.cap,'visibility',ct?'visible':'hidden');const D=dom();if(D&&D.cap2)txt(D.cap2,ct);
  B.t=t;}
/* ---------------- the player: clock, narration, controls ---------------- */
let pos=0,playing=false,want=false,raf=0,soundOn=true,capsOn=true,busy=false,drag=false,msg='';
const AU={ctx:null,gain:null,bufs:{},dec:{},srcs:[],mode:'off',base:0,pos0:0,susp:false,suspPos:0,webFail:false,html:{},cur:'',req:0,spoke:false,wd:null};
function toAB(uri){const b=atob(uri.slice(uri.indexOf(',')+1));const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer;}
function ctx(){if(AU.ctx)return AU.ctx;const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
  try{AU.ctx=new C();AU.gain=AU.ctx.createGain();AU.gain.connect(AU.ctx.destination);
    /* the system can take the sound (a call, Siri, an alarm, another app): the clock stops, so the player pauses and says so */
    AU.ctx.addEventListener('statechange',()=>{if(AU.mode==='web'&&playing&&AU.ctx.state!=='running')interrupted();});}
  catch(e){AU.ctx=null;}return AU.ctx;}
/* decode only the lines this build plays (once each); a line a rebuild switches to is decoded then */
function decodeIds(ids){const L=audioLines()||{};const ps=ids.map(id=>{if(AU.bufs[id]||!L[id]||!L[id].a)return null;if(AU.dec[id])return AU.dec[id];
    return AU.dec[id]=new Promise(res=>{let done=false;const fin=b=>{if(done)return;done=true;if(b)AU.bufs[id]=b;else AU.dec[id]=null;res();};
      try{const pr=AU.ctx.decodeAudioData(toAB(L[id].a),fin,()=>fin(null));if(pr&&pr.then)pr.then(fin,()=>fin(null));}catch(e){fin(null);}});}).filter(Boolean);
  return Promise.all(ps).then(()=>{if(ids.some(id=>L[id]&&L[id].a)&&!ids.some(id=>AU.bufs[id]))AU.webFail=true;});}
const needIds=()=>B?B.cues.map(c=>c.id).filter(id=>{const L=audioLines();return L&&L[id]&&L[id].a;}):[];
function mode(){if(!soundOn)return 'off';const L=audioLines();if(L){if(!AU.webFail&&ctx())return 'web';try{if(typeof Audio!=='undefined'&&htmlEl().canPlayType('audio/mpeg'))return 'html';}catch(e){}}
  if(window.speechSynthesis&&window.SpeechSynthesisUtterance)return 'speech';return 'off';}
function clock(){if(!playing)return pos;return AU.mode==='web'&&AU.ctx?AU.pos0+(AU.ctx.currentTime-AU.base):AU.pos0+(performance.now()/1000-AU.base);}
function stopAudio(){AU.srcs.forEach(s=>{try{s.stop();}catch(e){}});AU.srcs=[];AU.susp=false;
  if(AU.html.el)try{AU.html.el.pause();}catch(e){}AU.cur='';try{if(window.speechSynthesis&&AU.mode==='speech')speechSynthesis.cancel();}catch(e){}}
/* nothing is sounding: let the audio thread rest (the next Play resumes it inside the tap) */
function idle(){if(AU.ctx&&AU.ctx.state==='running'&&!AU.srcs.length)try{AU.ctx.suspend();}catch(e){}}
function schedule(from){const c=AU.ctx;B.cues.forEach(q=>{const b=AU.bufs[q.id];if(!b||q.start+b.duration<=from)return;const s=c.createBufferSource();s.buffer=b;s.connect(AU.gain);
  try{s.start(AU.base+Math.max(0,q.start-from),Math.max(0,from-q.start));}catch(e){return;}AU.srcs.push(s);});}
/* the fallbacks, driven from the frame loop: one audio element per line, or the device's voice reading the caption */
function tickAudio(t){const q=cueAt(t);const inLine=q&&t<q.start+q.narr;
  if(AU.mode==='html'){const id=inLine?q.id:'';if(id===AU.cur)return;const a=htmlEl();try{a.pause();}catch(e){}AU.cur=id;if(!id)return;
    const L=audioLines();if(!L||!L[id]||!L[id].a)return;const off=Math.max(0,t-q.start);a.src=L[id].a;
    if(off>.3)a.addEventListener('loadedmetadata',function f(){a.removeEventListener('loadedmetadata',f);try{a.currentTime=off;}catch(e){}});
    const pr=a.play();if(pr&&pr.catch)pr.catch(()=>{});}
  else if(AU.mode==='speech'){const id=inLine?q.id:'';if(id===AU.cur)return;AU.cur=id;if(!id)return;
    let k=0;q.chunks.forEach((c,i)=>{if(c.t<=t+.001)k=i;});const say=q.chunks.slice(t-q.start>1?k:0).map(c=>c.text).join(' ');
    try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(say);u.rate=1;u.lang='en-US';speechSynthesis.speak(u);}catch(e){}}}
function htmlEl(){if(!AU.html.el){AU.html.el=new Audio();AU.html.el.preload='auto';}return AU.html.el;}
/* iOS lets an audio element, and the device's voice, start later only once they have been started inside a tap: so the Play tap
   starts both, silently, whichever the narration ends up using */
let SILENT='';
function silentWav(){if(SILENT)return SILENT;const n=400,b=new Uint8Array(44+n*2),v=new DataView(b.buffer),w=(o,s)=>{for(let i=0;i<s.length;i++)b[o+i]=s.charCodeAt(i);};
  w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,16000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);
  let s='';for(let i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return SILENT='data:audio/wav;base64,'+btoa(s);}
function prime(){try{if(typeof Audio!=='undefined'){const a=htmlEl();if(!a.src&&!AU.html.primed){AU.html.primed=true;a.src=silentWav();const p=a.play();if(p&&p.then)p.then(()=>{try{a.pause();}catch(e){}},()=>{});}}}catch(e){}
  try{if(!AU.spoke&&window.speechSynthesis&&window.SpeechSynthesisUtterance&&(!audioLines()||!ctx())){AU.spoke=true;speechSynthesis.speak(new SpeechSynthesisUtterance(''));}}catch(e){}}
/* the screen stays on while the walkthrough plays (it runs for minutes with no touch) */
let WL=null;
function wake(on){try{if(on&&!WL&&navigator.wakeLock&&document.visibilityState==='visible'){navigator.wakeLock.request('screen').then(w=>{if(!want){w.release().catch(()=>{});return;}WL=w;w.addEventListener('release',()=>{if(WL===w)WL=null;});},()=>{});}
  else if(!on&&WL){const w=WL;WL=null;w.release().catch(()=>{});}}catch(e){}}
/* inside the workstation, opening another form only hides this form's frame (no visibilitychange): look for that while playing */
let WT=0,ioHidden=false;
function frameHidden(){try{const fe=window.frameElement;if(fe&&(fe.hidden||!fe.getClientRects().length))return true;}catch(e){}return ioHidden;}
function watch(on){clearInterval(WT);WT=0;if(on)WT=setInterval(()=>{if(want&&frameHidden())pause();},500);}
function setMsg(m){msg=m||'';const D=dom();if(D&&D.msg){txt(D.msg,msg);D.msg.hidden=!msg;}}
function play(){if(!B||B.dirty)build();if(!B||want)return;want=true;setMsg('');if(pos>=B.D-.05){pos=0;stopAudio();}
  try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch(e){}
  wake(true);prime();
  if(mode()==='web'){const c=AU.ctx;try{const r=c.resume();if(r&&r.catch)r.catch(()=>{});}catch(e){}
    try{const b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0);}catch(e){}
    const ids=needIds();if(ids.some(id=>!AU.bufs[id])&&!AU.webFail){busy=true;ui();const tok=++AU.req;
      decodeIds(ids).then(()=>{if(tok!==AU.req)return;busy=false;if(want&&!playing)begin();else ui();});return;}}
  begin();}
function begin(){const m=mode();
  if(m==='web'&&AU.mode==='web'&&AU.susp&&Math.abs(pos-AU.suspPos)<1e-6){AU.susp=false;try{AU.ctx.resume();}catch(e){}playing=true;watch(true);loop();ui();return;}
  stopAudio();AU.mode=m;AU.pos0=pos;playing=true;
  if(m==='web'){try{AU.ctx.resume();}catch(e){}AU.base=AU.ctx.currentTime;schedule(pos);}else{AU.base=performance.now()/1000;idle();}
  if(m==='html'||m==='speech')tickAudio(pos);   /* the first sound starts inside the Play tap (iOS) */
  watch(true);loop();ui();}
/* the frame loop; with the Web Audio clock it also watches that the clock moves (some systems stop it without telling) */
function loop(){cancelAnimationFrame(raf);AU.wd=null;const f=()=>{if(!playing)return;let t=clock();
    if(AU.mode==='web'&&AU.ctx){const now=performance.now(),ct=AU.ctx.currentTime;if(!AU.wd||ct!==AU.wd.ct)AU.wd={ct,at:now};else if(now-AU.wd.at>900){interrupted();return;}}
    if(t>=B.D){pos=B.D;renderAt(pos);stop(false);stopAudio();idle();pos=B.D;ui();return;}
    if(AU.mode==='html'||AU.mode==='speech')tickAudio(t);renderAt(t);uiTime(t);raf=requestAnimationFrame(f);};raf=requestAnimationFrame(f);}
function interrupted(){if(!playing)return;pos=clock();playing=false;want=false;busy=false;cancelAnimationFrame(raf);watch(false);wake(false);
  AU.susp=!!AU.srcs.length;AU.suspPos=pos;renderAt(pos);setMsg('The sound was interrupted. Tap Play to go on.');ui();}
/* stop(hard): pause; a soft pause of the Web Audio narration suspends the context so Play continues it */
function stop(hard){want=false;busy=false;AU.req++;if(playing){pos=clock();playing=false;cancelAnimationFrame(raf);}watch(false);wake(false);
  if(!hard&&AU.mode==='web'&&AU.ctx&&AU.srcs.length){try{AU.ctx.suspend();}catch(e){}AU.susp=true;AU.suspPos=pos;}else stopAudio();}
function pause(){stop(false);if(!AU.susp)idle();if(B)renderAt(pos);ui();}
function seek(t){if(!B)build();if(!B)return;const was=want;stop(true);pos=clamp(+t||0,0,B.D);renderAt(pos);uiTime(pos);if(was&&pos<B.D-.05)play();else{idle();ui();}}
function toggle(){if(want)pause();else play();}

/* ---------------- the controls ---------------- */
const IC={play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>',
  pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.5h4.2v15H6zM13.8 4.5H18v15h-4.2z" fill="currentColor"/></svg>',
  restart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 1-6.6 4.7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M3.6 4.2l1.9 5.9 5.6-2.6z" fill="currentColor"/></svg>',
  snd:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.6L12.5 5v14l-4.9-4.5H4z" fill="currentColor"/><path d="M15.5 8.8a4.5 4.5 0 0 1 0 6.4M18 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  mute:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.6L12.5 5v14l-4.9-4.5H4z" fill="currentColor"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  fs:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  fsx:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'};
const mmss=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
function ui(){const D=dom();if(!D)return;const pl=want;
  D.player.classList.toggle('wk-playing',pl);D.player.classList.toggle('wk-busy',busy);
  if(D.play){D.play.innerHTML=busy?'<span class="wk-spin" aria-hidden="true"></span>':pl?IC.pause:IC.play;D.play.setAttribute('aria-label',busy?'Loading the narration':pl?'Pause':'Play');}
  if(D.big){const hadFocus=document.activeElement===D.big;D.big.hidden=pl;D.big.setAttribute('aria-label',B&&pos>=B.D-.05?'Play the walkthrough again':pos>0?'Continue the walkthrough':'Play the walkthrough');
    if(pl&&hadFocus&&D.play)try{D.play.focus({preventScroll:true});}catch(e){}}
  /* toggle buttons keep one name; aria-pressed carries the state */
  if(D.snd){D.snd.innerHTML=(soundOn?IC.snd:IC.mute)+'<span>Sound</span>';D.snd.setAttribute('aria-pressed',String(soundOn));D.snd.setAttribute('aria-label','Sound');}
  if(D.cc){D.cc.setAttribute('aria-pressed',String(capsOn));D.player.classList.toggle('wk-nocap',!capsOn);}
  if(D.fs){const f=isFs();D.fs.innerHTML=(f?IC.fsx:IC.fs)+'<span>'+(f?'Exit full screen':'Full screen')+'</span>';D.fs.setAttribute('aria-label',f?'Exit full screen':'Full screen');}
  lastAria=-1;uiTime(pos);}
let lastSec=-1,lastCh='',lastAria=-1;
/* the seek bar: a slider drawn by the player (not a form field, so watching never counts as an unsaved change in the workstation) */
function seekDraw(t){const D=dom();if(!D||!B||!D.seek)return;const f=B.D?clamp(t/B.D,0,1):0;
  if(D.sfill)css(D.sfill,'transform','scaleX('+f.toFixed(4)+')');if(D.sthumb)css(D.sthumb,'left',(f*100).toFixed(2)+'%');
  /* a screen reader hears the position on a pause or a seek, and at most every ten seconds while it plays */
  const a=want&&!drag?Math.floor(t/10):Math.floor(t);if(a!==lastAria){lastAria=a;D.seek.setAttribute('aria-valuenow',String(Math.round(t)));D.seek.setAttribute('aria-valuetext',mmss(t)+' of '+mmss(B.D));}}
function uiTime(t){const D=dom();if(!D||!B)return;seekDraw(t);
  const s=Math.floor(t);if(s!==lastSec){lastSec=s;txt(D.time,mmss(t)+' / '+mmss(B.D));}
  let ch=B.chapters[0].id;for(const c of B.chapters)if(c.start<=t+.01)ch=c.id;
  if(ch!==lastCh){lastCh=ch;D.chaps.querySelectorAll('button').forEach(b=>{const on=b.dataset.ch===ch;b.setAttribute('aria-current',on?'step':'false');});}}
function uiBuilt(){const D=dom();if(!D||!B)return;D.seek.setAttribute('aria-valuemax',String(Math.round(B.D)));lastSec=-1;lastCh='';lastAria=-1;
  D.chaps.innerHTML=B.chapters.map(c=>'<button type="button" data-ch="'+c.id+'" aria-current="false" aria-label="Chapter: '+esc(c.label)+'">'+esc(c.label)+'</button>').join('');
  if(D.note){D.note.textContent=B.notes.join(' ');D.note.hidden=!B.notes.length;}
  if(D.tx)D.tx.innerHTML=B.chapters.map(ch=>'<h3>'+esc(ch.label)+'</h3>'+B.cues.filter(c=>c.chapter===ch.id).map(c=>'<p>'+esc(c.text)+'</p>').join('')).join('');}
function isFs(){const D=dom();const e=document.fullscreenElement||document.webkitFullscreenElement;return !!(D&&(e===D.player||D.player.classList.contains('wk-fs')));}
/* the fixed full-screen panel (where element full screen is missing): everything behind it is inert, so Tab stays in the player */
let INERT=[];
function setInert(on){INERT.forEach(e=>{e.inert=false;});INERT=[];if(!on)return;const D=dom();
  for(let n=D.player;n&&n.parentElement&&n!==document.body;n=n.parentElement)for(const sib of n.parentElement.children)if(sib!==n&&!sib.inert&&!/^(SCRIPT|STYLE|LINK)$/.test(sib.tagName)){sib.inert=true;INERT.push(sib);}}
function panel(on){const D=dom();D.player.classList.toggle('wk-fs',on);document.documentElement.classList.toggle('wk-fs-on',on);setInert(on);}
function fullscreen(){const D=dom();if(!D)return;const p=D.player;
  if(isFs()){if(p.classList.contains('wk-fs'))panel(false);else{(document.exitFullscreen||document.webkitExitFullscreen||function(){}).call(document);}setTimeout(()=>{fit();ui();},60);return;}
  const rq=p.requestFullscreen||p.webkitRequestFullscreen;let ok=false;
  if(rq){try{const r=rq.call(p);ok=true;if(r&&r.catch)r.catch(()=>{panel(true);fit();ui();});}catch(e){ok=false;}}
  if(!ok)panel(true);[60,400,1000].forEach(t=>setTimeout(()=>{fit();ui();},t));}
/* the stage is drawn at 1280 x 720 and scaled to the width of the view (in full screen, to fit the screen) by one transform; in full
   screen a small picture moves the captions under it, so the scale is worked out again with the caption band's height */
function fit(){const D=dom();if(!D)return;const f=isFs();let k;
  if(f){const bar=(D.player.querySelector('.wk-bar')||{}).offsetHeight||60,chs=D.chaps.offsetHeight||0;
    /* v21.44 the room is the player's own box: on an iPad a form inside the workstation reports a window as wide as its page,
       not the screen, and the picture came out wider than the screen in full screen */
    const R=fsRoom(D),kk=cap=>Math.max(.1,Math.min(R.w/SW,(R.h-bar-chs-cap-12)/SH));k=kk(0);D.player.classList.toggle('wk-small',k<.5);
    if(k<.5&&capsOn&&D.cap2)k=kk(D.cap2.offsetHeight||0);D.frame.style.width=f2(SW*k)+'px';}
  else{const kw=Math.max(.1,(D.player.clientWidth||SW)/SW);k=kw;let small=k<.5;
    /* a short window (an iPad held sideways, the form inside the workstation): the picture is scaled to the height left below the
       sticky toolbar once its controls are counted too, so it and its controls show together; it is centred and the controls keep the
       player's width. Down to .4 the captions stay on the picture; below that they go under it; below .3 the width rules again
       (the page scrolls, and full screen is the way to see it whole) */
    const h=roomH(D),kh=h/SH;
    if(kh<kw){if(kh>=.4){k=kh;small=false;}
      else{D.player.classList.add('wk-small');const k2=(h-(capsOn&&D.cap2?D.cap2.offsetHeight||0:0))/SH;if(k2>=.3){k=k2;small=true;}}}
    D.frame.style.width=k<kw-.0005?f2(SW*k)+'px':'';css(D.stage,'transform','scale('+k.toFixed(5)+')');D.frame.style.height=f2(SH*k)+'px';D.player.classList.toggle('wk-small',small);return;}
  css(D.stage,'transform','scale('+k.toFixed(5)+')');D.frame.style.height=f2(SH*k)+'px';D.player.classList.toggle('wk-small',k<.5);}
/* the inside of the player in full screen (its padding is the screen's safe areas), never more than the window */
function fsRoom(D){const p=D.player;let w=p.clientWidth||0,h=p.clientHeight||0;
  try{const cs=getComputedStyle(p);w-=(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0);h-=(parseFloat(cs.paddingTop)||0)+(parseFloat(cs.paddingBottom)||0);}catch(e){}
  const vv=window.visualViewport,W=Math.min(window.innerWidth||Infinity,vv&&vv.width||Infinity),H=Math.min(window.innerHeight||Infinity,vv&&vv.height||Infinity);
  return {w:w>0?Math.min(w,W):(isFinite(W)?W:SW),h:h>0?Math.min(h,H):(isFinite(H)?H:SH)};}
/* the height the picture may take outside full screen: the window less the sticky toolbar, the player's controls and its margins */
function stickyH(){const tb=document.querySelector('.toolbar');let th=0;try{if(tb&&/sticky|fixed/.test(getComputedStyle(tb).position))th=tb.offsetHeight;}catch(e){}return th;}
function roomH(D){const bar=(D.player.querySelector('.wk-bar')||{}).offsetHeight||0,chs=D.chaps.offsetHeight||0;return (window.innerHeight||0)-stickyH()-bar-chs-30;}
/* on entering the view: when the player does not fit below the sticky toolbar, scroll it there */
function reveal(){const D=dom();if(!D||isFs())return;const th=stickyH();
  const r=D.player.getBoundingClientRect();if(!r.height||(r.top>=th&&r.bottom<=window.innerHeight))return;window.scrollTo({top:Math.max(0,r.top+window.scrollY-th-8)});}
function wire(){const D=DOM;
  D.play.addEventListener('click',toggle);D.big.addEventListener('click',()=>{play();});
  D.restart.addEventListener('click',()=>{seek(0);if(!want)play();});
  /* the seek bar: drag or tap anywhere on it (touch too); while it is held the frames follow and the sound waits; letting go plays on */
  let resume=false;const posFrom=e=>{const r=D.seek.getBoundingClientRect();return clamp((e.clientX-r.left)/Math.max(1,r.width),0,1)*(B?B.D:0);};
  D.seek.addEventListener('pointerdown',e=>{if(!B||e.button>0)return;e.preventDefault();drag=true;try{D.seek.setPointerCapture(e.pointerId);}catch(x){}try{D.seek.focus({preventScroll:true});}catch(x){}
    if(want){resume=true;stop(true);}pos=posFrom(e);renderAt(pos);ui();});
  D.seek.addEventListener('pointermove',e=>{if(!drag)return;pos=posFrom(e);renderAt(pos);uiTime(pos);});
  const up=()=>{if(!drag)return;drag=false;if(resume){resume=false;if(pos<B.D-.05)play();else ui();}else ui();};
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>D.seek.addEventListener(ev,up));
  D.seek.addEventListener('keydown',e=>{if(!B||e.altKey||e.ctrlKey||e.metaKey)return;const st={ArrowLeft:-5,ArrowDown:-5,ArrowRight:5,ArrowUp:5,PageDown:-30,PageUp:30}[e.key];
    let to=null;if(st!=null)to=clock()+st;else if(e.key==='Home')to=0;else if(e.key==='End')to=B.D;if(to==null)return;e.preventDefault();e.stopPropagation();seek(to);});
  D.cc.addEventListener('click',()=>{capsOn=!capsOn;ui();if(isFs())fit();});
  D.snd.addEventListener('click',()=>{soundOn=!soundOn;if(want){const t=clock();seek(t);}else{stopAudio();AU.mode='off';idle();}ui();});
  D.fs.addEventListener('click',fullscreen);
  D.chaps.addEventListener('click',e=>{const b=e.target.closest('button[data-ch]');if(!b||!B)return;const c=B.chapters.find(x=>x.id===b.dataset.ch);if(c)seek(c.start);});
  ['fullscreenchange','webkitfullscreenchange'].forEach(ev=>document.addEventListener(ev,()=>{[30,350,900].forEach(t=>setTimeout(()=>{fit();ui();},t));}));
  let lastW=-1;const onSize=()=>{const w=D.player.clientWidth;if(w!==lastW){lastW=w;fit();}};
  if(window.ResizeObserver){new ResizeObserver(onSize).observe(D.player);
    /* the sticky toolbar's height is part of the room the picture fits in (it folds and unfolds, and its rows wrap) */
    const tb=document.querySelector('.toolbar');let lastT=-1;if(tb)new ResizeObserver(()=>{const h=tb.offsetHeight;if(h!==lastT){lastT=h;if(document.body.classList.contains('view-walk')&&!isFs())fit();}}).observe(tb);}
  window.addEventListener('resize',()=>{lastW=-1;onSize();if(isFs())fit();});
  window.addEventListener('orientationchange',()=>setTimeout(fit,200));
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&want)pause();});
  /* a frame hidden by the workstation reports no intersection and a root of no size (a plain scroll out of view keeps playing) */
  if(window.IntersectionObserver)try{new IntersectionObserver(es=>{const e=es[es.length-1];ioHidden=!e.isIntersecting&&!!e.rootBounds&&(!e.rootBounds.width||!e.rootBounds.height);if(ioHidden&&want)pause();}).observe(D.player);}catch(e){}
  /* Escape closes the full-screen panel first, before the workstation sees it (one key, one thing) */
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&D.player.classList.contains('wk-fs')){e.preventDefault();e.stopPropagation();fullscreen();}},true);
  document.addEventListener('keydown',e=>{if(!document.body.classList.contains('view-walk')||e.altKey||e.ctrlKey||e.metaKey||e.defaultPrevented)return;const tg=e.target,tn=tg&&tg.tagName;
    if(tn==='INPUT'||tn==='TEXTAREA'||tn==='SELECT'||tg&&tg.isContentEditable)return;
    if(e.key===' '||e.key==='k'||e.key==='K'){if(e.key===' '&&tg&&tg.closest&&tg.closest('button,summary,a[href],[role="button"],[role="checkbox"],dialog'))return;e.preventDefault();if(e.repeat)return;toggle();}
    else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();seek(clock()+(e.key==='ArrowLeft'?-5:5));}});}

/* ---------------- the view: leaving it pauses, entering it rebuilds from the current book ---------------- */
const setView0=setView;
setView=function(v){const was=document.body.classList.contains('view-walk');if(v!=='walk'&&(want||playing))pause();
  if(v==='walk'&&was&&B&&!B.dirty)return;   /* the Walkthrough button again, with the book unchanged: nothing to do */
  setView0(v);if(v==='walk'){try{build();}catch(e){console.error('Walkthrough: '+(e&&e.message||e));}fit();ui();reveal();}else if(isFs()&&dom()&&dom().player.classList.contains('wk-fs'))panel(false);};
/* the book can change while the view is open (Open data, a restore, the case): rebuild from it */
let building=false;
if(typeof renderAll==='function'){const renderAll0=renderAll;
  renderAll=function(){const r=renderAll0.apply(this,arguments);if(building)return r;if(B)B.dirty=true;
    if(document.body.classList.contains('view-walk')){building=true;try{build();fit();ui();}catch(e){console.error('Walkthrough: '+(e&&e.message||e));}finally{building=false;}}return r;};}
window.TKWALK={build,renderAt,play,pause,seek,toggle,
  get duration(){return B?B.D:0;},get cues(){return cuesOut();},get chapters(){return chapsOut();},
  get time(){return clock();},get unmeasured(){const L=audioLines()||{};return Object.keys(L).filter(id=>!MK[id]||MK[id].h!==hash(String(L[id].t||'')));},get playing(){return playing;},get audioMode(){return AU.mode;},get reduced(){return reduced();},
  get stage(){const D=dom();return D&&D.stage;}};
})();

/* ===== the first render, once every part is defined ===== */
renderAll();

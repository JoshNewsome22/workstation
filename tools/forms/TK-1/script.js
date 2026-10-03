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
  medal:{l:'Gold medal',s:'<path d="M21 3h12l7 21H28z" fill="#3D7DD8" stroke="#2A5BA8" stroke-width="1.6" stroke-linejoin="round"/><path d="M51 3H39l-7 21h12z" fill="#E8463C" stroke="#B3261E" stroke-width="1.6" stroke-linejoin="round"/><circle cx="36" cy="45" r="23" fill="#F2C230" stroke="#B8860B" stroke-width="2.4"/><circle cx="36" cy="45" r="16.5" fill="none" stroke="#D9A520" stroke-width="2"/><path d="M36 33.5l3.6 7.6 8.3.9-6.2 5.6 1.8 8.2L36 51.6l-7.5 4.2 1.8-8.2-6.2-5.6 8.3-.9z" fill="#FFF3B0" stroke="#B8860B" stroke-width="1.4" stroke-linejoin="round"/>'},
  trophy:{l:'Trophy',s:'<path d="M22 14H12.5c0 9 4.5 14.5 11 15.5M50 14h9.5c0 9-4.5 14.5-11 15.5" fill="none" stroke="#B8860B" stroke-width="3.2" stroke-linecap="round"/><path d="M21 8h30v15c0 10-6.5 17.5-15 17.5S21 33 21 23z" fill="#F2C230" stroke="#B8860B" stroke-width="2.2" stroke-linejoin="round"/><path d="M27 13c0 9 2 15 6 19" fill="none" stroke="#FFF3B0" stroke-width="2.6" stroke-linecap="round"/><path d="M32 40h8v9h-8z" fill="#D9A520" stroke="#B8860B" stroke-width="1.4"/><path d="M22 49h28l3 9H19z" fill="#8B5A2B" stroke="#5C3A1A" stroke-width="2" stroke-linejoin="round"/><rect x="17" y="58" width="38" height="7" rx="1.5" fill="#5C3A1A"/>'},
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
  tb:'__**FIRST-THEN**__:\nFirst-Then means that access to something your learner likes comes only after they first do something they like less. When a more preferred activity is made to depend on a less preferred one, the less preferred one becomes more likely: the Premack principle, or grandma\u2019s rule. It works when the preferred activity is available only through the board, so keep the THEN item put away at other times. A picture of the skill you are teaching your learner goes on the front of this page under the word **FIRST**. The picture of the activity your learner will earn goes under the word **THEN**.\n\n__**Tokens**__:\nThis page is also where your learner places each {token} as it is earned. Give the {token} right after the behavior, with brief praise, and let the learner put it in the next box. There are {n} boxes, so when the {n}th {token} is earned, your learner gets the THEN item at once.{last} Keep the exchange immediate when the board is new; a longer wait can be built in later.\n\n__**Not So FAST**__: Before starting, decide how much of the behavior earns one {token}: how many responses, or how long. For example, three problems answered, or two minutes of staying seated. This is the schedule of reinforcement, and it must not ask too much. When a skill is brand new, give a {token} after every correct response or every short stretch of the behavior. As the skill becomes reliable, raise the requirement a little at a time; if the behavior falls apart after a step up, you raised it too fast: go back one step.',
  cb:'A **Picture Choice Board** shows your learner pictures of items and activities before a task begins, so they can choose what they are working for. Learners often prefer to choose, and choosing has lowered problem behavior during tasks, but choice does not make a weak item strong: every picture should be something your learner values.\n\n**Prerequisite Skills:** Your learner needs to be able to scan an array of pictures and select the picture of an item or activity they want.\n\n__**Steps:**__\n1. Show the learner the choice board and let them select an item to work for.\n***If necessary, spend some time pairing the picture of the item with the actual object.***\n2. As necessary, use prompting to assist the learner with the selection.\n3. Once the learner selects a picture, turn to the next page and place the picture in the green box under the word \u201cThen.\u201d\n\n**Note:** The six pictures should come from a preference assessment and change as preferences change; an item the learner can get freely, or has just had plenty of, loses value. Once your learner makes good progress, make sure the skill holds up without choosing a picture first. Check that the chosen item works as reinforcement: the skill it follows should be happening more. If it is not, the item is not a reinforcer for that behavior, whatever the learner picked.',
  te:'A **Token Economy** is a program in which tokens are earned for specific behaviors and later exchanged for things the learner wants. Token economies are powerful because they work across settings and because one token can be exchanged for many different back-up reinforcers, which keeps the tokens valuable when any one item has lost its appeal. Tokens also bridge the gap between the moment the behavior happens and the moment the real reinforcer is delivered, which helps teach waiting. A token used this way is a *generalized conditioned reinforcer*.\n\n## Before You Start\nA token is only a piece of paper until it has been exchanged for things the learner values. Think about this: would you rather receive a blank piece of paper or a 100 dollar bill? Most people say the bill, because they have a history of exchanging bills for valuable things. The bill\u2019s value was learned, or conditioned. Our goal is the same for these tokens. If the tokens are not yet valuable to the student, do the steps below before starting the token economy, and keep going until the student reaches for the token.\n\n**1. Sampling (pairing):** Give the {token}, then exchange it right away for the back-up reinforcer. Repeat several times.\n**2. Coaching:** Prompt the student to do the target response, give the {token}, and exchange it right away.\n**3. Conditioning:** Give the {token} immediately after the target response, exchange it right away, then begin to require more tokens before each exchange. The test that it has worked: the behavior that earns tokens goes up.',
  tt:'**Teaching Targets:** This page is for selecting which behaviors you target: a replacement behavior from the behavior plan, or a new skill. **This page is where you choose what to teach your learner!** A replacement behavior should do the same job for the learner as the problem behavior did (the function found in the assessment), and it should be easier for the learner than the problem behavior. Work on one target on the board at a time, and agree on what counts, so every adult gives the {token} for the same thing.\n\n**Prerequisite Skills:** Make sure the learner has the skills a new skill depends on before teaching it. For example, make sure the learner can attend to an instructor for a short, set time before teaching academic skills that require attending for longer and then answering questions. Another example: before teaching a learner to raise a hand, select a picture, or make a gesture for attention, make sure the learner can make the movement.\n\n__**Steps:**__\n1. Select the skill you would like to teach your learner from the choices on the front of this page. If the skill you are working on is not there, write its name on the blank picture.\n2. Now place the picture of the skill in the gray box on the next page under the word \u201cFirst.\u201d',
  h1:'STEP 1 : YOUR LEARNER PICKS SOMETHING TO EARN\nA **Picture Choice Board** shows your learner pictures of items and activities before a task begins, so they can choose what they are working for. Learners often prefer to choose, and choosing has lowered problem behavior during tasks, but choice does not make a weak item strong: every picture should be something your learner values.\n\n**Prerequisite Skills:** Your learner needs to be able to scan an array of pictures and select the picture of an item or activity they want.\n\n__**Steps:**__\n1. Show the learner the choice board and let them select an item to work for.\n***If necessary, spend some time pairing the picture of the item with the actual object.***\n2. As necessary, use prompting to assist the learner with the selection.\n3. Once the learner selects a picture, turn to the next page and place the picture in the green box under the word \u201cThen.\u201d\n\n**Note:** There are plenty of extra picture choices in the \u201cextras book\u201d, and if you don\u2019t see an image choice that your learner wants, use the __OTHER__ image to write in the name of the item/activity. The six pictures should come from a preference assessment and change as preferences change; an item the learner can get freely, or has just had plenty of, loses value. Once your learner makes good progress, make sure the skill holds up without choosing a picture first. Check that the chosen item works as reinforcement: the skill it follows should be happening more. If it is not, the item is not a reinforcer for that behavior, whatever the learner picked.',
  h2:'STEP 2 : YOU SELECT WHAT TO TEACH YOUR LEARNER\n**Teaching Targets:** This page is for selecting which behaviors you target: a replacement behavior from the behavior plan, or a new skill. **This page is where you choose what to teach your learner!** A replacement behavior should do the same job for the learner as the problem behavior did (the function found in the assessment), and it should be easier for the learner than the problem behavior. Work on one target on the board at a time, and agree on what counts, so every adult gives the {token} for the same thing.\n\n**Prerequisite Skills:** Make sure the learner has the skills a new skill depends on before teaching it. For example, make sure the learner can attend to an instructor for a short, set time before teaching academic skills that require attending for longer and then answering questions. Another example: before teaching a learner to raise a hand, select a picture, or make a gesture for attention, make sure the learner can make the movement.\n\n__**Steps:**__\n1. Select the skill you would like to teach your learner from the choices on the front of this page. If the skill you are working on is not there, write its name on the blank picture.\n2. Now place the picture of the skill in the gray box on the next page under the word \u201cFirst.\u201d',
  h3:'STEP 3 : DELIVER TOKEN ({TOKENS}), REINFORCE BEHAVIOR\nPlace the picture of the skill you are teaching your learner under the word **FIRST**. The picture of the activity your learner will earn goes under the word **THEN**.\n\n__**Tokens**__:\nThis page is also where your learner places each {token} as it is earned. Give the {token} right after the behavior, with brief praise, and let the learner put it in the next box. There are {n} boxes, so when the {n}th {token} is earned, your learner gets the THEN item at once.{last} Keep the exchange immediate when the board is new; a longer wait can be built in later.\n\n__**Not So FAST**__: Before starting, decide how much of the behavior earns one {token}: how many responses, or how long. For example, three problems answered, or two minutes of staying seated. This is the schedule of reinforcement, and it must not ask too much. When a skill is brand new, give a {token} after every correct response or every short stretch of the behavior. As the skill becomes reliable, raise the requirement a little at a time; if the behavior falls apart after a step up, you raised it too fast: go back one step.'
};
const CREDIT0='To find more resources and information visit\nwww.Behavior-Charts.com';
function blank(){return{meta:Object.assign({poss:'s',layout:'ft',avatar:'av:boy',n:'5',wm:'20',order:'all',sp_card:'ch:0',sp_size:'large',panel:'light',pagesize:'8.82',credit:CREDIT0},DEF),chk:{pg_ch:true,pg_tg:true,pg_bd:true,pg_tk:true,pg_how:false,cs_ch:true,cs_tg:true,cs_tk:true,qrframe:true},photos:[],photo:[cello()],tok:[cello('tk:star')],tokL:[cello('tk:medal')],bg:[cello(),cello()],sp:[cello()],ch:Array.from({length:6},()=>cello()),tg:Array.from({length:6},()=>cello()),ft:[cello(),cello()],caps:[],txt:Object.assign({},TXT0)};}
let S=blank();
const nTok=()=>Math.max(3,Math.min(10,Math.round(num(S.meta.n)||5)));
function ensure(){
  if(!S.meta||typeof S.meta!=='object')S.meta={};if(!S.chk||typeof S.chk!=='object')S.chk={};if(!Array.isArray(S.photos))S.photos=[];
  const six=k=>{if(!Array.isArray(S[k]))S[k]=[];while(S[k].length<6)S[k].push(cello());S[k].length=6;};six('ch');six('tg');
  const fix=(k,n,def)=>{if(!Array.isArray(S[k])||S[k].length!==n)S[k]=def();};fix('ft',2,()=>[cello(),cello()]);fix('tok',1,()=>[cello('tk:star')]);fix('tokL',1,()=>[cello('tk:medal')]);fix('photo',1,()=>[cello()]);fix('bg',2,()=>[cello(),cello()]);fix('sp',1,()=>[cello()]);
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
  d.innerHTML='<div class="pd-head"><div class="pd-top"><b id="pdTitle">Choose a picture</b><div class="pd-seg" id="pdMultiLab" role="group" aria-label="How many pictures"><button type="button" id="pdOne" aria-pressed="true">One picture</button><button type="button" id="pdMulti" aria-pressed="false">Several at once</button></div></div><select id="pdCat" aria-label="Picture category"><option value="">All</option><option value="_photos">My photos</option><option value="_own">Tokens and avatars drawn here</option>'+Object.entries(CATS).map(([k,v])=>'<option value="'+k+'">'+esc(v)+'</option>').join('')+'</select><input id="pdQ" placeholder="search" aria-label="Search pictures"><button type="button" id="pdPhoto">Upload a photo</button><button type="button" id="pdNone">No picture</button><button type="button" id="pdClose">Close</button><div class="pd-bar" id="pdBar"><span id="pdCount"></span><button type="button" id="pdUndo">Clear the picks</button><button type="button" class="pd-go" id="pdGo">Put them on the cards</button></div></div><div class="pd-grid" id="pdGrid"></div><div class="pd-foot">'+esc(window.NBH_PICTO_LICENSE||'')+' Photos are resized to thumbnails and saved inside the form’s file. The tokens and avatars are drawn in this form.</div>';
  document.body.appendChild(d);
  const grid=()=>{const c=$('#pdCat').value,q=($('#pdQ').value||'').toLowerCase();let h='';
    const ownList=PICK&&PICK.first==='tok'?[['tk:',TOK],['av:',AV]]:[['av:',AV],['tk:',TOK]];
    if(!c||c==='_photos')h+=S.photos.filter(p=>!q||p.label.toLowerCase().includes(q)).map(p=>'<button type="button" data-ph="'+p.id+'"><img src="'+p.img+'" alt="">'+esc(p.label||'photo')+'<span class="pd-x" data-phdel="'+p.id+'" title="Remove this photo" role="button" style="display:block;color:#8E2A2A;font-size:10px">remove</span></button>').join('');
    if(!c||c==='_own')ownList.forEach(([pre,set])=>{h+=Object.entries(set).filter(([k,v])=>!q||v.l.toLowerCase().includes(q)).map(([k,v])=>'<button type="button" data-k="'+pre+k+'">'+own(v,'')+esc(v.l)+'</button>').join('');});
    if(c!=='_photos'&&c!=='_own')h+=KEYS.filter(k=>(!c||P[k].c===c)&&(!q||P[k].l.toLowerCase().includes(q)||k.includes(q))).map(k=>'<button type="button" data-k="'+k+'">'+picto(k,'')+esc(P[k].l)+'</button>').join('');
    const out=(window.NBH_PICTOS_MISSING?'<p class="hint">The picture library file <b>nbh-pictos.js</b> is not beside this form, so no library pictures are listed. Put it in the same folder as the form, or use a photo or one of the pictures drawn here.</p>':'')+(h||'<p class="hint">Nothing matches.</p>');$('#pdGrid').innerHTML=out;marks();};
  /* several at once: each tap adds the picture to the picks (a second tap takes it out); the picks go on the cards in the order tapped */
  const keyOf=b=>b.dataset.k?'k:'+b.dataset.k:'ph:'+b.dataset.ph;
  const room=()=>PICK?PICK.arr.length-PICK.i:0;
  const marks=()=>{const m=!!(PICK&&PICK.multi);d.classList.toggle('multi',m);$('#pdMulti',d).setAttribute('aria-pressed',String(m));$('#pdOne',d).setAttribute('aria-pressed',String(!m));$('#pdMultiLab',d).style.display=PICK&&PICK.canMulti?'':'none';$('#pdTitle',d).textContent=PICK&&PICK.canMulti?(m?'Choose pictures for cards '+(PICK.i+1)+' to '+PICK.arr.length:'Choose a picture for card '+(PICK.i+1)):'Choose a picture';$('#photoIn').multiple=m;
    $$('#pdGrid button[data-k],#pdGrid button[data-ph]').forEach(b=>{const n=m?PICK.sel.indexOf(keyOf(b)):-1;b.classList.toggle('on',n>=0);if(n>=0)b.dataset.n=n+1;else delete b.dataset.n;});
    if(m){const n=PICK.sel.length,r=room();$('#pdCount',d).textContent=n?n+' of '+r+' picked: they go on '+(n===1?'card '+(PICK.i+1):'cards '+(PICK.i+1)+' to '+(PICK.i+n))+', in the order tapped':'Tap up to '+r+' pictures, in the order you want them on cards '+(PICK.i+1)+' to '+PICK.arr.length+'.';$('#pdGo',d).disabled=!n;}};
  d.marks=marks;
  const putIn=()=>{PICK.sel.forEach((key,j)=>{const o=PICK.arr[PICK.i+j];if(!o)return;const [t,v]=[key.slice(0,key.indexOf(':')),key.slice(key.indexOf(':')+1)];if(t==='k'){o.k=v;o.ph='';}else{o.ph=v;o.k='';}o.l='';});d.close();const dn=PICK.done;PICK=null;dn();};
  /* the choice of one or several is remembered for the rest of the session */
  const setMulti=m=>{if(!PICK||PICK.multi===m)return;PICK.multi=m;PICK_MULTI=m;PICK.sel=[];marks();};
  $('#pdMulti',d).addEventListener('click',()=>setMulti(true));$('#pdOne',d).addEventListener('click',()=>setMulti(false));
  $('#pdUndo',d).addEventListener('click',()=>{if(PICK){PICK.sel=[];marks();}});
  $('#pdGo',d).addEventListener('click',()=>{if(PICK&&PICK.sel.length)putIn();});
  $('#pdCat',d).addEventListener('change',grid);$('#pdQ',d).addEventListener('input',grid);
  $('#pdGrid',d).addEventListener('click',async e=>{const x=e.target.closest('[data-phdel]');
    if(x){e.preventDefault();e.stopPropagation();if(!(await nbhUI.confirm('Remove this photo?\nAnything using it loses the picture.',{ok:'Remove',danger:true})))return;const id=x.dataset.phdel;S.photos=S.photos.filter(p=>p.id!==id);['photo','tok','tokL','bg','sp','ch','tg','ft'].forEach(k=>S[k].forEach(o=>{if(o.ph===id)o.ph='';}));grid();renderAll();return;}
    const b=e.target.closest('button[data-k],button[data-ph]');if(!b||!PICK)return;
    if(PICK.multi){const key=keyOf(b),at=PICK.sel.indexOf(key);if(at>=0)PICK.sel.splice(at,1);else if(PICK.sel.length<room())PICK.sel.push(key);marks();return;}
    const o=PICK.arr[PICK.i];if(b.dataset.k){o.k=b.dataset.k;o.ph='';}else{o.ph=b.dataset.ph;o.k='';}d.close();PICK.done();});
  $('#pdNone',d).addEventListener('click',()=>{if(PICK){PICK.arr[PICK.i].k='';PICK.arr[PICK.i].ph='';d.close();PICK.done();}});
  $('#pdClose',d).addEventListener('click',()=>d.close());
  $('#pdPhoto',d).addEventListener('click',()=>$('#photoIn').click());
  d.grid=grid;return d;}
let PICK_MULTI=false;
function openPick(arr,i,done,first,multi){const can=arr===S.ch||arr===S.tg;PICK={arr,i,done,first,canMulti:can,multi:can&&(multi===undefined?PICK_MULTI&&i<arr.length-1:!!multi),sel:[]};const d=pickDlg();$('#pdQ',d).value='';$('#pdCat',d).value=first==='tok'||first==='av'?'_own':'';d.grid();if(d.showModal)d.showModal();else d.setAttribute('open','');}
/* v21.42a: pictures keep print quality. An SVG is kept as the vector it is (it prints sharp at any size); a photo or PNG is kept at up to
   1200 px on its long side, which is 300 dpi on a 4 in card and about 420 dpi on the 2.85 in boxes, as a JPEG at 0.86 (PNG when it has transparency). */
function addPhoto(file,cb){const mk=(img,label)=>({id:'p'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36),label:(label||'photo').replace(/\.[^.]+$/,'').slice(0,30),img});
  const name=file.name||'photo';
  if(/svg/i.test(file.type)||/\.svg$/i.test(name)){const r=new FileReader();r.onload=()=>{const txt=String(r.result||'');if(!/<svg[\s>]/i.test(txt))return;const p=mk('data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(txt))),name);S.photos.push(p);cb(p);};r.readAsText(file);return;}
  const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas'),s=Math.min(1,1200/Math.max(im.width,im.height));c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);const g=c.getContext('2d');g.drawImage(im,0,0,c.width,c.height);
    let alpha=false;if(/png|gif|webp/i.test(file.type)){try{const d=g.getImageData(0,0,c.width,c.height).data;for(let i=3;i<d.length;i+=Math.max(4,Math.floor(d.length/4000)*4)){if(d[i]<250){alpha=true;break;}}}catch(e){}}
    const p=mk(alpha?c.toDataURL('image/png'):c.toDataURL('image/jpeg',0.86),name);S.photos.push(p);cb(p);};im.src=r.result;};r.readAsDataURL(file);}
$('#photoIn').addEventListener('change',e=>{const fs=[...e.target.files];e.target.value='';if(!fs.length)return;if(PICK&&PICK.multi){fs.forEach(f=>addPhoto(f,p=>{const d=$('#pickDlg');if(PICK&&PICK.sel.length<PICK.arr.length-PICK.i)PICK.sel.push('ph:'+p.id);if(d)d.grid();}));return;}const f=fs[0];addPhoto(f,p=>{if(PICK&&PICK.multi){const d=$('#pickDlg');if(PICK.sel.length<PICK.arr.length-PICK.i)PICK.sel.push('ph:'+p.id);if(d)d.grid();return;}if(PICK){PICK.arr[PICK.i].ph=p.id;PICK.arr[PICK.i].k='';const d=$('#pickDlg');if(d&&d.open)d.close();PICK.done();PICK=null;}else renderAll();});});
document.addEventListener('click',e=>{const b=e.target.closest('.pick button[data-pick]');if(!b)return;const g=b.parentNode,r=g.dataset.r,i=+g.dataset.i;openPick(S[r],i,()=>{if(r==='tok')recaps(false);renderAll();},r==='tok'||r==='tokL'?'tok':r==='photo'?'av':'');});

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});fitAll();scaleBooks();}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

/* ---------------- the editing tables ---------------- */
function rowsTbl(k){const id=k==='ch'?'#chTbl':'#tgTbl';$(id+' tbody').innerHTML=S[k].map((o,i)=>'<tr><td class="num">'+(i+1)+'<span class="mv"><button type="button" data-mv="'+k+':'+i+':-1" aria-label="Move card '+(i+1)+' up"'+(i?'':' disabled')+'>&#9650;</button><button type="button" data-mv="'+k+':'+i+':1" aria-label="Move card '+(i+1)+' down"'+(i<S[k].length-1?'':' disabled')+'>&#9660;</button></span></td><td>'+pickCell(k,i,o)+'</td><td><input data-r="'+k+'" data-i="'+i+'" data-f="l" name="'+k+'.'+i+'.l" value="'+esc(o.l)+'" placeholder="'+esc(lbl({k:o.k,ph:o.ph})||'(empty box)')+'" aria-label="Label '+(i+1)+'"></td></tr>').join('');
  const sel=$(k==='ch'?'#chSpareSel':'#tgSpareSel'),v=sel.value;sel.innerHTML=S[k].map((o,i)=>'<option value="'+i+'">'+(i+1)+'. '+esc(lbl(o)||'(empty)')+'</option>').join('');if(v)sel.value=v;}
function renderTbls(){
  rowsTbl('ch');rowsTbl('tg');
  $('#capTbl tbody').innerHTML=S.caps.map((c,i)=>'<tr><td class="num">'+(i+1)+'</td><td><input data-r="caps" data-i="'+i+'" data-f="a" name="caps.'+i+'.a" value="'+esc(c.a)+'" aria-label="Caption above slot '+(i+1)+'"></td><td><input data-r="caps" data-i="'+i+'" data-f="b" name="caps.'+i+'.b" value="'+esc(c.b)+'" aria-label="Caption below slot '+(i+1)+'"></td></tr>').join('');
  const put=(id,r,i)=>{const el=$(id);if(el)el.outerHTML=pickCell(r,i,S[r][i]).replace('class="pick"','class="pick" id="'+id.slice(1)+'"');};
  put('#phPick','photo',0);put('#tokPick','tok',0);put('#tokLPick','tokL',0);put('#bgChPick','bg',0);put('#bgTgPick','bg',1);put('#spPick','sp',0);put('#ftFirst','ft',0);put('#ftThen','ft',1);
  const sp=$('#spCard'),v=S.meta.sp_card||'ch:0';sp.innerHTML='<optgroup label="Choices">'+S.ch.map((o,i)=>'<option value="ch:'+i+'">'+(i+1)+'. '+esc(lbl(o)||'(empty)')+'</option>').join('')+'</optgroup><optgroup label="Targets">'+S.tg.map((o,i)=>'<option value="tg:'+i+'">'+(i+1)+'. '+esc(lbl(o)||'(empty)')+'</option>').join('')+'</optgroup><option value="tok">The token ('+esc(tokName())+')</option><option value="own">A card made on the spot (label and picture below)</option>';sp.value=v;if(sp.value!==v)sp.value='ch:0';
  $('#wmPct').textContent=String(Math.max(5,Math.min(25,num(S.meta.wm)||12)));
  renderSetup();
}
function renderSetup(){const m=S.meta,v=$('#setupVerdict');const bl=$('#buildLine');if(bl)bl.textContent='This copy of the form: build '+BUILD+'.';const nch=S.ch.filter(has).length,ntg=S.tg.filter(has).length;
  if(!m.client&&!m.first&&!nch&&!ntg){v.innerHTML='<div class="verdict v-mid"><b>Setup not started.</b> The student and the first name as it prints, the photo, the tokens; then the Choices and Targets pages.</div>';return;}
  const miss=[];if(!m.first)miss.push('the first name (the Board prints a line to write on)');if(!has(S.photo[0]))miss.push('a photo (the '+esc(lbl({k:m.avatar||'av:boy'})||'avatar').toLowerCase()+' avatar prints instead)');if(nch<6)miss.push((6-nch)+' of the six choices');if(ntg<6)miss.push((6-ntg)+' of the six targets');
  /* (v21.42i) the same picture twice among the six is usually a slip of the finger in the picker */
  const twice=(k,name)=>{const seen={},d=[];S[k].forEach((o,i)=>{const id=o.ph?'ph:'+o.ph:o.k;if(!id)return;if(seen[id]!==undefined)d.push(name+' '+(seen[id]+1)+' and '+(i+1));else seen[id]=i;});return d;};
  const dup=twice('ch','choices').concat(twice('tg','targets'));if(dup.length)miss.push('the same picture on '+dup.join(', ')+' (change one, unless that is meant)');
  v.innerHTML='<div class="verdict '+(miss.length?'v-mid':'v-ok')+'"><b>'+(miss.length?'Still open:':'Set up.')+'</b> '+(miss.length?miss.join('; ')+'.':'')+' '+nTok()+' '+esc(plural(tokName()).toLowerCase())+' to earn'+(termOn()?' (the last one marked'+(termMode()==='pic'?': '+esc(lbl(S.tokL[0])||'its own picture').toLowerCase():'')+')':'')+'; '+(m.layout==='rules'?'Rules-row':'First-Then')+' board'+(m.qr?'; QR code on every page':'; no QR code')+'.</div>';}

/* ---------------- the QR code (qrcode-generator, inlined above; type 0 = automatic, error correction M) ---------------- */
/* the QR code, made here by qrcode-generator. Plain: black modules, level M. Framed (the default, the assessor's style from the
   Choices file): slate modules, rounded slate finder rings with a green core, SCAN ME in a clear square in the middle, level H
   so the words cost nothing. The core is a deeper green than the tab (#6aa55a): a pale core is read as white by decoders. */
/* the build of this copy of the form, shown on Setup and on the Preview so it is easy to check that the uploaded file is the new one */
const BUILD='v21.42i';
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
/* (v21.42h) Safari on the iPad and iPhone ignores the request for landscape paper and prints inside its own margins (about 0.5 in, with
   the address and date at the foot). On those devices each book page is printed turned on its side on a portrait sheet, at full size inside
   that area; the card sheets are laid out portrait in it, so the cards keep the size of the boxes. Setup can force either way. */
const IOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const TW=7.4,TH=9.45;
function turned(){const m=S.meta.sheets||'auto';return m==='turn'||(m==='auto'&&IOS);}
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
function cardHtml(o,size,opts){opts=opts||{};const other=opts.other,blank=opts.blank;const st=opts.w?'width:'+IN(opts.w)+';height:'+IN(opts.h):size?'width:'+IN(size)+';height:'+IN(size):'';
  return '<div class="card'+(opts.ul?' ul':'')+(opts.cls?' '+opts.cls:'')+'" style="'+st+'"><div class="cl">'+(blank?'&nbsp;':esc(other?'Other':(lbl(o)||'')))+'</div><div class="cp">'+(other||blank?'<div class="lines"><i></i><i></i><i></i></div>':pic(o,''))+'</div></div>';}
/* (v21.43) the terminal token: the last token can differ from the others (an orange double border, and if chosen its own picture), so the
   learner can see that it fills the board and the exchange comes next; the Board's last slot and the Tokens page's last box carry the same ring */
function termMode(){const t=S.meta.term;return t==='ring'||t==='pic'?t:'none';}
function termOn(){return termMode()!=='none';}
function tokCard(size,last){const L=!!last&&termOn();const o=L&&termMode()==='pic'&&has(S.tokL[0])?S.tokL[0]:S.tok[0];return '<div class="card tok'+(L?' last':'')+'" style="width:'+IN(size)+';height:'+IN(size)+'"><div class="cp">'+pic(o,'')+'</div></div>';}
function pageGrid(kind){const bg=S.bg[kind==='ch'?0:1];const pcls=S.meta.panel==='grey'?'grey':'light';
  const title=kind==='ch'?'<span class="ul">What Are You Earning?</span>':'<span class="ul">First:</span> Teaching Targets';
  const boxes=[['c1','r1'],['c2','r1'],['c3','r1'],['c1','r2'],['c2','r2'],['c3','r2']].map((c,i)=>'<div class="bx '+c[0]+' '+c[1]+'"><span class="dot"></span>'+(i===5?qrBox():'')+'</div>').join('');
  return pgOpen(kind,'front')+'<div class="panel '+pcls+'">'+wmHtml(bg)+'<div class="ttl" data-frac=".97">'+title+'</div>'+boxes+'</div>'+pgClose;}
function stripHtml(){const d=strip();const per=Math.ceil(d.n/d.rows);let h='<div class="strip" style="height:'+pt(d.band)+'">';
  for(let r=0;r<d.rows;r++){const k=Math.min(per,d.n-r*per);const left0=k===5?19.27:(PANW-(k*d.sz+(k-1)*(d.pitch-d.sz)))/2+15.38;
    h+=S.caps.slice(r*per,r*per+k).map((c,i)=>'<div class="slot'+(d.sz<100?' sm':'')+(termOn()&&r*per+i===d.n-1?' last':'')+'" style="left:'+pt(left0+i*d.pitch)+';top:'+pt(9.44+r*d.rowPitch)+';width:'+pt(d.sz+2)+';height:'+pt(d.sz+2)+'"><span class="ca">'+esc(c.a)+'</span><span class="dot"></span><span class="cb">'+esc(c.b)+'</span></div>').join('');}
  return h+'</div>';}
function nameTitle(){const f=String(S.meta.first||'').trim();const ap=S.meta.poss==='bare'&&/s$/i.test(f)?'’':'’s';const st=String(S.meta.setting||'').trim();
  return (f?esc(f)+ap:'<span class="blank"></span>’s')+' '+(S.meta.layout==='rules'&&st?esc(st)+' ':'')+'Chart';}
/* the student's photo is cropped to the circle at the position and size set on Setup (a portrait's face sits above its middle, so it starts at 35 % down) */
function photoFit(){const x=Math.max(0,Math.min(100,num(S.meta.ph_x)??50)),y=Math.max(0,Math.min(100,num(S.meta.ph_y)??35)),z=Math.max(100,Math.min(300,num(S.meta.ph_z)??100))/100;return 'object-position:'+x+'% '+y+'%;transform-origin:'+x+'% '+y+'%;transform:scale('+z+')';}
/* (v21.42i) the two photos face each other: one of them prints mirrored (the samples mirror the right one) */
function flipSide(){const f=S.meta.ph_flip||'r';return f==='l'||f==='none'?f:'r';}
function photoInner(){const o=S.photo[0];return has(o)?(o.ph?pic(o,'',photoFit()):pic(o,'')):pic({k:S.meta.avatar||'av:boy'},'');}
function photoHtml(side){return '<div class="bd-photo '+side+(flipSide()===side?' flip':'')+'">'+photoInner()+'</div>';}
function presetBox(o,cls,ul,cx){return '<div class="bx ft '+cls+'"'+(cx!=null?' style="left:'+pt(cx-74.94)+'"':'')+'>'+(has(o)?cardHtml(o,0,{ul}):'<span class="dot"></span>')+'</div>';}
function pageBoard(){const d=strip();const panelH=pageMode()==='fill'?null:BDH;
  let inner;
  if(S.meta.layout==='rules'){const rules=S.tg.filter(has).slice(0,5);while(rules.length<2)rules.push(S.tg[rules.length]||cello());
    const k=rules.length,ph=panelH||(612/scl()-d.band-6.8),avail=ph-100-10,earn=Math.min(146.88,avail-48),rp=Math.min(173,avail-50),cw=(PANW-14-8-(earn+2)-20-(k-1)*10)/k;
    inner=photoHtml('r')+'<div class="ttl rules" data-frac="1"><span class="ul">'+nameTitle()+'</span></div><div class="rulesrow"><div class="rr">'+rules.map(o=>'<div class="rule" style="width:'+pt(cw)+'"><div class="rl"><span>'+esc(lbl(o))+'</span></div><div class="rp" style="height:'+pt(rp)+'">'+pic(o,'')+'</div></div>').join('')+'</div><div class="earn"><div class="lab">Earn</div><div class="bx ft green" style="width:'+pt(earn+3)+';height:'+pt(earn+3)+'"><span class="dot"></span>'+qrBox().replace('class="qr"','class="qr" style="width:'+pt(Math.min(51.7,(earn+3)/2-21))+';height:'+pt(Math.min(51.7,(earn+3)/2-21))+'"')+'</div></div></div>';}
  else inner=photoHtml('l')+photoHtml('r')+'<div class="ttl bd" data-frac=".72"><span class="ul">'+nameTitle()+'</span></div><div class="ftlab" style="left:'+pt(163.62)+'">First</div><div class="ftlab" style="left:'+pt(432.04)+'">Then</div>'+presetBox(S.ft[0],'grey',false,163.62)+presetBox(S.ft[1],'green',true,432.04);
  return pgOpen('bd','front')+'<div class="panel" style="bottom:'+pt(d.band)+'">'+inner+(S.meta.layout==='rules'?'':qrBox())+'</div>'+stripHtml()+pgClose;}
function parkRows(n){const per=n<=3?n:n<=4?2:n<=6?3:n<=8?4:5;const rows=Math.ceil(n/per);const out=[];let left=n;for(let r=0;r<rows;r++){const k=Math.min(per,Math.ceil(left/(rows-r)));out.push(k);left-=k;}return out;}
function pageTokens(){const n=nTok(),rows=parkRows(n);const sz=112.53;
  const xs=k=>{if(k===1)return[(PANW-sz)/2];const pitch=k<=3?226.1:(PANW-16-sz)/(k-1);const w=(k-1)*pitch+sz;return Array.from({length:k},(_,i)=>(PANW-w)/2+i*pitch);};
  let boxes='',j=0;rows.forEach((k,r)=>{const anchor=rows.length===1?'top:'+pt(147.5):r===0?'top:'+pt(107.22):'bottom:'+pt(38.12);xs(k).forEach(x=>{j++;boxes+='<div class="ybx'+(termOn()&&j===n?' last':'')+'" style="left:'+pt(x)+';'+anchor+'"><span class="dot"></span></div>';});});
  const corner=S.tok[0].k==='tk:star'||has(S.tok[0])?tokCard(55*scl()/72):'';
  return pgOpen('tk','front')+'<div class="panel"><div class="tkcorner l">'+corner+'</div><div class="tkcorner r">'+corner+'</div><div class="ttl tk" data-frac=".8"><span class="ul">Tokens!!!</span></div>'+boxes+'<div class="foot">See Instructions On The Back</div>'+(rows[rows.length-1]>=3?qrBox().replace('class="qr"','class="qr up"'):qrBox())+'</div>'+pgClose;}
const BACKT={ch:['cb','Choice Board'],tg:['tt','Teaching Targets'],bd:['tb','Token Board'],tk:['te','Token Economy']};
function inline(s){s=esc(s);return s.replace(/\*\*\*(.+?)\*\*\*/g,'<b><i>$1</i></b>').replace(/__(.+?)__/g,'<u>$1</u>').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\*(.+?)\*/g,'<i>$1</i>');}
function fill(t){const n=nTok(),tn=tokName();return String(t||'').replace(/\{last\}/g,termOn()?' The last {token} looks different from the others, so your learner can see that it finishes the board and the THEN item comes next.':'').replace(/\{n\}th/g,WORDS[n]==='one'?'first':WORDS[n]==='two'?'second':WORDS[n]==='three'?'third':WORDS[n]==='five'?'fifth':WORDS[n]==='eight'?'eighth':WORDS[n]==='nine'?'ninth':WORDS[n]+'th').replace(/\{n\}/g,WORDS[n]).replace(/\{TOKENS\}/g,plural(tn).toUpperCase()).replace(/\{tokens\}/g,plural(tn)).replace(/\{token\}/g,tn.toLowerCase());}
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
function sheetOpen(kind){return turned()?'<div class="pg port front tsheet'+(scl()!==1?' big':'')+'" data-kind="'+kind+'" style="--s:'+scl().toFixed(4)+'">':'<div class="pg front'+(scl()!==1?' big':'')+'" data-kind="'+kind+'" style="--s:'+scl().toFixed(4)+'">';}
function sheetDims(){return turned()?[TW,TH,TW-.2,TH-.2]:[11,8.5,10.4,7.9];}
function sheetCards(kind){const list=S[kind].filter(o=>has(o)||o.l);const ul=kind==='ch';const sz=cardIn();const cards=list.map(o=>cardHtml(o,sz,{ul})).concat([cardHtml(null,sz,{ul,other:true})]);const [pw,ph,aw]=sheetDims();const cols=Math.max(1,Math.floor((aw+.12)/(sz+.12)));
  /* (v21.42i) the cards keep the size of the boxes, so the larger pages' cards can need a second portrait sheet on the iPad */
  const per=cols*Math.max(1,Math.floor((ph-.5+.12)/(sz+.12))),out=[];for(let i=0;i<cards.length;i+=per){const c=cards.slice(i,i+per);out.push(sheetOpen('cards-'+kind)+sheetGrid(cols,Math.ceil(c.length/cols),sz,sz,.12,pw,ph,c.join(''),'top')+'</div>');}
  return out;}
function sheetTokens(){const d=strip(),sz=tokIn(),[pw,ph,aw]=sheetDims(),cols=Math.min(5,Math.max(1,Math.floor((aw+.15)/(sz+.15))));return sheetOpen('cards-tk')+sheetGrid(cols,Math.ceil(d.n/cols),sz,sz,.15,pw,ph,Array.from({length:d.n},(_,i)=>tokCard(sz,i===d.n-1)).join(''),'top')+'</div>';}
function spareCard(){const v=S.meta.sp_card||'ch:0';if(v==='tok')return{tok:true};if(v==='own')return{o:{k:S.sp[0].k,ph:S.sp[0].ph,l:S.meta.sp_label||''}};const m=/^(ch|tg):(\d)$/.exec(v);return{o:m?S[m[1]][+m[2]]:S.ch[0]};}
function sheetSpare(){const big=S.meta.sp_size!=='small',T=turned(),sz=big?1.5:1.25,gap=.06,cols=T?Math.floor((TW-.2+gap)/(sz+gap)):big?5:6,rows=Math.floor(((T?TH-.2:10.4)+gap)/(sz+gap)),c=spareCard();
  /* an empty card (an empty slot, or a card made on the spot with no label and no picture) prints write-in lines, not a blank box */
  const empty=!c.tok&&(!c.o||(!has(c.o)&&!String(lbl(c.o)||'').trim()));
  const one=c.tok?tokCard(sz):cardHtml(c.o,sz,{ul:true,cls:'sp',blank:empty});
  return '<div class="pg port front'+(T?' tsheet':'')+'" data-kind="spare" style="--s:1">'+sheetGrid(cols,rows,sz,sz,gap,T?TW:8.5,T?TH:11,Array.from({length:cols*rows},()=>one).join(''),'spare')+'</div>';}
function pageFront(kind){return kind==='ch'||kind==='tg'?pageGrid(kind):kind==='bd'?pageBoard():pageTokens();}
const PGNAME={ch:'Choices',tg:'Targets',bd:'Board',tk:'Tokens'};
function bookPages(){const c=S.chk,order=S.meta.order||'all';const kinds=TABS.map(t=>t[0]).filter(k=>c['pg_'+k]);const pages=[];
  const fronts=()=>kinds.forEach(k=>pages.push({label:PGNAME[k]+' (front)',html:pageFront(k)}));
  const duplex=()=>kinds.forEach(k=>{pages.push({label:PGNAME[k]+' (front)',html:pageFront(k)});pages.push({label:PGNAME[k]+' (back: '+BACKT[k][1]+')',html:pageBack(k)});});
  const howto=()=>{if(c.pg_how){const h=pagesHowto().split('</div></div></div>');pages.push({label:'How to use, Steps 1 and 2',html:h[0]+'</div></div></div>'});pages.push({label:'How to use, Step 3',html:h[1]+'</div></div></div>'});}};
  const cards=()=>{const add=(k,name)=>{const h=sheetCards(k);h.forEach((x,i)=>pages.push({label:'Card sheet: '+name+(h.length>1?' ('+(i+1)+' of '+h.length+')':''),html:x}));};if(c.cs_ch)add('ch','the choices');if(c.cs_tg)add('tg','the targets');if(c.cs_tk)pages.push({label:'Card sheet: the tokens',html:sheetTokens()});};
  if(order==='fronts')fronts();else if(order==='duplex'){duplex();howto();}else if(order==='cards')cards();else if(order==='spare')pages.push({label:'A sheet of one card (portrait)',html:sheetSpare()});else{duplex();howto();cards();}
  return pages;}
/* a back whose text does not fit at the floor size continues on a second back page; in a duplex order a blank sheet keeps
   every back on the reverse of its front */
function paginate(root,dup){let guard=0;
  for(let pg=root.querySelector('.pg.back');pg&&guard++<40;pg=pg.nextElementSibling){
    if(!pg.classList.contains('back'))continue;const body=pg.querySelector('.bbody');if(!body)continue;
    const cr=pg.querySelector('.credit');const room=()=>{if(cr)body.style.paddingBottom=(cr.offsetHeight+(pg.classList.contains('compact')?14:34)*scl()*96/72)+'px';};room();
    fitOne(body);if(!tooFull(body))continue;
    /* the credit line gives way first: one small line at the foot, and the text gets the room back */
    if(pg.querySelector('.credit')&&!pg.classList.contains('compact')){pg.classList.add('compact');{let f=10.5;const one=13*scl()*96/72*1.4;while(cr.offsetHeight>one&&f>8){f-=.25;cr.style.fontSize=(f*scl())+'pt';}}room();fitOne(body);if(!tooFull(body))continue;}
    body.dataset.fixed=body.style.fontSize||getComputedStyle(body).fontSize;
    const kids=[...body.children].filter(e=>!e.classList.contains('cont'));const moved=[];
    while(tooFull(body)&&kids.length>1){const k=kids.pop();moved.unshift(k);k.remove();}
    if(!moved.length)continue;
    const tmp=document.createElement('div');tmp.innerHTML=(dup?'<div class="pg front blank" data-kind="blank" data-label="blank sheet (keeps the next back on the reverse of its front)"></div>':'')+pageBack(pg.dataset.kind,moved.map(e=>e.outerHTML).join(''));
    const nodes=[...tmp.children];nodes[nodes.length-1].dataset.label=pg.dataset.label+', continued';let after=pg;nodes.forEach(n=>{after.insertAdjacentElement('afterend',n);after=n;});}
}
/* each landscape page in its own portrait frame: the page box (with its trim marks) turned a quarter, fronts clockwise and backs the other
   way so that a long-edge flip puts each back the right way up behind its front; scaled down only if it would not fit the printable area */
/* the paper the form asks for: landscape with no margin (the stylesheet), or, turned, portrait with Safari's own half-inch margins, so the
   print layout is no wider than the paper Safari uses and nothing is shrunk to fit */
function pageRule(){let st=document.getElementById('tkPageRule');if(!st){st=document.createElement('style');st.id='tkPageRule';}document.body.appendChild(st);st.textContent=turned()?'@page{size:letter portrait;margin:.5in}':'';}
function turnPages(){pageRule();const b=$('#book');if(!b)return;b.classList.toggle('turned',turned());if(!turned())return;
  [...b.querySelectorAll(':scope > .pg:not(.port)')].forEach(pg=>{const cv=pg.querySelector('.cv'),m=pg.querySelector('.trim')?.3:0;
    let w=cv?cv.offsetWidth/96:8.82,h=cv?cv.offsetHeight/96:5.82;if(!cv&&!pg.classList.contains('blank')){w=11;h=8.5;}
    /* the page box shrinks to the book page and its trim marks, so nothing is wider than the frame it is turned in */
    if(cv||pg.classList.contains('blank')){const cx=cv?parseFloat(cv.style.left)||0:0,cy=cv?parseFloat(cv.style.top)||0:0;pg.style.width=(w+2*m)+'in';pg.style.height=(h+2*m)+'in';
      if(cv){cv.style.left=m+'in';cv.style.top=m+'in';}pg.querySelectorAll('.trim').forEach(t=>{t.style.left=(parseFloat(t.style.left)-cx+m)+'in';t.style.top=(parseFloat(t.style.top)-cy+m)+'in';});}
    const W=h+2*m,H=w+2*m,k=Math.min(1,TW/W,TH/H);const wr=document.createElement('div');wr.className='pgw';wr.style.width=(W*k).toFixed(3)+'in';wr.style.height=(H*k).toFixed(3)+'in';
    pg.style.transform='translate(-50%,-50%) rotate('+(pg.classList.contains('back')?-90:90)+'deg)'+(k<1?' scale('+k.toFixed(4)+')':'');pg.parentNode.insertBefore(wr,pg);wr.appendChild(pg);});}
function relabel(root){root.querySelectorAll('.pglabel').forEach(e=>e.remove());const pgs=[...root.querySelectorAll('.pg')];
  pgs.forEach((p,i)=>{const l=document.createElement('p');l.className='pglabel';l.textContent='Sheet '+(i+1)+' of '+pgs.length+': '+(p.dataset.label||'');p.insertAdjacentElement('beforebegin',l);});return pgs.length;}
function renderOut(){
  const pages=bookPages(),order=S.meta.order||'all',mode=pageMode();
  $('#book').innerHTML=pages.map(p=>p.html.replace(/^<div class="pg /,'<div data-label="'+esc(p.label)+'" class="pg ')).join('');
  $('#chOut').innerHTML='<div class="book">'+pageGrid('ch')+'</div>';$('#tgOut').innerHTML='<div class="book">'+pageGrid('tg')+'</div>';$('#bdOut').innerHTML='<div class="book">'+pageBoard()+'</div>';
  $('#bkOut').innerHTML='<div class="book">'+TABS.map(t=>pageBack(t[0])).join('')+pagesHowto()+'</div>';
  const n=measured(()=>{fitAll();paginate($('#book'),/^(duplex|all)$/.test(order));paginate($('#bkOut'),false);const r=relabel($('#book'));turnPages();return r;});
  const size=mode==='fill'?'the full 8.5 in height':mode==='11'?'the 11 x 7.26 in page centred with trim marks':'the 8.82 x 5.82 in page centred with trim marks';
  $('#prevLine').textContent=n+' sheet'+(n===1?'':'s')+', '+(order==='fronts'?'the fronts only':order==='duplex'?'fronts and backs interleaved for a duplex printer (long-edge flip)':order==='cards'?'the card sheets only':order==='spare'?'one portrait sheet of a single card':'fronts and backs interleaved, then '+(S.chk.pg_how?'the how-to insert, then ':'')+'the card sheets')+'. Letter'+(order==='spare'?' portrait':turned()?' portrait, each book page turned on its side at full size ('+size.replace(/ centred with trim marks$/,'')+', with trim marks), for Safari on the iPad and iPhone, which prints portrait only':' landscape, '+size)+'; print at 100%. (Form build '+BUILD+'.)';
  const wr=$('#wholeRow');if(wr)wr.style.display=order==='all'?'none':'';
  const pv=(id,v)=>{const e=$(id);if(e)e.textContent=v;};pv('#phXv',(num(S.meta.ph_x)??50)+'%');pv('#phYv',(num(S.meta.ph_y)??35)+'%');pv('#phZv',(num(S.meta.ph_z)??100)+'%');
  const tr=$('#termPicRow');if(tr)tr.style.display=termMode()==='pic'?'':'none';const lk=$('#phLook');if(lk){const one=S.meta.layout==='rules';lk.innerHTML=one?photoHtml('r'):photoHtml('l')+photoHtml('r');}
  setTimeout(()=>{scaleBooks();const pl=$('#prevLine');if(pl&&!/Text check/.test(pl.textContent))pl.textContent+=' Text check '+textCheck().toFixed(2)+'.';},0);
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
function fitAll(){const tb=$('#book'),tu=tb&&tb.classList.contains('turned');const rot=tu?[...tb.querySelectorAll('.pgw>.pg')].map(p=>[p,p.style.transform]):[];
  if(tu){tb.classList.remove('turned');rot.forEach(([p])=>p.style.transform='');}try{fitAll0();}finally{if(tu){tb.classList.add('turned');rot.forEach(([p,t])=>p.style.transform=t);}}}
function fitAll0(){
  $$('.fit').forEach(fitOne);
  $$('.ttl[data-frac]').forEach(el=>{if(!el.clientWidth)return;el.style.fontSize='';const cs=getComputedStyle(el);const room=(el.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight))*(num(el.dataset.frac)||.8);let fs=parseFloat(cs.fontSize),g=0;/* the text's width in the title's own layout units: the range is measured on screen, so divide out any zoom in effect (the book's preview zoom, the polish layer's fit-to-window) */const w=()=>{const r=document.createRange();r.selectNodeContents(el);const k=el.getBoundingClientRect().width/(el.offsetWidth||1)||1;return r.getBoundingClientRect().width/k;};while(w()>room&&fs>16&&g++<80){fs-=1;el.style.fontSize=fs+'px';}});
  $$('.card .cl').forEach(el=>{if(!el.clientWidth)return;el.style.fontSize='';let fs=parseFloat(getComputedStyle(el).fontSize),g=0;while(el.scrollWidth>el.clientWidth+1&&fs>8&&g++<40){fs-=1;el.style.fontSize=fs+'px';}});
  /* a rules-row label: at most two lines, shrinking to 55 % of its size; the label is bottom-aligned, so its overflow goes upwards where
     scrollHeight cannot see it: the span inside is measured instead */
  $$('.rule .rl').forEach(el=>{if(!el.clientHeight)return;const sp=el.firstElementChild;if(!sp)return;el.style.fontSize='';const two=()=>sp.offsetHeight<=parseFloat(getComputedStyle(el).fontSize)*1.05*2+2;const wide=()=>sp.scrollWidth<=el.clientWidth+1;let fs=parseFloat(getComputedStyle(el).fontSize),g=0;const lo=fs*.55;while((!two()||!wide())&&fs>lo&&g++<40){fs-=.5;el.style.fontSize=fs+'px';}});
  /* token-slot captions shrink to their slot (a long caption, or a long token name in "Your First ...!") */
  $$('.slot .ca,.slot .cb').forEach(el=>{if(!el.clientWidth)return;el.style.fontSize='';const w=()=>{const r=document.createRange();r.selectNodeContents(el);const k=el.getBoundingClientRect().width/(el.offsetWidth||1)||1;return r.getBoundingClientRect().width/k;};let fs=parseFloat(getComputedStyle(el).fontSize),g=0;const lo=fs*.5;while(w()>el.clientWidth-6&&fs>lo&&g++<40){fs-=.25;el.style.fontSize=fs+'px';}});
}
window.addEventListener('beforeprint',fitAll);
/* the screen preview: each book drawn at its true size and shrunk to the width of its box by a transform (its layout box is pulled in by
   negative margins so nothing scrolls sideways); the page labels are drawn at a size that stays readable */
function scaleBooks(){$$('.out').forEach(out=>{const b=out.querySelector('.book');if(!b||!out.clientWidth)return;b.style.transform='';b.style.marginRight='';b.style.marginBottom='';
  const avail=out.clientWidth-28,w=b.scrollWidth,h=b.offsetHeight;if(!w)return;const k=Math.min(1,avail/w);b.style.transform='scale('+k+')';b.style.marginRight=(-(w*(1-k)))+'px';b.style.marginBottom=(-(h*(1-k)))+'px';
  b.querySelectorAll('.pglabel').forEach(l=>{l.style.fontSize=(12/k).toFixed(1)+'px';});});}
/* a check that text and boxes scale together: a 72 pt line box inside a page should be as tall as a 1 in box is wide */
function textCheck(){const pg=$('#book .pg');if(!pg)return 1;const d=document.createElement('div');d.style.cssText='position:absolute;left:0;top:0;width:1in;height:1px;visibility:hidden';const t=document.createElement('span');t.textContent='M';t.style.cssText='position:absolute;left:0;top:0;font:400 72pt/1 Georgia,serif;visibility:hidden';pg.appendChild(d);pg.appendChild(t);const r=t.getBoundingClientRect().height/(d.getBoundingClientRect().width||1);d.remove();t.remove();return r;}
let tSc=0;window.addEventListener('resize',()=>{clearTimeout(tSc);tSc=setTimeout(scaleBooks,150);});
/* after the sheet of one card has printed, the print order goes back to what it was, so the Preview shows the whole book again */
function restoreOrder(){if(S.meta.order==='spare'&&S.meta.prevOrder){S.meta.order=S.meta.prevOrder;delete S.meta.prevOrder;renderAll();}}
window.addEventListener('afterprint',()=>setTimeout(restoreOrder,300));

/* ---------------- events ---------------- */
let tOut=0;function renderOutSoon(){clearTimeout(tOut);tOut=setTimeout(renderOut,180);}
document.addEventListener('input',e=>{const el=e.target;
  if(el.id==='tkState'){restoreState(el.value);return;}
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined&&el.type!=='checkbox'){const a=S[el.dataset.r];if(!a||!a[+el.dataset.i])return;a[+el.dataset.i][el.dataset.f]=el.value;renderOutSoon();return;}
  if(el.dataset.b!==undefined){S.txt[el.dataset.b]=el.value;renderOutSoon();return;}
  if(el.dataset.m!==undefined){const k=el.dataset.m;if(k==='n')return;S.meta[k]=el.value;if(k==='wm')$('#wmPct').textContent=el.value;if(k==='tokname'){recaps(false);renderTbls();}renderOutSoon();}});
document.addEventListener('change',e=>{const el=e.target;if(el.id==='tkState')return;
  if(el.dataset.c!==undefined){S.chk[el.dataset.c]=!!el.checked;renderOut();return;}
  if(el.dataset.m!==undefined){const k=el.dataset.m;if(k==='n'){if(S.meta.n!==el.value){S.meta.n=el.value;ensure();recaps(true);renderAll();}return;}S.meta[k]=el.value;if(k==='sp_card'||k==='layout'||k==='avatar'||k==='term')renderTbls();renderOut();}});
$('#wholeBtn').addEventListener('click',()=>{S.meta.order='all';delete S.meta.prevOrder;renderAll();});
$('#phReset').addEventListener('click',()=>{S.meta.ph_x='50';S.meta.ph_y='35';S.meta.ph_z='100';renderAll();});
$('#capReset').addEventListener('click',()=>{recaps(true);renderAll();});
$('#colReset').addEventListener('click',()=>{Object.assign(S.meta,DEF);renderAll();});
$('#bkReset').addEventListener('click',async()=>{if(await nbhUI.confirm('Restore the default text of the four backs?\nYour edits to them are replaced.',{ok:'Restore',danger:true})){['tb','cb','te','tt'].forEach(k=>{S.txt[k]=TXT0[k];});renderAll();}});
$('#howReset').addEventListener('click',async()=>{if(await nbhUI.confirm('Restore the default how-to text?\nYour edits to the three steps are replaced.',{ok:'Restore',danger:true})){['h1','h2','h3'].forEach(k=>{S.txt[k]=TXT0[k];});renderAll();}});
$('#chClear').addEventListener('click',async()=>{if(await nbhUI.confirm('Empty the six choices?\nEvery picture and label is removed.',{ok:'Empty',danger:true})){S.ch=Array.from({length:6},()=>cello());renderAll();}});
$('#tgClear').addEventListener('click',async()=>{if(await nbhUI.confirm('Empty the six targets?\nEvery picture and label is removed.',{ok:'Empty',danger:true})){S.tg=Array.from({length:6},()=>cello());renderAll();}});
function spare(kind,sel){S.meta.sp_card=kind+':'+sel.value;if(S.meta.order!=='spare')S.meta.prevOrder=S.meta.order||'all';S.meta.order='spare';renderAll();setView('preview');setTimeout(()=>{fitAll();window.print();},80);}
$$('[data-six]').forEach(b=>b.addEventListener('click',()=>{openPick(S[b.dataset.six],0,()=>renderAll(),'',true);}));
/* the arrows on a row move its card (picture and label) up or down the six */
document.addEventListener('click',e=>{const b=e.target.closest('button[data-mv]');if(!b)return;const [k,i,d]=b.dataset.mv.split(':'),a=S[k],j=+i+(+d);if(!a||j<0||j>=a.length)return;[a[+i],a[j]]=[a[j],a[+i]];rowsTbl(k);renderOut();const nb=$('#'+k+'Tbl button[data-mv="'+k+':'+j+':'+d+'"]')||$('#'+k+'Tbl button[data-mv^="'+k+':'+j+':"]');if(nb)nb.focus();});
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
  const okImg=v=>/^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<900000;
  o.photos=Array.isArray(s.photos)?s.photos.slice(0,60).map(p=>({id:str(p&&p.id).slice(0,20),label:str(p&&p.label).slice(0,30),img:str(p&&p.img)})).filter(p=>p.id&&okImg(p.img)):[];
  const ids=new Set(o.photos.map(p=>p.id));const okK=k=>!!(P[k]||(k.startsWith('tk:')&&TOK[k.slice(3)])||(k.startsWith('av:')&&AV[k.slice(3)]));
  const arr=(k,n)=>Array.isArray(s[k])?s[k].slice(0,n).map(x=>{const r={k:str(x&&x.k),ph:str(x&&x.ph),l:str(x&&x.l).slice(0,60)};if(!okK(r.k))r.k='';if(!ids.has(r.ph))r.ph='';return r;}):null;
  const ch=arr('ch',6);if(ch)o.ch=ch;const tg=arr('tg',6);if(tg)o.tg=tg;const ft=arr('ft',2);if(ft&&ft.length===2)o.ft=ft;const tok=arr('tok',1);if(tok&&tok.length)o.tok=tok;const tl=arr('tokL',1);if(tl&&tl.length)o.tokL=tl;const ph=arr('photo',1);if(ph&&ph.length)o.photo=ph;const bg=arr('bg',2);if(bg&&bg.length===2)o.bg=bg;const sp=arr('sp',1);if(sp&&sp.length)o.sp=sp;
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

/* ===== walk-hands.js ===== */
/* TK-1 walkthrough: hand drawings for the narrated walkthrough (static SVG, generated by a small node script
   that models each finger as a tapered limb; the script is kept outside the repo, so small fixes can be made here).
   WALK_HANDS.<learner|teacher>.<point|pinch|open> = {svg, w, h, tip|grip|palm:[x,y], wrist:[x,y]}
   A top-down view of a right hand reaching onto the table from below; the arm runs off the bottom of the viewBox.
   learner = a child's hand (smaller, rounder fingers, light warm skin, bare forearm, a short T-shirt sleeve far down);
   teacher = an adult hand (longer fingers, medium-deep skin, a long muted-blue shirt sleeve with a buttoned cuff).
   1 viewBox unit = 1 stage px on the 1280x720 stage at the intended size: wrist to fingertip is about 140 (learner) and
   186 (teacher) units; the rest of h is forearm and sleeve. tip / grip / palm = the point that touches the card (the
   index fingertip; where the thumb and index tips meet; the palm centre): translate and rotate the drawing about it.
   wrist = the middle of the wrist crease. <g class="wh-shadow"> is the soft table shadow, cast to the lower right and
   meeting the hand at the touch point (point, pinch); hide it with .wh-shadow{display:none} if the stage draws its own.
   Mirror with scaleX(-1) for a left hand. No ids, no external references. */
const WALK_HANDS={
  learner:{
    point:{w:111,h:544,tip:[25.8,9],wrist:[50.3,123.9],
      svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 111 544" width="111" height="544"><g class="wh-shadow" fill="#3a2410" stroke="#3a2410" stroke-linejoin="round"><path d="M35.1 116.2c-8.4 2.8-1 12.6-1.1 16.8c-.1 4.2.7 1.8.4 8.4c-.2 6.5-.9 14-1.8 30.8c-.9 16.8-2.5 42-3.6 70c-1.2 28-2.4 63-3.1 98c-.8 35-12.9 93.3-1.4 112c11.5 18.6 59 18.6 70.5 0c11.6-18.7-.6-77-1.4-112c-.7-35-1.9-70-3-98c-1.2-28-2.8-53.2-3.7-70c-.9-16.8-1.6-24.3-1.8-30.8c-.2-6.6.5-4.2.4-8.4c-.1-4.2 7.3-14-1.1-16.8c-8.4-2.8-40.9-2.8-49.3 0zM15 410.2c4.6-29.3 14.9-6.2 22.4-7.7c7.4-1.5 14.9-1.4 22.4-1.4c7.4 0 14.9-.1 22.4 1.4c7.4 1.5 17.7-21.6 22.4 7.7c4.6 29.3 21.4 140 5.6 168c-15.9 28-85 28-100.8 0c-15.9-28 .9-138.7 5.6-168zM34.6 138.4c-4.5-3.4-1.1-11.2-2.2-17.6c-1.1-6.4-2.6-14-4.1-20.6c-1.6-6.6-4.2-12.8-5.2-19.1c-1-6.2-1.7-14.2-.7-18.4c1.1-4.1 3-4.8 6.9-6.6c3.9-1.8 11.1-3.9 16.5-4c5.4 0 10.8 1.6 16 3.6c5.1 2 10.8 5.7 14.9 8.5c4 2.8 7.3 3.8 9.1 8.1c1.8 4.3 1.3 11.3 1.5 17.6c.2 6.4.1 14.2-.3 20.6c-.5 6.4-1.9 13-2.3 17.6c-.4 4.7 3.9 8.1-.2 10.3c-4.2 2.2-16.4 3-24.7 3c-8.3 0-20.6.5-25.2-3zM69 70.9c-1-1.5.1-1.5.2-2.7c.2-1.1.4-2.3.6-4.1c.2-1.7.3-4.4.9-6.4c.6-2 1-4.4 2.5-5.5c1.6-1.1 4.7-1.6 6.8-1c2.1.6 4.7 2.6 5.7 4.4c1.1 1.8.6 4.3.4 6.4c-.2 2.1-1.1 4.5-1.5 6.2c-.3 1.7-.6 2.9-.9 4c-.2 1.1.8 1.8-.7 2.6c-1.4.8-5.5 3-7.8 2.4c-2.3-.7-5.2-4.8-6.2-6.3zM53.7 63.9c-1.3-1.5-.1-1.3-.1-2.5c.1-1.2.1-2.6.2-4.9c.1-2.3 0-6.2.4-8.9c.5-2.6.6-5.5 2.2-7c1.6-1.5 5-2.3 7.4-1.9c2.3.4 5.5 2.3 6.8 4.2c1.3 2 1.1 4.9 1.1 7.6c0 2.7-.8 6.5-1 8.7c-.3 2.3-.4 3.7-.6 4.9c-.2 1.2 1 1.4-.4 2.4c-1.5 1-5.8 4.1-8.4 3.6c-2.7-.4-6.3-4.8-7.6-6.2zM37.8 61.4c-1.4-1.4-.2-1.1-.2-2.4c-.1-1.2-.2-2.7-.3-5.2c-.1-2.6-.6-7-.3-9.9c.2-3 .1-6.1 1.6-7.8c1.6-1.7 5-2.9 7.5-2.7c2.4.2 5.9 1.8 7.4 3.8c1.5 2 1.5 5 1.8 8c.2 3-.3 7.3-.3 9.8c-.1 2.6-.1 4-.2 5.3c-.1 1.2 1.2 1.1-.3 2.3c-1.4 1.1-5.5 4.8-8.3 4.6c-2.8-.2-6.9-4.5-8.4-5.8zM29.7 126.2c-2.3-3.5-7.3-11.9-10.5-18.1c-3.1-6.3-6.7-13.4-8.5-19.2c-1.7-5.8-1.6-11-1.7-15.4c-.1-4.4.6-8.5 1.1-11c.6-2.5.9-2.3 2.4-3.9c1.5-1.6 4.1-5.3 6.5-5.9c2.5-.6 6.4.6 8.3 2.4c1.9 1.9 2.9 6.3 3.2 8.8c.2 2.6-1.7 5.3-1.9 6.5c-.3 1.2.2-1 .5.7c.3 1.8.2 6.2 1.1 9.6c.9 3.4 1.6 6.2 4.3 10.6c2.7 4.3 9.4 10.4 11.8 15.5c2.5 5 4.8 11.3 2.6 15c-2.1 3.6-12.4 6.1-15.6 6.8c-3.2.8-1.3 1-3.6-2.4zM23.4 65.9c-.7-1 0-.2-.1-1.7c-.2-1.5-.4-3.4-.7-7.3c-.3-3.9-.8-11.5-1.2-16.3c-.5-4.8-.9-9-1.3-12.6c-.4-3.6-.9-6.8-1.2-9c-.2-2.2-.1-2.7-.2-4.2c0-1.4-.7-2.8 0-4.6c.7-1.7 2.3-4.9 4.2-5.7c1.8-.8 5.1-.4 6.9.9c1.8 1.3 3.1 5.1 3.9 6.8c.7 1.6.3 1.4.6 2.9c.2 1.4.4 3.1.7 5.8c.3 2.7.5 6.3.9 10.4c.4 4.1 1 9.6 1.6 14.5c.5 4.8 1.3 11.4 1.6 14.5c.4 3.1.5 2.7.4 4c0 1.3 1.2 2.8-.7 3.7c-1.9 1-8.3 2.6-10.9 2.2c-2.6-.3-3.7-3.3-4.5-4.3z" opacity=".07" stroke-width="9"/><path d="M35.1 116.2c-8.4 2.8-1 12.6-1.1 16.8c-.1 4.2.7 1.8.4 8.4c-.2 6.5-.9 14-1.8 30.8c-.9 16.8-2.5 42-3.6 70c-1.2 28-2.4 63-3.1 98c-.8 35-12.9 93.3-1.4 112c11.5 18.6 59 18.6 70.5 0c11.6-18.7-.6-77-1.4-112c-.7-35-1.9-70-3-98c-1.2-28-2.8-53.2-3.7-70c-.9-16.8-1.6-24.3-1.8-30.8c-.2-6.6.5-4.2.4-8.4c-.1-4.2 7.3-14-1.1-16.8c-8.4-2.8-40.9-2.8-49.3 0zM15 410.2c4.6-29.3 14.9-6.2 22.4-7.7c7.4-1.5 14.9-1.4 22.4-1.4c7.4 0 14.9-.1 22.4 1.4c7.4 1.5 17.7-21.6 22.4 7.7c4.6 29.3 21.4 140 5.6 168c-15.9 28-85 28-100.8 0c-15.9-28 .9-138.7 5.6-168zM34.6 138.4c-4.5-3.4-1.1-11.2-2.2-17.6c-1.1-6.4-2.6-14-4.1-20.6c-1.6-6.6-4.2-12.8-5.2-19.1c-1-6.2-1.7-14.2-.7-18.4c1.1-4.1 3-4.8 6.9-6.6c3.9-1.8 11.1-3.9 16.5-4c5.4 0 10.8 1.6 16 3.6c5.1 2 10.8 5.7 14.9 8.5c4 2.8 7.3 3.8 9.1 8.1c1.8 4.3 1.3 11.3 1.5 17.6c.2 6.4.1 14.2-.3 20.6c-.5 6.4-1.9 13-2.3 17.6c-.4 4.7 3.9 8.1-.2 10.3c-4.2 2.2-16.4 3-24.7 3c-8.3 0-20.6.5-25.2-3zM69 70.9c-1-1.5.1-1.5.2-2.7c.2-1.1.4-2.3.6-4.1c.2-1.7.3-4.4.9-6.4c.6-2 1-4.4 2.5-5.5c1.6-1.1 4.7-1.6 6.8-1c2.1.6 4.7 2.6 5.7 4.4c1.1 1.8.6 4.3.4 6.4c-.2 2.1-1.1 4.5-1.5 6.2c-.3 1.7-.6 2.9-.9 4c-.2 1.1.8 1.8-.7 2.6c-1.4.8-5.5 3-7.8 2.4c-2.3-.7-5.2-4.8-6.2-6.3zM53.7 63.9c-1.3-1.5-.1-1.3-.1-2.5c.1-1.2.1-2.6.2-4.9c.1-2.3 0-6.2.4-8.9c.5-2.6.6-5.5 2.2-7c1.6-1.5 5-2.3 7.4-1.9c2.3.4 5.5 2.3 6.8 4.2c1.3 2 1.1 4.9 1.1 7.6c0 2.7-.8 6.5-1 8.7c-.3 2.3-.4 3.7-.6 4.9c-.2 1.2 1 1.4-.4 2.4c-1.5 1-5.8 4.1-8.4 3.6c-2.7-.4-6.3-4.8-7.6-6.2zM37.8 61.4c-1.4-1.4-.2-1.1-.2-2.4c-.1-1.2-.2-2.7-.3-5.2c-.1-2.6-.6-7-.3-9.9c.2-3 .1-6.1 1.6-7.8c1.6-1.7 5-2.9 7.5-2.7c2.4.2 5.9 1.8 7.4 3.8c1.5 2 1.5 5 1.8 8c.2 3-.3 7.3-.3 9.8c-.1 2.6-.1 4-.2 5.3c-.1 1.2 1.2 1.1-.3 2.3c-1.4 1.1-5.5 4.8-8.3 4.6c-2.8-.2-6.9-4.5-8.4-5.8zM29.7 126.2c-2.3-3.5-7.3-11.9-10.5-18.1c-3.1-6.3-6.7-13.4-8.5-19.2c-1.7-5.8-1.6-11-1.7-15.4c-.1-4.4.6-8.5 1.1-11c.6-2.5.9-2.3 2.4-3.9c1.5-1.6 4.1-5.3 6.5-5.9c2.5-.6 6.4.6 8.3 2.4c1.9 1.9 2.9 6.3 3.2 8.8c.2 2.6-1.7 5.3-1.9 6.5c-.3 1.2.2-1 .5.7c.3 1.8.2 6.2 1.1 9.6c.9 3.4 1.6 6.2 4.3 10.6c2.7 4.3 9.4 10.4 11.8 15.5c2.5 5 4.8 11.3 2.6 15c-2.1 3.6-12.4 6.1-15.6 6.8c-3.2.8-1.3 1-3.6-2.4zM23.4 65.9c-.7-1 0-.2-.1-1.7c-.2-1.5-.4-3.4-.7-7.3c-.3-3.9-.8-11.5-1.2-16.3c-.5-4.8-.9-9-1.3-12.6c-.4-3.6-.9-6.8-1.2-9c-.2-2.2-.1-2.7-.2-4.2c0-1.4-.7-2.8 0-4.6c.7-1.7 2.3-4.9 4.2-5.7c1.8-.8 5.1-.4 6.9.9c1.8 1.3 3.1 5.1 3.9 6.8c.7 1.6.3 1.4.6 2.9c.2 1.4.4 3.1.7 5.8c.3 2.7.5 6.3.9 10.4c.4 4.1 1 9.6 1.6 14.5c.5 4.8 1.3 11.4 1.6 14.5c.4 3.1.5 2.7.4 4c0 1.3 1.2 2.8-.7 3.7c-1.9 1-8.3 2.6-10.9 2.2c-2.6-.3-3.7-3.3-4.5-4.3z" opacity=".11" stroke-width="3"/></g><g class="wh-hand" stroke-linejoin="round"><path d="M25.7 109.9c-8.4 2.8-1 12.6-1.2 16.8c-.1 4.2.7 1.8.5 8.4c-.3 6.5-.9 14-1.9 30.8c-.9 16.8-2.5 42-3.6 70c-1.1 28-2.3 63-3.1 98c-.7 35-12.9 93.3-1.4 112c11.6 18.6 59.1 18.6 70.6 0c11.5-18.7-.7-77-1.4-112c-.8-35-2-70-3.1-98c-1.1-28-2.7-53.2-3.6-70c-.9-16.8-1.6-24.3-1.9-30.8c-.2-6.6.6-4.2.5-8.4c-.2-4.2 7.2-14-1.2-16.8c-8.4-2.8-40.8-2.8-49.2 0zM25.4 132.3c-4.3-3.3-.4-10.8-1-16.8c-.6-6.1-1.6-13.3-2.7-19.6c-1-6.3-3.2-12.3-3.8-18.2c-.5-6-.7-13.6.7-17.5c1.3-4 3.3-4.7 7.3-6.3c4.1-1.7 11.4-3.7 16.8-3.8c5.5-.1 10.7 1.4 15.7 3.3c5 2 10.5 5.5 14.3 8.2c3.8 2.6 7.1 3.6 8.6 7.7c1.5 4.1.5 10.7.3 16.8c-.3 6-1 13.5-1.9 19.6c-.9 6-2.7 12.3-3.5 16.8c-.7 4.4 3.3 7.7-1 9.8c-4.3 2.1-16.6 2.8-24.9 2.8c-8.3 0-20.6.4-24.9-2.8zM64.5 68c0-.6.2-.6.2-.9c.1-.3.1-.6.2-.8c0-.3 0-.6.1-.9c0-.3.1-.6.2-1c0-.4.1-.8.3-1.3c.1-.5.2-1 .4-1.6c.1-.6.2-1.2.4-1.9c.1-.7.3-1.4.4-2.1c.2-.7.3-1.4.5-2.1c.2-.7.3-1.4.5-2c.2-.6.5-1.3.9-1.8c.4-.6.9-1.1 1.5-1.5c.6-.4 1.3-.7 2.1-.9c.7-.2 1.5-.3 2.3-.3c.8 0 1.7.1 2.5.3c.7.2 1.5.5 2.2.9c.7.4 1.4.9 1.9 1.5c.5.5 1 1.2 1.3 1.8c.3.7.5 1.4.6 2c.1.7 0 1.4-.1 2.1c-.1.6-.4 1.3-.6 2c-.2.6-.4 1.3-.6 2c-.3.7-.5 1.4-.7 2c-.2.7-.4 1.3-.6 1.9c-.2.6-.3 1.1-.5 1.6c-.1.5-.2.9-.3 1.3c-.1.3-.3.6-.4.9c-.1.3-.2.6-.3.8c-.1.3-.2.5-.3.8c-.1.3 0 .4-.3.8c-.3.5-.7 1.4-1.4 1.9c-.8.4-1.9.7-3 .8c-1.1.1-2.4-.1-3.6-.4c-1.1-.3-2.4-.8-3.3-1.4c-.9-.7-1.7-1.5-2.1-2.2c-.4-.8-.3-1.8-.4-2.3zM49.8 61.2c-.1-.5.1-.5.1-.8c0-.3 0-.5 0-.7c0-.3 0-.5 0-.8c0-.3 0-.6.1-1c0-.5.1-1 .2-1.6c0-.6.1-1.3.2-2.1c.1-.8.2-1.7.4-2.6c.1-.9.2-1.9.3-2.9c.1-.9.2-1.9.4-2.9c.1-1 .2-2 .4-2.8c.2-.8.3-1.5.7-2.1c.4-.7 1-1.3 1.6-1.8c.6-.5 1.4-1 2.1-1.3c.8-.3 1.7-.5 2.6-.6c.9-.1 1.9-.1 2.8.1c.8.1 1.8.4 2.6.7c.8.4 1.6.9 2.2 1.4c.7.6 1.3 1.2 1.7 1.9c.4.7.8 1.4.9 2.2c.2.7.2 1.4.1 2.2c-.1.9-.3 1.9-.5 2.8c-.2 1-.4 2-.5 2.9c-.2 1-.4 2-.6 2.9c-.2.9-.4 1.8-.5 2.6c-.2.7-.3 1.5-.4 2.1c-.1.6-.2 1-.3 1.5c-.1.4-.2.7-.2 1c-.1.3-.2.5-.3.7c-.1.3-.1.5-.2.7c0 .3.1.3-.2.8c-.2.5-.6 1.7-1.4 2.2c-.8.6-1.9 1.1-3.1 1.3c-1.2.2-2.8.2-4.1 0c-1.3-.2-2.8-.7-3.8-1.2c-1.1-.6-2.1-1.4-2.6-2.2c-.6-.8-.6-2-.7-2.6zM34.1 58.9c-.2-.6 0-.6 0-.8c0-.3 0-.5 0-.7c-.1-.2-.1-.5-.1-.8c0-.3-.1-.6 0-1c0-.5 0-1 0-1.6c.1-.7.1-1.5.1-2.4c.1-.8.1-1.9.1-2.9c.1-1 .1-2.1.1-3.2c.1-1.1.1-2.2.2-3.3c0-1.1 0-2.2.1-3.1c.2-.9.3-1.6.7-2.3c.3-.7.8-1.4 1.4-2c.6-.6 1.3-1.1 2.1-1.5c.8-.4 1.7-.7 2.7-.9c.9-.2 1.9-.2 2.8-.2c.9.1 1.9.3 2.8.6c.9.3 1.8.7 2.5 1.2c.7.5 1.4 1.2 1.9 1.8c.5.7.9 1.5 1.1 2.2c.3.8.3 1.5.3 2.4c0 .9-.1 2-.2 3.1c-.1 1.1-.3 2.2-.4 3.3c-.1 1.1-.2 2.2-.3 3.2c-.1 1-.2 2-.3 2.9c-.1.8-.2 1.6-.2 2.3c-.1.6-.1 1.1-.2 1.6c0 .4-.1.7-.2 1c0 .3-.1.5-.1.8c-.1.2-.1.4-.2.6c0 .3.1.3-.1.8c-.2.6-.5 1.8-1.3 2.5c-.7.6-1.9 1.2-3.1 1.6c-1.3.3-2.9.4-4.2.3c-1.4-.1-3-.4-4.2-.9c-1.1-.5-2.2-1.3-2.9-2.1c-.6-.7-.8-2-.9-2.5zM21.3 120.6c-1.1-1.3-2-3.6-3-5.5c-1-1.8-2.1-3.8-3.1-5.7c-1-2-2.1-4-3-6.1c-1-2-2-4-2.9-6.1c-.9-2-1.8-4-2.6-6.1c-.7-2-1.3-4.1-1.7-6c-.4-2-.6-3.9-.7-5.7c-.1-1.7-.1-3.4-.1-4.9c0-1.5.1-2.9.2-4.1c0-1.3.1-2.3.2-3.5c.1-1.1.1-2.3.4-3.5c.3-1.1.9-2.5 1.3-3.4c.5-1 1.1-1.8 1.5-2.3c.4-.5.5-.5.7-.7c.2-.3.1-.2.5-.8c.3-.5 1-1.8 1.7-2.5c.7-.8 1.5-1.5 2.4-2c.9-.5 1.8-.9 2.8-1.1c.9-.2 2-.2 2.9-.1c1 .1 2 .3 2.8.8c.9.4 1.7 1 2.4 1.6c.7.7 1.2 1.6 1.7 2.4c.4.9.7 1.9.9 2.9c.1 1 .1 2.1-.1 3.1c-.1 1-.6 2.2-.9 3c-.3.8-.5 1.2-.8 1.7c-.2.6-.6 1.2-.6 1.5c-.1.2.1.1.2 0c.1 0 .2-.5.3-.4c0 .2 0 .5 0 1.1c0 .6-.1 1.7 0 2.6c0 1 0 2.2 0 3.2c.1 1.1.2 2.2.4 3.3c.1 1.1.3 2.1.6 3.2c.3 1 .5 2 1 3.1c.4 1.2 1.1 2.4 1.9 3.8c.8 1.3 1.9 2.8 3.1 4.4c1.1 1.6 2.4 3.2 3.7 5c1.3 1.7 2.7 3.5 4 5.3c1.2 1.8 2.8 3.9 3.5 5.4c.7 1.6.8 2.7.5 4.2c-.3 1.4-1.3 3.2-2.5 4.7c-1.2 1.5-3.1 3-4.9 4.1c-1.8 1.1-4 2-5.9 2.4c-1.9.4-3.9.4-5.4 0c-1.4-.3-2.3-1-3.4-2.3zM19.4 63.2c-.2-.5-.1-.5-.1-.7c0-.2 0-.2 0-.4c0-.1 0-.2 0-.5c0-.3 0-.6 0-1.1c0-.6-.1-1.2-.1-2.2c0-1 0-2.3 0-3.7c0-1.4 0-3.1 0-4.8c0-1.7-.1-3.6-.1-5.4c0-1.8 0-3.6 0-5.3c0-1.6 0-3.1-.1-4.5c0-1.4-.1-2.6-.1-3.9c-.1-1.2-.1-2.4-.2-3.6c-.1-1.1-.1-2.2-.2-3.3c0-1-.1-2-.2-2.9c0-.8 0-1.7-.1-2.4c0-.7 0-1.3 0-1.8c0-.5 0-.9 0-1.2c.1-.4.1-.6.1-.9c0-.3.1-.6.1-.9c0-.3-.1-.4 0-1c0-.6 0-1.7.2-2.5c.2-.8.6-1.7 1-2.4c.4-.7 1-1.3 1.6-1.8c.6-.6 1.3-1 2-1.3c.7-.3 1.6-.5 2.3-.5c.8 0 1.6.1 2.4.3c.7.2 1.5.6 2.1 1.1c.7.4 1.3 1 1.8 1.7c.5.6.9 1.4 1.2 2.2c.3.8.4 1.9.5 2.5c.1.6 0 .7 0 1c.1.3.1.5.2.8c0 .3.1.6.1 1c.1.3.1.7.2 1.3c0 .5.1 1.1.1 1.8c0 .7 0 1.6.1 2.5c0 .9 0 1.8 0 2.9c0 1 0 2.1.1 3.3c0 1.1 0 2.4 0 3.6c.1 1.3.1 2.5.1 3.9c.1 1.4.1 3 .2 4.6c.1 1.7.2 3.5.2 5.3c.1 1.8.2 3.7.3 5.4c.1 1.7.2 3.4.2 4.8c.1 1.4.1 2.7.2 3.7c0 .9 0 1.6 0 2.1c0 .6 0 .9.1 1.2c0 .2 0 .3 0 .5c0 .1 0 .2 0 .4c0 .2.2.1 0 .7c-.2.5-.4 1.7-1 2.4c-.7.7-1.8 1.4-3 1.9c-1.1.4-2.6.7-4 .7c-1.4.1-2.9-.1-4.1-.5c-1.2-.4-2.3-1-3-1.7c-.7-.7-.9-1.9-1.1-2.4z" fill="none" stroke="#b97754" stroke-width="3.2"/><path d="M5.5 403.9c4.7-29.3 14.9-6.2 22.4-7.7c7.5-1.5 14.9-1.4 22.4-1.4c7.5 0 14.9-.1 22.4 1.4c7.5 1.5 17.7-21.6 22.4 7.7c4.7 29.3 21.5 140 5.6 168c-15.9 28-84.9 28-100.8 0c-15.9-28 .9-138.7 5.6-168z" fill="none" stroke="#3d7853" stroke-width="3.2"/><path d="M25.7 109.9c-8.4 2.8-1 12.6-1.2 16.8c-.1 4.2.7 1.8.5 8.4c-.3 6.5-.9 14-1.9 30.8c-.9 16.8-2.5 42-3.6 70c-1.1 28-2.3 63-3.1 98c-.7 35-12.9 93.3-1.4 112c11.6 18.6 59.1 18.6 70.6 0c11.5-18.7-.7-77-1.4-112c-.8-35-2-70-3.1-98c-1.1-28-2.7-53.2-3.6-70c-.9-16.8-1.6-24.3-1.9-30.8c-.2-6.6.6-4.2.5-8.4c-.2-4.2 7.2-14-1.2-16.8c-8.4-2.8-40.8-2.8-49.2 0z" fill="#f4c5a0"/><path d="M75.1 135.1c1.8 4.9 1.4 14 2.4 30.8c1 16.8 2.5 42 3.6 70c1.1 28 2.3 63 3.1 98c.7 35 4.1 93.3 1.4 112c-2.7 18.6-14.7 18.6-17.8 0c-3.1-18.7-.3-77-.7-112c-.3-35-1.1-70-1.4-98c-.3-28-.7-53.5-.6-70c.2-16.6-.2-24.3 1.4-29.4c1.7-5.2 6.8-6.3 8.6-1.4z" fill="#e8b089"/><path d="M77.5 171.5c1.3 10.2 2.5 37.3 3.6 64.4c1.1 27 2.3 63 3.1 98c.7 35 2.1 93.3 1.4 112c-.7 18.6-4.4 18.6-5.6 0c-1.2-18.7-.7-77-1.4-112c-.7-35-1.9-71.4-2.8-98c-.9-26.6-2.8-50.9-2.5-61.6c.2-10.8 2.9-13.1 4.2-2.8z" fill="#d89a74" fill-opacity="0.45"/><path d="M23.7 157.5c-.5 10.7-1.8 37.3-2.8 64.4c-1 27-2.6 81.6-3.1 98" fill="none" stroke="#fcdcc1" stroke-width="2.8" stroke-linecap="round" stroke-opacity="0.6"/><path d="M25.4 130.9c2.2.8 9.4 3.8 13.6 4.7c4.1 1 7.5.9 11.3.9c3.8 0 7.2.1 11.3-.9c4.2-.9 11.4-3.9 13.6-4.7" fill="none" stroke="#cf8c67" stroke-width="1" stroke-linecap="round" stroke-opacity="0.65"/><path d="M36.4 140.1c2.4.2 9.7 1.2 13.9 1.3c4.2 0 9.5-.8 11.3-1" fill="none" stroke="#cf8c67" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.3"/><path d="M15.9 399c5.7 1 22.9.4 34.4.4c11.5 0 28.8.6 34.4-.4c5.7-1.1 5.5-4.7-.2-5.8c-5.8-1.1-22.8-.8-34.2-.8c-11.4 0-28.4-.3-34.2.8c-5.7 1.1-5.9 4.7-.2 5.8z" fill="#d89a74" fill-opacity="0.35"/><path d="M5.5 403.9c4.7-29.3 14.9-6.2 22.4-7.7c7.5-1.5 14.9-1.4 22.4-1.4c7.5 0 14.9-.1 22.4 1.4c7.5 1.5 17.7-21.6 22.4 7.7c4.7 29.3 21.5 140 5.6 168c-15.9 28-84.9 28-100.8 0c-15.9-28 .9-138.7 5.6-168z" fill="#5ca679"/><path d="M74.9 396.4c1.9-1.4 15.9-21.8 20.2 7.5c4.3 29.2 7.7 140 5.6 168c-2.1 28-15.4 26.6-18.2 0c-2.8-26.6 2.7-130.4 1.4-159.6c-1.3-29.3-10.8-14.5-9-15.9z" fill="#4b8f65"/><path d="M6.9 404.6c3.5-1.1 13.8-5.3 21-6.6c7.2-1.3 15.7-1.4 22.4-1.4c6.7-.1 14.9.9 17.9 1.1" fill="none" stroke="#79bc91" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.8"/><path d="M6.2 410.9c3.6-1.3 14.4-6.1 21.7-7.6c7.4-1.5 14.9-1.3 22.4-1.3c7.5 0 15.1-.2 22.4 1.3c7.4 1.5 18.1 6.3 21.7 7.6" fill="none" stroke="#3d7853" stroke-width=".8" stroke-dasharray="1.8 1.6" stroke-opacity="0.5"/><path d="M5.5 403.9c3.7-1.3 14.9-6.2 22.4-7.7c7.5-1.5 14.9-1.4 22.4-1.4c7.5 0 14.9-.1 22.4 1.4c7.5 1.5 18.7 6.4 22.4 7.7" fill="none" stroke="#3d7853" stroke-width="1"/><path d="M25.4 132.3c-4.3-3.3-.4-10.8-1-16.8c-.6-6.1-1.6-13.3-2.7-19.6c-1-6.3-3.2-12.3-3.8-18.2c-.5-6-.7-13.6.7-17.5c1.3-4 3.3-4.7 7.3-6.3c4.1-1.7 11.4-3.7 16.8-3.8c5.5-.1 10.7 1.4 15.7 3.3c5 2 10.5 5.5 14.3 8.2c3.8 2.6 7.1 3.6 8.6 7.7c1.5 4.1.5 10.7.3 16.8c-.3 6-1 13.5-1.9 19.6c-.9 6-2.7 12.3-3.5 16.8c-.7 4.4 3.3 7.7-1 9.8c-4.3 2.1-16.6 2.8-24.9 2.8c-8.3 0-20.6.4-24.9-2.8z" fill="#f4c5a0"/><path d="M81.3 69.3c1.8 3.4.5 10.7.3 16.8c-.3 6-1 13.5-1.9 19.6c-.9 6-2.7 12.1-3.5 16.8c-.7 4.6 1.1 9.3-1 11.2c-2.1 1.8-9.9 3.5-11.6 0c-1.7-3.5.8-14.3 1.3-21c.5-6.8.9-13.8 1.6-19.6c.8-5.9 2.2-10.9 2.8-15.4c.7-4.6-.7-10.5 1.3-11.9c2-1.4 8.8.1 10.7 3.5z" fill="#e8b089" fill-opacity="0.75"/><path d="M81.3 70.7c1 2.1.3 9.5 0 15.4c-.4 5.8-1.1 13.5-2 19.6c-.9 6-2.7 12.1-3.4 16.8c-.7 4.6.2 9.3-.7 11.2c-.9 1.8-4 3.9-4.7 0c-.7-4 .2-16.6.5-23.8c.4-7.3 1.1-13.6 1.7-19.6c.7-6.1.8-13.6 2.2-16.8c1.5-3.3 5.3-4.9 6.4-2.8z" fill="#e8b089"/><path d="M81 73.5c.6 1.6.3 7.2 0 12.6c-.4 5.3-1.3 13.5-2.1 19.6c-.9 6-2.5 12.1-3.1 16.8c-.6 4.6-.2 9.3-.6 11.2c-.4 1.8-1.7 4.4-1.9 0c-.3-4.5-.2-17.1.5-26.6c.7-9.6 2.5-25.2 3.7-30.8c1.2-5.6 2.9-4.5 3.5-2.8z" fill="#d89a74" fill-opacity="0.5"/><path d="M55.8 84.1c.3 2.4.4 5 .3 7.4c-.1 2.4-.5 4.8-1 6.8c-.6 2.1-1.4 4.1-2.4 5.7c-.9 1.6-2.1 2.9-3.4 3.9c-1.2.9-2.7 1.5-4.1 1.7c-1.4.2-3 0-4.4-.5c-1.5-.6-3-1.6-4.4-2.8c-1.3-1.3-2.6-3-3.8-4.8c-1.1-1.8-2.1-4-2.9-6.3c-.7-2.2-1.3-4.8-1.7-7.2c-.3-2.4-.4-5-.3-7.4c.1-2.3.5-4.7 1-6.8c.6-2.1 1.4-4.1 2.4-5.7c.9-1.5 2.1-2.9 3.4-3.8c1.2-1 2.7-1.6 4.1-1.8c1.4-.2 3 0 4.4.6c1.5.5 3 1.5 4.4 2.8c1.3 1.2 2.7 2.9 3.8 4.7c1.1 1.9 2.1 4.1 2.9 6.3c.7 2.3 1.3 4.8 1.7 7.2z" fill="#fcdcc1" fill-opacity="0.13"/><path d="M49.5 83.4c.3 2 .4 4.1.3 6c-.1 1.9-.4 3.8-.8 5.4c-.5 1.6-1.1 3.1-1.9 4.2c-.7 1.2-1.7 2-2.6 2.5c-1 .5-2.1.7-3.2.5c-1-.2-2.2-.8-3.2-1.7c-1-.9-2.1-2.1-2.9-3.5c-.9-1.4-1.7-3.2-2.3-5c-.6-1.8-1.1-3.9-1.4-5.9c-.3-1.9-.4-4.1-.3-6c.1-1.9.4-3.8.8-5.4c.5-1.6 1.1-3.1 1.9-4.2c.7-1.1 1.7-2 2.6-2.5c1-.5 2.1-.6 3.2-.4c1 .2 2.2.8 3.2 1.6c1 .9 2.1 2.1 2.9 3.6c.9 1.4 1.7 3.1 2.3 5c.7 1.8 1.1 3.8 1.4 5.8z" fill="#fcdcc1" fill-opacity="0.13"/><path d="M64.5 68c0-.6.2-.6.2-.9c.1-.3.1-.6.2-.8c0-.3 0-.6.1-.9c0-.3.1-.6.2-1c0-.4.1-.8.3-1.3c.1-.5.2-1 .4-1.6c.1-.6.2-1.2.4-1.9c.1-.7.3-1.4.4-2.1c.2-.7.3-1.4.5-2.1c.2-.7.3-1.4.5-2c.2-.6.5-1.3.9-1.8c.4-.6.9-1.1 1.5-1.5c.6-.4 1.3-.7 2.1-.9c.7-.2 1.5-.3 2.3-.3c.8 0 1.7.1 2.5.3c.7.2 1.5.5 2.2.9c.7.4 1.4.9 1.9 1.5c.5.5 1 1.2 1.3 1.8c.3.7.5 1.4.6 2c.1.7 0 1.4-.1 2.1c-.1.6-.4 1.3-.6 2c-.2.6-.4 1.3-.6 2c-.3.7-.5 1.4-.7 2c-.2.7-.4 1.3-.6 1.9c-.2.6-.3 1.1-.5 1.6c-.1.5-.2.9-.3 1.3c-.1.3-.3.6-.4.9c-.1.3-.2.6-.3.8c-.1.3-.2.5-.3.8c-.1.3 0 .4-.3.8c-.3.5-.7 1.4-1.4 1.9c-.8.4-1.9.7-3 .8c-1.1.1-2.4-.1-3.6-.4c-1.1-.3-2.4-.8-3.3-1.4c-.9-.7-1.7-1.5-2.1-2.2c-.4-.8-.3-1.8-.4-2.3z" fill="#f4c5a0"/><path d="M78.9 70c.1-.1.2-.5.3-.8c.1-.3.3-.6.4-.9c.1-.4.2-.8.3-1.3c.2-.5.3-1 .5-1.6c.2-.6.4-1.2.6-1.9c.2-.6.4-1.3.7-2c.2-.7.4-1.4.6-2c.2-.7.5-1.7.6-2c.1-.4.2-.4 0 0c-.2.3-.5 1.2-1.1 1.8c-.5.6-1.5 1.1-2.2 1.7c-.8.5-1.7 1-2.2 1.6c-.6.5-.8 1.2-1.1 1.7c-.2.6-.5 1.1-.4 1.6c.1.6.6 1.1 1.1 1.7c.4.5 1.5 1.1 1.8 1.5c.3.4.1.8.1.9c0 .2-.1.2 0 0z" fill="#e8b089"/><path d="M78.6 47.7c.2.1.9.4 1.2.7c.4.2.8.5 1.1.9c.3.3.6.7.9 1.1c.3.4.5.8.7 1.3c.2.4.3.9.4 1.3c.2.5.2 1 .3 1.5c0 .5 0 1-.1 1.5c0 .5-.2 1.2-.2 1.5c-.1.2.1.2 0 0c-.2-.3-.6-1.1-.8-1.6c-.2-.4-.4-.8-.5-1.2c-.2-.4-.4-.7-.5-1.1c-.2-.3-.3-.6-.5-1c-.1-.3-.3-.6-.4-1c-.1-.3-.3-.7-.4-1.1c-.2-.4-.4-.7-.6-1.2c-.1-.5-.5-1.4-.6-1.6c-.1-.3-.2-.2 0 0z" fill="#e8b089"/><path d="M79.6 68.3c0-.2.2-.8.3-1.3c.2-.5.3-1 .5-1.6c.2-.6.4-1.2.6-1.9c.2-.6.4-1.3.7-2c.2-.7.5-1.7.6-2c.1-.4.2-.4 0 0c-.2.3-.6 1.3-1 1.9c-.4.6-1 1.2-1.4 1.8c-.4.6-.8 1.2-.9 1.8c-.1.6.1 1.3.2 1.8c.1.6.3 1.2.3 1.4c.1.3 0 .3.1.1z" fill="#d89a74" fill-opacity="0.5"/><path d="M69 50.5c.4-.3 1.3-1.4 2-2c.7-.5 1.6-.9 2.4-1.2c.9-.3 1.8-.4 2.7-.3c.9.1 1.8.3 2.5.7c.8.3 1.6.9 2.2 1.5c.6.6 1.2 1.4 1.6 2.2c.4.8.6 1.8.7 2.7c.1.9-.1 2.4-.1 2.8c0 .5.2.5 0 0c-.2-.4-.7-1.8-1.1-2.6c-.4-.8-.7-1.4-1.2-1.9c-.4-.6-.9-1.1-1.4-1.4c-.6-.4-1.1-.8-1.7-1c-.5-.3-1.1-.5-1.7-.6c-.7-.1-1.3-.2-2-.2c-.7 0-1.4.2-2.2.4c-.8.2-2.2.8-2.7.9c-.4.2-.3.4 0 0z" fill="#e8b089" fill-opacity="0.8"/><path d="M75.8 57.6c-.1.5-.5.9-.9 1.2c-.5.2-1.2.4-1.8.4c-.7 0-1.5-.2-2-.5c-.6-.3-1.1-.8-1.4-1.3c-.2-.5-.3-1.1-.2-1.5c.1-.4.5-.9.9-1.2c.5-.2 1.2-.4 1.9-.4c.6 0 1.4.3 1.9.6c.6.2 1.1.7 1.4 1.2c.3.5.4 1.1.2 1.5z" fill="#fcdcc1" fill-opacity="0.55"/><path d="M66.3 59.6c.1-.4.3-1.4.4-2.1c.2-.7.3-1.4.5-2.1c.2-.7.3-1.4.5-2c.2-.6.5-1.3.9-1.8c.4-.6.9-1.1 1.5-1.5c.6-.4 1.3-.7 2.1-.9c.7-.2 1.5-.3 2.3-.3c.8 0 1.7.1 2.5.3c.7.2 1.5.5 2.2.9c.7.4 1.4.9 1.9 1.5c.5.5 1 1.2 1.3 1.8c.3.7.5 1.4.6 2c.1.7 0 1.4-.1 2.1c-.1.6-.4 1.3-.6 2c-.2.6-.4 1.3-.6 2c-.3.7-.5 1.4-.7 2c-.2.7-.4 1.3-.6 1.9c-.2.6-.4 1.3-.5 1.6" fill="none" stroke="#b97754" stroke-width="1"/><path d="M76.4 58.5c-.1 0-.6.2-.9.2c-.3.1-.6.1-.9.1c-.3 0-.6 0-.8-.1c-.3-.1-.6-.2-.8-.3c-.3-.1-.5-.3-.7-.5c-.3-.2-.6-.6-.7-.7" fill="none" stroke="#cf8c67" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M49.8 61.2c-.1-.5.1-.5.1-.8c0-.3 0-.5 0-.7c0-.3 0-.5 0-.8c0-.3 0-.6.1-1c0-.5.1-1 .2-1.6c0-.6.1-1.3.2-2.1c.1-.8.2-1.7.4-2.6c.1-.9.2-1.9.3-2.9c.1-.9.2-1.9.4-2.9c.1-1 .2-2 .4-2.8c.2-.8.3-1.5.7-2.1c.4-.7 1-1.3 1.6-1.8c.6-.5 1.4-1 2.1-1.3c.8-.3 1.7-.5 2.6-.6c.9-.1 1.9-.1 2.8.1c.8.1 1.8.4 2.6.7c.8.4 1.6.9 2.2 1.4c.7.6 1.3 1.2 1.7 1.9c.4.7.8 1.4.9 2.2c.2.7.2 1.4.1 2.2c-.1.9-.3 1.9-.5 2.8c-.2 1-.4 2-.5 2.9c-.2 1-.4 2-.6 2.9c-.2.9-.4 1.8-.5 2.6c-.2.7-.3 1.5-.4 2.1c-.1.6-.2 1-.3 1.5c-.1.4-.2.7-.2 1c-.1.3-.2.5-.3.7c-.1.3-.1.5-.2.7c0 .3.1.3-.2.8c-.2.5-.6 1.7-1.4 2.2c-.8.6-1.9 1.1-3.1 1.3c-1.2.2-2.8.2-4.1 0c-1.3-.2-2.8-.7-3.8-1.2c-1.1-.6-2.1-1.4-2.6-2.2c-.6-.8-.6-2-.7-2.6z" fill="#f4c5a0"/><path d="M65.9 62.2c.1-.1.2-.4.3-.7c0-.3.1-.6.2-1c.1-.5.2-.9.3-1.5c.1-.6.2-1.4.4-2.1c.1-.8.3-1.7.5-2.6c.2-.9.4-1.9.6-2.9c.1-.9.3-1.9.5-2.9c.2-.9.4-2.3.5-2.8c.1-.4.2-.4 0 0c-.2.5-.5 1.9-1.1 2.7c-.5.9-1.5 1.8-2.3 2.7c-.8.8-1.8 1.7-2.4 2.5c-.5.9-.8 1.7-1 2.5c-.2.8-.5 1.5-.3 2.1c.1.7.7 1.3 1.3 1.8c.6.5 1.9 1 2.3 1.4c.4.4.2.7.2.8c.1.2 0 .2 0 0z" fill="#e8b089"/><path d="M63.4 35.3c.2.1.9.4 1.4.7c.4.2.9.5 1.3.9c.4.3.7.7 1.1 1.1c.3.4.6.9.9 1.3c.2.5.5 1 .7 1.5c.1.5.3 1.1.4 1.6c.1.6.1 1.1.1 1.7c0 .5-.1 1.4-.1 1.6c0 .3.2.3 0 0c-.2-.2-.7-1.1-1-1.6c-.3-.5-.6-.9-.8-1.3c-.2-.4-.5-.7-.7-1.1c-.2-.4-.4-.7-.6-1.1c-.2-.3-.4-.7-.6-1c-.2-.4-.3-.8-.6-1.2c-.2-.4-.4-.8-.7-1.3c-.3-.5-.7-1.5-.8-1.8c-.2-.3-.3-.1 0 0z" fill="#e8b089"/><path d="M66.4 60.5c.1-.3.2-.9.3-1.5c.1-.6.2-1.4.4-2.1c.1-.8.3-1.7.5-2.6c.2-.9.4-1.9.6-2.9c.1-.9.4-2.4.5-2.9c.1-.5.2-.4 0 0c-.2.5-.6 1.9-1 2.9c-.4.9-1 1.8-1.4 2.7c-.3.9-.8 1.7-.8 2.5c-.1.8.2 1.6.4 2.2c.1.7.4 1.4.5 1.7c.1.2 0 .2 0 0z" fill="#d89a74" fill-opacity="0.5"/><path d="M53 39.6c.3-.4 1.2-1.7 2-2.4c.7-.7 1.6-1.3 2.5-1.6c.9-.4 2-.6 2.9-.7c1 0 2 .1 3 .4c.9.4 1.8.9 2.6 1.5c.7.6 1.4 1.4 1.9 2.3c.6.9 1 1.9 1.2 2.9c.2 1 .1 2.6.2 3.2c0 .5.2.4 0 0c-.3-.5-1-2-1.5-2.8c-.5-.9-1-1.5-1.6-2.1c-.6-.5-1.2-1-1.8-1.4c-.6-.3-1.2-.6-1.9-.9c-.7-.2-1.3-.3-2-.4c-.8-.1-1.5-.1-2.3 0c-.7.2-1.5.4-2.4.7c-.9.3-2.3 1.1-2.8 1.3c-.5.3-.3.5 0 0z" fill="#e8b089" fill-opacity="0.8"/><path d="M61.4 46.7c-.1.5-.5 1.1-.9 1.5c-.5.3-1.3.6-2 .6c-.7.1-1.6-.1-2.3-.3c-.6-.3-1.3-.8-1.6-1.3c-.4-.5-.6-1.1-.5-1.6c.1-.5.5-1.1 1-1.4c.4-.4 1.2-.6 1.9-.7c.7 0 1.6.1 2.3.4c.6.2 1.3.7 1.6 1.2c.4.5.6 1.1.5 1.6z" fill="#fcdcc1" fill-opacity="0.55"/><path d="M50.8 51.6c0-.5.2-1.9.3-2.9c.1-.9.2-1.9.4-2.9c.1-1 .2-2 .4-2.8c.2-.8.3-1.5.7-2.1c.4-.7 1-1.3 1.6-1.8c.6-.5 1.4-1 2.1-1.3c.8-.3 1.7-.5 2.6-.6c.9-.1 1.9-.1 2.8.1c.8.1 1.8.4 2.6.7c.8.4 1.6.9 2.2 1.4c.7.6 1.3 1.2 1.7 1.9c.4.7.8 1.4.9 2.2c.2.7.2 1.4.1 2.2c-.1.9-.3 1.9-.5 2.8c-.2 1-.4 2-.5 2.9c-.2 1-.4 2-.6 2.9c-.2.9-.4 1.8-.5 2.6c-.2.7-.3 1.7-.4 2.1" fill="none" stroke="#b97754" stroke-width="1"/><path d="M62.1 48c-.2.1-.7.4-1 .5c-.4.1-.7.1-1 .2c-.3 0-.6 0-1-.1c-.3 0-.6-.1-.9-.2c-.3-.1-.5-.3-.8-.5c-.3-.2-.7-.6-.9-.7" fill="none" stroke="#cf8c67" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M34.1 58.9c-.2-.6 0-.6 0-.8c0-.3 0-.5 0-.7c-.1-.2-.1-.5-.1-.8c0-.3-.1-.6 0-1c0-.5 0-1 0-1.6c.1-.7.1-1.5.1-2.4c.1-.8.1-1.9.1-2.9c.1-1 .1-2.1.1-3.2c.1-1.1.1-2.2.2-3.3c0-1.1 0-2.2.1-3.1c.2-.9.3-1.6.7-2.3c.3-.7.8-1.4 1.4-2c.6-.6 1.3-1.1 2.1-1.5c.8-.4 1.7-.7 2.7-.9c.9-.2 1.9-.2 2.8-.2c.9.1 1.9.3 2.8.6c.9.3 1.8.7 2.5 1.2c.7.5 1.4 1.2 1.9 1.8c.5.7.9 1.5 1.1 2.2c.3.8.3 1.5.3 2.4c0 .9-.1 2-.2 3.1c-.1 1.1-.3 2.2-.4 3.3c-.1 1.1-.2 2.2-.3 3.2c-.1 1-.2 2-.3 2.9c-.1.8-.2 1.6-.2 2.3c-.1.6-.1 1.1-.2 1.6c0 .4-.1.7-.2 1c0 .3-.1.5-.1.8c-.1.2-.1.4-.2.6c0 .3.1.3-.1.8c-.2.6-.5 1.8-1.3 2.5c-.7.6-1.9 1.2-3.1 1.6c-1.3.3-2.9.4-4.2.3c-1.4-.1-3-.4-4.2-.9c-1.1-.5-2.2-1.3-2.9-2.1c-.6-.7-.8-2-.9-2.5z" fill="#f4c5a0"/><path d="M51 58.6c0-.2.1-.5.1-.8c.1-.3.2-.6.2-1c.1-.5.1-1 .2-1.6c0-.7.1-1.5.2-2.3c.1-.9.2-1.9.3-2.9c.1-1 .2-2.1.3-3.2c.1-1.1.3-2.2.4-3.3c.1-1.1.2-2.6.2-3.1c.1-.6.2-.5 0 0c-.1.5-.3 2-.8 3.1c-.6 1-1.5 2.1-2.3 3.1c-.7 1-1.7 2.1-2.2 3.1c-.5.9-.7 1.9-.8 2.8c-.2.9-.4 1.7-.2 2.3c.2.7.9 1.3 1.6 1.8c.6.5 2 .9 2.4 1.2c.5.3.3.6.4.8c0 .1-.1.1 0 0z" fill="#e8b089"/><path d="M45.9 30.1c.3.1 1 .3 1.5.5c.5.2 1 .5 1.5.8c.4.3.8.7 1.2 1.1c.4.4.8.8 1.1 1.3c.3.5.6 1 .8 1.5c.3.5.5 1.1.6 1.6c.1.6.2 1.1.3 1.7c.1.6 0 1.5 0 1.8c0 .3.2.2 0 0c-.2-.3-.9-1.2-1.2-1.6c-.4-.5-.6-.9-.9-1.3c-.3-.4-.5-.8-.8-1.1c-.3-.4-.5-.7-.7-1.1c-.3-.3-.5-.6-.7-1c-.3-.4-.5-.8-.8-1.2c-.2-.4-.5-.8-.9-1.3c-.3-.5-.8-1.4-1-1.7c-.2-.3-.3-.1 0 0z" fill="#e8b089"/><path d="M51.3 56.8c0-.3.1-1 .2-1.6c0-.7.1-1.5.2-2.3c.1-.9.2-1.9.3-2.9c.1-1 .2-2.1.3-3.2c.1-1.1.3-2.8.4-3.3c0-.6.1-.5 0 0c-.2.5-.5 2.2-.8 3.2c-.4 1.1-.9 2.2-1.2 3.2c-.3 1-.7 2-.7 2.8c0 .9.4 1.7.6 2.4c.2.7.5 1.4.7 1.7c.1.3 0 .3 0 0z" fill="#d89a74" fill-opacity="0.5"/><path d="M35.5 35.5c.3-.5 1.1-1.9 1.8-2.7c.8-.8 1.6-1.5 2.6-2c.9-.4 1.9-.8 2.9-.9c1-.1 2.1-.1 3.1.2c1 .2 2 .7 2.8 1.2c.9.6 1.7 1.4 2.3 2.3c.6.8 1.1 1.8 1.5 2.9c.3 1 .4 2.7.5 3.2c0 .6.3.5 0 0c-.4-.4-1.3-1.9-1.9-2.7c-.6-.8-1.2-1.4-1.8-2c-.6-.5-1.3-.9-2-1.3c-.6-.3-1.3-.6-2-.7c-.7-.2-1.5-.3-2.2-.3c-.8 0-1.5 0-2.3.2c-.8.2-1.6.5-2.5.9c-.9.5-2.3 1.4-2.8 1.7c-.4.3-.3.5 0 0z" fill="#e8b089" fill-opacity="0.8"/><path d="M44.9 42.1c0 .5-.4 1.2-.8 1.6c-.5.4-1.3.7-2 .8c-.8.1-1.7.1-2.4-.1c-.7-.3-1.4-.7-1.9-1.2c-.4-.4-.6-1.1-.6-1.6c.1-.6.4-1.2.9-1.6c.4-.4 1.2-.7 2-.9c.7-.1 1.6 0 2.3.2c.7.2 1.5.7 1.9 1.1c.4.5.6 1.2.6 1.7z" fill="#fcdcc1" fill-opacity="0.55"/><path d="M34.1 51.6c.1-.5.1-1.9.1-2.9c.1-1 .1-2.1.1-3.2c.1-1.1.1-2.2.2-3.3c0-1.1 0-2.2.1-3.1c.2-.9.3-1.6.7-2.3c.3-.7.8-1.4 1.4-2c.6-.6 1.3-1.1 2.1-1.5c.8-.4 1.7-.7 2.7-.9c.9-.2 1.9-.2 2.8-.2c.9.1 1.9.3 2.8.6c.9.3 1.8.7 2.5 1.2c.7.5 1.4 1.2 1.9 1.8c.5.7.9 1.5 1.1 2.2c.3.8.3 1.5.3 2.4c0 .9-.1 2-.2 3.1c-.1 1.1-.3 2.2-.4 3.3c-.1 1.1-.2 2.2-.3 3.2c-.1 1-.3 2.4-.3 2.9" fill="none" stroke="#b97754" stroke-width="1"/><path d="M45.7 43.6c-.2.1-.7.4-1 .5c-.3.1-.7.2-1 .3c-.3.1-.7.1-1 .1c-.3-.1-.6-.1-.9-.2c-.4-.1-.7-.3-1-.5c-.3-.1-.8-.5-.9-.6" fill="none" stroke="#cf8c67" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M21.3 120.6c-1.1-1.3-2-3.6-3-5.5c-1-1.8-2.1-3.8-3.1-5.7c-1-2-2.1-4-3-6.1c-1-2-2-4-2.9-6.1c-.9-2-1.8-4-2.6-6.1c-.7-2-1.3-4.1-1.7-6c-.4-2-.6-3.9-.7-5.7c-.1-1.7-.1-3.4-.1-4.9c0-1.5.1-2.9.2-4.1c0-1.3.1-2.3.2-3.5c.1-1.1.1-2.3.4-3.5c.3-1.1.9-2.5 1.3-3.4c.5-1 1.1-1.8 1.5-2.3c.4-.5.5-.5.7-.7c.2-.3.1-.2.5-.8c.3-.5 1-1.8 1.7-2.5c.7-.8 1.5-1.5 2.4-2c.9-.5 1.8-.9 2.8-1.1c.9-.2 2-.2 2.9-.1c1 .1 2 .3 2.8.8c.9.4 1.7 1 2.4 1.6c.7.7 1.2 1.6 1.7 2.4c.4.9.7 1.9.9 2.9c.1 1 .1 2.1-.1 3.1c-.1 1-.6 2.2-.9 3c-.3.8-.5 1.2-.8 1.7c-.2.6-.6 1.2-.6 1.5c-.1.2.1.1.2 0c.1 0 .2-.5.3-.4c0 .2 0 .5 0 1.1c0 .6-.1 1.7 0 2.6c0 1 0 2.2 0 3.2c.1 1.1.2 2.2.4 3.3c.1 1.1.3 2.1.6 3.2c.3 1 .5 2 1 3.1c.4 1.2 1.1 2.4 1.9 3.8c.8 1.3 1.9 2.8 3.1 4.4c1.1 1.6 2.4 3.2 3.7 5c1.3 1.7 2.7 3.5 4 5.3c1.2 1.8 2.8 3.9 3.5 5.4c.7 1.6.8 2.7.5 4.2c-.3 1.4-1.3 3.2-2.5 4.7c-1.2 1.5-3.1 3-4.9 4.1c-1.8 1.1-4 2-5.9 2.4c-1.9.4-3.9.4-5.4 0c-1.4-.3-2.3-1-3.4-2.3z" fill="#f4c5a0"/><path d="M35.4 96.8c-.6-.9-2.6-3.4-3.7-5c-1.2-1.6-2.3-3.1-3.1-4.4c-.8-1.4-1.5-2.6-1.9-3.8c-.5-1.1-.7-2.1-1-3.1c-.3-1.1-.5-2.1-.6-3.2c-.2-1.1-.3-2.2-.4-3.3c0-1 0-2.2 0-3.2c-.1-.9 0-2 0-2.6c0-.6 0-.9 0-1.1c-.1-.1-.2.4-.3.4c-.1.1-.3.2-.2 0c0-.3.4-.9.6-1.5c.3-.5.7-1.4.8-1.7c.1-.3.2-.3 0 0c-.2.2-.7 1.1-1.4 1.4c-.7.3-1.8.3-2.6.2c-.9-.1-1.8-.5-2.3-.5c-.6 0-.7.2-.9.6c-.2.4-.1 1-.2 1.8c0 .8 0 1.8 0 2.9c0 1.1-.1 2.3 0 3.5c0 1.2.1 2.5.2 3.8c.2 1.3.4 2.6.7 4c.3 1.3.5 2.7 1.2 4c.7 1.4 1.2 3 2.8 4.2c1.5 1.2 4.3 1.8 6.4 2.9c2 1.1 4.9 3.1 5.9 3.7c1 .6.6.8 0 0z" fill="#e8b089"/><path d="M22.9 52c.2.2.8.7 1.2 1.1c.4.4.7.8 1 1.3c.3.4.6.9.8 1.4c.2.6.4 1.1.5 1.7c.1.5.2 1.1.3 1.7c0 .5 0 1.1-.1 1.7c-.1.6-.2 1.2-.4 1.7c-.1.6-.5 1.4-.6 1.7c-.1.2.1.3 0 0c-.1-.4-.4-1.4-.6-2c-.1-.6-.2-1-.3-1.5c-.1-.5-.2-.9-.4-1.4c-.1-.4-.2-.8-.3-1.2c0-.4-.1-.8-.2-1.3c-.1-.4-.2-.8-.3-1.3c-.1-.5-.2-1-.3-1.6c-.1-.6-.3-1.7-.3-2c-.1-.3-.2-.2 0 0z" fill="#e8b089"/><path d="M31.7 91.8c-.6-.7-2.3-3.1-3.1-4.4c-.8-1.4-1.5-2.6-1.9-3.8c-.5-1.1-.7-2.1-1-3.1c-.3-1.1-.5-2.1-.6-3.2c-.2-1.1-.3-2.2-.4-3.3c0-1 0-2.2 0-3.2c-.1-.9 0-2 0-2.6c0-.6 0-.9 0-1.1c-.1-.1-.2.4-.3.4c-.1.1-.3.2-.2 0c0-.3.5-1.2.6-1.5c.1-.2.2-.1 0 0c-.2.2-.8 1.1-1.1 1.2c-.3.2-.5-.2-.7-.3c-.1 0-.2-.3-.3-.1c-.1.2 0 .6 0 1.2c0 .7-.1 1.8-.1 2.8c0 1 0 2.2.1 3.3c.1 1.1.1 2.3.3 3.4c.2 1.1.3 2.3.6 3.4c.4 1.2.7 2.2 1.5 3.3c.8 1.1 2 2.1 3.1 3.4c1.1 1.2 2.9 3.5 3.5 4.2c.5.7.5.7 0 0z" fill="#d89a74" fill-opacity="0.5"/><path d="M18 99.9c-.5-1-2-3.8-2.9-5.6c-.9-1.9-1.7-3.6-2.4-5.4c-.6-1.8-1.1-3.5-1.5-5.2c-.3-1.7-.5-3.3-.7-4.9c-.1-1.6-.1-3.1-.1-4.5c0-1.3 0-2.6.1-3.8c0-1.2 0-2.2.1-3.2c.1-1 .1-1.9.3-2.8c.2-.8.5-1.6.8-2.3c.3-.6.7-1.2 1-1.6c.3-.4.6-.8.7-.9" fill="none" stroke="#fcdcc1" stroke-width="3" stroke-linecap="round" stroke-opacity="0.5"/><path d="M21.3 120.6c-.5-.9-2-3.6-3-5.5c-1-1.8-2.1-3.8-3.1-5.7c-1-2-2.1-4-3-6.1c-1-2-2-4-2.9-6.1c-.9-2-1.8-4-2.6-6.1c-.7-2-1.3-4.1-1.7-6c-.4-2-.6-3.9-.7-5.7c-.1-1.7-.1-3.4-.1-4.9c0-1.5.1-2.9.2-4.1c0-1.3.1-2.3.2-3.5c.1-1.1.1-2.3.4-3.5c.3-1.1.9-2.5 1.3-3.4c.5-1 1.1-1.8 1.5-2.3c.4-.5.5-.5.7-.7c.2-.3.1-.2.5-.8c.3-.5 1-1.8 1.7-2.5c.7-.8 1.5-1.5 2.4-2c.9-.5 1.8-.9 2.8-1.1c.9-.2 2-.2 2.9-.1c1 .1 2 .3 2.8.8c.9.4 1.7 1 2.4 1.6c.7.7 1.2 1.6 1.7 2.4c.4.9.7 1.9.9 2.9c.1 1 .1 2.1-.1 3.1c-.1 1-.6 2.2-.9 3c-.3.8-.6 1.5-.8 1.7" fill="none" stroke="#b97754" stroke-width="1"/><path d="M16.4 68.1c-.2.1-.8.5-1.2.7c-.4.2-.8.3-1.2.4c-.3.1-.7.1-1.1.1c-.4 0-.8-.1-1.1-.2c-.4-.2-.8-.4-1.1-.6c-.4-.2-1-.7-1.1-.8" fill="none" stroke="#cf8c67" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.5"/><path d="M16.9 53.7c-.4-.2-.9-.3-1.3-.4c-.5 0-.9.1-1.3.2c-.4.1-.8.4-1.2.7c-.3.3-.7.6-1 1.1c-.4.4-.7 1.1-1 1.7c-.3.6-.7 1.5-.9 2c-.1.5-.1.8-.1 1.1c0 .3.1.6.2.9c.2.3.3.5.7.8c.4.3 1 .6 1.6.9c.6.3 1.3.6 1.7.7c.5.1.7.1 1.1 0c.3 0 .5-.2.8-.4c.3-.1.5-.3.8-.8c.3-.4.8-1.2 1-1.8c.3-.7.6-1.3.8-1.9c.1-.6.2-1.1.2-1.5c0-.5-.1-1-.3-1.4c-.1-.4-.3-.7-.6-1.1c-.3-.3-.7-.6-1.2-.8z" fill="#f7d3bf" stroke="#d9a184" stroke-width=".7"/><path d="M11.8 59.9c.1-.2.4-.8.6-1.2c.2-.4.4-.8.6-1.2c.2-.4.4-.8.5-1.2c.2-.4.5-1 .6-1.2" fill="none" stroke="#fde9dd" stroke-width=".9" stroke-linecap="round" stroke-opacity="0.75"/><path d="M19.4 63.2c-.2-.5-.1-.5-.1-.7c0-.2 0-.2 0-.4c0-.1 0-.2 0-.5c0-.3 0-.6 0-1.1c0-.6-.1-1.2-.1-2.2c0-1 0-2.3 0-3.7c0-1.4 0-3.1 0-4.8c0-1.7-.1-3.6-.1-5.4c0-1.8 0-3.6 0-5.3c0-1.6 0-3.1-.1-4.5c0-1.4-.1-2.6-.1-3.9c-.1-1.2-.1-2.4-.2-3.6c-.1-1.1-.1-2.2-.2-3.3c0-1-.1-2-.2-2.9c0-.8 0-1.7-.1-2.4c0-.7 0-1.3 0-1.8c0-.5 0-.9 0-1.2c.1-.4.1-.6.1-.9c0-.3.1-.6.1-.9c0-.3-.1-.4 0-1c0-.6 0-1.7.2-2.5c.2-.8.6-1.7 1-2.4c.4-.7 1-1.3 1.6-1.8c.6-.6 1.3-1 2-1.3c.7-.3 1.6-.5 2.3-.5c.8 0 1.6.1 2.4.3c.7.2 1.5.6 2.1 1.1c.7.4 1.3 1 1.8 1.7c.5.6.9 1.4 1.2 2.2c.3.8.4 1.9.5 2.5c.1.6 0 .7 0 1c.1.3.1.5.2.8c0 .3.1.6.1 1c.1.3.1.7.2 1.3c0 .5.1 1.1.1 1.8c0 .7 0 1.6.1 2.5c0 .9 0 1.8 0 2.9c0 1 0 2.1.1 3.3c0 1.1 0 2.4 0 3.6c.1 1.3.1 2.5.1 3.9c.1 1.4.1 3 .2 4.6c.1 1.7.2 3.5.2 5.3c.1 1.8.2 3.7.3 5.4c.1 1.7.2 3.4.2 4.8c.1 1.4.1 2.7.2 3.7c0 .9 0 1.6 0 2.1c0 .6 0 .9.1 1.2c0 .2 0 .3 0 .5c0 .1 0 .2 0 .4c0 .2.2.1 0 .7c-.2.5-.4 1.7-1 2.4c-.7.7-1.8 1.4-3 1.9c-1.1.4-2.6.7-4 .7c-1.4.1-2.9-.1-4.1-.5c-1.2-.4-2.3-1-3-1.7c-.7-.7-.9-1.9-1.1-2.4z" fill="#f4c5a0"/><path d="M35.6 61.2c-.1-.2-.1-.6-.1-1.2c0-.5 0-1.2 0-2.1c-.1-1-.1-2.3-.2-3.7c0-1.4-.1-3.1-.2-4.8c-.1-1.7-.2-3.6-.3-5.4c0-1.8-.1-3.6-.2-5.3c-.1-1.6-.1-3.2-.2-4.6c0-1.4 0-2.6-.1-3.9c0-1.2 0-2.5 0-3.6c-.1-1.2-.1-2.3-.1-3.3c0-1.1 0-2 0-2.9c-.1-.9-.1-1.8-.1-2.5c0-.7-.1-1.3-.1-1.8c-.1-.6-.1-1-.2-1.3c0-.4-.1-.7-.1-1c-.1-.3-.1-.5-.2-.8c0-.3 0-.8 0-1c-.1-.2 0-.2 0 0c-.1.2-.1.7-.5 1c-.3.3-1.1.6-1.6.9c-.6.4-1.3.7-1.7 1.1c-.3.3-.4.7-.5 1.2c0 .6.1 1.2.1 1.9c.1.7.1 1.5.1 2.4c0 .9.1 1.9.1 2.9c0 1.1.1 2.2.1 3.3c0 1.2.1 2.4.1 3.7c0 1.2.1 2.5.1 3.9c.1 1.4.1 2.9.2 4.5c0 1.7.1 3.5.1 5.3c.1 1.8.2 3.7.2 5.4c.1 1.7.1 3.4.2 4.8c.1 1.4 0 2.7.6 3.7c.6.9 2 1.6 2.7 2.1c.7.5 1.5.9 1.8 1.1c.2.1 0 .2 0 0z" fill="#e8b089"/><path d="M26.7 4.2c.2.1.9.2 1.3.3c.5.2.9.4 1.3.6c.4.2.8.4 1.1.7c.4.3.7.6 1 1c.3.3.6.7.8 1.1c.3.4.5.9.7 1.3c.1.4.3.9.4 1.4c.1.4.1 1.2.2 1.4c0 .2.2.2 0 0c-.2-.2-.9-.8-1.2-1.2c-.3-.3-.6-.7-.9-.9c-.2-.3-.5-.6-.7-.9c-.3-.2-.5-.5-.7-.8c-.3-.2-.5-.5-.7-.8c-.2-.2-.5-.5-.7-.8c-.3-.4-.5-.6-.9-1c-.3-.4-.8-1.1-1-1.4c-.2-.2-.2 0 0 0z" fill="#e8b089"/><path d="M35.5 60c0-.3 0-1.2 0-2.1c-.1-1-.1-2.3-.2-3.7c0-1.4-.1-3.1-.2-4.8c-.1-1.7-.2-3.6-.3-5.4c0-1.8-.1-3.6-.2-5.3c-.1-1.6-.1-3.2-.2-4.6c0-1.4 0-2.6-.1-3.9c0-1.2 0-2.5 0-3.6c-.1-1.2-.1-2.3-.1-3.3c0-1.1 0-2 0-2.9c-.1-.9-.1-1.8-.1-2.5c0-.7-.1-1.3-.1-1.8c-.1-.6-.1-1-.2-1.3c0-.4-.1-.7-.1-1c-.1-.3-.1-.7-.2-.8c0-.1.1-.1 0 0c0 .1-.1.5-.2.8c-.2.4-.5.6-.6 1c-.2.4-.3.8-.3 1.3c0 .5.1 1.1.1 1.9c0 .7.1 1.5.1 2.4c0 .9 0 1.9 0 2.9c.1 1.1.1 2.2.1 3.3c0 1.2.1 2.4.1 3.7c0 1.2 0 2.5.1 3.9c0 1.4.1 2.9.2 4.6c0 1.6.1 3.5.2 5.2c.1 1.8.1 3.7.2 5.4c.1 1.7.3 3.4.6 4.8c.2 1.4.8 2.7 1 3.7c.3.9.4 1.8.4 2.1c.1.4 0 .4 0 0z" fill="#d89a74" fill-opacity="0.5"/><path d="M24 54.5c0-.8 0-3.1-.1-4.8c0-1.7 0-3.6 0-5.4c-.1-1.8-.1-3.7-.1-5.3c-.1-1.6-.1-3.1-.2-4.5c0-1.5 0-2.7-.1-3.9c0-1.3-.1-2.5-.1-3.6c-.1-1.2-.1-2.3-.2-3.3c0-1.1-.1-2-.1-2.9c0-.9-.1-1.8-.1-2.5c0-.7-.1-1.3-.1-1.8c0-.5 0-.9 0-1.2c0-.4 0-.7 0-1c0-.2 0-.7 0-.8" fill="none" stroke="#fcdcc1" stroke-width="1.9" stroke-linecap="round" stroke-opacity="0.5"/><path d="M19.3 60.5c0-.4-.1-1.2-.1-2.2c0-1 0-2.3 0-3.7c0-1.4 0-3.1 0-4.8c0-1.7-.1-3.6-.1-5.4c0-1.8 0-3.6 0-5.3c0-1.6 0-3.1-.1-4.5c0-1.4-.1-2.6-.1-3.9c-.1-1.2-.1-2.4-.2-3.6c-.1-1.1-.1-2.2-.2-3.3c0-1-.1-2-.2-2.9c0-.8 0-1.7-.1-2.4c0-.7 0-1.3 0-1.8c0-.5 0-.9 0-1.2c.1-.4.1-.6.1-.9c0-.3.1-.6.1-.9c0-.3-.1-.4 0-1c0-.6 0-1.7.2-2.5c.2-.8.6-1.7 1-2.4c.4-.7 1-1.3 1.6-1.8c.6-.6 1.3-1 2-1.3c.7-.3 1.6-.5 2.3-.5c.8 0 1.6.1 2.4.3c.7.2 1.5.6 2.1 1.1c.7.4 1.3 1 1.8 1.7c.5.6.9 1.4 1.2 2.2c.3.8.4 1.9.5 2.5c.1.6 0 .7 0 1c.1.3.1.5.2.8c0 .3.1.6.1 1c.1.3.1.7.2 1.3c0 .5.1 1.1.1 1.8c0 .7 0 1.6.1 2.5c0 .9 0 1.8 0 2.9c0 1 0 2.1.1 3.3c0 1.1 0 2.4 0 3.6c.1 1.3.1 2.5.1 3.9c.1 1.4.1 3 .2 4.6c.1 1.7.2 3.5.2 5.3c.1 1.8.2 3.7.3 5.4c.1 1.7.2 4 .2 4.8" fill="none" stroke="#b97754" stroke-width="1"/><path d="M29.3 34.3c-.1.1-.5.4-.8.6c-.3.2-.6.3-.9.4c-.3.1-.6.1-.8.1c-.3 0-.6 0-.9-.1c-.3 0-.6-.1-.9-.3c-.3-.1-.7-.5-.9-.6" fill="none" stroke="#cf8c67" stroke-width=".9" stroke-linecap="round" stroke-opacity="0.5"/><path d="M28.2 18.1c-.1.1-.4.4-.6.5c-.3.1-.5.2-.7.3c-.3 0-.5.1-.7.1c-.2 0-.5 0-.7-.1c-.2 0-.5-.1-.7-.2c-.2-.1-.6-.4-.7-.4" fill="none" stroke="#cf8c67" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.35"/><path d="M25.7 7.7c-.5 0-1 .1-1.5.3c-.4.1-.7.4-1 .7c-.3.3-.6.6-.8 1c-.2.5-.4.9-.5 1.4c-.1.6-.1 1.3-.1 1.9c.1.7.2 1.5.3 2c.1.5.2.7.4 1c.2.3.4.5.7.6c.2.2.5.3 1 .4c.4.1 1.3.1 1.9 0c.7 0 1.5-.1 2-.2c.5-.1.7-.2.9-.4c.3-.2.5-.4.6-.7c.2-.3.3-.5.4-1c0-.5 0-1.4 0-2.1c0-.6-.1-1.3-.3-1.8c-.1-.5-.3-1-.5-1.4c-.3-.4-.6-.7-.9-1c-.3-.2-.7-.4-1.1-.6c-.5-.1-1-.1-1.5-.1z" fill="#f7d3bf" stroke="#d9a184" stroke-width=".7"/><path d="M24 15c0-.2-.1-.8-.1-1.2c0-.4 0-.8 0-1.2c0-.5-.1-.9-.1-1.3c0-.4 0-1 0-1.2" fill="none" stroke="#fde9dd" stroke-width=".9" stroke-linecap="round" stroke-opacity="0.75"/><path d="M25.2 60.4c.4.2 1.7 1.1 2.4 1.2c.8 0 1.8-.8 2.2-1" fill="none" stroke="#cf8c67" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.42"/><path d="M40.6 56.9c.4.2 1.6 1.1 2.4 1.2c.8 0 1.9-.8 2.2-1" fill="none" stroke="#cf8c67" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.42"/><path d="M56.4 60c.3.2 1.6 1.1 2.3 1.1c.8.1 1.8-.8 2.1-.9" fill="none" stroke="#cf8c67" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.42"/><path d="M70.9 67.4c.3.2 1.4 1.1 2.1 1.2c.7 0 1.5-.8 1.8-1" fill="none" stroke="#cf8c67" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.42"/></g></svg>'},
    pinch:{w:126,h:522,grip:[29.4,19],wrist:[68.5,101.3],
      svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 126 522" width="126" height="522"><g class="wh-shadow" fill="#3a2410" stroke="#3a2410" stroke-linejoin="round"><path d="M50.9 91.9c-8.4 2.8-1 12.6-1.1 16.8c-.1 4.2.6 1.9.4 8.4c-.2 6.6-.9 14-1.8 30.8c-.9 16.8-2.5 42-3.7 70c-1.1 28-2.3 63-3 98c-.8 35-13 93.4-1.4 112c11.5 18.7 59 18.7 70.5 0c11.5-18.6-.6-77-1.4-112c-.7-35-1.9-70-3.1-98c-1.1-28-2.7-53.2-3.6-70c-.9-16.8-1.6-24.2-1.8-30.8c-.3-6.5.5-4.2.4-8.4c-.1-4.2 7.3-14-1.1-16.8c-8.4-2.8-40.9-2.8-49.3 0zM30.7 385.9c4.7-29.3 15-6.2 22.4-7.7c7.5-1.5 15-1.4 22.4-1.4c7.5 0 15-.1 22.4 1.4c7.5 1.5 17.8-21.6 22.4 7.7c4.7 29.3 21.5 140 5.6 168c-15.8 28-84.9 28-100.8 0c-15.8-28 1-138.7 5.6-168zM50.4 114.2c-4.6-3.4-1.2-11.3-2.2-17.6c-1.1-6.4-2.6-14-4.2-20.6c-1.5-6.6-4.2-12.9-5.2-19.1c-.9-6.3-1.7-14.2-.6-18.4c1-4.2 3-4.9 6.9-6.6c3.9-1.8 11.1-3.9 16.5-4c5.4-.1 10.8 1.5 15.9 3.5c5.2 2 10.9 5.8 14.9 8.6c4 2.7 7.4 3.8 9.2 8c1.7 4.3 1.3 11.3 1.5 17.7c.2 6.4.1 14.2-.4 20.6c-.4 6.3-1.8 12.9-2.2 17.6c-.4 4.7 3.9 8.1-.3 10.3c-4.1 2.2-16.4 2.9-24.7 2.9c-8.3 0-20.5.5-25.1-2.9zM84.6 46.2c-1-1.5.1-1.3.3-2.5c.2-1.1.5-2.4.9-4.5c.4-2.1.9-5.7 1.6-8c.8-2.4 1.4-4.9 3-6c1.6-1.1 4.7-1.3 6.8-.6c2.1.7 4.7 2.8 5.6 4.7c.9 2 .2 4.5-.1 6.9c-.4 2.5-1.6 5.8-2.2 7.9c-.6 2-.9 3.3-1.2 4.4c-.4 1.2.6 1.6-.8 2.3c-1.5.8-5.7 2.8-8 2c-2.3-.8-5-5.1-5.9-6.6zM69.3 39.1c-1.3-1.4-.1-.8 0-2.1c.1-1.3.3-2.9.5-5.7c.3-2.9.6-8.2 1.2-11.4c.6-3.2 1-6.2 2.7-7.8c1.7-1.5 5.1-2 7.5-1.5c2.3.5 5.4 2.4 6.6 4.6c1.2 2.2.8 5.2.6 8.5c-.2 3.3-1.4 8.4-1.8 11.2c-.5 2.8-.7 4.4-1 5.7c-.2 1.3 1 1.1-.5 2c-1.5.9-5.9 3.8-8.6 3.2c-2.6-.6-6-5.2-7.2-6.7zM53.4 36.8c-1.4-1.3-.1-.6-.2-2c0-1.4 0-3 0-6.3c0-3.2-.3-9.4.1-13.1c.3-3.6.3-6.9 1.9-8.7c1.6-1.9 5.1-2.7 7.5-2.4c2.5.2 5.9 1.8 7.4 4c1.5 2.2 1.3 5.5 1.4 9.2c.2 3.6-.5 9.7-.7 13c-.1 3.2-.2 4.8-.3 6.2c-.2 1.4 1.1.9-.4 1.9c-1.4 1.1-5.7 4.6-8.5 4.3c-2.7-.3-6.8-4.7-8.2-6.1zM49.1 106.2c-3.5-2.2-11.4-8.1-16.6-12.3c-5.3-4.1-10.5-7.9-14.6-12.6c-4.1-4.8-8.8-9.5-10-16c-1.3-6.5.7-15.7 2.6-23c1.9-7.3 6-16.5 8.5-21c2.5-4.5 4-5.5 6.5-6.2c2.5-.7 6.5.4 8.5 2.3c2 1.8 3.8 4.4 3.5 8.8c-.4 4.4-4.1 12.1-5.7 17.6c-1.6 5.6-3.7 12.7-4 15.8c-.4 3 0 1 1.8 2.6c1.9 1.7 5 4.9 9.5 7.5c4.4 2.6 12.8 4.4 17.2 8c4.3 3.6 9.6 8.8 9.1 13.7c-.4 4.8-8.9 13-11.6 15.5c-2.8 2.4-1.1 1.5-4.7-.7zM39.2 41.7c-.7-1 0-.4-.2-2c-.1-1.5-.3-3.8-.5-7.1c-.2-3.2-.5-10.3-.5-12.3c0-2 1.3.3.5.2c-.8 0-5.1.2-5.1-.6c.1-.7 5-3.9 5.4-3.9c.3.1-1.5 3.4-3.2 4.3c-1.7.9-5 1.8-7 1.1c-2-.8-4.3-3.3-4.9-5.5c-.6-2.1.8-5.8 1.2-7.4c.4-1.7-.5-1.7 1.3-2.5c1.7-.8 5.8-2.5 9.3-2.3c3.4.2 8.4.3 11.5 3.6c3.1 3.3 5.8 11.3 7.1 16.2c1.4 4.8.6 10.1.8 12.8c.2 2.7.4 2.3.4 3.5c-.1 1.2 1.2 2.9-.7 3.9c-1.9 1.1-8.3 2.6-10.8 2.3c-2.6-.3-3.8-3.2-4.6-4.3z" opacity=".07" stroke-width="9"/><path d="M50.9 91.9c-8.4 2.8-1 12.6-1.1 16.8c-.1 4.2.6 1.9.4 8.4c-.2 6.6-.9 14-1.8 30.8c-.9 16.8-2.5 42-3.7 70c-1.1 28-2.3 63-3 98c-.8 35-13 93.4-1.4 112c11.5 18.7 59 18.7 70.5 0c11.5-18.6-.6-77-1.4-112c-.7-35-1.9-70-3.1-98c-1.1-28-2.7-53.2-3.6-70c-.9-16.8-1.6-24.2-1.8-30.8c-.3-6.5.5-4.2.4-8.4c-.1-4.2 7.3-14-1.1-16.8c-8.4-2.8-40.9-2.8-49.3 0zM30.7 385.9c4.7-29.3 15-6.2 22.4-7.7c7.5-1.5 15-1.4 22.4-1.4c7.5 0 15-.1 22.4 1.4c7.5 1.5 17.8-21.6 22.4 7.7c4.7 29.3 21.5 140 5.6 168c-15.8 28-84.9 28-100.8 0c-15.8-28 1-138.7 5.6-168zM50.4 114.2c-4.6-3.4-1.2-11.3-2.2-17.6c-1.1-6.4-2.6-14-4.2-20.6c-1.5-6.6-4.2-12.9-5.2-19.1c-.9-6.3-1.7-14.2-.6-18.4c1-4.2 3-4.9 6.9-6.6c3.9-1.8 11.1-3.9 16.5-4c5.4-.1 10.8 1.5 15.9 3.5c5.2 2 10.9 5.8 14.9 8.6c4 2.7 7.4 3.8 9.2 8c1.7 4.3 1.3 11.3 1.5 17.7c.2 6.4.1 14.2-.4 20.6c-.4 6.3-1.8 12.9-2.2 17.6c-.4 4.7 3.9 8.1-.3 10.3c-4.1 2.2-16.4 2.9-24.7 2.9c-8.3 0-20.5.5-25.1-2.9zM84.6 46.2c-1-1.5.1-1.3.3-2.5c.2-1.1.5-2.4.9-4.5c.4-2.1.9-5.7 1.6-8c.8-2.4 1.4-4.9 3-6c1.6-1.1 4.7-1.3 6.8-.6c2.1.7 4.7 2.8 5.6 4.7c.9 2 .2 4.5-.1 6.9c-.4 2.5-1.6 5.8-2.2 7.9c-.6 2-.9 3.3-1.2 4.4c-.4 1.2.6 1.6-.8 2.3c-1.5.8-5.7 2.8-8 2c-2.3-.8-5-5.1-5.9-6.6zM69.3 39.1c-1.3-1.4-.1-.8 0-2.1c.1-1.3.3-2.9.5-5.7c.3-2.9.6-8.2 1.2-11.4c.6-3.2 1-6.2 2.7-7.8c1.7-1.5 5.1-2 7.5-1.5c2.3.5 5.4 2.4 6.6 4.6c1.2 2.2.8 5.2.6 8.5c-.2 3.3-1.4 8.4-1.8 11.2c-.5 2.8-.7 4.4-1 5.7c-.2 1.3 1 1.1-.5 2c-1.5.9-5.9 3.8-8.6 3.2c-2.6-.6-6-5.2-7.2-6.7zM53.4 36.8c-1.4-1.3-.1-.6-.2-2c0-1.4 0-3 0-6.3c0-3.2-.3-9.4.1-13.1c.3-3.6.3-6.9 1.9-8.7c1.6-1.9 5.1-2.7 7.5-2.4c2.5.2 5.9 1.8 7.4 4c1.5 2.2 1.3 5.5 1.4 9.2c.2 3.6-.5 9.7-.7 13c-.1 3.2-.2 4.8-.3 6.2c-.2 1.4 1.1.9-.4 1.9c-1.4 1.1-5.7 4.6-8.5 4.3c-2.7-.3-6.8-4.7-8.2-6.1zM49.1 106.2c-3.5-2.2-11.4-8.1-16.6-12.3c-5.3-4.1-10.5-7.9-14.6-12.6c-4.1-4.8-8.8-9.5-10-16c-1.3-6.5.7-15.7 2.6-23c1.9-7.3 6-16.5 8.5-21c2.5-4.5 4-5.5 6.5-6.2c2.5-.7 6.5.4 8.5 2.3c2 1.8 3.8 4.4 3.5 8.8c-.4 4.4-4.1 12.1-5.7 17.6c-1.6 5.6-3.7 12.7-4 15.8c-.4 3 0 1 1.8 2.6c1.9 1.7 5 4.9 9.5 7.5c4.4 2.6 12.8 4.4 17.2 8c4.3 3.6 9.6 8.8 9.1 13.7c-.4 4.8-8.9 13-11.6 15.5c-2.8 2.4-1.1 1.5-4.7-.7zM39.2 41.7c-.7-1 0-.4-.2-2c-.1-1.5-.3-3.8-.5-7.1c-.2-3.2-.5-10.3-.5-12.3c0-2 1.3.3.5.2c-.8 0-5.1.2-5.1-.6c.1-.7 5-3.9 5.4-3.9c.3.1-1.5 3.4-3.2 4.3c-1.7.9-5 1.8-7 1.1c-2-.8-4.3-3.3-4.9-5.5c-.6-2.1.8-5.8 1.2-7.4c.4-1.7-.5-1.7 1.3-2.5c1.7-.8 5.8-2.5 9.3-2.3c3.4.2 8.4.3 11.5 3.6c3.1 3.3 5.8 11.3 7.1 16.2c1.4 4.8.6 10.1.8 12.8c.2 2.7.4 2.3.4 3.5c-.1 1.2 1.2 2.9-.7 3.9c-1.9 1.1-8.3 2.6-10.8 2.3c-2.6-.3-3.8-3.2-4.6-4.3z" opacity=".11" stroke-width="3"/></g><g class="wh-hand" stroke-linejoin="round"><path d="M43.9 87.3c-8.4 2.8-1 12.6-1.1 16.8c-.2 4.2.6 1.8.4 8.4c-.2 6.5-.9 14-1.8 30.8c-.9 16.8-2.6 42-3.7 70c-1.1 28-2.3 63-3.1 98c-.7 35-12.9 93.3-1.4 112c11.6 18.6 59.1 18.6 70.6 0c11.5-18.7-.6-77-1.4-112c-.7-35-2-70-3.1-98c-1.1-28-2.7-53.2-3.6-70c-.9-16.8-1.6-24.3-1.8-30.8c-.3-6.6.5-4.2.4-8.4c-.1-4.2 7.3-14-1.1-16.8c-8.4-2.8-40.9-2.8-49.3 0zM43.6 109.7c-4.3-3.3-.4-10.8-1-16.8c-.6-6.1-1.6-13.3-2.6-19.6c-1.1-6.3-3.3-12.3-3.9-18.2c-.5-6-.6-13.6.7-17.5c1.3-4 3.3-4.7 7.4-6.3c4-1.7 11.4-3.8 16.8-3.8c5.4-.1 10.7 1.4 15.6 3.3c5 2 10.5 5.5 14.3 8.2c3.8 2.6 7.1 3.6 8.6 7.7c1.5 4 .5 10.7.3 16.8c-.3 6-1 13.5-1.9 19.6c-.9 6-2.7 12.3-3.5 16.8c-.7 4.4 3.4 7.7-1 9.8c-4.3 2.1-16.6 2.8-24.9 2.8c-8.3 0-20.6.4-24.9-2.8zM82.6 44.9c0-.5.2-.6.2-.8c.1-.3.1-.5.2-.7c0-.3.1-.5.1-.8c.1-.3.2-.6.3-1c.1-.5.2-.9.4-1.5c.2-.5.4-1.2.6-1.9c.2-.7.4-1.5.7-2.4c.2-.8.4-1.7.7-2.6c.2-.8.5-1.8.8-2.6c.2-.9.4-1.8.7-2.5c.3-.8.6-1.3 1-1.8c.5-.5 1-1 1.6-1.4c.7-.3 1.4-.6 2.1-.8c.8-.2 1.6-.2 2.4-.2c.8.1 1.6.2 2.4.5c.8.2 1.5.6 2.2 1c.7.4 1.3 1 1.8 1.6c.5.5.9 1.2 1.2 1.9c.3.6.5 1.3.5 2c.1.7 0 1.3-.2 2c-.2.8-.6 1.7-.9 2.5c-.3.9-.6 1.8-.9 2.6c-.3.9-.6 1.7-.9 2.6c-.3.8-.6 1.6-.9 2.3c-.2.7-.5 1.3-.6 1.9c-.2.5-.4 1-.5 1.4c-.2.4-.3.6-.4.9c-.2.3-.3.5-.4.8c-.1.2-.2.4-.3.6c-.1.3 0 .4-.3.8c-.3.4-.8 1.4-1.6 1.8c-.7.4-1.9.6-2.9.6c-1.1.1-2.5-.1-3.6-.5c-1.1-.4-2.4-1-3.2-1.7c-.9-.6-1.7-1.5-2-2.3c-.4-.7-.3-1.8-.3-2.3zM67.8 38.2c-.1-.6.1-.6.1-.8c.1-.2.1-.4.1-.6c0-.2 0-.4 0-.7c0-.3 0-.6.1-1.1c.1-.4.2-1 .3-1.7c.2-.7.4-1.6.6-2.6c.2-1 .4-2.2.6-3.3c.2-1.2.4-2.5.6-3.8c.3-1.2.5-2.5.7-3.8c.3-1.2.5-2.6.8-3.6c.2-.9.4-1.4.8-2.1c.5-.6 1-1.2 1.7-1.7c.6-.4 1.4-.8 2.2-1.1c.8-.3 1.7-.5 2.6-.5c.9 0 1.9 0 2.7.2c.9.2 1.8.5 2.6.9c.8.4 1.6 1 2.2 1.5c.6.6 1.2 1.3 1.6 2c.4.7.7 1.5.8 2.2c.1.8.1 1.3-.1 2.3c-.1 1-.5 2.3-.8 3.6c-.2 1.2-.6 2.5-.9 3.7c-.3 1.3-.6 2.5-.9 3.7c-.2 1.2-.5 2.3-.8 3.3c-.2 1-.4 1.9-.6 2.6c-.1.7-.2 1.2-.4 1.7c-.1.5-.2.8-.3 1c-.1.3-.2.5-.2.7c-.1.2-.2.3-.3.5c0 .3.1.3-.2.8c-.3.5-.7 1.6-1.5 2.1c-.8.5-2 1-3.2 1.1c-1.2.2-2.8.1-4.1-.2c-1.3-.3-2.7-.8-3.7-1.4c-1.1-.7-2-1.5-2.5-2.4c-.5-.8-.5-2-.6-2.5zM52.2 36c-.2-.6 0-.6 0-.8c0-.2 0-.3 0-.5c-.1-.2-.1-.3-.1-.6c0-.3 0-.6 0-1.1c0-.5.1-1.1.2-2c0-.8.1-1.8.2-2.9c.1-1.2.2-2.5.3-3.8c.1-1.4.2-2.9.4-4.3c.1-1.4.2-3 .3-4.4c.1-1.4.2-3.1.4-4.1c.2-1.1.3-1.6.7-2.3c.4-.7.9-1.4 1.5-1.9c.6-.6 1.4-1.1 2.2-1.5c.8-.4 1.7-.6 2.6-.8c1-.1 2-.1 2.9 0c.9.1 1.9.3 2.8.6c.8.4 1.7.8 2.4 1.3c.7.6 1.4 1.2 1.9 1.9c.4.7.8 1.5 1 2.2c.2.8.3 1.3.2 2.4c0 1.1-.3 2.7-.4 4.1c-.2 1.4-.4 3-.6 4.4c-.2 1.4-.4 2.9-.6 4.2c-.2 1.4-.3 2.7-.5 3.8c-.1 1.1-.2 2.2-.3 3c-.1.8-.2 1.4-.3 1.9c-.1.5-.1.8-.2 1.1c-.1.2-.1.4-.2.6c0 .2-.1.3-.1.5c-.1.2.1.2-.2.7c-.2.5-.6 1.7-1.3 2.4c-.8.6-2 1.2-3.3 1.5c-1.2.3-2.8.3-4.2.2c-1.4-.1-2.9-.6-4-1.1c-1.2-.5-2.3-1.3-2.9-2.1c-.6-.8-.7-2.1-.8-2.6zM42.9 102.1c-1.6-.7-3.4-2.3-5.2-3.6c-1.7-1.2-3.4-2.5-5.2-3.9c-1.8-1.4-3.6-2.8-5.4-4.3c-1.8-1.4-3.6-2.9-5.3-4.3c-1.6-1.4-3.2-2.9-4.6-4.1c-1.4-1.3-2.6-2.4-3.8-3.6c-1.2-1.2-2.3-2.3-3.4-3.8c-1.1-1.4-2.4-3.1-3.3-5c-.9-1.9-1.7-4.1-2.2-6.4c-.4-2.3-.5-4.8-.3-7.3c.2-2.4.9-5 1.6-7.4c.8-2.5 1.9-4.9 3-7.2c1.1-2.4 2.4-4.7 3.6-7c1.2-2.2 2.4-4.4 3.5-6.6c1.1-2.2 2.2-4.9 3-6.4c.8-1.5 1-1.9 1.7-2.7c.7-.8 1.5-1.5 2.4-2c.8-.6 1.8-1 2.8-1.2c1-.3 2-.3 3-.3c1 .1 2 .4 2.8.8c.9.4 1.8 1 2.5 1.6c.7.7 1.3 1.5 1.8 2.4c.5.9.8 1.9 1 2.9c.2 1 .2 2.1 0 3.2c-.1 1-.2 1.4-.8 3c-.7 1.7-1.9 4.5-3 6.8c-1 2.3-2.1 4.7-3.1 7c-1 2.2-1.9 4.5-2.7 6.4c-.8 2-1.4 3.8-1.8 5.3c-.4 1.4-.5 2.5-.6 3.2c-.1.8.1 1 .2 1.3c.1.3.2.2.4.4c.3.2.5.4 1.1.9c.5.4 1.3 1.1 2.2 1.9c.9.7 1.9 1.7 3 2.6c1.1.9 2.3 1.8 3.7 2.6c1.4.8 3 1.5 4.8 2.3c1.7.8 3.7 1.6 5.7 2.5c1.9.9 4.1 1.8 6.1 2.8c1.9 1 4.3 2 5.7 3.2c1.3 1.1 2.1 2.2 2.6 3.8c.4 1.6.3 3.9-.1 6c-.5 2.1-1.5 4.6-2.8 6.6c-1.2 2-3 4.1-4.7 5.4c-1.6 1.4-3.7 2.4-5.3 2.8c-1.7.3-3 0-4.6-.6zM37.6 40.6c-.2-.5 0-.5 0-.7c0-.2 0-.3 0-.5c0-.2 0-.4 0-.7c-.1-.2-.1-.5-.1-1c0-.6-.1-1.3-.1-2.2c0-1 .1-2.2.1-3.5c.1-1.3.2-2.9.3-4.3c.1-1.4.2-2.9.2-4.2c0-1.2 0-2.6-.1-3.3c0-.6-.1-.8 0-.7c.1 0 .6.8.7.9c.1.2.1.1-.2.1c-.3-.1-.9-.2-1.4-.3c-.6 0-1.5-.1-2.1-.2c-.6 0-1.4-.1-1.5-.1c-.2-.1.1.1.8-.2c.7-.3 2.6-1.1 3.4-1.7c.8-.6 1.2-1.7 1.4-1.8c.1-.2-.3.6-.6.9c-.2.4-.5.9-1 1.4c-.5.5-1.2 1.2-1.9 1.7c-.7.5-1.4.9-2.2 1.1c-.8.3-1.7.4-2.5.4c-.8 0-1.6-.2-2.3-.5c-.8-.2-1.5-.6-2.1-1.1c-.6-.5-1.2-1.1-1.6-1.8c-.4-.7-.7-1.4-.9-2.2c-.2-.8-.2-1.7-.1-2.5c0-.8.2-1.7.6-2.4c.3-.8 1.1-1.9 1.2-2.2c.2-.3-.2.4-.3.5c0 0-.4.4-.1-.1c.3-.5.8-1.9 1.9-2.8c1.1-.8 3.3-1.9 4.5-2.3c1.2-.4 2.1-.1 2.9-.1c.9 0 1.2.1 2.1.2c.8.1 1.7.1 2.8.3c1.2.2 2.5.4 3.9.9c1.4.5 3.1 1.1 4.5 2.3c1.5 1.1 3.1 3 4.1 4.7c.9 1.7 1.2 3.7 1.5 5.5c.4 1.7.4 3.5.4 5.2c.1 1.7 0 3.4 0 5c0 1.5-.1 3-.1 4.2c0 1.2 0 2.2 0 2.9c0 .8 0 1.2 0 1.7c.1.4.1.8.1 1.1c0 .3 0 .4 0 .6c0 .2 0 .3 0 .5c0 .2.2.2 0 .8c-.1.5-.3 1.7-1 2.4c-.6.8-1.7 1.5-2.9 1.9c-1.1.5-2.6.8-4 .8c-1.3.1-2.9-.1-4.1-.5c-1.2-.4-2.3-1-3-1.7c-.7-.6-1-1.8-1.2-2.4z" fill="none" stroke="#b97754" stroke-width="3.2"/><path d="M23.7 381.3c4.7-29.3 15-6.2 22.4-7.7c7.5-1.6 15-1.4 22.4-1.4c7.5 0 15-.2 22.4 1.4c7.5 1.5 17.8-21.6 22.4 7.7c4.7 29.2 21.5 140 5.6 168c-15.8 28-84.9 28-100.8 0c-15.8-28 1-138.8 5.6-168z" fill="none" stroke="#3d7853" stroke-width="3.2"/><path d="M43.9 87.3c-8.4 2.8-1 12.6-1.1 16.8c-.2 4.2.6 1.8.4 8.4c-.2 6.5-.9 14-1.8 30.8c-.9 16.8-2.6 42-3.7 70c-1.1 28-2.3 63-3.1 98c-.7 35-12.9 93.3-1.4 112c11.6 18.6 59.1 18.6 70.6 0c11.5-18.7-.6-77-1.4-112c-.7-35-2-70-3.1-98c-1.1-28-2.7-53.2-3.6-70c-.9-16.8-1.6-24.3-1.8-30.8c-.3-6.6.5-4.2.4-8.4c-.1-4.2 7.3-14-1.1-16.8c-8.4-2.8-40.9-2.8-49.3 0z" fill="#f4c5a0"/><path d="M93.3 112.5c1.8 4.9 1.4 14 2.4 30.8c1 16.8 2.5 42 3.6 70c1.1 28 2.4 63 3.1 98c.8 35 4.1 93.3 1.4 112c-2.7 18.6-14.7 18.6-17.8 0c-3.1-18.7-.3-77-.7-112c-.3-35-1-70-1.4-98c-.3-28-.7-53.5-.5-70c.1-16.6-.3-24.3 1.4-29.4c1.6-5.2 6.7-6.3 8.5-1.4z" fill="#e8b089"/><path d="M95.7 148.9c1.3 10.2 2.5 37.3 3.6 64.4c1.1 27 2.4 63 3.1 98c.8 35 2.1 93.3 1.4 112c-.7 18.6-4.4 18.6-5.6 0c-1.2-18.7-.7-77-1.4-112c-.7-35-1.9-71.4-2.8-98c-.9-26.6-2.8-50.9-2.5-61.6c.3-10.8 2.9-13.1 4.2-2.8z" fill="#d89a74" fill-opacity="0.45"/><path d="M41.9 134.9c-.4 10.7-1.8 37.3-2.8 64.4c-1 27-2.5 81.6-3.1 98" fill="none" stroke="#fcdcc1" stroke-width="2.8" stroke-linecap="round" stroke-opacity="0.6"/><path d="M43.6 108.3c2.3.8 9.4 3.8 13.6 4.7c4.1 1 7.5.9 11.3.9c3.8 0 7.2.1 11.4-.9c4.1-.9 11.3-3.9 13.5-4.7" fill="none" stroke="#cf8c67" stroke-width="1" stroke-linecap="round" stroke-opacity="0.65"/><path d="M54.7 117.5c2.3.2 9.6 1.2 13.8 1.3c4.2 0 9.5-.9 11.4-1" fill="none" stroke="#cf8c67" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.3"/><path d="M34.1 376.4c5.7 1 22.9.4 34.4.4c11.5 0 28.8.6 34.5-.4c5.7-1.1 5.4-4.7-.3-5.8c-5.8-1.1-22.8-.8-34.2-.8c-11.4 0-28.4-.3-34.1.8c-5.8 1.1-6 4.7-.3 5.8z" fill="#d89a74" fill-opacity="0.35"/><path d="M23.7 381.3c4.7-29.3 15-6.2 22.4-7.7c7.5-1.6 15-1.4 22.4-1.4c7.5 0 15-.2 22.4 1.4c7.5 1.5 17.8-21.6 22.4 7.7c4.7 29.2 21.5 140 5.6 168c-15.8 28-84.9 28-100.8 0c-15.8-28 1-138.8 5.6-168z" fill="#5ca679"/><path d="M93.2 373.8c1.8-1.4 15.8-21.8 20.1 7.5c4.3 29.2 7.7 140 5.6 168c-2.1 28-15.4 26.6-18.2 0c-2.8-26.6 2.7-130.4 1.4-159.6c-1.2-29.3-10.8-14.5-8.9-15.9z" fill="#4b8f65"/><path d="M25.1 382c3.5-1.1 13.8-5.3 21-6.6c7.3-1.4 15.7-1.4 22.4-1.4c6.7-.1 15 .9 17.9 1.1" fill="none" stroke="#79bc91" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.8"/><path d="M24.4 388.3c3.6-1.3 14.4-6.1 21.7-7.6c7.4-1.5 15-1.3 22.4-1.3c7.5 0 15.1-.2 22.4 1.3c7.4 1.5 18.1 6.3 21.7 7.6" fill="none" stroke="#3d7853" stroke-width=".8" stroke-dasharray="1.8 1.6" stroke-opacity="0.5"/><path d="M23.7 381.3c3.8-1.3 15-6.2 22.4-7.7c7.5-1.6 15-1.4 22.4-1.4c7.5 0 15-.2 22.4 1.4c7.5 1.5 18.7 6.4 22.4 7.7" fill="none" stroke="#3d7853" stroke-width="1"/><path d="M43.6 109.7c-4.3-3.3-.4-10.8-1-16.8c-.6-6.1-1.6-13.3-2.6-19.6c-1.1-6.3-3.3-12.3-3.9-18.2c-.5-6-.6-13.6.7-17.5c1.3-4 3.3-4.7 7.4-6.3c4-1.7 11.4-3.8 16.8-3.8c5.4-.1 10.7 1.4 15.6 3.3c5 2 10.5 5.5 14.3 8.2c3.8 2.6 7.1 3.6 8.6 7.7c1.5 4 .5 10.7.3 16.8c-.3 6-1 13.5-1.9 19.6c-.9 6-2.7 12.3-3.5 16.8c-.7 4.4 3.4 7.7-1 9.8c-4.3 2.1-16.6 2.8-24.9 2.8c-8.3 0-20.6.4-24.9-2.8z" fill="#f4c5a0"/><path d="M99.5 46.7c1.8 3.3.5 10.7.3 16.8c-.3 6-1 13.5-1.9 19.6c-.9 6-2.7 12.1-3.5 16.8c-.7 4.6 1.1 9.3-1 11.2c-2.1 1.8-9.8 3.5-11.6 0c-1.7-3.5.8-14.3 1.3-21c.5-6.8.9-13.8 1.7-19.6c.7-5.9 2.1-10.9 2.8-15.4c.6-4.6-.8-10.5 1.2-11.9c2-1.4 8.9.1 10.7 3.5z" fill="#e8b089" fill-opacity="0.75"/><path d="M99.5 48.1c1 2.1.3 9.5 0 15.4c-.3 5.8-1.1 13.5-2 19.6c-.9 6-2.7 12.1-3.4 16.8c-.6 4.6.3 9.3-.7 11.2c-.9 1.8-4 3.9-4.7 0c-.7-4 .2-16.6.5-23.8c.4-7.3 1.1-13.6 1.7-19.6c.7-6.1.8-13.6 2.3-16.8c1.4-3.3 5.2-4.9 6.3-2.8z" fill="#e8b089"/><path d="M99.2 50.9c.6 1.6.4 7.2 0 12.6c-.3 5.3-1.2 13.5-2.1 19.6c-.9 6-2.5 12.1-3.1 16.8c-.6 4.6-.1 9.3-.6 11.2c-.4 1.8-1.7 4.4-1.9 0c-.2-4.5-.2-17.1.5-26.6c.7-9.6 2.5-25.2 3.7-30.8c1.2-5.6 2.9-4.5 3.5-2.8z" fill="#d89a74" fill-opacity="0.5"/><path d="M74 61.5c.3 2.4.4 5 .3 7.4c-.1 2.4-.4 4.8-1 6.8c-.6 2.1-1.4 4.1-2.3 5.7c-1 1.6-2.2 2.9-3.4 3.9c-1.3.9-2.7 1.5-4.2 1.7c-1.4.2-2.9 0-4.4-.5c-1.5-.6-3-1.6-4.3-2.8c-1.4-1.3-2.7-3-3.8-4.8c-1.2-1.9-2.2-4.1-2.9-6.3c-.8-2.3-1.4-4.8-1.7-7.2c-.4-2.4-.5-5-.4-7.4c.1-2.3.5-4.7 1.1-6.8c.5-2.1 1.3-4.1 2.3-5.7c.9-1.6 2.1-2.9 3.4-3.9c1.2-.9 2.7-1.5 4.1-1.7c1.4-.2 3 0 4.5.5c1.4.6 2.9 1.6 4.3 2.8c1.3 1.3 2.7 3 3.8 4.8c1.1 1.9 2.1 4.1 2.9 6.3c.8 2.3 1.3 4.8 1.7 7.2z" fill="#fcdcc1" fill-opacity="0.13"/><path d="M67.7 60.8c.3 2 .4 4.1.3 6c-.1 1.9-.4 3.8-.8 5.4c-.5 1.6-1.1 3.1-1.9 4.2c-.7 1.1-1.6 2-2.6 2.5c-1 .5-2.1.6-3.1.4c-1.1-.2-2.2-.7-3.3-1.6c-1-.9-2-2.1-2.9-3.5c-.9-1.5-1.7-3.2-2.3-5c-.6-1.8-1.1-3.9-1.4-5.9c-.3-2-.4-4.1-.3-6c.1-1.9.4-3.8.9-5.4c.4-1.6 1.1-3.1 1.8-4.2c.8-1.1 1.7-2 2.7-2.5c.9-.5 2-.6 3.1-.4c1.1.2 2.2.8 3.2 1.6c1 .9 2.1 2.1 3 3.5c.8 1.5 1.6 3.2 2.3 5c.6 1.8 1.1 3.9 1.3 5.9z" fill="#fcdcc1" fill-opacity="0.13"/><path d="M82.6 44.9c0-.5.2-.6.2-.8c.1-.3.1-.5.2-.7c0-.3.1-.5.1-.8c.1-.3.2-.6.3-1c.1-.5.2-.9.4-1.5c.2-.5.4-1.2.6-1.9c.2-.7.4-1.5.7-2.4c.2-.8.4-1.7.7-2.6c.2-.8.5-1.8.8-2.6c.2-.9.4-1.8.7-2.5c.3-.8.6-1.3 1-1.8c.5-.5 1-1 1.6-1.4c.7-.3 1.4-.6 2.1-.8c.8-.2 1.6-.2 2.4-.2c.8.1 1.6.2 2.4.5c.8.2 1.5.6 2.2 1c.7.4 1.3 1 1.8 1.6c.5.5.9 1.2 1.2 1.9c.3.6.5 1.3.5 2c.1.7 0 1.3-.2 2c-.2.8-.6 1.7-.9 2.5c-.3.9-.6 1.8-.9 2.6c-.3.9-.6 1.7-.9 2.6c-.3.8-.6 1.6-.9 2.3c-.2.7-.5 1.3-.6 1.9c-.2.5-.4 1-.5 1.4c-.2.4-.3.6-.4.9c-.2.3-.3.5-.4.8c-.1.2-.2.4-.3.6c-.1.3 0 .4-.3.8c-.3.4-.8 1.4-1.6 1.8c-.7.4-1.9.6-2.9.6c-1.1.1-2.5-.1-3.6-.5c-1.1-.4-2.4-1-3.2-1.7c-.9-.6-1.7-1.5-2-2.3c-.4-.7-.3-1.8-.3-2.3z" fill="#f4c5a0"/><path d="M96.8 47.9c.1-.2.2-.5.4-.8c.1-.3.2-.5.4-.9c.1-.4.3-.9.5-1.4c.1-.6.4-1.2.6-1.9c.3-.7.6-1.5.9-2.3c.3-.9.6-1.7.9-2.6c.3-.8.6-1.7.9-2.6c.3-.8.7-2.1.9-2.5c.1-.4.2-.4 0 0c-.2.4-.7 1.6-1.4 2.4c-.6.7-1.6 1.4-2.5 2c-.8.7-1.8 1.4-2.4 2.1c-.6.7-1 1.5-1.3 2.2c-.3.6-.7 1.2-.6 1.9c0 .6.4 1.2.9 1.8c.4.6 1.4 1.3 1.7 1.7c.4.4.1.7.1.9c0 .1 0 .1 0 0z" fill="#e8b089"/><path d="M98.6 22.9c.2.1.8.5 1.1.8c.4.3.7.6 1 .9c.4.4.6.8.9 1.2c.2.4.4.8.6 1.3c.2.4.3.9.4 1.4c.1.5.1 1 .1 1.5c0 .5 0 1-.1 1.5c0 .4-.3 1.2-.3 1.4c-.1.3.1.3 0 0c-.1-.2-.5-1.1-.7-1.6c-.2-.4-.3-.8-.5-1.2c-.1-.4-.3-.8-.4-1.1c-.2-.4-.3-.7-.4-1c-.2-.4-.3-.7-.4-1.1c-.1-.3-.2-.7-.4-1.1c-.1-.4-.3-.7-.4-1.2c-.2-.5-.4-1.4-.5-1.7c-.1-.3-.2-.1 0 0z" fill="#e8b089"/><path d="M97.6 46.2c.1-.3.3-.9.5-1.4c.1-.6.4-1.2.6-1.9c.3-.7.6-1.5.9-2.3c.3-.9.6-1.7.9-2.6c.3-.8.8-2.2.9-2.6c.2-.4.3-.4 0 0c-.2.4-.8 1.7-1.3 2.5c-.5.8-1.2 1.6-1.6 2.3c-.5.8-1 1.5-1.2 2.2c-.2.7 0 1.5 0 2.1c.1.7.2 1.4.2 1.7c.1.2 0 .2.1 0z" fill="#d89a74" fill-opacity="0.5"/><path d="M88.8 25.3c.4-.4 1.3-1.4 2.1-1.9c.7-.5 1.6-.9 2.5-1.1c.8-.2 1.8-.3 2.6-.2c.9.1 1.8.4 2.6.8c.7.4 1.5 1 2.1 1.6c.6.7 1.1 1.5 1.4 2.4c.3.8.6 1.8.6 2.7c.1.9-.2 2.3-.3 2.8c0 .5.2.5 0 0c-.1-.4-.6-1.9-.9-2.7c-.3-.8-.7-1.4-1.1-2c-.4-.6-.9-1-1.4-1.5c-.5-.4-1-.7-1.6-1c-.5-.3-1.1-.5-1.7-.7c-.6-.2-1.3-.3-2-.3c-.7 0-1.4.1-2.2.3c-.8.1-2.2.6-2.7.8c-.4.1-.3.3 0 0z" fill="#e8b089" fill-opacity="0.8"/><path d="M95.3 32.7c-.2.4-.6.9-1.1 1.1c-.5.3-1.2.4-1.8.3c-.6 0-1.4-.3-1.9-.6c-.6-.3-1.1-.9-1.4-1.3c-.2-.5-.3-1.1-.1-1.5c.1-.5.5-.9 1-1.2c.5-.2 1.2-.3 1.8-.3c.7.1 1.4.3 2 .7c.5.3 1 .8 1.3 1.3c.2.5.3 1.1.2 1.5z" fill="#fcdcc1" fill-opacity="0.55"/><path d="M85.1 35.8c.1-.4.4-1.7.7-2.6c.2-.8.5-1.8.8-2.6c.2-.9.4-1.8.7-2.5c.3-.8.6-1.3 1-1.8c.5-.5 1-1 1.6-1.4c.7-.3 1.4-.6 2.1-.8c.8-.2 1.6-.2 2.4-.2c.8.1 1.6.2 2.4.5c.8.2 1.5.6 2.2 1c.7.4 1.3 1 1.8 1.6c.5.5.9 1.2 1.2 1.9c.3.6.5 1.3.5 2c.1.7 0 1.3-.2 2c-.2.8-.6 1.7-.9 2.5c-.3.9-.6 1.8-.9 2.6c-.3.9-.6 1.7-.9 2.6c-.3.8-.6 1.6-.9 2.3c-.2.7-.5 1.6-.6 1.9" fill="none" stroke="#b97754" stroke-width="1"/><path d="M95.6 34.1c-.2.1-.6.2-.9.2c-.4.1-.6.1-.9.1c-.3 0-.6-.1-.9-.2c-.2-.1-.5-.2-.7-.3c-.3-.2-.5-.4-.7-.6c-.2-.2-.5-.6-.6-.7" fill="none" stroke="#cf8c67" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M67.8 38.2c-.1-.6.1-.6.1-.8c.1-.2.1-.4.1-.6c0-.2 0-.4 0-.7c0-.3 0-.6.1-1.1c.1-.4.2-1 .3-1.7c.2-.7.4-1.6.6-2.6c.2-1 .4-2.2.6-3.3c.2-1.2.4-2.5.6-3.8c.3-1.2.5-2.5.7-3.8c.3-1.2.5-2.6.8-3.6c.2-.9.4-1.4.8-2.1c.5-.6 1-1.2 1.7-1.7c.6-.4 1.4-.8 2.2-1.1c.8-.3 1.7-.5 2.6-.5c.9 0 1.9 0 2.7.2c.9.2 1.8.5 2.6.9c.8.4 1.6 1 2.2 1.5c.6.6 1.2 1.3 1.6 2c.4.7.7 1.5.8 2.2c.1.8.1 1.3-.1 2.3c-.1 1-.5 2.3-.8 3.6c-.2 1.2-.6 2.5-.9 3.7c-.3 1.3-.6 2.5-.9 3.7c-.2 1.2-.5 2.3-.8 3.3c-.2 1-.4 1.9-.6 2.6c-.1.7-.2 1.2-.4 1.7c-.1.5-.2.8-.3 1c-.1.3-.2.5-.2.7c-.1.2-.2.3-.3.5c0 .3.1.3-.2.8c-.3.5-.7 1.6-1.5 2.1c-.8.5-2 1-3.2 1.1c-1.2.2-2.8.1-4.1-.2c-1.3-.3-2.7-.8-3.7-1.4c-1.1-.7-2-1.5-2.5-2.4c-.5-.8-.5-2-.6-2.5z" fill="#f4c5a0"/><path d="M83.9 40.2c0-.1.1-.4.2-.7c.1-.2.2-.5.3-1c.2-.5.3-1 .4-1.7c.2-.7.4-1.6.6-2.6c.3-1 .6-2.1.8-3.3c.3-1.2.6-2.4.9-3.7c.3-1.2.7-2.5.9-3.7c.3-1.3.7-3 .8-3.6c.2-.6.3-.6 0 0c-.2.6-.7 2.3-1.3 3.4c-.7 1.2-1.8 2.3-2.7 3.4c-.9 1.1-2 2.2-2.7 3.3c-.6 1.1-1 2.2-1.3 3.2c-.3 1-.7 1.8-.5 2.6c.1.8.6 1.5 1.2 2.1c.5.6 1.7 1.2 2.1 1.5c.4.4.2.7.3.8c0 .1-.1.1 0 0z" fill="#e8b089"/><path d="M83.5 9.2c.3.1 1 .4 1.4.7c.5.3.9.6 1.3 1c.4.3.7.7 1 1.1c.3.5.6.9.9 1.4c.2.5.4 1 .6 1.5c.1.6.2 1.1.3 1.7c.1.5.1 1.1.1 1.6c-.1.6-.2 1.4-.3 1.7c0 .3.2.3 0 0c-.1-.3-.6-1.2-.9-1.7c-.3-.5-.5-.9-.7-1.3c-.2-.4-.4-.8-.6-1.2c-.2-.4-.4-.7-.6-1.1c-.1-.3-.3-.7-.5-1.1c-.2-.4-.3-.7-.5-1.2c-.2-.4-.5-.8-.7-1.3c-.2-.5-.6-1.5-.8-1.8c-.1-.3-.2-.1 0 0z" fill="#e8b089"/><path d="M84.4 38.5c.1-.3.3-1 .4-1.7c.2-.7.4-1.6.6-2.6c.3-1 .6-2.1.8-3.3c.3-1.2.6-2.4.9-3.7c.3-1.2.8-3.1.9-3.7c.2-.7.3-.6 0 0c-.2.6-.8 2.4-1.3 3.6c-.5 1.2-1.2 2.4-1.7 3.5c-.5 1.1-1 2.2-1.2 3.2c-.1 1 .1 2 .2 2.8c.1.8.3 1.6.4 1.9c.1.3 0 .3 0 0z" fill="#d89a74" fill-opacity="0.5"/><path d="M73 12.9c.3-.3 1.3-1.7 2.1-2.3c.7-.6 1.7-1.2 2.6-1.5c.9-.3 2-.5 2.9-.5c1 0 2 .2 2.9.6c.9.3 1.8.9 2.6 1.6c.7.6 1.4 1.5 1.8 2.4c.5.9.9 1.9 1 2.9c.2 1 0 2.7 0 3.2c0 .5.3.5 0 0c-.2-.5-.8-2.1-1.3-2.9c-.5-.8-.9-1.5-1.5-2.1c-.5-.6-1.1-1.1-1.7-1.5c-.6-.4-1.2-.7-1.8-1c-.7-.2-1.4-.4-2.1-.5c-.7-.1-1.4-.2-2.2-.1c-.8.1-1.6.3-2.4.5c-.9.3-2.4 1-2.9 1.2c-.5.2-.3.4 0 0z" fill="#e8b089" fill-opacity="0.8"/><path d="M81 20.5c-.1.5-.5 1-1 1.3c-.5.3-1.3.6-2 .6c-.7 0-1.6-.2-2.2-.5c-.7-.3-1.3-.8-1.6-1.3c-.4-.5-.5-1.2-.4-1.7c.1-.5.5-1 1-1.3c.5-.4 1.3-.6 2-.6c.7 0 1.6.2 2.2.5c.7.3 1.3.8 1.6 1.3c.4.5.5 1.2.4 1.7z" fill="#fcdcc1" fill-opacity="0.55"/><path d="M69 30.7c.1-.6.4-2.2.6-3.3c.2-1.2.4-2.5.6-3.8c.3-1.2.5-2.5.7-3.8c.3-1.2.5-2.6.8-3.6c.2-.9.4-1.4.8-2.1c.5-.6 1-1.2 1.7-1.7c.6-.4 1.4-.8 2.2-1.1c.8-.3 1.7-.5 2.6-.5c.9 0 1.9 0 2.7.2c.9.2 1.8.5 2.6.9c.8.4 1.6 1 2.2 1.5c.6.6 1.2 1.3 1.6 2c.4.7.7 1.5.8 2.2c.1.8.1 1.3-.1 2.3c-.1 1-.5 2.3-.8 3.6c-.2 1.2-.6 2.5-.9 3.7c-.3 1.3-.6 2.5-.9 3.7c-.2 1.2-.5 2.3-.8 3.3c-.2 1-.5 2.1-.6 2.6" fill="none" stroke="#b97754" stroke-width="1"/><path d="M81.4 22.6c-.1.1-.7.3-1 .4c-.3.1-.7.1-1 .2c-.3 0-.6-.1-.9-.1c-.3-.1-.6-.2-.9-.3c-.3-.2-.6-.4-.9-.6c-.2-.2-.6-.6-.7-.7" fill="none" stroke="#cf8c67" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M52.2 36c-.2-.6 0-.6 0-.8c0-.2 0-.3 0-.5c-.1-.2-.1-.3-.1-.6c0-.3 0-.6 0-1.1c0-.5.1-1.1.2-2c0-.8.1-1.8.2-2.9c.1-1.2.2-2.5.3-3.8c.1-1.4.2-2.9.4-4.3c.1-1.4.2-3 .3-4.4c.1-1.4.2-3.1.4-4.1c.2-1.1.3-1.6.7-2.3c.4-.7.9-1.4 1.5-1.9c.6-.6 1.4-1.1 2.2-1.5c.8-.4 1.7-.6 2.6-.8c1-.1 2-.1 2.9 0c.9.1 1.9.3 2.8.6c.8.4 1.7.8 2.4 1.3c.7.6 1.4 1.2 1.9 1.9c.4.7.8 1.5 1 2.2c.2.8.3 1.3.2 2.4c0 1.1-.3 2.7-.4 4.1c-.2 1.4-.4 3-.6 4.4c-.2 1.4-.4 2.9-.6 4.2c-.2 1.4-.3 2.7-.5 3.8c-.1 1.1-.2 2.2-.3 3c-.1.8-.2 1.4-.3 1.9c-.1.5-.1.8-.2 1.1c-.1.2-.1.4-.2.6c0 .2-.1.3-.1.5c-.1.2.1.2-.2.7c-.2.5-.6 1.7-1.3 2.4c-.8.6-2 1.2-3.3 1.5c-1.2.3-2.8.3-4.2.2c-1.4-.1-2.9-.6-4-1.1c-1.2-.5-2.3-1.3-2.9-2.1c-.6-.8-.7-2.1-.8-2.6z" fill="#f4c5a0"/><path d="M69 36.5c0-.1.1-.4.2-.6c.1-.3.1-.6.2-1.1c.1-.5.2-1.1.3-1.9c.1-.8.2-1.9.3-3c.2-1.1.3-2.4.5-3.8c.2-1.3.4-2.8.6-4.2c.2-1.4.4-3 .6-4.4c.1-1.4.3-3.4.4-4.1c.1-.7.2-.7 0 0c-.2.7-.5 2.7-1 4.1c-.6 1.3-1.7 2.8-2.5 4.1c-.8 1.4-1.9 2.8-2.4 4.1c-.6 1.3-.9 2.6-1.1 3.7c-.2 1.1-.5 2.1-.3 3c.2.8.8 1.5 1.5 2.1c.6.5 1.9 1 2.4 1.3c.5.3.3.6.3.7c.1.1 0 .1 0 0z" fill="#e8b089"/><path d="M65.5 2.9c.2.1 1 .3 1.5.5c.5.3.9.6 1.4.9c.4.3.8.7 1.2 1.1c.4.4.7.9 1 1.4c.3.4.6 1 .8 1.5c.2.5.4 1.1.5 1.6c.2.6.2 1.2.3 1.7c0 .6-.1 1.5-.1 1.8c0 .3.2.3 0 0c-.2-.3-.8-1.2-1.1-1.7c-.4-.4-.6-.9-.9-1.3c-.3-.4-.5-.7-.8-1.1c-.2-.4-.4-.7-.7-1.1c-.2-.3-.4-.7-.6-1c-.2-.4-.5-.8-.7-1.2c-.3-.5-.5-.8-.8-1.4c-.3-.5-.9-1.4-1-1.7c-.2-.3-.3-.1 0 0z" fill="#e8b089"/><path d="M69.4 34.8c.1-.3.2-1.1.3-1.9c.1-.8.2-1.9.3-3c.2-1.1.3-2.4.5-3.8c.2-1.3.4-2.8.6-4.2c.2-1.4.5-3.6.6-4.4c0-.7.1-.7 0 0c-.2.7-.7 2.9-1.1 4.3c-.4 1.5-1 2.9-1.4 4.2c-.4 1.3-.8 2.6-.9 3.7c-.1 1.2.3 2.2.5 3.1c.2.8.5 1.6.6 2c.1.3 0 .3 0 0z" fill="#d89a74" fill-opacity="0.5"/><path d="M54.9 7.9c.3-.4 1.2-1.9 1.9-2.6c.8-.8 1.7-1.4 2.6-1.9c.9-.4 2-.7 3-.8c1-.1 2.1 0 3.1.3c.9.2 1.9.7 2.8 1.3c.8.6 1.6 1.4 2.2 2.3c.5.9 1 1.9 1.3 3c.3 1 .3 2.7.4 3.3c0 .5.3.4 0 0c-.3-.5-1.2-2.1-1.7-2.9c-.6-.8-1.2-1.4-1.8-2c-.6-.6-1.3-1-1.9-1.3c-.7-.4-1.4-.7-2.1-.9c-.7-.2-1.4-.3-2.1-.3c-.8-.1-1.5 0-2.3.1c-.9.2-1.7.5-2.5.9c-.9.4-2.4 1.3-2.9 1.5c-.4.3-.3.5 0 0z" fill="#e8b089" fill-opacity="0.8"/><path d="M64.1 14.8c-.1.6-.5 1.2-.9 1.6c-.5.4-1.3.7-2.1.8c-.7.1-1.6 0-2.3-.3c-.7-.2-1.4-.7-1.8-1.2c-.4-.5-.7-1.1-.6-1.7c.1-.5.4-1.1.9-1.5c.5-.4 1.3-.7 2-.8c.7-.1 1.7 0 2.4.3c.7.2 1.4.7 1.8 1.2c.4.4.6 1.1.6 1.6z" fill="#fcdcc1" fill-opacity="0.55"/><path d="M52.3 31c0-.5.1-1.8.2-2.9c.1-1.2.2-2.5.3-3.8c.1-1.4.2-2.9.4-4.3c.1-1.4.2-3 .3-4.4c.1-1.4.2-3.1.4-4.1c.2-1.1.3-1.6.7-2.3c.4-.7.9-1.4 1.5-1.9c.6-.6 1.4-1.1 2.2-1.5c.8-.4 1.7-.6 2.6-.8c1-.1 2-.1 2.9 0c.9.1 1.9.3 2.8.6c.8.4 1.7.8 2.4 1.3c.7.6 1.4 1.2 1.9 1.9c.4.7.8 1.5 1 2.2c.2.8.3 1.3.2 2.4c0 1.1-.3 2.7-.4 4.1c-.2 1.4-.4 3-.6 4.4c-.2 1.4-.4 2.9-.6 4.2c-.2 1.4-.4 3.2-.5 3.8" fill="none" stroke="#b97754" stroke-width="1"/><path d="M64.7 17.4c-.2 0-.7.3-1 .5c-.4.1-.7.2-1 .2c-.4.1-.7.1-1 0c-.3 0-.7-.1-1-.2c-.3-.1-.6-.3-.9-.4c-.3-.2-.8-.6-.9-.8" fill="none" stroke="#cf8c67" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M42.9 102.1c-1.6-.7-3.4-2.3-5.2-3.6c-1.7-1.2-3.4-2.5-5.2-3.9c-1.8-1.4-3.6-2.8-5.4-4.3c-1.8-1.4-3.6-2.9-5.3-4.3c-1.6-1.4-3.2-2.9-4.6-4.1c-1.4-1.3-2.6-2.4-3.8-3.6c-1.2-1.2-2.3-2.3-3.4-3.8c-1.1-1.4-2.4-3.1-3.3-5c-.9-1.9-1.7-4.1-2.2-6.4c-.4-2.3-.5-4.8-.3-7.3c.2-2.4.9-5 1.6-7.4c.8-2.5 1.9-4.9 3-7.2c1.1-2.4 2.4-4.7 3.6-7c1.2-2.2 2.4-4.4 3.5-6.6c1.1-2.2 2.2-4.9 3-6.4c.8-1.5 1-1.9 1.7-2.7c.7-.8 1.5-1.5 2.4-2c.8-.6 1.8-1 2.8-1.2c1-.3 2-.3 3-.3c1 .1 2 .4 2.8.8c.9.4 1.8 1 2.5 1.6c.7.7 1.3 1.5 1.8 2.4c.5.9.8 1.9 1 2.9c.2 1 .2 2.1 0 3.2c-.1 1-.2 1.4-.8 3c-.7 1.7-1.9 4.5-3 6.8c-1 2.3-2.1 4.7-3.1 7c-1 2.2-1.9 4.5-2.7 6.4c-.8 2-1.4 3.8-1.8 5.3c-.4 1.4-.5 2.5-.6 3.2c-.1.8.1 1 .2 1.3c.1.3.2.2.4.4c.3.2.5.4 1.1.9c.5.4 1.3 1.1 2.2 1.9c.9.7 1.9 1.7 3 2.6c1.1.9 2.3 1.8 3.7 2.6c1.4.8 3 1.5 4.8 2.3c1.7.8 3.7 1.6 5.7 2.5c1.9.9 4.1 1.8 6.1 2.8c1.9 1 4.3 2 5.7 3.2c1.3 1.1 2.1 2.2 2.6 3.8c.4 1.6.3 3.9-.1 6c-.5 2.1-1.5 4.6-2.8 6.6c-1.2 2-3 4.1-4.7 5.4c-1.6 1.4-3.7 2.4-5.3 2.8c-1.7.3-3 0-4.6-.6z" fill="#f4c5a0"/><path d="M46 72.1c-1-.4-4-1.7-5.7-2.5c-1.8-.8-3.4-1.5-4.8-2.3c-1.4-.8-2.6-1.7-3.7-2.6c-1.1-.9-2.1-1.9-3-2.6c-.9-.8-1.7-1.5-2.2-1.9c-.6-.5-.8-.7-1.1-.9c-.2-.2-.3-.1-.4-.4c-.1-.3-.3-.5-.2-1.3c.1-.7.2-1.8.6-3.2c.4-1.5 1-3.3 1.8-5.3c.8-1.9 1.7-4.2 2.7-6.4c1-2.3 2.1-4.7 3.1-7c1.1-2.3 2.5-5.6 3-6.8c.5-1.1.6-1 0 0c-.6 1.1-2.1 4.4-3.6 6.5c-1.5 2-3.6 4-5.3 5.9c-1.7 1.9-3.8 3.7-5.1 5.6c-1.3 1.8-2.3 3.8-2.9 5.5c-.6 1.7-.8 3.3-.9 4.7c-.2 1.3 0 2.2.2 3.1c.2 1 .5 1.6 1 2.4c.5.7 1 1.4 1.8 2.2c.7.8 1.6 1.6 2.6 2.5c1 .9 2 2 3.2 2.9c1.3.9 2.5 2.1 4.4 2.4c2 .3 4.9-.6 7.3-.7c2.4 0 6 .2 7.2.2c1.2 0 .9.4 0 0z" fill="#e8b089"/><path d="M32.9 16.5c.3.2.9.7 1.3 1.1c.4.4.8.8 1.1 1.3c.3.4.6.9.9 1.4c.2.6.4 1.1.5 1.7c.2.5.3 1.1.3 1.7c0 .6 0 1.2 0 1.8c-.1.6-.2 1.2-.3 1.7c-.2.6-.5 1.4-.6 1.7c-.1.3.1.4 0 0c-.1-.3-.5-1.4-.6-2c-.2-.5-.3-1-.5-1.5c-.1-.5-.2-.9-.3-1.4c-.2-.4-.3-.8-.4-1.2c-.1-.4-.2-.9-.3-1.3c-.1-.4-.2-.9-.3-1.4c-.1-.5-.2-.9-.4-1.5c-.1-.6-.3-1.8-.4-2.1c0-.3-.2-.2 0 0z" fill="#e8b089"/><path d="M40.3 69.6c-.8-.4-3.4-1.5-4.8-2.3c-1.4-.8-2.6-1.7-3.7-2.6c-1.1-.9-2.1-1.9-3-2.6c-.9-.8-1.7-1.5-2.2-1.9c-.6-.5-.8-.7-1.1-.9c-.2-.2-.3-.1-.4-.4c-.1-.3-.3-.5-.2-1.3c.1-.7.2-1.8.6-3.2c.4-1.5 1-3.3 1.8-5.3c.8-1.9 1.7-4.2 2.7-6.4c1-2.3 2.6-5.9 3.1-7c.6-1.2.6-1.1 0 0c-.6 1.1-2.3 4.6-3.5 6.7c-1.2 2.2-2.7 4.2-3.7 6.1c-1 1.9-1.8 3.8-2.4 5.3c-.5 1.4-.6 2.7-.7 3.7c-.1.9.1 1.3.2 1.8c.2.5.3.7.6 1c.3.4.7.8 1.3 1.3c.6.6 1.4 1.4 2.4 2.1c.9.8 2.1 1.7 3.4 2.4c1.3.6 2.9 1 4.5 1.6c1.6.6 4.2 1.6 5.1 1.9c.8.3.8.4 0 0z" fill="#d89a74" fill-opacity="0.5"/><path d="M31.1 84.1c-.9-.6-3.6-2.5-5.2-3.7c-1.6-1.3-3-2.5-4.3-3.7c-1.4-1.1-2.5-2.2-3.6-3.3c-1.1-1-2.1-2-3-3.2c-1-1.1-1.9-2.3-2.6-3.7c-.8-1.4-1.4-3-1.7-4.7c-.3-1.6-.5-3.5-.3-5.4c.2-2 .7-4.1 1.3-6.2c.7-2.2 1.7-4.4 2.7-6.6c1-2.3 2.2-4.6 3.3-6.8c1.1-2.3 2.8-5.7 3.4-6.8" fill="none" stroke="#fcdcc1" stroke-width="3.4" stroke-linecap="round" stroke-opacity="0.5"/><path d="M42.9 102.1c-.9-.6-3.4-2.3-5.2-3.6c-1.7-1.2-3.4-2.5-5.2-3.9c-1.8-1.4-3.6-2.8-5.4-4.3c-1.8-1.4-3.6-2.9-5.3-4.3c-1.6-1.4-3.2-2.9-4.6-4.1c-1.4-1.3-2.6-2.4-3.8-3.6c-1.2-1.2-2.3-2.3-3.4-3.8c-1.1-1.4-2.4-3.1-3.3-5c-.9-1.9-1.7-4.1-2.2-6.4c-.4-2.3-.5-4.8-.3-7.3c.2-2.4.9-5 1.6-7.4c.8-2.5 1.9-4.9 3-7.2c1.1-2.4 2.4-4.7 3.6-7c1.2-2.2 2.4-4.4 3.5-6.6c1.1-2.2 2.2-4.9 3-6.4c.8-1.5 1-1.9 1.7-2.7c.7-.8 1.5-1.5 2.4-2c.8-.6 1.8-1 2.8-1.2c1-.3 2-.3 3-.3c1 .1 2 .4 2.8.8c.9.4 1.8 1 2.5 1.6c.7.7 1.3 1.5 1.8 2.4c.5.9.8 1.9 1 2.9c.2 1 .2 2.1 0 3.2c-.1 1-.2 1.4-.8 3c-.7 1.7-1.9 4.5-3 6.8c-1 2.3-2.1 4.7-3.1 7c-1 2.2-1.9 4.5-2.7 6.4c-.8 2-1.4 3.8-1.8 5.3c-.4 1.4-.5 2.5-.6 3.2c-.1.8.1 1 .2 1.3c.1.3.2.2.4.4c.3.2.5.4 1.1.9c.5.4 1.3 1.1 2.2 1.9c.9.7 1.9 1.7 3 2.6c1.1.9 2.3 1.8 3.7 2.6c1.4.8 4 1.9 4.8 2.3" fill="none" stroke="#b97754" stroke-width="1"/><path d="M16.4 57.3c-.2.1-.9.5-1.3.7c-.4.2-.8.3-1.2.4c-.4.1-.8.1-1.2 0c-.4 0-.8-.1-1.1-.2c-.4-.2-.8-.4-1.2-.6c-.3-.3-.9-.8-1.1-.9" fill="none" stroke="#cf8c67" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.5"/><path d="M26.9 18.4c-.4-.2-1-.4-1.6-.4c-.5 0-.9.1-1.4.2c-.5.2-.9.5-1.4.9c-.4.3-.8.7-1.2 1.3c-.4.6-.8 1.3-1.1 2c-.4.8-.7 1.8-.9 2.4c-.2.6-.2.9-.1 1.3c0 .4.1.7.3 1.1c.1.3.3.5.7.8c.5.4 1.3.8 2 1.1c.6.3 1.5.6 2 .7c.5.1.8.1 1.2 0c.3-.1.7-.2 1-.4c.3-.3.5-.5.9-1c.3-.5.8-1.5 1.1-2.3c.4-.7.7-1.5.8-2.1c.2-.7.2-1.3.2-1.9c0-.5-.1-1.1-.3-1.5c-.2-.5-.4-.9-.8-1.3c-.3-.3-.9-.7-1.4-.9z" fill="#f7d3bf" stroke="#d9a184" stroke-width=".7"/><path d="M21.2 25.8c.1-.3.4-1 .6-1.4c.2-.5.4-1 .6-1.5c.2-.4.5-.9.7-1.4c.2-.4.5-1.1.6-1.4" fill="none" stroke="#fde9dd" stroke-width=".9" stroke-linecap="round" stroke-opacity="0.75"/><path d="M37.6 40.6c-.2-.5 0-.5 0-.7c0-.2 0-.3 0-.5c0-.2 0-.4 0-.7c-.1-.2-.1-.5-.1-1c0-.6-.1-1.3-.1-2.2c0-1 .1-2.2.1-3.5c.1-1.3.2-2.9.3-4.3c.1-1.4.2-2.9.2-4.2c0-1.2 0-2.6-.1-3.3c0-.6-.1-.8 0-.7c.1 0 .6.8.7.9c.1.2.1.1-.2.1c-.3-.1-.9-.2-1.4-.3c-.6 0-1.5-.1-2.1-.2c-.6 0-1.4-.1-1.5-.1c-.2-.1.1.1.8-.2c.7-.3 2.6-1.1 3.4-1.7c.8-.6 1.2-1.7 1.4-1.8c.1-.2-.3.6-.6.9c-.2.4-.5.9-1 1.4c-.5.5-1.2 1.2-1.9 1.7c-.7.5-1.4.9-2.2 1.1c-.8.3-1.7.4-2.5.4c-.8 0-1.6-.2-2.3-.5c-.8-.2-1.5-.6-2.1-1.1c-.6-.5-1.2-1.1-1.6-1.8c-.4-.7-.7-1.4-.9-2.2c-.2-.8-.2-1.7-.1-2.5c0-.8.2-1.7.6-2.4c.3-.8 1.1-1.9 1.2-2.2c.2-.3-.2.4-.3.5c0 0-.4.4-.1-.1c.3-.5.8-1.9 1.9-2.8c1.1-.8 3.3-1.9 4.5-2.3c1.2-.4 2.1-.1 2.9-.1c.9 0 1.2.1 2.1.2c.8.1 1.7.1 2.8.3c1.2.2 2.5.4 3.9.9c1.4.5 3.1 1.1 4.5 2.3c1.5 1.1 3.1 3 4.1 4.7c.9 1.7 1.2 3.7 1.5 5.5c.4 1.7.4 3.5.4 5.2c.1 1.7 0 3.4 0 5c0 1.5-.1 3-.1 4.2c0 1.2 0 2.2 0 2.9c0 .8 0 1.2 0 1.7c.1.4.1.8.1 1.1c0 .3 0 .4 0 .6c0 .2 0 .3 0 .5c0 .2.2.2 0 .8c-.1.5-.3 1.7-1 2.4c-.6.8-1.7 1.5-2.9 1.9c-1.1.5-2.6.8-4 .8c-1.3.1-2.9-.1-4.1-.5c-1.2-.4-2.3-1-3-1.7c-.7-.6-1-1.8-1.2-2.4z" fill="#f4c5a0"/><path d="M53.8 38.2c0-.2 0-.7-.1-1.1c0-.5 0-.9 0-1.7c0-.7 0-1.7 0-2.9c0-1.2.1-2.7.1-4.2c0-1.6.1-3.3 0-5c0-1.7 0-3.5-.4-5.2c-.3-1.8-.6-3.8-1.5-5.5c-1-1.7-2.6-3.6-4.1-4.7c-1.4-1.2-3.1-1.8-4.5-2.3c-1.4-.5-2.7-.7-3.9-.9c-1.1-.2-2-.2-2.8-.3c-.9-.1-1.2-.2-2.1-.2c-.8 0-1.7-.3-2.9.1c-1.2.4-3.4 1.5-4.5 2.3c-1.1.9-1.6 2.3-1.9 2.8c-.3.5.1.1.1.1c.1-.1.3-.4.3-.5c.1-.1 0-.1 0 0c.1.1-.1.5.2.7c.3.3.8.7 1.5.7c.7 0 1.7-.5 2.6-.8c.8-.2 1.8-.6 2.5-.7c.7-.1 1.2 0 1.8 0c.6 0 1.1.1 1.9.2c.7.1 1.6.1 2.6.3c1 .2 2.1.3 3.1.7c1.1.4 2.3.8 3.3 1.5c.9.8 2 1.9 2.6 3c.6 1.2.9 2.7 1.1 4.1c.2 1.5.2 3.1.3 4.6c0 1.6 0 3.3-.1 4.8c0 1.5-.2 3-.1 4.3c0 1.2-.1 2.3.4 3.1c.5.8 2 1.2 2.7 1.6c.8.5 1.5.9 1.8 1.1c.3.2 0 .2 0 0z" fill="#e8b089"/><path d="M25.5 19.3c-.1-.2-.5-.7-.7-1.1c-.3-.4-.5-.8-.6-1.2c-.2-.5-.3-.9-.4-1.4c0-.4-.1-.9-.1-1.4c0-.4.1-.9.2-1.4c0-.4.2-.9.3-1.3c.2-.5.4-.9.6-1.3c.3-.4.7-1 .8-1.2c.2-.2 0-.3 0 0c.1.3.1 1.2.1 1.6c0 .5 0 .9 0 1.3c0 .4 0 .8 0 1.2c.1.3.1.7.1 1c-.1.4-.1.7-.1 1.1c0 .3 0 .7 0 1.1c0 .4 0 .8 0 1.3c-.1.5-.1 1.4-.2 1.7c0 .2.2.1 0 0z" fill="#e8b089"/><path d="M53.7 37.1c0-.3 0-.9 0-1.7c0-.7 0-1.7 0-2.9c0-1.2.1-2.7.1-4.2c0-1.6.1-3.3 0-5c0-1.7 0-3.5-.4-5.2c-.3-1.8-.6-3.8-1.5-5.5c-1-1.7-2.6-3.6-4.1-4.7c-1.4-1.2-3.1-1.8-4.5-2.3c-1.4-.5-2.7-.7-3.9-.9c-1.1-.2-2-.2-2.8-.3c-.9-.1-1.2-.2-2.1-.2c-.8 0-1.7-.3-2.9.1c-1.2.4-3.4 1.5-4.5 2.3c-1.1.9-1.6 2.3-1.9 2.8c-.3.5.1 0 .1.1c0 0 0-.1 0 0c.1 0-.2.4.3.1c.4-.4 1.2-1.5 2.3-2.1c1-.7 2.9-1.4 4-1.7c1.1-.2 1.8-.1 2.5 0c.8 0 1.2.1 2 .2c.8.1 1.7.1 2.8.3c1.1.2 2.3.3 3.6.8c1.3.5 2.8 1 4.1 2c1.3 1 2.8 2.6 3.6 4.2c.8 1.5 1.1 3.3 1.4 5c.3 1.7.3 3.3.3 5c.1 1.6 0 3.4 0 4.9c.1 1.5.1 3.1.2 4.3c.2 1.2.7 2.2.9 2.9c.3.8.4 1.4.4 1.7c.1.3.1.3 0 0z" fill="#d89a74" fill-opacity="0.5"/><path d="M42.4 32.1c0-.7.2-2.8.2-4.2c.1-1.5.2-3.1.2-4.5c0-1.4-.1-2.8-.2-3.8c-.1-1-.3-1.7-.5-2.2c-.2-.5-.4-.5-.7-.7c-.4-.3-.9-.5-1.5-.7c-.7-.2-1.5-.3-2.2-.4c-.7-.1-1.6-.2-2.3-.2c-.6-.1-1.4-.2-1.7-.2c-.3-.1-.4 0-.3-.1c.2-.1.8-.4 1.1-.5c.2-.2.3-.5.3-.5c0 .1-.2.6-.3.7" fill="none" stroke="#fcdcc1" stroke-width="1.9" stroke-linecap="round" stroke-opacity="0.5"/><path d="M37.5 37.7c0-.4-.1-1.3-.1-2.2c0-1 .1-2.2.1-3.5c.1-1.3.2-2.9.3-4.3c.1-1.4.2-2.9.2-4.2c0-1.2 0-2.6-.1-3.3c0-.6-.1-.8 0-.7c.1 0 .6.8.7.9c.1.2.1.1-.2.1c-.3-.1-.9-.2-1.4-.3c-.6 0-1.5-.1-2.1-.2c-.6 0-1.4-.1-1.5-.1c-.2-.1.1.1.8-.2c.7-.3 2.6-1.1 3.4-1.7c.8-.6 1.2-1.7 1.4-1.8c.1-.2-.3.6-.6.9c-.2.4-.5.9-1 1.4c-.5.5-1.2 1.2-1.9 1.7c-.7.5-1.4.9-2.2 1.1c-.8.3-1.7.4-2.5.4c-.8 0-1.6-.2-2.3-.5c-.8-.2-1.5-.6-2.1-1.1c-.6-.5-1.2-1.1-1.6-1.8c-.4-.7-.7-1.4-.9-2.2c-.2-.8-.2-1.7-.1-2.5c0-.8.2-1.7.6-2.4c.3-.8 1.1-1.9 1.2-2.2c.2-.3-.2.4-.3.5c0 0-.4.4-.1-.1c.3-.5.8-1.9 1.9-2.8c1.1-.8 3.3-1.9 4.5-2.3c1.2-.4 2.1-.1 2.9-.1c.9 0 1.2.1 2.1.2c.8.1 1.7.1 2.8.3c1.2.2 2.5.4 3.9.9c1.4.5 3.1 1.1 4.5 2.3c1.5 1.1 3.1 3 4.1 4.7c.9 1.7 1.2 3.7 1.5 5.5c.4 1.7.4 3.5.4 5.2c.1 1.7 0 3.4 0 5c0 1.5-.1 3.5-.1 4.2" fill="none" stroke="#b97754" stroke-width="1"/><path d="M47.3 14.9c-.1.1-.4.6-.6.9c-.2.3-.4.5-.6.7c-.2.2-.5.4-.7.5c-.3.1-.6.2-.9.3c-.3 0-.6.1-.9 0c-.4 0-.9-.1-1.1-.1" fill="none" stroke="#cf8c67" stroke-width=".9" stroke-linecap="round" stroke-opacity="0.5"/><path d="M28.9 17.7c.4.3.9.6 1.3.7c.4.2.9.2 1.3.2c.4 0 .8-.1 1.3-.3c.4-.2.8-.4 1.2-.7c.5-.4.9-.9 1.4-1.4c.4-.5.9-1.2 1.1-1.6c.3-.5.3-.7.4-1.1c0-.3 0-.6-.1-.9c-.1-.3-.2-.5-.5-.9c-.4-.4-1-.9-1.5-1.3c-.5-.4-1.1-.9-1.6-1.2c-.4-.2-.7-.2-1-.3c-.3 0-.6 0-.9.2c-.3.1-.5.2-.9.5c-.4.3-1 1-1.4 1.5c-.4.5-.8 1-1 1.5c-.3.5-.4 1-.5 1.4c-.1.5-.1 1 0 1.4c.1.4.2.8.4 1.2c.3.3.7.8 1 1.1z" fill="#f7d3bf" stroke="#d9a184" stroke-width=".7"/><path d="M35.1 13.3c-.1.2-.5.6-.8 1c-.2.3-.5.6-.8.9c-.2.3-.5.7-.7 1c-.3.3-.7.8-.8.9" fill="none" stroke="#fde9dd" stroke-width=".9" stroke-linecap="round" stroke-opacity="0.75"/><path d="M43.5 37.8c.4.2 1.6 1.1 2.3 1.2c.8 0 1.8-.9 2.2-1" fill="none" stroke="#cf8c67" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.42"/><path d="M58.8 34.3c.4.2 1.7 1.1 2.4 1.2c.8 0 1.9-.9 2.3-1" fill="none" stroke="#cf8c67" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.42"/><path d="M74.6 37.4c.4.2 1.6 1.1 2.3 1.1c.8.1 1.8-.8 2.1-.9" fill="none" stroke="#cf8c67" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.42"/><path d="M89.1 44.8c.3.2 1.4 1.1 2.1 1.2c.7 0 1.6-.9 1.9-1" fill="none" stroke="#cf8c67" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.42"/></g></svg>'},
    open:{w:125,h:550,palm:[47.6,95.6],wrist:[49,129.2],
      svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 125 550" width="125" height="550"><g class="wh-shadow" fill="#3a2410" stroke="#3a2410" stroke-linejoin="round"><path d="M35.6 125c-8.4 2.8-1 12.6-1.2 16.8c-.1 4.2.7 1.9.5 8.4c-.3 6.6-1 14-1.9 30.8c-.9 16.8-2.5 42-3.6 70c-1.1 28-2.3 63-3.1 98c-.7 35-12.9 93.4-1.4 112c11.5 18.7 59.1 18.7 70.6 0c11.5-18.6-.7-77-1.4-112c-.8-35-2-70-3.1-98c-1.1-28-2.7-53.2-3.6-70c-1-16.8-1.6-24.2-1.9-30.8c-.2-6.5.6-4.2.5-8.4c-.2-4.2 7.2-14-1.2-16.8c-8.4-2.8-40.8-2.8-49.2 0zM15.4 419c4.7-29.3 14.9-6.2 22.4-7.7c7.5-1.5 14.9-1.4 22.4-1.4c7.5 0 14.9-.1 22.4 1.4c7.5 1.5 17.7-21.6 22.4 7.7c4.7 29.3 21.5 140 5.6 168c-15.9 28-84.9 28-100.8 0c-15.9-28 .9-138.7 5.6-168zM31.4 83.7c-.7-1.3-.2-2.6-.4-4.4c-.2-1.9-.5-3.9-.7-6.7c-.2-2.8-.5-7.1-.8-10.2c-.3-3.1-.6-5.9-.8-8.2c-.3-2.3-.5-4.5-.7-5.7c-.1-1.3 0-1.1 0-1.9c0-.7-.5-1.4.2-2.7c.7-1.3 2.3-4.4 4-5.2c1.7-.7 4.6-.5 6.2.6c1.6 1.1 2.7 4.8 3.3 5.9c.6 1 .1 0 .2.5c.1.6.2 1.4.3 3c.2 1.6.3 4 .6 6.7c.2 2.6.6 5.8 1 8.9c.4 3.1.9 7.1 1.2 9.6c.3 2.5.6 3.6.6 5.3c0 1.8 1.3 4-.4 5.3c-1.7 1.3-7.5 2.8-9.7 2.6c-2.3-.1-3.3-2-4.1-3.4zM44.3 76c-.7-1.4-.1-2.2-.2-4.2c0-2-.2-4.2-.3-7.7c-.1-3.5-.1-9.3-.2-13.3c-.1-4-.3-7.6-.4-10.6c-.2-3-.3-5.8-.4-7.5c0-1.8 0-1.9.1-3c.1-1.1-.5-2.1.4-3.7c.8-1.5 2.8-4.7 4.7-5.5c2-.7 5.2-.2 6.9 1.1c1.7 1.2 2.7 5.3 3.3 6.7c.6 1.4.1.6.2 1.6c.1 1 .1 2.2.2 4.3c.1 2.2.1 5.3.2 8.6c.1 3.4.4 7.8.6 11.8c.2 4 .6 9.3.8 12.3c.2 2.9.4 3.8.3 5.6c-.1 1.8 1.1 4-.9 5.2c-2 1.3-8.5 2.6-11 2.3c-2.6-.3-3.5-2.7-4.3-4zM59.2 72.5c-.7-1.5 0-2.1 0-4.1c.1-2 0-4.3.1-8c.1-3.7.4-9.9.5-14.2c.1-4.2.1-8 .2-11.2c0-3.2 0-6.1.1-8c0-1.9 0-2.1.2-3.3c.1-1.2-.4-2.3.6-3.9c.9-1.6 3.2-4.8 5.2-5.4c2.1-.7 5.4 0 7.1 1.4c1.7 1.4 2.5 5.6 3.1 7.1c.5 1.6 0 .8 0 1.9c.1 1.1.1 2.4 0 4.7c0 2.3-.2 5.5-.2 9.1c-.1 3.7 0 8.3 0 12.6c0 4.2.1 9.9.2 13c0 3.1.1 3.9-.1 5.7c-.2 1.8 1 4.1-1.2 5.2c-2.1 1.2-9 2.3-11.6 1.8c-2.6-.4-3.5-3-4.2-4.4zM74.4 75.5c-.6-1.4.1-2.2.2-4.2c.2-1.9.3-4.1.5-7.5c.3-3.4.8-9 1.1-12.8c.3-3.8.5-7.3.7-10.2c.2-2.9.4-5.5.5-7.2c.1-1.6.2-1.6.4-2.6c.1-1-.3-2 .7-3.5c1-1.4 3.4-4.4 5.4-5c2-.5 5.2.3 6.8 1.8c1.5 1.5 2.1 5.7 2.6 7.1c.4 1.4 0 .4 0 1.3c0 .9-.1 2-.2 4c-.1 2.1-.4 5-.6 8.3c-.3 3.3-.5 7.4-.6 11.3c-.2 3.8-.3 8.9-.5 11.8c-.1 2.9 0 3.8-.3 5.6c-.3 1.8.7 4.2-1.4 5.2c-2.2 1.1-8.9 1.7-11.4 1.2c-2.6-.6-3.3-3.1-3.9-4.6zM35.3 147.4c-5.3-8.8-9.3-36.4-6.5-50.4c2.8-13.9 12.6-29 23.3-33.4c10.7-4.5 33.8-2.9 41 6.8c7.2 9.8 7.6 38.5 2.1 51.8c-5.5 13.3-25 23.8-35 28c-10 4.2-19.7 6.1-24.9-2.8zM71.5 118c2.4-2.6 9.4-8.2 12.9-11.8c3.6-3.7 6.3-6.5 8.4-9.9c2.2-3.3 3.6-7.5 4.7-10.2c1.2-2.7 1.7-4.1 2.2-5.9c.5-1.7 0-2.6 1-4.7c1-2 2.6-6.2 4.7-7.5c2.2-1.3 6.1-1.5 8.3-.4c2.2 1.2 4.1 4.9 4.9 7.1c.8 2.2.3 3.7 0 6.1c-.2 2.5-.3 5.1-1.2 8.5c-.9 3.4-1.9 7.5-4.1 12c-2.1 4.4-5.4 10-8.8 14.9c-3.3 4.9-7.2 11.2-11.2 14.4c-4 3.1-8.8 6.2-12.7 4.7c-3.8-1.4-8.9-10.6-10.4-13.5c-1.6-2.8-1.1-1.2 1.3-3.8z" opacity=".07" stroke-width="9"/><path d="M35.6 125c-8.4 2.8-1 12.6-1.2 16.8c-.1 4.2.7 1.9.5 8.4c-.3 6.6-1 14-1.9 30.8c-.9 16.8-2.5 42-3.6 70c-1.1 28-2.3 63-3.1 98c-.7 35-12.9 93.4-1.4 112c11.5 18.7 59.1 18.7 70.6 0c11.5-18.6-.7-77-1.4-112c-.8-35-2-70-3.1-98c-1.1-28-2.7-53.2-3.6-70c-1-16.8-1.6-24.2-1.9-30.8c-.2-6.5.6-4.2.5-8.4c-.2-4.2 7.2-14-1.2-16.8c-8.4-2.8-40.8-2.8-49.2 0zM15.4 419c4.7-29.3 14.9-6.2 22.4-7.7c7.5-1.5 14.9-1.4 22.4-1.4c7.5 0 14.9-.1 22.4 1.4c7.5 1.5 17.7-21.6 22.4 7.7c4.7 29.3 21.5 140 5.6 168c-15.9 28-84.9 28-100.8 0c-15.9-28 .9-138.7 5.6-168zM31.4 83.7c-.7-1.3-.2-2.6-.4-4.4c-.2-1.9-.5-3.9-.7-6.7c-.2-2.8-.5-7.1-.8-10.2c-.3-3.1-.6-5.9-.8-8.2c-.3-2.3-.5-4.5-.7-5.7c-.1-1.3 0-1.1 0-1.9c0-.7-.5-1.4.2-2.7c.7-1.3 2.3-4.4 4-5.2c1.7-.7 4.6-.5 6.2.6c1.6 1.1 2.7 4.8 3.3 5.9c.6 1 .1 0 .2.5c.1.6.2 1.4.3 3c.2 1.6.3 4 .6 6.7c.2 2.6.6 5.8 1 8.9c.4 3.1.9 7.1 1.2 9.6c.3 2.5.6 3.6.6 5.3c0 1.8 1.3 4-.4 5.3c-1.7 1.3-7.5 2.8-9.7 2.6c-2.3-.1-3.3-2-4.1-3.4zM44.3 76c-.7-1.4-.1-2.2-.2-4.2c0-2-.2-4.2-.3-7.7c-.1-3.5-.1-9.3-.2-13.3c-.1-4-.3-7.6-.4-10.6c-.2-3-.3-5.8-.4-7.5c0-1.8 0-1.9.1-3c.1-1.1-.5-2.1.4-3.7c.8-1.5 2.8-4.7 4.7-5.5c2-.7 5.2-.2 6.9 1.1c1.7 1.2 2.7 5.3 3.3 6.7c.6 1.4.1.6.2 1.6c.1 1 .1 2.2.2 4.3c.1 2.2.1 5.3.2 8.6c.1 3.4.4 7.8.6 11.8c.2 4 .6 9.3.8 12.3c.2 2.9.4 3.8.3 5.6c-.1 1.8 1.1 4-.9 5.2c-2 1.3-8.5 2.6-11 2.3c-2.6-.3-3.5-2.7-4.3-4zM59.2 72.5c-.7-1.5 0-2.1 0-4.1c.1-2 0-4.3.1-8c.1-3.7.4-9.9.5-14.2c.1-4.2.1-8 .2-11.2c0-3.2 0-6.1.1-8c0-1.9 0-2.1.2-3.3c.1-1.2-.4-2.3.6-3.9c.9-1.6 3.2-4.8 5.2-5.4c2.1-.7 5.4 0 7.1 1.4c1.7 1.4 2.5 5.6 3.1 7.1c.5 1.6 0 .8 0 1.9c.1 1.1.1 2.4 0 4.7c0 2.3-.2 5.5-.2 9.1c-.1 3.7 0 8.3 0 12.6c0 4.2.1 9.9.2 13c0 3.1.1 3.9-.1 5.7c-.2 1.8 1 4.1-1.2 5.2c-2.1 1.2-9 2.3-11.6 1.8c-2.6-.4-3.5-3-4.2-4.4zM74.4 75.5c-.6-1.4.1-2.2.2-4.2c.2-1.9.3-4.1.5-7.5c.3-3.4.8-9 1.1-12.8c.3-3.8.5-7.3.7-10.2c.2-2.9.4-5.5.5-7.2c.1-1.6.2-1.6.4-2.6c.1-1-.3-2 .7-3.5c1-1.4 3.4-4.4 5.4-5c2-.5 5.2.3 6.8 1.8c1.5 1.5 2.1 5.7 2.6 7.1c.4 1.4 0 .4 0 1.3c0 .9-.1 2-.2 4c-.1 2.1-.4 5-.6 8.3c-.3 3.3-.5 7.4-.6 11.3c-.2 3.8-.3 8.9-.5 11.8c-.1 2.9 0 3.8-.3 5.6c-.3 1.8.7 4.2-1.4 5.2c-2.2 1.1-8.9 1.7-11.4 1.2c-2.6-.6-3.3-3.1-3.9-4.6zM35.3 147.4c-5.3-8.8-9.3-36.4-6.5-50.4c2.8-13.9 12.6-29 23.3-33.4c10.7-4.5 33.8-2.9 41 6.8c7.2 9.8 7.6 38.5 2.1 51.8c-5.5 13.3-25 23.8-35 28c-10 4.2-19.7 6.1-24.9-2.8zM71.5 118c2.4-2.6 9.4-8.2 12.9-11.8c3.6-3.7 6.3-6.5 8.4-9.9c2.2-3.3 3.6-7.5 4.7-10.2c1.2-2.7 1.7-4.1 2.2-5.9c.5-1.7 0-2.6 1-4.7c1-2 2.6-6.2 4.7-7.5c2.2-1.3 6.1-1.5 8.3-.4c2.2 1.2 4.1 4.9 4.9 7.1c.8 2.2.3 3.7 0 6.1c-.2 2.5-.3 5.1-1.2 8.5c-.9 3.4-1.9 7.5-4.1 12c-2.1 4.4-5.4 10-8.8 14.9c-3.3 4.9-7.2 11.2-11.2 14.4c-4 3.1-8.8 6.2-12.7 4.7c-3.8-1.4-8.9-10.6-10.4-13.5c-1.6-2.8-1.1-1.2 1.3-3.8z" opacity=".11" stroke-width="3"/></g><g class="wh-hand" stroke-linejoin="round"><path d="M24.4 115.2c-8.4 2.8-1 12.6-1.2 16.8c-.1 4.2.7 1.9.5 8.4c-.3 6.6-.9 14-1.9 30.8c-.9 16.8-2.5 42-3.6 70c-1.1 28-2.3 63-3.1 98c-.7 35-12.9 93.4-1.4 112c11.5 18.7 59.1 18.7 70.6 0c11.5-18.6-.7-77-1.4-112c-.8-35-2-70-3.1-98c-1.1-28-2.7-53.2-3.6-70c-.9-16.8-1.6-24.2-1.9-30.8c-.2-6.5.6-4.2.5-8.4c-.2-4.2 7.2-14-1.2-16.8c-8.4-2.8-40.8-2.8-49.2 0zM20.2 73.9c-.2-.6-.1-1-.1-1.5c-.1-.5-.1-.9-.2-1.4c0-.5-.1-1-.1-1.5c-.1-.6-.1-1.1-.2-1.8c-.1-.6-.2-1.3-.2-2.1c-.1-.8-.2-1.8-.3-2.8c-.1-1-.2-2.2-.3-3.3c0-1.1-.1-2.3-.2-3.5c-.1-1.2-.2-2.3-.3-3.4c-.1-1.1-.2-2.1-.3-3c-.1-1-.1-1.8-.2-2.7c-.1-.8-.2-1.7-.3-2.5c-.1-.8-.2-1.6-.3-2.3c-.1-.7-.1-1.3-.2-1.9c-.1-.6-.1-1.1-.2-1.5c0-.5 0-.8 0-1c0-.3 0-.4 0-.6c0-.1 0-.2 0-.3c0 0 .1 0 .1-.1c0 0-.1.2 0-.2c0-.4-.1-1.6.1-2.4c.2-.7.4-1.5.8-2.1c.4-.7.8-1.3 1.4-1.8c.5-.5 1.1-1 1.8-1.3c.6-.2 1.4-.4 2.1-.5c.7 0 1.4 0 2.1.2c.7.2 1.4.5 2 .9c.6.4 1.2 1 1.7 1.6c.4.5.8 1.3 1.1 2c.3.7.4 1.8.5 2.3c.1.4.1.2.1.3c0 .1 0 .1 0 .1c.1.1.1 0 .1.1c0 .1.1.2.1.5c0 .2.1.5.1.9c0 .4.1 1 .1 1.6c.1.5.1 1.2.2 1.9c0 .7.1 1.5.2 2.3c0 .8.1 1.6.2 2.5c0 .8.1 1.6.2 2.6c.1.9.2 1.9.4 2.9c.1 1.1.2 2.3.4 3.4c.1 1.2.3 2.4.5 3.5c.1 1.1.3 2.3.4 3.3c.1 1 .2 1.9.3 2.8c.1.8.2 1.5.3 2.1c0 .7.1 1.2.2 1.8c0 .5.1 1 .1 1.4c.1.5.1 1 .2 1.5c0 .5.2.9.1 1.5c-.1.7-.2 1.6-.7 2.3c-.6.7-1.5 1.4-2.5 1.9c-1 .4-2.4.8-3.6.9c-1.2.2-2.6.1-3.6-.2c-1.1-.2-2.2-.7-2.9-1.3c-.6-.5-.9-1.5-1.2-2.1zM33.1 66.2c-.2-.7 0-1.1-.1-1.5c0-.5 0-.9 0-1.3c0-.5 0-.9-.1-1.4c0-.5 0-1.1 0-1.8c-.1-.7-.1-1.4-.2-2.4c0-1 0-2.2-.1-3.5c0-1.3 0-2.8-.1-4.2c0-1.5 0-3.1 0-4.6c-.1-1.5-.1-3.1-.1-4.5c-.1-1.4-.1-2.7-.1-4c-.1-1.2-.1-2.3-.2-3.4c0-1.1-.1-2.2-.1-3.2c-.1-1-.1-2-.2-2.9c0-.9-.1-1.8-.1-2.5c0-.8-.1-1.5-.1-2.1c0-.6 0-1.1 0-1.5c0-.4 0-.6 0-.9c0-.3.1-.4.1-.6c0-.2 0-.3 0-.5c0-.1 0 0 0-.6c.1-.5.1-1.7.4-2.6c.2-.8.5-1.6 1-2.3c.4-.8 1-1.4 1.6-1.9c.7-.6 1.4-1 2.1-1.3c.8-.3 1.6-.4 2.4-.5c.8 0 1.6.2 2.4.4c.7.3 1.5.7 2.1 1.2c.7.4 1.3 1.1 1.7 1.8c.5.7.9 1.5 1.2 2.3c.2.8.3 2 .4 2.6c.1.5 0 .4.1.6c0 .2 0 .3 0 .5c0 .2.1.3.1.5c0 .2.1.5.1.8c0 .4 0 .9 0 1.5c.1.6.1 1.3.1 2c0 .8 0 1.7.1 2.6c0 .9 0 1.8 0 2.9c0 1 .1 2 .1 3.1c0 1.1.1 2.2.1 3.4c.1 1.2.1 2.5.2 3.9c.1 1.4.2 3 .3 4.5c.1 1.5.2 3.1.3 4.6c.1 1.4.2 2.9.3 4.2c.1 1.3.2 2.5.2 3.5c.1.9.1 1.7.1 2.4c.1.7.1 1.3.1 1.8c0 .5 0 .9.1 1.4c0 .4 0 .8 0 1.3c0 .4.2.8.1 1.4c-.2.7-.4 1.8-1 2.5c-.7.8-1.7 1.5-2.9 2c-1.2.4-2.7.7-4 .8c-1.4 0-2.9-.1-4.1-.5c-1.2-.4-2.4-1-3.1-1.7c-.7-.6-1-1.7-1.2-2.3zM48 62.7c-.2-.7 0-1.1 0-1.5c0-.5 0-.8 0-1.3c0-.4 0-.8 0-1.3c0-.5 0-1.1 0-1.8c0-.7 0-1.5.1-2.5c0-1.1 0-2.3 0-3.7c.1-1.3.1-2.9.2-4.5c0-1.6.1-3.3.1-4.9c.1-1.6.2-3.3.2-4.8c0-1.5.1-2.9.1-4.2c0-1.3 0-2.4 0-3.6c0-1.2 0-2.3.1-3.4c0-1.1 0-2.1 0-3.1c0-1 0-1.9 0-2.7c0-.8 0-1.6.1-2.2c0-.7 0-1.2 0-1.6c0-.4.1-.7.1-1c0-.3.1-.5.1-.7c0-.2 0-.3.1-.5c0-.2-.1-.2 0-.7c.1-.6.2-1.9.5-2.7c.3-.8.7-1.7 1.2-2.4c.5-.7 1.1-1.4 1.8-1.9c.7-.5 1.4-.9 2.2-1.1c.8-.3 1.7-.4 2.5-.4c.8 0 1.7.2 2.4.5c.8.3 1.5.8 2.2 1.3c.6.5 1.2 1.2 1.7 2c.4.7.8 1.6 1 2.4c.3.9.3 2.2.4 2.7c0 .6-.1.6 0 .8c0 .2 0 .3 0 .5c0 .2 0 .4 0 .6c.1.3.1.6.1 1c0 .4 0 .9 0 1.5c0 .6-.1 1.4-.1 2.2c0 .8 0 1.7-.1 2.7c0 1 0 2 0 3.1c-.1 1-.1 2.2-.1 3.3c0 1.2-.1 2.3-.1 3.6c0 1.3 0 2.7 0 4.2c0 1.5.1 3.1.1 4.8c0 1.6 0 3.3.1 4.8c0 1.6 0 3.2 0 4.6c.1 1.3.1 2.6.1 3.6c0 1-.1 1.8-.1 2.6c0 .7 0 1.2 0 1.7c0 .6 0 1 0 1.4c0 .4 0 .8 0 1.2c0 .5.2.8 0 1.5c-.2.7-.5 1.8-1.2 2.5c-.7.8-1.9 1.5-3.1 1.9c-1.2.4-2.8.6-4.3.6c-1.4 0-3-.3-4.2-.7c-1.2-.4-2.4-1.1-3.1-1.9c-.7-.7-.9-1.9-1.1-2.5zM63.2 65.7c-.2-.7 0-1 .1-1.5c0-.5 0-.8.1-1.3c0-.4 0-.9 0-1.4c.1-.5.1-1.1.1-1.8c.1-.7.1-1.4.2-2.4c.1-.9.1-2.1.2-3.3c.1-1.2.3-2.7.4-4.1c.1-1.4.3-2.9.4-4.4c.1-1.4.2-2.9.3-4.3c.2-1.3.2-2.6.3-3.8c.1-1.1.2-2.2.2-3.3c.1-1 .2-2.1.2-3.1c.1-1 .2-1.9.2-2.8c.1-.9.1-1.7.2-2.4c0-.7.1-1.4.1-2c0-.5.1-1 .1-1.3c.1-.4.1-.6.1-.8c.1-.3.1-.4.2-.5c0-.2 0-.2 0-.4c.1-.1 0 0 .1-.5c.1-.5.3-1.7.6-2.6c.3-.8.8-1.6 1.3-2.2c.5-.7 1.2-1.3 1.8-1.7c.7-.5 1.5-.9 2.3-1.1c.8-.2 1.6-.3 2.4-.2c.8.1 1.6.3 2.3.6c.8.3 1.5.8 2.1 1.4c.6.6 1.1 1.3 1.5 2c.4.7.7 1.6.9 2.5c.2.8.2 2.1.2 2.6c0 .5 0 .4 0 .5c0 .2 0 .3 0 .4c0 .2 0 .2 0 .4c0 .2 0 .4 0 .8c0 .3 0 .7-.1 1.3c0 .5 0 1.2-.1 1.9c-.1.8-.1 1.6-.2 2.4c-.1.9-.1 1.9-.2 2.8c-.1 1-.2 2-.2 3.1c-.1 1.1-.2 2.1-.3 3.3c0 1.1-.1 2.4-.2 3.7c0 1.3-.1 2.8-.1 4.3c-.1 1.4-.1 3-.2 4.4c0 1.4-.1 2.8-.1 4.1c-.1 1.2-.1 2.4-.2 3.3c0 1-.1 1.8-.1 2.4c-.1.7-.1 1.3-.1 1.8c-.1.5-.1 1-.1 1.4c0 .5-.1.9-.1 1.3c0 .5.1.9-.1 1.5c-.2.7-.5 1.8-1.2 2.4c-.8.7-2 1.3-3.2 1.7c-1.2.3-2.8.5-4.2.4c-1.3-.1-2.9-.5-4-.9c-1.2-.5-2.3-1.3-3-2c-.6-.8-.8-1.9-.9-2.6zM24.1 137.6c-4.4-2.8-.4-8.4-1.1-14c-.8-5.6-2.5-13.5-3.4-19.6c-.9-6-1.9-10.7-2-16.8c-.2-6-.5-15.3 1-19.6c1.5-4.3 4.3-4 8-6.3c3.7-2.3 9.3-5.8 14.3-7.5c5-1.8 10.5-3.2 15.7-3.1c5.1.1 11.1 1.8 15.4 3.5c4.2 1.6 8 2.3 9.9 6.4c1.9 4.1 1.4 12.4 1.7 18.2c.2 5.9-.4 11.2-.3 16.8c.1 5.6 1.4 11.7.7 16.8c-.7 5.2-3.2 9.8-4.9 14c-1.7 4.2-.2 8.9-5.2 11.2c-5 2.4-16.6 2.8-24.9 2.8c-8.3 0-20.6 0-24.9-2.8zM60.3 108.2c.9-1.3 2.7-2.8 4.1-4.2c1.5-1.3 3.1-2.7 4.6-4c1.4-1.2 2.9-2.5 4.2-3.6c1.4-1.2 2.7-2.4 3.7-3.5c1.1-1.1 2-2.1 2.8-3.2c.7-1.1 1.3-2.1 1.9-3.2c.7-1.1 1.2-2.2 1.8-3.4c.6-1.1 1.1-2.3 1.6-3.4c.5-1.2.9-2.4 1.3-3.4c.4-1.1.8-2.2 1.1-3c.3-.8.5-1.4.7-1.9c.2-.5.3-.6.4-1c.1-.3.2-.5.3-1c.1-.5.2-1.1.4-1.7c.1-.6.1-1.2.3-2c.2-.8.4-2 .8-3c.4-.9 1-1.8 1.7-2.6c.6-.7 1.4-1.4 2.2-1.9c.9-.5 1.8-.9 2.7-1.1c.9-.2 1.9-.2 2.9-.1c.9.1 1.8.4 2.7.8c.8.5 1.6 1.1 2.3 1.8c.7.7 1.3 1.5 1.7 2.4c.4.9.8 1.9.9 2.9c.2 1 .1 2.4.1 3.1c-.1.8-.2 1.1-.2 1.6c0 .5.1.8.1 1.4c.1.7.1 1.5 0 2.3c0 .9-.1 2-.3 3c-.3 1-.6 2.1-.9 3.2c-.3 1.1-.7 2.1-1.1 3.4c-.4 1.2-.8 2.5-1.3 4c-.5 1.4-1 3-1.7 4.6c-.6 1.5-1.4 3.2-2.2 4.9c-.9 1.7-1.9 3.4-3 5.1c-1.1 1.6-2.4 3.3-3.6 4.9c-1.2 1.7-2.4 3.3-3.7 5c-1.2 1.6-2.5 3.2-3.8 4.8c-1.2 1.6-2.5 3.1-3.7 4.6c-1.3 1.4-2.5 3.3-3.8 4.3c-1.2.9-2.2 1.5-3.7 1.5c-1.5.1-3.4-.3-5.2-1.1c-1.7-.7-3.7-2-5.2-3.5c-1.5-1.4-2.9-3.2-3.8-4.9c-.9-1.7-1.4-3.6-1.4-5.1c-.1-1.4.4-2.5 1.3-3.8z" fill="none" stroke="#b97754" stroke-width="3.2"/><path d="M4.2 409.2c4.7-29.3 14.9-6.2 22.4-7.7c7.5-1.5 14.9-1.4 22.4-1.4c7.5 0 14.9-.1 22.4 1.4c7.5 1.5 17.7-21.6 22.4 7.7c4.7 29.3 21.5 140 5.6 168c-15.9 28-84.9 28-100.8 0c-15.9-28 .9-138.7 5.6-168z" fill="none" stroke="#3d7853" stroke-width="3.2"/><path d="M24.4 115.2c-8.4 2.8-1 12.6-1.2 16.8c-.1 4.2.7 1.9.5 8.4c-.3 6.6-.9 14-1.9 30.8c-.9 16.8-2.5 42-3.6 70c-1.1 28-2.3 63-3.1 98c-.7 35-12.9 93.4-1.4 112c11.5 18.7 59.1 18.7 70.6 0c11.5-18.6-.7-77-1.4-112c-.8-35-2-70-3.1-98c-1.1-28-2.7-53.2-3.6-70c-.9-16.8-1.6-24.2-1.9-30.8c-.2-6.5.6-4.2.5-8.4c-.2-4.2 7.2-14-1.2-16.8c-8.4-2.8-40.8-2.8-49.2 0z" fill="#f7cdb1"/><path d="M73.8 140.4c1.8 4.9 1.4 14 2.4 30.8c1 16.8 2.5 42 3.6 70c1.1 28 2.3 63 3.1 98c.7 35 4.1 93.4 1.4 112c-2.7 18.7-14.7 18.7-17.8 0c-3.1-18.6-.4-77-.7-112c-.3-35-1.1-70-1.4-98c-.3-28-.7-53.4-.6-70c.2-16.5-.2-24.2 1.4-29.4c1.7-5.1 6.8-6.3 8.6-1.4z" fill="#ecb497"/><path d="M76.2 176.8c1.3 10.3 2.5 37.4 3.6 64.4c1.1 27.1 2.3 63 3.1 98c.7 35 2.1 93.4 1.4 112c-.7 18.7-4.5 18.7-5.6 0c-1.2-18.6-.7-77-1.4-112c-.7-35-1.9-71.4-2.8-98c-.9-26.6-2.8-50.8-2.5-61.6c.2-10.7 2.9-13 4.2-2.8z" fill="#dea083" fill-opacity="0.45"/><path d="M22.4 162.8c-.5 10.8-1.8 37.4-2.8 64.4c-1 27.1-2.6 81.7-3.1 98" fill="none" stroke="#fde1ce" stroke-width="2.8" stroke-linecap="round" stroke-opacity="0.6"/><path d="M24.1 136.2c2.2.8 9.4 3.9 13.6 4.8c4.1.9 7.5.8 11.3.8c3.8 0 7.2.1 11.3-.8c4.2-.9 11.4-4 13.6-4.8" fill="none" stroke="#cf8c67" stroke-width="1" stroke-linecap="round" stroke-opacity="0.65"/><path d="M35.1 145.5c2.3.2 9.7 1.2 13.9 1.2c4.2.1 9.5-.8 11.3-.9" fill="none" stroke="#cf8c67" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.3"/><path d="M14.6 404.3c5.7 1.1 22.9.5 34.4.5c11.5 0 28.7.6 34.4-.5c5.7-1 5.5-4.6-.2-5.7c-5.8-1.1-22.8-.8-34.2-.8c-11.4 0-28.4-.3-34.2.8c-5.7 1.1-5.9 4.7-.2 5.7z" fill="#dea083" fill-opacity="0.35"/><path d="M4.2 409.2c4.7-29.3 14.9-6.2 22.4-7.7c7.5-1.5 14.9-1.4 22.4-1.4c7.5 0 14.9-.1 22.4 1.4c7.5 1.5 17.7-21.6 22.4 7.7c4.7 29.3 21.5 140 5.6 168c-15.9 28-84.9 28-100.8 0c-15.9-28 .9-138.7 5.6-168z" fill="#5ca679"/><path d="M73.6 401.8c1.9-1.4 15.9-21.8 20.2 7.4c4.3 29.3 7.7 140 5.6 168c-2.1 28-15.4 26.6-18.2 0c-2.8-26.6 2.7-130.3 1.4-159.6c-1.3-29.2-10.8-14.4-9-15.8z" fill="#4b8f65"/><path d="M5.6 409.9c3.5-1.1 13.8-5.2 21-6.5c7.2-1.4 15.7-1.4 22.4-1.4c6.7-.1 14.9.9 17.9 1.1" fill="none" stroke="#79bc91" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.8"/><path d="M4.9 416.2c3.6-1.2 14.4-6.1 21.7-7.5c7.3-1.5 14.9-1.3 22.4-1.3c7.5 0 15.1-.2 22.4 1.3c7.4 1.4 18.1 6.3 21.7 7.5" fill="none" stroke="#3d7853" stroke-width=".8" stroke-dasharray="1.8 1.6" stroke-opacity="0.5"/><path d="M4.2 409.2c3.7-1.3 14.9-6.2 22.4-7.7c7.5-1.5 14.9-1.4 22.4-1.4c7.5 0 14.9-.1 22.4 1.4c7.5 1.5 18.7 6.4 22.4 7.7" fill="none" stroke="#3d7853" stroke-width="1"/><path d="M20.2 73.9c-.2-.6-.1-1-.1-1.5c-.1-.5-.1-.9-.2-1.4c0-.5-.1-1-.1-1.5c-.1-.6-.1-1.1-.2-1.8c-.1-.6-.2-1.3-.2-2.1c-.1-.8-.2-1.8-.3-2.8c-.1-1-.2-2.2-.3-3.3c0-1.1-.1-2.3-.2-3.5c-.1-1.2-.2-2.3-.3-3.4c-.1-1.1-.2-2.1-.3-3c-.1-1-.1-1.8-.2-2.7c-.1-.8-.2-1.7-.3-2.5c-.1-.8-.2-1.6-.3-2.3c-.1-.7-.1-1.3-.2-1.9c-.1-.6-.1-1.1-.2-1.5c0-.5 0-.8 0-1c0-.3 0-.4 0-.6c0-.1 0-.2 0-.3c0 0 .1 0 .1-.1c0 0-.1.2 0-.2c0-.4-.1-1.6.1-2.4c.2-.7.4-1.5.8-2.1c.4-.7.8-1.3 1.4-1.8c.5-.5 1.1-1 1.8-1.3c.6-.2 1.4-.4 2.1-.5c.7 0 1.4 0 2.1.2c.7.2 1.4.5 2 .9c.6.4 1.2 1 1.7 1.6c.4.5.8 1.3 1.1 2c.3.7.4 1.8.5 2.3c.1.4.1.2.1.3c0 .1 0 .1 0 .1c.1.1.1 0 .1.1c0 .1.1.2.1.5c0 .2.1.5.1.9c0 .4.1 1 .1 1.6c.1.5.1 1.2.2 1.9c0 .7.1 1.5.2 2.3c0 .8.1 1.6.2 2.5c0 .8.1 1.6.2 2.6c.1.9.2 1.9.4 2.9c.1 1.1.2 2.3.4 3.4c.1 1.2.3 2.4.5 3.5c.1 1.1.3 2.3.4 3.3c.1 1 .2 1.9.3 2.8c.1.8.2 1.5.3 2.1c0 .7.1 1.2.2 1.8c0 .5.1 1 .1 1.4c.1.5.1 1 .2 1.5c0 .5.2.9.1 1.5c-.1.7-.2 1.6-.7 2.3c-.6.7-1.5 1.4-2.5 1.9c-1 .4-2.4.8-3.6.9c-1.2.2-2.6.1-3.6-.2c-1.1-.2-2.2-.7-2.9-1.3c-.6-.5-.9-1.5-1.2-2.1z" fill="#f7cdb1"/><path d="M34.1 66.2c-.1-.3-.2-1.3-.3-2.1c-.1-.9-.2-1.8-.3-2.8c-.1-1-.3-2.2-.4-3.3c-.2-1.1-.4-2.3-.5-3.5c-.2-1.1-.3-2.3-.4-3.4c-.2-1-.3-2-.4-2.9c-.1-1-.2-1.8-.2-2.6c-.1-.9-.2-1.7-.2-2.5c-.1-.8-.2-1.6-.2-2.3c-.1-.7-.1-1.4-.2-1.9c0-.6-.1-1.2-.1-1.6c0-.4-.1-.7-.1-.9c0-.3-.1-.4-.1-.5c0-.1 0 0-.1-.1c0 0 0 0 0-.1c0-.1-.1-.3-.1-.3c0-.1.1-.1 0 0c0 0-.1.2-.4.3c-.3.1-.9.2-1.4.3c-.5.1-1.1.1-1.4.2c-.3.2-.4.3-.4.5c-.1.3 0 .6.1 1c0 .4.1 1 .1 1.5c.1.6.1 1.3.2 2c0 .7.1 1.4.2 2.2c0 .8.1 1.7.2 2.5c.1.9.2 1.7.3 2.7c0 .9.2 1.9.3 2.9c.1 1.1.2 2.3.4 3.4c.1 1.2.2 2.4.4 3.5c.2 1.1.2 2.3.8 3.3c.6.9 1.8 1.8 2.5 2.5c.7.8 1.4 1.7 1.7 2c.2.4 0 .4 0 0z" fill="#ecb497"/><path d="M24.2 28.5c.2.1.8.2 1.2.3c.4.1.7.2 1.1.4c.4.2.7.4 1.1.7c.3.2.6.5.9.8c.3.3.5.7.8 1c.2.4.4.8.6 1.1c.2.4.3.9.4 1.3c.1.4.2 1 .2 1.3c.1.2.2.1 0 0c-.1-.2-.7-.8-1-1.1c-.3-.3-.5-.6-.8-.9c-.2-.2-.5-.5-.7-.7c-.2-.3-.4-.5-.7-.7c-.2-.3-.4-.5-.6-.8c-.2-.2-.5-.5-.7-.7c-.3-.3-.5-.5-.8-.9c-.3-.3-.9-.9-1-1.1c-.2-.1-.2 0 0 0z" fill="#ecb497"/><path d="M25.7 36.2c0 .9-.1 2-.3 2.8c-.2.8-.6 1.6-1.1 2.1c-.4.5-1 .8-1.6.9c-.5 0-1.2-.2-1.7-.7c-.5-.4-1-1.1-1.3-1.9c-.4-.8-.6-1.8-.7-2.7c0-1 .1-2 .3-2.8c.2-.9.6-1.6 1-2.1c.5-.5 1.1-.9 1.6-.9c.6 0 1.2.2 1.8.6c.5.4 1 1.2 1.3 2c.4.7.6 1.8.7 2.7z" fill="#fde1ce" fill-opacity="0.6"/><path d="M26.4 43.5c0 1 0 2-.2 2.9c-.2.8-.6 1.6-1 2.1c-.5.5-1.1.9-1.6.9c-.6.1-1.2-.2-1.8-.6c-.5-.4-1-1.1-1.4-1.9c-.3-.8-.6-1.8-.7-2.7c-.1-.9 0-2 .2-2.8c.2-.9.6-1.7 1-2.2c.4-.5 1-.8 1.6-.9c.6 0 1.2.2 1.7.6c.6.4 1.1 1.1 1.4 1.9c.4.8.7 1.8.8 2.7z" fill="#fde1ce" fill-opacity="0.35"/><path d="M20.2 73.9c0-.2-.1-1-.1-1.5c-.1-.5-.1-.9-.2-1.4c0-.5-.1-1-.1-1.5c-.1-.6-.1-1.1-.2-1.8c-.1-.6-.2-1.3-.2-2.1c-.1-.8-.2-1.8-.3-2.8c-.1-1-.2-2.2-.3-3.3c0-1.1-.1-2.3-.2-3.5c-.1-1.2-.2-2.3-.3-3.4c-.1-1.1-.2-2.1-.3-3c-.1-1-.1-1.8-.2-2.7c-.1-.8-.2-1.7-.3-2.5c-.1-.8-.2-1.6-.3-2.3c-.1-.7-.1-1.3-.2-1.9c-.1-.6-.1-1.1-.2-1.5c0-.5 0-.8 0-1c0-.3 0-.4 0-.6c0-.1 0-.2 0-.3c0 0 .1 0 .1-.1c0 0-.1.2 0-.2c0-.4-.1-1.6.1-2.4c.2-.7.4-1.5.8-2.1c.4-.7.8-1.3 1.4-1.8c.5-.5 1.1-1 1.8-1.3c.6-.2 1.4-.4 2.1-.5c.7 0 1.4 0 2.1.2c.7.2 1.4.5 2 .9c.6.4 1.2 1 1.7 1.6c.4.5.8 1.3 1.1 2c.3.7.4 1.8.5 2.3c.1.4.1.2.1.3c0 .1 0 .1 0 .1c.1.1.1 0 .1.1c0 .1.1.2.1.5c0 .2.1.5.1.9c0 .4.1 1 .1 1.6c.1.5.1 1.2.2 1.9c0 .7.1 1.5.2 2.3c0 .8.1 1.6.2 2.5c0 .8.1 1.6.2 2.6c.1.9.2 1.9.4 2.9c.1 1.1.2 2.3.4 3.4c.1 1.2.3 2.4.5 3.5c.1 1.1.3 2.3.4 3.3c.1 1 .2 1.9.3 2.8c.1.8.2 1.5.3 2.1c0 .7.1 1.2.2 1.8c0 .5.1 1 .1 1.4c.1.5.1 1 .2 1.5c0 .5.1 1.3.1 1.5" fill="none" stroke="#b97754" stroke-width="1"/><path d="M28.1 48.8c-.2 0-.7-.2-1.1-.3c-.3-.1-.7-.2-1.1-.2c-.3 0-.7 0-1 0c-.4.1-.7.1-1.1.2c-.3.1-.7.3-1 .4c-.3.2-.8.5-1 .6" fill="none" stroke="#d39476" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.5"/><path d="M27.5 46.9c-.2 0-.6-.2-.9-.3c-.4 0-.7-.1-1-.1c-.3 0-.6 0-.9 0c-.3 0-.6.1-.9.2c-.3.1-.6.2-.9.3c-.3.1-.8.4-.9.5" fill="none" stroke="#d39476" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.35"/><path d="M26.7 37.7c-.2 0-.7-.2-1-.3c-.3-.1-.6-.1-.9-.1c-.4 0-.7 0-1 0c-.3 0-.6.1-.9.2c-.3 0-.6.1-.9.3c-.3.1-.8.4-.9.5" fill="none" stroke="#d39476" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M33.1 66.2c-.2-.7 0-1.1-.1-1.5c0-.5 0-.9 0-1.3c0-.5 0-.9-.1-1.4c0-.5 0-1.1 0-1.8c-.1-.7-.1-1.4-.2-2.4c0-1 0-2.2-.1-3.5c0-1.3 0-2.8-.1-4.2c0-1.5 0-3.1 0-4.6c-.1-1.5-.1-3.1-.1-4.5c-.1-1.4-.1-2.7-.1-4c-.1-1.2-.1-2.3-.2-3.4c0-1.1-.1-2.2-.1-3.2c-.1-1-.1-2-.2-2.9c0-.9-.1-1.8-.1-2.5c0-.8-.1-1.5-.1-2.1c0-.6 0-1.1 0-1.5c0-.4 0-.6 0-.9c0-.3.1-.4.1-.6c0-.2 0-.3 0-.5c0-.1 0 0 0-.6c.1-.5.1-1.7.4-2.6c.2-.8.5-1.6 1-2.3c.4-.8 1-1.4 1.6-1.9c.7-.6 1.4-1 2.1-1.3c.8-.3 1.6-.4 2.4-.5c.8 0 1.6.2 2.4.4c.7.3 1.5.7 2.1 1.2c.7.4 1.3 1.1 1.7 1.8c.5.7.9 1.5 1.2 2.3c.2.8.3 2 .4 2.6c.1.5 0 .4.1.6c0 .2 0 .3 0 .5c0 .2.1.3.1.5c0 .2.1.5.1.8c0 .4 0 .9 0 1.5c.1.6.1 1.3.1 2c0 .8 0 1.7.1 2.6c0 .9 0 1.8 0 2.9c0 1 .1 2 .1 3.1c0 1.1.1 2.2.1 3.4c.1 1.2.1 2.5.2 3.9c.1 1.4.2 3 .3 4.5c.1 1.5.2 3.1.3 4.6c.1 1.4.2 2.9.3 4.2c.1 1.3.2 2.5.2 3.5c.1.9.1 1.7.1 2.4c.1.7.1 1.3.1 1.8c0 .5 0 .9.1 1.4c0 .4 0 .8 0 1.3c0 .4.2.8.1 1.4c-.2.7-.4 1.8-1 2.5c-.7.8-1.7 1.5-2.9 2c-1.2.4-2.7.7-4 .8c-1.4 0-2.9-.1-4.1-.5c-1.2-.4-2.4-1-3.1-1.7c-.7-.6-1-1.7-1.2-2.3z" fill="#f7cdb1"/><path d="M49.1 59.5c0-.4 0-1.5-.1-2.4c0-1-.1-2.2-.2-3.5c-.1-1.3-.2-2.8-.3-4.2c-.1-1.5-.2-3.1-.3-4.6c-.1-1.5-.2-3.1-.3-4.5c-.1-1.4-.1-2.7-.2-3.9c0-1.2-.1-2.3-.1-3.4c0-1.1-.1-2.1-.1-3.1c0-1.1 0-2 0-2.9c-.1-.9-.1-1.8-.1-2.6c0-.7 0-1.4-.1-2c0-.6 0-1.1 0-1.5c0-.3-.1-.6-.1-.8c0-.2-.1-.3-.1-.5c0-.2 0-.3 0-.5c-.1-.2-.1-.5-.1-.6c0-.1.1-.1 0 0c-.1.1-.1.4-.4.6c-.4.2-1.1.4-1.6.5c-.6.2-1.3.4-1.6.6c-.4.2-.4.5-.5.9c-.1.4 0 .8 0 1.4c.1.6.1 1.3.1 2.1c0 .7 0 1.6.1 2.5c0 .9 0 1.9.1 2.9c0 1 0 2.1.1 3.2c0 1.1 0 2.2.1 3.4c0 1.2.1 2.5.2 3.9c0 1.4.1 3 .2 4.5c.1 1.5.1 3.1.3 4.6c.1 1.4.1 2.9.7 4.2c.5 1.2 1.9 2.4 2.6 3.3c.7 1 1.4 2 1.7 2.4c.3.4 0 .4 0 0z" fill="#ecb497"/><path d="M40.4 10.5c.2 0 .9.2 1.3.3c.4.1.9.3 1.2.6c.4.2.8.5 1.2.8c.3.3.7.6 1 1c.3.3.5.7.8 1.1c.2.4.4.9.6 1.3c.1.5.3 1 .4 1.4c.1.5.1 1.2.1 1.5c0 .2.2.2 0 0c-.2-.2-.7-.9-1.1-1.3c-.3-.4-.5-.7-.8-1c-.2-.3-.5-.6-.7-.9c-.2-.3-.5-.5-.7-.8c-.2-.3-.5-.6-.7-.9c-.2-.3-.5-.5-.7-.9c-.3-.3-.6-.6-.9-.9c-.3-.4-.8-1.1-1-1.3c-.2-.2-.2-.1 0 0z" fill="#ecb497"/><path d="M41.6 19.7c0 1-.2 2.2-.5 3.1c-.3.9-.8 1.8-1.3 2.3c-.5.5-1.2.8-1.8.9c-.6 0-1.3-.3-1.9-.8c-.5-.5-1.1-1.4-1.4-2.3c-.3-.8-.5-2-.5-3c-.1-1.1.1-2.2.4-3.1c.3-.9.8-1.8 1.3-2.3c.5-.6 1.2-.9 1.8-.9c.7 0 1.4.3 1.9.8c.6.5 1.1 1.4 1.4 2.2c.3.9.5 2.1.6 3.1z" fill="#fde1ce" fill-opacity="0.6"/><path d="M41.9 30.1c0 1-.1 2.2-.4 3.1c-.3.9-.7 1.8-1.3 2.3c-.5.5-1.2.9-1.8.9c-.6 0-1.3-.3-1.9-.8c-.6-.5-1.1-1.3-1.4-2.2c-.4-.9-.6-2-.7-3.1c0-1 .2-2.2.4-3.1c.3-.9.8-1.8 1.3-2.3c.5-.6 1.2-.9 1.9-.9c.6-.1 1.3.2 1.9.7c.5.5 1.1 1.4 1.4 2.3c.3.8.6 2 .6 3.1z" fill="#fde1ce" fill-opacity="0.35"/><path d="M33.1 66.2c0-.3 0-1.1-.1-1.5c0-.5 0-.9 0-1.3c0-.5 0-.9-.1-1.4c0-.5 0-1.1 0-1.8c-.1-.7-.1-1.4-.2-2.4c0-1 0-2.2-.1-3.5c0-1.3 0-2.8-.1-4.2c0-1.5 0-3.1 0-4.6c-.1-1.5-.1-3.1-.1-4.5c-.1-1.4-.1-2.7-.1-4c-.1-1.2-.1-2.3-.2-3.4c0-1.1-.1-2.2-.1-3.2c-.1-1-.1-2-.2-2.9c0-.9-.1-1.8-.1-2.5c0-.8-.1-1.5-.1-2.1c0-.6 0-1.1 0-1.5c0-.4 0-.6 0-.9c0-.3.1-.4.1-.6c0-.2 0-.3 0-.5c0-.1 0 0 0-.6c.1-.5.1-1.7.4-2.6c.2-.8.5-1.6 1-2.3c.4-.8 1-1.4 1.6-1.9c.7-.6 1.4-1 2.1-1.3c.8-.3 1.6-.4 2.4-.5c.8 0 1.6.2 2.4.4c.7.3 1.5.7 2.1 1.2c.7.4 1.3 1.1 1.7 1.8c.5.7.9 1.5 1.2 2.3c.2.8.3 2 .4 2.6c.1.5 0 .4.1.6c0 .2 0 .3 0 .5c0 .2.1.3.1.5c0 .2.1.5.1.8c0 .4 0 .9 0 1.5c.1.6.1 1.3.1 2c0 .8 0 1.7.1 2.6c0 .9 0 1.8 0 2.9c0 1 .1 2 .1 3.1c0 1.1.1 2.2.1 3.4c.1 1.2.1 2.5.2 3.9c.1 1.4.2 3 .3 4.5c.1 1.5.2 3.1.3 4.6c.1 1.4.2 2.9.3 4.2c.1 1.3.2 2.5.2 3.5c.1.9.1 1.7.1 2.4c.1.7.1 1.3.1 1.8c0 .5 0 .9.1 1.4c0 .4 0 .8 0 1.3c0 .4.1 1.2.1 1.4" fill="none" stroke="#b97754" stroke-width="1"/><path d="M43.5 36.9c-.2-.1-.8-.4-1.2-.5c-.4-.1-.8-.2-1.2-.3c-.4 0-.8 0-1.1 0c-.4 0-.8.1-1.2.1c-.4.1-.8.2-1.2.4c-.4.1-1 .5-1.2.6" fill="none" stroke="#d39476" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.5"/><path d="M43 34.9c-.2 0-.7-.3-1-.4c-.4-.1-.7-.1-1.1-.2c-.3 0-.7 0-1 0c-.4 0-.7 0-1 .1c-.4.1-.7.2-1.1.3c-.3.1-.8.4-1 .5" fill="none" stroke="#d39476" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.35"/><path d="M42.6 22.5c-.1 0-.7-.3-1-.4c-.4-.1-.7-.2-1.1-.2c-.3-.1-.7-.1-1-.1c-.4.1-.7.1-1.1.2c-.3 0-.7.1-1 .3c-.4.1-.9.4-1.1.4" fill="none" stroke="#d39476" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M48 62.7c-.2-.7 0-1.1 0-1.5c0-.5 0-.8 0-1.3c0-.4 0-.8 0-1.3c0-.5 0-1.1 0-1.8c0-.7 0-1.5.1-2.5c0-1.1 0-2.3 0-3.7c.1-1.3.1-2.9.2-4.5c0-1.6.1-3.3.1-4.9c.1-1.6.2-3.3.2-4.8c0-1.5.1-2.9.1-4.2c0-1.3 0-2.4 0-3.6c0-1.2 0-2.3.1-3.4c0-1.1 0-2.1 0-3.1c0-1 0-1.9 0-2.7c0-.8 0-1.6.1-2.2c0-.7 0-1.2 0-1.6c0-.4.1-.7.1-1c0-.3.1-.5.1-.7c0-.2 0-.3.1-.5c0-.2-.1-.2 0-.7c.1-.6.2-1.9.5-2.7c.3-.8.7-1.7 1.2-2.4c.5-.7 1.1-1.4 1.8-1.9c.7-.5 1.4-.9 2.2-1.1c.8-.3 1.7-.4 2.5-.4c.8 0 1.7.2 2.4.5c.8.3 1.5.8 2.2 1.3c.6.5 1.2 1.2 1.7 2c.4.7.8 1.6 1 2.4c.3.9.3 2.2.4 2.7c0 .6-.1.6 0 .8c0 .2 0 .3 0 .5c0 .2 0 .4 0 .6c.1.3.1.6.1 1c0 .4 0 .9 0 1.5c0 .6-.1 1.4-.1 2.2c0 .8 0 1.7-.1 2.7c0 1 0 2 0 3.1c-.1 1-.1 2.2-.1 3.3c0 1.2-.1 2.3-.1 3.6c0 1.3 0 2.7 0 4.2c0 1.5.1 3.1.1 4.8c0 1.6 0 3.3.1 4.8c0 1.6 0 3.2 0 4.6c.1 1.3.1 2.6.1 3.6c0 1-.1 1.8-.1 2.6c0 .7 0 1.2 0 1.7c0 .6 0 1 0 1.4c0 .4 0 .8 0 1.2c0 .5.2.8 0 1.5c-.2.7-.5 1.8-1.2 2.5c-.7.8-1.9 1.5-3.1 1.9c-1.2.4-2.8.6-4.3.6c-1.4 0-3-.3-4.2-.7c-1.2-.4-2.4-1.1-3.1-1.9c-.7-.7-.9-1.9-1.1-2.5z" fill="#f7cdb1"/><path d="M65 57c0-.5.1-1.6.1-2.6c0-1 0-2.3-.1-3.6c0-1.4 0-3 0-4.6c-.1-1.5-.1-3.2-.1-4.8c0-1.7-.1-3.3-.1-4.8c0-1.5 0-2.9 0-4.2c0-1.3.1-2.4.1-3.6c0-1.1 0-2.3.1-3.3c0-1.1 0-2.1 0-3.1c.1-1 .1-1.9.1-2.7c0-.8.1-1.6.1-2.2c0-.6 0-1.1 0-1.5c0-.4 0-.7-.1-1c0-.2 0-.4 0-.6c0-.2 0-.3 0-.5c-.1-.2 0-.6 0-.8c0-.1 0-.1 0 0c-.1.2-.2.6-.6.8c-.3.2-1.1.3-1.6.5c-.6.1-1.4.3-1.7.5c-.4.3-.5.6-.6 1c-.1.4 0 .9 0 1.5c0 .6 0 1.4 0 2.2c-.1.8-.1 1.8-.1 2.7c0 1-.1 2-.1 3.1c0 1.1 0 2.2 0 3.4c-.1 1.1-.1 2.3-.1 3.6c0 1.3 0 2.7 0 4.1c0 1.5 0 3.2 0 4.8c0 1.6-.1 3.3 0 4.9c.1 1.6 0 3.2.5 4.5c.5 1.4 1.9 2.6 2.6 3.7c.7 1 1.4 2.1 1.6 2.6c.3.4 0 .4 0 0z" fill="#ecb497"/><path d="M58.6 4.5c.2.1.9.2 1.4.4c.4.2.8.4 1.2.7c.4.2.8.5 1.1.8c.4.4.7.7 1 1.1c.3.4.6.8.8 1.3c.2.4.4.9.5 1.4c.2.4.3.9.4 1.4c0 .5 0 1.3.1 1.5c0 .3.1.3 0 0c-.2-.2-.8-.9-1.1-1.3c-.3-.4-.5-.8-.8-1.1c-.2-.4-.5-.7-.7-1c-.2-.3-.4-.6-.7-.9c-.2-.3-.4-.6-.6-.9c-.3-.3-.5-.6-.8-1c-.2-.3-.5-.6-.8-1c-.3-.4-.8-1.2-1-1.4c-.2-.2-.2-.1 0 0z" fill="#ecb497"/><path d="M59.3 14.3c0 1-.2 2.2-.6 3.1c-.3 1-.9 1.8-1.5 2.3c-.5.6-1.3.9-1.9.8c-.7 0-1.4-.3-1.9-.9c-.5-.5-1.1-1.4-1.3-2.4c-.3-.9-.5-2.1-.5-3.2c.1-1.1.3-2.3.7-3.2c.3-.9.9-1.8 1.4-2.3c.6-.5 1.4-.8 2-.8c.6 0 1.4.4 1.9.9c.5.6 1 1.5 1.3 2.4c.3 1 .5 2.2.4 3.3z" fill="#fde1ce" fill-opacity="0.6"/><path d="M59.1 25.4c0 1.1-.2 2.3-.6 3.2c-.3.9-.8 1.8-1.4 2.4c-.6.5-1.3.8-2 .8c-.6 0-1.4-.4-1.9-.9c-.6-.6-1.1-1.5-1.4-2.4c-.3-1-.5-2.2-.5-3.3c.1-1 .3-2.3.6-3.2c.4-.9.9-1.8 1.5-2.3c.6-.6 1.3-.9 2-.9c.6 0 1.3.4 1.9.9c.5.6 1.1 1.5 1.4 2.4c.3 1 .4 2.2.4 3.3z" fill="#fde1ce" fill-opacity="0.35"/><path d="M48 62.7c0-.3 0-1.1 0-1.5c0-.5 0-.8 0-1.3c0-.4 0-.8 0-1.3c0-.5 0-1.1 0-1.8c0-.7 0-1.5.1-2.5c0-1.1 0-2.3 0-3.7c.1-1.3.1-2.9.2-4.5c0-1.6.1-3.3.1-4.9c.1-1.6.2-3.3.2-4.8c0-1.5.1-2.9.1-4.2c0-1.3 0-2.4 0-3.6c0-1.2 0-2.3.1-3.4c0-1.1 0-2.1 0-3.1c0-1 0-1.9 0-2.7c0-.8 0-1.6.1-2.2c0-.7 0-1.2 0-1.6c0-.4.1-.7.1-1c0-.3.1-.5.1-.7c0-.2 0-.3.1-.5c0-.2-.1-.2 0-.7c.1-.6.2-1.9.5-2.7c.3-.8.7-1.7 1.2-2.4c.5-.7 1.1-1.4 1.8-1.9c.7-.5 1.4-.9 2.2-1.1c.8-.3 1.7-.4 2.5-.4c.8 0 1.7.2 2.4.5c.8.3 1.5.8 2.2 1.3c.6.5 1.2 1.2 1.7 2c.4.7.8 1.6 1 2.4c.3.9.3 2.2.4 2.7c0 .6-.1.6 0 .8c0 .2 0 .3 0 .5c0 .2 0 .4 0 .6c.1.3.1.6.1 1c0 .4 0 .9 0 1.5c0 .6-.1 1.4-.1 2.2c0 .8 0 1.7-.1 2.7c0 1 0 2 0 3.1c-.1 1-.1 2.2-.1 3.3c0 1.2-.1 2.3-.1 3.6c0 1.3 0 2.7 0 4.2c0 1.5.1 3.1.1 4.8c0 1.6 0 3.3.1 4.8c0 1.6 0 3.2 0 4.6c.1 1.3.1 2.6.1 3.6c0 1-.1 1.8-.1 2.6c0 .7 0 1.2 0 1.7c0 .6 0 1 0 1.4c0 .4 0 .8 0 1.2c0 .5 0 1.3 0 1.5" fill="none" stroke="#b97754" stroke-width="1"/><path d="M60.5 32.7c-.2-.1-.9-.4-1.3-.6c-.4-.1-.8-.2-1.2-.3c-.4-.1-.8-.1-1.2-.1c-.5-.1-.9 0-1.3 0c-.4.1-.8.2-1.2.4c-.4.1-1.1.4-1.3.5" fill="none" stroke="#d39476" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.5"/><path d="M60 30.7c-.2-.1-.7-.3-1.1-.5c-.3-.1-.7-.2-1-.2c-.4-.1-.8-.1-1.1-.1c-.4-.1-.7 0-1.1 0c-.4.1-.7.2-1.1.3c-.3.1-.9.3-1.1.4" fill="none" stroke="#d39476" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.35"/><path d="M60.3 17.4c-.2-.1-.7-.3-1.1-.5c-.4-.1-.7-.2-1.1-.3c-.3 0-.7-.1-1.1-.1c-.3 0-.7 0-1.1.1c-.3.1-.7.1-1.1.3c-.3.1-.9.3-1.1.4" fill="none" stroke="#d39476" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M63.2 65.7c-.2-.7 0-1 .1-1.5c0-.5 0-.8.1-1.3c0-.4 0-.9 0-1.4c.1-.5.1-1.1.1-1.8c.1-.7.1-1.4.2-2.4c.1-.9.1-2.1.2-3.3c.1-1.2.3-2.7.4-4.1c.1-1.4.3-2.9.4-4.4c.1-1.4.2-2.9.3-4.3c.2-1.3.2-2.6.3-3.8c.1-1.1.2-2.2.2-3.3c.1-1 .2-2.1.2-3.1c.1-1 .2-1.9.2-2.8c.1-.9.1-1.7.2-2.4c0-.7.1-1.4.1-2c0-.5.1-1 .1-1.3c.1-.4.1-.6.1-.8c.1-.3.1-.4.2-.5c0-.2 0-.2 0-.4c.1-.1 0 0 .1-.5c.1-.5.3-1.7.6-2.6c.3-.8.8-1.6 1.3-2.2c.5-.7 1.2-1.3 1.8-1.7c.7-.5 1.5-.9 2.3-1.1c.8-.2 1.6-.3 2.4-.2c.8.1 1.6.3 2.3.6c.8.3 1.5.8 2.1 1.4c.6.6 1.1 1.3 1.5 2c.4.7.7 1.6.9 2.5c.2.8.2 2.1.2 2.6c0 .5 0 .4 0 .5c0 .2 0 .3 0 .4c0 .2 0 .2 0 .4c0 .2 0 .4 0 .8c0 .3 0 .7-.1 1.3c0 .5 0 1.2-.1 1.9c-.1.8-.1 1.6-.2 2.4c-.1.9-.1 1.9-.2 2.8c-.1 1-.2 2-.2 3.1c-.1 1.1-.2 2.1-.3 3.3c0 1.1-.1 2.4-.2 3.7c0 1.3-.1 2.8-.1 4.3c-.1 1.4-.1 3-.2 4.4c0 1.4-.1 2.8-.1 4.1c-.1 1.2-.1 2.4-.2 3.3c0 1-.1 1.8-.1 2.4c-.1.7-.1 1.3-.1 1.8c-.1.5-.1 1-.1 1.4c0 .5-.1.9-.1 1.3c0 .5.1.9-.1 1.5c-.2.7-.5 1.8-1.2 2.4c-.8.7-2 1.3-3.2 1.7c-1.2.3-2.8.5-4.2.4c-1.3-.1-2.9-.5-4-.9c-1.2-.5-2.3-1.3-3-2c-.6-.8-.8-1.9-.9-2.6z" fill="#f7cdb1"/><path d="M80.1 60.7c0-.4.1-1.4.1-2.4c.1-.9.1-2.1.2-3.3c0-1.3.1-2.7.1-4.1c.1-1.4.1-3 .2-4.4c0-1.5.1-3 .1-4.3c.1-1.3.2-2.6.2-3.7c.1-1.2.2-2.2.3-3.3c0-1.1.1-2.1.2-3.1c.1-.9.1-1.9.2-2.8c.1-.8.1-1.6.2-2.4c.1-.7.1-1.4.1-1.9c.1-.6.1-1 .1-1.3c0-.4 0-.6 0-.8c0-.2 0-.2 0-.4c0-.1 0-.2 0-.4c0-.1 0-.4 0-.5c0-.1.1-.1 0 0c-.1.1-.2.4-.6.5c-.3.1-1 .2-1.6.2c-.5.1-1.3.1-1.7.3c-.3.2-.4.4-.5.7c-.1.4-.1.8-.1 1.3c0 .6-.1 1.3-.1 2c-.1.7-.2 1.6-.2 2.4c-.1.9-.2 1.8-.2 2.8c-.1 1-.2 2-.2 3.1c-.1 1.1-.2 2.1-.3 3.3c0 1.1-.1 2.4-.2 3.7c-.1 1.4-.1 2.9-.2 4.3c-.1 1.5-.2 3-.2 4.4c0 1.4-.2 2.9.3 4.1c.4 1.3 1.7 2.5 2.3 3.5c.6 1 1.2 2.1 1.5 2.5c.2.5 0 .5 0 0z" fill="#ecb497"/><path d="M76.3 12.9c.2 0 .8.2 1.3.4c.4.2.8.5 1.1.7c.4.3.8.6 1.1.9c.3.4.6.8.9 1.2c.2.3.5.8.7 1.2c.2.5.3.9.4 1.4c.2.5.2.9.3 1.4c0 .5 0 1.3 0 1.5c0 .2.1.2 0 0c-.2-.2-.7-1-1-1.4c-.2-.4-.4-.7-.7-1.1c-.2-.3-.4-.6-.6-1c-.2-.3-.4-.6-.6-.9c-.2-.3-.4-.6-.6-.9c-.2-.3-.4-.6-.7-1c-.2-.3-.5-.6-.7-1c-.3-.4-.8-1.2-.9-1.4c-.2-.3-.2-.1 0 0z" fill="#ecb497"/><path d="M76.5 22c-.1 1.1-.4 2.2-.8 3.1c-.4.9-1 1.7-1.5 2.2c-.6.4-1.4.7-2 .6c-.6 0-1.3-.4-1.8-1c-.5-.5-.9-1.4-1.1-2.4c-.3-.9-.4-2.1-.3-3.1c.1-1 .4-2.2.8-3.1c.4-.8 1-1.7 1.6-2.1c.6-.5 1.3-.7 1.9-.7c.6.1 1.3.4 1.8 1c.5.6.9 1.5 1.2 2.4c.2.9.3 2.1.2 3.1z" fill="#fde1ce" fill-opacity="0.6"/><path d="M75.8 31.7c-.1 1.1-.3 2.3-.7 3.2c-.4.8-1 1.7-1.6 2.2c-.5.4-1.3.7-1.9.7c-.6-.1-1.3-.4-1.8-1c-.5-.6-1-1.5-1.3-2.4c-.2-.9-.3-2.1-.2-3.2c0-1 .3-2.2.7-3.1c.4-.9.9-1.7 1.5-2.2c.6-.5 1.3-.8 2-.7c.6 0 1.3.4 1.8 1c.5.5 1 1.4 1.2 2.4c.3.9.4 2.1.3 3.1z" fill="#fde1ce" fill-opacity="0.35"/><path d="M63.2 65.7c0-.2 0-1 .1-1.5c0-.5 0-.8.1-1.3c0-.4 0-.9 0-1.4c.1-.5.1-1.1.1-1.8c.1-.7.1-1.4.2-2.4c.1-.9.1-2.1.2-3.3c.1-1.2.3-2.7.4-4.1c.1-1.4.3-2.9.4-4.4c.1-1.4.2-2.9.3-4.3c.2-1.3.2-2.6.3-3.8c.1-1.1.2-2.2.2-3.3c.1-1 .2-2.1.2-3.1c.1-1 .2-1.9.2-2.8c.1-.9.1-1.7.2-2.4c0-.7.1-1.4.1-2c0-.5.1-1 .1-1.3c.1-.4.1-.6.1-.8c.1-.3.1-.4.2-.5c0-.2 0-.2 0-.4c.1-.1 0 0 .1-.5c.1-.5.3-1.7.6-2.6c.3-.8.8-1.6 1.3-2.2c.5-.7 1.2-1.3 1.8-1.7c.7-.5 1.5-.9 2.3-1.1c.8-.2 1.6-.3 2.4-.2c.8.1 1.6.3 2.3.6c.8.3 1.5.8 2.1 1.4c.6.6 1.1 1.3 1.5 2c.4.7.7 1.6.9 2.5c.2.8.2 2.1.2 2.6c0 .5 0 .4 0 .5c0 .2 0 .3 0 .4c0 .2 0 .2 0 .4c0 .2 0 .4 0 .8c0 .3 0 .7-.1 1.3c0 .5 0 1.2-.1 1.9c-.1.8-.1 1.6-.2 2.4c-.1.9-.1 1.9-.2 2.8c-.1 1-.2 2-.2 3.1c-.1 1.1-.2 2.1-.3 3.3c0 1.1-.1 2.4-.2 3.7c0 1.3-.1 2.8-.1 4.3c-.1 1.4-.1 3-.2 4.4c0 1.4-.1 2.8-.1 4.1c-.1 1.2-.1 2.4-.2 3.3c0 1-.1 1.8-.1 2.4c-.1.7-.1 1.3-.1 1.8c-.1.5-.1 1-.1 1.4c0 .5-.1.9-.1 1.3c0 .5-.1 1.3-.1 1.5" fill="none" stroke="#b97754" stroke-width="1"/><path d="M76.8 38.5c-.2-.1-.8-.5-1.2-.6c-.4-.2-.8-.3-1.2-.4c-.4-.1-.8-.2-1.2-.2c-.4 0-.8 0-1.2 0c-.4.1-.8.1-1.2.2c-.4.2-1 .4-1.3.5" fill="none" stroke="#d39476" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.5"/><path d="M76.4 36.5c-.1-.1-.7-.4-1-.5c-.3-.2-.7-.3-1-.4c-.4 0-.7-.1-1.1-.1c-.3 0-.7 0-1 0c-.4 0-.7.1-1.1.2c-.3.1-.9.3-1.1.4" fill="none" stroke="#d39476" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.35"/><path d="M77.3 24.6c-.2-.1-.7-.3-1-.5c-.4-.1-.7-.2-1.1-.3c-.3-.1-.7-.2-1-.2c-.4 0-.7 0-1.1 0c-.3 0-.7.1-1.1.2c-.3.1-.9.3-1 .4" fill="none" stroke="#d39476" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M24.1 137.6c-4.4-2.8-.4-8.4-1.1-14c-.8-5.6-2.5-13.5-3.4-19.6c-.9-6-1.9-10.7-2-16.8c-.2-6-.5-15.3 1-19.6c1.5-4.3 4.3-4 8-6.3c3.7-2.3 9.3-5.8 14.3-7.5c5-1.8 10.5-3.2 15.7-3.1c5.1.1 11.1 1.8 15.4 3.5c4.2 1.6 8 2.3 9.9 6.4c1.9 4.1 1.4 12.4 1.7 18.2c.2 5.9-.4 11.2-.3 16.8c.1 5.6 1.4 11.7.7 16.8c-.7 5.2-3.2 9.8-4.9 14c-1.7 4.2-.2 8.9-5.2 11.2c-5 2.4-16.6 2.8-24.9 2.8c-8.3 0-20.6 0-24.9-2.8z" fill="#f7cdb1"/><path d="M23 123.6c-1.6-2.8-2.5-13.5-3.4-19.6c-.9-6-1.9-10.7-2-16.8c-.2-6-1-16.1 1-19.6c2-3.5 7.1-3.2 10.8-1.4c3.7 1.9 8.4 8.7 11.2 12.6c2.8 4 5.4 6.6 5.6 11.2c.2 4.7-1.3 11.7-4.2 16.8c-2.9 5.2-10.1 11.2-13.3 14c-3.2 2.8-4.2 5.6-5.7 2.8z" fill="#ecb497" fill-opacity="0.22"/><path d="M23.1 122.2c-1.3-2.8-2.5-12.3-3.4-18.2c-.9-5.8-1.9-10.8-2-16.8c-.1-5.9-.3-15.6 1.3-18.9c1.6-3.2 5.4-2.7 8.3-.7c2.9 2 6.9 8.7 9.1 12.6c2.2 4 4 6.8 4.2 11.2c.2 4.5-.7 10.5-2.8 15.4c-2.1 4.9-7.6 11.5-10.1 14c-2.4 2.6-3.3 4.2-4.6 1.4z" fill="#ecb497" fill-opacity="0.22"/><path d="M23.2 120.8c-1-2.5-2.4-11.2-3.3-16.8c-.9-5.6-1.9-10.9-2-16.8c-.1-5.8.2-17.2 1.4-18.2c1.2-.9 4.6 6.8 5.9 12.6c1.3 5.9 1.9 16.1 2.1 22.4c.2 6.3-.3 12.6-1 15.4c-.7 2.8-2 4-3.1 1.4z" fill="#ecb497" fill-opacity="0.4"/><path d="M80.4 107.1c.8 1.8 1.3 3.9 1.5 5.8c.2 1.8.1 3.8-.2 5.4c-.4 1.7-1.1 3.3-1.9 4.4c-.9 1.2-2.1 2.1-3.3 2.6c-1.3.5-2.8.7-4.2.4c-1.4-.2-3-.9-4.4-1.8c-1.4-.9-2.8-2.3-4-3.8c-1.1-1.5-2.2-3.3-2.9-5.1c-.8-1.9-1.3-3.9-1.5-5.8c-.2-1.9-.1-3.8.2-5.5c.4-1.6 1.1-3.2 1.9-4.4c.9-1.1 2.1-2 3.3-2.5c1.3-.6 2.8-.7 4.2-.5c1.4.3 3 .9 4.4 1.9c1.4.9 2.8 2.2 4 3.7c1.1 1.5 2.2 3.4 2.9 5.2z" fill="#fde1ce" fill-opacity="0.35"/><path d="M75.1 110.1c.6 1.3.9 2.8 1.1 4.1c.1 1.4-.1 2.8-.4 3.9c-.3 1-.9 2-1.6 2.7c-.7.6-1.7 1-2.6 1c-1 .1-2.1-.2-3.1-.8c-1-.5-2-1.5-2.9-2.5c-.8-1-1.6-2.4-2.1-3.7c-.6-1.3-.9-2.9-1.1-4.2c-.1-1.3.1-2.7.4-3.8c.3-1.1.9-2.1 1.6-2.7c.7-.6 1.7-1 2.6-1.1c1 0 2.1.3 3.1.9c1 .5 2 1.4 2.9 2.5c.8 1 1.6 2.4 2.1 3.7z" fill="#fde1ce" fill-opacity="0.3"/><path d="M69.2 75.3c-1.4 1.8-6.2 5.7-8.3 10.5c-2.1 4.8-3.2 12.4-4.2 18.2c-1 5.9-1.7 14-2.1 16.8" fill="none" stroke="#d39476" stroke-width="1" stroke-linecap="round" stroke-opacity="0.45"/><path d="M67.8 76.7c-2.7 1-10.8 3.6-16 5.6c-5.2 2-10.6 4.8-15.4 6.3c-4.8 1.5-11.1 2.4-13.3 2.8" fill="none" stroke="#d39476" stroke-width=".9" stroke-linecap="round" stroke-opacity="0.35"/><path d="M19.3 78.1c.8-.7.7-3 4.5-4.2c3.8-1.1 12.3-2.1 18.5-2.8c6.1-.7 15.4-1.1 18.5-1.4" fill="none" stroke="#d39476" stroke-width=".9" stroke-linecap="round" stroke-opacity="0.35"/><path d="M20.5 65.4c1 .2 4.1 1.4 6.1 1.4c2 0 5.1-1.2 6.1-1.4" fill="none" stroke="#d39476" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M34 58c1.2.2 4.6 1.4 6.9 1.4c2.3 0 5.7-1.2 6.8-1.4" fill="none" stroke="#d39476" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M49.4 54.9c1.2.2 4.8 1.4 7.2 1.4c2.3 0 5.9-1.2 7.1-1.4" fill="none" stroke="#d39476" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M65 58.4c1.2.2 4.6 1.4 7 1.4c2.3 0 5.8-1.2 6.9-1.4" fill="none" stroke="#d39476" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M28 131.2c3.5.2 14 1.4 21 1.4c7-.1 17.5-1.4 21-1.7" fill="none" stroke="#d39476" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.4"/><path d="M30.8 134.8c3 .2 12.1 1.2 18.2 1.2c6.1-.1 15.2-1.2 18.2-1.4" fill="none" stroke="#d39476" stroke-width=".6" stroke-linecap="round" stroke-opacity="0.28"/><path d="M60.3 108.2c.9-1.3 2.7-2.8 4.1-4.2c1.5-1.3 3.1-2.7 4.6-4c1.4-1.2 2.9-2.5 4.2-3.6c1.4-1.2 2.7-2.4 3.7-3.5c1.1-1.1 2-2.1 2.8-3.2c.7-1.1 1.3-2.1 1.9-3.2c.7-1.1 1.2-2.2 1.8-3.4c.6-1.1 1.1-2.3 1.6-3.4c.5-1.2.9-2.4 1.3-3.4c.4-1.1.8-2.2 1.1-3c.3-.8.5-1.4.7-1.9c.2-.5.3-.6.4-1c.1-.3.2-.5.3-1c.1-.5.2-1.1.4-1.7c.1-.6.1-1.2.3-2c.2-.8.4-2 .8-3c.4-.9 1-1.8 1.7-2.6c.6-.7 1.4-1.4 2.2-1.9c.9-.5 1.8-.9 2.7-1.1c.9-.2 1.9-.2 2.9-.1c.9.1 1.8.4 2.7.8c.8.5 1.6 1.1 2.3 1.8c.7.7 1.3 1.5 1.7 2.4c.4.9.8 1.9.9 2.9c.2 1 .1 2.4.1 3.1c-.1.8-.2 1.1-.2 1.6c0 .5.1.8.1 1.4c.1.7.1 1.5 0 2.3c0 .9-.1 2-.3 3c-.3 1-.6 2.1-.9 3.2c-.3 1.1-.7 2.1-1.1 3.4c-.4 1.2-.8 2.5-1.3 4c-.5 1.4-1 3-1.7 4.6c-.6 1.5-1.4 3.2-2.2 4.9c-.9 1.7-1.9 3.4-3 5.1c-1.1 1.6-2.4 3.3-3.6 4.9c-1.2 1.7-2.4 3.3-3.7 5c-1.2 1.6-2.5 3.2-3.8 4.8c-1.2 1.6-2.5 3.1-3.7 4.6c-1.3 1.4-2.5 3.3-3.8 4.3c-1.2.9-2.2 1.5-3.7 1.5c-1.5.1-3.4-.3-5.2-1.1c-1.7-.7-3.7-2-5.2-3.5c-1.5-1.4-2.9-3.2-3.8-4.9c-.9-1.7-1.4-3.6-1.4-5.1c-.1-1.4.4-2.5 1.3-3.8z" fill="#f7cdb1"/><path d="M89.6 111.4c.6-.9 2.5-3.3 3.7-5c1.2-1.6 2.5-3.3 3.6-4.9c1.1-1.7 2.1-3.4 3-5.1c.8-1.7 1.6-3.4 2.2-4.9c.7-1.6 1.2-3.2 1.7-4.6c.5-1.5.9-2.8 1.3-4c.4-1.3.8-2.3 1.1-3.4c.3-1.1.6-2.2.9-3.2c.2-1 .3-2.1.3-3c.1-.8.1-1.6 0-2.3c0-.6-.1-.9-.1-1.4c0-.5.1-1.3.2-1.6c0-.2.1-.2 0 0c-.2.3-.3 1-.8 1.5c-.4.5-1.2.8-1.9 1.3c-.6.5-1.5 1.1-2 1.8c-.6.7-.7 1.5-1.1 2.3c-.3.9-.4 1.8-.8 2.8c-.3 1.1-.7 2.1-1.1 3.3c-.4 1.2-.8 2.5-1.3 3.9c-.5 1.3-1 2.8-1.6 4.2c-.7 1.5-1.4 3-2.1 4.5c-.8 1.6-1.7 3-2.3 4.9c-.5 1.9-.3 4.4-.8 6.6c-.5 2.1-1.7 5.2-2.1 6.3c-.3 1-.6.8 0 0z" fill="#ecb497"/><path d="M101.1 57.5c.3.1 1 .3 1.5.6c.5.2.9.5 1.4.9c.4.3.8.7 1.1 1.1c.4.4.7.9 1 1.4c.3.4.6.9.8 1.5c.2.5.3 1 .4 1.6c.2.6.2 1.1.2 1.7c.1.6 0 1.4 0 1.7c-.1.3.1.3 0 0c-.2-.2-.8-1.1-1.1-1.6c-.3-.5-.5-.9-.7-1.4c-.3-.4-.5-.8-.7-1.1c-.3-.4-.5-.8-.7-1.1c-.2-.4-.4-.8-.7-1.2c-.2-.3-.4-.7-.7-1.1c-.2-.4-.5-.8-.8-1.3c-.3-.5-.8-1.4-1-1.7c-.1-.3-.2-.1 0 0z" fill="#ecb497"/><path d="M100.7 70.4c-.1 1.3-.4 2.7-.9 3.7c-.4 1.1-1.2 2-1.9 2.6c-.7.6-1.5.9-2.3.8c-.7-.1-1.5-.5-2.1-1.2c-.6-.7-1.1-1.8-1.4-2.9c-.3-1.1-.4-2.5-.3-3.7c.1-1.3.5-2.7.9-3.7c.5-1.1 1.2-2 1.9-2.6c.7-.6 1.6-.9 2.3-.8c.8.1 1.6.5 2.2 1.2c.6.7 1.1 1.8 1.4 2.9c.3 1.1.4 2.5.2 3.7z" fill="#fde1ce" fill-opacity="0.6"/><path d="M95.4 88.5c-.6 1.2-1.4 2.5-2.3 3.4c-.8 1-1.9 1.7-2.8 2c-1 .4-2 .4-2.7.1c-.8-.4-1.5-1.1-1.8-2c-.4-1-.6-2.3-.5-3.5c.1-1.3.5-2.8 1.1-4c.6-1.3 1.4-2.6 2.3-3.5c.8-.9 1.9-1.7 2.8-2c.9-.3 2-.3 2.7 0c.8.3 1.4 1.1 1.8 2c.4.9.5 2.2.4 3.5c-.1 1.2-.5 2.7-1 4z" fill="#fde1ce" fill-opacity="0.35"/><path d="M83.4 83.1c.3-.5 1.1-2.3 1.6-3.4c.5-1.2.9-2.4 1.3-3.4c.4-1.1.8-2.2 1.1-3c.3-.8.5-1.4.7-1.9c.2-.5.3-.6.4-1c.1-.3.2-.5.3-1c.1-.5.2-1.1.4-1.7c.1-.6.1-1.2.3-2c.2-.8.4-2 .8-3c.4-.9 1-1.8 1.7-2.6c.6-.7 1.4-1.4 2.2-1.9c.9-.5 1.8-.9 2.7-1.1c.9-.2 1.9-.2 2.9-.1c.9.1 1.8.4 2.7.8c.8.5 1.6 1.1 2.3 1.8c.7.7 1.3 1.5 1.7 2.4c.4.9.8 1.9.9 2.9c.2 1 .1 2.4.1 3.1c-.1.8-.2 1.1-.2 1.6c0 .5.1.8.1 1.4c.1.7.1 1.5 0 2.3c0 .9-.1 2-.3 3c-.3 1-.6 2.1-.9 3.2c-.3 1.1-.7 2.1-1.1 3.4c-.4 1.2-.8 2.5-1.3 4c-.5 1.4-1 3-1.7 4.6c-.6 1.5-1.4 3.2-2.2 4.9c-.9 1.7-1.9 3.4-3 5.1c-1.1 1.6-2.4 3.3-3.6 4.9c-1.2 1.7-2.4 3.3-3.7 5c-1.2 1.6-2.5 3.2-3.8 4.8c-1.2 1.6-2.5 3.1-3.7 4.6c-1.3 1.4-3.1 3.5-3.8 4.3" fill="none" stroke="#b97754" stroke-width="1"/><path d="M101.3 77.9c-.2-.2-.8-.9-1.3-1.3c-.4-.3-.8-.6-1.3-.9c-.5-.2-1-.5-1.5-.6c-.5-.2-1-.3-1.5-.4c-.5 0-1.1-.1-1.7 0c-.5 0-1.4.2-1.7.2" fill="none" stroke="#d39476" stroke-width=".9" stroke-linecap="round" stroke-opacity="0.5"/><path d="M100.8 75.5c-.1-.1-.6-.6-.9-.9c-.3-.3-.7-.5-1-.7c-.4-.2-.8-.3-1.1-.4c-.4-.2-.8-.3-1.2-.3c-.4-.1-.8-.1-1.2-.1c-.4 0-1.1.2-1.3.2" fill="none" stroke="#d39476" stroke-width=".6" stroke-linecap="round" stroke-opacity="0.3"/></g></svg>'},
  },
  teacher:{
    point:{w:136,h:666,tip:[32.9,10.3],wrist:[62.7,178.5],
      svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 136 666" width="136" height="666"><g class="wh-shadow" fill="#3a2410" stroke="#3a2410" stroke-linejoin="round"><path d="M45.9 171.3l.5 19.5l.9 23.5l59.9 0l-2.4-23.5l-2.3-19.5zM40.5 217.4c-12.8 10.6-3.2 31-5 63.3c-1.7 32.2-3.9 83.7-5.6 130.2c-1.7 46.5-3.5 98.5-4.6 148.8c-1.1 50.2-19.2 127.1-1.9 152.5c17.4 25.4 88.7 25.4 106.1 0c17.3-25.4-.8-102.3-1.9-152.5c-1.1-50.3-3-102.3-4.7-148.8c-1.7-46.5-3.8-98-5.5-130.2c-1.8-32.3 7.7-52.7-5.1-63.3c-12.8-10.5-59-10.5-71.8 0zM39.2 204.5c3-2.8 12.2-4 18.3-5.1c6.2-1 12.4-1.2 18.6-1.2c6.3 0 12.5.2 18.8 1.2c6.3 1.1 15.7 2.3 19.1 5.1c3.4 2.8 1.1 7.6 1.4 11.7c.3 4.1 3.4 11.3.3 12.7c-3.1 1.4-12.7-3.5-19-4.5c-6.3-.9-12.5-1.2-18.8-1.2c-6.2 0-12.4.3-18.6 1.2c-6.2 1-15.1 5.9-18.4 4.5c-3.3-1.4-1.1-8.6-1.4-12.7c-.3-4.1-3.3-8.9-.3-11.7zM47.7 198.6c-5.3-4.5-1.7-14.9-3-23.4c-1.3-8.5-2.8-18.6-4.7-27.3c-1.9-8.8-5.4-17.6-6.7-25.4c-1.2-7.8-1.8-16.5-.8-21.5c1-5.1 2.5-6.5 7-8.8c4.6-2.3 13.9-5.2 20.3-5.3c6.4 0 12.3 2.3 18.2 5.1c6 2.8 12.9 8.1 17.4 11.9c4.6 3.8 7.9 5.7 9.8 10.8c2 5 1.5 11.7 1.7 19.5c.3 7.8.2 18.9-.1 27.3c-.3 8.5-1.5 17.3-1.9 23.5c-.3 6.2 4.5 10.7-.3 13.6c-4.7 3-18.7 3.9-28.2 3.9c-9.4 0-23.4.7-28.7-3.9zM87.2 113.5c-1-1.6.2-1.9.4-3.4c.1-1.5.4-3.2.7-5.8c.4-2.6.7-7 1.3-9.7c.7-2.8 1.1-5.6 2.8-6.9c1.6-1.3 4.9-1.7 7.1-1.1c2.2.5 5.1 2.5 6.1 4.5c1.1 2 .6 4.8.4 7.7c-.3 2.8-1.4 7-1.9 9.5c-.5 2.6-.8 4.2-1.2 5.8c-.3 1.5.7 2.2-.8 3.2c-1.5 1-5.7 3.4-8.2 2.7c-2.5-.6-5.6-4.8-6.7-6.5zM69.5 103.4c-1.4-1.6-.1-1.4-.1-3.1c0-1.7.1-3.7.2-7c.1-3.4 0-9.6.5-13.3c.5-3.6.6-7 2.3-8.8c1.7-1.9 5.3-2.6 7.9-2.2c2.5.4 5.9 2.1 7.4 4.4c1.4 2.3 1.1 5.6 1.2 9.4c0 3.7-.9 9.8-1.2 13.1c-.3 3.4-.5 5.3-.6 7c-.2 1.6 1.1 1.8-.5 3c-1.6 1.2-6 4.5-8.9 4.1c-2.9-.4-6.8-5-8.2-6.6zM51.4 99.5c-1.6-1.5-.3-1.2-.4-2.9c-.1-1.8-.2-3.8-.4-7.6c-.1-3.7-.8-10.8-.6-14.9c.1-4.2 0-7.8 1.6-9.9c1.6-2.2 5.3-3.3 8-3.1c2.7.1 6.4 1.6 8.1 4c1.7 2.3 1.7 5.9 2.1 10c.3 4.2-.1 11.2-.1 15c0 3.7 0 5.8 0 7.5c-.1 1.8 1.3 1.6-.2 2.9c-1.6 1.3-6 5.3-9 5.2c-3-.2-7.5-4.7-9.1-6.2zM42.7 181.4c-3.3-4.9-10.8-17.1-15.4-26c-4.6-8.8-9.6-18.9-12.1-27.2c-2.4-8.4-2.4-16.4-2.6-22.9c-.1-6.5.8-12.3 1.7-16.2c.9-3.9 1.9-4.7 3.7-7c1.9-2.3 4.5-6.1 7.3-6.8c2.7-.7 7.1.5 9.3 2.6c2.2 2.1 3.6 6.7 3.8 9.9c.1 3.1-2.2 6.7-2.7 9c-.4 2.2-.4 1.1-.1 4.4c.3 3.4.4 10.2 1.9 15.7c1.4 5.5 2.8 10.6 6.8 17.3c4 6.7 13.5 15.7 17 22.7c3.5 7 6.5 14.7 4.1 19.2c-2.4 4.6-14.7 7.3-18.5 8.2c-3.8.8-1 1.9-4.2-2.9zM33.7 105.1c-.9-1 0 .8-.2-1.4c-.2-2.3-.5-5.3-1.1-12c-.6-6.8-1.7-20.5-2.4-28.8c-.7-8.2-1.3-14.9-1.9-20.7c-.5-5.9-.8-10.4-1.2-14.3c-.3-3.8-.5-6.1-.7-8.8c-.2-2.7-1-5.3-.4-7.5c.7-2.2 2.4-4.9 4.2-5.7c1.9-.8 5.1-.4 6.9.9c1.8 1.2 3 4.4 3.9 6.7c.8 2.4.6 4.3 1 7.3c.4 3 .8 6.3 1.4 10.7c.6 4.5 1.3 9.2 2.1 16c.8 6.8 1.7 16.4 2.6 24.7c.9 8.4 2.2 20.4 2.7 25.6c.6 5.3.6 4.3.6 5.9c0 1.6 1.3 2.7-.8 3.8c-2.1 1-9.1 2.7-11.9 2.3c-2.7-.4-4-3.6-4.8-4.7z" opacity=".07" stroke-width="9"/><path d="M45.9 171.3l.5 19.5l.9 23.5l59.9 0l-2.4-23.5l-2.3-19.5zM40.5 217.4c-12.8 10.6-3.2 31-5 63.3c-1.7 32.2-3.9 83.7-5.6 130.2c-1.7 46.5-3.5 98.5-4.6 148.8c-1.1 50.2-19.2 127.1-1.9 152.5c17.4 25.4 88.7 25.4 106.1 0c17.3-25.4-.8-102.3-1.9-152.5c-1.1-50.3-3-102.3-4.7-148.8c-1.7-46.5-3.8-98-5.5-130.2c-1.8-32.3 7.7-52.7-5.1-63.3c-12.8-10.5-59-10.5-71.8 0zM39.2 204.5c3-2.8 12.2-4 18.3-5.1c6.2-1 12.4-1.2 18.6-1.2c6.3 0 12.5.2 18.8 1.2c6.3 1.1 15.7 2.3 19.1 5.1c3.4 2.8 1.1 7.6 1.4 11.7c.3 4.1 3.4 11.3.3 12.7c-3.1 1.4-12.7-3.5-19-4.5c-6.3-.9-12.5-1.2-18.8-1.2c-6.2 0-12.4.3-18.6 1.2c-6.2 1-15.1 5.9-18.4 4.5c-3.3-1.4-1.1-8.6-1.4-12.7c-.3-4.1-3.3-8.9-.3-11.7zM47.7 198.6c-5.3-4.5-1.7-14.9-3-23.4c-1.3-8.5-2.8-18.6-4.7-27.3c-1.9-8.8-5.4-17.6-6.7-25.4c-1.2-7.8-1.8-16.5-.8-21.5c1-5.1 2.5-6.5 7-8.8c4.6-2.3 13.9-5.2 20.3-5.3c6.4 0 12.3 2.3 18.2 5.1c6 2.8 12.9 8.1 17.4 11.9c4.6 3.8 7.9 5.7 9.8 10.8c2 5 1.5 11.7 1.7 19.5c.3 7.8.2 18.9-.1 27.3c-.3 8.5-1.5 17.3-1.9 23.5c-.3 6.2 4.5 10.7-.3 13.6c-4.7 3-18.7 3.9-28.2 3.9c-9.4 0-23.4.7-28.7-3.9zM87.2 113.5c-1-1.6.2-1.9.4-3.4c.1-1.5.4-3.2.7-5.8c.4-2.6.7-7 1.3-9.7c.7-2.8 1.1-5.6 2.8-6.9c1.6-1.3 4.9-1.7 7.1-1.1c2.2.5 5.1 2.5 6.1 4.5c1.1 2 .6 4.8.4 7.7c-.3 2.8-1.4 7-1.9 9.5c-.5 2.6-.8 4.2-1.2 5.8c-.3 1.5.7 2.2-.8 3.2c-1.5 1-5.7 3.4-8.2 2.7c-2.5-.6-5.6-4.8-6.7-6.5zM69.5 103.4c-1.4-1.6-.1-1.4-.1-3.1c0-1.7.1-3.7.2-7c.1-3.4 0-9.6.5-13.3c.5-3.6.6-7 2.3-8.8c1.7-1.9 5.3-2.6 7.9-2.2c2.5.4 5.9 2.1 7.4 4.4c1.4 2.3 1.1 5.6 1.2 9.4c0 3.7-.9 9.8-1.2 13.1c-.3 3.4-.5 5.3-.6 7c-.2 1.6 1.1 1.8-.5 3c-1.6 1.2-6 4.5-8.9 4.1c-2.9-.4-6.8-5-8.2-6.6zM51.4 99.5c-1.6-1.5-.3-1.2-.4-2.9c-.1-1.8-.2-3.8-.4-7.6c-.1-3.7-.8-10.8-.6-14.9c.1-4.2 0-7.8 1.6-9.9c1.6-2.2 5.3-3.3 8-3.1c2.7.1 6.4 1.6 8.1 4c1.7 2.3 1.7 5.9 2.1 10c.3 4.2-.1 11.2-.1 15c0 3.7 0 5.8 0 7.5c-.1 1.8 1.3 1.6-.2 2.9c-1.6 1.3-6 5.3-9 5.2c-3-.2-7.5-4.7-9.1-6.2zM42.7 181.4c-3.3-4.9-10.8-17.1-15.4-26c-4.6-8.8-9.6-18.9-12.1-27.2c-2.4-8.4-2.4-16.4-2.6-22.9c-.1-6.5.8-12.3 1.7-16.2c.9-3.9 1.9-4.7 3.7-7c1.9-2.3 4.5-6.1 7.3-6.8c2.7-.7 7.1.5 9.3 2.6c2.2 2.1 3.6 6.7 3.8 9.9c.1 3.1-2.2 6.7-2.7 9c-.4 2.2-.4 1.1-.1 4.4c.3 3.4.4 10.2 1.9 15.7c1.4 5.5 2.8 10.6 6.8 17.3c4 6.7 13.5 15.7 17 22.7c3.5 7 6.5 14.7 4.1 19.2c-2.4 4.6-14.7 7.3-18.5 8.2c-3.8.8-1 1.9-4.2-2.9zM33.7 105.1c-.9-1 0 .8-.2-1.4c-.2-2.3-.5-5.3-1.1-12c-.6-6.8-1.7-20.5-2.4-28.8c-.7-8.2-1.3-14.9-1.9-20.7c-.5-5.9-.8-10.4-1.2-14.3c-.3-3.8-.5-6.1-.7-8.8c-.2-2.7-1-5.3-.4-7.5c.7-2.2 2.4-4.9 4.2-5.7c1.9-.8 5.1-.4 6.9.9c1.8 1.2 3 4.4 3.9 6.7c.8 2.4.6 4.3 1 7.3c.4 3 .8 6.3 1.4 10.7c.6 4.5 1.3 9.2 2.1 16c.8 6.8 1.7 16.4 2.6 24.7c.9 8.4 2.2 20.4 2.7 25.6c.6 5.3.6 4.3.6 5.9c0 1.6 1.3 2.7-.8 3.8c-2.1 1-9.1 2.7-11.9 2.3c-2.7-.4-4-3.6-4.8-4.7z" opacity=".11" stroke-width="3"/></g><g class="wh-hand" stroke-linejoin="round"><path d="M34.4 163.6l-.9 18.6l-.7 22.3l59.9 0l-.8-22.3l-.9-18.6zM34.3 189.7c-5-4.4-.7-14.3-1.3-22.4c-.7-8-1.6-17.6-2.8-26c-1.3-8.4-4.2-16.7-4.9-24.2c-.7-7.4-.7-15.6.7-20.4c1.4-4.8 3-6.2 7.7-8.4c4.7-2.2 14.2-5 20.6-5c6.5-.1 12.2 2.1 17.9 4.8c5.7 2.7 12.3 7.8 16.6 11.4c4.2 3.6 7.4 5.4 9 10.2c1.6 4.8.6 11.1.3 18.6c-.3 7.4-1.2 18-2.1 26c-.9 8.1-2.7 16.5-3.5 22.3c-.8 5.9 3.6 10.3-1.3 13.1c-5 2.8-19 3.7-28.5 3.7c-9.5 0-23.5.6-28.4-3.7zM79.9 108.6c-.1-.6.1-.8.2-1.1c.1-.4.1-.7.2-1.1c0-.3.1-.6.1-1c.1-.5.2-.9.3-1.4c.1-.5.2-1.1.4-1.8c.1-.7.3-1.5.5-2.4c.2-.9.4-1.9.7-2.9c.2-1 .4-2.1.6-3.1c.3-1.1.5-2.2.7-3.2c.3-1.1.5-2.3.8-3.1c.2-.8.4-1.3.9-1.9c.4-.6.9-1.2 1.6-1.6c.6-.4 1.3-.8 2.1-1c.8-.2 1.6-.4 2.5-.4c.8 0 1.7.1 2.5.3c.9.2 1.7.6 2.4 1c.8.4 1.5.9 2 1.5c.6.5 1.1 1.2 1.5 1.9c.3.6.6 1.4.6 2.1c.1.7.1 1.3-.1 2.1c-.1.9-.5 2-.8 3.1c-.2 1-.6 2.1-.9 3.1c-.2 1.1-.6 2.1-.8 3.1c-.3 1-.6 2-.8 2.8c-.3.9-.5 1.7-.7 2.4c-.2.7-.3 1.3-.5 1.8c-.1.5-.2.9-.4 1.3c-.1.4-.2.7-.4 1.1c-.1.3-.2.6-.3.9c-.1.4 0 .6-.3 1.1c-.3.6-.8 1.5-1.5 2c-.8.5-2 .8-3.1.9c-1.2.1-2.6 0-3.8-.3c-1.2-.3-2.6-.9-3.5-1.5c-1-.6-1.8-1.5-2.3-2.3c-.4-.7-.4-1.8-.4-2.4zM62.8 98.9c-.1-.6.1-.7.1-1c0-.4 0-.6 0-.9c0-.3 0-.6.1-1c0-.4 0-.8 0-1.4c.1-.6.2-1.3.3-2.2c.1-.8.3-1.9.4-3.1c.1-1.1.3-2.5.4-3.9c.2-1.3.3-2.8.5-4.3c.2-1.4.3-2.9.5-4.4c.2-1.4.3-3.1.6-4.2c.2-1.1.4-1.6.8-2.3c.4-.7.9-1.4 1.6-1.9c.6-.6 1.4-1.1 2.3-1.4c.8-.4 1.8-.6 2.7-.7c1-.2 2-.1 3 0c.9.1 1.9.4 2.8.8c.9.3 1.7.9 2.4 1.4c.7.6 1.4 1.3 1.9 2c.4.7.8 1.5 1 2.3c.2.8.2 1.3.1 2.4c-.1 1.1-.4 2.8-.6 4.2c-.2 1.5-.5 3-.7 4.4c-.3 1.5-.5 2.9-.8 4.3c-.2 1.3-.4 2.7-.6 3.8c-.2 1.2-.4 2.3-.5 3.1c-.1.9-.2 1.6-.3 2.2c-.2.6-.3 1-.4 1.4c0 .4-.1.6-.2.9c-.1.3-.2.5-.2.9c-.1.3 0 .5-.2 1c-.3.6-.7 1.8-1.5 2.4c-.8.6-2.1 1.2-3.4 1.4c-1.3.3-2.9.3-4.3.1c-1.4-.2-3-.7-4.2-1.3c-1.1-.5-2.2-1.4-2.8-2.2c-.6-.9-.7-2.1-.8-2.8zM45 95.3c-.2-.7 0-.8 0-1.1c0-.3 0-.5-.1-.8c0-.3 0-.5-.1-.9c0-.4 0-.8 0-1.4c0-.7 0-1.4.1-2.4c0-.9.1-2.1.1-3.4c.1-1.3.1-2.9.1-4.4c.1-1.5.1-3.2.2-4.9c0-1.6 0-3.4.1-5c.1-1.6.1-3.5.2-4.7c.1-1.2.3-1.7.6-2.5c.4-.8.9-1.5 1.6-2.2c.6-.6 1.4-1.2 2.2-1.7c.9-.4 1.9-.8 2.9-1c.9-.2 2-.3 3-.2c1.1 0 2.1.2 3.1.5c.9.3 1.9.8 2.7 1.3c.8.6 1.5 1.2 2.1 1.9c.6.8 1 1.6 1.3 2.4c.2.8.3 1.3.3 2.5c0 1.2-.2 3.1-.3 4.8c-.1 1.6-.2 3.3-.3 4.9c-.2 1.7-.3 3.4-.4 4.9c-.1 1.5-.3 3.1-.4 4.4c-.1 1.3-.1 2.5-.2 3.4c-.1 1-.1 1.7-.2 2.3c0 .7-.1 1.1-.2 1.5c0 .4-.1.6-.1.9c-.1.3-.1.5-.2.8c0 .3.2.4-.1 1c-.2.6-.5 1.9-1.3 2.6c-.8.8-2.1 1.5-3.4 1.8c-1.4.4-3.1.6-4.6.5c-1.5 0-3.2-.4-4.4-.9c-1.3-.5-2.5-1.4-3.2-2.2c-.7-.8-.9-2.1-1.1-2.7zM30.5 173.2c-1.5-1.8-3-5.2-4.5-7.8c-1.5-2.7-3-5.5-4.5-8.3c-1.5-2.8-3.1-5.7-4.5-8.6c-1.5-2.9-2.9-5.8-4.2-8.7c-1.3-2.9-2.6-5.8-3.6-8.6c-1-2.9-1.8-5.8-2.4-8.6c-.6-2.8-.8-5.6-1-8.2c-.3-2.6-.2-5.1-.2-7.3c0-2.3.1-4.4.2-6.3c.1-2 .2-3.7.3-5.5c.2-1.8.4-3.6.8-5.2c.4-1.7 1.1-3.4 1.7-4.7c.7-1.4 1.5-2.4 2-3.2c.6-.8 1-1.1 1.4-1.7c.3-.6.4-1 .9-1.8c.5-.8 1.2-2.1 1.9-3c.8-.8 1.7-1.6 2.7-2.2c1-.6 2.1-1 3.1-1.3c1.1-.2 2.3-.3 3.3-.2c1.1.1 2.2.4 3.2.8c1 .5 1.9 1.1 2.7 1.9c.8.8 1.5 1.7 2 2.7c.5 1 .8 2.1 1 3.2c.2 1.1.2 2.3 0 3.5c-.1 1.1-.6 2.3-1 3.3c-.3 1.1-.8 2-1.2 2.9c-.4.8-.8 1.8-1.1 2.4c-.2.6-.2.8-.2 1.1c-.1.4 0 .3 0 .8c-.1.5-.1 1.2-.2 2.3c0 1.1 0 2.7 0 4.3c0 1.6.1 3.4.2 5.2c.1 1.7.3 3.6.6 5.4c.3 1.8.6 3.6 1 5.4c.5 1.8.9 3.5 1.7 5.3c.7 1.9 1.6 3.7 2.8 5.8c1.3 2.1 2.8 4.3 4.5 6.6c1.6 2.4 3.5 4.8 5.3 7.3c1.8 2.5 3.9 5.1 5.6 7.7c1.8 2.6 4.2 5.8 5.1 7.9c1 2.1 1 3.1.6 4.8c-.4 1.8-1.5 3.9-2.9 5.6c-1.5 1.8-3.7 3.6-5.8 4.9c-2.1 1.3-4.7 2.4-7 2.9c-2.2.4-4.6.4-6.3 0c-1.7-.5-2.6-1-4-2.8zM26.9 100.6c-.2-.5 0-.6 0-.7c0-.2 0-.1 0-.2c0-.1 0-.1 0-.5c0-.3-.1-.7-.1-1.5c0-.9 0-1.9-.1-3.6c0-1.6-.1-3.8-.1-6.3c0-2.5-.1-5.5-.1-8.5c0-3.1-.1-6.4-.1-9.6c-.1-3.1-.1-6.4-.1-9.3c-.1-2.8-.2-5.4-.2-7.8c-.1-2.3-.1-4.3-.2-6.3c0-2 0-3.9 0-5.6c-.1-1.8-.1-3.5-.1-5.1c0-1.6 0-3 0-4.5c0-1.4-.1-2.8-.1-4c-.1-1.3-.1-2.4-.1-3.4c0-1 0-1.9 0-2.7c0-.8 0-1.6 0-2.3c0-.8 0-1.5 0-2.2c-.1-.8-.1-1.6-.1-2.5c0-.8 0-1.7.2-2.5c.2-.8.6-1.6 1-2.3c.4-.7 1-1.3 1.6-1.9c.6-.5 1.3-.9 2-1.2c.8-.3 1.6-.5 2.3-.5c.8-.1 1.6 0 2.4.3c.7.2 1.5.6 2.1 1c.7.5 1.3 1.1 1.8 1.8c.5.6.9 1.4 1.2 2.2c.2.8.3 1.7.4 2.5c.1.8.1 1.6.2 2.4c0 .7.1 1.4.2 2.2c0 .7.1 1.5.2 2.3c.1.8.1 1.7.2 2.7c.1 1.1.1 2.2.2 3.5c0 1.2.1 2.6.2 4c.1 1.5.2 2.9.3 4.5c.1 1.6.2 3.3.3 5.1c.1 1.8.2 3.7.3 5.7c.1 2 .2 4 .3 6.3c0 2.4.1 5 .2 7.9c.1 2.8.3 6.1.4 9.3c.1 3.1.2 6.5.4 9.5c.1 3 .2 6.1.3 8.5c.1 2.5.1 4.7.2 6.4c0 1.6.1 2.6.1 3.5c0 .8 0 1.2 0 1.6c0 .3 0 .3 0 .4c0 .1 0 .1 0 .2c0 .2.2.2.1.8c-.2.5-.4 1.9-1.2 2.6c-.7.8-1.9 1.6-3.1 2.1c-1.3.4-3 .7-4.4.8c-1.5 0-3.2-.2-4.5-.6c-1.3-.4-2.5-1.1-3.3-1.9c-.7-.7-1-2-1.2-2.6z" fill="none" stroke="#55301a" stroke-width="3.2"/><path d="M26.8 208.3c-12.8 10.5-3.2 31-5 63.2c-1.8 32.2-3.9 83.7-5.6 130.2c-1.7 46.5-3.6 98.6-4.6 148.8c-1.1 50.2-19.3 127.1-1.9 152.5c17.4 25.4 88.7 25.4 106 0c17.4-25.4-.8-102.3-1.8-152.5c-1.1-50.2-3-102.3-4.7-148.8c-1.7-46.5-3.8-98-5.6-130.2c-1.7-32.2 7.8-52.7-5-63.2c-12.8-10.6-59-10.6-71.8 0zM25.3 195.2c3.2-2.6 12.5-3.8 18.7-4.8c6.3-1 12.5-1.1 18.7-1.1c6.2 0 12.5.1 18.7 1.1c6.2 1 15.5 2.2 18.7 4.8c3.2 2.7.6 7.3.6 11.2c0 3.9 2.6 10.8-.6 12.1c-3.2 1.3-12.5-3.4-18.7-4.3c-6.2-.9-12.5-1.1-18.7-1.1c-6.2 0-12.4.2-18.7 1.1c-6.2.9-15.5 5.6-18.7 4.3c-3.2-1.3-.5-8.2-.5-12.1c0-3.9-2.7-8.5.5-11.2z" fill="none" stroke="#435b75" stroke-width="3.2"/><path d="M34.4 163.6l-.9 18.6l-.7 22.3l59.9 0l-.8-22.3l-.9-18.6z" fill="#9a5f3b"/><path d="M91 163.6l.9 18.6l.8 22.3l-9.5 0l.2-22.3l.7-18.6z" fill="#86522f"/><path d="M26.8 208.3c-12.8 10.5-3.2 31-5 63.2c-1.8 32.2-3.9 83.7-5.6 130.2c-1.7 46.5-3.6 98.6-4.6 148.8c-1.1 50.2-19.3 127.1-1.9 152.5c17.4 25.4 88.7 25.4 106 0c17.4-25.4-.8-102.3-1.8-152.5c-1.1-50.2-3-102.3-4.7-148.8c-1.7-46.5-3.8-98-5.6-130.2c-1.7-32.2 7.8-52.7-5-63.2c-12.8-10.6-59-10.6-71.8 0z" fill="#62809e"/><path d="M98.6 208.3c2.8 10.5 3.3 31 5 63.2c1.8 32.2 3.9 83.7 5.6 130.2c1.7 46.5 3.6 98.6 4.7 148.8c1 50.2 5.2 127.1 1.8 152.5c-3.4 25.4-18.3 25.4-22.3 0c-4-25.4-1.1-102.3-1.9-152.5c-.7-50.2-2-102.3-2.7-148.8c-.8-46.5-1.6-98-1.9-130.2c-.3-32.2-2-52.7 0-63.2c1.9-10.6 8.9-10.6 11.7 0z" fill="#536f8b"/><path d="M98.6 208.3c1.7 10.5 3.3 31 5 63.2c1.8 32.2 3.9 83.7 5.6 130.2c1.7 46.5 3.6 98.6 4.7 148.8c1 50.2 2.9 127.1 1.8 152.5c-1 25.4-6.5 25.4-8.2 0c-1.6-25.4-.8-102.3-1.8-152.5c-1.1-50.2-2.9-102.3-4.5-148.8c-1.5-46.5-3.6-98-4.8-130.2c-1.3-32.2-3-52.7-2.6-63.2c.3-10.6 3.2-10.6 4.8 0z" fill="#435b75" fill-opacity="0.6"/><path d="M29 234.3c-.6 12.4-2.3 40.3-3.7 74.4c-1.4 34.1-3.2 83.7-4.6 130.2c-1.4 46.5-3.1 124-3.7 148.8" fill="none" stroke="#7d99b4" stroke-width="2.4" stroke-linecap="round" stroke-opacity="0.5"/><path d="M27.9 228.7c2.9 1.3 12.3 6.4 17.1 7.8c4.9 1.5 10.1 1 12.1 1.2" fill="none" stroke="#435b75" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.5"/><path d="M68.3 245.5c2.9-.8 12.2-2.8 17.7-4.7c5.4-1.8 12.4-5.4 14.8-6.5" fill="none" stroke="#435b75" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.55"/><path d="M25.3 265.9c3.6 1.1 16 5.8 21.6 6.5c5.6.8 10.1-1.5 12.1-1.8" fill="none" stroke="#435b75" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.35"/><path d="M66.4 290.1c4.2-1.1 18.9-4 25.1-6.5c6.3-2.5 10.3-7 12.3-8.4" fill="none" stroke="#435b75" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.4"/><path d="M21.8 334.7c3.2 1 14.3 5 19.5 5.6c5.3.6 10.1-1.5 12.1-1.8" fill="none" stroke="#435b75" stroke-width="1.2" stroke-linecap="round" stroke-opacity="0.25"/><path d="M25.3 195.2c3.2-2.6 12.5-3.8 18.7-4.8c6.3-1 12.5-1.1 18.7-1.1c6.2 0 12.5.1 18.7 1.1c6.2 1 15.5 2.2 18.7 4.8c3.2 2.7.6 7.3.6 11.2c0 3.9 2.6 10.8-.6 12.1c-3.2 1.3-12.5-3.4-18.7-4.3c-6.2-.9-12.5-1.1-18.7-1.1c-6.2 0-12.4.2-18.7 1.1c-6.2.9-15.5 5.6-18.7 4.3c-3.2-1.3-.5-8.2-.5-12.1c0-3.9-2.7-8.5.5-11.2z" fill="#5d7a98"/><path d="M83.3 190.8c2.3-1.7 13.9 1.8 16.8 4.4c2.9 2.7.6 7.3.6 11.2c0 3.9 2.3 10.7-.6 12.1c-2.9 1.4-14.5-1.6-16.8-3.7c-2.4-2.2 2.6-5.3 2.6-9.3c0-4-5-13-2.6-14.7z" fill="#536f8b"/><path d="M27.6 195.8c2.7-.6 10.6-3.1 16.4-3.9c5.9-.8 12.8-1.1 18.7-1.1c5.9 0 14 .9 16.8 1.1" fill="none" stroke="#89a4be" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.75"/><path d="M26.4 199.5c3-.7 11.6-3.4 17.6-4.3c6.1-.8 12.5-1.1 18.7-1.1c6.2 0 12.7.3 18.7 1.1c6.1.9 14.7 3.6 17.6 4.3" fill="none" stroke="#435b75" stroke-width=".7" stroke-dasharray="1.6 1.6" stroke-opacity="0.45"/><path d="M26.4 213.8c3-.6 11.6-3.2 17.6-4c6.1-.9 12.5-1.2 18.7-1.2c6.2 0 12.7.3 18.7 1.2c6.1.8 14.7 3.4 17.6 4" fill="none" stroke="#435b75" stroke-width=".7" stroke-dasharray="1.6 1.6" stroke-opacity="0.35"/><path d="M25.3 195.2c3.2-2.6 12.5-3.8 18.7-4.8c6.3-1 12.5-1.1 18.7-1.1c6.2 0 12.5.1 18.7 1.1c6.2 1 15.5 2.2 18.7 4.8c3.2 2.7.6 7.3.6 11.2c0 3.9 2.6 10.8-.6 12.1c-3.2 1.3-12.5-3.4-18.7-4.3c-6.2-.9-12.5-1.1-18.7-1.1c-6.2 0-12.4.2-18.7 1.1c-6.2.9-15.5 5.6-18.7 4.3c-3.2-1.3-.5-8.2-.5-12.1c0-3.9-2.7-8.5.5-11.2z" fill="none" stroke="#435b75" stroke-width="1"/><path d="M96.2 204.5c0 .7-.2 1.4-.5 1.9c-.4.4-.9.9-1.4 1.1c-.6.2-1.2.2-1.8 0c-.5-.2-1-.7-1.4-1.1c-.3-.5-.5-1.2-.5-1.9c0-.6.2-1.3.5-1.8c.4-.4.9-.9 1.4-1.1c.6-.2 1.2-.2 1.8 0c.5.2 1 .7 1.4 1.1c.3.5.5 1.2.5 1.8z" fill="#ece8df" stroke="#435b75" stroke-width=".5"/><path d="M34.4 182.2c2.4-.8 9.2 2.8 13.9 3.4c4.7.6 9.6.3 14.4.3c4.8 0 9.7.3 14.4-.3c4.7-.6 11.5-4.2 13.9-3.4c2.3.8 4.9 6.9.2 8.2c-4.7 1.3-19-.4-28.5-.4c-9.5 0-23.7 1.7-28.4.4c-4.8-1.3-2.2-7.4.1-8.2z" fill="#70432a" fill-opacity="0.5"/><path d="M34.3 189.7c-5-4.4-.7-14.3-1.3-22.4c-.7-8-1.6-17.6-2.8-26c-1.3-8.4-4.2-16.7-4.9-24.2c-.7-7.4-.7-15.6.7-20.4c1.4-4.8 3-6.2 7.7-8.4c4.7-2.2 14.2-5 20.6-5c6.5-.1 12.2 2.1 17.9 4.8c5.7 2.7 12.3 7.8 16.6 11.4c4.2 3.6 7.4 5.4 9 10.2c1.6 4.8.6 11.1.3 18.6c-.3 7.4-1.2 18-2.1 26c-.9 8.1-2.7 16.5-3.5 22.3c-.8 5.9 3.6 10.3-1.3 13.1c-5 2.8-19 3.7-28.5 3.7c-9.5 0-23.5.6-28.4-3.7z" fill="#9a5f3b"/><path d="M97.8 109.7c2 3.9.6 11.1.3 18.6c-.3 7.4-1.2 18-2.1 26c-.9 8.1-2.7 16.1-3.5 22.3c-.8 6.2 1.5 12.4-1.3 14.9c-2.8 2.5-13.2 4.7-15.5 0c-2.3-4.6 1.1-18.9 1.7-27.9c.7-9 1.1-18.3 2.2-26c1.2-7.8 3.6-15 4.7-20.5c1-5.4-.6-10.8 1.7-12.1c2.2-1.2 9.8.8 11.8 4.7z" fill="#86522f" fill-opacity="0.75"/><path d="M97.8 111.5c1 2.8.4 9.7 0 16.8c-.4 7.1-1.4 18-2.4 26c-.9 8.1-2.6 16.1-3.3 22.3c-.7 6.2.3 12.4-.9 14.9c-1.2 2.5-5.4 5.3-6.4 0c-.9-5.2.3-22 .8-31.6c.5-9.6 1.2-18 2.2-26c1-8.1 2.3-18.6 3.9-22.4c1.7-3.7 5.1-2.7 6.1 0z" fill="#86522f"/><path d="M97.5 115.3c.4 2.1.4 6.5 0 13c-.4 6.5-1.7 18-2.6 26c-.9 8.1-2.4 16.1-3 22.3c-.6 6.2-.2 12.4-.7 14.9c-.6 2.5-2.3 5.9-2.6 0c-.3-5.9-.4-22.6.7-35.3c1.1-12.7 4.4-34.1 5.8-40.9c1.3-6.9 2-2.2 2.4 0z" fill="#70432a" fill-opacity="0.5"/><path d="M70 125.7c.4 3.2.6 6.7.4 9.8c-.1 3.2-.6 6.3-1.4 9.1c-.7 2.8-1.8 5.4-3.1 7.5c-1.2 2.1-2.8 3.9-4.5 5.2c-1.6 1.2-3.5 2-5.4 2.3c-1.9.3-4 0-6-.7c-1.9-.8-3.9-2.1-5.7-3.8c-1.8-1.6-3.6-3.9-5.1-6.3c-1.4-2.5-2.8-5.4-3.8-8.4c-1-3-1.8-6.3-2.3-9.5c-.4-3.2-.6-6.7-.4-9.8c.1-3.2.6-6.4 1.4-9.1c.7-2.8 1.8-5.4 3.1-7.5c1.2-2.1 2.8-3.9 4.5-5.2c1.6-1.2 3.6-2.1 5.5-2.3c1.9-.3 3.9 0 5.9.7c1.9.8 3.9 2.1 5.7 3.7c1.8 1.7 3.6 3.9 5.1 6.4c1.5 2.4 2.8 5.4 3.8 8.4c1 2.9 1.8 6.3 2.3 9.5z" fill="#b07651" fill-opacity="0.13"/><path d="M61.7 124.7c.3 2.7.5 5.5.4 8c-.2 2.6-.6 5.1-1.2 7.2c-.5 2.2-1.4 4.1-2.4 5.6c-1 1.5-2.3 2.7-3.5 3.3c-1.3.7-2.8.9-4.2.6c-1.4-.3-2.9-1-4.3-2.2c-1.4-1.1-2.7-2.8-3.9-4.7c-1.2-1.9-2.2-4.2-3-6.6c-.9-2.4-1.5-5.2-1.9-7.8c-.3-2.6-.5-5.4-.4-8c.2-2.5.5-5 1.1-7.2c.6-2.1 1.5-4.1 2.5-5.6c1-1.4 2.2-2.6 3.5-3.3c1.3-.6 2.8-.8 4.2-.5c1.4.2 2.9 1 4.3 2.1c1.3 1.2 2.7 2.9 3.9 4.7c1.1 1.9 2.2 4.3 3 6.7c.9 2.4 1.5 5.1 1.9 7.7z" fill="#b07651" fill-opacity="0.13"/><path d="M36.1 105c1.5 4.2 6.3 16.6 9 25.1c2.6 8.6 5.6 21.7 6.8 26.1" fill="none" stroke="#b07651" stroke-width="1.1" stroke-linecap="round" stroke-opacity="0.16"/><path d="M54.5 100.4c.5 4.9 2 20.4 2.8 29.7c.8 9.3 1.7 21.7 2.1 26.1" fill="none" stroke="#b07651" stroke-width="1.1" stroke-linecap="round" stroke-opacity="0.16"/><path d="M72 104.9c-.5 4.2-2.2 16.7-3.1 25.2c-.9 8.6-2 21.7-2.4 26.1" fill="none" stroke="#b07651" stroke-width="1.1" stroke-linecap="round" stroke-opacity="0.16"/><path d="M79.9 108.6c-.1-.6.1-.8.2-1.1c.1-.4.1-.7.2-1.1c0-.3.1-.6.1-1c.1-.5.2-.9.3-1.4c.1-.5.2-1.1.4-1.8c.1-.7.3-1.5.5-2.4c.2-.9.4-1.9.7-2.9c.2-1 .4-2.1.6-3.1c.3-1.1.5-2.2.7-3.2c.3-1.1.5-2.3.8-3.1c.2-.8.4-1.3.9-1.9c.4-.6.9-1.2 1.6-1.6c.6-.4 1.3-.8 2.1-1c.8-.2 1.6-.4 2.5-.4c.8 0 1.7.1 2.5.3c.9.2 1.7.6 2.4 1c.8.4 1.5.9 2 1.5c.6.5 1.1 1.2 1.5 1.9c.3.6.6 1.4.6 2.1c.1.7.1 1.3-.1 2.1c-.1.9-.5 2-.8 3.1c-.2 1-.6 2.1-.9 3.1c-.2 1.1-.6 2.1-.8 3.1c-.3 1-.6 2-.8 2.8c-.3.9-.5 1.7-.7 2.4c-.2.7-.3 1.3-.5 1.8c-.1.5-.2.9-.4 1.3c-.1.4-.2.7-.4 1.1c-.1.3-.2.6-.3.9c-.1.4 0 .6-.3 1.1c-.3.6-.8 1.5-1.5 2c-.8.5-2 .8-3.1.9c-1.2.1-2.6 0-3.8-.3c-1.2-.3-2.6-.9-3.5-1.5c-1-.6-1.8-1.5-2.3-2.3c-.4-.7-.4-1.8-.4-2.4z" fill="#9a5f3b"/><path d="M95.1 110.2c.1-.2.3-.7.4-1.1c.2-.4.3-.8.4-1.3c.2-.5.3-1.1.5-1.8c.2-.7.4-1.5.7-2.4c.2-.8.5-1.8.8-2.8c.2-1 .6-2 .8-3.1c.3-1 .7-2.1.9-3.1c.3-1.1.7-2.6.8-3.1c.2-.5.3-.5 0 0c-.2.5-.6 2-1.3 2.9c-.6 1-1.7 1.9-2.6 2.8c-.8.9-1.9 1.8-2.5 2.7c-.6.9-.9 1.8-1.3 2.7c-.3.8-.6 1.6-.6 2.4c.1.7.6 1.4 1.1 2.1c.5.7 1.6 1.4 1.9 1.9c.3.5 0 1 0 1.2c.1.1 0 .1 0 0z" fill="#86522f"/><path d="M95.8 81.3c.2.1.9.4 1.3.7c.4.2.8.6 1.1.9c.4.4.7.8 1 1.2c.2.4.5.8.7 1.3c.2.5.4 1 .5 1.5c.2.5.2 1 .3 1.5c0 .5 0 1 0 1.6c-.1.5-.2 1.3-.3 1.5c0 .3.2.3 0 0c-.1-.2-.6-1.1-.8-1.6c-.3-.5-.4-.9-.6-1.3c-.2-.4-.4-.7-.6-1.1c-.1-.3-.3-.7-.4-1c-.2-.4-.3-.7-.5-1.1c-.2-.4-.3-.7-.5-1.1c-.2-.4-.3-.8-.5-1.3c-.3-.5-.6-1.5-.7-1.7c-.1-.3-.2-.2 0 0z" fill="#86522f"/><path d="M95.9 107.8c.1-.3.3-1.1.5-1.8c.2-.7.4-1.5.7-2.4c.2-.8.5-1.8.8-2.8c.2-1 .6-2 .8-3.1c.3-1 .8-2.6.9-3.1c.2-.6.2-.5 0 0c-.2.5-.8 2-1.3 3c-.4 1-1.1 2-1.6 2.9c-.5 1-1 1.9-1.1 2.8c-.2.9 0 1.8.1 2.5c0 .8.2 1.7.2 2c0 .3 0 .3 0 0z" fill="#70432a" fill-opacity="0.5"/><path d="M85.7 84.5c.4-.4 1.3-1.6 2-2.2c.8-.6 1.7-1 2.6-1.3c.9-.3 1.9-.4 2.8-.4c.9.1 1.8.3 2.7.7c.8.3 1.6.9 2.3 1.5c.7.7 1.3 1.5 1.7 2.4c.4.8.7 1.8.8 2.8c.2.9 0 2.5 0 3c-.1.5.1.4 0 0c-.2-.5-.8-2-1.2-2.8c-.4-.8-.9-1.4-1.3-2c-.5-.6-1.1-1.1-1.6-1.5c-.6-.4-1.1-.7-1.7-1c-.6-.2-1.3-.4-1.9-.6c-.7-.1-1.4-.2-2.1-.1c-.8 0-1.5.2-2.3.4c-.9.3-2.3.9-2.8 1.1c-.4.1-.3.3 0 0z" fill="#86522f" fill-opacity="0.8"/><path d="M93 91.8c-.1.5-.5 1-1 1.3c-.5.3-1.2.4-1.9.4c-.7 0-1.5-.2-2.1-.5c-.6-.3-1.2-.8-1.4-1.3c-.3-.5-.5-1.1-.3-1.6c.1-.4.5-.9 1-1.2c.4-.3 1.2-.5 1.9-.5c.6 0 1.5.2 2.1.5c.5.3 1.1.9 1.4 1.3c.3.5.4 1.1.3 1.6z" fill="#b07651" fill-opacity="0.55"/><path d="M82.3 96.9c.1-.5.4-2.1.6-3.1c.3-1.1.5-2.2.7-3.2c.3-1.1.5-2.3.8-3.1c.2-.8.4-1.3.9-1.9c.4-.6.9-1.2 1.6-1.6c.6-.4 1.3-.8 2.1-1c.8-.2 1.6-.4 2.5-.4c.8 0 1.7.1 2.5.3c.9.2 1.7.6 2.4 1c.8.4 1.5.9 2 1.5c.6.5 1.1 1.2 1.5 1.9c.3.6.6 1.4.6 2.1c.1.7.1 1.3-.1 2.1c-.1.9-.5 2-.8 3.1c-.2 1-.6 2.1-.9 3.1c-.2 1.1-.6 2.1-.8 3.1c-.3 1-.6 2-.8 2.8c-.3.9-.5 1.7-.7 2.4c-.2.7-.4 1.5-.5 1.8" fill="none" stroke="#55301a" stroke-width="1"/><path d="M93.8 94.7c-.2 0-.8.2-1.2.3c-.4.1-.8.1-1.2.1c-.3 0-.7 0-1-.1c-.4-.1-.7-.2-1.1-.4c-.3-.2-.6-.4-1-.7c-.3-.2-.7-.7-.9-.8" fill="none" stroke="#6a3c22" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.55"/><path d="M93.7 91.9c-.2.1-.7.2-.9.3c-.3 0-.6 0-.9 0c-.3 0-.6 0-.8-.1c-.3 0-.6-.1-.8-.3c-.3-.1-.5-.2-.8-.4c-.2-.2-.5-.6-.6-.7" fill="none" stroke="#6a3c22" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.4"/><path d="M62.8 98.9c-.1-.6.1-.7.1-1c0-.4 0-.6 0-.9c0-.3 0-.6.1-1c0-.4 0-.8 0-1.4c.1-.6.2-1.3.3-2.2c.1-.8.3-1.9.4-3.1c.1-1.1.3-2.5.4-3.9c.2-1.3.3-2.8.5-4.3c.2-1.4.3-2.9.5-4.4c.2-1.4.3-3.1.6-4.2c.2-1.1.4-1.6.8-2.3c.4-.7.9-1.4 1.6-1.9c.6-.6 1.4-1.1 2.3-1.4c.8-.4 1.8-.6 2.7-.7c1-.2 2-.1 3 0c.9.1 1.9.4 2.8.8c.9.3 1.7.9 2.4 1.4c.7.6 1.4 1.3 1.9 2c.4.7.8 1.5 1 2.3c.2.8.2 1.3.1 2.4c-.1 1.1-.4 2.8-.6 4.2c-.2 1.5-.5 3-.7 4.4c-.3 1.5-.5 2.9-.8 4.3c-.2 1.3-.4 2.7-.6 3.8c-.2 1.2-.4 2.3-.5 3.1c-.1.9-.2 1.6-.3 2.2c-.2.6-.3 1-.4 1.4c0 .4-.1.6-.2.9c-.1.3-.2.5-.2.9c-.1.3 0 .5-.2 1c-.3.6-.7 1.8-1.5 2.4c-.8.6-2.1 1.2-3.4 1.4c-1.3.3-2.9.3-4.3.1c-1.4-.2-3-.7-4.2-1.3c-1.1-.5-2.2-1.4-2.8-2.2c-.6-.9-.7-2.1-.8-2.8z" fill="#9a5f3b"/><path d="M80.2 99.4c0-.1.2-.5.2-.9c.1-.4.2-.8.4-1.4c.1-.6.2-1.3.3-2.2c.1-.8.3-1.9.5-3.1c.2-1.1.4-2.5.6-3.8c.3-1.4.5-2.8.8-4.3c.2-1.4.5-2.9.7-4.4c.2-1.4.5-3.5.6-4.2c.1-.6.2-.6 0 0c-.2.7-.6 2.8-1.2 4.1c-.7 1.4-1.8 2.8-2.7 4.2c-.9 1.3-2 2.7-2.6 4c-.7 1.3-1 2.6-1.2 3.7c-.3 1.2-.6 2.2-.5 3.1c.2 1 .8 1.7 1.4 2.4c.7.7 2 1.3 2.4 1.8c.5.5.2.8.3 1c0 .2-.1.2 0 0z" fill="#86522f"/><path d="M77.8 64.1c.3.1 1.1.4 1.6.7c.5.2.9.5 1.4.9c.4.4.8.8 1.2 1.2c.4.4.7.9 1 1.4c.3.5.5 1 .7 1.6c.3.5.4 1.1.5 1.7c.1.6.2 1.2.2 1.8c0 .6-.1 1.4-.1 1.7c0 .3.2.3 0 0c-.2-.2-.8-1.2-1.1-1.7c-.4-.5-.6-.9-.9-1.4c-.2-.4-.5-.8-.7-1.1c-.2-.4-.5-.8-.7-1.2c-.2-.3-.4-.7-.6-1.1c-.2-.4-.5-.8-.7-1.2c-.2-.5-.5-.9-.8-1.4c-.3-.6-.8-1.6-1-1.9c-.1-.3-.2-.1 0 0z" fill="#86522f"/><path d="M80.8 97.1c0-.4.2-1.3.3-2.2c.1-.8.3-1.9.5-3.1c.2-1.1.4-2.5.6-3.8c.3-1.4.5-2.8.8-4.3c.2-1.4.6-3.6.7-4.4c.1-.7.2-.7 0 0c-.2.7-.8 2.9-1.2 4.3c-.5 1.5-1.2 2.9-1.6 4.2c-.5 1.3-.9 2.6-1.1 3.8c-.1 1.2.3 2.3.4 3.2c.2.9.4 1.9.5 2.3c.1.4 0 .3.1 0z" fill="#70432a" fill-opacity="0.5"/><path d="M66.8 68.9c.4-.4 1.3-1.9 2.1-2.6c.8-.8 1.7-1.4 2.7-1.9c1-.4 2.1-.6 3.1-.7c1-.1 2.2.1 3.1.4c1 .3 2 .8 2.9 1.5c.8.7 1.6 1.5 2.1 2.4c.6 1 1.1 2 1.3 3.1c.3 1.1.2 2.8.3 3.4c0 .6.3.5 0 0c-.3-.5-1.1-2.1-1.7-3c-.5-.8-1.1-1.5-1.7-2.1c-.6-.6-1.3-1.1-1.9-1.5c-.7-.4-1.4-.7-2.1-.9c-.7-.2-1.4-.4-2.2-.4c-.8-.1-1.6-.1-2.4.1c-.8.1-1.7.3-2.6.7c-.9.4-2.5 1.3-3 1.5c-.4.3-.3.5 0 0z" fill="#86522f" fill-opacity="0.8"/><path d="M76 76.4c-.1.5-.5 1.1-1 1.5c-.5.4-1.4.7-2.1.7c-.8.1-1.7 0-2.4-.3c-.7-.3-1.5-.8-1.8-1.3c-.4-.5-.6-1.2-.6-1.7c.1-.6.5-1.2 1-1.6c.5-.4 1.4-.7 2.1-.7c.8-.1 1.7 0 2.4.3c.7.3 1.5.8 1.9 1.3c.3.5.5 1.2.5 1.8z" fill="#b07651" fill-opacity="0.55"/><path d="M64.1 85.4c.1-.7.3-2.8.5-4.3c.2-1.4.3-2.9.5-4.4c.2-1.4.3-3.1.6-4.2c.2-1.1.4-1.6.8-2.3c.4-.7.9-1.4 1.6-1.9c.6-.6 1.4-1.1 2.3-1.4c.8-.4 1.8-.6 2.7-.7c1-.2 2-.1 3 0c.9.1 1.9.4 2.8.8c.9.3 1.7.9 2.4 1.4c.7.6 1.4 1.3 1.9 2c.4.7.8 1.5 1 2.3c.2.8.2 1.3.1 2.4c-.1 1.1-.4 2.8-.6 4.2c-.2 1.5-.5 3-.7 4.4c-.3 1.5-.5 2.9-.8 4.3c-.2 1.3-.4 2.7-.6 3.8c-.2 1.2-.4 2.6-.5 3.1" fill="none" stroke="#55301a" stroke-width="1"/><path d="M77.2 79.9c-.3.1-.9.4-1.4.6c-.4.1-.8.2-1.3.2c-.4.1-.8 0-1.2 0c-.4-.1-.8-.2-1.2-.3c-.4-.2-.8-.4-1.2-.6c-.4-.3-1-.8-1.2-.9" fill="none" stroke="#6a3c22" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.55"/><path d="M76.6 77.2c-.2.1-.7.3-1 .4c-.3.1-.7.1-1 .2c-.3 0-.6 0-.9-.1c-.3 0-.6-.1-.9-.2c-.3-.1-.6-.3-.9-.4c-.3-.2-.7-.6-.9-.7" fill="none" stroke="#6a3c22" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.4"/><path d="M45 95.3c-.2-.7 0-.8 0-1.1c0-.3 0-.5-.1-.8c0-.3 0-.5-.1-.9c0-.4 0-.8 0-1.4c0-.7 0-1.4.1-2.4c0-.9.1-2.1.1-3.4c.1-1.3.1-2.9.1-4.4c.1-1.5.1-3.2.2-4.9c0-1.6 0-3.4.1-5c.1-1.6.1-3.5.2-4.7c.1-1.2.3-1.7.6-2.5c.4-.8.9-1.5 1.6-2.2c.6-.6 1.4-1.2 2.2-1.7c.9-.4 1.9-.8 2.9-1c.9-.2 2-.3 3-.2c1.1 0 2.1.2 3.1.5c.9.3 1.9.8 2.7 1.3c.8.6 1.5 1.2 2.1 1.9c.6.8 1 1.6 1.3 2.4c.2.8.3 1.3.3 2.5c0 1.2-.2 3.1-.3 4.8c-.1 1.6-.2 3.3-.3 4.9c-.2 1.7-.3 3.4-.4 4.9c-.1 1.5-.3 3.1-.4 4.4c-.1 1.3-.1 2.5-.2 3.4c-.1 1-.1 1.7-.2 2.3c0 .7-.1 1.1-.2 1.5c0 .4-.1.6-.1.9c-.1.3-.1.5-.2.8c0 .3.2.4-.1 1c-.2.6-.5 1.9-1.3 2.6c-.8.8-2.1 1.5-3.4 1.8c-1.4.4-3.1.6-4.6.5c-1.5 0-3.2-.4-4.4-.9c-1.3-.5-2.5-1.4-3.2-2.2c-.7-.8-.9-2.1-1.1-2.7z" fill="#9a5f3b"/><path d="M63.3 94.4c0-.2.1-.5.1-.9c.1-.4.2-.8.2-1.5c.1-.6.1-1.3.2-2.3c.1-.9.1-2.1.2-3.4c.1-1.3.3-2.9.4-4.4c.1-1.5.2-3.2.4-4.9c.1-1.6.2-3.3.3-4.9c.1-1.7.3-4 .3-4.8c.1-.8.2-.8 0 0c-.1.8-.4 3.1-.9 4.7c-.6 1.6-1.7 3.3-2.5 4.9c-.8 1.6-1.8 3.2-2.4 4.8c-.5 1.5-.7 3-.9 4.3c-.2 1.3-.4 2.5-.2 3.4c.3 1 1 1.8 1.7 2.5c.8.6 2.2 1.1 2.7 1.5c.5.5.3.8.4 1c0 .1-.1.1 0 0z" fill="#86522f"/><path d="M57.6 56.3c.3.1 1.2.3 1.7.6c.5.2 1.1.5 1.6.8c.4.3.9.7 1.3 1.2c.5.4.9.8 1.2 1.3c.4.5.7 1.1 1 1.6c.2.6.4 1.2.6 1.8c.2.6.3 1.2.4 1.8c0 .7 0 1.6 0 1.9c0 .3.3.3 0 0c-.2-.3-.9-1.2-1.3-1.7c-.4-.5-.7-.9-1-1.4c-.3-.4-.6-.8-.9-1.1c-.3-.4-.6-.8-.8-1.2c-.3-.3-.5-.7-.8-1.1c-.3-.4-.5-.8-.8-1.2c-.3-.5-.6-.9-1-1.4c-.4-.6-1-1.6-1.2-1.9c-.2-.3-.3-.1 0 0z" fill="#86522f"/><path d="M63.6 92c.1-.3.1-1.3.2-2.3c.1-.9.1-2.1.2-3.4c.1-1.3.3-2.9.4-4.4c.1-1.5.2-3.2.4-4.9c.1-1.6.3-4.1.3-4.9c.1-.9.2-.9 0 0c-.1.8-.5 3.3-.8 4.9c-.4 1.7-1 3.3-1.4 4.8c-.3 1.6-.7 3.1-.7 4.4c0 1.3.4 2.5.7 3.5c.2 1 .6 1.9.7 2.3c.1.4 0 .4 0 0z" fill="#70432a" fill-opacity="0.5"/><path d="M46.5 62.4c.3-.5 1.1-2.2 1.9-3c.8-.9 1.7-1.6 2.7-2.2c1-.5 2.1-.9 3.2-1c1.1-.2 2.3-.1 3.3.1c1.1.3 2.2.7 3.1 1.3c1 .6 1.8 1.5 2.5 2.4c.7.9 1.3 2 1.7 3.1c.3 1.1.4 3 .5 3.5c.1.6.4.5 0 0c-.3-.4-1.3-2.1-2-2.9c-.6-.9-1.3-1.5-2-2.1c-.7-.6-1.4-1-2.2-1.4c-.7-.3-1.4-.6-2.2-.7c-.8-.2-1.6-.3-2.4-.3c-.8 0-1.6.1-2.5.3c-.8.2-1.7.5-2.6 1c-.9.5-2.5 1.6-3 1.9c-.5.3-.3.5 0 0z" fill="#86522f" fill-opacity="0.8"/><path d="M56.8 69.4c-.1.5-.4 1.2-.9 1.7c-.5.4-1.4.8-2.1.9c-.8.2-1.9.1-2.6-.1c-.8-.2-1.6-.7-2-1.2c-.5-.5-.8-1.2-.7-1.8c0-.6.3-1.2.8-1.7c.5-.4 1.4-.8 2.2-1c.8-.1 1.8 0 2.5.2c.8.2 1.6.7 2.1 1.2c.4.5.7 1.2.7 1.8z" fill="#b07651" fill-opacity="0.55"/><path d="M45 85.3c0-.8.1-2.9.1-4.4c.1-1.5.1-3.2.2-4.9c0-1.6 0-3.4.1-5c.1-1.6.1-3.5.2-4.7c.1-1.2.3-1.7.6-2.5c.4-.8.9-1.5 1.6-2.2c.6-.6 1.4-1.2 2.2-1.7c.9-.4 1.9-.8 2.9-1c.9-.2 2-.3 3-.2c1.1 0 2.1.2 3.1.5c.9.3 1.9.8 2.7 1.3c.8.6 1.5 1.2 2.1 1.9c.6.8 1 1.6 1.3 2.4c.2.8.3 1.3.3 2.5c0 1.2-.2 3.1-.3 4.8c-.1 1.6-.2 3.3-.3 4.9c-.2 1.7-.3 3.4-.4 4.9c-.1 1.5-.3 3.6-.4 4.4" fill="none" stroke="#55301a" stroke-width="1"/><path d="M58.3 73.2c-.2.1-.9.5-1.3.7c-.5.2-.9.3-1.3.4c-.5.1-.9.1-1.4.1c-.4-.1-.8-.1-1.3-.3c-.4-.1-.8-.3-1.3-.5c-.4-.2-1-.7-1.2-.8" fill="none" stroke="#6a3c22" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.55"/><path d="M57.5 70.5c-.2.1-.7.4-1 .5c-.4.2-.7.3-1 .3c-.4.1-.7.1-1 .1c-.3 0-.7-.1-1-.2c-.3-.1-.6-.2-1-.4c-.3-.1-.8-.5-.9-.6" fill="none" stroke="#6a3c22" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.4"/><path d="M30.5 173.2c-1.5-1.8-3-5.2-4.5-7.8c-1.5-2.7-3-5.5-4.5-8.3c-1.5-2.8-3.1-5.7-4.5-8.6c-1.5-2.9-2.9-5.8-4.2-8.7c-1.3-2.9-2.6-5.8-3.6-8.6c-1-2.9-1.8-5.8-2.4-8.6c-.6-2.8-.8-5.6-1-8.2c-.3-2.6-.2-5.1-.2-7.3c0-2.3.1-4.4.2-6.3c.1-2 .2-3.7.3-5.5c.2-1.8.4-3.6.8-5.2c.4-1.7 1.1-3.4 1.7-4.7c.7-1.4 1.5-2.4 2-3.2c.6-.8 1-1.1 1.4-1.7c.3-.6.4-1 .9-1.8c.5-.8 1.2-2.1 1.9-3c.8-.8 1.7-1.6 2.7-2.2c1-.6 2.1-1 3.1-1.3c1.1-.2 2.3-.3 3.3-.2c1.1.1 2.2.4 3.2.8c1 .5 1.9 1.1 2.7 1.9c.8.8 1.5 1.7 2 2.7c.5 1 .8 2.1 1 3.2c.2 1.1.2 2.3 0 3.5c-.1 1.1-.6 2.3-1 3.3c-.3 1.1-.8 2-1.2 2.9c-.4.8-.8 1.8-1.1 2.4c-.2.6-.2.8-.2 1.1c-.1.4 0 .3 0 .8c-.1.5-.1 1.2-.2 2.3c0 1.1 0 2.7 0 4.3c0 1.6.1 3.4.2 5.2c.1 1.7.3 3.6.6 5.4c.3 1.8.6 3.6 1 5.4c.5 1.8.9 3.5 1.7 5.3c.7 1.9 1.6 3.7 2.8 5.8c1.3 2.1 2.8 4.3 4.5 6.6c1.6 2.4 3.5 4.8 5.3 7.3c1.8 2.5 3.9 5.1 5.6 7.7c1.8 2.6 4.2 5.8 5.1 7.9c1 2.1 1 3.1.6 4.8c-.4 1.8-1.5 3.9-2.9 5.6c-1.5 1.8-3.7 3.6-5.8 4.9c-2.1 1.3-4.7 2.4-7 2.9c-2.2.4-4.6.4-6.3 0c-1.7-.5-2.6-1-4-2.8z" fill="#9a5f3b"/><path d="M45.2 142.2c-.9-1.2-3.7-4.9-5.3-7.3c-1.7-2.3-3.2-4.5-4.5-6.6c-1.2-2.1-2.1-3.9-2.8-5.8c-.8-1.8-1.2-3.5-1.7-5.3c-.4-1.8-.7-3.6-1-5.4c-.3-1.8-.5-3.7-.6-5.4c-.1-1.8-.2-3.6-.2-5.2c0-1.6 0-3.2 0-4.3c.1-1.1.1-1.8.2-2.3c0-.5-.1-.4 0-.8c0-.3 0-.5.2-1.1c.3-.6.7-1.6 1.1-2.4c.4-.9 1-2.4 1.2-2.9c.2-.4.3-.4 0 0c-.3.4-1 1.9-1.9 2.5c-.9.6-2.3.8-3.4 1.1c-1.1.2-2.3.1-3.1.4c-.7.4-1 .9-1.3 1.8c-.3.8-.3 1.9-.3 3.2c-.1 1.3-.1 2.9-.2 4.6c0 1.7 0 3.7.1 5.6c.1 1.9.2 4 .5 6c.2 2.1.5 4.2 1 6.3c.5 2.1.9 4.3 1.9 6.4c.9 2.1 1.8 4.4 3.8 6.3c2.1 1.9 5.7 3.1 8.4 4.9c2.7 1.7 6.6 4.7 7.9 5.7c1.3.9.9 1.2 0 0z" fill="#86522f"/><path d="M28.5 73.7c.3.2 1 .7 1.4 1.1c.5.5.9 1 1.2 1.5c.4.5.7 1.1.9 1.6c.3.6.5 1.2.6 1.9c.2.6.3 1.2.3 1.9c.1.6 0 1.3 0 1.9c-.1.7-.2 1.3-.4 2c-.2.6-.6 1.5-.7 1.8c-.1.3.1.4 0 0c-.1-.3-.5-1.5-.6-2.2c-.2-.6-.3-1.1-.5-1.7c-.1-.5-.2-1-.4-1.5c-.1-.5-.2-.9-.3-1.4c-.2-.5-.2-.9-.4-1.4c-.1-.5-.1-1-.3-1.5c-.1-.6-.2-1.1-.4-1.8c-.1-.6-.3-1.9-.4-2.2c0-.4-.2-.2 0 0z" fill="#86522f"/><path d="M39.9 134.9c-.8-1.1-3.2-4.5-4.5-6.6c-1.2-2.1-2.1-3.9-2.8-5.8c-.8-1.8-1.2-3.5-1.7-5.3c-.4-1.8-.7-3.6-1-5.4c-.3-1.8-.5-3.7-.6-5.4c-.1-1.8-.2-3.6-.2-5.2c0-1.6 0-3.2 0-4.3c.1-1.1.1-1.8.2-2.3c0-.5-.1-.4 0-.8c0-.3 0-.5.2-1.1c.3-.6.9-2 1.1-2.4c.2-.4.3-.4 0 0c-.2.3-1.1 1.6-1.5 2.1c-.5.5-1 .5-1.4.8c-.3.3-.5.4-.7 1c-.1.5-.1 1.4-.2 2.5c0 1.2-.1 2.8 0 4.4c0 1.7 0 3.5.1 5.3c.1 1.9.3 3.8.6 5.7c.2 1.8.5 3.8 1 5.6c.6 1.9 1.1 3.7 2.2 5.5c1.1 1.8 2.7 3.4 4.3 5.4c1.5 1.9 4.1 5.3 4.9 6.3c.8 1.1.7 1.1 0 0z" fill="#70432a" fill-opacity="0.5"/><path d="M23.8 144.4c-.7-1.3-3-5.4-4.2-8c-1.3-2.7-2.5-5.3-3.4-7.8c-.9-2.6-1.6-5.1-2.2-7.6c-.5-2.5-.8-5-1-7.4c-.2-2.3-.3-4.6-.3-6.7c0-2.2.1-4.2.1-6c.1-1.9.1-3.6.2-5.1c.2-1.6.3-3.1.6-4.4c.3-1.3.8-2.5 1.2-3.5c.5-1 1.1-1.8 1.5-2.6c.5-.7 1.1-1.6 1.3-1.9" fill="none" stroke="#b07651" stroke-width="3.6" stroke-linecap="round" stroke-opacity="0.5"/><path d="M30.5 173.2c-.8-1.3-3-5.2-4.5-7.8c-1.5-2.7-3-5.5-4.5-8.3c-1.5-2.8-3.1-5.7-4.5-8.6c-1.5-2.9-2.9-5.8-4.2-8.7c-1.3-2.9-2.6-5.8-3.6-8.6c-1-2.9-1.8-5.8-2.4-8.6c-.6-2.8-.8-5.6-1-8.2c-.3-2.6-.2-5.1-.2-7.3c0-2.3.1-4.4.2-6.3c.1-2 .2-3.7.3-5.5c.2-1.8.4-3.6.8-5.2c.4-1.7 1.1-3.4 1.7-4.7c.7-1.4 1.5-2.4 2-3.2c.6-.8 1-1.1 1.4-1.7c.3-.6.4-1 .9-1.8c.5-.8 1.2-2.1 1.9-3c.8-.8 1.7-1.6 2.7-2.2c1-.6 2.1-1 3.1-1.3c1.1-.2 2.3-.3 3.3-.2c1.1.1 2.2.4 3.2.8c1 .5 1.9 1.1 2.7 1.9c.8.8 1.5 1.7 2 2.7c.5 1 .8 2.1 1 3.2c.2 1.1.2 2.3 0 3.5c-.1 1.1-.6 2.3-1 3.3c-.3 1.1-1 2.4-1.2 2.9" fill="none" stroke="#55301a" stroke-width="1"/><path d="M19.7 96.8c-.3.1-1 .6-1.4.8c-.5.2-.9.3-1.3.4c-.5.1-.9.1-1.4.1c-.4 0-.8-.1-1.3-.3c-.4-.1-.8-.3-1.2-.6c-.4-.3-1.1-.8-1.3-1" fill="none" stroke="#6a3c22" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.5"/><path d="M21.9 75.7c-.5-.2-1.1-.4-1.6-.4c-.5-.1-.9 0-1.4.2c-.4.2-.9.4-1.3.8c-.4.3-.8.7-1.2 1.2c-.4.6-.8 1.3-1.1 2c-.3.7-.7 1.7-.9 2.2c-.2.6-.2.9-.1 1.3c0 .4.1.7.3 1c.1.3.3.6.7.9c.4.3 1.2.7 1.8 1c.7.3 1.5.6 2 .8c.5.1.8 0 1.2 0c.3-.1.6-.2.9-.5c.3-.2.6-.4.9-.9c.3-.5.8-1.4 1.1-2.1c.4-.7.6-1.5.8-2.1c.2-.7.2-1.2.2-1.8c0-.5-.1-1-.3-1.5c-.1-.4-.4-.8-.7-1.2c-.4-.3-.9-.7-1.3-.9z" fill="#c3967d" stroke="#97664b" stroke-width=".7"/><path d="M16.2 82.7c.1-.2.4-.9.6-1.3c.3-.5.5-.9.7-1.4c.2-.4.4-.9.6-1.3c.2-.5.5-1.2.6-1.4" fill="none" stroke="#dfbfac" stroke-width=".9" stroke-linecap="round" stroke-opacity="0.75"/><path d="M26.9 100.6c-.2-.5 0-.6 0-.7c0-.2 0-.1 0-.2c0-.1 0-.1 0-.5c0-.3-.1-.7-.1-1.5c0-.9 0-1.9-.1-3.6c0-1.6-.1-3.8-.1-6.3c0-2.5-.1-5.5-.1-8.5c0-3.1-.1-6.4-.1-9.6c-.1-3.1-.1-6.4-.1-9.3c-.1-2.8-.2-5.4-.2-7.8c-.1-2.3-.1-4.3-.2-6.3c0-2 0-3.9 0-5.6c-.1-1.8-.1-3.5-.1-5.1c0-1.6 0-3 0-4.5c0-1.4-.1-2.8-.1-4c-.1-1.3-.1-2.4-.1-3.4c0-1 0-1.9 0-2.7c0-.8 0-1.6 0-2.3c0-.8 0-1.5 0-2.2c-.1-.8-.1-1.6-.1-2.5c0-.8 0-1.7.2-2.5c.2-.8.6-1.6 1-2.3c.4-.7 1-1.3 1.6-1.9c.6-.5 1.3-.9 2-1.2c.8-.3 1.6-.5 2.3-.5c.8-.1 1.6 0 2.4.3c.7.2 1.5.6 2.1 1c.7.5 1.3 1.1 1.8 1.8c.5.6.9 1.4 1.2 2.2c.2.8.3 1.7.4 2.5c.1.8.1 1.6.2 2.4c0 .7.1 1.4.2 2.2c0 .7.1 1.5.2 2.3c.1.8.1 1.7.2 2.7c.1 1.1.1 2.2.2 3.5c0 1.2.1 2.6.2 4c.1 1.5.2 2.9.3 4.5c.1 1.6.2 3.3.3 5.1c.1 1.8.2 3.7.3 5.7c.1 2 .2 4 .3 6.3c0 2.4.1 5 .2 7.9c.1 2.8.3 6.1.4 9.3c.1 3.1.2 6.5.4 9.5c.1 3 .2 6.1.3 8.5c.1 2.5.1 4.7.2 6.4c0 1.6.1 2.6.1 3.5c0 .8 0 1.2 0 1.6c0 .3 0 .3 0 .4c0 .1 0 .1 0 .2c0 .2.2.2.1.8c-.2.5-.4 1.9-1.2 2.6c-.7.8-1.9 1.6-3.1 2.1c-1.3.4-3 .7-4.4.8c-1.5 0-3.2-.2-4.5-.6c-1.3-.4-2.5-1.1-3.3-1.9c-.7-.7-1-2-1.2-2.6z" fill="#9a5f3b"/><path d="M44.5 98.8c0-.3 0-.8 0-1.6c0-.9-.1-1.9-.1-3.5c-.1-1.7-.1-3.9-.2-6.4c-.1-2.4-.2-5.5-.3-8.5c-.2-3-.3-6.4-.4-9.5c-.1-3.2-.3-6.5-.4-9.3c-.1-2.9-.2-5.5-.2-7.9c-.1-2.3-.2-4.3-.3-6.3c-.1-2-.2-3.9-.3-5.7c-.1-1.8-.2-3.5-.3-5.1c-.1-1.6-.2-3-.3-4.5c-.1-1.4-.2-2.8-.2-4c-.1-1.3-.1-2.4-.2-3.5c-.1-1-.1-1.9-.2-2.7c-.1-.8-.2-1.6-.2-2.3c-.1-.8-.2-1.5-.2-2.2c-.1-.8-.1-2-.2-2.4c0-.4.1-.4 0 0c0 .4 0 1.6-.4 2.4c-.3.8-1 1.5-1.5 2.3c-.5.8-1.3 1.5-1.6 2.4c-.3.8-.4 1.7-.4 2.7c-.1 1 .1 2.2.1 3.4c.1 1.3.1 2.7.2 4.1c.1 1.4.2 2.9.2 4.5c.1 1.6.2 3.3.3 5.1c.1 1.7.1 3.6.2 5.6c.1 2 .2 4 .2 6.4c.1 2.3.2 5 .3 7.8c.1 2.9.2 6.2.3 9.3c.1 3.2.2 6.5.3 9.5c0 3.1 0 6.1.2 8.6c.2 2.4.1 4.6.7 6.3c.7 1.6 2.2 2.6 3 3.4c.8.9 1.6 1.3 1.9 1.6c.3.2 0 .2 0 0z" fill="#86522f"/><path d="M33.8 5.6c.2.1.9.2 1.3.3c.4.2.9.3 1.3.6c.4.2.7.4 1.1.7c.4.3.7.6 1 1c.3.3.6.7.8 1.1c.3.4.5.8.6 1.3c.2.4.4.9.5 1.3c0 .5.1 1.2.1 1.5c.1.2.2.2 0 0c-.2-.2-.8-.9-1.1-1.2c-.4-.4-.6-.7-.9-1c-.2-.3-.5-.5-.7-.8c-.3-.3-.5-.5-.7-.8c-.3-.3-.5-.5-.7-.8c-.2-.3-.5-.6-.7-.9c-.3-.3-.5-.6-.9-.9c-.3-.4-.8-1.2-1-1.4c-.1-.2-.2 0 0 0z" fill="#86522f"/><path d="M44.5 97.2c0-.6-.1-1.9-.1-3.5c-.1-1.7-.1-3.9-.2-6.4c-.1-2.4-.2-5.5-.3-8.5c-.2-3-.3-6.4-.4-9.5c-.1-3.2-.3-6.5-.4-9.3c-.1-2.9-.2-5.5-.2-7.9c-.1-2.3-.2-4.3-.3-6.3c-.1-2-.2-3.9-.3-5.7c-.1-1.8-.2-3.5-.3-5.1c-.1-1.6-.2-3-.3-4.5c-.1-1.4-.2-2.8-.2-4c-.1-1.3-.1-2.4-.2-3.5c-.1-1-.1-1.9-.2-2.7c-.1-.8-.2-1.6-.2-2.3c-.1-.8-.2-1.9-.2-2.2c-.1-.4 0-.4 0 0c-.1.3-.1 1.4-.2 2.2c-.1.8-.4 1.5-.6 2.3c-.1.9-.2 1.8-.2 2.8c0 1 .1 2.2.2 3.4c.1 1.3.1 2.7.2 4.1c.1 1.4.2 2.9.3 4.5c.1 1.6.2 3.3.3 5.1c.1 1.7.2 3.6.2 5.6c.1 2 .2 4 .3 6.4c.1 2.3.1 5 .2 7.8c.1 2.9.3 6.2.4 9.3c.1 3.2.1 6.5.3 9.6c.2 3 .4 6 .7 8.5c.3 2.4.9 4.6 1.2 6.3c.3 1.6.4 2.9.5 3.5c.1.6 0 .6 0 0z" fill="#70432a" fill-opacity="0.5"/><path d="M31.9 87.7c0-1.5-.1-5.6-.2-8.6c-.1-3-.1-6.4-.2-9.5c0-3.1-.1-6.4-.2-9.3c-.1-2.8-.1-5.5-.2-7.8c0-2.4-.1-4.4-.2-6.4c0-2-.1-3.8-.1-5.6c0-1.8-.1-3.5-.1-5c-.1-1.6-.1-3.1-.1-4.6c-.1-1.4-.1-2.8-.2-4c0-1.3-.1-2.4-.1-3.4c0-1-.1-1.9-.1-2.7c0-.9 0-1.6 0-2.3c-.1-.8-.1-1.9-.1-2.2" fill="none" stroke="#b07651" stroke-width="2.1" stroke-linecap="round" stroke-opacity="0.5"/><path d="M26.8 97.7c0-.6 0-1.9-.1-3.6c0-1.6-.1-3.8-.1-6.3c0-2.5-.1-5.5-.1-8.5c0-3.1-.1-6.4-.1-9.6c-.1-3.1-.1-6.4-.1-9.3c-.1-2.8-.2-5.4-.2-7.8c-.1-2.3-.1-4.3-.2-6.3c0-2 0-3.9 0-5.6c-.1-1.8-.1-3.5-.1-5.1c0-1.6 0-3 0-4.5c0-1.4-.1-2.8-.1-4c-.1-1.3-.1-2.4-.1-3.4c0-1 0-1.9 0-2.7c0-.8 0-1.6 0-2.3c0-.8 0-1.5 0-2.2c-.1-.8-.1-1.6-.1-2.5c0-.8 0-1.7.2-2.5c.2-.8.6-1.6 1-2.3c.4-.7 1-1.3 1.6-1.9c.6-.5 1.3-.9 2-1.2c.8-.3 1.6-.5 2.3-.5c.8-.1 1.6 0 2.4.3c.7.2 1.5.6 2.1 1c.7.5 1.3 1.1 1.8 1.8c.5.6.9 1.4 1.2 2.2c.2.8.3 1.7.4 2.5c.1.8.1 1.6.2 2.4c0 .7.1 1.4.2 2.2c0 .7.1 1.5.2 2.3c.1.8.1 1.7.2 2.7c.1 1.1.1 2.2.2 3.5c0 1.2.1 2.6.2 4c.1 1.5.2 2.9.3 4.5c.1 1.6.2 3.3.3 5.1c.1 1.8.2 3.7.3 5.7c.1 2 .2 4 .3 6.3c0 2.4.1 5 .2 7.9c.1 2.8.3 6.1.4 9.3c.1 3.1.2 6.5.4 9.5c.1 3 .2 7.1.3 8.5" fill="none" stroke="#55301a" stroke-width="1"/><path d="M37.9 54.1c-.2.2-.7.6-1.1.8c-.4.2-.8.4-1.1.5c-.4.1-.8.2-1.1.2c-.4 0-.8-.1-1.2-.1c-.3-.1-.7-.3-1.1-.5c-.4-.1-.9-.6-1.1-.7" fill="none" stroke="#6a3c22" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.55"/><path d="M38.5 51.1c-.3.2-.9.7-1.4.9c-.4.3-.8.4-1.3.6c-.4.1-.9.2-1.3.2c-.5 0-.9-.1-1.4-.2c-.4-.1-.9-.2-1.3-.4c-.5-.2-1.2-.7-1.4-.8" fill="none" stroke="#6a3c22" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.55"/><path d="M37.2 48.2c-.2.1-.6.4-.9.6c-.3.1-.7.3-1 .3c-.3.1-.6.2-.9.2c-.3 0-.7 0-1-.1c-.3-.1-.6-.2-.9-.3c-.4-.1-.8-.4-1-.5" fill="none" stroke="#6a3c22" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.4"/><path d="M36.1 26.7c-.1 0-.5.3-.8.4c-.3.2-.6.3-.9.3c-.2.1-.5.1-.8.2c-.3 0-.6-.1-.8-.1c-.3 0-.6-.1-.9-.2c-.3-.1-.7-.4-.9-.4" fill="none" stroke="#6a3c22" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.45"/><path d="M32.8 9c-.6.1-1.2.2-1.7.4c-.5.3-.9.6-1.3 1c-.3.5-.6 1-.9 1.6c-.2.6-.4 1.2-.5 2c-.1.8-.1 1.8-.1 2.7c0 .9.2 2.2.3 2.9c.1.8.3 1.1.5 1.5c.2.3.5.6.8.9c.3.2.6.4 1.2.5c.6.1 1.5.1 2.3.1c.8 0 1.7-.2 2.3-.3c.6-.2.8-.4 1.1-.6c.3-.3.6-.6.7-1c.2-.4.4-.8.4-1.5c.1-.7.1-2 0-2.9c0-1-.1-1.9-.3-2.7c-.1-.8-.4-1.4-.7-2c-.3-.6-.6-1.1-1-1.4c-.4-.4-.8-.7-1.4-.9c-.5-.2-1.1-.3-1.7-.3z" fill="#c3967d" stroke="#97664b" stroke-width=".7"/><path d="M30.9 19.6c-.1-.2-.1-1.1-.1-1.7c0-.6-.1-1.2-.1-1.8c0-.6-.1-1.2-.1-1.8c0-.6 0-1.5-.1-1.8" fill="none" stroke="#dfbfac" stroke-width=".9" stroke-linecap="round" stroke-opacity="0.75"/><path d="M39.2 94.4c.1.6-.2 1.4-.6 2c-.4.6-1.2 1.2-2 1.5c-.9.4-2 .5-2.8.5c-.9 0-1.9-.3-2.5-.7c-.6-.4-1.1-1.1-1.2-1.7c-.1-.6.1-1.4.5-2c.5-.6 1.3-1.2 2.1-1.6c.8-.3 1.9-.5 2.8-.4c.9 0 1.9.3 2.5.7c.6.4 1 1.1 1.2 1.7z" fill="#b07651" fill-opacity="0.4"/><path d="M31.3 99.1c.7.2 2.8 1.5 4.3 1.5c1.4 0 3.5-1.3 4.2-1.5" fill="none" stroke="#6a3c22" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.38"/><path d="M58 89.7c.1.6-.1 1.5-.5 2.1c-.5.6-1.3 1.2-2.1 1.5c-.8.4-2 .6-2.9.5c-.9 0-1.9-.3-2.5-.7c-.6-.4-1.1-1.1-1.2-1.8c-.1-.6.1-1.4.5-2c.5-.6 1.3-1.2 2.2-1.6c.8-.3 1.9-.5 2.8-.5c.9.1 1.9.4 2.5.8c.6.4 1.1 1.1 1.2 1.7z" fill="#b07651" fill-opacity="0.4"/><path d="M50 94.4c.7.3 2.9 1.5 4.3 1.5c1.5 0 3.7-1.2 4.4-1.5" fill="none" stroke="#6a3c22" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.38"/><path d="M75.7 94.2c.1.6-.2 1.4-.6 2c-.4.5-1.2 1.1-2 1.4c-.8.4-1.8.6-2.7.5c-.8 0-1.8-.3-2.4-.7c-.5-.4-1-1-1.1-1.6c-.1-.6.1-1.4.5-2c.4-.5 1.2-1.1 2-1.5c.8-.3 1.9-.5 2.7-.4c.9 0 1.8.3 2.4.7c.6.4 1 1 1.2 1.6z" fill="#b07651" fill-opacity="0.4"/><path d="M68.1 98.9c.7.2 2.7 1.5 4.1 1.5c1.4 0 3.4-1.3 4.1-1.5" fill="none" stroke="#6a3c22" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.38"/><path d="M91.7 104.7c.1.6-.1 1.2-.5 1.7c-.3.5-1 1.1-1.7 1.3c-.7.3-1.7.5-2.4.5c-.8-.1-1.6-.3-2.1-.7c-.5-.3-.9-.9-1-1.4c-.1-.5.1-1.2.4-1.7c.4-.5 1.1-1 1.8-1.3c.7-.3 1.6-.5 2.4-.4c.7 0 1.5.2 2.1.6c.5.3.9.9 1 1.4z" fill="#b07651" fill-opacity="0.4"/><path d="M85.1 109.3c.6.3 2.4 1.5 3.7 1.5c1.2 0 3-1.2 3.6-1.5" fill="none" stroke="#6a3c22" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.38"/></g></svg>'},
    pinch:{w:155,h:625,grip:[29.9,23.9],wrist:[86.2,136.7],
      svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 155 625" width="155" height="625"><g class="wh-shadow" fill="#3a2410" stroke="#3a2410" stroke-linejoin="round"><path d="M65.3 126.7l.5 19.5l.9 23.5l59.9 0l-2.4-23.5l-2.4-19.5zM59.9 172.8c-12.8 10.6-3.3 31-5 63.3c-1.8 32.2-3.9 83.7-5.6 130.2c-1.7 46.5-3.6 98.5-4.7 148.8c-1 50.2-19.2 127.1-1.8 152.5c17.3 25.4 88.6 25.4 106 0c17.4-25.4-.8-102.3-1.9-152.5c-1-50.3-2.9-102.3-4.6-148.8c-1.7-46.5-3.8-98-5.6-130.2c-1.8-32.3 7.8-52.7-5-63.3c-12.8-10.5-59-10.5-71.8 0zM58.5 159.9c3.1-2.8 12.2-4 18.4-5.1c6.1-1 12.4-1.2 18.6-1.2c6.2 0 12.5.2 18.8 1.2c6.3 1.1 15.6 2.3 19 5.1c3.4 2.8 1.1 7.6 1.4 11.7c.3 4.1 3.5 11.3.4 12.7c-3.1 1.4-12.8-3.5-19-4.5c-6.3-.9-12.6-1.2-18.8-1.2c-6.3 0-12.5.3-18.6 1.2c-6.2 1-15.1 5.9-18.4 4.5c-3.3-1.4-1.2-8.6-1.5-12.7c-.3-4.1-3.3-8.9-.3-11.7zM67.1 154c-5.3-4.5-1.7-14.9-3-23.4c-1.3-8.5-2.9-18.6-4.8-27.3c-1.9-8.8-5.4-17.6-6.6-25.4c-1.3-7.8-1.9-16.5-.9-21.5c1.1-5.1 2.5-6.5 7.1-8.8c4.6-2.3 13.9-5.2 20.3-5.3c6.4 0 12.2 2.3 18.2 5.1c5.9 2.8 12.9 8.1 17.4 11.9c4.5 3.8 7.9 5.7 9.8 10.8c1.9 5 1.4 11.7 1.7 19.5c.3 7.8.2 18.9-.1 27.3c-.4 8.5-1.5 17.3-1.9 23.5c-.4 6.2 4.4 10.7-.3 13.6c-4.8 3-18.7 3.9-28.2 3.9c-9.5 0-23.5.7-28.7-3.9zM106.3 68.4c-1-1.6.2-1.4.5-3c.2-1.7.6-3.5 1.2-6.7c.6-3.2 1.5-9 2.4-12.4c1-3.3 1.6-6.2 3.3-7.6c1.8-1.4 5-1.4 7.2-.7c2.2.7 5 2.6 5.9 4.8c1 2.3.3 5.1-.2 8.6c-.6 3.5-2.2 9.1-3 12.2c-.8 3.1-1.2 5-1.6 6.5c-.5 1.6.6 2.1-.9 3c-1.6.8-5.9 2.9-8.4 2.2c-2.5-.8-5.4-5.2-6.4-6.9zM88.5 58.3c-1.3-1.6-.1-.8 0-2.6c.2-1.9.4-4.1.8-8.4c.4-4.3.9-12.8 1.6-17.4c.8-4.6 1.1-8.1 2.9-10.1c1.9-2 5.5-2.2 8-1.7c2.5.5 5.9 2.2 7.2 4.8c1.3 2.6.9 6.1.6 10.8c-.3 4.7-1.8 13-2.3 17.2c-.6 4.3-.9 6.5-1.2 8.3c-.3 1.8 1.1 1.5-.5 2.5c-1.7 1-6.3 4.1-9.2 3.6c-2.8-.6-6.6-5.4-7.9-7zM70.5 54.6c-1.6-1.5-.2-.4-.3-2.4c0-1.9 0-4.3-.1-9.2c0-5-.4-15-.1-20.3c.3-5.3.3-9.1 2-11.5c1.7-2.4 5.4-3 8.1-2.8c2.7.2 6.4 1.6 8 4.2c1.6 2.7 1.5 6.6 1.7 11.9c.2 5.4-.4 15.3-.6 20.2c-.1 4.9-.2 7.3-.3 9.2c-.1 2 1.2 1.1-.3 2.3c-1.6 1.2-6.1 5.1-9.1 4.8c-3.1-.2-7.5-5-9-6.4zM65.1 140.7c-4.7-3.4-15.7-12.8-22.8-19.4c-7.1-6.6-14.7-13.2-19.9-20.2c-5.3-7-9.9-13.5-11.8-21.8c-1.8-8.2-.8-19 .6-27.6c1.4-8.7 5.3-18.7 7.7-24c2.4-5.3 3.9-6.7 6.6-7.7c2.8-1 7.3-.2 9.7 1.7c2.4 1.9 4.7 4.7 4.7 9.7c0 4.9-3.4 13.7-4.6 20.2c-1.3 6.4-3.1 13.5-2.7 18.2c.4 4.7 2.1 6.1 5.1 9.9c3.1 3.8 7.1 8.5 13.3 13.1c6.2 4.6 18.1 8.9 23.9 14.3c5.8 5.4 11.7 12.2 10.9 18c-.7 5.8-11.8 14.3-15.3 16.9c-3.5 2.6-.7 2.2-5.4-1.3zM53.6 61.2c-.9-1 0 .1-.3-2c-.3-2.2-.9-5.4-1.6-11c-.7-5.5-1.9-17.8-2.7-22.1c-.8-4.4-.6-3.2-2.3-4c-1.7-.8-6.7-.7-7.9-.9c-1.2-.3 1.3-1.2.7-.5c-.7.7-2.7 3.8-4.7 4.6c-1.9.8-5.2 1-7.1 0c-1.9-1-3.9-3.8-4.2-6c-.3-2.2 1.3-5.2 2.2-7.1c.9-1.9.9-3.1 3.4-4.3c2.4-1.3 6.6-3.3 11.2-3.2c4.6.1 12-.6 16.5 3.8c4.5 4.4 8.2 15.2 10.4 22.6c2.2 7.4 2.1 17.2 2.7 21.7c.6 4.4.9 3.5.9 5.1c.1 1.6 1.6 3-.4 4.3c-2 1.3-8.8 3.5-11.6 3.3c-2.8-.1-4.3-3.2-5.2-4.3z" opacity=".07" stroke-width="9"/><path d="M65.3 126.7l.5 19.5l.9 23.5l59.9 0l-2.4-23.5l-2.4-19.5zM59.9 172.8c-12.8 10.6-3.3 31-5 63.3c-1.8 32.2-3.9 83.7-5.6 130.2c-1.7 46.5-3.6 98.5-4.7 148.8c-1 50.2-19.2 127.1-1.8 152.5c17.3 25.4 88.6 25.4 106 0c17.4-25.4-.8-102.3-1.9-152.5c-1-50.3-2.9-102.3-4.6-148.8c-1.7-46.5-3.8-98-5.6-130.2c-1.8-32.3 7.8-52.7-5-63.3c-12.8-10.5-59-10.5-71.8 0zM58.5 159.9c3.1-2.8 12.2-4 18.4-5.1c6.1-1 12.4-1.2 18.6-1.2c6.2 0 12.5.2 18.8 1.2c6.3 1.1 15.6 2.3 19 5.1c3.4 2.8 1.1 7.6 1.4 11.7c.3 4.1 3.5 11.3.4 12.7c-3.1 1.4-12.8-3.5-19-4.5c-6.3-.9-12.6-1.2-18.8-1.2c-6.3 0-12.5.3-18.6 1.2c-6.2 1-15.1 5.9-18.4 4.5c-3.3-1.4-1.2-8.6-1.5-12.7c-.3-4.1-3.3-8.9-.3-11.7zM67.1 154c-5.3-4.5-1.7-14.9-3-23.4c-1.3-8.5-2.9-18.6-4.8-27.3c-1.9-8.8-5.4-17.6-6.6-25.4c-1.3-7.8-1.9-16.5-.9-21.5c1.1-5.1 2.5-6.5 7.1-8.8c4.6-2.3 13.9-5.2 20.3-5.3c6.4 0 12.2 2.3 18.2 5.1c5.9 2.8 12.9 8.1 17.4 11.9c4.5 3.8 7.9 5.7 9.8 10.8c1.9 5 1.4 11.7 1.7 19.5c.3 7.8.2 18.9-.1 27.3c-.4 8.5-1.5 17.3-1.9 23.5c-.4 6.2 4.4 10.7-.3 13.6c-4.8 3-18.7 3.9-28.2 3.9c-9.5 0-23.5.7-28.7-3.9zM106.3 68.4c-1-1.6.2-1.4.5-3c.2-1.7.6-3.5 1.2-6.7c.6-3.2 1.5-9 2.4-12.4c1-3.3 1.6-6.2 3.3-7.6c1.8-1.4 5-1.4 7.2-.7c2.2.7 5 2.6 5.9 4.8c1 2.3.3 5.1-.2 8.6c-.6 3.5-2.2 9.1-3 12.2c-.8 3.1-1.2 5-1.6 6.5c-.5 1.6.6 2.1-.9 3c-1.6.8-5.9 2.9-8.4 2.2c-2.5-.8-5.4-5.2-6.4-6.9zM88.5 58.3c-1.3-1.6-.1-.8 0-2.6c.2-1.9.4-4.1.8-8.4c.4-4.3.9-12.8 1.6-17.4c.8-4.6 1.1-8.1 2.9-10.1c1.9-2 5.5-2.2 8-1.7c2.5.5 5.9 2.2 7.2 4.8c1.3 2.6.9 6.1.6 10.8c-.3 4.7-1.8 13-2.3 17.2c-.6 4.3-.9 6.5-1.2 8.3c-.3 1.8 1.1 1.5-.5 2.5c-1.7 1-6.3 4.1-9.2 3.6c-2.8-.6-6.6-5.4-7.9-7zM70.5 54.6c-1.6-1.5-.2-.4-.3-2.4c0-1.9 0-4.3-.1-9.2c0-5-.4-15-.1-20.3c.3-5.3.3-9.1 2-11.5c1.7-2.4 5.4-3 8.1-2.8c2.7.2 6.4 1.6 8 4.2c1.6 2.7 1.5 6.6 1.7 11.9c.2 5.4-.4 15.3-.6 20.2c-.1 4.9-.2 7.3-.3 9.2c-.1 2 1.2 1.1-.3 2.3c-1.6 1.2-6.1 5.1-9.1 4.8c-3.1-.2-7.5-5-9-6.4zM65.1 140.7c-4.7-3.4-15.7-12.8-22.8-19.4c-7.1-6.6-14.7-13.2-19.9-20.2c-5.3-7-9.9-13.5-11.8-21.8c-1.8-8.2-.8-19 .6-27.6c1.4-8.7 5.3-18.7 7.7-24c2.4-5.3 3.9-6.7 6.6-7.7c2.8-1 7.3-.2 9.7 1.7c2.4 1.9 4.7 4.7 4.7 9.7c0 4.9-3.4 13.7-4.6 20.2c-1.3 6.4-3.1 13.5-2.7 18.2c.4 4.7 2.1 6.1 5.1 9.9c3.1 3.8 7.1 8.5 13.3 13.1c6.2 4.6 18.1 8.9 23.9 14.3c5.8 5.4 11.7 12.2 10.9 18c-.7 5.8-11.8 14.3-15.3 16.9c-3.5 2.6-.7 2.2-5.4-1.3zM53.6 61.2c-.9-1 0 .1-.3-2c-.3-2.2-.9-5.4-1.6-11c-.7-5.5-1.9-17.8-2.7-22.1c-.8-4.4-.6-3.2-2.3-4c-1.7-.8-6.7-.7-7.9-.9c-1.2-.3 1.3-1.2.7-.5c-.7.7-2.7 3.8-4.7 4.6c-1.9.8-5.2 1-7.1 0c-1.9-1-3.9-3.8-4.2-6c-.3-2.2 1.3-5.2 2.2-7.1c.9-1.9.9-3.1 3.4-4.3c2.4-1.3 6.6-3.3 11.2-3.2c4.6.1 12-.6 16.5 3.8c4.5 4.4 8.2 15.2 10.4 22.6c2.2 7.4 2.1 17.2 2.7 21.7c.6 4.4.9 3.5.9 5.1c.1 1.6 1.6 3-.4 4.3c-2 1.3-8.8 3.5-11.6 3.3c-2.8-.1-4.3-3.2-5.2-4.3z" opacity=".11" stroke-width="3"/></g><g class="wh-hand" stroke-linejoin="round"><path d="M57.9 121.8l-.9 18.6l-.7 22.3l59.9 0l-.8-22.3l-.9-18.6zM57.8 147.8c-5-4.3-.7-14.2-1.3-22.3c-.7-8-1.6-17.6-2.8-26c-1.3-8.4-4.2-16.8-4.9-24.2c-.7-7.4-.7-15.7.7-20.5c1.4-4.8 3-6.1 7.7-8.3c4.7-2.3 14.2-5 20.7-5c6.4-.1 12.1 2.1 17.8 4.8c5.7 2.7 12.3 7.7 16.6 11.3c4.2 3.6 7.4 5.5 9 10.3c1.6 4.8.6 11.1.3 18.6c-.3 7.4-1.1 17.9-2.1 26c-.9 8.1-2.7 16.4-3.5 22.3c-.8 5.9 3.6 10.3-1.3 13c-5 2.8-19 3.8-28.5 3.8c-9.5 0-23.5.6-28.4-3.8zM103.2 66.3c0-.6.2-.7.2-1.1c.1-.3.1-.5.2-.8c.1-.3.1-.6.2-1c.1-.4.2-.8.3-1.4c.2-.6.4-1.2.6-2c.2-.9.5-1.9.9-3c.3-1 .6-2.3 1-3.6c.3-1.3.7-2.6 1.1-4c.4-1.4.8-2.8 1.1-4.1c.4-1.4.8-3 1.2-3.9c.3-1 .5-1.4 1-1.9c.4-.6 1-1.1 1.7-1.5c.6-.4 1.4-.7 2.2-.9c.7-.2 1.6-.3 2.5-.2c.8 0 1.7.1 2.5.4c.8.2 1.6.6 2.4 1.1c.7.4 1.3 1 1.9 1.6c.5.6 1 1.2 1.3 1.9c.3.7.5 1.5.6 2.2c0 .7 0 1.1-.3 2.1c-.2 1-.8 2.6-1.2 3.9c-.4 1.3-.9 2.7-1.3 4.1c-.5 1.3-.9 2.7-1.4 3.9c-.4 1.3-.8 2.5-1.1 3.6c-.4 1.1-.7 2.1-1 2.9c-.2.8-.4 1.5-.6 2c-.2.6-.4 1-.5 1.3c-.2.4-.3.7-.4.9c-.2.3-.3.6-.4.9c-.1.3 0 .5-.3 1c-.4.5-.9 1.4-1.7 1.9c-.8.4-1.9.7-3.1.8c-1.1 0-2.6-.2-3.8-.6c-1.2-.3-2.5-1-3.4-1.6c-.9-.7-1.7-1.6-2.1-2.4c-.5-.8-.3-1.9-.3-2.5zM86.1 56.6c-.1-.6.1-.7.1-.9c0-.3 0-.5 0-.7c0-.3 0-.5.1-.9c0-.3 0-.7.1-1.4c.1-.7.3-1.5.5-2.5c.2-1.1.4-2.5.7-4c.3-1.5.6-3.3.9-5c.3-1.8.6-3.8 1-5.7c.3-1.9.6-4 1-5.9c.3-1.9.7-4.2 1-5.5c.3-1.3.5-1.5.9-2.2c.5-.7 1.1-1.4 1.7-1.9c.7-.5 1.6-1 2.4-1.3c.9-.3 1.8-.5 2.8-.5c.9-.1 2 0 2.9.1c1 .2 1.9.6 2.8 1c.9.4 1.7.9 2.4 1.5c.7.7 1.3 1.4 1.7 2.1c.4.8.7 1.6.9 2.4c.1.8.2 1.1 0 2.4c-.2 1.3-.7 3.6-1.1 5.5c-.4 1.9-.8 3.9-1.3 5.8c-.4 1.9-.8 3.9-1.2 5.6c-.4 1.8-.7 3.6-1.1 5.1c-.3 1.4-.5 2.8-.8 3.9c-.2 1.1-.4 1.8-.5 2.5c-.2.7-.3 1-.4 1.4c-.1.4-.2.6-.3.8c-.1.2-.1.4-.2.6c-.1.3.1.4-.2 1c-.3.5-.8 1.7-1.7 2.3c-.8.6-2.1 1.1-3.4 1.2c-1.3.2-2.9.2-4.3-.1c-1.4-.3-3-.8-4.1-1.5c-1.1-.7-2.1-1.6-2.7-2.4c-.6-.9-.6-2.2-.6-2.8zM68.3 53.1c-.2-.6 0-.7 0-.9c0-.3 0-.4 0-.6c-.1-.2-.1-.3-.1-.7c0-.4 0-.8 0-1.5c.1-.7.1-1.6.2-2.8c.1-1.2.2-2.8.4-4.5c.1-1.8.2-3.8.4-5.9c.1-2.1.3-4.4.4-6.6c.2-2.2.3-4.6.5-6.8c.2-2.2.3-4.9.5-6.4c.2-1.5.3-1.7.7-2.5c.4-.7 1-1.5 1.6-2.1c.7-.6 1.5-1.2 2.4-1.6c.8-.4 1.8-.8 2.8-.9c1-.2 2.1-.2 3.1-.2c1 .1 2.1.4 3 .7c1 .3 1.9.8 2.7 1.4c.8.6 1.5 1.3 2 2c.5.7 1 1.5 1.2 2.4c.3.8.3 1 .3 2.5c-.1 1.5-.4 4.2-.6 6.4c-.3 2.2-.5 4.6-.7 6.8c-.3 2.2-.5 4.5-.7 6.6c-.3 2.1-.5 4.1-.7 5.8c-.1 1.7-.3 3.3-.4 4.5c-.1 1.2-.2 2.1-.3 2.8c-.1.8-.2 1.1-.2 1.5c-.1.4-.2.5-.2.7c-.1.2-.2.3-.2.6c0 .2.1.3-.1.9c-.3.6-.7 1.9-1.5 2.6c-.8.7-2.1 1.3-3.4 1.7c-1.4.3-3.1.4-4.6.3c-1.5-.2-3.2-.6-4.4-1.1c-1.3-.6-2.5-1.5-3.1-2.3c-.7-.8-.8-2.2-1-2.8zM56.7 135.1c-2-1.1-4.7-3.7-7-5.7c-2.4-1.9-4.8-4-7.2-6.1c-2.4-2.2-4.8-4.4-7.2-6.6c-2.4-2.2-4.8-4.5-7-6.7c-2.2-2.2-4.4-4.4-6.3-6.5c-1.9-2.1-3.6-4-5.1-6.1c-1.6-2-3-4-4.3-6.1c-1.3-2.2-2.5-4.5-3.5-6.9c-1-2.4-1.9-5-2.5-7.7c-.5-2.7-1-5.6-1-8.6c0-3 .3-6.2.9-9.1c.6-3 1.7-5.9 2.7-8.7c1.1-2.8 2.3-5.4 3.4-8c1.1-2.6 2.3-5 3.3-7.5c1-2.5 2-5.5 2.7-7.3c.7-1.7 1-2.2 1.7-3.2c.7-.9 1.5-1.8 2.5-2.5c.9-.7 2-1.2 3-1.6c1.1-.4 2.3-.6 3.4-.6c1.1 0 2.2.2 3.2.6c1.1.4 2.1.9 3 1.6c.8.7 1.6 1.6 2.2 2.5c.6 1 1.1 2.1 1.4 3.2c.3 1.1.4 2.3.4 3.5c-.1 1.2-.2 1.7-.7 3.5c-.6 1.9-1.7 5.2-2.6 7.8c-.9 2.6-2 5.4-2.8 7.9c-.9 2.6-1.7 5.1-2.3 7.2c-.6 2.2-1.1 4.3-1.4 6c-.3 1.7-.3 3-.3 4.3c.1 1.2.3 2.2.7 3.2c.3 1.1.8 2 1.4 3c.7 1 1.4 2 2.3 3.2c1 1.1 2.1 2.4 3.3 3.7c1.3 1.4 2.5 2.9 4 4.3c1.5 1.5 3.1 3 5.1 4.4c2 1.5 4.3 2.8 6.7 4.3c2.5 1.4 5.2 2.9 7.9 4.4c2.7 1.6 5.6 3.2 8.3 4.9c2.6 1.7 5.9 3.7 7.7 5.4c1.7 1.6 2.3 2.8 2.6 4.7c.4 2 .1 4.7-.7 7.1c-.8 2.4-2.2 5.3-3.9 7.5c-1.7 2.2-4 4.4-6.1 5.9c-2.1 1.4-4.6 2.4-6.5 2.7c-2 .2-3.3-.1-5.4-1.3zM51 59.5c-.3-.6-.1-.7-.1-.9c-.1-.2-.1-.3-.1-.5c0-.1 0-.3 0-.6c-.1-.4-.1-.7-.2-1.5c-.1-.8-.2-1.8-.3-3.3c-.1-1.5-.3-3.5-.3-5.6c-.1-2.2-.1-4.8-.2-7.3c0-2.5-.1-5.2-.3-7.5c-.1-2.3-.4-4.8-.7-6.3c-.2-1.6-.6-2.5-.7-3.1c-.2-.5 0 0-.2-.2c-.2-.1-.5-.3-1.1-.5c-.6-.2-1.5-.4-2.4-.6c-.9-.1-2.2-.2-3.1-.2c-.9-.1-1.9-.1-2.3-.1c-.4 0-.1 0 0-.1c.2-.1.8-.5.9-.5c.1-.1 0-.1-.2.2c-.3.2-.8.9-1.3 1.4c-.5.5-1 1-1.6 1.5c-.6.5-1.3 1.1-2.1 1.4c-.7.4-1.6.7-2.4.8c-.8.1-1.6.1-2.4 0c-.8-.1-1.6-.4-2.3-.7c-.7-.4-1.3-.9-1.9-1.5c-.5-.5-1-1.2-1.3-2c-.3-.7-.5-1.5-.6-2.3c0-.8 0-1.6.2-2.4c.2-.8.5-1.6 1-2.4c.4-.7 1.1-1.5 1.5-1.9c.4-.5.6-.5.9-.8c.2-.3.3-.6.8-1.2c.4-.5 1-1.4 2-2.2c1-.7 2.5-1.7 3.8-2.2c1.3-.5 2.8-.6 4.1-.7c1.3-.2 2.2-.1 3.6-.1c1.3 0 2.8-.1 4.4 0c1.7.2 3.6.2 5.6.8c2 .6 4.3 1.4 6.2 2.8c1.9 1.5 3.9 3.7 5.2 5.9c1.3 2.2 1.9 4.9 2.5 7.5c.5 2.6.8 5.4 1.1 8.2c.2 2.7.4 5.7.5 8.2c.2 2.6.2 5.3.4 7.3c.1 2.1.2 3.8.3 5.1c.1 1.3.2 2 .3 2.7c0 .7.1 1.2.1 1.5c.1.4.1.5.1.7c0 .2 0 .2 0 .4c.1.3.3.3.1.9c-.1.6-.2 1.9-.9 2.8c-.6.8-1.8 1.7-3 2.2c-1.2.6-2.8 1-4.3 1.2c-1.5.2-3.2.1-4.5-.2c-1.3-.4-2.6-1-3.4-1.6c-.8-.7-1.2-2-1.4-2.5z" fill="none" stroke="#55301a" stroke-width="3.2"/><path d="M50.3 166.4c-12.8 10.6-3.2 31-5 63.3c-1.8 32.2-3.9 83.7-5.6 130.2c-1.7 46.5-3.5 98.6-4.6 148.8c-1.1 50.2-19.2 127.1-1.9 152.5c17.4 25.4 88.7 25.4 106 0c17.4-25.4-.7-102.3-1.8-152.5c-1.1-50.2-3-102.3-4.7-148.8c-1.7-46.5-3.8-98-5.6-130.2c-1.7-32.3 7.8-52.7-5-63.3c-12.8-10.5-59-10.5-71.8 0zM48.8 153.4c3.2-2.6 12.5-3.8 18.7-4.8c6.3-1 12.5-1.1 18.7-1.1c6.3 0 12.5.1 18.7 1.1c6.2 1 15.5 2.2 18.7 4.8c3.2 2.7.6 7.3.6 11.2c0 3.9 2.6 10.8-.6 12.1c-3.2 1.3-12.5-3.4-18.7-4.3c-6.2-.9-12.4-1.1-18.7-1.1c-6.2 0-12.4.2-18.7 1.1c-6.2.9-15.5 5.6-18.7 4.3c-3.2-1.3-.5-8.2-.5-12.1c0-3.9-2.7-8.5.5-11.2z" fill="none" stroke="#435b75" stroke-width="3.2"/><path d="M57.9 121.8l-.9 18.6l-.7 22.3l59.9 0l-.8-22.3l-.9-18.6z" fill="#9a5f3b"/><path d="M114.5 121.8l.9 18.6l.8 22.3l-9.5 0l.2-22.3l.7-18.6z" fill="#86522f"/><path d="M50.3 166.4c-12.8 10.6-3.2 31-5 63.3c-1.8 32.2-3.9 83.7-5.6 130.2c-1.7 46.5-3.5 98.6-4.6 148.8c-1.1 50.2-19.2 127.1-1.9 152.5c17.4 25.4 88.7 25.4 106 0c17.4-25.4-.7-102.3-1.8-152.5c-1.1-50.2-3-102.3-4.7-148.8c-1.7-46.5-3.8-98-5.6-130.2c-1.7-32.3 7.8-52.7-5-63.3c-12.8-10.5-59-10.5-71.8 0z" fill="#62809e"/><path d="M122.1 166.4c2.8 10.6 3.3 31 5 63.3c1.8 32.2 3.9 83.7 5.6 130.2c1.7 46.5 3.6 98.6 4.7 148.8c1.1 50.2 5.2 127.1 1.8 152.5c-3.4 25.4-18.3 25.4-22.3 0c-4-25.4-1.1-102.3-1.8-152.5c-.8-50.2-2.1-102.3-2.8-148.8c-.8-46.5-1.6-98-1.9-130.2c-.3-32.3-2-52.7 0-63.3c2-10.5 8.9-10.5 11.7 0z" fill="#536f8b"/><path d="M122.1 166.4c1.7 10.6 3.3 31 5 63.3c1.8 32.2 3.9 83.7 5.6 130.2c1.7 46.5 3.6 98.6 4.7 148.8c1.1 50.2 2.9 127.1 1.8 152.5c-1 25.4-6.5 25.4-8.2 0c-1.6-25.4-.8-102.3-1.8-152.5c-1.1-50.2-2.9-102.3-4.5-148.8c-1.5-46.5-3.6-98-4.8-130.2c-1.3-32.3-3-52.7-2.6-63.3c.4-10.5 3.2-10.5 4.8 0z" fill="#435b75" fill-opacity="0.6"/><path d="M52.6 192.5c-.7 12.4-2.4 40.3-3.8 74.4c-1.4 34.1-3.2 83.7-4.6 130.2c-1.4 46.5-3.1 124-3.7 148.8" fill="none" stroke="#7d99b4" stroke-width="2.4" stroke-linecap="round" stroke-opacity="0.5"/><path d="M51.4 186.9c2.9 1.3 12.3 6.3 17.2 7.8c4.8 1.5 10 .9 12 1.1" fill="none" stroke="#435b75" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.5"/><path d="M91.8 203.6c2.9-.7 12.2-2.7 17.7-4.6c5.4-1.9 12.4-5.4 14.9-6.5" fill="none" stroke="#435b75" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.55"/><path d="M48.8 224.1c3.6 1.1 16 5.7 21.6 6.5c5.6.8 10.1-1.5 12.1-1.8" fill="none" stroke="#435b75" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.35"/><path d="M89.9 248.3c4.2-1.1 18.9-4 25.2-6.5c6.2-2.5 10.2-7 12.2-8.4" fill="none" stroke="#435b75" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.4"/><path d="M45.3 292.9c3.3 1 14.3 5 19.5 5.6c5.3.6 10.1-1.5 12.1-1.9" fill="none" stroke="#435b75" stroke-width="1.2" stroke-linecap="round" stroke-opacity="0.25"/><path d="M48.8 153.4c3.2-2.6 12.5-3.8 18.7-4.8c6.3-1 12.5-1.1 18.7-1.1c6.3 0 12.5.1 18.7 1.1c6.2 1 15.5 2.2 18.7 4.8c3.2 2.7.6 7.3.6 11.2c0 3.9 2.6 10.8-.6 12.1c-3.2 1.3-12.5-3.4-18.7-4.3c-6.2-.9-12.4-1.1-18.7-1.1c-6.2 0-12.4.2-18.7 1.1c-6.2.9-15.5 5.6-18.7 4.3c-3.2-1.3-.5-8.2-.5-12.1c0-3.9-2.7-8.5.5-11.2z" fill="#5d7a98"/><path d="M106.8 149c2.4-1.7 13.9 1.8 16.8 4.4c2.9 2.6.6 7.3.6 11.2c0 3.9 2.3 10.7-.6 12.1c-2.9 1.4-14.4-1.6-16.8-3.7c-2.4-2.2 2.6-5.3 2.6-9.3c0-4-5-13-2.6-14.7z" fill="#536f8b"/><path d="M51.1 154c2.7-.7 10.6-3.1 16.4-3.9c5.9-.9 12.8-1.1 18.7-1.1c5.9 0 14 .9 16.8 1.1" fill="none" stroke="#89a4be" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.75"/><path d="M50 157.7c2.9-.7 11.5-3.4 17.5-4.3c6.1-.9 12.5-1.1 18.7-1.1c6.3 0 12.7.2 18.7 1.1c6.1.9 14.7 3.6 17.6 4.3" fill="none" stroke="#435b75" stroke-width=".7" stroke-dasharray="1.6 1.6" stroke-opacity="0.45"/><path d="M50 172c2.9-.7 11.5-3.2 17.5-4.1c6.1-.8 12.5-1.1 18.7-1.1c6.3 0 12.7.3 18.7 1.1c6.1.9 14.7 3.4 17.6 4.1" fill="none" stroke="#435b75" stroke-width=".7" stroke-dasharray="1.6 1.6" stroke-opacity="0.35"/><path d="M48.8 153.4c3.2-2.6 12.5-3.8 18.7-4.8c6.3-1 12.5-1.1 18.7-1.1c6.3 0 12.5.1 18.7 1.1c6.2 1 15.5 2.2 18.7 4.8c3.2 2.7.6 7.3.6 11.2c0 3.9 2.6 10.8-.6 12.1c-3.2 1.3-12.5-3.4-18.7-4.3c-6.2-.9-12.4-1.1-18.7-1.1c-6.2 0-12.4.2-18.7 1.1c-6.2.9-15.5 5.6-18.7 4.3c-3.2-1.3-.5-8.2-.5-12.1c0-3.9-2.7-8.5.5-11.2z" fill="none" stroke="#435b75" stroke-width="1"/><path d="M119.7 162.7c0 .6-.2 1.3-.5 1.8c-.4.5-.9 1-1.4 1.1c-.5.2-1.2.2-1.8 0c-.5-.1-1-.6-1.3-1.1c-.4-.5-.6-1.2-.6-1.8c0-.6.2-1.3.6-1.8c.3-.5.8-.9 1.3-1.1c.6-.2 1.3-.2 1.8 0c.5.2 1 .6 1.4 1.1c.3.5.5 1.2.5 1.8z" fill="#ece8df" stroke="#435b75" stroke-width=".5"/><path d="M57.9 140.4c2.4-.8 9.2 2.7 13.9 3.4c4.7.6 9.6.3 14.4.3c4.8 0 9.7.3 14.4-.3c4.7-.7 11.6-4.2 13.9-3.4c2.3.8 4.9 6.9.2 8.2c-4.7 1.3-19-.4-28.5-.4c-9.5 0-23.7 1.7-28.4.4c-4.7-1.3-2.2-7.4.1-8.2z" fill="#70432a" fill-opacity="0.5"/><path d="M57.8 147.8c-5-4.3-.7-14.2-1.3-22.3c-.7-8-1.6-17.6-2.8-26c-1.3-8.4-4.2-16.8-4.9-24.2c-.7-7.4-.7-15.7.7-20.5c1.4-4.8 3-6.1 7.7-8.3c4.7-2.3 14.2-5 20.7-5c6.4-.1 12.1 2.1 17.8 4.8c5.7 2.7 12.3 7.7 16.6 11.3c4.2 3.6 7.4 5.5 9 10.3c1.6 4.8.6 11.1.3 18.6c-.3 7.4-1.1 17.9-2.1 26c-.9 8.1-2.7 16.4-3.5 22.3c-.8 5.9 3.6 10.3-1.3 13c-5 2.8-19 3.8-28.5 3.8c-9.5 0-23.5.6-28.4-3.8z" fill="#9a5f3b"/><path d="M121.3 67.9c2 3.8.6 11.1.3 18.6c-.3 7.4-1.1 17.9-2.1 26c-.9 8.1-2.7 16.1-3.5 22.3c-.8 6.2 1.5 12.4-1.3 14.9c-2.8 2.5-13.2 4.7-15.5 0c-2.3-4.6 1.1-18.9 1.7-27.9c.7-9 1.1-18.3 2.2-26c1.2-7.8 3.6-15.1 4.7-20.5c1.1-5.4-.6-10.8 1.7-12.1c2.2-1.2 9.8.8 11.8 4.7z" fill="#86522f" fill-opacity="0.75"/><path d="M121.3 69.7c1 2.8.4 9.6 0 16.8c-.4 7.1-1.4 17.9-2.3 26c-1 8.1-2.7 16.1-3.4 22.3c-.7 6.2.3 12.4-.9 14.9c-1.2 2.5-5.4 5.3-6.3 0c-1-5.3.2-22 .7-31.6c.5-9.6 1.2-18 2.2-26.1c1.1-8 2.3-18.6 3.9-22.3c1.7-3.7 5.1-2.8 6.1 0z" fill="#86522f"/><path d="M121 73.4c.4 2.2.4 6.6 0 13.1c-.4 6.5-1.7 17.9-2.6 26c-.9 8.1-2.4 16.1-3 22.3c-.6 6.2-.2 12.4-.7 14.9c-.6 2.5-2.3 5.9-2.6 0c-.3-5.9-.4-22.6.7-35.3c1.1-12.7 4.4-34.1 5.8-41c1.3-6.8 2-2.1 2.4 0z" fill="#70432a" fill-opacity="0.5"/><path d="M93.5 83.9c.4 3.2.6 6.6.4 9.8c-.1 3.1-.6 6.3-1.4 9.1c-.7 2.7-1.8 5.4-3.1 7.5c-1.2 2.1-2.8 3.9-4.5 5.1c-1.6 1.3-3.5 2.1-5.4 2.4c-1.9.2-4 0-5.9-.8c-2-.7-4-2-5.8-3.7c-1.8-1.7-3.6-3.9-5.1-6.3c-1.4-2.5-2.8-5.4-3.8-8.4c-1-3-1.8-6.3-2.3-9.5c-.4-3.3-.6-6.7-.4-9.9c.1-3.1.6-6.3 1.4-9c.7-2.8 1.8-5.4 3.1-7.5c1.2-2.2 2.8-4 4.5-5.2c1.6-1.3 3.6-2.1 5.5-2.3c1.9-.3 3.9-.1 5.9.7c1.9.7 3.9 2 5.7 3.7c1.8 1.7 3.6 3.9 5.1 6.4c1.5 2.4 2.8 5.3 3.8 8.3c1 3 1.8 6.3 2.3 9.6z" fill="#b07651" fill-opacity="0.13"/><path d="M85.2 82.9c.3 2.6.5 5.5.4 8c-.2 2.5-.6 5.1-1.1 7.2c-.6 2.1-1.5 4.1-2.5 5.6c-1 1.5-2.3 2.6-3.5 3.3c-1.3.6-2.8.8-4.2.6c-1.4-.3-2.9-1.1-4.3-2.2c-1.3-1.2-2.7-2.8-3.9-4.7c-1.1-1.9-2.2-4.2-3-6.6c-.9-2.4-1.5-5.2-1.9-7.8c-.3-2.6-.5-5.5-.4-8c.2-2.5.6-5.1 1.2-7.2c.5-2.1 1.4-4.1 2.4-5.6c1-1.5 2.3-2.6 3.5-3.3c1.3-.6 2.8-.8 4.2-.6c1.4.3 2.9 1.1 4.3 2.2c1.4 1.2 2.7 2.8 3.9 4.7c1.2 1.9 2.2 4.2 3 6.6c.9 2.4 1.5 5.2 1.9 7.8z" fill="#b07651" fill-opacity="0.13"/><path d="M59.6 63.2c1.5 4.2 6.3 16.6 9 25.1c2.6 8.5 5.6 21.7 6.8 26.1" fill="none" stroke="#b07651" stroke-width="1.1" stroke-linecap="round" stroke-opacity="0.16"/><path d="M78 58.6c.5 4.9 2 20.4 2.8 29.7c.8 9.3 1.7 21.7 2.1 26.1" fill="none" stroke="#b07651" stroke-width="1.1" stroke-linecap="round" stroke-opacity="0.16"/><path d="M95.5 63c-.5 4.2-2.2 16.8-3.1 25.3c-.9 8.6-2 21.7-2.4 26.1" fill="none" stroke="#b07651" stroke-width="1.1" stroke-linecap="round" stroke-opacity="0.16"/><path d="M103.2 66.3c0-.6.2-.7.2-1.1c.1-.3.1-.5.2-.8c.1-.3.1-.6.2-1c.1-.4.2-.8.3-1.4c.2-.6.4-1.2.6-2c.2-.9.5-1.9.9-3c.3-1 .6-2.3 1-3.6c.3-1.3.7-2.6 1.1-4c.4-1.4.8-2.8 1.1-4.1c.4-1.4.8-3 1.2-3.9c.3-1 .5-1.4 1-1.9c.4-.6 1-1.1 1.7-1.5c.6-.4 1.4-.7 2.2-.9c.7-.2 1.6-.3 2.5-.2c.8 0 1.7.1 2.5.4c.8.2 1.6.6 2.4 1.1c.7.4 1.3 1 1.9 1.6c.5.6 1 1.2 1.3 1.9c.3.7.5 1.5.6 2.2c0 .7 0 1.1-.3 2.1c-.2 1-.8 2.6-1.2 3.9c-.4 1.3-.9 2.7-1.3 4.1c-.5 1.3-.9 2.7-1.4 3.9c-.4 1.3-.8 2.5-1.1 3.6c-.4 1.1-.7 2.1-1 2.9c-.2.8-.4 1.5-.6 2c-.2.6-.4 1-.5 1.3c-.2.4-.3.7-.4.9c-.2.3-.3.6-.4.9c-.1.3 0 .5-.3 1c-.4.5-.9 1.4-1.7 1.9c-.8.4-1.9.7-3.1.8c-1.1 0-2.6-.2-3.8-.6c-1.2-.3-2.5-1-3.4-1.6c-.9-.7-1.7-1.6-2.1-2.4c-.5-.8-.3-1.9-.3-2.5z" fill="#9a5f3b"/><path d="M118.3 68.8c0-.1.2-.5.4-.9c.1-.3.3-.7.5-1.3c.2-.5.4-1.2.6-2c.3-.8.6-1.8 1-2.9c.3-1.1.7-2.3 1.1-3.6c.5-1.2.9-2.6 1.4-3.9c.4-1.4.9-2.8 1.3-4.1c.4-1.3 1-3.2 1.2-3.9c.2-.6.3-.6 0 0c-.3.6-.9 2.5-1.7 3.7c-.8 1.3-2 2.4-3 3.6c-1 1.2-2.2 2.3-3 3.5c-.7 1.1-1.2 2.3-1.6 3.4c-.4 1-.9 2-.9 2.9c0 .9.4 1.7.8 2.5c.5.7 1.5 1.5 1.8 2c.3.5.1.9.1 1c0 .2-.1.2 0 0z" fill="#86522f"/><path d="M121.7 35.7c.2.1.9.5 1.3.8c.4.3.7.6 1.1 1c.3.4.6.8.9 1.2c.2.4.5.9.6 1.4c.2.5.4 1 .5 1.5c.1.5.1 1 .2 1.5c0 .5-.1 1.1-.1 1.6c-.1.5-.3 1.3-.4 1.5c0 .3.2.3 0 0c-.1-.3-.5-1.1-.7-1.6c-.2-.5-.4-.9-.5-1.4c-.2-.4-.4-.7-.5-1.1c-.2-.4-.3-.7-.5-1.1c-.1-.3-.2-.7-.4-1c-.1-.4-.2-.8-.4-1.2c-.1-.4-.3-.8-.5-1.3c-.2-.5-.5-1.5-.6-1.8c-.1-.3-.2-.1 0 0z" fill="#86522f"/><path d="M119.2 66.6c.1-.3.4-1.2.6-2c.3-.8.6-1.8 1-2.9c.3-1.1.7-2.3 1.1-3.6c.5-1.2.9-2.6 1.4-3.9c.4-1.4 1.1-3.4 1.3-4.1c.2-.7.3-.7 0 0c-.3.7-1.1 2.7-1.7 3.9c-.7 1.3-1.5 2.6-2.1 3.8c-.6 1.2-1.2 2.3-1.5 3.4c-.3 1.1-.2 2.3-.2 3.2c-.1.9 0 1.8 0 2.2c0 .4 0 .3.1 0z" fill="#70432a" fill-opacity="0.5"/><path d="M111.5 38.4c.4-.3 1.4-1.5 2.1-2c.8-.6 1.8-1 2.7-1.2c.9-.3 1.9-.4 2.8-.3c.9.1 1.8.4 2.6.8c.9.4 1.6 1 2.3 1.7c.6.7 1.2 1.5 1.5 2.4c.4.9.7 1.9.7 2.9c.1 1-.2 2.5-.2 3c-.1.5.2.4 0 0c-.2-.5-.7-2-1-2.8c-.4-.9-.8-1.5-1.3-2.1c-.4-.6-.9-1.1-1.4-1.6c-.6-.4-1.1-.8-1.7-1.1c-.6-.3-1.2-.5-1.9-.6c-.6-.2-1.3-.3-2-.3c-.8 0-1.5.1-2.4.3c-.9.2-2.3.7-2.8.9c-.5.1-.3.3 0 0z" fill="#86522f" fill-opacity="0.8"/><path d="M118.4 46.1c-.1.5-.5 1-1 1.2c-.5.3-1.3.4-2 .4c-.6-.1-1.5-.3-2-.7c-.6-.3-1.2-.8-1.4-1.3c-.3-.5-.4-1.2-.2-1.6c.1-.5.5-1 1-1.2c.5-.3 1.3-.4 2-.4c.6.1 1.4.3 2 .6c.6.4 1.1.9 1.4 1.4c.3.5.4 1.1.2 1.6z" fill="#b07651" fill-opacity="0.55"/><path d="M106.6 53.4c.1-.7.7-2.6 1.1-4c.4-1.4.8-2.8 1.1-4.1c.4-1.4.8-3 1.2-3.9c.3-1 .5-1.4 1-1.9c.4-.6 1-1.1 1.7-1.5c.6-.4 1.4-.7 2.2-.9c.7-.2 1.6-.3 2.5-.2c.8 0 1.7.1 2.5.4c.8.2 1.6.6 2.4 1.1c.7.4 1.3 1 1.9 1.6c.5.6 1 1.2 1.3 1.9c.3.7.5 1.5.6 2.2c0 .7 0 1.1-.3 2.1c-.2 1-.8 2.6-1.2 3.9c-.4 1.3-.9 2.7-1.3 4.1c-.5 1.3-.9 2.7-1.4 3.9c-.4 1.3-.8 2.5-1.1 3.6c-.4 1.1-.7 2.1-1 2.9c-.2.8-.5 1.7-.6 2" fill="none" stroke="#55301a" stroke-width="1"/><path d="M118.8 49.9c-.2 0-.8.2-1.2.3c-.4 0-.8 0-1.2 0c-.4 0-.7-.1-1.1-.2c-.3-.1-.7-.2-1-.4c-.3-.2-.6-.4-.9-.7c-.3-.3-.8-.8-.9-.9" fill="none" stroke="#6a3c22" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.55"/><path d="M118.8 47.2c-.2 0-.6.1-.9.1c-.3.1-.6.1-.9.1c-.3-.1-.6-.1-.8-.2c-.3-.1-.5-.2-.8-.3c-.2-.2-.5-.3-.7-.5c-.2-.2-.5-.6-.6-.7" fill="none" stroke="#6a3c22" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.4"/><path d="M86.1 56.6c-.1-.6.1-.7.1-.9c0-.3 0-.5 0-.7c0-.3 0-.5.1-.9c0-.3 0-.7.1-1.4c.1-.7.3-1.5.5-2.5c.2-1.1.4-2.5.7-4c.3-1.5.6-3.3.9-5c.3-1.8.6-3.8 1-5.7c.3-1.9.6-4 1-5.9c.3-1.9.7-4.2 1-5.5c.3-1.3.5-1.5.9-2.2c.5-.7 1.1-1.4 1.7-1.9c.7-.5 1.6-1 2.4-1.3c.9-.3 1.8-.5 2.8-.5c.9-.1 2 0 2.9.1c1 .2 1.9.6 2.8 1c.9.4 1.7.9 2.4 1.5c.7.7 1.3 1.4 1.7 2.1c.4.8.7 1.6.9 2.4c.1.8.2 1.1 0 2.4c-.2 1.3-.7 3.6-1.1 5.5c-.4 1.9-.8 3.9-1.3 5.8c-.4 1.9-.8 3.9-1.2 5.6c-.4 1.8-.7 3.6-1.1 5.1c-.3 1.4-.5 2.8-.8 3.9c-.2 1.1-.4 1.8-.5 2.5c-.2.7-.3 1-.4 1.4c-.1.4-.2.6-.3.8c-.1.2-.1.4-.2.6c-.1.3.1.4-.2 1c-.3.5-.8 1.7-1.7 2.3c-.8.6-2.1 1.1-3.4 1.2c-1.3.2-2.9.2-4.3-.1c-1.4-.3-3-.8-4.1-1.5c-1.1-.7-2.1-1.6-2.7-2.4c-.6-.9-.6-2.2-.6-2.8z" fill="#9a5f3b"/><path d="M103.3 58.3c.1-.1.2-.4.3-.8c.1-.4.2-.7.4-1.4c.1-.7.3-1.4.5-2.5c.3-1.1.5-2.5.8-3.9c.4-1.5.7-3.3 1.1-5.1c.4-1.7.8-3.7 1.2-5.6c.5-1.9.9-3.9 1.3-5.8c.4-1.9.9-4.6 1.1-5.5c.2-.9.3-.9 0 0c-.3.9-.9 3.6-1.7 5.4c-.8 1.8-2.2 3.6-3.2 5.4c-1.1 1.8-2.3 3.6-3.1 5.3c-.8 1.7-1.2 3.4-1.6 4.9c-.4 1.5-.9 2.8-.8 3.9c.1 1.2.6 2.1 1.2 2.9c.6.8 1.9 1.4 2.3 1.9c.4.5.2.8.2.9c.1.1 0 .1 0 0z" fill="#86522f"/><path d="M104.1 16.3c.3.2 1 .5 1.5.8c.5.3.9.6 1.4 1c.4.4.8.8 1.1 1.2c.4.5.7 1 .9 1.5c.3.5.5 1.1.7 1.6c.2.6.3 1.2.4 1.8c.1.5.1 1.1.1 1.7c0 .6-.2 1.5-.2 1.8c0 .3.2.3 0 0c-.2-.3-.8-1.2-1.1-1.8c-.3-.5-.5-.9-.7-1.4c-.3-.4-.5-.8-.7-1.2c-.2-.4-.4-.8-.6-1.2c-.2-.3-.4-.7-.6-1.1c-.2-.4-.4-.9-.6-1.3c-.2-.5-.5-.9-.7-1.4c-.3-.6-.7-1.6-.9-2c-.1-.3-.2-.1 0 0z" fill="#86522f"/><path d="M104 56.1c.1-.4.3-1.4.5-2.5c.3-1.1.5-2.5.8-3.9c.4-1.5.7-3.3 1.1-5.1c.4-1.7.8-3.7 1.2-5.6c.5-1.9 1.1-4.8 1.3-5.8c.2-1 .3-.9 0 0c-.3 1-1.1 3.9-1.7 5.7c-.7 1.9-1.5 3.7-2.1 5.5c-.6 1.7-1.2 3.4-1.5 4.9c-.2 1.5 0 3 0 4.1c.1 1.1.3 2.2.3 2.7c.1.4 0 .4.1 0z" fill="#70432a" fill-opacity="0.5"/><path d="M92.9 20.6c.3-.4 1.3-1.9 2.1-2.6c.9-.7 1.9-1.3 2.9-1.6c1-.4 2.1-.6 3.1-.6c1 0 2.1.2 3.1.5c1 .4 1.9 1 2.7 1.7c.8.7 1.6 1.6 2.1 2.5c.5 1 .9 2.1 1.1 3.2c.2 1.1.1 2.8.1 3.4c0 .6.2.5 0 0c-.3-.5-1-2.2-1.5-3.1c-.5-.9-1-1.6-1.6-2.2c-.6-.6-1.2-1.1-1.9-1.6c-.6-.4-1.3-.7-2-1c-.7-.2-1.4-.4-2.2-.5c-.7-.1-1.5-.2-2.4-.1c-.8.1-1.6.3-2.6.6c-.9.4-2.5 1.2-3 1.4c-.5.2-.4.4 0 0z" fill="#86522f" fill-opacity="0.8"/><path d="M101.6 28.5c-.1.5-.5 1.1-1.1 1.5c-.5.3-1.3.6-2.1.6c-.8 0-1.7-.2-2.4-.5c-.7-.3-1.4-.8-1.7-1.4c-.4-.5-.6-1.2-.5-1.7c.1-.6.6-1.2 1.1-1.5c.5-.4 1.4-.6 2.1-.6c.8-.1 1.7.1 2.4.4c.7.3 1.4.9 1.8 1.4c.3.5.5 1.2.4 1.8z" fill="#b07651" fill-opacity="0.55"/><path d="M87.6 46.2c.2-.8.6-3.3.9-5c.3-1.8.6-3.8 1-5.7c.3-1.9.6-4 1-5.9c.3-1.9.7-4.2 1-5.5c.3-1.3.5-1.5.9-2.2c.5-.7 1.1-1.4 1.7-1.9c.7-.5 1.6-1 2.4-1.3c.9-.3 1.8-.5 2.8-.5c.9-.1 2 0 2.9.1c1 .2 1.9.6 2.8 1c.9.4 1.7.9 2.4 1.5c.7.7 1.3 1.4 1.7 2.1c.4.8.7 1.6.9 2.4c.1.8.2 1.1 0 2.4c-.2 1.3-.7 3.6-1.1 5.5c-.4 1.9-.8 3.9-1.3 5.8c-.4 1.9-.8 3.9-1.2 5.6c-.4 1.8-.7 3.6-1.1 5.1c-.3 1.4-.6 3.2-.8 3.9" fill="none" stroke="#55301a" stroke-width="1"/><path d="M102.3 33.5c-.2 0-.9.3-1.3.4c-.5.1-.9.2-1.3.2c-.5 0-.9 0-1.3-.1c-.4-.1-.8-.2-1.2-.4c-.4-.1-.8-.3-1.1-.6c-.4-.3-.9-.8-1.1-1" fill="none" stroke="#6a3c22" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.55"/><path d="M101.9 30.7c-.2.1-.7.3-1 .4c-.3 0-.7.1-1 .1c-.3 0-.6 0-.9-.1c-.3-.1-.6-.1-.9-.3c-.3-.1-.6-.3-.9-.5c-.3-.2-.7-.5-.8-.7" fill="none" stroke="#6a3c22" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.4"/><path d="M68.3 53.1c-.2-.6 0-.7 0-.9c0-.3 0-.4 0-.6c-.1-.2-.1-.3-.1-.7c0-.4 0-.8 0-1.5c.1-.7.1-1.6.2-2.8c.1-1.2.2-2.8.4-4.5c.1-1.8.2-3.8.4-5.9c.1-2.1.3-4.4.4-6.6c.2-2.2.3-4.6.5-6.8c.2-2.2.3-4.9.5-6.4c.2-1.5.3-1.7.7-2.5c.4-.7 1-1.5 1.6-2.1c.7-.6 1.5-1.2 2.4-1.6c.8-.4 1.8-.8 2.8-.9c1-.2 2.1-.2 3.1-.2c1 .1 2.1.4 3 .7c1 .3 1.9.8 2.7 1.4c.8.6 1.5 1.3 2 2c.5.7 1 1.5 1.2 2.4c.3.8.3 1 .3 2.5c-.1 1.5-.4 4.2-.6 6.4c-.3 2.2-.5 4.6-.7 6.8c-.3 2.2-.5 4.5-.7 6.6c-.3 2.1-.5 4.1-.7 5.8c-.1 1.7-.3 3.3-.4 4.5c-.1 1.2-.2 2.1-.3 2.8c-.1.8-.2 1.1-.2 1.5c-.1.4-.2.5-.2.7c-.1.2-.2.3-.2.6c0 .2.1.3-.1.9c-.3.6-.7 1.9-1.5 2.6c-.8.7-2.1 1.3-3.4 1.7c-1.4.3-3.1.4-4.6.3c-1.5-.2-3.2-.6-4.4-1.1c-1.3-.6-2.5-1.5-3.1-2.3c-.7-.8-.8-2.2-1-2.8z" fill="#9a5f3b"/><path d="M86.6 53.2c0-.1.1-.3.2-.7c0-.4.1-.7.2-1.5c.1-.7.2-1.6.3-2.8c.1-1.2.3-2.8.4-4.5c.2-1.7.4-3.7.7-5.8c.2-2.1.4-4.4.7-6.6c.2-2.2.4-4.6.7-6.8c.2-2.2.5-5.3.6-6.4c.1-1.1.2-1 0 0c-.2 1.1-.6 4.2-1.3 6.4c-.7 2.1-1.8 4.4-2.8 6.6c-.9 2.1-2 4.3-2.7 6.4c-.6 2-.9 4-1.2 5.8c-.2 1.7-.6 3.2-.4 4.5c.2 1.2.9 2.2 1.6 2.9c.7.8 2.1 1.4 2.6 1.8c.5.4.3.6.4.7c0 .2-.1.1 0 0z" fill="#86522f"/><path d="M83 6.8c.2.1 1.1.4 1.6.6c.5.3 1.1.6 1.5 1c.5.3 1 .7 1.4 1.1c.4.5.8 1 1.1 1.5c.3.5.6 1 .9 1.6c.2.6.4 1.2.6 1.8c.1.6.2 1.2.3 1.8c0 .6 0 1.6 0 1.9c0 .3.2.3 0 0c-.2-.3-1-1.2-1.3-1.7c-.4-.6-.7-1-1-1.4c-.3-.5-.6-.9-.8-1.3c-.3-.4-.5-.7-.8-1.1c-.3-.4-.5-.8-.7-1.2c-.3-.4-.5-.8-.8-1.2c-.3-.5-.6-.9-.9-1.5c-.4-.5-1-1.5-1.1-1.9c-.2-.3-.3-.1 0 0z" fill="#86522f"/><path d="M87 51c.1-.4.2-1.6.3-2.8c.1-1.2.3-2.8.4-4.5c.2-1.7.4-3.7.7-5.8c.2-2.1.4-4.4.7-6.6c.2-2.2.6-5.7.7-6.8c.1-1.1.2-1.1 0 0c-.2 1.1-.8 4.5-1.2 6.8c-.5 2.2-1.2 4.4-1.7 6.5c-.4 2-.9 4-1 5.8c-.1 1.7.3 3.3.4 4.5c.2 1.3.5 2.5.6 2.9c.2.5 0 .5.1 0z" fill="#70432a" fill-opacity="0.5"/><path d="M71.6 12.5c.4-.5 1.2-2.1 2-2.9c.8-.8 1.8-1.6 2.8-2.1c1-.5 2.1-.8 3.2-.9c1.1-.1 2.3 0 3.4.2c1 .3 2.1.8 3 1.5c.9.6 1.8 1.5 2.4 2.4c.7.9 1.2 2.1 1.6 3.2c.3 1.1.3 2.9.4 3.5c.1.6.3.5 0 0c-.3-.5-1.3-2.1-1.9-3c-.6-.9-1.3-1.6-1.9-2.2c-.7-.6-1.4-1-2.2-1.4c-.7-.4-1.4-.6-2.2-.8c-.7-.2-1.5-.4-2.3-.4c-.8 0-1.7 0-2.5.2c-.9.2-1.8.5-2.7 1c-1 .4-2.6 1.4-3.1 1.7c-.5.3-.3.5 0 0z" fill="#86522f" fill-opacity="0.8"/><path d="M81.7 19.8c-.1.6-.5 1.3-1 1.7c-.5.4-1.4.8-2.2.9c-.7.1-1.8 0-2.5-.2c-.8-.3-1.6-.8-2-1.3c-.4-.5-.7-1.2-.6-1.8c0-.6.4-1.2.9-1.7c.5-.4 1.4-.7 2.2-.9c.8-.1 1.8 0 2.5.3c.8.2 1.6.7 2 1.2c.5.5.7 1.3.7 1.8z" fill="#b07651" fill-opacity="0.55"/><path d="M68.4 46.6c.1-.8.2-2.8.4-4.5c.1-1.8.2-3.8.4-5.9c.1-2.1.3-4.4.4-6.6c.2-2.2.3-4.6.5-6.8c.2-2.2.3-4.9.5-6.4c.2-1.5.3-1.7.7-2.5c.4-.7 1-1.5 1.6-2.1c.7-.6 1.5-1.2 2.4-1.6c.8-.4 1.8-.8 2.8-.9c1-.2 2.1-.2 3.1-.2c1 .1 2.1.4 3 .7c1 .3 1.9.8 2.7 1.4c.8.6 1.5 1.3 2 2c.5.7 1 1.5 1.2 2.4c.3.8.3 1 .3 2.5c-.1 1.5-.4 4.2-.6 6.4c-.3 2.2-.5 4.6-.7 6.8c-.3 2.2-.5 4.5-.7 6.6c-.3 2.1-.6 4.8-.7 5.8" fill="none" stroke="#55301a" stroke-width="1"/><path d="M82.9 25.4c-.2.1-.9.5-1.3.7c-.5.1-.9.2-1.4.3c-.4.1-.9.1-1.3 0c-.4 0-.9-.1-1.3-.2c-.4-.2-.9-.4-1.3-.6c-.4-.2-1-.7-1.2-.9" fill="none" stroke="#6a3c22" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.55"/><path d="M82.2 22.7c-.2.1-.7.4-1 .5c-.4.1-.7.2-1.1.2c-.3.1-.6.1-.9.1c-.4-.1-.7-.1-1-.2c-.3-.1-.7-.3-1-.4c-.3-.2-.8-.6-.9-.7" fill="none" stroke="#6a3c22" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.4"/><path d="M56.7 135.1c-2-1.1-4.7-3.7-7-5.7c-2.4-1.9-4.8-4-7.2-6.1c-2.4-2.2-4.8-4.4-7.2-6.6c-2.4-2.2-4.8-4.5-7-6.7c-2.2-2.2-4.4-4.4-6.3-6.5c-1.9-2.1-3.6-4-5.1-6.1c-1.6-2-3-4-4.3-6.1c-1.3-2.2-2.5-4.5-3.5-6.9c-1-2.4-1.9-5-2.5-7.7c-.5-2.7-1-5.6-1-8.6c0-3 .3-6.2.9-9.1c.6-3 1.7-5.9 2.7-8.7c1.1-2.8 2.3-5.4 3.4-8c1.1-2.6 2.3-5 3.3-7.5c1-2.5 2-5.5 2.7-7.3c.7-1.7 1-2.2 1.7-3.2c.7-.9 1.5-1.8 2.5-2.5c.9-.7 2-1.2 3-1.6c1.1-.4 2.3-.6 3.4-.6c1.1 0 2.2.2 3.2.6c1.1.4 2.1.9 3 1.6c.8.7 1.6 1.6 2.2 2.5c.6 1 1.1 2.1 1.4 3.2c.3 1.1.4 2.3.4 3.5c-.1 1.2-.2 1.7-.7 3.5c-.6 1.9-1.7 5.2-2.6 7.8c-.9 2.6-2 5.4-2.8 7.9c-.9 2.6-1.7 5.1-2.3 7.2c-.6 2.2-1.1 4.3-1.4 6c-.3 1.7-.3 3-.3 4.3c.1 1.2.3 2.2.7 3.2c.3 1.1.8 2 1.4 3c.7 1 1.4 2 2.3 3.2c1 1.1 2.1 2.4 3.3 3.7c1.3 1.4 2.5 2.9 4 4.3c1.5 1.5 3.1 3 5.1 4.4c2 1.5 4.3 2.8 6.7 4.3c2.5 1.4 5.2 2.9 7.9 4.4c2.7 1.6 5.6 3.2 8.3 4.9c2.6 1.7 5.9 3.7 7.7 5.4c1.7 1.6 2.3 2.8 2.6 4.7c.4 2 .1 4.7-.7 7.1c-.8 2.4-2.2 5.3-3.9 7.5c-1.7 2.2-4 4.4-6.1 5.9c-2.1 1.4-4.6 2.4-6.5 2.7c-2 .2-3.3-.1-5.4-1.3z" fill="#9a5f3b"/><path d="M60.7 98.2c-1.3-.7-5.4-3-7.9-4.4c-2.4-1.5-4.7-2.8-6.7-4.3c-2-1.4-3.6-2.9-5.1-4.4c-1.5-1.4-2.7-2.9-4-4.3c-1.2-1.3-2.3-2.6-3.3-3.7c-.9-1.2-1.6-2.2-2.3-3.2c-.6-1-1.1-1.9-1.4-3c-.4-1-.6-2-.7-3.2c0-1.3 0-2.6.3-4.3c.3-1.7.8-3.8 1.4-6c.6-2.1 1.4-4.6 2.3-7.2c.8-2.5 1.9-5.3 2.8-7.9c.9-2.6 2.1-6.5 2.6-7.8c.4-1.3.5-1.2 0 0c-.6 1.3-1.9 5.1-3.4 7.5c-1.4 2.4-3.6 4.7-5.3 7c-1.8 2.2-3.9 4.3-5.2 6.4c-1.2 2.2-2 4.5-2.6 6.6c-.5 2-.5 4-.5 5.8c.1 1.8.4 3.4.8 5c.4 1.6 1 3 1.8 4.5c.7 1.4 1.6 2.8 2.7 4.3c1 1.5 2.3 3 3.6 4.5c1.3 1.6 2.6 3.4 4.3 4.9c1.8 1.6 3.4 3.5 6.1 4.4c2.6.9 6.6.5 9.9 1c3.2.4 8.1 1.5 9.8 1.8c1.6.4 1.3.8 0 0z" fill="#86522f"/><path d="M34 20.9c.2.2 1 .6 1.5 1c.5.4 1 .9 1.4 1.4c.4.5.7 1 1 1.6c.4.5.6 1.1.8 1.8c.2.6.4 1.2.5 1.9c.1.6.2 1.3.2 2c0 .6-.1 1.3-.2 2c-.1.6-.4 1.6-.5 1.9c-.1.4.1.4 0 0c-.2-.3-.7-1.5-.9-2.1c-.3-.7-.4-1.2-.6-1.7c-.2-.6-.4-1-.6-1.5c-.2-.5-.3-.9-.5-1.4c-.2-.5-.3-.9-.4-1.4c-.2-.5-.3-1-.5-1.5c-.2-.6-.4-1.1-.6-1.8c-.2-.6-.5-1.8-.6-2.2c-.1-.4-.3-.2 0 0z" fill="#86522f"/><path d="M52.8 93.8c-1.1-.7-4.7-2.8-6.7-4.3c-2-1.4-3.6-2.9-5.1-4.4c-1.5-1.4-2.7-2.9-4-4.3c-1.2-1.3-2.3-2.6-3.3-3.7c-.9-1.2-1.6-2.2-2.3-3.2c-.6-1-1.1-1.9-1.4-3c-.4-1-.6-2-.7-3.2c0-1.3 0-2.6.3-4.3c.3-1.7.8-3.8 1.4-6c.6-2.1 1.4-4.6 2.3-7.2c.8-2.5 2.3-6.6 2.8-7.9c.4-1.3.5-1.3 0 0c-.6 1.3-2.2 5.3-3.3 7.7c-1.2 2.5-2.5 4.8-3.4 6.9c-.9 2.2-1.7 4.2-2.1 6c-.4 1.8-.4 3.4-.3 4.8c0 1.4.3 2.6.6 3.8c.4 1.2.9 2.3 1.6 3.5c.7 1.1 1.4 2.2 2.4 3.5c1 1.2 2.1 2.6 3.4 4c1.3 1.3 2.7 2.8 4.5 4.1c1.8 1.2 4 2.2 6.2 3.4c2.2 1.2 5.9 3.1 7.1 3.8c1.2.6 1.1.7 0 0z" fill="#70432a" fill-opacity="0.5"/><path d="M40.6 109.8c-1.2-1-4.8-4-7-6c-2.1-1.9-4.1-3.9-5.9-5.8c-1.8-1.9-3.3-3.7-4.8-5.5c-1.5-1.9-2.8-3.6-4-5.5c-1.2-1.9-2.2-3.7-3.1-5.8c-.9-2-1.6-4-2.2-6.2c-.5-2.2-.9-4.6-.9-7c0-2.5.3-5.1.8-7.7c.5-2.6 1.4-5.2 2.3-7.8c.9-2.6 2-5.3 3-7.8c1.1-2.6 2.6-6.4 3.2-7.6" fill="none" stroke="#b07651" stroke-width="4" stroke-linecap="round" stroke-opacity="0.5"/><path d="M56.7 135.1c-1.2-.9-4.7-3.7-7-5.7c-2.4-1.9-4.8-4-7.2-6.1c-2.4-2.2-4.8-4.4-7.2-6.6c-2.4-2.2-4.8-4.5-7-6.7c-2.2-2.2-4.4-4.4-6.3-6.5c-1.9-2.1-3.6-4-5.1-6.1c-1.6-2-3-4-4.3-6.1c-1.3-2.2-2.5-4.5-3.5-6.9c-1-2.4-1.9-5-2.5-7.7c-.5-2.7-1-5.6-1-8.6c0-3 .3-6.2.9-9.1c.6-3 1.7-5.9 2.7-8.7c1.1-2.8 2.3-5.4 3.4-8c1.1-2.6 2.3-5 3.3-7.5c1-2.5 2-5.5 2.7-7.3c.7-1.7 1-2.2 1.7-3.2c.7-.9 1.5-1.8 2.5-2.5c.9-.7 2-1.2 3-1.6c1.1-.4 2.3-.6 3.4-.6c1.1 0 2.2.2 3.2.6c1.1.4 2.1.9 3 1.6c.8.7 1.6 1.6 2.2 2.5c.6 1 1.1 2.1 1.4 3.2c.3 1.1.4 2.3.4 3.5c-.1 1.2-.2 1.7-.7 3.5c-.6 1.9-1.7 5.2-2.6 7.8c-.9 2.6-2 5.4-2.8 7.9c-.9 2.6-1.7 5.1-2.3 7.2c-.6 2.2-1.1 4.3-1.4 6c-.3 1.7-.3 3-.3 4.3c.1 1.2.3 2.2.7 3.2c.3 1.1.8 2 1.4 3c.7 1 1.4 2 2.3 3.2c1 1.1 2.1 2.4 3.3 3.7c1.3 1.4 2.5 2.9 4 4.3c1.5 1.5 3.1 3 5.1 4.4c2 1.5 5.6 3.6 6.7 4.3" fill="none" stroke="#55301a" stroke-width="1"/><path d="M19.6 68.4c-.2.2-.9.7-1.3.9c-.5.3-.9.5-1.4.6c-.4.2-.9.2-1.3.2c-.5 0-.9 0-1.4-.1c-.4-.1-.9-.3-1.3-.6c-.5-.2-1.1-.7-1.4-.9" fill="none" stroke="#6a3c22" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.5"/><path d="M27.4 23.6c-.6-.2-1.2-.3-1.8-.3c-.6 0-1.1.2-1.6.4c-.5.2-1 .6-1.5 1c-.4.5-.8 1-1.2 1.7c-.4.6-.8 1.5-1.1 2.4c-.3.8-.7 2-.8 2.7c-.1.7-.1 1 0 1.5c.1.4.2.8.4 1.1c.3.4.5.6 1 1c.5.3 1.5.7 2.3.9c.7.3 1.7.6 2.3.7c.6.1 1 0 1.4-.1c.4-.2.7-.4 1-.7c.4-.3.6-.5.9-1.1c.4-.7.8-1.8 1.1-2.7c.3-.8.6-1.7.7-2.5c.1-.8.1-1.4 0-2.1c0-.6-.2-1.2-.5-1.7c-.2-.5-.5-.9-1-1.3c-.4-.4-1-.7-1.6-.9z" fill="#c3967d" stroke="#97664b" stroke-width=".7"/><path d="M21.6 32.4c.1-.3.4-1.1.6-1.6c.2-.6.4-1.1.6-1.7c.2-.5.4-1.1.6-1.6c.1-.6.4-1.4.5-1.7" fill="none" stroke="#dfbfac" stroke-width=".9" stroke-linecap="round" stroke-opacity="0.75"/><path d="M51 59.5c-.3-.6-.1-.7-.1-.9c-.1-.2-.1-.3-.1-.5c0-.1 0-.3 0-.6c-.1-.4-.1-.7-.2-1.5c-.1-.8-.2-1.8-.3-3.3c-.1-1.5-.3-3.5-.3-5.6c-.1-2.2-.1-4.8-.2-7.3c0-2.5-.1-5.2-.3-7.5c-.1-2.3-.4-4.8-.7-6.3c-.2-1.6-.6-2.5-.7-3.1c-.2-.5 0 0-.2-.2c-.2-.1-.5-.3-1.1-.5c-.6-.2-1.5-.4-2.4-.6c-.9-.1-2.2-.2-3.1-.2c-.9-.1-1.9-.1-2.3-.1c-.4 0-.1 0 0-.1c.2-.1.8-.5.9-.5c.1-.1 0-.1-.2.2c-.3.2-.8.9-1.3 1.4c-.5.5-1 1-1.6 1.5c-.6.5-1.3 1.1-2.1 1.4c-.7.4-1.6.7-2.4.8c-.8.1-1.6.1-2.4 0c-.8-.1-1.6-.4-2.3-.7c-.7-.4-1.3-.9-1.9-1.5c-.5-.5-1-1.2-1.3-2c-.3-.7-.5-1.5-.6-2.3c0-.8 0-1.6.2-2.4c.2-.8.5-1.6 1-2.4c.4-.7 1.1-1.5 1.5-1.9c.4-.5.6-.5.9-.8c.2-.3.3-.6.8-1.2c.4-.5 1-1.4 2-2.2c1-.7 2.5-1.7 3.8-2.2c1.3-.5 2.8-.6 4.1-.7c1.3-.2 2.2-.1 3.6-.1c1.3 0 2.8-.1 4.4 0c1.7.2 3.6.2 5.6.8c2 .6 4.3 1.4 6.2 2.8c1.9 1.5 3.9 3.7 5.2 5.9c1.3 2.2 1.9 4.9 2.5 7.5c.5 2.6.8 5.4 1.1 8.2c.2 2.7.4 5.7.5 8.2c.2 2.6.2 5.3.4 7.3c.1 2.1.2 3.8.3 5.1c.1 1.3.2 2 .3 2.7c0 .7.1 1.2.1 1.5c.1.4.1.5.1.7c0 .2 0 .2 0 .4c.1.3.3.3.1.9c-.1.6-.2 1.9-.9 2.8c-.6.8-1.8 1.7-3 2.2c-1.2.6-2.8 1-4.3 1.2c-1.5.2-3.2.1-4.5-.2c-1.3-.4-2.6-1-3.4-1.6c-.8-.7-1.2-2-1.4-2.5z" fill="#9a5f3b"/><path d="M68.3 55.6c0-.2-.1-.8-.1-1.5c-.1-.7-.2-1.4-.3-2.7c-.1-1.3-.2-3-.3-5.1c-.2-2-.2-4.7-.4-7.3c-.1-2.5-.3-5.5-.5-8.2c-.3-2.8-.6-5.6-1.1-8.2c-.6-2.6-1.2-5.3-2.5-7.5c-1.3-2.2-3.3-4.4-5.2-5.9c-1.9-1.4-4.2-2.2-6.2-2.8c-2-.6-3.9-.6-5.6-.8c-1.6-.1-3.1 0-4.4 0c-1.4 0-2.3-.1-3.6.1c-1.3.1-2.8.2-4.1.7c-1.3.5-2.8 1.5-3.8 2.2c-1 .8-1.6 1.7-2 2.2c-.5.6-.6.9-.8 1.2c-.3.3-.7.6-.9.8c-.1.1-.2 0 0 0c.2-.1.7-.4 1.2-.4c.6-.1 1.4 0 2.2 0c.8-.1 1.9-.3 2.9-.6c.9-.2 1.8-.7 2.7-1c.9-.2 1.8-.4 2.9-.5c1 0 2 0 3.2 0c1.2 0 2.6 0 4 .1c1.5.2 3.1.3 4.6.8c1.6.4 3.3 1 4.7 2.1c1.4 1 2.8 2.4 3.7 4.2c.9 1.7 1.5 3.8 1.9 6.1c.5 2.3.8 5 1 7.6c.3 2.6.4 5.5.5 8.1c.1 2.5.1 5.2.3 7.3c.2 2 .2 3.9.8 5.2c.7 1.2 2.3 1.9 3.2 2.5c.9.7 1.7 1.1 2 1.3c.4.3.1.3 0 0z" fill="#86522f"/><path d="M25 22.9c-.1-.2-.5-.8-.6-1.2c-.2-.4-.3-.8-.4-1.3c-.1-.4-.2-.9-.2-1.3c0-.5 0-1 .1-1.4c.1-.5.2-.9.3-1.4c.2-.4.4-.9.6-1.3c.2-.4.5-.8.8-1.2c.3-.4.8-.9.9-1c.2-.2.1-.3 0 0c0 .2-.1 1.1-.1 1.6c-.1.5-.1.9-.2 1.3c0 .4-.1.7-.1 1.1c-.1.4-.1.7-.2 1c0 .4-.1.7-.1 1.1c-.1.3-.2.7-.3 1.1c0 .4-.1.8-.2 1.3c0 .4-.2 1.3-.3 1.6c-.1.3.1.2 0 0z" fill="#86522f"/><path d="M68.2 54.1c-.1-.4-.2-1.4-.3-2.7c-.1-1.3-.2-3-.3-5.1c-.2-2-.2-4.7-.4-7.3c-.1-2.5-.3-5.5-.5-8.2c-.3-2.8-.6-5.6-1.1-8.2c-.6-2.6-1.2-5.3-2.5-7.5c-1.3-2.2-3.3-4.4-5.2-5.9c-1.9-1.4-4.2-2.2-6.2-2.8c-2-.6-3.9-.6-5.6-.8c-1.6-.1-3.1 0-4.4 0c-1.4 0-2.3-.1-3.6.1c-1.3.1-2.8.2-4.1.7c-1.3.5-2.8 1.5-3.8 2.2c-1 .8-1.6 1.7-2 2.2c-.5.6-.7 1-.8 1.2c-.2.2-.2.1 0 0c.1-.2.5-.5 1.1-.9c.6-.4 1.4-1 2.4-1.6c1-.5 2.4-1.3 3.6-1.6c1.2-.4 2.5-.6 3.7-.7c1.2-.1 2.2 0 3.5 0c1.3 0 2.7-.1 4.3 0c1.6.2 3.4.3 5.2.8c1.8.6 4 1.3 5.7 2.6c1.7 1.3 3.5 3.2 4.7 5.3c1.2 2.1 1.7 4.5 2.3 7.1c.5 2.5.8 5.2 1.1 7.9c.2 2.7.3 5.6.5 8.2c.2 2.6.3 5.2.7 7.3c.3 2 1 3.7 1.3 5c.3 1.3.6 2.3.7 2.7c.1.5 0 .5 0 0z" fill="#70432a" fill-opacity="0.5"/><path d="M55.3 46.9c-.1-1.3-.2-4.8-.3-7.3c0-2.5-.1-5.3-.3-7.8c-.2-2.4-.5-5-.8-6.8c-.4-1.9-.8-3.4-1.3-4.4c-.5-1.1-1-1.4-1.7-1.9c-.7-.5-1.6-.9-2.6-1.2c-1-.3-2.2-.5-3.4-.7c-1.1-.1-2.4-.1-3.5-.2c-1 0-2 0-2.7 0c-.6 0-.9.1-1.2.1c-.3.1-.3.2-.5.4c-.2.1-.4.4-.8.8c-.3.3-.9 1.1-1.1 1.3" fill="none" stroke="#b07651" stroke-width="2.1" stroke-linecap="round" stroke-opacity="0.5"/><path d="M50.6 56c-.1-.6-.2-1.8-.3-3.3c-.1-1.5-.3-3.5-.3-5.6c-.1-2.2-.1-4.8-.2-7.3c0-2.5-.1-5.2-.3-7.5c-.1-2.3-.4-4.8-.7-6.3c-.2-1.6-.6-2.5-.7-3.1c-.2-.5 0 0-.2-.2c-.2-.1-.5-.3-1.1-.5c-.6-.2-1.5-.4-2.4-.6c-.9-.1-2.2-.2-3.1-.2c-.9-.1-1.9-.1-2.3-.1c-.4 0-.1 0 0-.1c.2-.1.8-.5.9-.5c.1-.1 0-.1-.2.2c-.3.2-.8.9-1.3 1.4c-.5.5-1 1-1.6 1.5c-.6.5-1.3 1.1-2.1 1.4c-.7.4-1.6.7-2.4.8c-.8.1-1.6.1-2.4 0c-.8-.1-1.6-.4-2.3-.7c-.7-.4-1.3-.9-1.9-1.5c-.5-.5-1-1.2-1.3-2c-.3-.7-.5-1.5-.6-2.3c0-.8 0-1.6.2-2.4c.2-.8.5-1.6 1-2.4c.4-.7 1.1-1.5 1.5-1.9c.4-.5.6-.5.9-.8c.2-.3.3-.6.8-1.2c.4-.5 1-1.4 2-2.2c1-.7 2.5-1.7 3.8-2.2c1.3-.5 2.8-.6 4.1-.7c1.3-.2 2.2-.1 3.6-.1c1.3 0 2.8-.1 4.4 0c1.7.2 3.6.2 5.6.8c2 .6 4.3 1.4 6.2 2.8c1.9 1.5 3.9 3.7 5.2 5.9c1.3 2.2 1.9 4.9 2.5 7.5c.5 2.6.8 5.4 1.1 8.2c.2 2.7.4 5.7.5 8.2c.2 2.6.3 6.1.4 7.3" fill="none" stroke="#55301a" stroke-width="1"/><path d="M59.1 18.4c-.1.2-.4.9-.6 1.2c-.3.4-.5.7-.8 1c-.3.2-.6.4-1 .6c-.3.2-.7.3-1 .4c-.4.1-.8.1-1.3.1c-.4 0-1.1-.1-1.3-.1" fill="none" stroke="#6a3c22" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.55"/><path d="M58 15.6c-.1.3-.4.9-.7 1.3c-.3.4-.6.7-.9 1c-.3.2-.7.5-1 .7c-.4.2-.8.3-1.2.4c-.4.1-.9.2-1.3.2c-.5 0-1.2-.1-1.5-.1" fill="none" stroke="#6a3c22" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.5"/><path d="M38.4 11.1c.1.2.3.5.5.8c.1.2.2.5.3.8c.1.2.1.5.1.7c0 .3 0 .6 0 .8c-.1.3-.1.5-.2.8c-.1.3-.4.7-.4.8" fill="none" stroke="#6a3c22" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.45"/><path d="M28.6 21.8c.4.4.9.8 1.4 1c.5.3 1 .4 1.6.4c.5 0 1.1-.2 1.7-.4c.6-.2 1.2-.5 1.9-.9c.7-.4 1.4-1 2.1-1.7c.7-.6 1.6-1.5 2.1-2.1c.4-.5.6-.9.7-1.3c.2-.4.2-.8.2-1.2c0-.4-.1-.7-.4-1.2c-.3-.5-.9-1.3-1.4-1.9c-.5-.5-1.2-1.2-1.7-1.5c-.5-.4-.8-.4-1.2-.5c-.4 0-.8 0-1.2.1c-.5.2-.8.3-1.4.7c-.6.4-1.6 1.2-2.3 1.9c-.6.6-1.3 1.3-1.8 2c-.5.6-.8 1.2-1 1.8c-.3.6-.4 1.2-.5 1.7c0 .6 0 1.1.2 1.6c.2.5.6 1.1 1 1.5z" fill="#c3967d" stroke="#97664b" stroke-width=".7"/><path d="M37.9 16.4c-.2.2-.9.8-1.3 1.2c-.4.4-.9.8-1.3 1.2c-.5.4-.9.8-1.3 1.2c-.5.5-1.1 1.1-1.3 1.3" fill="none" stroke="#dfbfac" stroke-width=".9" stroke-linecap="round" stroke-opacity="0.75"/><path d="M62.7 52.6c.1.6-.1 1.4-.6 2c-.4.5-1.2 1.1-2 1.5c-.9.3-2 .5-2.8.5c-.9-.1-1.9-.4-2.5-.8c-.6-.4-1.1-1-1.2-1.6c-.1-.7.1-1.5.6-2c.4-.6 1.2-1.2 2-1.6c.8-.3 1.9-.5 2.8-.5c.9.1 1.9.4 2.5.8c.6.4 1.1 1 1.2 1.7z" fill="#b07651" fill-opacity="0.4"/><path d="M54.8 57.3c.7.2 2.9 1.4 4.3 1.4c1.4 0 3.5-1.2 4.2-1.4" fill="none" stroke="#6a3c22" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.38"/><path d="M81.5 47.9c.2.6-.1 1.4-.5 2c-.5.6-1.3 1.2-2.1 1.6c-.8.3-2 .5-2.9.5c-.9 0-1.9-.3-2.5-.8c-.6-.4-1.1-1.1-1.2-1.7c-.1-.6.1-1.4.6-2c.4-.6 1.2-1.2 2.1-1.6c.8-.3 1.9-.5 2.8-.5c.9.1 1.9.4 2.5.8c.6.4 1.1 1.1 1.2 1.7z" fill="#b07651" fill-opacity="0.4"/><path d="M73.5 52.6c.7.3 2.9 1.5 4.4 1.5c1.4 0 3.6-1.2 4.3-1.5" fill="none" stroke="#6a3c22" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.38"/><path d="M99.2 52.4c.1.6-.1 1.4-.6 1.9c-.4.6-1.2 1.2-2 1.5c-.7.3-1.8.5-2.7.5c-.8 0-1.8-.3-2.4-.7c-.5-.4-1-1.1-1.1-1.7c-.1-.6.1-1.3.5-1.9c.4-.6 1.2-1.1 2-1.5c.8-.3 1.9-.5 2.7-.5c.9.1 1.8.4 2.4.8c.6.4 1.1 1 1.2 1.6z" fill="#b07651" fill-opacity="0.4"/><path d="M91.6 57.1c.7.2 2.7 1.5 4.1 1.5c1.4 0 3.4-1.3 4.1-1.5" fill="none" stroke="#6a3c22" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.38"/><path d="M115.2 62.9c.1.5-.1 1.2-.5 1.7c-.3.5-1 1-1.7 1.3c-.7.3-1.7.5-2.4.4c-.8 0-1.6-.3-2.1-.6c-.5-.3-.9-.9-1-1.4c-.1-.6.1-1.2.4-1.7c.4-.5 1.1-1.1 1.8-1.3c.7-.3 1.6-.5 2.4-.5c.7.1 1.6.3 2.1.7c.5.3.9.9 1 1.4z" fill="#b07651" fill-opacity="0.4"/><path d="M108.6 67.5c.6.2 2.5 1.5 3.7 1.5c1.2 0 3-1.3 3.6-1.5" fill="none" stroke="#6a3c22" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.38"/></g></svg>'},
    open:{w:156,h:670,palm:[54.9,137.8],wrist:[56.7,182.4],
      svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 156 670" width="156" height="670"><g class="wh-shadow" fill="#3a2410" stroke="#3a2410" stroke-linejoin="round"><path d="M43.3 180.6l-.9 18.6l-.7 22.3l59.9 0l-.8-22.3l-.9-18.6zM35.7 225.2c-12.8 10.5-3.2 31-5 63.2c-1.8 32.3-3.9 83.7-5.6 130.2c-1.7 46.5-3.6 98.6-4.6 148.8c-1.1 50.3-19.3 127.1-1.9 152.6c17.4 25.4 88.7 25.4 106 0c17.4-25.5-.8-102.3-1.8-152.6c-1.1-50.2-3-102.3-4.7-148.8c-1.7-46.5-3.8-97.9-5.6-130.2c-1.7-32.2 7.8-52.7-5-63.2c-12.8-10.5-59-10.5-71.8 0zM34.2 212.2c3.2-2.7 12.5-3.9 18.7-4.9c6.2-.9 12.5-1.1 18.7-1.1c6.2 0 12.5.2 18.7 1.1c6.2 1 15.5 2.2 18.7 4.9c3.2 2.7.6 7.3.6 11.1c0 3.9 2.6 10.8-.6 12.1c-3.2 1.3-12.5-3.3-18.7-4.2c-6.2-.9-12.5-1.2-18.7-1.2c-6.2 0-12.5.3-18.7 1.2c-6.2.9-15.5 5.5-18.7 4.2c-3.2-1.3-.5-8.2-.5-12.1c0-3.8-2.7-8.4.5-11.1zM39.1 123.6c-.8-1.5-.3-2.9-.6-5.5c-.3-2.6-.6-5.5-1-10.1c-.4-4.5-1.1-12.3-1.5-17.3c-.5-5.1-.9-9.3-1.1-12.9c-.3-3.6-.4-6.5-.5-8.7c-.2-2.2-.3-3-.3-4.5c-.1-1.5-.6-2.9 0-4.4c.7-1.6 2.2-4.3 3.9-5.1c1.6-.7 4.4-.5 6 .6c1.5 1 2.6 4.1 3.2 5.6c.6 1.5.2 1.7.4 3.2c.2 1.5.3 3.2.7 5.8c.3 2.6.8 5.7 1.3 9.8c.5 4.1 1.1 9.7 1.7 14.8c.6 5.2 1.5 12.1 1.9 16c.5 3.9.7 5.2.8 7.5c.1 2.2 1.4 4.6-.4 6c-1.8 1.5-7.9 2.9-10.3 2.8c-2.4-.1-3.4-2-4.2-3.6zM53.9 112.9c-.8-1.6-.1-2.3-.2-5.1c-.1-2.8-.3-6-.5-11.7c-.2-5.6-.5-15.8-.6-22.3c-.2-6.4-.4-11.8-.4-16.4c-.1-4.6 0-8.3 0-11.2c0-2.9-.1-4.3-.1-6.3c.1-2-.5-3.9.4-5.7c.8-1.9 2.7-4.7 4.6-5.4c1.9-.8 5.1-.3 6.8 1c1.7 1.3 2.7 4.7 3.2 6.6c.6 1.9.2 2.7.3 4.8c.1 2.1.2 4.4.4 7.8c.2 3.4.5 7.3.9 12.5c.3 5.3.6 12.5 1 19.1c.3 6.6.9 15.7 1.1 20.3c.3 4.7.5 5.5.4 7.8c-.1 2.3 1.2 4.7-.9 6.1c-2.1 1.4-9.1 2.7-11.9 2.4c-2.7-.3-3.7-2.8-4.5-4.3zM70.7 107.9c-.8-1.6 0-2 0-4.8c.1-2.9.1-6.2.2-12.2c.1-6.1.4-17.1.5-24c.2-6.9.4-12.6.5-17.6c.2-4.9.5-8.8.7-12c.1-3.1.1-4.6.3-6.8c.2-2.1-.3-4.2.7-6.1c.9-2 3.1-4.8 5.2-5.4c2-.7 5.3 0 7 1.4c1.7 1.4 2.5 5 3 7.1c.5 2 0 2.9 0 5.2c0 2.3 0 4.8 0 8.5c0 3.6.2 7.8.3 13.5c0 5.6-.1 13.4 0 20.4c0 7.1.1 16.9.1 21.8c0 5 .1 5.6-.1 8c-.2 2.3 1 4.6-1.3 6c-2.3 1.3-9.7 2.4-12.6 1.9c-2.8-.5-3.8-3.2-4.5-4.9zM89.1 112.1c-.7-1.7.1-2.3.3-5.1c.2-2.8.3-5.9.7-11.5c.4-5.5 1.2-15.3 1.7-21.5c.5-6.2.9-11.4 1.3-15.9c.5-4.4.9-8 1.2-10.8c.3-2.7.4-3.9.6-5.8c.3-1.9-.1-3.7.9-5.4c1.1-1.8 3.4-4.5 5.4-5c2-.6 5.2.2 6.8 1.7c1.5 1.5 2.2 5.2 2.6 7.1c.4 1.9-.1 2.4-.2 4.3c-.1 2-.3 4.2-.4 7.4c-.2 3.3-.2 7.1-.4 12.2c-.2 5.1-.6 12.1-.9 18.5c-.3 6.4-.7 15.2-.9 19.8c-.3 4.5-.2 5.4-.5 7.7c-.4 2.3.7 4.8-1.6 6c-2.3 1.2-9.6 1.9-12.4 1.3c-2.8-.7-3.6-3.3-4.2-5zM43.2 206.6c-6-11.8-10.3-48.6-7.2-67c3.2-18.3 13.9-37.4 26.1-43.1c12.3-5.7 38.9-4 47.5 8.7c8.5 12.8 10.2 50.4 3.9 67.9c-6.4 17.5-30.2 31.6-41.9 37.2c-11.7 5.6-22.5 8.1-28.4-3.7zM83.3 168.7c3.3-3.6 13.3-11.8 18.5-17.2c5.2-5.4 9.3-10 12.7-15.3c3.4-5.3 5.8-12 7.7-16.5c1.8-4.5 2.7-7.3 3.6-10.4c.8-3.2.4-5.7 1.6-8.5c1.2-2.8 2.9-7 5.4-8.5c2.4-1.4 6.8-1.6 9.3-.3c2.4 1.3 4.6 5.2 5.5 8c.9 2.8.2 5.4-.2 9.1c-.4 3.6-.6 7.6-2 12.8c-1.4 5.3-3.2 11.8-6.3 18.5c-3.2 6.7-7.8 14.7-12.6 21.7c-4.9 7-11.1 15.9-16.5 20.4c-5.4 4.5-11.2 8.3-15.9 6.7c-4.7-1.5-10.6-12.5-12.4-15.9c-1.8-3.4-1.8-.9 1.6-4.6z" opacity=".07" stroke-width="9"/><path d="M43.3 180.6l-.9 18.6l-.7 22.3l59.9 0l-.8-22.3l-.9-18.6zM35.7 225.2c-12.8 10.5-3.2 31-5 63.2c-1.8 32.3-3.9 83.7-5.6 130.2c-1.7 46.5-3.6 98.6-4.6 148.8c-1.1 50.3-19.3 127.1-1.9 152.6c17.4 25.4 88.7 25.4 106 0c17.4-25.5-.8-102.3-1.8-152.6c-1.1-50.2-3-102.3-4.7-148.8c-1.7-46.5-3.8-97.9-5.6-130.2c-1.7-32.2 7.8-52.7-5-63.2c-12.8-10.5-59-10.5-71.8 0zM34.2 212.2c3.2-2.7 12.5-3.9 18.7-4.9c6.2-.9 12.5-1.1 18.7-1.1c6.2 0 12.5.2 18.7 1.1c6.2 1 15.5 2.2 18.7 4.9c3.2 2.7.6 7.3.6 11.1c0 3.9 2.6 10.8-.6 12.1c-3.2 1.3-12.5-3.3-18.7-4.2c-6.2-.9-12.5-1.2-18.7-1.2c-6.2 0-12.5.3-18.7 1.2c-6.2.9-15.5 5.5-18.7 4.2c-3.2-1.3-.5-8.2-.5-12.1c0-3.8-2.7-8.4.5-11.1zM39.1 123.6c-.8-1.5-.3-2.9-.6-5.5c-.3-2.6-.6-5.5-1-10.1c-.4-4.5-1.1-12.3-1.5-17.3c-.5-5.1-.9-9.3-1.1-12.9c-.3-3.6-.4-6.5-.5-8.7c-.2-2.2-.3-3-.3-4.5c-.1-1.5-.6-2.9 0-4.4c.7-1.6 2.2-4.3 3.9-5.1c1.6-.7 4.4-.5 6 .6c1.5 1 2.6 4.1 3.2 5.6c.6 1.5.2 1.7.4 3.2c.2 1.5.3 3.2.7 5.8c.3 2.6.8 5.7 1.3 9.8c.5 4.1 1.1 9.7 1.7 14.8c.6 5.2 1.5 12.1 1.9 16c.5 3.9.7 5.2.8 7.5c.1 2.2 1.4 4.6-.4 6c-1.8 1.5-7.9 2.9-10.3 2.8c-2.4-.1-3.4-2-4.2-3.6zM53.9 112.9c-.8-1.6-.1-2.3-.2-5.1c-.1-2.8-.3-6-.5-11.7c-.2-5.6-.5-15.8-.6-22.3c-.2-6.4-.4-11.8-.4-16.4c-.1-4.6 0-8.3 0-11.2c0-2.9-.1-4.3-.1-6.3c.1-2-.5-3.9.4-5.7c.8-1.9 2.7-4.7 4.6-5.4c1.9-.8 5.1-.3 6.8 1c1.7 1.3 2.7 4.7 3.2 6.6c.6 1.9.2 2.7.3 4.8c.1 2.1.2 4.4.4 7.8c.2 3.4.5 7.3.9 12.5c.3 5.3.6 12.5 1 19.1c.3 6.6.9 15.7 1.1 20.3c.3 4.7.5 5.5.4 7.8c-.1 2.3 1.2 4.7-.9 6.1c-2.1 1.4-9.1 2.7-11.9 2.4c-2.7-.3-3.7-2.8-4.5-4.3zM70.7 107.9c-.8-1.6 0-2 0-4.8c.1-2.9.1-6.2.2-12.2c.1-6.1.4-17.1.5-24c.2-6.9.4-12.6.5-17.6c.2-4.9.5-8.8.7-12c.1-3.1.1-4.6.3-6.8c.2-2.1-.3-4.2.7-6.1c.9-2 3.1-4.8 5.2-5.4c2-.7 5.3 0 7 1.4c1.7 1.4 2.5 5 3 7.1c.5 2 0 2.9 0 5.2c0 2.3 0 4.8 0 8.5c0 3.6.2 7.8.3 13.5c0 5.6-.1 13.4 0 20.4c0 7.1.1 16.9.1 21.8c0 5 .1 5.6-.1 8c-.2 2.3 1 4.6-1.3 6c-2.3 1.3-9.7 2.4-12.6 1.9c-2.8-.5-3.8-3.2-4.5-4.9zM89.1 112.1c-.7-1.7.1-2.3.3-5.1c.2-2.8.3-5.9.7-11.5c.4-5.5 1.2-15.3 1.7-21.5c.5-6.2.9-11.4 1.3-15.9c.5-4.4.9-8 1.2-10.8c.3-2.7.4-3.9.6-5.8c.3-1.9-.1-3.7.9-5.4c1.1-1.8 3.4-4.5 5.4-5c2-.6 5.2.2 6.8 1.7c1.5 1.5 2.2 5.2 2.6 7.1c.4 1.9-.1 2.4-.2 4.3c-.1 2-.3 4.2-.4 7.4c-.2 3.3-.2 7.1-.4 12.2c-.2 5.1-.6 12.1-.9 18.5c-.3 6.4-.7 15.2-.9 19.8c-.3 4.5-.2 5.4-.5 7.7c-.4 2.3.7 4.8-1.6 6c-2.3 1.2-9.6 1.9-12.4 1.3c-2.8-.7-3.6-3.3-4.2-5zM43.2 206.6c-6-11.8-10.3-48.6-7.2-67c3.2-18.3 13.9-37.4 26.1-43.1c12.3-5.7 38.9-4 47.5 8.7c8.5 12.8 10.2 50.4 3.9 67.9c-6.4 17.5-30.2 31.6-41.9 37.2c-11.7 5.6-22.5 8.1-28.4-3.7zM83.3 168.7c3.3-3.6 13.3-11.8 18.5-17.2c5.2-5.4 9.3-10 12.7-15.3c3.4-5.3 5.8-12 7.7-16.5c1.8-4.5 2.7-7.3 3.6-10.4c.8-3.2.4-5.7 1.6-8.5c1.2-2.8 2.9-7 5.4-8.5c2.4-1.4 6.8-1.6 9.3-.3c2.4 1.3 4.6 5.2 5.5 8c.9 2.8.2 5.4-.2 9.1c-.4 3.6-.6 7.6-2 12.8c-1.4 5.3-3.2 11.8-6.3 18.5c-3.2 6.7-7.8 14.7-12.6 21.7c-4.9 7-11.1 15.9-16.5 20.4c-5.4 4.5-11.2 8.3-15.9 6.7c-4.7-1.5-10.6-12.5-12.4-15.9c-1.8-3.4-1.8-.9 1.6-4.6z" opacity=".11" stroke-width="3"/></g><g class="wh-hand" stroke-linejoin="round"><path d="M28.5 167.5l-1 18.6l-.7 22.4l59.9 0l-.8-22.4l-.9-18.6zM24.2 110.6c-.2-.7-.1-1.3-.2-1.9c-.1-.7-.1-1.2-.2-1.8c0-.6-.1-1.1-.2-1.8c0-.7-.1-1.4-.2-2.3c-.1-1-.2-2-.4-3.3c-.1-1.3-.2-2.8-.4-4.5c-.1-1.7-.3-3.6-.5-5.6c-.2-1.9-.3-4-.5-5.9c-.2-2-.3-4-.5-5.8c-.2-1.8-.3-3.5-.5-5c-.1-1.5-.3-2.8-.4-4.2c-.1-1.3-.1-2.5-.2-3.7c-.1-1.2-.1-2.3-.2-3.3c0-1.1-.1-2-.1-2.9c-.1-.9-.2-1.8-.2-2.6c-.1-.7-.1-1.4-.2-1.9c0-.6 0-1-.1-1.4c0-.5 0-.8 0-1.1c0-.4 0-.7 0-1c0-.4-.1-.6-.1-1.2c0-.5 0-1.5.1-2.3c.2-.7.4-1.4.8-2.1c.3-.6.8-1.2 1.3-1.7c.5-.5 1.1-.9 1.8-1.2c.6-.3 1.3-.5 2-.5c.7-.1 1.4 0 2.1.2c.6.1 1.3.4 1.9.8c.6.4 1.1 1 1.6 1.5c.4.6.8 1.3 1.1 2c.3.7.4 1.6.5 2.2c.1.6.1.8.1 1.1c.1.4.1.7.2 1c0 .4.1.7.1 1.1c.1.4.1.8.2 1.3c.1.6.1 1.2.2 2c.1.7.2 1.6.3 2.5c.1.9.2 1.8.4 2.9c.1 1 .3 2.1.4 3.2c.2 1.2.3 2.4.5 3.7c.1 1.3.3 2.6.4 4.1c.2 1.5.4 3.2.6 4.9c.2 1.8.4 3.8.7 5.8c.2 1.9.5 4 .7 6c.3 1.9.5 3.8.7 5.5c.2 1.7.4 3.2.5 4.5c.2 1.3.3 2.3.4 3.2c.1 1 .1 1.7.2 2.4c.1.7.1 1.2.2 1.8c.1.6.1 1.1.2 1.8c.1.6.3 1.2.2 1.9c-.1.7-.2 1.7-.8 2.4c-.6.8-1.5 1.5-2.6 2c-1.1.5-2.5.9-3.8 1c-1.2.1-2.7.1-3.8-.2c-1.2-.3-2.3-.8-3-1.4c-.7-.6-1-1.5-1.3-2.2zM39 99.8c-.2-.7 0-1.3-.1-1.8c0-.6 0-1 0-1.5c-.1-.5-.1-1-.1-1.7c0-.7-.1-1.4-.1-2.4c-.1-1-.1-2.2-.2-3.7c0-1.6-.1-3.5-.2-5.6c0-2.1-.1-4.6-.2-7.1c-.1-2.4-.1-5.2-.2-7.7c-.1-2.5-.1-5.2-.2-7.5c-.1-2.3-.2-4.4-.2-6.4c-.1-1.9-.2-3.6-.2-5.3c0-1.6 0-3.2 0-4.7c0-1.5 0-2.9 0-4.2c0-1.3 0-2.6 0-3.7c0-1.2 0-2.3 0-3.3c0-1-.1-1.9-.1-2.7c0-.7 0-1.4 0-2c0-.6.1-1.1.1-1.6c0-.5 0-1 0-1.5c0-.5-.1-1 0-1.7c0-.7.1-1.7.3-2.5c.2-.8.5-1.7 1-2.4c.4-.7 1-1.3 1.6-1.8c.6-.5 1.3-1 2.1-1.2c.7-.3 1.5-.5 2.3-.5c.7 0 1.5.1 2.3.3c.7.3 1.5.7 2.1 1.2c.6.4 1.2 1.1 1.7 1.7c.5.7.9 1.5 1.1 2.3c.3.8.4 1.9.5 2.6c0 .7 0 1.1 0 1.7c0 .5.1 1 .1 1.5c0 .5.1 1 .1 1.5c0 .6.1 1.2.1 2c.1.7.1 1.6.1 2.6c.1 1 .1 2.1.2 3.3c.1 1.1.2 2.3.3 3.7c0 1.3.2 2.7.3 4.1c.1 1.5.2 3.1.3 4.7c.1 1.7.1 3.3.2 5.2c.1 2 .2 4.1.3 6.4c.2 2.3.3 4.9.5 7.5c.1 2.5.3 5.2.4 7.7c.2 2.4.4 4.9.5 7c.1 2.2.2 4.1.3 5.6c0 1.6.1 2.7.1 3.7c.1 1.1.1 1.8.1 2.5c.1.6.1 1.1.1 1.6c0 .6 0 1 .1 1.5c0 .6.2 1.1 0 1.9c-.1.7-.3 1.9-1 2.6c-.7.8-1.9 1.6-3.1 2.1c-1.3.5-2.9.8-4.3.9c-1.5.1-3.2-.1-4.4-.5c-1.3-.4-2.5-1.1-3.3-1.8c-.8-.7-1.1-1.8-1.3-2.6zM55.8 94.9c-.2-.7 0-1.3 0-1.8c0-.5 0-.9 0-1.4c0-.5 0-1 0-1.6c0-.7.1-1.4.1-2.5c0-1 0-2.2 0-3.8c0-1.7.1-3.7.1-6c0-2.2.1-4.9.2-7.5c0-2.7.1-5.6.2-8.3c0-2.8.1-5.6.2-8.1c0-2.5 0-4.8.1-6.9c0-2.1.1-3.8.1-5.6c.1-1.8.2-3.5.3-5.1c0-1.6.1-3.1.2-4.5c.1-1.4.2-2.7.3-4c0-1.2.1-2.4.1-3.5c0-1.1.1-2 .1-2.9c0-.8.1-1.5.1-2.1c0-.7.1-1.2.1-1.8c.1-.6.1-1.1.1-1.6c.1-.6 0-1.1.1-1.9c.1-.7.2-1.8.5-2.6c.2-.9.7-1.7 1.2-2.4c.5-.7 1.1-1.4 1.8-1.9c.6-.5 1.4-.9 2.2-1.2c.8-.2 1.6-.3 2.4-.3c.8 0 1.7.2 2.4.5c.8.3 1.6.7 2.2 1.3c.6.5 1.2 1.2 1.7 1.9c.4.8.8 1.6 1 2.5c.3.8.3 1.9.4 2.7c0 .7-.1 1.2-.1 1.8c0 .6 0 1.1 0 1.7c0 .5.1 1.1.1 1.7c0 .6 0 1.3 0 2.1c0 .8-.1 1.8-.1 2.9c0 1 0 2.2 0 3.5c0 1.2.1 2.5.1 3.9c0 1.4.1 2.9.1 4.5c0 1.6.1 3.3.1 5c0 1.8 0 3.6 0 5.6c0 2.1-.1 4.4-.1 6.9c0 2.4.1 5.3.1 8c0 2.7 0 5.7 0 8.3c.1 2.6.1 5.3.1 7.6c0 2.2 0 4.3 0 5.9c0 1.7 0 2.8 0 3.9c0 1 0 1.8-.1 2.4c0 .7 0 1.1 0 1.6c0 .6 0 .9 0 1.5c0 .5.2 1 0 1.8c-.2.7-.5 1.9-1.3 2.7c-.7.8-2 1.6-3.3 2c-1.4.5-3.1.7-4.6.7c-1.6 0-3.3-.3-4.6-.8c-1.4-.4-2.6-1.2-3.4-2c-.7-.8-1-2-1.2-2.8zM74.2 99.1c-.1-.8.1-1.3.1-1.9c.1-.6.1-1 .1-1.5c.1-.6.1-1 .1-1.7c.1-.7.1-1.4.2-2.4c0-1 .1-2.1.2-3.7c.1-1.5.2-3.3.4-5.4c.1-2 .3-4.4.5-6.8c.2-2.4.4-5 .6-7.5c.2-2.4.4-5 .5-7.2c.2-2.3.3-4.3.5-6.2c.1-1.9.2-3.5.4-5.1c.1-1.6.3-3.2.5-4.6c.1-1.4.3-2.8.4-4.1c.2-1.3.3-2.4.5-3.6c.1-1.1.2-2.2.3-3.1c0-.9.1-1.8.2-2.5c0-.7.1-1.3.2-1.8c0-.6.1-1 .1-1.5c.1-.5.2-.9.2-1.3c.1-.5 0-.9.2-1.6c.1-.6.2-1.7.5-2.5c.4-.8.8-1.6 1.3-2.3c.5-.7 1.2-1.3 1.9-1.7c.7-.5 1.4-.8 2.2-1.1c.8-.2 1.6-.2 2.4-.2c.8.1 1.6.3 2.3.6c.8.4 1.5.8 2.1 1.4c.6.6 1.1 1.3 1.5 2c.4.7.7 1.6.9 2.4c.2.9.2 2 .2 2.7c0 .7-.1 1-.1 1.5c0 .5-.1.9-.1 1.4c0 .4 0 .9 0 1.4c0 .5-.1 1.1-.1 1.8c0 .7-.1 1.5-.2 2.5c0 .9-.1 2-.1 3.1c-.1 1.1-.1 2.3-.1 3.6c-.1 1.3-.1 2.6-.1 4.1c-.1 1.4-.1 2.9-.2 4.5c0 1.6-.1 3.2-.2 5.1c-.1 1.9-.3 3.9-.4 6.1c-.1 2.3-.2 4.8-.3 7.3c-.1 2.4-.2 5.1-.3 7.4c-.1 2.4-.2 4.9-.3 6.9c-.1 2.1-.2 3.9-.3 5.4c-.1 1.6-.2 2.7-.2 3.7c-.1 1-.1 1.7-.2 2.4c0 .7-.1 1.1-.1 1.7c0 .5-.1.9-.1 1.5c0 .6.1 1.1-.1 1.9c-.2.7-.6 1.9-1.4 2.6c-.8.7-2.1 1.4-3.4 1.8c-1.3.4-3 .5-4.5.4c-1.5-.1-3.2-.4-4.5-1c-1.2-.5-2.4-1.3-3.2-2.1c-.7-.9-.8-2-1-2.8zM28.3 193.6c-5-3.7-.6-11.2-1.5-18.6c-.9-7.5-2.8-18-3.7-26.1c-1-8-1.8-14.5-1.9-22.3c-.2-7.7-.5-18.7 1-24.2c1.6-5.4 4.3-5.2 8.5-8.3c4.2-3.2 10.8-8.1 16.5-10.6c5.8-2.5 11.8-4.5 17.9-4.5c6.1 0 13.9 2.5 18.8 4.7c4.9 2.2 8.7 3.2 10.8 8.5c2.1 5.3 1.3 15.7 1.8 23.3c.5 7.6.8 14.8 1.2 22.3c.3 7.4 1.8 15.5.9 22.3c-.9 6.8-4.3 13-6.5 18.6c-2.3 5.6-1 11.8-6.9 14.9c-5.9 3.1-19 3.7-28.5 3.7c-9.5 0-23.4 0-28.4-3.7zM68.4 155.7c1.3-1.7 3.9-4.1 6-6c2.1-2 4.3-3.9 6.4-5.8c2.1-1.9 4.2-3.6 6.2-5.4c1.9-1.8 3.7-3.5 5.3-5.2c1.6-1.7 2.9-3.3 4.1-5c1.2-1.7 2.2-3.3 3.2-5.1c1-1.8 2-3.6 2.9-5.5c.9-1.8 1.8-3.7 2.6-5.6c.8-1.8 1.5-3.7 2.2-5.4c.6-1.7 1.2-3.4 1.7-4.8c.5-1.3.9-2.4 1.2-3.3c.3-1 .5-1.6.7-2.3c.2-.8.4-1.5.6-2.3c.1-.9.3-1.9.5-3c.2-1 .3-2.1.5-3.2c.3-1.1.5-2.4 1-3.4c.5-1.1 1.1-2.1 1.8-2.9c.8-.9 1.7-1.6 2.6-2.2c.9-.5 2-1 3-1.2c1.1-.2 2.2-.2 3.2-.1c1.1.1 2.1.5 3.1 1c.9.5 1.8 1.1 2.6 1.9c.8.8 1.4 1.8 1.9 2.8c.5 1 .9 2.1 1 3.3c.2 1.1.1 2.4.1 3.5c-.1 1-.3 1.9-.3 2.8c0 .9 0 1.7 0 2.7c0 1.1.1 2.3 0 3.6c-.2 1.4-.3 2.9-.6 4.5c-.4 1.5-.9 3.1-1.4 4.8c-.5 1.7-1.1 3.5-1.7 5.4c-.7 1.9-1.3 4-2.1 6.2c-.7 2.2-1.5 4.6-2.5 6.9c-1 2.4-2 4.9-3.3 7.3c-1.2 2.5-2.7 4.9-4.3 7.3c-1.5 2.4-3.3 4.8-5 7.1c-1.8 2.4-3.6 4.7-5.4 7c-1.9 2.3-3.7 4.7-5.6 6.9c-1.8 2.2-3.6 4.3-5.5 6.5c-1.8 2.1-3.8 4.8-5.4 6.1c-1.6 1.4-2.7 1.8-4.4 1.9c-1.8.1-4.1-.4-6.1-1.3c-2-.9-4.4-2.5-6.1-4.1c-1.8-1.7-3.5-3.9-4.6-5.9c-1-1.9-1.6-4.2-1.7-5.9c0-1.8.3-2.8 1.6-4.6z" fill="none" stroke="#55301a" stroke-width="3.2"/><path d="M20.8 212.2c-12.8 10.5-3.2 31-5 63.2c-1.8 32.3-3.9 83.7-5.6 130.2c-1.7 46.5-3.5 98.6-4.6 148.8c-1.1 50.2-19.2 127.1-1.9 152.5c17.4 25.5 88.7 25.5 106 0c17.4-25.4-.7-102.3-1.8-152.5c-1.1-50.2-3-102.3-4.7-148.8c-1.7-46.5-3.8-97.9-5.5-130.2c-1.8-32.2 7.7-52.7-5.1-63.2c-12.8-10.6-59-10.6-71.8 0zM19.3 199.2c3.3-2.7 12.5-3.9 18.7-4.9c6.3-1 12.5-1.1 18.7-1.1c6.3 0 12.5.1 18.7 1.1c6.3 1 15.5 2.2 18.7 4.9c3.2 2.6.6 7.3.6 11.1c0 3.9 2.6 10.8-.6 12.1c-3.2 1.3-12.4-3.4-18.7-4.3c-6.2-.9-12.4-1.1-18.7-1.1c-6.2 0-12.4.2-18.7 1.1c-6.2.9-15.4 5.6-18.7 4.3c-3.2-1.3-.5-8.2-.5-12.1c0-3.8-2.7-8.5.5-11.1z" fill="none" stroke="#435b75" stroke-width="3.2"/><path d="M28.5 167.5l-1 18.6l-.7 22.4l59.9 0l-.8-22.4l-.9-18.6z" fill="#c38865"/><path d="M85 167.5l.9 18.6l.8 22.4l-9.5 0l.2-22.4l.7-18.6z" fill="#ad7354"/><path d="M20.8 212.2c-12.8 10.5-3.2 31-5 63.2c-1.8 32.3-3.9 83.7-5.6 130.2c-1.7 46.5-3.5 98.6-4.6 148.8c-1.1 50.2-19.2 127.1-1.9 152.5c17.4 25.5 88.7 25.5 106 0c17.4-25.4-.7-102.3-1.8-152.5c-1.1-50.2-3-102.3-4.7-148.8c-1.7-46.5-3.8-97.9-5.5-130.2c-1.8-32.2 7.7-52.7-5.1-63.2c-12.8-10.6-59-10.6-71.8 0z" fill="#62809e"/><path d="M92.6 212.2c2.8 10.5 3.3 31 5.1 63.2c1.7 32.3 3.8 83.7 5.5 130.2c1.7 46.5 3.6 98.6 4.7 148.8c1.1 50.2 5.3 127.1 1.8 152.5c-3.4 25.5-18.2 25.5-22.3 0c-4-25.4-1.1-102.3-1.8-152.5c-.8-50.2-2.1-102.3-2.8-148.8c-.8-46.5-1.6-97.9-1.9-130.2c-.3-32.2-1.9-52.7 0-63.2c2-10.6 8.9-10.6 11.7 0z" fill="#536f8b"/><path d="M92.6 212.2c1.7 10.5 3.3 31 5.1 63.2c1.7 32.3 3.8 83.7 5.5 130.2c1.7 46.5 3.6 98.6 4.7 148.8c1.1 50.2 2.9 127.1 1.8 152.5c-1 25.5-6.5 25.5-8.1 0c-1.7-25.4-.8-102.3-1.9-152.5c-1.1-50.2-2.9-102.3-4.5-148.8c-1.5-46.5-3.6-97.9-4.8-130.2c-1.2-32.2-3-52.7-2.6-63.2c.4-10.6 3.2-10.6 4.8 0z" fill="#435b75" fill-opacity="0.6"/><path d="M23.1 238.2c-.7 12.4-2.4 40.3-3.8 74.4c-1.4 34.1-3.2 83.7-4.6 130.2c-1.4 46.5-3.1 124-3.7 148.8" fill="none" stroke="#7d99b4" stroke-width="2.4" stroke-linecap="round" stroke-opacity="0.5"/><path d="M21.9 232.6c2.9 1.3 12.3 6.4 17.2 7.9c4.8 1.4 10 .9 12.1 1.1" fill="none" stroke="#435b75" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.5"/><path d="M62.3 249.4c3-.8 12.3-2.8 17.7-4.7c5.4-1.8 12.4-5.4 14.9-6.5" fill="none" stroke="#435b75" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.55"/><path d="M19.3 269.8c3.6 1.1 16 5.8 21.6 6.6c5.6.7 10.1-1.6 12.1-1.9" fill="none" stroke="#435b75" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.35"/><path d="M60.5 294c4.1-1.1 18.8-4 25.1-6.5c6.2-2.5 10.2-7 12.2-8.4" fill="none" stroke="#435b75" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.4"/><path d="M15.8 338.7c3.3.9 14.3 4.9 19.5 5.5c5.3.7 10.1-1.5 12.1-1.8" fill="none" stroke="#435b75" stroke-width="1.2" stroke-linecap="round" stroke-opacity="0.25"/><path d="M19.3 199.2c3.3-2.7 12.5-3.9 18.7-4.9c6.3-1 12.5-1.1 18.7-1.1c6.3 0 12.5.1 18.7 1.1c6.3 1 15.5 2.2 18.7 4.9c3.2 2.6.6 7.3.6 11.1c0 3.9 2.6 10.8-.6 12.1c-3.2 1.3-12.4-3.4-18.7-4.3c-6.2-.9-12.4-1.1-18.7-1.1c-6.2 0-12.4.2-18.7 1.1c-6.2.9-15.4 5.6-18.7 4.3c-3.2-1.3-.5-8.2-.5-12.1c0-3.8-2.7-8.5.5-11.1z" fill="#5d7a98"/><path d="M77.3 194.7c2.4-1.7 13.9 1.9 16.8 4.5c2.9 2.6.6 7.3.6 11.1c0 3.9 2.3 10.7-.6 12.1c-2.9 1.4-14.4-1.5-16.8-3.7c-2.4-2.2 2.6-5.3 2.6-9.3c0-4-5-13-2.6-14.7z" fill="#536f8b"/><path d="M21.6 199.7c2.7-.6 10.6-3 16.4-3.9c5.9-.8 12.8-1.1 18.7-1.1c5.9 0 14 .9 16.9 1.1" fill="none" stroke="#89a4be" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.75"/><path d="M20.5 203.4c2.9-.7 11.5-3.3 17.5-4.2c6.1-.9 12.5-1.2 18.7-1.2c6.3 0 12.7.3 18.7 1.2c6.1.9 14.7 3.5 17.6 4.2" fill="none" stroke="#435b75" stroke-width=".7" stroke-dasharray="1.6 1.6" stroke-opacity="0.45"/><path d="M20.5 217.8c2.9-.7 11.5-3.3 17.5-4.1c6.1-.9 12.5-1.1 18.7-1.1c6.3 0 12.7.2 18.7 1.1c6.1.8 14.7 3.4 17.6 4.1" fill="none" stroke="#435b75" stroke-width=".7" stroke-dasharray="1.6 1.6" stroke-opacity="0.35"/><path d="M19.3 199.2c3.3-2.7 12.5-3.9 18.7-4.9c6.3-1 12.5-1.1 18.7-1.1c6.3 0 12.5.1 18.7 1.1c6.3 1 15.5 2.2 18.7 4.9c3.2 2.6.6 7.3.6 11.1c0 3.9 2.6 10.8-.6 12.1c-3.2 1.3-12.4-3.4-18.7-4.3c-6.2-.9-12.4-1.1-18.7-1.1c-6.2 0-12.4.2-18.7 1.1c-6.2.9-15.4 5.6-18.7 4.3c-3.2-1.3-.5-8.2-.5-12.1c0-3.8-2.7-8.5.5-11.1z" fill="none" stroke="#435b75" stroke-width="1"/><path d="M90.2 208.5c0 .6-.2 1.3-.5 1.8c-.3.5-.9.9-1.4 1.1c-.5.2-1.2.2-1.7 0c-.6-.2-1.1-.6-1.4-1.1c-.4-.5-.6-1.2-.6-1.8c0-.6.2-1.4.6-1.8c.3-.5.8-1 1.4-1.2c.5-.1 1.2-.1 1.7 0c.5.2 1.1.7 1.4 1.2c.3.4.5 1.2.5 1.8z" fill="#ece8df" stroke="#435b75" stroke-width=".5"/><path d="M28.5 186.1c2.3-.8 9.1 2.8 13.8 3.4c4.7.6 9.6.4 14.4.4c4.8 0 9.7.2 14.4-.4c4.8-.6 11.6-4.2 13.9-3.4c2.3.9 4.9 6.9.2 8.2c-4.7 1.3-19-.3-28.5-.3c-9.5 0-23.7 1.6-28.4.3c-4.7-1.3-2.2-7.3.2-8.2z" fill="#975f42" fill-opacity="0.5"/><path d="M24.2 110.6c-.2-.7-.1-1.3-.2-1.9c-.1-.7-.1-1.2-.2-1.8c0-.6-.1-1.1-.2-1.8c0-.7-.1-1.4-.2-2.3c-.1-1-.2-2-.4-3.3c-.1-1.3-.2-2.8-.4-4.5c-.1-1.7-.3-3.6-.5-5.6c-.2-1.9-.3-4-.5-5.9c-.2-2-.3-4-.5-5.8c-.2-1.8-.3-3.5-.5-5c-.1-1.5-.3-2.8-.4-4.2c-.1-1.3-.1-2.5-.2-3.7c-.1-1.2-.1-2.3-.2-3.3c0-1.1-.1-2-.1-2.9c-.1-.9-.2-1.8-.2-2.6c-.1-.7-.1-1.4-.2-1.9c0-.6 0-1-.1-1.4c0-.5 0-.8 0-1.1c0-.4 0-.7 0-1c0-.4-.1-.6-.1-1.2c0-.5 0-1.5.1-2.3c.2-.7.4-1.4.8-2.1c.3-.6.8-1.2 1.3-1.7c.5-.5 1.1-.9 1.8-1.2c.6-.3 1.3-.5 2-.5c.7-.1 1.4 0 2.1.2c.6.1 1.3.4 1.9.8c.6.4 1.1 1 1.6 1.5c.4.6.8 1.3 1.1 2c.3.7.4 1.6.5 2.2c.1.6.1.8.1 1.1c.1.4.1.7.2 1c0 .4.1.7.1 1.1c.1.4.1.8.2 1.3c.1.6.1 1.2.2 2c.1.7.2 1.6.3 2.5c.1.9.2 1.8.4 2.9c.1 1 .3 2.1.4 3.2c.2 1.2.3 2.4.5 3.7c.1 1.3.3 2.6.4 4.1c.2 1.5.4 3.2.6 4.9c.2 1.8.4 3.8.7 5.8c.2 1.9.5 4 .7 6c.3 1.9.5 3.8.7 5.5c.2 1.7.4 3.2.5 4.5c.2 1.3.3 2.3.4 3.2c.1 1 .1 1.7.2 2.4c.1.7.1 1.2.2 1.8c.1.6.1 1.1.2 1.8c.1.6.3 1.2.2 1.9c-.1.7-.2 1.7-.8 2.4c-.6.8-1.5 1.5-2.6 2c-1.1.5-2.5.9-3.8 1c-1.2.1-2.7.1-3.8-.2c-1.2-.3-2.3-.8-3-1.4c-.7-.6-1-1.5-1.3-2.2z" fill="#c38865"/><path d="M38.7 101.1c-.1-.5-.2-1.9-.4-3.2c-.1-1.3-.3-2.8-.5-4.5c-.2-1.7-.4-3.6-.7-5.5c-.2-2-.5-4.1-.7-6c-.3-2-.5-4-.7-5.8c-.2-1.7-.4-3.4-.6-4.9c-.1-1.5-.3-2.8-.4-4.1c-.2-1.3-.3-2.5-.5-3.7c-.1-1.1-.3-2.2-.4-3.2c-.2-1.1-.3-2-.4-2.9c-.1-.9-.2-1.8-.3-2.5c-.1-.8-.1-1.4-.2-2c-.1-.5-.1-.9-.2-1.3c0-.4-.1-.7-.1-1.1c-.1-.3-.1-.6-.2-1c0-.3-.1-.9-.1-1.1c0-.2.1-.2 0 0c0 .2 0 .8-.3 1.2c-.3.4-.9.7-1.3 1.1c-.4.4-1 .7-1.3 1.2c-.3.4-.3.8-.3 1.4c0 .6.1 1.2.2 1.9c.1.8.1 1.6.2 2.5c.1.9.2 1.9.4 2.9c.1 1.1.2 2.2.3 3.3c.2 1.2.3 2.4.4 3.7c.2 1.3.3 2.6.5 4.1c.1 1.5.3 3.2.5 5c.2 1.7.4 3.8.6 5.7c.3 2 .4 4.1.7 6c.3 1.9.5 3.9 1.1 5.5c.6 1.6 2 3.1 2.8 4.3c.8 1.2 1.6 2.5 1.9 3c.3.6 0 .6 0 0z" fill="#ad7354"/><path d="M26.1 41.7c.2 0 .8.1 1.2.2c.4.1.8.3 1.1.4c.4.2.7.4 1 .7c.4.2.7.5.9.8c.3.3.6.6.8 1c.2.3.4.7.6 1.1c.2.3.3.7.4 1.1c.1.5.2 1.1.2 1.3c.1.2.2.2 0 0c-.1-.2-.7-.7-1-1c-.3-.3-.5-.6-.7-.9c-.3-.2-.5-.5-.7-.7c-.2-.2-.5-.5-.7-.7c-.2-.2-.4-.4-.6-.7c-.2-.2-.5-.5-.7-.7c-.2-.3-.5-.5-.8-.8c-.3-.3-.8-.9-1-1.1c-.1-.2-.2 0 0 0z" fill="#ad7354"/><path d="M27.8 50.8c0 .9 0 2-.2 2.8c-.2.7-.6 1.5-1.1 2c-.4.5-1 .8-1.5.9c-.5 0-1.2-.2-1.7-.6c-.5-.4-1-1.1-1.3-1.9c-.3-.7-.6-1.7-.7-2.6c0-.9 0-1.9.2-2.7c.3-.8.6-1.6 1.1-2.1c.4-.5 1-.8 1.5-.8c.5-.1 1.2.1 1.7.5c.5.5 1 1.2 1.3 1.9c.3.8.6 1.8.7 2.6z" fill="#d39e7d" fill-opacity="0.6"/><path d="M29.1 63.9c.1 1 0 2.1-.2 2.9c-.2.9-.6 1.7-1 2.2c-.5.5-1.1.9-1.7.9c-.5.1-1.2-.1-1.8-.6c-.5-.4-1-1.1-1.4-1.9c-.4-.8-.6-1.9-.7-2.8c-.1-1-.1-2.1.2-2.9c.2-.9.6-1.7 1-2.2c.4-.5 1.1-.9 1.6-.9c.6-.1 1.3.1 1.8.6c.6.4 1.1 1.1 1.5 1.9c.3.8.6 1.9.7 2.8z" fill="#d39e7d" fill-opacity="0.35"/><path d="M24.2 110.6c0-.3-.1-1.3-.2-1.9c-.1-.7-.1-1.2-.2-1.8c0-.6-.1-1.1-.2-1.8c0-.7-.1-1.4-.2-2.3c-.1-1-.2-2-.4-3.3c-.1-1.3-.2-2.8-.4-4.5c-.1-1.7-.3-3.6-.5-5.6c-.2-1.9-.3-4-.5-5.9c-.2-2-.3-4-.5-5.8c-.2-1.8-.3-3.5-.5-5c-.1-1.5-.3-2.8-.4-4.2c-.1-1.3-.1-2.5-.2-3.7c-.1-1.2-.1-2.3-.2-3.3c0-1.1-.1-2-.1-2.9c-.1-.9-.2-1.8-.2-2.6c-.1-.7-.1-1.4-.2-1.9c0-.6 0-1-.1-1.4c0-.5 0-.8 0-1.1c0-.4 0-.7 0-1c0-.4-.1-.6-.1-1.2c0-.5 0-1.5.1-2.3c.2-.7.4-1.4.8-2.1c.3-.6.8-1.2 1.3-1.7c.5-.5 1.1-.9 1.8-1.2c.6-.3 1.3-.5 2-.5c.7-.1 1.4 0 2.1.2c.6.1 1.3.4 1.9.8c.6.4 1.1 1 1.6 1.5c.4.6.8 1.3 1.1 2c.3.7.4 1.6.5 2.2c.1.6.1.8.1 1.1c.1.4.1.7.2 1c0 .4.1.7.1 1.1c.1.4.1.8.2 1.3c.1.6.1 1.2.2 2c.1.7.2 1.6.3 2.5c.1.9.2 1.8.4 2.9c.1 1 .3 2.1.4 3.2c.2 1.2.3 2.4.5 3.7c.1 1.3.3 2.6.4 4.1c.2 1.5.4 3.2.6 4.9c.2 1.8.4 3.8.7 5.8c.2 1.9.5 4 .7 6c.3 1.9.5 3.8.7 5.5c.2 1.7.4 3.2.5 4.5c.2 1.3.3 2.3.4 3.2c.1 1 .1 1.7.2 2.4c.1.7.1 1.2.2 1.8c.1.6.1 1.1.2 1.8c.1.6.2 1.6.2 1.9" fill="none" stroke="#55301a" stroke-width="1"/><path d="M31.3 72c-.2-.1-.8-.3-1.2-.4c-.4-.1-.8-.1-1.2-.2c-.3 0-.7 0-1.1 0c-.3.1-.7.2-1.1.3c-.3.1-.7.2-1.1.4c-.3.1-.8.5-1 .6" fill="none" stroke="#87533a" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.5"/><path d="M30.6 69.4c-.2 0-.7-.2-1.1-.3c-.3 0-.6-.1-.9-.1c-.4 0-.7 0-1 0c-.3 0-.7.1-1 .2c-.3.1-.6.2-.9.3c-.3.2-.8.4-1 .5" fill="none" stroke="#87533a" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.35"/><path d="M29 55.2c-.1-.1-.6-.3-.9-.3c-.3-.1-.7-.2-1-.2c-.3 0-.6 0-.9 0c-.3.1-.6.1-.9.2c-.3.1-.6.2-.9.3c-.3.1-.7.4-.8.5" fill="none" stroke="#87533a" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M39 99.8c-.2-.7 0-1.3-.1-1.8c0-.6 0-1 0-1.5c-.1-.5-.1-1-.1-1.7c0-.7-.1-1.4-.1-2.4c-.1-1-.1-2.2-.2-3.7c0-1.6-.1-3.5-.2-5.6c0-2.1-.1-4.6-.2-7.1c-.1-2.4-.1-5.2-.2-7.7c-.1-2.5-.1-5.2-.2-7.5c-.1-2.3-.2-4.4-.2-6.4c-.1-1.9-.2-3.6-.2-5.3c0-1.6 0-3.2 0-4.7c0-1.5 0-2.9 0-4.2c0-1.3 0-2.6 0-3.7c0-1.2 0-2.3 0-3.3c0-1-.1-1.9-.1-2.7c0-.7 0-1.4 0-2c0-.6.1-1.1.1-1.6c0-.5 0-1 0-1.5c0-.5-.1-1 0-1.7c0-.7.1-1.7.3-2.5c.2-.8.5-1.7 1-2.4c.4-.7 1-1.3 1.6-1.8c.6-.5 1.3-1 2.1-1.2c.7-.3 1.5-.5 2.3-.5c.7 0 1.5.1 2.3.3c.7.3 1.5.7 2.1 1.2c.6.4 1.2 1.1 1.7 1.7c.5.7.9 1.5 1.1 2.3c.3.8.4 1.9.5 2.6c0 .7 0 1.1 0 1.7c0 .5.1 1 .1 1.5c0 .5.1 1 .1 1.5c0 .6.1 1.2.1 2c.1.7.1 1.6.1 2.6c.1 1 .1 2.1.2 3.3c.1 1.1.2 2.3.3 3.7c0 1.3.2 2.7.3 4.1c.1 1.5.2 3.1.3 4.7c.1 1.7.1 3.3.2 5.2c.1 2 .2 4.1.3 6.4c.2 2.3.3 4.9.5 7.5c.1 2.5.3 5.2.4 7.7c.2 2.4.4 4.9.5 7c.1 2.2.2 4.1.3 5.6c0 1.6.1 2.7.1 3.7c.1 1.1.1 1.8.1 2.5c.1.6.1 1.1.1 1.6c0 .6 0 1 .1 1.5c0 .6.2 1.1 0 1.9c-.1.7-.3 1.9-1 2.6c-.7.8-1.9 1.6-3.1 2.1c-1.3.5-2.9.8-4.3.9c-1.5.1-3.2-.1-4.4-.5c-1.3-.4-2.5-1.1-3.3-1.8c-.8-.7-1.1-1.8-1.3-2.6z" fill="#c38865"/><path d="M56.1 91.6c0-.6-.1-2.1-.1-3.7c-.1-1.5-.2-3.4-.3-5.6c-.1-2.1-.3-4.6-.5-7c-.1-2.5-.3-5.2-.4-7.7c-.2-2.6-.3-5.2-.5-7.5c-.1-2.3-.2-4.4-.3-6.4c-.1-1.9-.1-3.5-.2-5.2c-.1-1.6-.2-3.2-.3-4.7c-.1-1.4-.3-2.8-.3-4.1c-.1-1.4-.2-2.6-.3-3.7c-.1-1.2-.1-2.3-.2-3.3c0-1 0-1.9-.1-2.6c0-.8-.1-1.4-.1-2c0-.5-.1-1-.1-1.5c0-.5-.1-1-.1-1.5c0-.6 0-1.5 0-1.7c-.1-.3 0-.3 0 0c-.1.2-.1 1.1-.5 1.7c-.3.5-1 1-1.5 1.5c-.5.5-1.2 1-1.6 1.6c-.3.6-.3 1.2-.4 2c0 .8.1 1.7.1 2.6c0 1 .1 2.1.1 3.3c.1 1.2.2 2.4.2 3.7c.1 1.3.2 2.7.2 4.2c.1 1.5.2 3 .3 4.7c0 1.6.1 3.3.2 5.2c.1 2 .2 4.1.3 6.4c.1 2.3.2 4.9.4 7.5c.1 2.5.1 5.2.4 7.7c.2 2.4.2 5 .8 7c.7 2.1 2.1 4 2.9 5.5c.8 1.5 1.6 3 1.9 3.6c.3.6.1.7 0 0z" fill="#ad7354"/><path d="M45.7 15.5c.3.1.9.2 1.3.3c.5.2.9.4 1.3.6c.3.2.7.5 1.1.8c.3.3.6.6.9.9c.3.4.6.8.8 1.2c.3.4.5.8.6 1.3c.2.4.3.9.4 1.3c.1.5.1 1.2.2 1.5c0 .2.1.2 0 0c-.2-.2-.8-.9-1.1-1.3c-.3-.3-.5-.7-.8-1c-.2-.3-.5-.6-.7-.8c-.3-.3-.5-.6-.7-.9c-.2-.2-.4-.5-.7-.8c-.2-.3-.4-.6-.7-.9c-.3-.3-.5-.6-.8-.9c-.4-.4-.9-1.1-1.1-1.3c-.1-.2-.2 0 0 0z" fill="#ad7354"/><path d="M47 26.7c0 1-.2 2.1-.5 3c-.2.9-.7 1.8-1.2 2.3c-.6.5-1.2.8-1.8.8c-.6 0-1.3-.2-1.9-.7c-.5-.5-1-1.4-1.4-2.2c-.3-.9-.5-2-.5-3c0-1.1.1-2.2.4-3.1c.3-.9.8-1.7 1.3-2.2c.5-.5 1.2-.9 1.8-.9c.6 0 1.3.3 1.8.8c.6.5 1.1 1.3 1.4 2.2c.3.8.5 2 .6 3z" fill="#d39e7d" fill-opacity="0.6"/><path d="M47.6 44c.1 1.1-.1 2.3-.4 3.3c-.3.9-.8 1.8-1.3 2.4c-.5.6-1.3.9-1.9.9c-.7.1-1.4-.2-2-.8c-.6-.5-1.1-1.4-1.5-2.3c-.3-.9-.6-2.1-.6-3.2c-.1-1.1.1-2.3.4-3.2c.3-1 .8-1.9 1.3-2.5c.6-.5 1.3-.9 1.9-.9c.7 0 1.4.3 2 .8c.6.5 1.2 1.4 1.5 2.3c.4.9.6 2.2.6 3.2z" fill="#d39e7d" fill-opacity="0.35"/><path d="M39 99.8c0-.3 0-1.3-.1-1.8c0-.6 0-1 0-1.5c-.1-.5-.1-1-.1-1.7c0-.7-.1-1.4-.1-2.4c-.1-1-.1-2.2-.2-3.7c0-1.6-.1-3.5-.2-5.6c0-2.1-.1-4.6-.2-7.1c-.1-2.4-.1-5.2-.2-7.7c-.1-2.5-.1-5.2-.2-7.5c-.1-2.3-.2-4.4-.2-6.4c-.1-1.9-.2-3.6-.2-5.3c0-1.6 0-3.2 0-4.7c0-1.5 0-2.9 0-4.2c0-1.3 0-2.6 0-3.7c0-1.2 0-2.3 0-3.3c0-1-.1-1.9-.1-2.7c0-.7 0-1.4 0-2c0-.6.1-1.1.1-1.6c0-.5 0-1 0-1.5c0-.5-.1-1 0-1.7c0-.7.1-1.7.3-2.5c.2-.8.5-1.7 1-2.4c.4-.7 1-1.3 1.6-1.8c.6-.5 1.3-1 2.1-1.2c.7-.3 1.5-.5 2.3-.5c.7 0 1.5.1 2.3.3c.7.3 1.5.7 2.1 1.2c.6.4 1.2 1.1 1.7 1.7c.5.7.9 1.5 1.1 2.3c.3.8.4 1.9.5 2.6c0 .7 0 1.1 0 1.7c0 .5.1 1 .1 1.5c0 .5.1 1 .1 1.5c0 .6.1 1.2.1 2c.1.7.1 1.6.1 2.6c.1 1 .1 2.1.2 3.3c.1 1.1.2 2.3.3 3.7c0 1.3.2 2.7.3 4.1c.1 1.5.2 3.1.3 4.7c.1 1.7.1 3.3.2 5.2c.1 2 .2 4.1.3 6.4c.2 2.3.3 4.9.5 7.5c.1 2.5.3 5.2.4 7.7c.2 2.4.4 4.9.5 7c.1 2.2.2 4.1.3 5.6c0 1.6.1 2.7.1 3.7c.1 1.1.1 1.8.1 2.5c.1.6.1 1.1.1 1.6c0 .6 0 1 .1 1.5c0 .6 0 1.6 0 1.9" fill="none" stroke="#55301a" stroke-width="1"/><path d="M49.6 54.3c-.2-.1-.9-.4-1.3-.5c-.4-.1-.9-.2-1.3-.3c-.4 0-.9-.1-1.3 0c-.4 0-.8 0-1.2.1c-.5.1-.9.2-1.3.4c-.4.2-1 .5-1.2.6" fill="none" stroke="#87533a" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.5"/><path d="M49 51.7c-.2-.1-.8-.3-1.2-.4c-.3-.1-.7-.2-1.1-.2c-.3-.1-.7-.1-1.1-.1c-.3 0-.7.1-1.1.2c-.3 0-.7.1-1.1.3c-.3.1-.9.4-1.1.5" fill="none" stroke="#87533a" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.35"/><path d="M48.1 32.8c-.2 0-.7-.2-1-.4c-.4-.1-.7-.1-1.1-.2c-.3 0-.7 0-1 0c-.4 0-.7 0-1 .1c-.4.1-.7.2-1.1.3c-.3.1-.8.4-1 .4" fill="none" stroke="#87533a" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M55.8 94.9c-.2-.7 0-1.3 0-1.8c0-.5 0-.9 0-1.4c0-.5 0-1 0-1.6c0-.7.1-1.4.1-2.5c0-1 0-2.2 0-3.8c0-1.7.1-3.7.1-6c0-2.2.1-4.9.2-7.5c0-2.7.1-5.6.2-8.3c0-2.8.1-5.6.2-8.1c0-2.5 0-4.8.1-6.9c0-2.1.1-3.8.1-5.6c.1-1.8.2-3.5.3-5.1c0-1.6.1-3.1.2-4.5c.1-1.4.2-2.7.3-4c0-1.2.1-2.4.1-3.5c0-1.1.1-2 .1-2.9c0-.8.1-1.5.1-2.1c0-.7.1-1.2.1-1.8c.1-.6.1-1.1.1-1.6c.1-.6 0-1.1.1-1.9c.1-.7.2-1.8.5-2.6c.2-.9.7-1.7 1.2-2.4c.5-.7 1.1-1.4 1.8-1.9c.6-.5 1.4-.9 2.2-1.2c.8-.2 1.6-.3 2.4-.3c.8 0 1.7.2 2.4.5c.8.3 1.6.7 2.2 1.3c.6.5 1.2 1.2 1.7 1.9c.4.8.8 1.6 1 2.5c.3.8.3 1.9.4 2.7c0 .7-.1 1.2-.1 1.8c0 .6 0 1.1 0 1.7c0 .5.1 1.1.1 1.7c0 .6 0 1.3 0 2.1c0 .8-.1 1.8-.1 2.9c0 1 0 2.2 0 3.5c0 1.2.1 2.5.1 3.9c0 1.4.1 2.9.1 4.5c0 1.6.1 3.3.1 5c0 1.8 0 3.6 0 5.6c0 2.1-.1 4.4-.1 6.9c0 2.4.1 5.3.1 8c0 2.7 0 5.7 0 8.3c.1 2.6.1 5.3.1 7.6c0 2.2 0 4.3 0 5.9c0 1.7 0 2.8 0 3.9c0 1 0 1.8-.1 2.4c0 .7 0 1.1 0 1.6c0 .6 0 .9 0 1.5c0 .5.2 1 0 1.8c-.2.7-.5 1.9-1.3 2.7c-.7.8-2 1.6-3.3 2c-1.4.5-3.1.7-4.6.7c-1.6 0-3.3-.3-4.6-.8c-1.4-.4-2.6-1.2-3.4-2c-.7-.8-1-2-1.2-2.8z" fill="#c38865"/><path d="M74.3 87.8c0-.7 0-2.2 0-3.9c0-1.6 0-3.7 0-5.9c0-2.3 0-5-.1-7.6c0-2.6 0-5.6 0-8.3c0-2.7-.1-5.6-.1-8c0-2.5.1-4.8.1-6.9c0-2 0-3.8 0-5.6c0-1.7-.1-3.4-.1-5c0-1.6-.1-3.1-.1-4.5c0-1.4-.1-2.7-.1-3.9c0-1.3 0-2.5 0-3.5c0-1.1.1-2.1.1-2.9c0-.8 0-1.5 0-2.1c0-.6-.1-1.2-.1-1.7c0-.6 0-1.1 0-1.7c0-.6 0-1.5.1-1.8c0-.4 0-.4 0 0c-.1.3-.2 1.2-.6 1.8c-.4.6-1.1 1.1-1.7 1.6c-.6.6-1.3 1.1-1.7 1.7c-.4.6-.5 1.3-.6 2.1c-.1.8 0 1.8 0 2.9c0 1-.1 2.2-.1 3.5c0 1.2 0 2.5 0 3.9c0 1.5 0 2.9 0 4.5c0 1.6 0 3.3 0 5.1c0 1.7 0 3.5 0 5.6c-.1 2.1-.1 4.3-.1 6.8c0 2.5 0 5.3 0 8.1c0 2.7-.1 5.6 0 8.3c.1 2.6 0 5.3.5 7.5c.6 2.3 2 4.4 2.8 6c.7 1.6 1.5 3.2 1.8 3.9c.3.6 0 .6 0 0z" fill="#ad7354"/><path d="M67.5 5.9c.3 0 1 .2 1.4.4c.4.2.8.4 1.2.6c.4.3.8.6 1.2.9c.3.3.6.7.9 1.1c.3.4.6.8.8 1.2c.2.5.4.9.5 1.4c.2.5.3 1 .4 1.5c0 .5 0 1.2.1 1.5c0 .2.1.2 0 0c-.2-.3-.8-1-1.1-1.4c-.3-.4-.5-.7-.8-1.1c-.2-.3-.4-.6-.7-.9c-.2-.3-.4-.6-.7-.9c-.2-.3-.4-.6-.6-.9c-.2-.3-.5-.7-.7-1c-.3-.3-.6-.6-.9-1c-.3-.5-.8-1.2-1-1.4c-.1-.3-.2-.1 0 0z" fill="#ad7354"/><path d="M68.2 17.8c0 1.1-.3 2.3-.6 3.2c-.3.9-.9 1.7-1.5 2.3c-.5.5-1.3.8-1.9.8c-.6-.1-1.3-.4-1.9-1c-.5-.5-1-1.4-1.3-2.3c-.3-1-.5-2.2-.4-3.2c0-1.1.2-2.3.6-3.2c.3-.9.9-1.8 1.4-2.3c.6-.5 1.3-.8 2-.8c.6 0 1.3.4 1.9.9c.5.6 1 1.5 1.3 2.4c.3.9.4 2.1.4 3.2z" fill="#d39e7d" fill-opacity="0.6"/><path d="M68 36.5c-.1 1.1-.3 2.4-.6 3.4c-.4 1-1 1.9-1.6 2.5c-.6.5-1.4.9-2 .8c-.7 0-1.5-.3-2.1-.9c-.6-.6-1.1-1.5-1.4-2.5c-.3-1-.5-2.3-.5-3.4c0-1.2.2-2.5.6-3.4c.4-1 .9-1.9 1.5-2.5c.6-.6 1.4-.9 2.1-.9c.7 0 1.4.4 2 1c.6.5 1.2 1.5 1.5 2.5c.3 1 .5 2.3.5 3.4z" fill="#d39e7d" fill-opacity="0.35"/><path d="M55.8 94.9c0-.3 0-1.3 0-1.8c0-.5 0-.9 0-1.4c0-.5 0-1 0-1.6c0-.7.1-1.4.1-2.5c0-1 0-2.2 0-3.8c0-1.7.1-3.7.1-6c0-2.2.1-4.9.2-7.5c0-2.7.1-5.6.2-8.3c0-2.8.1-5.6.2-8.1c0-2.5 0-4.8.1-6.9c0-2.1.1-3.8.1-5.6c.1-1.8.2-3.5.3-5.1c0-1.6.1-3.1.2-4.5c.1-1.4.2-2.7.3-4c0-1.2.1-2.4.1-3.5c0-1.1.1-2 .1-2.9c0-.8.1-1.5.1-2.1c0-.7.1-1.2.1-1.8c.1-.6.1-1.1.1-1.6c.1-.6 0-1.1.1-1.9c.1-.7.2-1.8.5-2.6c.2-.9.7-1.7 1.2-2.4c.5-.7 1.1-1.4 1.8-1.9c.6-.5 1.4-.9 2.2-1.2c.8-.2 1.6-.3 2.4-.3c.8 0 1.7.2 2.4.5c.8.3 1.6.7 2.2 1.3c.6.5 1.2 1.2 1.7 1.9c.4.8.8 1.6 1 2.5c.3.8.3 1.9.4 2.7c0 .7-.1 1.2-.1 1.8c0 .6 0 1.1 0 1.7c0 .5.1 1.1.1 1.7c0 .6 0 1.3 0 2.1c0 .8-.1 1.8-.1 2.9c0 1 0 2.2 0 3.5c0 1.2.1 2.5.1 3.9c0 1.4.1 2.9.1 4.5c0 1.6.1 3.3.1 5c0 1.8 0 3.6 0 5.6c0 2.1-.1 4.4-.1 6.9c0 2.4.1 5.3.1 8c0 2.7 0 5.7 0 8.3c.1 2.6.1 5.3.1 7.6c0 2.2 0 4.3 0 5.9c0 1.7 0 2.8 0 3.9c0 1 0 1.8-.1 2.4c0 .7 0 1.1 0 1.6c0 .6 0 .9 0 1.5c0 .5 0 1.5 0 1.8" fill="none" stroke="#55301a" stroke-width="1"/><path d="M69.4 47.6c-.2-.1-.9-.5-1.3-.6c-.4-.2-.9-.3-1.3-.4c-.5-.1-.9-.1-1.4-.1c-.4-.1-.9 0-1.3.1c-.5 0-.9.1-1.4.3c-.4.1-1.1.5-1.3.6" fill="none" stroke="#87533a" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.5"/><path d="M68.9 44.9c-.1 0-.7-.3-1.1-.5c-.4-.1-.8-.2-1.2-.3c-.4 0-.8-.1-1.1-.1c-.4 0-.8 0-1.2.1c-.4.1-.8.2-1.2.3c-.4.1-1 .4-1.1.5" fill="none" stroke="#87533a" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.35"/><path d="M69.1 24.5c-.2 0-.8-.3-1.1-.4c-.4-.2-.7-.3-1.1-.3c-.3-.1-.7-.1-1.1-.1c-.3 0-.7 0-1.1 0c-.3.1-.7.2-1 .3c-.4.1-.9.3-1.1.4" fill="none" stroke="#87533a" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M74.2 99.1c-.1-.8.1-1.3.1-1.9c.1-.6.1-1 .1-1.5c.1-.6.1-1 .1-1.7c.1-.7.1-1.4.2-2.4c0-1 .1-2.1.2-3.7c.1-1.5.2-3.3.4-5.4c.1-2 .3-4.4.5-6.8c.2-2.4.4-5 .6-7.5c.2-2.4.4-5 .5-7.2c.2-2.3.3-4.3.5-6.2c.1-1.9.2-3.5.4-5.1c.1-1.6.3-3.2.5-4.6c.1-1.4.3-2.8.4-4.1c.2-1.3.3-2.4.5-3.6c.1-1.1.2-2.2.3-3.1c0-.9.1-1.8.2-2.5c0-.7.1-1.3.2-1.8c0-.6.1-1 .1-1.5c.1-.5.2-.9.2-1.3c.1-.5 0-.9.2-1.6c.1-.6.2-1.7.5-2.5c.4-.8.8-1.6 1.3-2.3c.5-.7 1.2-1.3 1.9-1.7c.7-.5 1.4-.8 2.2-1.1c.8-.2 1.6-.2 2.4-.2c.8.1 1.6.3 2.3.6c.8.4 1.5.8 2.1 1.4c.6.6 1.1 1.3 1.5 2c.4.7.7 1.6.9 2.4c.2.9.2 2 .2 2.7c0 .7-.1 1-.1 1.5c0 .5-.1.9-.1 1.4c0 .4 0 .9 0 1.4c0 .5-.1 1.1-.1 1.8c0 .7-.1 1.5-.2 2.5c0 .9-.1 2-.1 3.1c-.1 1.1-.1 2.3-.1 3.6c-.1 1.3-.1 2.6-.1 4.1c-.1 1.4-.1 2.9-.2 4.5c0 1.6-.1 3.2-.2 5.1c-.1 1.9-.3 3.9-.4 6.1c-.1 2.3-.2 4.8-.3 7.3c-.1 2.4-.2 5.1-.3 7.4c-.1 2.4-.2 4.9-.3 6.9c-.1 2.1-.2 3.9-.3 5.4c-.1 1.6-.2 2.7-.2 3.7c-.1 1-.1 1.7-.2 2.4c0 .7-.1 1.1-.1 1.7c0 .5-.1.9-.1 1.5c0 .6.1 1.1-.1 1.9c-.2.7-.6 1.9-1.4 2.6c-.8.7-2.1 1.4-3.4 1.8c-1.3.4-3 .5-4.5.4c-1.5-.1-3.2-.4-4.5-1c-1.2-.5-2.4-1.3-3.2-2.1c-.7-.9-.8-2-1-2.8z" fill="#c38865"/><path d="M92.7 92.7c0-.6.1-2.1.2-3.7c.1-1.5.2-3.3.3-5.4c.1-2 .2-4.5.3-6.9c.1-2.3.2-5 .3-7.4c.1-2.5.2-5 .3-7.3c.1-2.2.3-4.2.4-6.1c.1-1.9.2-3.5.2-5.1c.1-1.6.1-3.1.2-4.5c0-1.5 0-2.8.1-4.1c0-1.3 0-2.5.1-3.6c0-1.1.1-2.2.1-3.1c.1-1 .2-1.8.2-2.5c0-.7.1-1.3.1-1.8c0-.5 0-1 0-1.4c0-.5.1-.9.1-1.4c0-.5.1-1.3.1-1.5c0-.3.1-.3 0 0c-.1.2-.2 1-.6 1.5c-.4.4-1.2.8-1.7 1.2c-.6.4-1.4.8-1.8 1.3c-.4.5-.5 1.1-.6 1.8c-.1.7-.1 1.5-.2 2.4c0 1-.1 2.1-.2 3.2c0 1.1-.1 2.3-.2 3.6c0 1.2-.1 2.6-.2 4c-.1 1.5-.1 3-.2 4.6c-.1 1.6-.2 3.2-.3 5.1c-.1 1.9-.3 3.9-.4 6.1c-.1 2.3-.3 4.8-.4 7.3c-.1 2.4-.3 5-.4 7.4c0 2.4-.3 4.9.2 6.9c.4 2.1 1.7 4.1 2.4 5.6c.7 1.6 1.3 3.2 1.6 3.8c.2.6-.1.6 0 0z" fill="#ad7354"/><path d="M89.9 18.2c.2.1.9.2 1.3.4c.4.2.8.5 1.1.7c.4.3.8.6 1.1 1c.3.3.6.7.9 1c.2.4.5.9.7 1.3c.2.4.3.9.4 1.4c.2.4.2.9.3 1.4c0 .5 0 1.2 0 1.5c0 .2.1.2 0 0c-.2-.3-.7-1-1-1.4c-.2-.4-.4-.8-.7-1.1c-.2-.3-.4-.7-.6-1c-.2-.3-.4-.6-.6-.9c-.2-.3-.4-.6-.6-.9c-.2-.3-.4-.6-.7-1c-.2-.3-.4-.6-.7-1c-.3-.4-.8-1.2-.9-1.4c-.2-.3-.2-.1 0 0z" fill="#ad7354"/><path d="M90 29.3c-.1 1.1-.4 2.2-.8 3.1c-.4.8-1 1.7-1.5 2.1c-.6.5-1.4.8-2 .7c-.6 0-1.3-.4-1.8-1c-.5-.5-.9-1.4-1.1-2.4c-.3-.9-.4-2.1-.3-3.1c.1-1 .4-2.2.8-3c.4-.9.9-1.7 1.5-2.2c.6-.5 1.3-.7 1.9-.7c.7.1 1.3.4 1.8 1c.5.6 1 1.5 1.2 2.4c.2.9.3 2.1.3 3.1z" fill="#d39e7d" fill-opacity="0.6"/><path d="M88.9 45.8c-.1 1.1-.4 2.4-.8 3.3c-.4 1-1 1.8-1.6 2.4c-.6.5-1.4.8-2.1.7c-.6 0-1.4-.4-1.9-1c-.5-.6-1-1.6-1.3-2.6c-.3-.9-.4-2.2-.3-3.3c.1-1.1.4-2.4.8-3.3c.4-.9 1-1.8 1.6-2.3c.6-.6 1.4-.8 2.1-.8c.6.1 1.4.4 1.9 1c.5.6 1 1.6 1.3 2.6c.3 1 .4 2.2.3 3.3z" fill="#d39e7d" fill-opacity="0.35"/><path d="M74.2 99.1c0-.3.1-1.3.1-1.9c.1-.6.1-1 .1-1.5c.1-.6.1-1 .1-1.7c.1-.7.1-1.4.2-2.4c0-1 .1-2.1.2-3.7c.1-1.5.2-3.3.4-5.4c.1-2 .3-4.4.5-6.8c.2-2.4.4-5 .6-7.5c.2-2.4.4-5 .5-7.2c.2-2.3.3-4.3.5-6.2c.1-1.9.2-3.5.4-5.1c.1-1.6.3-3.2.5-4.6c.1-1.4.3-2.8.4-4.1c.2-1.3.3-2.4.5-3.6c.1-1.1.2-2.2.3-3.1c0-.9.1-1.8.2-2.5c0-.7.1-1.3.2-1.8c0-.6.1-1 .1-1.5c.1-.5.2-.9.2-1.3c.1-.5 0-.9.2-1.6c.1-.6.2-1.7.5-2.5c.4-.8.8-1.6 1.3-2.3c.5-.7 1.2-1.3 1.9-1.7c.7-.5 1.4-.8 2.2-1.1c.8-.2 1.6-.2 2.4-.2c.8.1 1.6.3 2.3.6c.8.4 1.5.8 2.1 1.4c.6.6 1.1 1.3 1.5 2c.4.7.7 1.6.9 2.4c.2.9.2 2 .2 2.7c0 .7-.1 1-.1 1.5c0 .5-.1.9-.1 1.4c0 .4 0 .9 0 1.4c0 .5-.1 1.1-.1 1.8c0 .7-.1 1.5-.2 2.5c0 .9-.1 2-.1 3.1c-.1 1.1-.1 2.3-.1 3.6c-.1 1.3-.1 2.6-.1 4.1c-.1 1.4-.1 2.9-.2 4.5c0 1.6-.1 3.2-.2 5.1c-.1 1.9-.3 3.9-.4 6.1c-.1 2.3-.2 4.8-.3 7.3c-.1 2.4-.2 5.1-.3 7.4c-.1 2.4-.2 4.9-.3 6.9c-.1 2.1-.2 3.9-.3 5.4c-.1 1.6-.2 2.7-.2 3.7c-.1 1-.1 1.7-.2 2.4c0 .7-.1 1.1-.1 1.7c0 .5-.1.9-.1 1.5c0 .6-.1 1.6-.1 1.9" fill="none" stroke="#55301a" stroke-width="1"/><path d="M89.8 56c-.2-.1-.8-.5-1.3-.7c-.4-.2-.8-.3-1.2-.4c-.5-.1-.9-.2-1.3-.2c-.5 0-.9 0-1.4 0c-.4.1-.8.1-1.3.3c-.4.1-1.1.4-1.3.5" fill="none" stroke="#87533a" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.5"/><path d="M89.5 53.3c-.2-.1-.8-.4-1.1-.5c-.4-.2-.8-.3-1.2-.4c-.3-.1-.7-.1-1.1-.1c-.4-.1-.7-.1-1.1 0c-.4 0-.8.1-1.2.2c-.4.1-1 .3-1.2.4" fill="none" stroke="#87533a" stroke-width=".7" stroke-linecap="round" stroke-opacity="0.35"/><path d="M90.5 35.1c-.2-.1-.7-.4-1-.5c-.4-.1-.7-.2-1.1-.3c-.3-.1-.6-.2-1-.2c-.3 0-.7 0-1.1 0c-.3 0-.7.1-1 .2c-.4.1-.9.3-1.1.4" fill="none" stroke="#87533a" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M28.3 193.6c-5-3.7-.6-11.2-1.5-18.6c-.9-7.5-2.8-18-3.7-26.1c-1-8-1.8-14.5-1.9-22.3c-.2-7.7-.5-18.7 1-24.2c1.6-5.4 4.3-5.2 8.5-8.3c4.2-3.2 10.8-8.1 16.5-10.6c5.8-2.5 11.8-4.5 17.9-4.5c6.1 0 13.9 2.5 18.8 4.7c4.9 2.2 8.7 3.2 10.8 8.5c2.1 5.3 1.3 15.7 1.8 23.3c.5 7.6.8 14.8 1.2 22.3c.3 7.4 1.8 15.5.9 22.3c-.9 6.8-4.3 13-6.5 18.6c-2.3 5.6-1 11.8-6.9 14.9c-5.9 3.1-19 3.7-28.5 3.7c-9.5 0-23.4 0-28.4-3.7z" fill="#c38865"/><path d="M26.8 175c-1.9-3.7-2.8-18-3.7-26.1c-1-8-1.8-14.5-1.9-22.3c-.2-7.7-1.2-19.8 1-24.2c2.2-4.3 8.3-4 12.2-1.8c3.9 2.2 8.1 9.9 11.2 14.9c3.1 4.9 7.1 8.6 7.4 14.8c.3 6.2-2.5 15.5-5.6 22.4c-3.1 6.8-9.5 14.8-13 18.6c-3.4 3.7-5.7 7.4-7.6 3.7z" fill="#ad7354" fill-opacity="0.22"/><path d="M27 173.1c-1.7-3.7-2.8-16.4-3.7-24.2c-1-7.7-1.9-14.7-2-22.3c-.1-7.6-.3-19.2 1.4-23.2c1.7-4.1 6-3.3 8.9-1c2.9 2.4 6.1 10 8.4 14.9c2.3 5 5.3 9 5.6 14.9c.3 5.9-1.7 14-3.7 20.5c-2.1 6.5-6.3 15.2-8.8 18.6c-2.5 3.4-4.5 5.5-6.1 1.8z" fill="#ad7354" fill-opacity="0.22"/><path d="M27.2 171.3c-1.3-3.4-2.8-14.9-3.8-22.4c-.9-7.4-1.9-14.8-1.9-22.3c-.1-7.4.3-21.1 1.5-22.3c1.2-1.2 4.2 7.4 5.8 14.9c1.6 7.4 3.3 21.4 3.8 29.7c.4 8.4-.5 16.8-1.4 20.5c-.9 3.7-2.7 5.3-4 1.9z" fill="#ad7354" fill-opacity="0.4"/><path d="M93.8 153c1 2.4 1.7 5.2 2 7.7c.3 2.5.2 5.1-.3 7.3c-.5 2.1-1.4 4.2-2.6 5.8c-1.1 1.5-2.7 2.7-4.3 3.4c-1.7.7-3.7.9-5.6.6c-1.9-.3-4-1.2-5.8-2.4c-1.9-1.3-3.8-3.1-5.3-5.1c-1.5-1.9-2.9-4.4-3.9-6.8c-1-2.4-1.7-5.2-2-7.7c-.2-2.5-.1-5.1.3-7.3c.5-2.2 1.4-4.2 2.6-5.8c1.1-1.5 2.7-2.8 4.3-3.4c1.7-.7 3.7-.9 5.6-.6c1.9.3 4 1.2 5.8 2.4c1.9 1.3 3.8 3.1 5.3 5.1c1.6 1.9 3 4.4 3.9 6.8z" fill="#d39e7d" fill-opacity="0.35"/><path d="M86.8 157c.7 1.7 1.2 3.7 1.4 5.5c.1 1.8-.1 3.6-.5 5.1c-.4 1.4-1.2 2.7-2.2 3.6c-.9.8-2.2 1.3-3.4 1.4c-1.3 0-2.8-.4-4.1-1.1c-1.3-.7-2.7-2-3.8-3.3c-1.1-1.4-2.2-3.2-2.9-5c-.7-1.7-1.2-3.7-1.4-5.5c-.1-1.8.1-3.6.5-5.1c.4-1.4 1.2-2.7 2.2-3.6c.9-.8 2.2-1.3 3.4-1.4c1.3 0 2.8.4 4.1 1.1c1.3.7 2.7 2 3.8 3.3c1.1 1.4 2.2 3.2 2.9 5z" fill="#d39e7d" fill-opacity="0.3"/><path d="M80.2 110.8c-1.3 2.3-5.5 7.6-7.7 14c-2.2 6.3-4.1 16.4-5.5 24.1c-1.4 7.8-2.4 18.6-2.8 22.4" fill="none" stroke="#87533a" stroke-width="1" stroke-linecap="round" stroke-opacity="0.6"/><path d="M78.3 112.7c-3 1.2-11.5 4.8-17.8 7.4c-6.4 2.7-14.8 6.4-20.5 8.4c-5.7 2-11.6 3.1-14 3.7" fill="none" stroke="#87533a" stroke-width=".9" stroke-linecap="round" stroke-opacity="0.5"/><path d="M23 114.5c.7-.9-.4-4 4-5.5c4.3-1.6 14.8-2.8 22.1-3.8c7.3-.9 18-1.5 21.6-1.8" fill="none" stroke="#87533a" stroke-width=".9" stroke-linecap="round" stroke-opacity="0.5"/><path d="M24.2 99.5c1.1.3 4.3 1.8 6.5 1.8c2.1 0 5.4-1.5 6.4-1.8" fill="none" stroke="#87533a" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M39.9 89.1c1.2.3 4.9 1.8 7.3 1.8c2.5 0 6.2-1.5 7.4-1.8" fill="none" stroke="#87533a" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M57.4 84.6c1.3.3 5.1 1.8 7.7 1.8c2.6 0 6.4-1.5 7.7-1.8" fill="none" stroke="#87533a" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M76.3 89.2c1.3.3 5.1 1.9 7.6 1.9c2.5 0 6.3-1.6 7.6-1.9" fill="none" stroke="#87533a" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.45"/><path d="M33.5 185c3.9.3 15.5 2 23.2 1.9c7.8-.1 19.4-1.9 23.3-2.2" fill="none" stroke="#87533a" stroke-width=".8" stroke-linecap="round" stroke-opacity="0.4"/><path d="M37.2 189.9c3.3.2 13 1.5 19.5 1.5c6.5-.1 16.3-1.6 19.6-1.9" fill="none" stroke="#87533a" stroke-width=".6" stroke-linecap="round" stroke-opacity="0.28"/><path d="M68.4 155.7c1.3-1.7 3.9-4.1 6-6c2.1-2 4.3-3.9 6.4-5.8c2.1-1.9 4.2-3.6 6.2-5.4c1.9-1.8 3.7-3.5 5.3-5.2c1.6-1.7 2.9-3.3 4.1-5c1.2-1.7 2.2-3.3 3.2-5.1c1-1.8 2-3.6 2.9-5.5c.9-1.8 1.8-3.7 2.6-5.6c.8-1.8 1.5-3.7 2.2-5.4c.6-1.7 1.2-3.4 1.7-4.8c.5-1.3.9-2.4 1.2-3.3c.3-1 .5-1.6.7-2.3c.2-.8.4-1.5.6-2.3c.1-.9.3-1.9.5-3c.2-1 .3-2.1.5-3.2c.3-1.1.5-2.4 1-3.4c.5-1.1 1.1-2.1 1.8-2.9c.8-.9 1.7-1.6 2.6-2.2c.9-.5 2-1 3-1.2c1.1-.2 2.2-.2 3.2-.1c1.1.1 2.1.5 3.1 1c.9.5 1.8 1.1 2.6 1.9c.8.8 1.4 1.8 1.9 2.8c.5 1 .9 2.1 1 3.3c.2 1.1.1 2.4.1 3.5c-.1 1-.3 1.9-.3 2.8c0 .9 0 1.7 0 2.7c0 1.1.1 2.3 0 3.6c-.2 1.4-.3 2.9-.6 4.5c-.4 1.5-.9 3.1-1.4 4.8c-.5 1.7-1.1 3.5-1.7 5.4c-.7 1.9-1.3 4-2.1 6.2c-.7 2.2-1.5 4.6-2.5 6.9c-1 2.4-2 4.9-3.3 7.3c-1.2 2.5-2.7 4.9-4.3 7.3c-1.5 2.4-3.3 4.8-5 7.1c-1.8 2.4-3.6 4.7-5.4 7c-1.9 2.3-3.7 4.7-5.6 6.9c-1.8 2.2-3.6 4.3-5.5 6.5c-1.8 2.1-3.8 4.8-5.4 6.1c-1.6 1.4-2.7 1.8-4.4 1.9c-1.8.1-4.1-.4-6.1-1.3c-2-.9-4.4-2.5-6.1-4.1c-1.8-1.7-3.5-3.9-4.6-5.9c-1-1.9-1.6-4.2-1.7-5.9c0-1.8.3-2.8 1.6-4.6z" fill="#c38865"/><path d="M106.2 156.1c.9-1.1 3.6-4.6 5.4-7c1.7-2.3 3.5-4.7 5-7.1c1.6-2.4 3.1-4.8 4.3-7.3c1.3-2.4 2.3-4.9 3.3-7.3c1-2.3 1.8-4.7 2.5-6.9c.8-2.2 1.4-4.3 2.1-6.2c.6-1.9 1.2-3.7 1.7-5.4c.5-1.7 1-3.3 1.4-4.8c.3-1.6.4-3.1.6-4.5c.1-1.3 0-2.5 0-3.6c0-1 0-1.8 0-2.7c0-.9.2-2.3.3-2.8c0-.5.1-.5 0 0c-.2.4-.5 1.9-1 2.7c-.5.9-1.4 1.6-2.2 2.6c-.8.9-1.8 1.9-2.5 3c-.6 1.1-.9 2.4-1.3 3.7c-.5 1.4-.8 2.9-1.3 4.5c-.5 1.6-1.1 3.3-1.8 5.2c-.6 1.8-1.3 3.9-2 6c-.8 2.1-1.6 4.3-2.6 6.5c-.9 2.2-2.1 4.5-3.2 6.8c-1 2.3-2.5 4.4-3.3 7.1c-.9 2.7-1 6-1.9 9c-.9 2.9-2.9 7.1-3.5 8.5c-.6 1.5-.9 1.2 0 0z" fill="#ad7354"/><path d="M125.7 78.5c.3.2 1.1.5 1.6.7c.6.3 1.1.7 1.6 1.1c.4.3.9.8 1.3 1.2c.4.5.8 1 1.1 1.6c.3.5.6 1.1.8 1.7c.2.6.4 1.2.5 1.8c.2.6.2 1.3.3 1.9c0 .7-.1 1.7-.1 2c-.1.3.2.3 0 0c-.2-.3-.9-1.3-1.2-1.9c-.3-.5-.6-1-.8-1.5c-.3-.5-.6-.9-.8-1.3c-.3-.5-.5-.9-.8-1.3c-.2-.4-.5-.8-.7-1.2c-.3-.5-.5-.9-.8-1.4c-.3-.4-.6-.9-.9-1.4c-.4-.6-.9-1.6-1.1-2c-.2-.3-.3-.1 0 0z" fill="#ad7354"/><path d="M124.9 95.3c-.1 1.4-.5 3-1.1 4.1c-.5 1.2-1.3 2.3-2.1 2.9c-.8.7-1.8 1-2.6.9c-.9-.1-1.8-.6-2.5-1.4c-.6-.7-1.2-2-1.5-3.2c-.3-1.3-.4-2.9-.3-4.3c.2-1.4.6-3 1.1-4.2c.6-1.1 1.4-2.2 2.2-2.9c.8-.6 1.8-.9 2.6-.8c.9 0 1.8.6 2.4 1.3c.7.8 1.3 2.1 1.6 3.3c.3 1.3.4 2.9.2 4.3z" fill="#d39e7d" fill-opacity="0.6"/><path d="M116.4 123.9c-.7 1.5-1.7 3-2.7 4.1c-.9 1-2.2 1.9-3.3 2.3c-1.1.4-2.2.4-3.1 0c-.9-.4-1.7-1.3-2.1-2.3c-.4-1.1-.6-2.6-.5-4.1c.1-1.4.6-3.2 1.3-4.6c.6-1.5 1.6-3 2.6-4.1c1-1 2.3-1.9 3.3-2.3c1.1-.4 2.3-.4 3.2 0c.8.4 1.6 1.3 2 2.3c.5 1.1.7 2.6.5 4.1c-.1 1.4-.6 3.2-1.2 4.6z" fill="#d39e7d" fill-opacity="0.35"/><path d="M96.4 128.3c.5-.8 2.2-3.3 3.2-5.1c1-1.8 2-3.6 2.9-5.5c.9-1.8 1.8-3.7 2.6-5.6c.8-1.8 1.5-3.7 2.2-5.4c.6-1.7 1.2-3.4 1.7-4.8c.5-1.3.9-2.4 1.2-3.3c.3-1 .5-1.6.7-2.3c.2-.8.4-1.5.6-2.3c.1-.9.3-1.9.5-3c.2-1 .3-2.1.5-3.2c.3-1.1.5-2.4 1-3.4c.5-1.1 1.1-2.1 1.8-2.9c.8-.9 1.7-1.6 2.6-2.2c.9-.5 2-1 3-1.2c1.1-.2 2.2-.2 3.2-.1c1.1.1 2.1.5 3.1 1c.9.5 1.8 1.1 2.6 1.9c.8.8 1.4 1.8 1.9 2.8c.5 1 .9 2.1 1 3.3c.2 1.1.1 2.4.1 3.5c-.1 1-.3 1.9-.3 2.8c0 .9 0 1.7 0 2.7c0 1.1.1 2.3 0 3.6c-.2 1.4-.3 2.9-.6 4.5c-.4 1.5-.9 3.1-1.4 4.8c-.5 1.7-1.1 3.5-1.7 5.4c-.7 1.9-1.3 4-2.1 6.2c-.7 2.2-1.5 4.6-2.5 6.9c-1 2.4-2 4.9-3.3 7.3c-1.2 2.5-2.7 4.9-4.3 7.3c-1.5 2.4-3.3 4.8-5 7.1c-1.8 2.4-3.6 4.7-5.4 7c-1.9 2.3-3.7 4.7-5.6 6.9c-1.8 2.2-4.5 5.4-5.5 6.5" fill="none" stroke="#55301a" stroke-width="1"/><path d="M124.9 107.1c-.2-.2-.9-1-1.4-1.4c-.5-.4-1-.7-1.6-1c-.5-.3-1.1-.6-1.6-.8c-.6-.2-1.2-.3-1.8-.4c-.6 0-1.3-.1-1.9 0c-.6 0-1.7.2-2 .2" fill="none" stroke="#87533a" stroke-width=".9" stroke-linecap="round" stroke-opacity="0.5"/><path d="M124.5 104c-.2-.1-.7-.7-1.1-1c-.4-.3-.8-.5-1.2-.8c-.4-.2-.8-.4-1.2-.5c-.4-.1-.9-.2-1.3-.3c-.5-.1-1-.1-1.5-.1c-.4.1-1.2.2-1.4.2" fill="none" stroke="#87533a" stroke-width=".6" stroke-linecap="round" stroke-opacity="0.3"/></g></svg>'},
  },
};

/* ===== walk.js ===== */
/* (v21.43) The Walkthrough view: a narrated walkthrough that plays like a video, built live from this book (its pictures,
   photo, colours, token picture and count, terminal token). The whole walkthrough is laid out once per build as a timeline
   (build); renderAt(t) sets every element of the stage to its state at time t, as a pure function of t, with no CSS
   transitions, so playing, seeking, the chapters and the video recorder all draw the same frames. The narration is Web Audio
   (walk-audio.js, made by make-narration.py) scheduled on the timeline; the hands are walk-hands.js. Each is optional: without
   the audio the captions are timed from their word counts and the device's voice reads them; without the hands simple
   placeholder hands are drawn. The pages are the form's own (pageGrid, pageBoard, pageTokens, cardHtml, tokCard), rendered
   with the First-Then layout and the 8.82 in page for the walkthrough only; the book itself (S) is never changed. */
(function(){
'use strict';
const SW=1280,SH=720,PX=96/72,PAUSE=.6,CPT=138,TPT=104;
const LIST=['intro','ch_show','ch_pick','tg_show','tg_pick','bd_place','tk_page','rule','start','tok_first','tok_none','tok_more','tok_last','exchange','reset','tips','outro'];
const OPT={tk_page:1,tok_none:1};
const CHOF={intro:'book',ch_show:'choices',ch_pick:'choices',tg_show:'targets',tg_pick:'targets',bd_place:'board',tk_page:'board',rule:'session',start:'session',tok_first:'session',tok_none:'session',tok_more:'session',tok_last:'session',tok_last_term:'session',exchange:'exchange',reset:'exchange',tips:'tips',outro:'tips'};
const CHAPS=[['book','The book'],['choices','Choices'],['targets','Targets'],['board','Board'],['session','Session'],['exchange','Exchange'],['tips','Tips']];
/* the narration as written in walk-script.json, used only when walk-audio.js is not in the build (its texts always win) */
const FB={
  intro:'This is your token board book. Four laminated pages are bound on the left, with a tab for each: Choices, Targets, Board, and Tokens.',
  ch_show:'Page one is the Choices page. Show it to your learner before the task begins. Every picture should be something your learner values.',
  ch_pick:'Your learner looks over the pictures and picks one to work for. Prompt gently if needed.',
  tg_show:'Page two is the Targets page. Here, you choose what to teach: a new skill, or a replacement behavior from the behavior plan.',
  tg_pick:'Choose one target at a time. Agree with the other adults on exactly what counts, so everyone gives tokens for the same thing.',
  bd_place:'Page three is the Board. Place the target under First, and the chosen item under Then. Now your learner can see the plan: first the work, then the item.',
  tk_page:'Page four is the Tokens page, where the tokens wait. The empty slots on the Board show your learner how many are left.',
  rule:'Before you start, decide how much behavior earns one token. In this example, your learner earns a token for every two minutes of working.',
  start:'Now start the session. Point to the board: first work, then the item. The ring shows each interval, sped up for this video.',
  tok_first:'The interval is over, and your learner kept working. Give a token right away, with brief, specific praise, like "Great working!" Your learner places it in the first slot.',
  tok_none:'If your learner was not working during an interval, no token is given. Stay calm and simply start the next interval.',
  tok_more:'Each interval of working earns another token, given right away with a few words of praise. The board fills up, one slot at a time.',
  tok_last_term:'This last token looks different: it is the terminal token. It shows your learner that the board is finished and the item comes next.',
  tok_last:'The last token fills the board. Your learner has earned the item they chose.',
  exchange:'The board is full, so make the exchange right away, especially while the board is new. Give the Then item for the time you planned.',
  reset:'When the time is up, put the tokens back on the Tokens page and the cards back on their pages. Then your learner chooses again, for the next round.',
  tips:'A few tips. Make tokens valuable first: give one and exchange it right away, several times. Start with a small requirement and raise it slowly; if the behavior falls apart, go back a step. Keep the item available only through the board.',
  outro:'That’s the whole cycle: choose, set the target, earn the tokens, and exchange. The back of each page tells you more.'
};
/* the simulator's pictures, shown when a page's six cards are empty */
const SAMPLE={ch:[['ipad','Tablet'],['puzzle','Puzzle'],['ball','Ball'],['bubbles','Bubbles'],['lego','Building blocks'],['drawing','Drawing']],
  tg:[['sitting','Sitting'],['raisehand','Raise hand'],['writing','Writing'],['waiting','Waiting'],['alldone','All done'],['reading','Reading']]};
const PRAISE=['Nice working!','Way to keep working!','Good working!','You kept working!','Super working!','Great job working!','Keep it up!','Nice job!'];

/* ---------------- small helpers ---------------- */
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const ease=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
const easeOut=u=>1-Math.pow(1-u,3);
const bump=(t,t0,d)=>{const u=(t-t0)/d;return u<=0||u>=1?0:Math.sin(Math.PI*u);};
const f2=v=>(Math.round(v*100)/100).toString();
function div(cls,html){const d=document.createElement('div');if(cls)d.className=cls;if(html)d.innerHTML=html;return d;}
function css(el,p,v){const c=el._wk||(el._wk={});if(c[p]!==v){c[p]=v;el.style[p]=v;}}
function txt(el,v){if(el._wkT!==v){el._wkT=v;el.textContent=v;}}
const audioLines=()=>(typeof WALK_AUDIO!=='undefined'&&WALK_AUDIO&&WALK_AUDIO.lines&&typeof WALK_AUDIO.lines==='object')?WALK_AUDIO.lines:null;
const handArt=()=>(typeof WALK_HANDS!=='undefined'&&WALK_HANDS&&WALK_HANDS.learner&&WALK_HANDS.teacher)?WALK_HANDS:placeholderHands();
function line(id){const L=audioLines();const l=L&&L[id];const t=String((l&&l.t)||FB[id]||'');const words=t.split(/\s+/).filter(Boolean).length;
  const d=l&&+l.d>0?+l.d:Math.max(1.5,words*.4);return{t,d,a:l&&typeof l.a==='string'?l.a:''};}
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

/* ---------------- placeholder hands (used only until walk-hands.js is in the build), same contract ---------------- */
let PHH=null;
function placeholderHands(){if(PHH)return PHH;
  const mk=(w,h,skin,dark,sleeve)=>{const arm='<path d="M'+w*.2+' '+h*.3+'L'+w*.16+' '+h+'H'+w*.84+'L'+w*.8+' '+h*.3+'Z" fill="'+skin+'" stroke="'+dark+'" stroke-width="2"/>'+(sleeve?'<path d="M'+w*.1+' '+h*.42+'H'+w*.9+'L'+w*.94+' '+h+'H'+w*.06+'Z" fill="'+sleeve+'" stroke="#2f4a63" stroke-width="2"/>':'');
    const palm='<rect x="'+w*.12+'" y="'+h*.12+'" width="'+w*.76+'" height="'+h*.22+'" rx="'+w*.3+'" fill="'+skin+'" stroke="'+dark+'" stroke-width="2"/>';
    const sv=b=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'">'+arm+b+'</svg>';
    const fing=(x,y0,y1)=>'<rect x="'+(x-w*.08)+'" y="'+y0+'" width="'+w*.16+'" height="'+(y1-y0)+'" rx="'+w*.08+'" fill="'+skin+'" stroke="'+dark+'" stroke-width="2"/>';
    return{point:{svg:sv(palm+fing(w*.26,h*.005,h*.2)+'<ellipse cx="'+w*.84+'" cy="'+h*.2+'" rx="'+w*.1+'" ry="'+h*.05+'" fill="'+skin+'" stroke="'+dark+'" stroke-width="2"/>'),w,h,tip:[w*.26,h*.012]},
      pinch:{svg:sv(palm+fing(w*.22,h*.02,h*.2)+fing(w*.36,h*.03,h*.2)),w,h,grip:[w*.28,h*.03]},
      open:{svg:sv(palm+[.2,.36,.52,.68].map((x,i)=>fing(w*x,h*(.01+i*.004),h*.18)).join('')+fing(w*.9,h*.12,h*.26)),w,h,palm:[w*.48,h*.22]}};};
  PHH={learner:mk(108,549,'#f3c7a2','#b98361',''),teacher:mk(140,667,'#a8714a','#5b3a22','#5f84a8')};return PHH;}
const HS={learner:1.3,teacher:1.3};
const ANCH={point:'tip',pinch:'grip',open:'palm'};

/* ---------------- the DOM of the view ---------------- */
let DOM=null;
function dom(){if(DOM&&DOM.stage&&DOM.stage.isConnected)return DOM;const g=id=>document.getElementById(id);const stage=g('wkStage');if(!stage)return null;
  DOM={sec:stage.closest('section'),player:g('wkPlayer'),frame:g('wkFrame'),stage,big:g('wkBig'),cap2:g('wkCap2'),play:g('wkPlay'),restart:g('wkRestart'),seek:g('wkSeek'),time:g('wkTime'),cc:g('wkCc'),snd:g('wkSnd'),fs:g('wkFs'),chaps:g('wkChaps'),note:g('wkNote'),tx:g('wkTx')};
  wire();return DOM;}

/* ---------------- the build ---------------- */
let B=null;
function emptySix(a){return !a.some(o=>has(o)||String(o.l||'').trim());}
function firstUsed(a){const i=a.findIndex(o=>has(o)||String(o.l||'').trim());return i<0?0:i;}
function sampled(k){return SAMPLE[k].map(([key,l])=>P[key]?cello(key,key==='ipad'||key==='waiting'?l:''):cello('',l));}   /* the library's labels, as the simulator has them */
/* the pages and cards drawn from a copy of the book's state: First-Then, the 8.82 in page, no presets in First and Then */
function forced(fn){const saved=S;
  try{S=Object.assign({},saved,{meta:Object.assign({},saved.meta,{layout:'ft',pagesize:'8.82'}),ft:[cello(),cello()],
      ch:emptySix(saved.ch)?sampled('ch'):saved.ch.map(o=>Object.assign({},o)),tg:emptySix(saved.tg)?sampled('tg'):saved.tg.map(o=>Object.assign({},o))});
    return fn();}
  finally{S=saved;}}
function tempShow(sec){if(!sec||getComputedStyle(sec).display!=='none')return()=>{};const old=sec.style.cssText;
  sec.style.cssText='display:block!important;position:absolute;left:-30000px;top:0;width:12in;visibility:hidden';return()=>{sec.style.cssText=old;};}
function coilSvg(h){const n=Math.max(8,Math.round(h/40)),gap=h/n;let s='';for(let i=0;i<n;i++){const y=gap*(i+.5);
    s+='<circle cx="27" cy="'+f2(y)+'" r="3.4" fill="#5d6770"/><path d="M27 '+f2(y-1)+'C17 '+f2(y-9)+' 3 '+f2(y-7)+' 3 '+f2(y+1)+'S17 '+f2(y+8)+' 27 '+f2(y+3)+'" fill="none" stroke="#3b4148" stroke-width="3.2" stroke-linecap="round"/><path d="M26 '+f2(y-1)+'C17 '+f2(y-7)+' 6 '+f2(y-6)+' 5 '+f2(y)+'" fill="none" stroke="#b9c2ca" stroke-width="1.2" opacity=".8"/>';}
  return '<svg class="wk-coil" viewBox="0 0 34 '+f2(h)+'" width="34" height="'+f2(h)+'" aria-hidden="true">'+s+'</svg>';}

function build(){const D=dom();if(!D)return null;stop(true);
  const restore=tempShow(D.sec);
  try{fit();B=compose(D);try{fitAll();}catch(e){}}
  finally{restore();}
  uiBuilt();pos=clamp(pos,0,B.D);renderAt(pos);ui();
  return{duration:B.D,cues:cuesOut(),chapters:chapsOut()};}
const cuesOut=()=>B?B.cues.map(c=>({id:c.id,start:c.start,dur:c.dur,narr:c.narr,text:c.text,chapter:c.chapter})):[];
const chapsOut=()=>B?B.chapters.map(c=>({id:c.id,label:c.label,start:c.start})):[];

function compose(D){
  const st=D.stage;st.innerHTML='';
  const layer=c=>{const d=div('wk-L '+(c||''));st.appendChild(d);return d;};
  const Lp=layer('wk-pages'),Lveil=layer('wk-veil'),Lfly=layer(),Lhl=layer('wk-hl'),Litem=layer(),Lht=layer('wk-ht'),Lfx=layer('wk-fx');
  const cap=div('wk-cap');st.appendChild(cap);
  /* the book, drawn from the forced copy of the state */
  const F=forced(()=>{const pk={ch:firstUsed(S.ch),tg:firstUsed(S.tg)},n=nTok(),cpt=CPT/72,tpt=TPT/72;
    return{pg:{ch:pageGrid('ch'),tg:pageGrid('tg'),bd:pageBoard(),tk:pageTokens()},
      ch:S.ch.map(o=>has(o)||String(o.l||'').trim()?cardHtml(o,cpt):''),tg:S.tg.map(o=>has(o)||String(o.l||'').trim()?cardHtml(o,cpt):''),
      tok:Array.from({length:n},(_,i)=>tokCard(tpt,i===n-1)),chipTok:tokCard(.6,false),n,term:termOn(),pick:pk,
      itemPic:pic(S.ch[pk.ch],''),itemLbl:String(lbl(S.ch[pk.ch])||'').trim()};});
  const notes=[];
  if(S.meta.layout==='rules')notes.push('This book’s Board uses the Rules row; the walkthrough shows the First-Then Board, which is used the same way.');
  if(emptySix(S.ch)&&emptySix(S.tg))notes.push('The Choices and Targets are still empty, so the walkthrough shows sample pictures.');
  else if(emptySix(S.ch))notes.push('The Choices are still empty, so the walkthrough shows sample pictures for them.');
  else if(emptySix(S.tg))notes.push('The Targets are still empty, so the walkthrough shows sample pictures for them.');
  if(!audioLines())notes.push('The recorded narration is not in this copy of the form: the captions are read by the device’s own voice where it has one.');
  /* the four pages: the page itself (the canvas), no sheet and no trim marks */
  const PG={};['tk','bd','tg','ch'].forEach(k=>{const el=div('wk-page');el.dataset.pg=k;el.innerHTML=F.pg[k];Lp.appendChild(el);
    const pg=el.querySelector('.pg'),cv=pg.querySelector('.cv');pg.querySelectorAll('.trim').forEach(x=>x.remove());cv.style.left='0';cv.style.top='0';
    const lay=div('wk-lay'),shade=div('wk-shade');cv.appendChild(lay);cv.appendChild(shade);PG[k]={k,el,pg,cv,lay,shade};});
  Object.values(PG).forEach(p=>{p.w=p.cv.offsetWidth;p.h=p.cv.offsetHeight;p.el.style.width=p.w+'px';p.el.style.height=p.h+'px';p.pg.style.width=p.w+'px';p.pg.style.height=p.h+'px';
    p.cv.insertAdjacentHTML('beforeend',coilSvg(p.h));});
  const rel=(p,el)=>{const r=el.getBoundingClientRect(),c=p.cv.getBoundingClientRect(),k=c.width/(p.cv.offsetWidth||1)||1;return{x:(r.left-c.left)/k,y:(r.top-c.top)/k,w:r.width/k,h:r.height/k};};
  const ctr=r=>({x:r.x+r.w/2,y:r.y+r.h/2});
  const M={ch:[...PG.ch.cv.querySelectorAll('.bx')].map(e=>rel(PG.ch,e)),tg:[...PG.tg.cv.querySelectorAll('.bx')].map(e=>rel(PG.tg,e)),
    first:rel(PG.bd,PG.bd.cv.querySelector('.bx.ft.grey')),then:rel(PG.bd,PG.bd.cv.querySelector('.bx.ft.green')),
    slot:[...PG.bd.cv.querySelectorAll('.slot')].map(e=>rel(PG.bd,e)),ybx:[...PG.tk.cv.querySelectorAll('.ybx')].map(e=>rel(PG.tk,e)),
    tab:{},band:rel(PG.ch,PG.ch.cv.querySelector('.band'))};
  ['ch','tg','bd','tk'].forEach(k=>{M.tab[k]=rel(PG[k],PG[k].cv.querySelector('.tab'));});
  const n=F.n,CW=CPT*PX,TW=TPT*PX;
  /* the in-page copies (a card resting on its page moves and turns with it) */
  const inPage=(p,c,html,w)=>{const e=div('wk-in',html);e.style.left=f2(c.x-w/2)+'px';e.style.top=f2(c.y-w/2)+'px';e.style.width=f2(w)+'px';e.style.height=f2(w)+'px';p.lay.appendChild(e);return e;};
  const cards=[];
  const mkCard=(id,html,w,h,cls)=>{const el=div('wk-fc'+(cls?' '+cls:''),'<div class="wk-sh"></div>'+html);el.dataset.card=id;el.style.width=f2(w)+'px';el.style.height=f2(h)+'px';Lfly.appendChild(el);
    const c={id,el,sh:el.firstChild,w,h,tr:new Track({x:-400,y:-400,s:1,l:0,o:1}),where:new Steps('none'),fol:[],inp:{},pops:{},glow:null};cards.push(c);return c;};
  const CH=[],TG=[],TK=[];
  F.ch.forEach((h,i)=>{if(!h)return;const c=i===F.pick.ch?mkCard('ch'+i,h,CW,CW):{id:'ch'+i,inp:{},pops:{},where:new Steps('ch'),fly:false};c.inp.ch=inPage(PG.ch,ctr(M.ch[i]),h,CW);c.inp.ch.dataset.card='ch'+i;c.where.set(-1e8,'ch');if(!c.el)cards.push(c);CH[i]=c;});
  F.tg.forEach((h,i)=>{if(!h)return;const c=i===F.pick.tg?mkCard('tg'+i,h,CW,CW):{id:'tg'+i,inp:{},pops:{},where:new Steps('tg'),fly:false};c.inp.tg=inPage(PG.tg,ctr(M.tg[i]),h,CW);c.inp.tg.dataset.card='tg'+i;c.where.set(-1e8,'tg');if(!c.el)cards.push(c);TG[i]=c;});
  const cC=CH[F.pick.ch]||mkCard('chx',cardHtml({k:'',ph:'',l:'Item'},CPT/72),CW,CW),cT=TG[F.pick.tg]||mkCard('tgx',cardHtml({k:'',ph:'',l:'Target'},CPT/72),CW,CW);
  cC.inp.bd=inPage(PG.bd,ctr(M.then),F.ch[F.pick.ch]||cC.el.lastChild.outerHTML,CW);cC.inp.bd.dataset.card=cC.id;
  cT.inp.bd=inPage(PG.bd,ctr(M.first),F.tg[F.pick.tg]||cT.el.lastChild.outerHTML,CW);cT.inp.bd.dataset.card=cT.id;
  for(let i=0;i<n;i++){const c=mkCard('tok'+i,F.tok[i],TW,TW,'wk-tok');c.inp.tk=inPage(PG.tk,ctr(M.ybx[i]),F.tok[i],TW);c.inp.bd=inPage(PG.bd,ctr(M.slot[i]),F.tok[i],TW);
    c.inp.tk.dataset.card=c.inp.bd.dataset.card='tok'+i;c.where.set(-1e8,'tk');TK.push(c);}
  const lastTok=TK[n-1];if(F.term){lastTok.glow=div('wk-tglow');lastTok.el.insertBefore(lastTok.glow,lastTok.el.children[1]);}
  /* the item (the Then card grown into the thing itself) */
  const itemLabel=F.itemLbl?'2 minutes of '+F.itemLbl:'2 minutes with the item';
  const IW=250;const item=mkCard('item','<div class="wk-ipic">'+(F.itemPic||'<span>'+esc(F.itemLbl||'Item')+'</span>')+'</div><div class="wk-ilbl">'+esc(itemLabel)+'</div>',IW,IW,'wk-item');
  Litem.appendChild(item.el);
  /* the hands */
  const ART=handArt(),hands=[];
  const mkHand=who=>{const root=div('wk-hand wk-'+who);(who==='teacher'?Lht:Lhl).appendChild(root);const h={who,root,poses:{},base:HS[who],tr:new Track({x:640,y:SH+700,s:1,sx:640,sy:SH+800}),pose:new Steps('point')};
    ['point','pinch','open'].forEach(p=>{const a=ART[who][p];const an=a[ANCH[p]]||[a.w/2,0];const e=div('wk-pose',a.svg);e.style.width=a.w+'px';e.style.height=a.h+'px';e.style.transformOrigin=f2(an[0])+'px '+f2(an[1])+'px';root.appendChild(e);h.poses[p]={el:e,ax:an[0],ay:an[1]};});
    hands.push(h);return h;};
  const HL=mkHand('learner'),HT=mkHand('teacher');
  /* layouts: the closed book centred; the session (the Board large on the left, the Tokens page smaller on the right) */
  const pw=PG.ch.w,ph=PG.ch.h,maxH=Math.max(PG.ch.h,PG.tg.h,PG.bd.h,PG.tk.h);
  const sBk=Math.min(.86,566/maxH),bx=(SW-pw*sBk)/2,by=30;
  const DEPTH={ch:0,tg:1,bd:2,tk:3};
  const BOOK=(k,s,x,y)=>{s=s||sBk;const X=x==null?(SW-pw*s)/2:x,Y=y==null?by:y;return{x:X+DEPTH[k]*2.2*s/sBk,y:Y+DEPTH[k]*2.6*s/sBk,s};};
  const TL={x:bx/2,y:by+ph*sBk*.5},TR={x:SW-bx/2,y:by+ph*sBk*.5};
  const sBd=Math.min(.8,520/PG.bd.h),sTk=.52;
  const BDS={x:26,y:30,s:sBd},TKS={x:SW-26-pw*sTk,y:Math.min(300,604-PG.tk.h*sTk),s:sTk};
  const RC={x:TKS.x+pw*sTk/2,y:Math.max(150,TKS.y-112)};
  const HO={x:(BDS.x+pw*sBd+TKS.x)/2,y:Math.min(500,BDS.y+PG.bd.h*sBd+10)};
  const at=(L,c)=>({x:L.x+L.s*c.x,y:L.y+L.s*c.y});
  const s0=sBk*.93;
  Object.keys(PG).forEach(k=>{const b=BOOK(k,s0,(SW-pw*s0)/2,by+ph*(sBk-s0)/2);PG[k].tr=new Track({x:b.x,y:b.y,s:b.s,ry:0,o:1});PG[k].el.style.zIndex=String(10-DEPTH[k]);});
  /* overlays */
  const fxs=[];
  const mkFx=(cls,html,box,init)=>{const e=div('wk-o '+cls,html);if(box){e.style.left=f2(box.x)+'px';e.style.top=f2(box.y)+'px';if(box.w!=null)e.style.width=f2(box.w)+'px';if(box.h!=null)e.style.height=f2(box.h)+'px';}Lfx.appendChild(e);
    const fx={el:e,tr:new Track(Object.assign({o:0,s:1,dy:0},init||{}))};fxs.push(fx);return fx;};
  const pulse=(fx,t0,dur,s)=>{fx.tr.move(t0,t0+.3,{o:1,s:s||1});fx.tr.move(t0+Math.max(.35,dur-.4),t0+dur,{o:0});};
  const glowAt=(L,r,pad,t0,dur,round)=>{const p=pad||6;const g=mkFx('wk-glow'+(round?' round':''),'',{x:L.x+L.s*r.x-p,y:L.y+L.s*r.y-p,w:L.s*r.w+2*p,h:L.s*r.h+2*p});pulse(g,t0,dur);return g;};
  const veil={el:Lveil,tr:new Track({o:0,s:1,dy:0})};fxs.push(veil);
  const ringBox={x:RC.x-74,y:RC.y-74,w:148,h:148};
  const ringEl=mkFx('wk-ring','<svg viewBox="0 0 200 200" aria-hidden="true"><circle class="bg" cx="100" cy="100" r="84"/><circle class="fg" cx="100" cy="100" r="84" transform="rotate(-90 100 100)"/></svg><div class="wk-rt">2:00</div><div class="wk-rl">sped up for this video</div>',ringBox,{s:.7});
  const ring={fx:ringEl,fg:ringEl.el.querySelector('.fg'),t:ringEl.el.querySelector('.wk-rt'),ints:[],C:2*Math.PI*84};
  const chip=mkFx('wk-chip','<span class="wk-ct">'+F.chipTok+'</span><span><b>1 token</b> for every<br><b>2 minutes</b> of working</span>',{x:RC.x-185,y:12,w:370},{s:.8});
  const noTok=mkFx('wk-note2','No token this interval:<br>the ring starts again',{x:RC.x-84-236,y:RC.y-44,w:236},{s:.9});
  const bubbles=[];const bubble=(i,text,t0,dur)=>{const c=at(BDS,ctr(M.slot[i]));const b=mkFx('wk-bub',esc(text),{x:clamp(c.x-150,10,SW-310),y:c.y-M.slot[i].h*sBd/2-112,w:300},{s:.6,dy:12});
    b.tr.move(t0,t0+.3,{o:1,s:1,dy:0},0,easeOut);b.tr.move(t0+dur-.3,t0+dur,{o:0,dy:-8});bubbles.push(b);return b;};
  const tipsCard=mkFx('wk-tips','<h3>Three tips</h3>'+'<div class="wk-tip" data-i="0"><b>1</b><p><strong>Make the tokens valuable first.</strong> Give a token and exchange it right away, several times, before you ask for any work.</p></div>'
    +'<div class="wk-tip" data-i="1"><b>2</b><p><strong>Start small.</strong> Ask for a little behavior per token, then raise it slowly; if the behavior falls apart, go back a step.</p></div>'
    +'<div class="wk-tip" data-i="2"><b>3</b><p><strong>Only through the board.</strong> Keep the Then item put away at other times.</p></div>',{x:520,y:44,w:720},{dy:16});
  const tipRows=[...tipsCard.el.querySelectorAll('.wk-tip')].map(e=>{const fx={el:e,tr:new Track({o:0,s:1,dy:14})};fxs.push(fx);return fx;});
  const cyc=mkFx('wk-cyc','',{x:90,y:478,w:1100});
  const cycItems=['Choose','Set the target','Earn the tokens','Exchange'].map((w,i)=>{const e=div('wk-cy','<b>'+(i+1)+'</b>'+esc(w));cyc.el.appendChild(e);if(i<3)cyc.el.appendChild(div('wk-cya','→'));const fx={el:e,tr:new Track({o:0,s:.85,dy:10})};fxs.push(fx);return fx;});

  /* ---- choreography helpers (stage coordinates) ---- */
  const grip=(c,p,s,who)=>{const g=who==='learner'?[-.08,.46]:[.08,.46];return{x:p.x+c.w*s*g[0],y:p.y+c.h*s*g[1]};};
  const pointAt=(p,s)=>({x:p.x,y:p.y+CW*s*.12});
  const handTo=(h,t0,t1,p,arc)=>{h.tr.move(t0,t1,{x:p.x,y:p.y},arc==null?.14:arc);};
  const offFrom=(p,sx,sy)=>{const dx=sx-p.x,dy=sy-p.y,len=Math.hypot(dx,dy)||1,k=(SH+330-p.y)/Math.max(.2,dy/len);return{x:p.x+dx/len*k,y:p.y+dy/len*k};};
  const enter=(h,t0,t1,p,pose,sh)=>{const o=offFrom(p,sh[0],sh[1]);h.tr.set(t0,{x:o.x,y:o.y,sx:sh[0],sy:sh[1],s:1});h.pose.set(t0,pose);h.tr.move(t0,t1,{x:p.x,y:p.y},.04);};
  const leave=(h,t0,t1)=>{const s=h.tr.at(t0);const o=offFrom(s,s.sx,s.sy);h.tr.move(t0,t1,{x:o.x,y:o.y},0);};
  const take=(c,h,t)=>{const cp=c.tr.at(t),hp=h.tr.at(t);c.fol.push({t0:t,t1:1e9,h,dx:cp.x-hp.x,dy:cp.y-hp.y});c.where.set(t,'fly');};
  const release=(c,t)=>{const f=c.fol[c.fol.length-1];if(!f||f.t1<1e9)return;f.t1=t;const hp=f.h.tr.at(t);c.tr.set(t,{x:hp.x+f.dx,y:hp.y+f.dy});};
  const carryTo=(c,h,t0,t1,dst,arc)=>{const f=c.fol[c.fol.length-1];handTo(h,t0,t1,{x:dst.x-f.dx,y:dst.y-f.dy},arc==null?.18:arc);};
  const cardPos=(c,t)=>{for(const f of c.fol)if(t>=f.t0&&t<f.t1){const hp=f.h.tr.at(t);return{x:hp.x+f.dx,y:hp.y+f.dy};}return c.tr.at(t);};
  const pageTurn=(k,t0,t1,back)=>{const p=PG[k];if(back){p.tr.set(t0,{o:1});p.tr.move(t0,t1,{ry:0},0,easeOut);}else{p.tr.move(t0,t1,{ry:-90},0,u=>u*u*(3-2*u));p.tr.set(t1,{o:0});}};
  const stackTo=(t0,t1,fn)=>{['tk','bd','tg','ch'].forEach((k,i)=>PG[k].tr.move(t0+(3-i)*.03,t1,fn(k)));};
  let session=false,ringPending=null;
  const toSession=(t0,dur)=>{PG.bd.tr.move(t0,t0+dur,BDS);PG.tk.tr.move(t0+.15,t0+dur,TKS,.05);session=true;};
  const toBook=(t0,dur)=>{PG.bd.tr.move(t0,t0+dur,BOOK('bd'));PG.tk.tr.move(t0,t0+dur-.1,BOOK('tk'),.05);session=false;};
  const ringInt=(t0,t1,ok)=>{ring.ints.push({t0,t1,ok});};
  /* a token from the Tokens page to the Board: the teacher's hand takes it and holds it out with praise; the learner's hand takes it and puts it in its slot */
  const SHT=[1130,SH+480],SHL=[300,SH+480];
  const deliver=(i,o)=>{const c=TK[i],src=at(TKS,ctr(M.ybx[i])),dst=at(BDS,ctr(M.slot[i]));
    enter(HT,o.t0,o.grab,grip(c,src,sTk,'teacher'),'pinch',SHT);
    c.tr.set(o.grab,{x:src.x,y:src.y,s:sTk,l:0,o:1});take(c,HT,o.grab);c.tr.move(o.grab,o.grab+.25,{l:1});c.tr.move(o.grab+.25,o.atHO,{s:sBd});
    carryTo(c,HT,o.grab+.05,o.atHO,HO,.16);
    if(o.text)bubble(i,o.text,o.bub==null?o.atHO:o.bub,o.bubDur||2.2);
    const tk=o.take;const hp=grip(c,cardPos(c,tk),sBd,'learner');enter(HL,tk-(o.lin||.75),tk,hp,'pinch',SHL);
    release(c,tk);take(c,HL,tk);leave(HT,tk+.08,tk+.8);
    carryTo(c,HL,tk+.05,o.place,dst);release(c,o.place);c.tr.move(o.place,o.place+.22,{l:0});c.where.set(o.place+.22,'bd');
    leave(HL,o.place+.3,o.place+1);return o.place+1;};

  /* ---- the scenes, one per narration line; each returns the time its animation needs ---- */
  const SC={};
  SC.intro=K=>{stackTo(K.t,K.t+1.6,k=>BOOK(k));
    const names=[['Choices','ch',.62],['Targets','tg',.72],['Board','bd',.82],['Tokens','tk',.92]];let last=K.t+1.8;
    const after=K.text.toLowerCase().indexOf('tab');
    names.forEach(([w,k,fr])=>{const t=Math.max(K.t+1.8,K.at(w,fr,after));const L=BOOK(k);glowAt(L,M.tab[k],5,t,1.6);last=Math.max(last,t+1.6);});
    const tb=Math.max(K.t+1.7,K.at('bound',.35));const L0=BOOK('ch');glowAt({x:L0.x,y:L0.y,s:L0.s},{x:-14,y:0,w:40,h:ph},4,tb,1.8);
    return last-K.t;};
  SC.ch_show=K=>{glowAt(BOOK('ch'),M.tab.ch,5,K.t+.2,1.6);const ids=CH.map((c,i)=>c?i:-1).filter(i=>i>=0);
    ids.forEach((i,j)=>{CH[i].pops.ch=(CH[i].pops.ch||[]).concat(K.t+K.d*(.3+.55*j/Math.max(1,ids.length)));});return K.d;};
  SC.ch_pick=K=>{const L=BOOK('ch'),c=cC,sh=[820,SH+480];const P0=at(L,ctr(M.ch[F.pick.ch]));
    const scan=[4,2,1,5].filter(i=>CH[i]&&i!==F.pick.ch).slice(0,3);
    const tp=Math.max(K.t+3.4,K.at('picks one',.48));
    const pts=scan.map(i=>pointAt(at(L,ctr(M.ch[i])),L.s));
    if(pts.length){enter(HL,K.t+.15,K.t+1.05,pts[0],'point',sh);const step=(tp-.7-(K.t+1.05))/pts.length;
      for(let j=1;j<pts.length;j++)handTo(HL,K.t+1.05+step*(j-1)+.25,K.t+1.05+step*j,pts[j]);
      handTo(HL,tp-.75,tp-.05,grip(c,P0,L.s,'learner'),.12);}
    else enter(HL,tp-1,tp-.05,grip(c,P0,L.s,'learner'),'point',sh);
    HL.pose.set(tp-.2,'pinch');
    c.tr.set(tp,{x:P0.x,y:P0.y,s:L.s,l:0,o:1});take(c,HL,tp);c.tr.move(tp,tp+.35,{l:1});
    carryTo(c,HL,tp+.4,tp+1.7,TR,.2);release(c,tp+1.7);c.tr.move(tp+1.7,tp+1.95,{l:0});
    leave(HL,tp+2.05,tp+2.85);return tp+2.95-K.t;};
  SC.tg_show=K=>{pageTurn('ch',K.t+.15,K.t+1.05);glowAt(BOOK('tg'),M.tab.tg,5,K.t+.9,1.6);
    const ids=TG.map((c,i)=>c?i:-1).filter(i=>i>=0);ids.forEach((i,j)=>{TG[i].pops.tg=(TG[i].pops.tg||[]).concat(K.t+1.2+(K.d-1.2)*(.3+.55*j/Math.max(1,ids.length)));});return Math.max(K.d,2);};
  SC.tg_pick=K=>{const L=BOOK('tg'),c=cT,sh=[380,SH+480];const P0=at(L,ctr(M.tg[F.pick.tg]));
    const other=[1,3].filter(i=>TG[i]&&i!==F.pick.tg)[0];const tp=Math.max(K.t+2.6,K.at('one target',.12)+1.4);
    if(other!=null){enter(HT,K.t+.2,K.t+1.1,pointAt(at(L,ctr(M.tg[other])),L.s),'point',sh);handTo(HT,tp-.8,tp-.05,grip(c,P0,L.s,'teacher'),.12);}
    else enter(HT,tp-1,tp-.05,grip(c,P0,L.s,'teacher'),'point',sh);
    HT.pose.set(tp-.2,'pinch');c.tr.set(tp,{x:P0.x,y:P0.y,s:L.s,l:0,o:1});take(c,HT,tp);c.tr.move(tp,tp+.35,{l:1});
    carryTo(c,HT,tp+.4,tp+1.4,TL,.2);release(c,tp+1.4);c.tr.move(tp+1.4,tp+1.65,{l:0});leave(HT,tp+1.75,tp+2.55);return tp+2.65-K.t;};
  SC.bd_place=K=>{pageTurn('tg',K.t+.15,K.t+1.05);const L=BOOK('bd');glowAt(L,M.tab.bd,5,K.t+.9,1.4);
    const t1=Math.max(K.t+1.9,K.at('target under first',.2)+.4);const shT=[380,SH+480],shL=[900,SH+480];
    enter(HT,t1-.9,t1,grip(cT,TL,L.s,'teacher'),'pinch',shT);take(cT,HT,t1);cT.tr.move(t1,t1+.3,{l:1});
    const dF=at(L,ctr(M.first));carryTo(cT,HT,t1+.3,t1+1.35,dF);release(cT,t1+1.35);cT.tr.move(t1+1.35,t1+1.6,{l:0});cT.where.set(t1+1.6,'bd');leave(HT,t1+1.7,t1+2.5);
    const t2=Math.max(t1+1.6,K.at('chosen item',.42)-.2);
    enter(HL,t2-.9,t2,grip(cC,TR,L.s,'learner'),'pinch',shL);take(cC,HL,t2);cC.tr.move(t2,t2+.3,{l:1});
    const dT=at(L,ctr(M.then));carryTo(cC,HL,t2+.3,t2+1.35,dT);release(cC,t2+1.35);cC.tr.move(t2+1.35,t2+1.6,{l:0});cC.where.set(t2+1.6,'bd');leave(HL,t2+1.7,t2+2.5);
    const g1=Math.max(t2+1.8,K.at('first the work',.8)),g2=Math.max(g1+.7,K.at('then the item',.9));glowAt(L,M.first,6,g1,1.5);glowAt(L,M.then,6,g2,1.5);
    return Math.max(t2+2.6,g2+1.5)-K.t;};
  SC.tk_page=K=>{toSession(K.t+.15,1.4);const t1=Math.max(K.t+1.7,K.at('where the tokens wait',.4));
    TK.forEach((c,i)=>{c.pops.tk=[t1+i*.18];});const t2=Math.max(t1+.4+n*.18,K.at('empty slots',.62));
    M.slot.forEach((r,i)=>glowAt(BDS,r,4,t2+i*.2,1.3));return Math.max(K.d,t2+n*.2+1.3-K.t);};
  SC.rule=K=>{let t=K.t;if(!session){toSession(t+.1,1.4);t+=1.4;}chip.tr.move(t+.3,t+.7,{o:1,s:1},0,easeOut);return t+1-K.t;};
  SC.start=K=>{const sh=[1110,SH+480];const pF=pointAt(at(BDS,ctr(M.first)),sBd),pT=pointAt(at(BDS,ctr(M.then)),sBd);
    const tp1=Math.max(K.t+1,K.at('point to the board',.25)+.5),tp2=Math.max(tp1+1,K.at('then the item',.45));
    enter(HT,tp1-.9,tp1,pF,'point',sh);handTo(HT,tp2-.6,tp2,pT,.12);leave(HT,tp2+.6,tp2+1.4);
    glowAt(BDS,M.first,6,tp1-.1,1.3);glowAt(BDS,M.then,6,tp2-.1,1.3);
    const tr0=Math.max(tp2+.3,K.at('the ring',.62));ringEl.tr.move(tr0,tr0+.45,{o:1,s:1},0,easeOut);ringPending=tr0+.6;
    return tr0+1.6-K.t;};
  SC.tok_first=K=>{const tEnd=K.t+.6;ringInt(ringPending==null?K.t-3:ringPending,tEnd,true);ringPending=null;
    const grab=tEnd+.75,atHO=grab+1;const bub=Math.max(atHO+.1,K.at('great working',.62)-.3);const tk=Math.max(bub+1.1,K.at('places it',.86));
    const end=deliver(0,{t0:tEnd-.1,grab,atHO,text:'Great working!',bub,bubDur:Math.max(2.4,tk-bub+.6),take:tk,place:tk+1,lin:.9});
    return end-K.t+.2;};
  SC.tok_none=K=>{const t1=K.t+.3+Math.min(3.6,Math.max(2.4,K.d*.45));ringInt(K.t+.3,t1,false);noTok.tr.move(t1,t1+.3,{o:1,s:1},0,easeOut);noTok.tr.move(t1+2.4,t1+2.8,{o:0});return Math.max(K.d,t1+2.9-K.t);};
  SC.tok_more=K=>{const idx=[];for(let i=1;i<n-1;i++)idx.push(i);if(!idx.length)return K.d;
    const cy=clamp((K.d+.4)/idx.length,2.9,4),ri=cy-1.4;let T=K.t+.25,end=K.t;
    idx.forEach((i,j)=>{ringInt(T,T+ri,true);const D=T+ri;end=deliver(i,{t0:D-.05,grab:D+.5,atHO:D+1.05,text:PRAISE[j%PRAISE.length],bubDur:1.7,take:D+1.25,place:D+1.85,lin:.7});T+=cy;});
    return end-K.t+.1;};
  SC.tok_last=K=>{const i=n-1,T=K.t+.2,ri=2.2;ringInt(T,T+ri,true);const D=T+ri;
    const tk=F.term?Math.max(D+2.6,K.at('board is finished',.6)):D+1.6;
    const end=deliver(i,{t0:D-.05,grab:D+.55,atHO:D+1.2,text:'You did it! Great working!',bub:F.term?tk-.2:D+1.2,bubDur:2.6,take:tk,place:tk+.9,lin:.8});
    if(F.term){const c=TK[i];c.glowT=[D+.6,tk+1.6];glowAt(BDS,M.slot[i],8,tk+.9,2,true);}
    else M.slot.forEach((r,j)=>glowAt(BDS,r,4,tk+1+j*.08,1.4));
    ringEl.tr.move(end+.2,end+.7,{o:0,s:.9});return end-K.t+.8;};
  SC.exchange=K=>{const t=K.t;chip.tr.move(t,t+.5,{o:0});ringEl.tr.move(t,t+.5,{o:0});veil.tr.move(t+.2,t+.8,{o:.32});
    const c=cC,P0=at(BDS,ctr(M.then)),CEN={x:640,y:292},big=sBd*1.5;
    c.tr.set(t+.3,{x:P0.x,y:P0.y,s:sBd,l:0,o:1});c.where.set(t+.3,'fly');c.tr.move(t+.3,t+.65,{l:1});c.tr.move(t+.65,t+1.6,{x:CEN.x,y:CEN.y,s:big},.1);
    const is=big*CW/IW;item.tr.set(t+1.45,{x:CEN.x,y:CEN.y,s:is,l:1,o:0});item.where.set(t+1.45,'fly');item.tr.move(t+1.45,t+2.05,{o:1});c.tr.move(t+1.45,t+2.05,{o:0});c.where.set(t+2.1,'none');
    const tg=Math.max(t+2.8,K.at('right away',.35));const PALM={x:590,y:452};
    enter(HT,tg-.9,tg,grip(item,CEN,is,'teacher'),'pinch',[1110,SH+480]);take(item,HT,tg);
    const pa=ART.learner.open;enter(HL,tg-.3,tg+.7,PALM,'open',[300,SH+480]);
    const drop={x:PALM.x+4,y:PALM.y-4};item.tr.move(tg,tg+1.2,{s:.54});carryTo(item,HT,tg+.1,tg+1.2,drop);
    release(item,tg+1.2);item.tr.move(tg+1.2,tg+1.45,{l:.25});take(item,HL,tg+1.25);leave(HT,tg+1.35,tg+2.1);
    return Math.max(K.d,tg+2.4-K.t);};
  SC.reset=K=>{const r=K.t;leave(HL,r+.2,r+1.1);item.where.set(r+1.15,'none');veil.tr.move(r+.2,r+.8,{o:0});
    const gap=Math.min(.22,1.6/n);TK.forEach((c,i)=>{const ts=r+1+i*gap,sp=at(BDS,ctr(M.slot[i])),dp=at(TKS,ctr(M.ybx[i]));c.tr.set(ts,{x:sp.x,y:sp.y,s:sBd,l:0,o:1});c.where.set(ts,'fly');
      c.tr.move(ts,ts+.2,{l:1});c.tr.move(ts+.2,ts+.85,{x:dp.x,y:dp.y,s:sTk},.22);c.tr.move(ts+.85,ts+1,{l:0});c.where.set(ts+1,'tk');});
    let t=r+1+(n-1)*gap+1.1;toBook(t,1.1);t+=1.15;
    const fB=at(BOOK('bd'),ctr(M.first));cT.tr.set(t,{x:fB.x,y:fB.y,s:sBk,l:0,o:1});cT.where.set(t,'fly');cT.tr.move(t,t+.25,{l:1});cT.tr.move(t+.25,t+.9,{x:TL.x,y:TL.y},.15);
    cC.tr.set(t,{x:TR.x+60,y:SH+170,s:sBk,l:1,o:1});cC.where.set(t,'fly');cC.tr.move(t+.1,t+.9,{x:TR.x,y:TR.y},.1);
    t+=.95;pageTurn('tg',t,t+.85,true);t+=.9;
    const pT=at(BOOK('tg'),ctr(M.tg[F.pick.tg]));cT.tr.move(t,t+.7,{x:pT.x,y:pT.y},.15);cT.tr.move(t+.7,t+.9,{l:0});cT.where.set(t+.9,'tg');t+=.95;
    pageTurn('ch',t,t+.85,true);t+=.9;
    const pC=at(BOOK('ch'),ctr(M.ch[F.pick.ch]));cC.tr.move(t,t+.7,{x:pC.x,y:pC.y},.15);cC.tr.move(t+.7,t+.9,{l:0});cC.where.set(t+.9,'ch');t+=1;
    const L=BOOK('ch'),pts=[2,F.pick.ch,4].filter(i=>CH[i]).map(i=>pointAt(at(L,ctr(M.ch[i])),L.s));
    if(pts.length){enter(HL,t,t+.8,pts[0],'point',[820,SH+480]);for(let j=1;j<pts.length;j++)handTo(HL,t+.8+(j-1)*.75+.15,t+.8+j*.75,pts[j]);t+=.8+(pts.length-1)*.75+.3;leave(HL,t,t+.8);t+=.8;}
    return Math.max(K.d,t-K.t);};
  SC.tips=K=>{const t=K.t;stackTo(t,t+1,k=>BOOK(k,.52,40,170));tipsCard.tr.move(t+.5,t+1,{o:1,dy:0},0,easeOut);
    const fr=[['valuable',.06],['small requirement',.42],['only through the board',.8]];
    tipRows.forEach((fx,i)=>{const tt=Math.max(t+.9+i*.4,K.at(fr[i][0],fr[i][1])-.3);fx.tr.move(tt,tt+.45,{o:1,dy:0},0,easeOut);});return Math.max(K.d,2.5);};
  SC.outro=K=>{const t=K.t;tipsCard.tr.move(t,t+.5,{o:0,dy:10});stackTo(t+.2,t+1.4,k=>BOOK(k,Math.min(.7,430/maxH),null,24));cyc.tr.move(t+.6,t+.9,{o:1});
    const after=K.text.toLowerCase().indexOf('cycle');const w=[['choose',.3],['set the target',.42],['earn',.55],['exchange',.68]];let last=t+1;
    cycItems.forEach((fx,i)=>{const tt=Math.max(t+1+i*.35,K.at(w[i][0],w[i][1],after)-.1);fx.tr.move(tt,tt+.4,{o:1,s:1,dy:0},0,easeOut);last=tt;});
    return Math.max(K.d,last+1.2-K.t);};

  /* ---- the timeline ---- */
  const ids=LIST.map(id=>id==='tok_last'&&F.term?'tok_last_term':id).filter(id=>!OPT[id]||present(id));
  let T=0;const cues=[];
  ids.forEach(id=>{const ln=line(id),low=ln.t.toLowerCase();
    const K={id,t:T,d:ln.d,text:ln.t,at:(ph,fr,from)=>{const i=low.indexOf(String(ph).toLowerCase(),from>0?from:0);return T+ln.d*(i<0?fr:i/Math.max(1,low.length));}};
    const need=(SC[id==='tok_last_term'?'tok_last':id](K))||0;const dur=Math.max(ln.d+PAUSE,need+.1);
    cues.push({id,start:T,dur,narr:ln.d,text:ln.t,chapter:CHOF[id],chunks:chunks(ln.t,ln.d,T),a:ln.a});T+=dur;});
  const chapters=CHAPS.map(([id,label])=>{const c=cues.find(q=>q.chapter===id);return{id,label,start:c?c.start:0};});
  return{D:T,cues,chapters,PG,cards,hands,fxs,ring,cap,notes,item,F};
}
/* captions: a line in pieces of up to two caption lines, each shown for its share of the narration */
function chunks(text,d,T){const parts=(text.match(/[^.!?]+[.!?]+["”]?\s*|[^.!?]+$/g)||[text]).map(s=>s.trim()).filter(Boolean);const out=[];
  parts.forEach(p=>{if(p.length<=120){out.push(p);return;}const mid=p.length/2;let best=-1;p.replace(/[,;:] /g,(m,i)=>{if(best<0||Math.abs(i-mid)<Math.abs(best-mid))best=i;return m;});if(best<0){out.push(p);return;}out.push(p.slice(0,best+1));out.push(p.slice(best+2));});
  const merged=[];out.forEach(p=>{const L=merged[merged.length-1];if(L&&(L+' '+p).length<=96)merged[merged.length-1]=L+' '+p;else merged.push(p);});
  const total=merged.reduce((a,p)=>a+p.length,0)||1;let acc=0;return merged.map(p=>{const c={t:T+d*acc/total,text:p};acc+=p.length;return c;});}

/* ---------------- renderAt: the stage at time t ---------------- */
let RMQ=null;const reduced=()=>{try{RMQ=RMQ||window.matchMedia('(prefers-reduced-motion: reduce)');return !!RMQ.matches;}catch(e){return false;}};
function cueAt(t){if(!B)return null;const c=B.cues;let lo=0,hi=c.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(c[m].start<=t)lo=m;else hi=m-1;}return c[lo];}
function renderAt(t){if(!B)build();if(!B)return;t=clamp(+t||0,0,B.D);const cue=cueAt(t);
  const v=reduced()&&cue?Math.min(B.D,cue.start+cue.dur-.02):t;
  for(const k in B.PG){const p=B.PG[k],s=p.tr.at(v);css(p.el,'transform','translate('+f2(s.x)+'px,'+f2(s.y)+'px) scale('+s.s.toFixed(4)+')'+(s.ry?' rotateY('+f2(s.ry)+'deg)':''));
    css(p.el,'opacity',f2(s.o));css(p.el,'visibility',s.o>.001&&s.ry>-89.5?'visible':'hidden');css(p.shade,'opacity',f2(clamp(-s.ry/90,0,1)*.5));}
  for(const c of B.cards){const w=c.where.at(v).v;
    for(const k in c.inp){const e=c.inp[k];const on=w===k;css(e,'opacity',on?'1':'0');let sc=1;const pp=c.pops[k];if(on&&pp)for(const p of pp)sc=Math.max(sc,1+.08*bump(v,p,.6));css(e,'transform',sc!==1?'scale('+sc.toFixed(4)+')':'none');}
    if(!c.el)continue;
    const s=c.tr.at(v),p=cardPosOf(c,v),k=s.s*(1+.07*s.l),fl=w==='fly';
    css(c.el,'visibility',fl?'visible':'hidden');css(c.el,'opacity',fl?f2(s.o):'0');css(c.el,'transform','translate('+f2(p.x-c.w/2)+'px,'+f2(p.y-c.h/2)+'px) scale('+k.toFixed(4)+')');
    css(c.sh,'transform','translate('+f2(4+14*s.l)+'px,'+f2(5+20*s.l)+'px)');css(c.sh,'opacity',f2(.35+.3*s.l));
    if(c.glow){const g=c.glowT;css(c.glow,'opacity',g&&v>=g[0]&&v<=g[1]?f2(.55+.45*Math.sin((v-g[0])*5)):'0');}}
  for(const h of B.hands){const s=h.tr.at(v),ps=h.pose.at(v),ang=Math.atan2(s.x-s.sx,s.sy-s.y)*180/Math.PI,sc=h.base*s.s,u=clamp(ps.since/.14,0,1);
    const vis=s.y<SH+260;
    for(const name in h.poses){const P=h.poses[name];const o=name===ps.v?(ps.prev===name?1:u):name===ps.prev&&ps.prev!==ps.v?1-u:0;
      css(P.el,'opacity',f2(vis?o:0));css(P.el,'visibility',vis&&o>.001?'visible':'hidden');
      css(P.el,'transform','translate('+f2(s.x-P.ax)+'px,'+f2(s.y-P.ay)+'px) rotate('+f2(ang)+'deg) scale('+sc.toFixed(4)+')');}}
  for(const fx of B.fxs){const s=fx.tr.at(v);css(fx.el,'opacity',f2(s.o));css(fx.el,'visibility',s.o>.001?'visible':'hidden');css(fx.el,'transform',s.dy||s.s!==1?'translate(0,'+f2(s.dy)+'px) scale('+s.s.toFixed(4)+')':'none');}
  /* the timer ring */
  const R=B.ring;let p=0,state='idle';for(const I of R.ints){if(v>=I.t0&&v<I.t1){p=(v-I.t0)/(I.t1-I.t0);state='run';break;}if(v>=I.t1&&v<I.t1+.8){p=1;state=I.ok?'ok':'no';}}
  css(R.fg,'strokeDasharray',f2(R.C));css(R.fg,'strokeDashoffset',f2(R.C*(1-p)));css(R.fg,'stroke',state==='ok'?'#2f9e44':state==='no'?'#8c97a1':'#f08c00');
  const rem=Math.round(120*(1-(state==='run'?p:state==='idle'?0:1)));txt(R.t,state==='ok'?'✓':state==='no'?'–':Math.floor(rem/60)+':'+String(rem%60).padStart(2,'0'));
  /* captions follow the real time, also with reduced motion */
  let ct='';if(cue){for(const ch of cue.chunks)if(ch.t<=t+.001)ct=ch.text;}
  txt(B.cap,ct);css(B.cap,'visibility',ct?'visible':'hidden');const D=dom();if(D&&D.cap2)txt(D.cap2,ct);
  B.t=t;}
function cardPosOf(c,t){for(const f of c.fol)if(t>=f.t0&&t<f.t1){const hp=f.h.tr.at(t);return{x:hp.x+f.dx,y:hp.y+f.dy};}return c.tr.at(t);}

/* ---------------- the player: clock, narration, controls ---------------- */
let pos=0,playing=false,want=false,raf=0,soundOn=true,capsOn=true,busy=false;
const AU={ctx:null,gain:null,bufs:null,decoding:null,srcs:[],mode:'off',base:0,pos0:0,susp:false,webFail:false,html:{},cur:'',spoken:''};
function toAB(uri){const b=atob(uri.slice(uri.indexOf(',')+1));const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer;}
function ctx(){if(AU.ctx)return AU.ctx;const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;try{AU.ctx=new C();AU.gain=AU.ctx.createGain();AU.gain.connect(AU.ctx.destination);}catch(e){AU.ctx=null;}return AU.ctx;}
function decodeAll(){if(AU.decoding)return AU.decoding;const L=audioLines()||{};AU.bufs={};
  AU.decoding=Promise.all(Object.keys(L).map(id=>new Promise(res=>{const a=L[id]&&L[id].a;if(!a){res();return;}let done=false;const fin=b=>{if(done)return;done=true;if(b)AU.bufs[id]=b;res();};
    try{const pr=AU.ctx.decodeAudioData(toAB(a),fin,()=>fin(null));if(pr&&pr.then)pr.then(fin,()=>fin(null));}catch(e){fin(null);}}))).then(()=>{if(!Object.keys(AU.bufs).length)AU.webFail=true;});
  return AU.decoding;}
function mode(){if(!soundOn)return 'off';const L=audioLines();if(L){if(!AU.webFail&&ctx())return 'web';try{if(typeof Audio!=='undefined'&&htmlEl().canPlayType('audio/mpeg'))return 'html';}catch(e){}}
  if(window.speechSynthesis&&window.SpeechSynthesisUtterance)return 'speech';return 'off';}
function clock(){if(!playing)return pos;return AU.mode==='web'&&AU.ctx?AU.pos0+(AU.ctx.currentTime-AU.base):AU.pos0+(performance.now()/1000-AU.base);}
function stopAudio(){AU.srcs.forEach(s=>{try{s.stop();}catch(e){}});AU.srcs=[];AU.susp=false;
  if(AU.html.el)try{AU.html.el.pause();}catch(e){}AU.cur='';try{if(window.speechSynthesis&&AU.mode==='speech')speechSynthesis.cancel();}catch(e){}}
function schedule(from){const c=AU.ctx;B.cues.forEach(q=>{const b=AU.bufs&&AU.bufs[q.id];if(!b||q.start+b.duration<=from)return;const s=c.createBufferSource();s.buffer=b;s.connect(AU.gain);
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
function play(){if(!B)build();if(!B||want)return;want=true;if(pos>=B.D-.05){pos=0;stopAudio();}
  try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch(e){}
  if(mode()==='web'){const c=AU.ctx;try{const r=c.resume();if(r&&r.catch)r.catch(()=>{});}catch(e){}
    try{const b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0);}catch(e){}
    if(!AU.bufs||!AU.ready){busy=true;ui();decodeAll().then(()=>{AU.ready=true;busy=false;if(want)begin();else ui();});return;}}
  begin();}
function begin(){const m=mode();
  if(m==='web'&&AU.mode==='web'&&AU.susp&&Math.abs(pos-AU.suspPos)<1e-6){AU.susp=false;try{AU.ctx.resume();}catch(e){}playing=true;loop();ui();return;}
  stopAudio();AU.mode=m;AU.pos0=pos;playing=true;
  if(m==='web'){try{AU.ctx.resume();}catch(e){}AU.base=AU.ctx.currentTime;schedule(pos);}else AU.base=performance.now()/1000;
  if(m==='html'||m==='speech')tickAudio(pos);   /* the first sound starts inside the Play tap (iOS) */
  loop();ui();}
function loop(){cancelAnimationFrame(raf);const f=()=>{if(!playing)return;let t=clock();
    if(t>=B.D){pos=B.D;renderAt(pos);stop(false);pos=B.D;ui();return;}
    if(AU.mode==='html'||AU.mode==='speech')tickAudio(t);renderAt(t);uiTime(t);raf=requestAnimationFrame(f);};raf=requestAnimationFrame(f);}
/* stop(hard): pause; a soft pause of the Web Audio narration suspends the context so Play continues it */
function stop(hard){want=false;busy=false;if(playing){pos=clock();playing=false;cancelAnimationFrame(raf);}
  if(!hard&&AU.mode==='web'&&AU.ctx&&AU.srcs.length){try{AU.ctx.suspend();}catch(e){}AU.susp=true;AU.suspPos=pos;}else stopAudio();}
function pause(){stop(false);if(B)renderAt(pos);ui();}
function seek(t){if(!B)build();if(!B)return;const was=want;stop(true);pos=clamp(+t||0,0,B.D);renderAt(pos);uiTime(pos);if(was)play();else ui();}
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
  if(D.big){D.big.hidden=pl;D.big.setAttribute('aria-label',B&&pos>=B.D-.05?'Play the walkthrough again':pos>0?'Continue the walkthrough':'Play the walkthrough');}
  if(D.snd){D.snd.innerHTML=(soundOn?IC.snd:IC.mute)+'<span>Sound</span>';D.snd.setAttribute('aria-pressed',String(soundOn));D.snd.setAttribute('aria-label',soundOn?'Sound on':'Sound off');}
  if(D.cc){D.cc.setAttribute('aria-pressed',String(capsOn));D.player.classList.toggle('wk-nocap',!capsOn);}
  if(D.fs){const f=isFs();D.fs.innerHTML=(f?IC.fsx:IC.fs)+'<span>'+(f?'Exit full screen':'Full screen')+'</span>';D.fs.setAttribute('aria-label',f?'Exit full screen':'Full screen');}
  uiTime(pos);}
let lastSec=-1,lastCh='';
function uiTime(t){const D=dom();if(!D||!B)return;if(D.seek&&document.activeElement!==D.seek||D.seek&&!want)D.seek.value=String(Math.round(t*10)/10);
  const s=Math.floor(t);if(s!==lastSec){lastSec=s;txt(D.time,mmss(t)+' / '+mmss(B.D));if(D.seek)D.seek.setAttribute('aria-valuetext',mmss(t)+' of '+mmss(B.D));}
  let ch=B.chapters[0].id;for(const c of B.chapters)if(c.start<=t+.01)ch=c.id;
  if(ch!==lastCh){lastCh=ch;D.chaps.querySelectorAll('button').forEach(b=>{const on=b.dataset.ch===ch;b.setAttribute('aria-current',on?'step':'false');});}}
function uiBuilt(){const D=dom();if(!D||!B)return;D.seek.max=String(Math.round(B.D*10)/10);lastSec=-1;lastCh='';
  D.chaps.innerHTML=B.chapters.map(c=>'<button type="button" data-ch="'+c.id+'" aria-current="false" aria-label="Chapter: '+esc(c.label)+'">'+esc(c.label)+'</button>').join('');
  if(D.note){D.note.textContent=B.notes.join(' ');D.note.hidden=!B.notes.length;}
  if(D.tx)D.tx.innerHTML=B.chapters.map(ch=>'<h4>'+esc(ch.label)+'</h4>'+B.cues.filter(c=>c.chapter===ch.id).map(c=>'<p>'+esc(c.text)+'</p>').join('')).join('');}
function isFs(){const D=dom();const e=document.fullscreenElement||document.webkitFullscreenElement;return !!(D&&(e===D.player||D.player.classList.contains('wk-fs')));}
function fullscreen(){const D=dom();if(!D)return;const p=D.player;
  if(isFs()){if(p.classList.contains('wk-fs')){p.classList.remove('wk-fs');document.documentElement.classList.remove('wk-fs-on');}else{(document.exitFullscreen||document.webkitExitFullscreen||function(){}).call(document);}setTimeout(()=>{fit();ui();},60);return;}
  const rq=p.requestFullscreen||p.webkitRequestFullscreen;let ok=false;
  if(rq){try{const r=rq.call(p);ok=true;if(r&&r.catch)r.catch(()=>{p.classList.add('wk-fs');document.documentElement.classList.add('wk-fs-on');fit();ui();});}catch(e){ok=false;}}
  if(!ok){p.classList.add('wk-fs');document.documentElement.classList.add('wk-fs-on');}setTimeout(()=>{fit();ui();},60);}
/* the stage is drawn at 1280 x 720 and scaled to the width of the view (in full screen, to fit the screen) by one transform */
function fit(){const D=dom();if(!D)return;const f=isFs();let k;
  if(f){const bar=(D.player.querySelector('.wk-bar')||{}).offsetHeight||60,chs=D.chaps.offsetHeight||0;k=Math.max(.1,Math.min(window.innerWidth/SW,(window.innerHeight-bar-chs-24)/SH));D.frame.style.width=f2(SW*k)+'px';}
  else{D.frame.style.width='';k=Math.max(.1,(D.frame.clientWidth||SW)/SW);}
  css(D.stage,'transform','scale('+k.toFixed(5)+')');D.frame.style.height=f2(SH*k)+'px';D.player.classList.toggle('wk-small',k<.5);}
function wire(){const D=DOM;
  D.play.addEventListener('click',toggle);D.big.addEventListener('click',()=>{play();});
  D.restart.addEventListener('click',()=>{seek(0);if(!want)play();});
  /* dragging the bar while playing draws the frames and holds the sound; letting go plays on from there */
  let resume=false;D.seek.addEventListener('input',()=>{if(!B)return;if(want){resume=true;stop(true);}pos=clamp(+D.seek.value,0,B.D);renderAt(pos);uiTime(pos);});
  D.seek.addEventListener('change',()=>{if(resume){resume=false;play();}else ui();});
  D.cc.addEventListener('click',()=>{capsOn=!capsOn;ui();});
  D.snd.addEventListener('click',()=>{soundOn=!soundOn;if(want){const t=clock();seek(t);}else{stopAudio();AU.mode='off';}ui();});
  D.fs.addEventListener('click',fullscreen);
  D.chaps.addEventListener('click',e=>{const b=e.target.closest('button[data-ch]');if(!b||!B)return;const c=B.chapters.find(x=>x.id===b.dataset.ch);if(c)seek(c.start);});
  ['fullscreenchange','webkitfullscreenchange'].forEach(ev=>document.addEventListener(ev,()=>{setTimeout(()=>{fit();ui();},30);}));
  let lastW=-1;const onSize=()=>{const w=D.frame.clientWidth;if(w!==lastW){lastW=w;fit();}};
  if(window.ResizeObserver){new ResizeObserver(onSize).observe(D.player);}window.addEventListener('resize',()=>{lastW=-1;onSize();});
  window.addEventListener('orientationchange',()=>setTimeout(fit,200));
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&want)pause();});
  document.addEventListener('keydown',e=>{if(!document.body.classList.contains('view-walk')||e.altKey||e.ctrlKey||e.metaKey)return;const tg=e.target,tn=tg&&tg.tagName;
    if(tn==='INPUT'&&tg!==D.seek||tn==='TEXTAREA'||tn==='SELECT'||tg&&tg.isContentEditable)return;
    if(e.key===' '||e.key==='k'||e.key==='K'){if(tn==='BUTTON'&&e.key===' ')return;e.preventDefault();toggle();}
    else if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&tg!==D.seek){e.preventDefault();seek(clock()+(e.key==='ArrowLeft'?-5:5));}
    else if(e.key==='Escape'&&D.player.classList.contains('wk-fs')){fullscreen();}});}

/* ---------------- the view: leaving it pauses, entering it rebuilds from the current book ---------------- */
const setView0=setView;
setView=function(v){if(v!=='walk'&&(want||playing))pause();setView0(v);if(v==='walk'){try{build();}catch(e){console.error('Walkthrough: '+(e&&e.message||e));}fit();ui();}};
window.TKWALK={build,renderAt,play,pause,seek,toggle,
  get duration(){return B?B.D:0;},get cues(){return cuesOut();},get chapters(){return chapsOut();},
  get time(){return clock();},get playing(){return playing;},get audioMode(){return AU.mode;},get reduced(){return reduced();},
  get stage(){const D=dom();return D&&D.stage;}};
})();

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

/* ===== nbh-link (tools/blocks/nbh-link.js) ===== */
/* nbh-link (v21.43): the optional link between Form TK-1 (the token board book) and Form TE-1 (the token economy
   plan). One copy of this file is built into both forms (tools/forms/TK-1/build.sh, tools/blocks/patch-link.py),
   so the two cannot drift apart. Each form compares itself with the other when the user clicks (through the
   shell's read-only relay, or a file the other form saved when it is open alone) and takes only the items the
   user ticks. Compare only reads; fields change only on "Take the ticked items"; no form writes into the other.
   The link record is ONE JSON string in the form's own S.meta.lk (1800 characters at most, see pack()).
   Messages (the asker accepts 'answer' and 'opened' only from window.parent, only while it waits for that reply,
   and only for its partner; anything else is ignored and counted):
     form -> shell {nbh:'ask',want}            shell -> form {nbh:'answer',want,ok,title,snap:{total,data,own}}
     form -> shell {nbh:'open',want,beside}    shell -> form {nbh:'opened',want,ok[,why][,beside]}
   (beside:false in the 'opened' answer: the partner opened in place of the asker, as on a phone.)
   The form supplies an adapter to mount(): {me,other,meWhat,otherWhat,sibling,host,get(),set(str),view(otherS),
   rows(view),take(row),snapshot(),restore(json),after()} and, optionally: choose(key,i,view), which returns true when
   it handled a choice button itself (the row's tick stays) or 'reset' (handled, and the row's tick is let go);
   record(lk,{taken,kept,step}), called as the record is written after a compare or an Apply, with the rows taken,
   kept or found in step, so the form can note what they pair (TK-1's paired target card); noView, the message, or a
   function (partner's S, source) giving it, when view() refuses the partner; rpLine(pages), the words of the reprint
   line. Each row: {key,what,here,there,same?,owner:'there'|'here'|'',pre:['fill'|'changed'|'any'],can,keep (false: no
   Keep button),why,warn,info,preview} plus, where needed, block/fill/fillParts (whoRow), mirror (the partner can take
   this row's value from this form when it compares), choose {n,value} or {labels,on:[i]} (the choice buttons), seen
   (menuSeen hashes), took (the words for the took line), rp (pages to reprint), takeLabel, keptLabel (the words for a
   difference kept: "kept different" unless said), nobase (the record's mark for this key is about another item, so the
   row is compared without it). The record's kd and td hold the day a row was kept, or taken in part (a take that left
   it different); pb holds the hashes of the case's problem behaviors seen at a compare, so the problem-behavior guard
   (problem()) still knows them when the form is open on its own. A row with no what is an information line. Apply
   takes or keeps a row only while its value here is still the one the compare showed, and Undo is offered only while
   the record is still the one the take left. A compare that finds another student writes no in-step mark; those are
   written when "These are the same student" is applied. */
(function(){
'use strict';
if(window.NBHLink)return;
const isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const str=v=>v==null||typeof v==='object'?'':String(v);
const trim=v=>str(v).trim();
const val=v=>Array.isArray(v)?v.map(str).filter(Boolean).join('; '):str(v);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const escRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const HEX=/^[0-9a-f]{8}$/,RES=/^(step|who|empty|look \d{1,3}|kept \d{1,3}( part \d{1,3})?|part \d{1,3})$/,KEYS=['who','card','beh','n','tok','menu','sched'];
const MAX=1800;

/* NFKC does not fold an iPad's smart punctuation, so curly quotes and the dashes are folded to ' and - here */
function norm(s){s=str(s);try{s=s.normalize('NFKC');}catch(e){}return s.replace(/[\u2018\u2019\u02bc]/g,"'").replace(/[\u2010-\u2015\u2212]/g,'-').replace(/\s+/g,' ').trim().toLowerCase();}
/* FNV-1a, 32 bits, as 8 hex characters */
function hash(s){s=str(s);let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193);}return ('0000000'+(h>>>0).toString(16)).slice(-8);}
/* a near match: the shorter name (4 characters or more) starts the longer one, followed by a space, comma or "(".
   An equal pair is not "near"; it is equal. */
function near(a,b){a=norm(a);b=norm(b);if(!a||!b||a===b)return false;const s=a.length<b.length?a:b,l=s===a?b:a;
  return s.length>=4&&l.slice(0,s.length)===s&&/[ ,(]/.test(l.charAt(s.length));}
/* the words that name one of TK-1's drawn tokens */
const TOKWORD={star:'star',stars:'star',smiley:'smiley',smileys:'smiley',thumb:'thumb',thumbs:'thumb',check:'check',checks:'check',
  tick:'check',ticks:'check',coin:'coin',coins:'coin',medal:'medal',medals:'medal',trophy:'trophy',trophies:'trophy',heart:'heart',hearts:'heart'};
function tokKey(text){const w=norm(text).match(/[a-z]+/g)||[];for(const x of w)if(TOKWORD[x])return TOKWORD[x];return '';}
const plur=w=>/s$/.test(w)?[w]:/[^aeiou]y$/.test(w)?[w,w+'s',w.slice(0,-1)+'ies']:[w,w+'s',w+'es'];
/* the token form names the token: its name, the plural, or its stem as a whole word, ignoring case */
function tokSame(form,name,stem){const f=norm(form),n=norm(name),st=norm(stem)||tokKey(name);if(!f||(!n&&!st))return false;
  const ws=[].concat(n?plur(n):[],st?plur(st):[]);
  if(st&&tokKey(form)===st)return true;
  return ws.some(w=>new RegExp('(^|[^\\p{L}\\p{N}])'+escRe(w)+'($|[^\\p{L}\\p{N}])','u').test(f));}

/* ---- the link record ---- */
const cut=(v,n)=>typeof v==='string'?v.slice(0,n):'';
const okCard=v=>Number.isInteger(v)&&v>=0&&v<=5;
const hexes=(a,n)=>(Array.isArray(a)?a:[]).filter(h=>typeof h==='string'&&HEX.test(h)).slice(0,n);
function readLk(x){
  if(typeof x!=='string'||!x||x.length>2000)return null;
  let o=null;try{o=JSON.parse(x);}catch(e){return null;}
  if(!isObj(o)||o.v!==1)return null;
  const r={v:1,on:o.on===1?1:0,base:{}};
  if(okCard(o.card))r.card=o.card;
  if(isObj(o.last)&&typeof o.last.when==='string'&&!isNaN(Date.parse(o.last.when))){const l=o.last;
    r.last={when:cut(l.when,40),via:l.via==='shell'?'shell':'file',file:cut(l.file,120),saved:cut(l.saved,40),res:RES.test(l.res||'')?l.res:'',nm:cut(l.nm,160)};}
  if(isObj(o.base))KEYS.forEach(k=>{const b=o.base[k];if(Array.isArray(b)&&b.length===2&&HEX.test(b[0])&&HEX.test(b[1]))r.base[k]=[b[0],b[1]];});
  ['kd','td'].forEach(f=>{if(!isObj(o[f]))return;const d={};KEYS.forEach(k=>{if(/^\d{4}-\d{2}-\d{2}$/.test(o[f][k]||''))d[k]=o[f][k];});if(Object.keys(d).length)r[f]=d;});
  if(Array.isArray(o.menuSeen))r.menuSeen=hexes(o.menuSeen,10);
  {const pb=hexes(o.pb,12);if(pb.length)r.pb=pb;}
  if(typeof o.took==='string'&&o.took)r.took=o.took.slice(0,160);
  if(Array.isArray(o.rp)){const rp=o.rp.filter(p=>typeof p==='string'&&p).map(p=>p.slice(0,30)).slice(0,8);if(rp.length){r.rp=rp;r.rpd=cut(o.rpd,40);}}
  if(isObj(o.board)){const b=o.board,six=a=>{const out=(Array.isArray(a)?a:[]).slice(0,6).map(s=>cut(s,40));while(out.length<6)out.push('');return out;};
    r.board={n:/^([1-9]|10)$/.test(b.n||'')?b.n:'',tok:cut(b.tok,40),term:['ring','pic'].includes(b.term)?b.term:'none',last:cut(b.last,40),
      card:okCard(b.card)?b.card:0,cardLabel:cut(b.cardLabel,40),ch:six(b.ch),tg:six(b.tg),paired:b.paired===1?1:0};
    /* paired: the book's card was paired with the plan's behavior by a Take or a Keep there (or found equal to it);
       pair: the two hashes of that pairing (the card's label, the behavior), so the plan can tell whether it holds */
    if(r.board.paired){const p=hexes(b.pair,2);if(p.length===2)r.board.pair=p;}}
  return r;
}
const isOn=x=>{const r=readLk(x);return !!r&&r.on===1;};
/* the record as one string of 1800 characters or less: took goes first, then the board labels are cut to 24 */
function pack(obj){const c=JSON.parse(JSON.stringify(isObj(obj)?obj:{}));c.v=1;let s=JSON.stringify(c);if(s.length<=MAX)return s;
  delete c.took;s=JSON.stringify(c);if(s.length<=MAX)return s;
  if(isObj(c.board)){const b=c.board,c24=v=>typeof v==='string'?v.slice(0,24):v;['tok','last','cardLabel'].forEach(k=>{b[k]=c24(b[k]);});
    ['ch','tg'].forEach(k=>{if(Array.isArray(b[k]))b[k]=b[k].map(c24);});s=JSON.stringify(c);if(s.length<=MAX)return s;}
  if(isObj(c.last)){delete c.last.nm;c.last.file=cut(c.last.file,40);}delete c.rp;delete c.rpd;delete c.kd;delete c.td;s=JSON.stringify(c);if(s.length<=MAX)return s;
  delete c.board;delete c.menuSeen;s=JSON.stringify(c);if(s.length<=MAX)return s;
  return JSON.stringify({v:1,on:c.on===1?1:0,card:okCard(c.card)?c.card:undefined,base:isObj(c.base)?c.base:{},pb:Array.isArray(c.pb)&&c.pb.length?hexes(c.pb,12):undefined});}

/* ---- what each form reads from the other ---- */
function planOf(teS){const S=isObj(teS)?teS:{},m=isObj(S.meta)?S.meta:{},g=k=>trim(m[k]),lk=readLk(m.lk);
  const bk=(Array.isArray(S.bk)?S.bk:[]).filter(isObj).map(r=>({n:trim(r.n),conf:trim(r.conf)})).filter(r=>r.n);
  const th=(Array.isArray(S.thin)?S.thin:[]).filter(r=>isObj(r)&&trim(r.ep)),t=th.length?th[th.length-1]:null;
  const out={bk,thinLast:t?{d:trim(t.d),ep:trim(t.ep)}:null,linkedBack:!!lk&&lk.on===1,pb:lk&&lk.pb?lk.pb.slice():[]};
  ['client','sid','beh','tp','tpN','ep','epN','te','teN','exWhen','exDelay','tokForm','loss','lossRule'].forEach(k=>{out[k]=g(k);});
  return out;}
function boardOf(tkS){const m=isObj(tkS)&&isObj(tkS.meta)?tkS.meta:null;if(!m)return null;const lk=readLk(m.lk);if(!lk||lk.on!==1||!lk.board)return null;
  return Object.assign({},lk.board,{ch:lk.board.ch.slice(),tg:lk.board.tg.slice(),client:trim(m.client),sid:trim(m.sid),pb:lk.pb?lk.pb.slice():[]});}
/* the identity row, the same in both forms: client and sid, each compared only when both are filled */
function whoRow(here,there,o){o=o||{};here=isObj(here)?here:{};there=isObj(there)?there:{};
  const hc=trim(here.client),hs=trim(here.sid),tc=trim(there.client),ts=trim(there.sid);
  const dot=t=>/[.!?]$/.test(t)?t:t+'.',show=(c,s)=>c+(s?(c?' (ID '+s+')':'ID '+s):'');
  const nid=t=>norm(t).replace(/\.$/,''),block=(!!hc&&!!tc&&nid(hc)!==nid(tc))||(!!hs&&!!ts&&nid(hs)!==nid(ts));
  const fillParts={};if(!hc&&tc)fillParts.client=tc;if(!hs&&ts)fillParts.sid=ts;const fill=!block&&Object.keys(fillParts).length>0;
  return {key:'who',what:'Student',here:show(hc,hs),there:show(tc,ts),same:()=>!block&&!fill&&!!(tc||ts),owner:'',pre:['fill'],can:!block,block,fill,fillParts,
    /* the partner takes into its own empty client and sid only */
    mirror:(!tc&&!!hc)||(!ts&&!!hs),
    why:block?'Form '+(o.other||'TE-1')+' names '+show(tc,ts)+'; '+(o.meWhat||'this form')+' names '+dot(show(hc,hs)):'',
    nm:'Form '+(o.other||'TE-1')+' names '+(tc||ts)+'; '+(o.meWhat||'this form')+' names '+dot(hc||hs),took:fill?(fillParts.client&&fillParts.sid?'the student\u2019s name and ID':fillParts.client?'the student\u2019s name':'the student ID'):''};}

/* ---- a behavior to reduce, named where a behavior to increase belongs (the behavior tokens are earned for, a card) ----
   The case's own list comes first: Form TB-1's problem behaviors (isRep false, or a candidate whose type is not a
   replacement) and Form FS-1's (it lists problem behaviors only), matched by label; then the problem behaviors seen at
   an earlier compare (pb: their hashes, kept in a record); then the common words for one, unless a word just before
   turns it round ("no hitting", "instead of hitting", "appropriate refusal"). The replacement named is the problem
   behavior's own (Form TB-1's "rep", Form FS-1's alternative, without a "see target 4" cross-reference), else the case's
   first replacement behavior, so both forms name the same one. */
const PBW=new RegExp('\\b(aggress(?:ion|ions|ive|ively|ing)|elop(?:e|es|ed|ing|ement|ements)|bolting|(?:runs?|running|ran) away|'+
  'self[- ]?injur(?:y|ies|ious|ing)|sibs?|self[- ]?harm(?:s|ing)?|head[- ]?bang(?:s|ing)?|hitting|kicking|biting|spitting|scratching|pinching|hair[- ]pulling|'+
  '(?:hits|kicks|bites|scratches|pinches) (?:others|peers|staff|adults|people|someone|classmates|teachers?|students?|siblings?)|spits (?:at|on)|'+
  'scream(?:s|ing)|yelling|tantrums?|meltdowns?|property (?:destruction|damage)|destroy(?:s|ing)|destruction|disrupt(?:s|ing|ion|ions|ive)|'+
  'refusals?|refusing|non-?complian(?:ce|t)|swearing|cursing|profanity|pica|out[- ]of[- ]seat|off[- ]task|throw(?:s|ing) (?:objects|items|materials|things)|without permission)\\b','g');
const PBNOT=/^(no|not|without|instead|rather|never|avoid|avoids|avoiding|appropriate|appropriately|polite|politely|calm|calmly)$/;
function pbWord(t){PBW.lastIndex=0;let m;while((m=PBW.exec(t))){const before=t.slice(0,m.index).split(/[^\p{L}\p{N}']+/u).filter(Boolean).slice(-3);
  if(!before.some(w=>PBNOT.test(w)))return m[1];}return '';}
const isProb=x=>isObj(x)&&(x.isRep===false||(x.isRep!==true&&(x.src==='FS-1'||(/^TB-1/.test(str(x.src))&&!/replacement|alternative/i.test(str(x.type))))));
const repClean=s=>trim(s).replace(/\s*\(\s*(?:see|cf\.?)\s[^)]*\)\s*$/i,'').replace(/[\s;,.]*\bsee (?:target|behavior|row) \d+\.?$/i,'').trim();
function problem(text,o){o=o||{};const t=norm(text);if(!t)return null;const f=Array.isArray(o.facts)?o.facts.filter(isObj):[];
  const p=f.find(x=>isProb(x)&&norm(x.label)===t);
  if(p){const r=f.find(x=>x.isRep===true&&trim(x.label));return {src:'case',form:p.src==='FS-1'?'FS-1':'TB-1',rep:repClean(p.rep)||repClean(p.alt)||(r?trim(r.label):'')};}
  if(hexes(o.seen,99).includes(hash(t)))return {src:'seen',form:'TB-1',rep:''};
  const w=pbWord(t);return w?{src:'word',word:w}:null;}
/* the hashes of the case's problem behaviors, for a record's pb */
function pbOf(facts){const out=[];(Array.isArray(facts)?facts:[]).forEach(x=>{if(isProb(x)&&trim(x.label)){const h=hash(norm(x.label));if(!out.includes(h))out.push(h);}});return out.slice(0,12);}
/* the warning, worded the same in both forms: o.lead names the item ("Form TE-1's behavior"), o.text is its words, o.fix
   what to do about it */
function problemNote(p,o){o=o||{};if(!p)return '';const q='\u201c'+trim(o.text)+'\u201d',lead=o.lead||'The behavior';
  if(p.src==='word')return lead+', '+q+', names a behavior to reduce (\u201c'+p.word+'\u201d). Tokens are earned for a behavior to increase'+(o.fix?'; '+o.fix:'')+'.';
  return lead+', '+q+', is a problem behavior on Form '+(p.form||'TB-1')+(p.src==='seen'?' (the case named it at an earlier compare)':'')+'. Tokens are earned for a behavior to increase'+
    (p.rep?', such as \u201c'+p.rep+'\u201d':'')+(o.fix?'; '+o.fix:'')+'.';}

/* a file the partner saved: its own JSON, a CASE json, or a .case.html. PACKET, this form's own file, other forms'
   files, a case without the partner and unreadable files are refused. */
function readText(text,fileName,want,me){const t=str(text),O='Form '+want,no=' Nothing was changed.',bad={ok:false,msg:'That file could not be read as a file '+O+' saved.'+no};
  let o=null;
  if(/^\s*[{[]/.test(t)){try{o=JSON.parse(t);}catch(e){o=null;}}
  else{const m=/\x3cscript type="application\/json" id="nbh-case">([\s\S]*?)\x3c\/script>/.exec(t);if(m){try{o=JSON.parse(m[1]);}catch(e){o=null;}}}
  if(!isObj(o))return bad;
  const own=(d,file,saved)=>isObj(d)&&d.form===want&&isObj(d.S)?{ok:true,S:d.S,saved:trim(d.saved)||trim(saved),file:str(file)}:null;
  if(o.form==='PACKET')return {ok:false,msg:'That file is a student packet, not a file '+O+' saved.'+no};
  if(o.form==='CASE'||(!o.form&&isObj(o.forms))){const e=isObj(o.forms)?o.forms[want]:null;
    if(!isObj(e)||!isObj(e.snap))return {ok:false,msg:'That case file holds no '+O+'.'+no};
    let d=null;try{d=JSON.parse(e.snap.own);}catch(x){d=null;}return own(d,fileName,o.saved)||bad;}
  if(me&&o.form===me)return {ok:false,msg:'That file was saved by this form (Form '+me+'), not by '+O+'.'+no};
  const r=own(o,fileName,'');if(r)return r;
  if(typeof o.form==='string'&&o.form!==want&&/^[A-Z]{2,3}-\d$/.test(o.form))return {ok:false,msg:'That file was saved by Form '+o.form+', not by '+O+'.'+no};
  return bad;}

/* ---- row states (plan section 3) ---- */
function stateOf(row,base,o){o=o||{};const O='Form '+(o.other||'TE-1');
  const here=val(row.here),there=val(row.there),a=norm(here),b=norm(there),ha=hash(a),hb=hash(b);
  const can=row.can!==false,pre=Array.isArray(row.pre)?row.pre:[],bs=Array.isArray(base)&&base.length===2?base:null;
  const r=(st,label,take,keep,press)=>({st,label,take:!!take&&can,keep:!!keep&&row.keep!==false,pressed:press&&take&&can?'take':'',ha,hb});
  /* the promise that the partner can take it is made only for a row the partner can take (mirror) */
  const ct=row.mirror?'; '+O+' can take this when it compares':'';
  if(row.block&&!(bs&&bs[0]===ha&&bs[1]===hb))return {st:0,label:'for another student?',take:false,keep:true,block:true,pressed:'',ha,hb};
  /* nothing on either side is not "in step": there is nothing to compare */
  if(!a&&!b&&!row.fill)return r(2,'nothing on either side');
  let same=a===b;if(!same&&typeof row.same==='function'){try{same=!!row.same(here,there);}catch(e){same=false;}}else if(row.same===true)same=true;
  if(same)return r(1,'in step');
  if(!b)return r(2,'only here'+ct);
  if(!a||row.fill)return r(3,'empty here',1,0,pre.includes('fill')||pre.includes('any'));
  if(bs&&bs[0]===ha&&bs[1]===hb)return Object.assign(r(4,o.td?'taken in part ('+o.td+')':(row.keptLabel||'kept different')+(o.kd?' ('+o.kd+')':''),1,1,0),{part:!!o.td});
  if(bs&&bs[0]===ha)return r(5,'changed on '+O,1,1,row.owner==='there'||pre.includes('changed')||pre.includes('any'));
  if(bs&&bs[1]===hb)return r(6,'changed here'+ct,1,1,0);
  return r(7,'different',1,1,pre.includes('any'));}

const fmt=iso=>{const d=new Date(iso);if(!iso||isNaN(d))return '';try{return d.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});}catch(e){return d.toLocaleString();}};
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
/* a bare YYYY-MM-DD (kd, td) is a local day; a full timestamp (rpd) is read as the moment it is, so an evening in the
   Americas is not shown as the next day */
const day=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||'');const d=m?new Date(+m[1],m[2]-1,+m[3]):new Date(s);if(!s||isNaN(d))return '';try{return d.toLocaleDateString(undefined,{day:'numeric',month:'short'});}catch(e){return d.toDateString();}};
const plural=(n,one,many)=>n+' '+(n===1?one:many);
const andList=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
function confirmBox(t,o){try{if(window.nbhUI&&window.nbhUI.confirm)return Promise.resolve(window.nbhUI.confirm(t,o||{}));}catch(e){}try{return Promise.resolve(!!window.confirm(t));}catch(e){return Promise.resolve(false);}}
const CSS='.nbh-lk [hidden]{display:none!important}'+
 '.nbh-lk .lk-tools{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0}'+
 '.nbh-lk .lk-tools .tool,.nbh-lk .lk-tools a,.nbh-lk .lk-tools button.tool+button.tool,.nbh-lk .lk-btns button.tool+button.tool{margin:0}.nbh-lk .lk-tools a{font-family:var(--sans,sans-serif);font-size:13px;align-self:center}'+
 '.nbh-lk .lk-status{font-family:var(--sans,sans-serif);font-size:13px;font-weight:600;margin:6px 0 2px}.nbh-lk p.hint{margin:2px 0}'+
 '.nbh-lk .lk-status,.nbh-lk p.hint,.nbh-lk .lk-msg,.nbh-lk .lk-warn,.nbh-lk .lk-pre{overflow-wrap:anywhere}'+
 /* a word breaks only when it is wider than its whole cell, so a value column is never squeezed to a letter */
 '.nbh-lk .grid-wrap{max-width:100%;overflow-x:auto}.nbh-lk table.lk-tbl{table-layout:auto}.nbh-lk .lk-tbl th,.nbh-lk .lk-tbl td{overflow-wrap:break-word;word-break:normal}'+
 '.nbh-lk .lk-tbl td.lk-v{min-width:7em}.nbh-lk .lk-nw{white-space:nowrap}.nbh-lk .lk-none{color:var(--ink-3,#6b7680)}'+
 '.nbh-lk .lk-tbl tbody th{text-align:left;font-weight:600}.nbh-lk .lk-tbl td.lk-st{min-width:7.5em}'+
 '.nbh-lk .lk-btns{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}.nbh-lk .lk-btns button{margin:0;min-width:0}'+
 /* numbered choices (the target card, 1 to 6) sit three to a line, so a narrow column never stacks them one by one */
 '.nbh-lk .lk-btns.lk-num{display:grid;grid-template-columns:repeat(3,max-content)}'+
 '.nbh-lk button[aria-pressed=true],.nbh-lk button.tool[aria-pressed=true],.nbh-lk button.tool[aria-pressed=true]:hover{background:var(--nbh-navy,#182e43);color:#fff;border-color:var(--nbh-navy,#182e43)}'+
 /* a ticked Take or Keep shows a tick as well as the dark fill; the tick is decoration, not part of the button's name */
 '.nbh-lk .lk-tbl button[data-act=take][aria-pressed=true]::before,.nbh-lk .lk-tbl button[data-act=keep][aria-pressed=true]::before{content:"\\2713\\00a0";content:"\\2713\\00a0" / ""}'+
 /* the choices inside a row (which card is compared, which names a take adds) are light and carry no tick, so only a
    row's own Take or Keep reads as ticked */
 '.nbh-lk .lk-tbl button.tool[data-act=choose][aria-pressed=true],.nbh-lk .lk-tbl button.tool[data-act=choose][aria-pressed=true]:hover{background:#E7EDF2;color:var(--ink,#16242e);border-color:var(--nbh-navy,#182e43);font-weight:700}'+
 '.nbh-lk .lk-tbl button.tool.lk-pick[aria-pressed=false]{border-style:dashed;color:var(--ink-3,#5b6670)}'+
 '.nbh-lk .lk-warn{color:#7a3d0f;background:#FBEEDB;border-left:3px solid #9B4E15;padding:3px 8px;margin:3px 0}'+
 '.nbh-lk .lk-pre{white-space:pre-wrap;font-size:12px;border-left:3px solid var(--rule-2,#ccc);padding:3px 8px;margin:3px 0}'+
 '.nbh-lk .lk-vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}'+
 '.nbh-lk .lk-undo .hint{font-size:12px;flex:1 1 16em}'+
 /* on a narrow screen (a phone, or a narrow column side by side) each row is a card: the item, then this form's value
    and the partner's, each named, then the state */
 '@media (max-width:520px){.nbh-lk .lk-tbl{font-size:12.5px}.nbh-lk .lk-tbl thead{display:none}'+
 '.nbh-lk table.lk-tbl,.nbh-lk .lk-tbl tbody,.nbh-lk .lk-tbl tr,.nbh-lk .lk-tbl th,.nbh-lk .lk-tbl td{display:block;width:auto!important;min-width:0}'+
 '.nbh-lk .lk-tbl th,.nbh-lk .lk-tbl td{padding:5px 8px;overflow-wrap:break-word}.nbh-lk .lk-tbl tbody td{border-top:0}.nbh-lk .lk-tbl tr[data-key]{margin-top:8px}'+
 '.nbh-lk .lk-tbl td.lk-v{min-width:0}.nbh-lk .lk-tbl td[data-l]::before{content:attr(data-l) ": ";font-weight:600}}@media print{.nbh-lk{display:none!important}}';

/* ---- the panel ---- */
function mount(ad){
  const me=ad.me,other=ad.other,O='Form '+other,meWhat=ad.meWhat||'this form',Me=meWhat.charAt(0).toUpperCase()+meWhat.slice(1);
  const W={cur:null,undo:null,undoAfter:'',undoKeep:null,msg:'',msgKind:'',waitA:0,waitO:0,tA:0,tO:0,ignored:0,busy:false,toast:''};
  const framed=()=>{try{return window.parent!==window;}catch(e){return true;}};
  const getLk=()=>{let s='';try{s=ad.get();}catch(e){s='';}return readLk(s);};
  const setLk=o=>{ad.set(o?pack(o):'');};
  const sigOf=lk=>lk&&lk.on===1&&lk.last?lk.last.when+JSON.stringify(lk.base):'';
  const after=()=>{try{if(ad.after)ad.after();}catch(e){if(window.console)console.error(e);}};
  const record=(lk,a)=>{try{if(ad.record)ad.record(lk,a);}catch(e){if(window.console)console.error(e);}};
  const toast=(t,kind)=>{W.toast=t;try{if(window.nbhUI&&window.nbhUI.toast){window.nbhUI.toast(t,{kind:kind||'ok'});return;}}catch(e){}};
  const msg=(t,kind)=>{W.msg=t||'';W.msgKind=kind||'';paintMsg();};
  if(!document.getElementById('nbh-link-css')){const st=document.createElement('style');st.id='nbh-link-css';st.textContent=CSS;(document.head||document.documentElement).appendChild(st);}
  const host=typeof ad.host==='string'||!ad.host?document.querySelector(ad.host||'#lkPanel'):ad.host;
  const OFF={'TK-1':'Link this book with Form TE-1, the token economy plan for the same student. The target card, token count, token and Choices are then compared with the plan\u2019s behavior, tokens per exchange, token form and backups, and you choose what to take. Nothing changes on either form without your click.',
    'TE-1':'Link this plan with Form TK-1, the token board book for the same student. The behavior, tokens per exchange, token form and backups are then compared with the book\u2019s target card, token count, token and choice cards, and you choose what to take. Nothing changes on either form without your click.'};
  const T={offText:ad.offText||OFF[me]||'Link '+meWhat+' with '+O+'. Nothing changes on either form without your click.',
    notOpen:O+' is not open in this workstation. Open it beside '+meWhat+', or open a file it saved.',
    noAnswer:O+' did not answer in time (it may still be loading). Try Compare again.',
    noOpen:'This workstation could not open '+O+' from here. Pick it from the list of forms.',
    noView:typeof ad.noView==='string'&&ad.noView?ad.noView:O+'\u2019s link is off, so its file does not name its cards. Turn on Link with Form '+me+' on '+other+'\u2019s Setup page, then compare again.',
    unlink:'Unlink from '+O+'?\nNothing on either form changes; the comparison record is removed.'};
  const Q=s=>host?host.querySelector(s):null;
  if(host){host.classList.add('nbh-lk');host.innerHTML=
    '<div class="lk-off" hidden><p class="hint lk-offtxt">'+esc(T.offText)+'</p><div class="lk-tools"><button type="button" class="tool" data-lk="on">Link with '+esc(O)+'</button></div></div>'+
    '<div class="lk-on" hidden><p class="lk-status" role="status" aria-live="polite"></p><p class="hint lk-next"></p><p class="hint lk-took" hidden></p>'+
    '<div class="lk-rpw" hidden><p class="hint lk-rp" hidden></p><div class="lk-tools"><button type="button" class="tool" data-lk="printed">These pages are reprinted</button></div></div>'+
    '<div class="lk-tools"><button type="button" class="tool" data-lk="compare">Compare with '+esc(O)+'</button><button type="button" class="tool" data-lk="file">Open a file '+esc(O)+' saved</button>'+
    '<button type="button" class="tool" data-lk="beside">Open '+esc(O)+' beside '+esc(meWhat)+'</button><a class="lk-sib" target="_blank" rel="noopener" hidden>Open '+esc(O)+' in a new tab</a>'+
    '<button type="button" class="tool" data-lk="unlink">Unlink</button><input type="file" class="lk-fileIn" accept=".json,.html" hidden></div>'+
    '<div class="verdict v-mid lk-msg" role="alert" hidden></div>'+
    '<div class="lk-cmp" hidden><p class="hint lk-legend">Dark buttons with a \u2713 are ticked. Tap one to tick or untick it, then press Take the ticked items; nothing changes before that. The light buttons beside an item choose which card, or which names, a take uses.</p><div class="grid-wrap"><table class="rt lk-tbl"><thead><tr><th scope="col">What</th><th scope="col">'+esc(Me)+'</th><th scope="col"><span class="lk-nw">'+esc(O)+'</span></th><th scope="col"><span class="lk-vh">State and choice</span></th></tr></thead><tbody></tbody></table></div>'+
    '<div class="lk-tools lk-foot"><button type="button" class="tool" data-lk="apply">Take the ticked items</button><button type="button" class="tool" data-lk="leave">Leave everything as it is</button></div></div>'+
    '<div class="lk-tools lk-undo" hidden><button type="button" class="tool" data-lk="undo" title="Puts back what '+esc(meWhat)+' held before the take. Offered only until anything else on '+esc(meWhat)+' changes.">Undo what was just taken</button>'+
    '<span class="hint">Undo puts back what '+esc(meWhat)+' held before the take. It is offered until anything else on '+esc(meWhat)+' changes.</span></div></div>';}
  /* the alert is written only when its words change, so a screen reader does not announce it again at every repaint */
  function paintMsg(){const m=Q('.lk-msg');if(!m)return;if(m.textContent!==W.msg)m.textContent=W.msg;if(m.hidden!==!W.msg)m.hidden=!W.msg;
    const c='verdict '+(W.msgKind==='ok'?'v-ok':'v-mid')+' lk-msg';if(m.className!==c)m.className=c;}
  function resWords(L){const k=/kept (\d+)/.exec(L.res),p=/part (\d+)/.exec(L.res),out=[];
    if(k)out.push(plural(+k[1],'difference','differences')+' kept');if(p)out.push(plural(+p[1],'item','items')+' taken in part');return out.join(', ');}
  function statusLines(lk){const L=lk.last,out=[];
    if(!L)out.push('Linked with '+O+' \u00b7 not compared yet.');
    else{const when=fmt(L.when),sv=fmt(L.saved),src=L.via==='shell'?'with '+O+' (open in this workstation)':(L.file?'with the file '+L.file:'with a file '+O+' saved')+(sv?' (saved '+sv+')':'');
      const n=+(L.res.split(' ')[1]||0),cmp=' \u00b7 compared '+when+' '+src+'.';
      if(L.res==='who')out.push('Linked with '+O+' \u00b7 for another student? '+(L.nm||'')+cmp);
      else if(L.res==='empty')out.push('Linked with '+O+' \u00b7 '+O+' holds nothing to compare yet'+cmp);
      else if(/^look/.test(L.res))out.push('Linked with '+O+' \u00b7 '+plural(n,'item','items')+' to look at'+(W.cur?' below.':cmp));
      else if(/^(kept|part)/.test(L.res))out.push('Linked with '+O+' \u00b7 '+resWords(L)+cmp);
      else if(L.res==='step')out.push('Linked with '+O+' \u00b7 in step'+cmp);
      else out.push('Linked with '+O+cmp);}
    out.push(framed()?(L?'Changes made on '+O+' since then show only when you compare again.':''):
      'Outside the workstation, '+meWhat+' reads '+O+' from a file: press Save data on '+O+', then Open a file '+O+' saved, here.'+(L?' Changes made there since then show only when you compare again.':''));return out;}
  function evalRows(rows,lk,prev){const st={},pressed={};
    rows.forEach(r=>{if(!r.what||!r.key)return;const nb=!!r.nobase,kd=!nb&&lk.kd&&lk.kd[r.key]?day(lk.kd[r.key]):'',td=!nb&&lk.td&&lk.td[r.key]?day(lk.td[r.key]):'';
      const s=stateOf(r,nb?null:lk.base[r.key],{other,kd,td});st[r.key]=s;
      const p=prev&&prev.st[r.key]&&prev.st[r.key].st===s.st?prev.pressed[r.key]:undefined;
      pressed[r.key]=p!==undefined&&((p==='take'&&s.take)||(p==='keep'&&s.keep)||p==='')?p:s.pressed;});
    return {st,pressed};}
  /* the result of a compare: another student; nothing to compare (every value on the partner's side is empty); items to
     look at; differences kept and items taken in part; or in step */
  function resOf(cur,rows){let look=0,kept=0,part=0,who=false;Object.keys(cur.st).forEach(k=>{const s=cur.st[k];if(s.st===0)who=true;else if([3,5,6,7].includes(s.st))look++;else if(s.st===4){if(s.part)part++;else kept++;}});
    const keyed=(rows||[]).filter(r=>r.what&&r.key);
    if(who)return 'who';if(keyed.length&&keyed.every(r=>!norm(val(r.there))))return 'empty';
    return look?'look '+Math.min(look,999):kept||part?(kept?'kept '+Math.min(kept,999):'')+(kept&&part?' ':'')+(part?'part '+Math.min(part,999):''):'step';}
  const blocked=()=>!!W.cur&&Object.keys(W.cur.st).some(k=>W.cur.st[k].st===0&&W.cur.pressed[k]!=='keep');
  const anyPressed=()=>!!W.cur&&Object.keys(W.cur.pressed).some(k=>!!W.cur.pressed[k]);
  const cell=v=>{const t=val(v);return t?esc(t):'<span class="lk-none" aria-hidden="true">\u2014</span><span class="lk-vh">nothing</span>';};
  function rowHtml(r){
    if(!r.what){const t=val(r.info);return t?'<tr class="lk-info"><td colspan="4" class="hint">'+esc(t)+'</td></tr>':'';}
    const s=W.cur.st[r.key],p=W.cur.pressed[r.key],k=esc(r.key);let b='';
    const tl=r.takeLabel||'Take',kl='Keep '+meWhat+'\u2019s';
    if(s.block)b='<button type="button" class="tool" data-act="keep" data-key="'+k+'" aria-pressed="'+(p==='keep')+'">These are the same student</button>';
    else{if(s.take)b+='<button type="button" class="tool" data-act="take" data-key="'+k+'" aria-pressed="'+(p==='take')+'" aria-label="'+esc(tl+': '+r.what)+'">'+esc(tl)+'</button>';
      if(s.keep)b+='<button type="button" class="tool" data-act="keep" data-key="'+k+'" aria-pressed="'+(p==='keep')+'" aria-label="'+esc(kl+': '+r.what)+'">'+esc(kl)+'</button>';}
    let ch='';if(isObj(r.choose)){const lb=Array.isArray(r.choose.labels)?r.choose.labels.map(str):null,n=Math.max(1,Math.min(10,lb?lb.length:r.choose.n|0||6)),on=Array.isArray(r.choose.on)?r.choose.on:null,gl=r.choose.label||'Card';
      ch='<div class="lk-btns'+(lb?'':' lk-num')+'" role="group" aria-label="'+esc(gl)+'">';
      for(let i=0;i<n;i++)ch+='<button type="button" class="tool'+(on?' lk-pick':'')+'" data-act="choose" data-key="'+k+'" data-i="'+i+'" aria-pressed="'+(on?on.includes(i):r.choose.value===i)+'"'+(lb?'':' aria-label="'+esc(gl+' '+(i+1))+'"')+'>'+esc(lb?lb[i]:String(i+1))+'</button>';ch+='</div>';}
    const notes=[];if(r.why)notes.push('<div class="hint">'+esc(r.why)+'</div>');
    (Array.isArray(r.warn)?r.warn:r.warn?[r.warn]:[]).forEach(w=>notes.push('<div class="lk-warn">'+esc(w)+'</div>'));
    (Array.isArray(r.info)?r.info:r.info?[r.info]:[]).forEach(w=>notes.push('<div class="hint">'+esc(w)+'</div>'));
    if(r.preview)notes.push('<div class="lk-pre">'+esc(r.preview)+'</div>');
    return '<tr data-key="'+k+'" class="lk-s'+s.st+'"><th scope="row">'+esc(r.what)+ch+'</th><td class="lk-v" data-l="'+esc(Me)+'">'+cell(r.here)+'</td><td class="lk-v" data-l="'+esc(O)+'">'+cell(r.there)+'</td><td class="lk-st"><span class="lk-lab">'+esc(s.label)+'</span>'+
      (b?'<div class="lk-btns">'+b+'</div>':'')+'</td></tr>'+(notes.length?'<tr class="lk-note" data-for="'+k+'"><td colspan="4">'+notes.join('')+'</td></tr>':'');}
  function paintFoot(){const a=Q('[data-lk="apply"]');if(a)a.disabled=blocked()||!anyPressed()||W.busy;}
  /* Undo belongs to the record the take was made on: anything that changes it afterwards (an edit, Open data of
     another file, Clear all, the shell's restore) withdraws it, so it can never put one record over another */
  const snapNow=()=>{try{return str(ad.snapshot());}catch(e){return '';}};
  const undoOk=()=>!!W.undo&&!!W.undoAfter&&snapNow()===W.undoAfter;
  const dropUndo=()=>{W.undo=null;W.undoAfter='';W.undoKeep=null;};
  function render(){if(!host)return;const lk=getLk(),on=!!lk&&lk.on===1;
    if(W.cur&&(!on||sigOf(lk)!==W.cur.sig))W.cur=null;if(!on||(W.undo&&!undoOk()))dropUndo();
    Q('.lk-off').hidden=on;Q('.lk-on').hidden=!on;
    if(on){const L=statusLines(lk);Q('.lk-status').textContent=L[0];const nx=Q('.lk-next');nx.textContent=L[1]||'';nx.hidden=!L[1];
      const tk=Q('.lk-took');tk.textContent=lk.took||'';tk.hidden=!lk.took;
      const rp=Q('.lk-rp'),pages=lk.rp||[];let words='';
      if(pages.length){try{words=ad.rpLine?str(ad.rpLine(pages.slice())):'';}catch(e){words='';}if(!words)words='the '+andList(pages)+(pages.length>1?' pages':' page');}
      rp.textContent=pages.length?'Reprint: '+words+(lk.rpd&&day(lk.rpd)?' (changed by the link '+day(lk.rpd)+').':'.'):'';rp.hidden=!pages.length;Q('.lk-rpw').hidden=!pages.length;
      const f=framed();Q('[data-lk="compare"]').hidden=!f;Q('[data-lk="beside"]').hidden=!f;Q('[data-lk="compare"]').disabled=!!W.waitA;Q('[data-lk="beside"]').disabled=!!W.waitO;
      const a=Q('.lk-sib'),blob=location.protocol==='blob:'||location.href==='about:srcdoc'||location.protocol==='about:';
      if(ad.sibling)a.setAttribute('href',ad.sibling);a.hidden=f||blob||!ad.sibling;}
    const cmp=Q('.lk-cmp');cmp.hidden=!(on&&W.cur);
    if(on&&W.cur){Q('.lk-tbl tbody').innerHTML=W.cur.rows.map(rowHtml).join('');}
    Q('.lk-undo').hidden=!(on&&W.undo);paintMsg();paintFoot();}
  /* compare: reads only. It writes lk.last and the in-step marks (the base of each row found in step), except when the
     compare finds another student: then only lk.last, and the marks wait for "These are the same student" */
  function compareWith(obj,src){src=isObj(src)?src:{};let S=obj,saved=trim(src.saved);
    if(isObj(obj)&&isObj(obj.S)&&typeof obj.form==='string'){S=obj.S;saved=saved||trim(obj.saved);}
    const lk=getLk();if(!lk||lk.on!==1)return false;
    dropUndo();W.cur=null;let view=null;try{view=ad.view(S);}catch(e){view=null;}
    if(!view){let t=T.noView;try{if(typeof ad.noView==='function')t=str(ad.noView(S,src))||T.noView;}catch(e){t=T.noView;}msg(t);render();return false;}
    const rows=(ad.rows(view)||[]).filter(isObj),ev=evalRows(rows,lk,null);
    const cur={view,rows,st:ev.st,pressed:ev.pressed,src:{via:src.via==='shell'?'shell':'file',file:str(src.file),saved}};
    const who=rows.find(r=>r.key==='who'&&cur.st.who&&cur.st.who.st===0);cur.held=!!who;
    if(!who){const step=[];rows.forEach(r=>{const s=r.what&&r.key?cur.st[r.key]:null;if(s&&s.st===1){lk.base[r.key]=[s.ha,s.hb];step.push(r);}});record(lk,{taken:[],kept:[],step});}
    lk.last={when:new Date().toISOString(),via:cur.src.via,file:cur.src.file,saved,res:resOf(cur,rows),nm:who?str(who.nm||who.why):''};
    setLk(lk);cur.sig=sigOf(getLk());W.cur=cur;W.msg='';after();render();return true;}
  function press(key,which){if(!W.cur||!W.cur.st[key])return '';const s=W.cur.st[key],p=W.cur.pressed[key];
    if(which!=='take'&&which!=='keep')return p;if(which==='take'&&!s.take)return p;if(which==='keep'&&!s.keep)return p;
    W.cur.pressed[key]=p===which?'':which;
    const tr=Q('tr[data-key="'+key+'"]');if(tr)tr.querySelectorAll('button[data-act="take"],button[data-act="keep"]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.act===W.cur.pressed[key])));
    paintFoot();return W.cur.pressed[key];}
  /* a choice button: the adapter handles it (true: the row's tick stays; 'reset': it is let go), or, for an adapter
     that does not, a card number goes into the record as lk.card. Picking the names a take adds ticks that Take. */
  function choose(key,i){if(!W.cur)return;let done=false;try{done=ad.choose?ad.choose(key,i,W.cur.view):false;}catch(e){done=false;}
    const prev={st:Object.assign({},W.cur.st),pressed:Object.assign({},W.cur.pressed)};
    if(done==='reset')delete prev.st[key];
    else if(done!==true){const lk=getLk();if(!lk)return;if(key==='card'&&okCard(i))lk.card=i;setLk(lk);delete prev.st[key];}
    const rows=(ad.rows(W.cur.view)||[]).filter(isObj);
    const ev=evalRows(rows,getLk(),prev);W.cur.rows=rows;W.cur.st=ev.st;W.cur.pressed=ev.pressed;
    const r=rows.find(x=>x.key===key);if(done===true&&r&&isObj(r.choose)&&Array.isArray(r.choose.labels)&&ev.st[key]&&ev.st[key].take&&!ev.pressed[key])W.cur.pressed[key]='take';
    render();}
  /* Apply: the pressed Takes in the order who, card (beh), n, tok, menu, sched; then the bases, the record, the toast */
  /* Apply re-reads this form first: a row whose value here changed after the compare (typed while the table was
     open) is not taken or kept, and is named, so a take never lands on words the compare did not see */
  async function apply(){if(!W.cur||W.busy||blocked()||!anyPressed())return {taken:0,kept:0,stale:0};
    const focusIn=!!host&&host.contains(document.activeElement);W.busy=true;paintFoot();const cur=W.cur;let snap=null;try{snap=ad.snapshot();}catch(e){snap=null;}
    const order=k=>{const i=KEYS.indexOf(k);return i<0?KEYS.length:i;};
    const live={};((ad.rows(cur.view)||[]).filter(isObj)).forEach(r=>{if(r.key)live[r.key]=r;});
    const rows=cur.rows.filter(r=>r.what&&r.key&&cur.pressed[r.key]).sort((a,b)=>order(a.key)-order(b.key));
    const taken=[],kept=[],stale=[],undone=[];
    try{for(const r of rows){const p=cur.pressed[r.key];
      if(!live[r.key]||norm(val(live[r.key].here))!==norm(val(r.here))){stale.push(r);continue;}
      if(p==='take'){let res;try{res=await ad.take(r);}catch(e){res=false;if(window.console)console.error(e);}if(res!==false)taken.push([r,res]);else undone.push(r);}
      else if(p==='keep')kept.push(r);}}
    finally{W.busy=false;}
    const staleTxt=stale.length?'Not taken, because '+meWhat+' changed after the compare: '+andList(stale.map(r=>r.what))+'. The table now shows '+(stale.length===1?'it':'them')+' as '+(stale.length===1?'it is':'they are')+'.':'';
    /* a take that wrote nothing (a question cancelled, or nothing left to change) is named, never silent */
    const undoneTxt=undone.length?'Not taken: '+andList(undone.map(r=>r.what))+' (cancelled, or nothing to change; '+(undone.length===1?'it is as it was':'they are as they were')+').':'';
    const fresh=(ad.rows(cur.view)||[]).filter(isObj),by={};fresh.forEach(r=>{if(r.key)by[r.key]=r;});
    const lk=getLk()||{v:1,on:1,base:{}},now=new Date(),rp=new Set(lk.rp||[]);lk.base=lk.base||{};
    if(!taken.length&&!kept.length){
      if(stale.length||undone.length){const prev={st:cur.st,pressed:Object.assign({},cur.pressed)};undone.forEach(r=>{prev.pressed[r.key]='';});
        const ev=evalRows(fresh,lk,prev);W.cur={view:cur.view,rows:fresh,st:ev.st,pressed:ev.pressed,src:cur.src,sig:cur.sig,held:cur.held};msg([staleTxt,undoneTxt].filter(Boolean).join(' '),'');}
      render();return {taken:0,kept:0,stale:stale.length};}
    taken.forEach(([r,res])=>{const nh=typeof res==='string'?res:by[r.key]?val(by[r.key].here):val(r.there);lk.base[r.key]=[hash(norm(nh)),hash(norm(val(r.there)))];
      if(lk.kd)delete lk.kd[r.key];if(Array.isArray(r.seen))lk.menuSeen=r.seen.filter(h=>HEX.test(h)).slice(0,10);(Array.isArray(r.rp)?r.rp:[]).forEach(x=>rp.add(String(x)));});
    kept.forEach(r=>{lk.base[r.key]=[hash(norm(val(r.here))),hash(norm(val(r.there)))];lk.kd=lk.kd||{};lk.kd[r.key]=ymd(now);if(lk.td)delete lk.td[r.key];});
    /* a compare held for "These are the same student": its in-step marks are written now that it is confirmed */
    const step=[];if(cur.held&&kept.concat(taken.map(x=>x[0])).some(r=>r.key==='who')){const e=evalRows(fresh,lk,null);
      fresh.forEach(r=>{const s=r.what&&r.key?e.st[r.key]:null;if(s&&s.st===1&&!taken.some(([t])=>t.key===r.key)&&!kept.some(x=>x.key===r.key)){lk.base[r.key]=[s.ha,s.hb];step.push(r);}});}
    record(lk,{taken:taken.map(([r])=>r),kept:kept.slice(),step});
    /* a take that leaves its row different (the backups there was room for, the cards picked) reads "taken in part", not "kept" */
    const ev0=evalRows(fresh,lk,null);taken.forEach(([r])=>{const s=ev0.st[r.key];if(s&&s.st===4){lk.td=lk.td||{};lk.td[r.key]=ymd(now);}else if(lk.td)delete lk.td[r.key];});
    if(lk.td&&!Object.keys(lk.td).length)delete lk.td;
    /* the took line holds 160 characters; when it is over, whole items are dropped from the end, never half a word */
    if(taken.length){const head='Taken '+fmt(now.toISOString())+': ',words=taken.map(([r])=>str(r.took||r.what.toLowerCase()));let t=head+words.join('; ');
      while(t.length>160&&words.length>1){words.pop();t=head+words.join('; ')+'; \u2026';}
      if(t.length>160)t=t.slice(0,159)+'\u2026';lk.took=t;}
    if(rp.size&&taken.some(([r])=>Array.isArray(r.rp)&&r.rp.length)){lk.rp=Array.from(rp).slice(0,8);lk.rpd=now.toISOString();}
    const ev=evalRows(fresh,lk,null);
    lk.last={when:now.toISOString(),via:cur.src.via,file:cur.src.file,saved:cur.src.saved,res:resOf(ev,fresh),nm:''};
    setLk(lk);
    /* the table after the take is built again from the record as it now is, so its notes are the new ones; the result
       is counted on it too, since a pairing the form noted in record() can change which rows use the record's mark */
    const rows2=(ad.rows(cur.view)||[]).filter(isObj),ev2=evalRows(rows2,getLk()||lk,null),res2=resOf(ev2,rows2);
    {const l2=getLk();if(l2&&l2.last&&l2.last.res!==res2){l2.last.res=res2;setLk(l2);}}
    const next={view:cur.view,rows:rows2,st:ev2.st,pressed:{},src:cur.src,held:false};Object.keys(ev2.st).forEach(k=>{next.pressed[k]='';});
    next.sig=sigOf(getLk());W.cur=next;dropUndo();W.msg=[staleTxt,undoneTxt].filter(Boolean).join(' ');
    after();
    if(taken.length&&snap){W.undo=snap;W.undoAfter=snapNow();
      /* the Keeps of the same Apply changed nothing on this form, so an Undo keeps them */
      const keepRows=kept.concat(step);if(keepRows.length){W.undoKeep={kept:kept.slice(),step:step.slice(),base:{},kd:{}};keepRows.forEach(r=>{W.undoKeep.base[r.key]=lk.base[r.key];if(lk.kd&&lk.kd[r.key])W.undoKeep.kd[r.key]=lk.kd[r.key];});}}
    render();
    const said=[];if(taken.length)said.push((taken.length===1?'1 item':taken.length+' items')+' taken from '+O);if(kept.length)said.push(plural(kept.length,'difference','differences')+' kept');
    toast(said.join(' and ')+'. '+(taken.length?'Nothing else changed.':'Nothing was changed.')+(W.msg?' '+W.msg:''),'ok');
    /* the Apply button is disabled now; the keyboard goes on to Undo, or to the status line, brought to the middle of
       the screen so that a sticky toolbar does not cover it */
    if(focusIn){const u=Q('[data-lk="undo"]'),st=Q('.lk-status');try{const t=u&&!Q('.lk-undo').hidden?u:st;if(t===st)st.tabIndex=-1;t.focus({preventScroll:true});if(t.scrollIntoView)t.scrollIntoView({block:'center'});}catch(e){}}
    return {taken:taken.length,kept:kept.length,stale:stale.length};}
  function undo(){if(!W.undo)return false;
    if(!undoOk()){dropUndo();msg('Undo is no longer offered: '+meWhat+' has changed since the take.');render();return false;}
    const j=W.undo,keep=W.undoKeep;dropUndo();W.cur=null;try{ad.restore(j);}catch(e){if(window.console)console.error(e);}
    if(keep&&Object.keys(keep.base).length){const lk=getLk();if(lk&&lk.on===1){Object.keys(keep.base).forEach(k=>{if(keep.base[k])lk.base[k]=keep.base[k];});
      if(Object.keys(keep.kd).length)lk.kd=Object.assign(lk.kd||{},keep.kd);record(lk,{taken:[],kept:keep.kept,step:keep.step});setLk(lk);after();}}
    render();
    toast('Undone: '+meWhat+' is as it was before the take'+(keep&&keep.kept.length?'; the '+(keep.kept.length===1?'difference':'differences')+' kept then '+(keep.kept.length===1?'is':'are')+' still kept':'')+'.','ok');return true;}
  function leave(){W.cur=null;W.msg='';render();}
  /* the reprint line goes only when the user says the pages are printed: a browser reports a cancelled print as a print */
  function printed(){const lk=getLk();if(!lk||!lk.rp)return false;delete lk.rp;delete lk.rpd;setLk(lk);after();render();toast('The reprint line is cleared.','ok');return true;}
  async function unlink(){const lk=getLk(),also=[];if(lk&&lk.rp&&lk.rp.length)also.push('the list of pages to reprint');if(lk&&lk.took)also.push('the note of what was last taken');
    if(!(await confirmBox(T.unlink+(also.length?'\nThat removes '+andList(also)+' too.':''),{ok:'Unlink'})))return false;
    W.cur=null;dropUndo();W.msg='';setLk(null);after();render();return true;}
  function link(){const lk=getLk()||{v:1,base:{}};lk.on=1;setLk(lk);W.msg='';after();render();if(framed())ask();}
  /* the relay */
  function ask(){if(!framed()||W.waitA)return;W.cur=null;dropUndo();W.waitA=Date.now();clearTimeout(W.tA);
    W.tA=setTimeout(()=>{if(!W.waitA)return;W.waitA=0;msg(T.noAnswer);render();},12000);
    msg('Asking the workstation for '+O+'\u2026','ok');render();
    try{window.parent.postMessage({nbh:'ask',want:other},'*');}catch(e){W.waitA=0;clearTimeout(W.tA);msg(T.noAnswer);render();}}
  function openBeside(){if(!framed()||W.waitO)return;W.waitO=Date.now();clearTimeout(W.tO);
    W.tO=setTimeout(()=>{if(!W.waitO)return;W.waitO=0;msg(T.noOpen);render();},2000);render();
    try{window.parent.postMessage({nbh:'open',want:other,beside:true},'*');}catch(e){W.waitO=0;clearTimeout(W.tO);msg(T.noOpen);render();}}
  window.addEventListener('message',ev=>{const d=ev.data;if(!isObj(d)||(d.nbh!=='answer'&&d.nbh!=='opened'))return;
    const parentOk=framed()&&ev.source===window.parent;
    if(d.nbh==='answer'){
      if(!parentOk||!W.waitA||d.want!==other){W.ignored++;return;}
      W.waitA=0;clearTimeout(W.tA);
      if(d.ok!==true){msg(d.why==='not open'?T.notOpen:T.noAnswer);render();return;}
      const r=readText(isObj(d.snap)?d.snap.own:'','',other,me);
      if(!r.ok){msg(r.msg);render();return;}
      compareWith(r.S,{via:'shell',saved:r.saved});return;}
    if(!parentOk||!W.waitO||d.want!==other){W.ignored++;return;}
    W.waitO=0;clearTimeout(W.tO);
    if(d.ok!==true){msg(T.noOpen);render();return;}
    /* beside:false: the workstation opened the partner in place of this form (a phone has no room for two) */
    msg(d.beside===false?O+' opens in place of '+meWhat+', since this screen has no room for both; come back to '+meWhat+' to see the comparison.':
      O+' is opening beside '+meWhat+'; it is compared in a moment.','ok');render();setTimeout(ask,1500);});
  /* a saved file */
  /* a file opened while the relay is still asking wins: the late answer is then ignored, as one not waited for. A file
     refused leaves the table that was open, and its ticks, as they were. */
  function fromFile(text,name){if(W.waitA){W.waitA=0;clearTimeout(W.tA);}
    const r=readText(text,name,other,me);if(!r.ok){msg(r.msg);render();return false;}
    return compareWith(r.S,{via:'file',file:r.file,saved:r.saved});}
  /* the keyboard stays where it was: after a button rebuilds the table or hides itself, the focus goes back to that
     button, else to the next one named, else to the status line (or, unlinked, to Link) */
  function refocus(){const sels=[].slice.call(arguments);
    for(const s of sels){const el=s?Q(s):null;if(el&&!el.disabled&&el.getClientRects().length){try{el.focus({preventScroll:true});}catch(e){}return;}}
    const on=!Q('.lk-on').hidden,t=on?Q('.lk-status'):Q('[data-lk="on"]');if(!t)return;if(on)t.tabIndex=-1;try{t.focus({preventScroll:true});}catch(e){}}
  if(host){
    const fi=Q('.lk-fileIn');
    /* The partner's file is not this form's saved state. The forms' unsaved-work guard (nbh-guard) takes the change
       of any file input as "a file was just opened, so nothing is unsaved", so the change is caught here, at the
       window, before it reaches the document, and handled without passing on. */
    window.addEventListener('change',e=>{if(e.target!==fi)return;e.stopPropagation();const f=fi.files&&fi.files[0];if(!f)return;const rd=new FileReader();
      rd.onload=()=>{fromFile(rd.result,f.name);};rd.onerror=()=>{msg('That file could not be read as a file '+O+' saved. Nothing was changed.');};rd.readAsText(f);fi.value='';},true);
    /* the first edit after a take withdraws Undo (see undoOk), and says so */
    ['input','change'].forEach(t=>document.addEventListener(t,e=>{if(!W.undo||(e.target&&host.contains(e.target)))return;
      setTimeout(()=>{if(W.undo&&!undoOk()){dropUndo();msg('Undo is no longer offered: '+meWhat+' has changed since the take.');render();}},0);}));
    host.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!host.contains(b))return;
      const a=b.dataset.lk,act=b.dataset.act,k=b.dataset.key,i=b.dataset.i;
      if(a==='on'){link();refocus('[data-lk="compare"]','[data-lk="file"]');}else if(a==='compare')ask();else if(a==='file'){W.msg='';fi.click();}else if(a==='beside')openBeside();
      else if(a==='unlink')unlink().then(done=>{if(done)refocus('[data-lk="on"]');});else if(a==='apply')apply();else if(a==='leave'){leave();refocus();}else if(a==='undo'){undo();refocus();}
      else if(a==='printed'){printed();refocus();}
      else if(act==='take'||act==='keep')press(k,act);else if(act==='choose'){choose(k,+i);refocus('button[data-act="choose"][data-key="'+k+'"][data-i="'+i+'"]');}});}
  const api={compare(){if(framed())ask();else{const fi=Q('.lk-fileIn');if(fi)fi.click();}},compareWith,render,fromFile,
    state(){const lk=getLk();return {on:!!lk&&lk.on===1,lk,res:lk&&lk.last?lk.last.res:'',table:!!W.cur,blocked:blocked(),
      apply:!!W.cur&&!blocked()&&anyPressed()&&!W.busy,undo:!!W.undo,msg:W.msg,toast:W.toast,waiting:!!W.waitA,opening:!!W.waitO,
      status:lk&&lk.on===1?statusLines(lk):[]};},
    rows(){return W.cur?W.cur.rows.filter(r=>r.what&&r.key).map(r=>{const s=W.cur.st[r.key];return {key:r.key,what:r.what,here:val(r.here),there:val(r.there),st:s.st,label:s.label,take:s.take,keep:s.keep,pressed:W.cur.pressed[r.key]||''};}):[];},
    press,apply,undo,leave,link,unlink,choose,printed,ignored:()=>W.ignored};
  window.nbhLink=api;
  render();
  return api;}

window.NBHLink={norm,hash,near,tokSame,tokKey,TOKWORD,readLk,isOn,pack,planOf,boardOf,whoRow,problem,pbOf,problemNote,readText,stateOf,mount,confirm:confirmBox,MAX};
})();

/* ===== Form TK-1: the Bus ride type (bus.js, v21.49; functions only, used by script-main.js) ===== */
/* ===== (v21.49) The Bus ride type: the token board for a ride on the school bus =====
   Setup's "Book type" makes the book a bus-ride book: the Board carries the bus rules (the Targets page's cards, two to five)
   and the item in the Earn box, and the tokens come at checkpoints along the route rather than at the end of a classroom
   interval. Everything here is a function (this file goes into script.js before script-main.js, whose constants it uses only
   when called), and it keeps its settings in the book's own state: the meta keys bus_* and kind, the landmarks in S.lm.
   - The ride: its length in minutes, typed. The addresses (optional) stay in this file only: they are never printed, never
     sent, and Open in Maps hands them to the Maps app on this device only when it is tapped.
   - How a token is earned: one token at a checkpoint when every rule was followed ("all"), or each rule its own row of
     tokens ("each": a missed rule leaves only its own slot empty).
   - When: spread over the ride (the ride's length less the minutes kept before the stop, divided by the tokens, so the last
     token comes just before the stop) or at a set interval (the board can fill more than once on a long ride).
   - Fading the timer: the checkpoints become landmarks on the route (a store, a park, a bridge), then every other landmark.
   - The item: given at the stop by the adult who meets the student, or on the bus when the board fills.
   - The ride plan: a portrait page for the bus staff (the route drawn plainly, what earns a token, when, what to say, the item,
     the fading steps and a ride log). */
function isBus(){return S.meta.kind==='bus';}
function busEach(){return isBus()&&S.meta.bus_rule==='each';}
function busNum(k,def,lo,hi){const v=num(S.meta[k]);return v==null?def:Math.max(lo,Math.min(hi,v));}
function busRide(){return busNum('bus_min',25,3,120);}
function busStep(){const s=S.meta.bus_step;return s==='land'||s==='fewer'?s:'timer';}
function busTime(){return S.meta.bus_time==='fixed'?'fixed':'spread';}
function busReward(){return S.meta.bus_reward==='bus'?'bus':'arrive';}
function busFrom(){return String(S.meta.bus_from||'').trim()||'School';}
function busTo(){return String(S.meta.bus_to||'').trim()||'Home';}
/* the bus rules: the Targets page's cards with a picture or a label, in order (the board shows up to five; a row each, up to four) */
function busRules(){const u=S.tg.filter(o=>has(o)||String(o.l||'').trim());return u.slice(0,busEach()?4:5);}
/* minutes as the bus staff read them off a timer: 4:30 */
function busClock(t){const s=Math.round(t*60);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
/* the landmarks with a name and a minute inside the ride, in route order; "fewer" keeps every other one, the last always */
function busLms(){const R=busRide();return (S.lm||[]).map((o,i)=>({o,i,name:String(lbl(o)||'').trim(),t:num(o.min)})).filter(x=>x.name&&x.t!=null&&x.t>0&&x.t<=R).sort((a,b)=>a.t-b.t||a.i-b.i);}
function busLmUsed(){const L=busLms();return busStep()==='fewer'?L.filter((_,i)=>(L.length-1-i)%2===0):L;}
/* the number of token slots a row of the Board has: the landmarks set it (two to ten) once they are the checkpoints; a board
   with a row for each rule holds up to six; 0 when the classroom count stands */
function busNTok(){if(!isBus())return 0;const base=Math.max(3,Math.min(10,Math.round(num(S.meta.n)||5)));
  const n=busStep()==='timer'?base:Math.max(2,Math.min(10,busLmUsed().length||base));return busEach()?Math.min(6,n):n;}
function tokTotal(){return busEach()?nTok()*Math.max(2,busRules().length):nTok();}
/* the checkpoints of one ride: {t (minutes into the ride), lab (what the slot and the plan say), lm (the landmark's card)} */
function busCps(){const R=busRide(),st=busStep();
  if(st!=='timer')return busLmUsed().map(x=>({t:x.t,lab:x.name,lm:x.o}));
  if(busTime()==='fixed'){const ev=busNum('bus_every',5,1,30),out=[];for(let j=1;j*ev<=R-.5+1e-9&&out.length<60;j++)out.push({t:j*ev,lab:busClock(j*ev)});return out;}
  const n=nTok(),lead=busNum('bus_lead',2,0,10),last=Math.max(R*.5,R-lead),iv=last/n;
  return Array.from({length:n},(_,i)=>{const t=i===n-1?Math.round(last*4)/4:Math.round(iv*(i+1)*4)/4;return{t,lab:busClock(t)};});}
/* the plan of a ride, with what the form has to say about it */
function busPlan(){const R=busRide(),st=busStep(),cps=busCps(),n=nTok(),rules=busRules(),k=busEach()?Math.max(2,rules.length):1,warn=[],note=[];
  const fixed=st==='timer'&&busTime()==='fixed',K=cps.length,fills=fixed?Math.floor(K/n):1;
  const gaps=cps.map((c,i)=>c.t-(i?cps[i-1].t:0)),gmin=gaps.length?Math.min(...gaps):0,gmax=gaps.length?Math.max(...gaps):0;
  if(rules.length<2)warn.push('Put at least two bus rules on the Targets page (seatbelt on, stay in your seat, quiet voice, hands to self): the Board shows them in a row'+(busEach()?', one row of tokens each':'')+'.');
  if(st==='timer'&&!fixed&&R/n<1)warn.push('The tokens are under a minute apart: hard for the bus staff to keep up with. Use fewer tokens.');
  if(st==='timer'&&!fixed&&R/n>10)note.push('About '+Math.round(R/n)+' minutes between tokens is a long wait while the board is new; start with more tokens (or a token every 3 to 5 minutes) and thin them later.');
  if(fixed){const ev=busNum('bus_every',5,1,30);
    if(!K)warn.push('A token every '+ev+' minutes gives no checkpoint on a '+R+'-minute ride.');
    else if(K<n)warn.push('A token every '+ev+' minutes gives '+K+' checkpoint'+(K===1?'':'s')+' on this ride: the board of '+n+' does not fill before the stop. Use a shorter interval, fewer tokens, or spread the tokens over the ride.');
    else if(K>n){const even=[2,3,4,5,6,8,10,15].filter(e=>{const k=Math.floor((R-.5+1e-9)/e);return k>=n&&k%n===0;});
      note.push('The board fills '+(fills===1?'once':fills+' times')+' on this ride (every '+n+' tokens, '+busClock(n*ev)+')'+(fills>1?': an exchange each time it fills'+(busReward()==='arrive'?'; with the item given at the stop, each full board is counted and traded there':''):'')+'.'+(K%n?' The last '+(K%n)+' token'+(K%n===1?'':'s')+' before the stop do'+(K%n===1?'es':'')+' not fill another board'+(even.length?': a token every '+(even.length>1?even.slice(0,-1).join(', ')+' or '+even[even.length-1]:even[0])+' minutes comes out even.':'.'):''));}
    if(ev>10)note.push('More than 10 minutes between tokens is a long wait while the board is new.');}
  if(st!=='timer'){const L=busLms(),all=(S.lm||[]).filter(o=>String(lbl(o)||'').trim());
    if(all.length>L.length)note.push((all.length-L.length)+' landmark'+(all.length-L.length===1?' has':'s have')+' no minute inside the '+R+'-minute ride and '+(all.length-L.length===1?'is':'are')+' left out.');
    if(L.length<2)warn.push('Add the landmarks along the route (at least two, better four to six), each with the minute it is passed: they become the checkpoints.');
    else{if(cps.length<2)warn.push('Every other landmark leaves fewer than two checkpoints: add landmarks, or go back to the landmarks step.');
      const lastT=cps.length?cps[cps.length-1].t:0;if(R-lastT>5)note.push('The last landmark is '+Math.round(R-lastT)+' minutes before the stop, so the board is full well before the item: add a landmark nearer the stop, or give the item on the bus.');
      if(cps.length>2&&gmin>0&&gmax>2.5*gmin)note.push('The landmarks are unevenly spaced ('+busClock(gmin)+' to '+busClock(gmax)+' apart): the long gaps are the hard part of the ride; add a landmark in the longest one if there is one to see.');
      if(cps.some((c,i)=>i&&c.t===cps[i-1].t))warn.push('Two landmarks have the same minute: give each its own.');}}
  if(busReward()==='bus')note.push('An item on the bus: check the district’s transportation rules first, and any allergy or choking-risk plan, before a snack is eaten on the bus; a non-food item (a sticker, a song, a few minutes with a tablet) is the usual choice.');
  const total=n*k,goal=Math.max(1,Math.min(total,Math.round(num(S.meta.bus_goal)||total)));
  /* the stops are fixed, so a missed checkpoint cannot be made up later on the ride: with every token needed, one miss means no item */
  if(!fixed&&goal===total&&total>=3)note.push('With every token needed, one missed checkpoint means no item on that ride (the checkpoints cannot be made up before the stop). While the board is new, a goal of most of the tokens ('+(total-1)+' of '+total+', for example) keeps the item within reach; raise it to every token as the rides go well.');
  return{R,st,cps,n,k,rules,each:busEach(),fixed,K,fills,goal,total,warn,note,gaps};}

/* ---------------- Setup: the bus band ---------------- */
const BUS_STEPS=[['timer','A timer at the checkpoint times (to start)'],['land','Landmarks on the route as the checkpoints'],['fewer','Every other landmark (fewer checkpoints)']];
function busMapsUrl(){const a=String(S.meta.bus_fromA||'').trim(),b=String(S.meta.bus_toA||'').trim();if(!a||!b)return '';
  return 'https://maps.apple.com/?saddr='+encodeURIComponent(a)+'&daddr='+encodeURIComponent(b)+'&dirflg=d';}
/* the landmark rows: rebuilt only when they change in number (or a picture changes), so typing in one keeps its place */
function busTables(){const tb=$('#lmTbl tbody');if(!tb)return;const ae=document.activeElement,typing=ae&&ae.closest&&ae.closest('#lmTbl')&&/^(INPUT|SELECT)$/.test(ae.tagName);
  if(typing&&tb.children.length===S.lm.length)return;
  tb.innerHTML=S.lm.length?S.lm.map((o,i)=>'<tr><td class="num">'+(i+1)+'</td><td>'+pickCell('lm',i,o)+'</td><td><input data-r="lm" data-i="'+i+'" data-f="l" name="lm.'+i+'.l" value="'+esc(o.l)+'" placeholder="'+esc(lbl({k:o.k,ph:o.ph})||'the store, the park, the bridge')+'" aria-label="Landmark '+(i+1)+': its name"></td><td><input data-r="lm" data-i="'+i+'" data-f="min" name="lm.'+i+'.min" value="'+esc(o.min)+'" inputmode="decimal" placeholder="min" aria-label="Landmark '+(i+1)+': minutes into the ride" style="width:5.5em"></td><td><button type="button" class="tool" data-lmdel="'+i+'" aria-label="Remove landmark '+(i+1)+'">Remove</button></td></tr>').join(''):'<tr><td colspan="5" class="hint">No landmarks yet. Add the ones your learner can see from the window, in the order the bus passes them, with the minute each is passed (ride along once with a watch, or ask the driver).</td></tr>';
  const ad=$('#lmAdd');if(ad)ad.disabled=S.lm.length>=10;}
/* what the plan comes to: the checkpoints of this ride, and what the form has to say about them */
function busCalc(){const band=$('#busBand');if(!band)return;const on=isBus();
  $$('.bus-only').forEach(e=>{e.hidden=!on;});$$('.class-only').forEach(e=>{e.hidden=on;});if(!on)return;
  if(S.caps.length!==nTok()){S.caps=defCaps(nTok(),tokName());const ct=$('#capTbl tbody');if(ct&&!(document.activeElement&&document.activeElement.closest&&document.activeElement.closest('#capTbl')))renderTbls();}
  const p=busPlan(),m=S.meta,ns=$('[data-m="n"]');if(ns){ns.disabled=p.st!=='timer';const h=$('#busNHint');if(h)h.textContent=p.st!=='timer'?'On the landmark steps the landmarks set the count: '+p.n+' token'+(p.n===1?'':'s')+(p.each?' a row':'')+'.':p.each&&num(m.n)>6?'A row for each rule holds up to six tokens: '+p.n+' a row.':'';}
  $$('.bus-spread').forEach(e=>{e.hidden=!(p.st==='timer'&&!p.fixed);});$$('.bus-fixed').forEach(e=>{e.hidden=!(p.st==='timer'&&p.fixed);});$$('.bus-each').forEach(e=>{e.hidden=!p.each;});$$('.bus-time').forEach(e=>{e.hidden=p.st!=='timer';});
  const mb=$('#busMaps');if(mb){const u=busMapsUrl();mb.disabled=!u;mb.title=u?'Opens the Maps app with directions between the two addresses':'Type both addresses to open the route in Maps';}
  const rows=p.cps.slice(0,p.fixed?Math.max(p.n,12):60).map((c,i)=>'<tr><td class="num">'+(i+1)+'</td><td>'+busClock(c.t)+'</td><td>'+(c.lm?esc(c.lab):p.fixed?'timer (every '+busClock(busNum('bus_every',5,1,30))+')':'timer')+'</td><td>'+(p.fixed&&p.K>p.n?'board '+(Math.floor(i/p.n)+1)+', token '+(i%p.n+1)+(i>=p.fills*p.n?' (does not fill a board)':''):'token '+(i+1)+(i===p.cps.length-1&&!p.fixed?' (the last: the board is full)':''))+'</td></tr>').join('');
  const more=p.fixed&&p.K>Math.max(p.n,12)?'<tr><td colspan="4" class="hint">and so on, every '+busClock(busNum('bus_every',5,1,30))+', to '+busClock(p.cps[p.K-1].t)+' ('+p.K+' in all)</td></tr>':'';
  const head=p.cps.length?(p.st==='timer'?(p.fixed?'A token every '+busClock(busNum('bus_every',5,1,30))+' on a '+p.R+'-minute ride: '+p.K+' checkpoint'+(p.K===1?'':'s')+'.':p.n+' tokens spread over a '+p.R+'-minute ride: about one every '+busClock(p.cps[p.cps.length-1].t/p.n)+', the last '+busClock(p.R-p.cps[p.cps.length-1].t)+' before the stop.'):p.cps.length+' landmark'+(p.cps.length===1?'':'s')+' as the checkpoints'+(p.st==='fewer'?' (every other one, the last kept)':'')+'.'):'No checkpoints yet.';
  const rule=p.each?' Each rule earns its own token at every checkpoint: '+p.k+' rows of '+p.n+' ('+p.total+' tokens); the item comes with '+(p.goal===p.total?'every token':p.goal+' of the '+p.total)+'.':' One token at a checkpoint when every rule was followed since the last one.';
  const rw=busReward()==='arrive'?' The item is given at the stop ('+esc(busTo())+') by the adult who meets your learner.':' The item is given on the bus when the board fills.';
  const out=$('#busCalc');if(out)out.innerHTML='<div class="verdict '+(p.warn.length?'v-mid':'v-ok')+'"><b>'+(p.warn.length?'Still open:':'The ride plan.')+'</b> '+(p.warn.length?esc(p.warn.join(' '))+' ':'')+esc(head)+esc(rule)+rw+'</div>'+(p.note.length?'<ul class="hint bus-notes">'+p.note.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+
    (p.cps.length?'<div class="grid-wrap"><table class="rt" id="busCpTbl"><thead><tr><th style="width:8%">#</th><th style="width:16%">Into the ride</th><th>Checkpoint</th><th style="width:30%">On the board</th></tr></thead><tbody>'+rows+more+'</tbody></table></div>':'');}
function busWire(){
  document.addEventListener('click',e=>{const d=e.target.closest('button[data-lmdel]');if(d){S.lm.splice(+d.dataset.lmdel,1);ensure();renderAll();return;}
    if(e.target.closest('#lmAdd')){if(S.lm.length<10){S.lm.push(Object.assign(cello(),{min:''}));renderAll();const ins=$$('#lmTbl input[data-f="l"]');if(ins.length)ins[ins.length-1].focus();}return;}
    if(e.target.closest('#busSwap')){const m=S.meta;[m.bus_from,m.bus_to]=[m.bus_to||'',m.bus_from||''];[m.bus_fromA,m.bus_toA]=[m.bus_toA||'',m.bus_fromA||''];renderAll();return;}
    if(e.target.closest('#busMaps')){const u=busMapsUrl();if(u)window.open(u,'_blank','noopener');return;}});
  /* a landmark's minute changes how many checkpoints there are: the token count, the captions and the plan follow at once */
  document.addEventListener('input',e=>{const el=e.target;if(el.dataset&&el.dataset.r==='lm'){if(S.caps.length!==nTok())ensure();}});
  document.addEventListener('change',e=>{const el=e.target;if(el.dataset&&(el.dataset.m==='kind'||/^bus_(rule|step|time)$/.test(el.dataset.m||''))){ensure();renderAll();}});}

/* ---------------- the Board ---------------- */
/* the caption under a token slot: the checkpoint (its time or its landmark) when Setup prints them; the caption otherwise */
function busSlotLab(i){if(!isBus()||S.chk.bus_cap===false)return null;const p=busPlan();if(p.fixed&&p.K!==p.n)return null;const c=p.cps[i];return c?c.lab:null;}
/* a row for each rule: the rule's card on the left, its token slots, the checkpoints over the columns, the Earn box on the right */
function busGeom(){const p=busPlan(),mode=pageMode(),ch=mode==='fill'?612/scl():PH,inH=ch-2.67-2.65-6,k=p.k,n=p.n;
  const top=86,head=p.cps.length&&S.chk.bus_cap!==false?16:0,rowsH=inH-top-head-10,rp=Math.min(104,rowsH/k);
  const tgtW=118,xs=12+tgtW+10,earnW=Math.min(128,rowsH-56),earnX=PANW-6-12-earnW,cw=(earnX-16-xs)/n,sz=Math.max(26,Math.min(rp-10,cw-6,72));
  return{p,k,n,top,head,rowsH,rp,tgtW,xs,earnW,earnX,cw,sz,inH};}
function busGoalHtml(){if(!isBus())return '';const p=busPlan();return p.goal<p.total?'<div class="ggoal" style="font-size:'+(11*scl()).toFixed(2)+'pt">with '+p.goal+' of '+p.total+'</div>':'';}
function busTokIn(){return (busGeom().sz-6)*scl()/72;}
function busGridBoard(){const g=busGeom(),p=g.p,rules=p.rules.slice();while(rules.length<g.k)rules.push(cello());const fs=v=>(v*scl()).toFixed(2)+'pt';
  let h=photoHtml('r')+'<div class="ttl rules" data-frac="1"><span class="ul">'+nameTitle()+'</span></div>';
  if(g.head)for(let j=0;j<g.n;j++){const c=p.cps[j];h+='<div class="gcp" style="left:'+pt(g.xs+j*g.cw)+';width:'+pt(g.cw)+';top:'+pt(g.top)+';font-size:'+fs(9.5)+'">'+esc(c?c.lab:'')+'</div>';}
  rules.forEach((o,r)=>{const y=g.top+g.head+r*g.rp,ph=Math.max(20,g.rp-26);
    h+='<div class="grule" style="left:'+pt(12)+';top:'+pt(y)+';width:'+pt(g.tgtW)+';height:'+pt(g.rp-6)+'"><div class="gl" style="font-size:'+fs(12)+'">'+esc(lbl(o))+'</div><div class="gp" style="height:'+pt(ph)+';width:'+pt(Math.min(g.tgtW,ph*1.25))+'">'+(isWord(o)?'':pic(o,''))+'</div></div>';
    for(let j=0;j<g.n;j++)h+='<div class="gslot" style="left:'+pt(g.xs+j*g.cw+(g.cw-g.sz)/2)+';top:'+pt(y+(g.rp-6-g.sz)/2)+';width:'+pt(g.sz)+';height:'+pt(g.sz)+'"><span class="dot"></span></div>';
    if(r)h+='<i class="grow" style="left:'+pt(8)+';right:'+pt(g.earnW+24)+';top:'+pt(y-3)+'"></i>';});
  const ey=g.top+g.head+(g.rowsH-g.head-(g.earnW+40))/2;
  h+='<div class="earn gearn" style="left:'+pt(g.earnX)+';top:'+pt(Math.max(g.top-6,ey))+';width:'+pt(g.earnW+4)+'"><div class="lab">Earn</div><div class="bx ft green" style="width:'+pt(g.earnW+3)+';height:'+pt(g.earnW+3)+'"><span class="dot"></span></div>'+(p.goal<p.total?'<div class="ggoal" style="font-size:'+fs(11)+'">with '+p.goal+' of '+p.total+'</div>':'')+'</div>';
  return pgOpen('bd','front')+'<div class="panel">'+h+'</div>'+pgClose;}
/* the Tokens page of a board with a row for each rule: a box for every token, in the Board's own rows and columns */
function busGridTokens(){const g=busGeom(),sz=g.sz,gap=8,W=g.n*sz+(g.n-1)*gap*1.6,x0=(PANW-6-W)/2,room=g.inH-104-40,rowH=Math.min(sz+gap*1.6,room/g.k),y0=104+Math.max(0,(room-g.k*rowH+gap*1.6)/2);let b='';
  for(let r=0;r<g.k;r++)for(let j=0;j<g.n;j++)b+='<div class="ybx gy" style="left:'+pt(x0+j*(sz+gap*1.6))+';top:'+pt(y0+r*rowH)+';width:'+pt(sz)+';height:'+pt(sz)+'"><span class="dot"></span></div>';
  const corner=has(S.tok[0])?tokCard(55*scl()/72):'';
  return pgOpen('tk','front')+'<div class="panel"><div class="tkcorner l">'+corner+'</div><div class="tkcorner r">'+corner+'</div><div class="ttl tk" data-frac=".8"><span class="ul">Tokens!!!</span></div>'+b+'<div class="foot">See Instructions On The Back</div></div>'+pgClose;}

/* ---------------- the ride plan, for the bus staff (a portrait page) ---------------- */
/* the route drawn plainly: a road from the start to the stop, the checkpoints on it where they fall in the ride (no map, nothing
   of the real streets: the addresses are never drawn or printed) */
const BUS_X0=70,BUS_X1=700;
function busRoadY(x){const u=(x-BUS_X0)/(BUS_X1-BUS_X0);return 104-30*Math.sin(u*Math.PI*2.2)+8*u;}
function busRoadPath(){let d='';for(let x=BUS_X0;x<=BUS_X1+.1;x+=6)d+=(d?'L':'M')+x.toFixed(1)+' '+busRoadY(x).toFixed(1);return d;}
function busIcon(kind,x,y,s){s=s||1;const T='translate('+x.toFixed(1)+' '+y.toFixed(1)+') scale('+s+')';
  if(kind==='school')return '<g transform="'+T+'"><path d="M-22 0V-26L0-40L22-26V0Z" fill="#e8d3b0" stroke="#5b4a32" stroke-width="2"/><path d="M-26-26L0-44L26-26" fill="none" stroke="#a33a2c" stroke-width="4" stroke-linejoin="round"/><rect x="-6" y="-14" width="12" height="14" fill="#7a5a36"/><rect x="-17" y="-22" width="7" height="7" fill="#bfe1f5" stroke="#5b4a32"/><rect x="10" y="-22" width="7" height="7" fill="#bfe1f5" stroke="#5b4a32"/><path d="M0-44V-58" stroke="#5b4a32" stroke-width="2"/><path d="M0-58H12L9-54L12-50H0" fill="#d9483b"/></g>';
  if(kind==='home')return '<g transform="'+T+'"><path d="M-20 0V-24H20V0Z" fill="#f7e6c4" stroke="#5b4a32" stroke-width="2"/><path d="M-25-22L0-42L25-22" fill="#c9553f" stroke="#5b4a32" stroke-width="2" stroke-linejoin="round"/><rect x="-5" y="-14" width="10" height="14" fill="#6b8fb3"/><rect x="9" y="-19" width="7" height="7" fill="#bfe1f5" stroke="#5b4a32"/></g>';
  if(kind==='bus')return '<g transform="'+T+'"><rect x="-26" y="-22" width="52" height="20" rx="4" fill="#f6c21b" stroke="#3d3a2a" stroke-width="2"/><rect x="-21" y="-18" width="9" height="7" fill="#d9eefa"/><rect x="-9" y="-18" width="9" height="7" fill="#d9eefa"/><rect x="3" y="-18" width="9" height="7" fill="#d9eefa"/><rect x="15" y="-18" width="8" height="9" fill="#d9eefa"/><circle cx="-14" cy="-1" r="4.5" fill="#333"/><circle cx="14" cy="-1" r="4.5" fill="#333"/></g>';
  if(kind==='pin')return '<g transform="'+T+'"><path d="M0 0C-3-8-10-12-10-20A10 10 0 0 1 10-20C10-12 3-8 0 0Z" fill="#2f7fbf" stroke="#1d4a77" stroke-width="1.5"/><circle cx="0" cy="-20" r="4" fill="#fff"/></g>';
  return '<g transform="'+T+'"><circle r="9" fill="#fff" stroke="#1d4a77" stroke-width="2"/><path d="M0-5V0L4 3" stroke="#ef7d00" stroke-width="2" fill="none" stroke-linecap="round"/></g>';}
/* the road, the two ends and their names (the walkthrough draws the checkpoints and the bus over it) */
function busRouteBase(){const startHome=/home|house/i.test(busFrom())&&!/home|house/i.test(busTo());
  return '<path d="'+busRoadPath()+'" fill="none" stroke="#9aa3ab" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path d="'+busRoadPath()+'" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="9 9"/>'+
    busIcon(startHome?'home':'school',BUS_X0-34,busRoadY(BUS_X0)+12,1.05)+busIcon(startHome?'school':'home',BUS_X1+34,busRoadY(BUS_X1)+12,1.05)+
    '<text x="'+(BUS_X0-34)+'" y="'+(busRoadY(BUS_X0)+30).toFixed(1)+'" class="bp-end" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="700" fill="#1d2b36">'+esc(busFrom())+'</text><text x="'+(BUS_X1+34)+'" y="'+(busRoadY(BUS_X1)+30).toFixed(1)+'" class="bp-end" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="700" fill="#1d2b36">'+esc(busTo())+'</text>';}
function busRouteSvg(p,opt){opt=opt||{};const cps=p.cps,R=p.R,many=cps.length>14,step=many?Math.ceil(cps.length/14):1;
  let s='<svg class="bp-route" viewBox="0 0 770 190" role="img" aria-label="The route drawn plainly: '+esc(busFrom())+' to '+esc(busTo())+', with the checkpoints">'+busRouteBase();
  cps.forEach((c,i)=>{const x=BUS_X0+(BUS_X1-BUS_X0)*Math.min(1,c.t/R),y=busRoadY(x),lab=!many||i%step===step-1||i===cps.length-1;
    s+=c.lm?busIcon('pin',x,y-6,1):busIcon('clock',x,y,1);
    s+='<g class="bp-tok"><circle cx="'+x.toFixed(1)+'" cy="'+(y-38).toFixed(1)+'" r="10" fill="#ffe066" stroke="#b08900" stroke-width="1.6"/><text x="'+x.toFixed(1)+'" y="'+(y-34.5).toFixed(1)+'">'+(p.fixed&&p.fills>1?(i%p.n+1):i+1)+'</text></g>';
    if(lab)s+='<text x="'+x.toFixed(1)+'" y="'+(y+26).toFixed(1)+'" class="bp-cp">'+esc(c.lm?c.lab:busClock(c.t))+'</text>'+(c.lm?'<text x="'+x.toFixed(1)+'" y="'+(y+38).toFixed(1)+'" class="bp-cpt">about '+busClock(c.t)+'</text>':'');});
  if(!opt.nobus)s+=busIcon('bus',BUS_X0+6,busRoadY(BUS_X0+6)-2,.9);
  return s+'</svg>';}
function busPlanPage(){const p=busPlan(),T=turned(),f=String(S.meta.first||'').trim(),ap=S.meta.poss==='bare'&&/s$/i.test(f)?'’':'’s';
  const who=f?esc(f)+ap:'The student’s',nm=f?esc(f):'the student';const tok=esc(plural(tokName()).toLowerCase()),one=esc(tokName().toLowerCase());
  const cards=p.rules.map(o=>'<div class="bp-card"><div class="bp-cpic">'+(isWord(o)?'':pic(o,''))+'</div><div class="bp-cl">'+esc(lbl(o)||'(a rule)')+'</div></div>').join('')||'<p class="hint">(the bus rules go on the Targets page)</p>';
  const ev=busClock(busNum('bus_every',5,1,30));
  const when=p.st==='timer'?(p.fixed?'A timer set to go off every <b>'+ev+'</b> ('+p.K+' checkpoint'+(p.K===1?'':'s')+' on the '+p.R+'-minute ride'+(p.K>p.n?'; the board of '+p.n+' fills '+(p.fills===1?'once':p.fills+' times'):'')+').':'A timer at these times into the ride: <b>'+p.cps.map(c=>busClock(c.t)).join(', ')+'</b>. The last comes '+busClock(p.R-(p.cps.length?p.cps[p.cps.length-1].t:p.R))+' before the stop.')+' A vibrating watch or a phone on vibrate keeps it quiet on a noisy bus.':'As the bus passes each landmark: <b>'+p.cps.map(c=>esc(c.lab)).join(', ')+'</b>'+(p.st==='fewer'?' (every other landmark on the route)':'')+'.';
  const earn=p.each?'Each rule earns its own '+one+' at every checkpoint: a row of '+p.n+' for each rule. A missed rule leaves only its own slot empty for that checkpoint.':'One '+one+' at each checkpoint when '+nm+' followed <b>every</b> rule since the last checkpoint.';
  const item=busReward()==='arrive'?'At the stop ('+esc(busTo())+'): the board goes with '+nm+' to the adult who meets the bus, who gives the item right away when the board has '+(p.goal<p.total?p.goal+' of the '+p.total+' '+tok:'every '+one)+'. Tell that adult beforehand what the item is and where it is kept.':'On the bus, as soon as the board '+(p.goal<p.total?'has '+p.goal+' of the '+p.total+' '+tok:'is full')+': the item for the time or amount agreed, then the '+tok+' come off for the next board. Food on the bus only if the district’s transportation rules and the student’s health plan allow it.';
  const steps=[['timer','Step 1: a timer at the checkpoint times.'],['land','Step 2: landmarks on the route instead of the timer, about as many as before.'],['fewer','Step 3: every other landmark.'],['','Step 4: the board at the stop only, then praise alone. Go back a step if the rides get harder.']];
  const stepHtml=steps.map(([k,w])=>'<li'+(k===p.st?' class="on"':'')+'>'+w+(k===p.st?' <b>(now)</b>':'')+'</li>').join('');
  const logCols=Math.min(p.fixed?Math.max(1,p.K):p.cps.length||p.n,14);
  const logHead='<tr><th class="d">Date</th><th class="ap">AM / PM</th>'+Array.from({length:logCols},(_,i)=>'<th class="c">'+(i+1)+'</th>').join('')+'<th class="t">'+(p.each?'Tokens':'Tokens')+'</th><th class="i">Item?</th><th class="w">Initials</th></tr>';
  const logRow='<tr><td></td><td></td>'+Array.from({length:logCols},()=>'<td class="c"></td>').join('')+'<td class="t">/'+(p.fixed?p.K:p.total)+'</td><td class="i">Y&nbsp;&nbsp;N</td><td></td></tr>';
  const note=String(S.meta.bus_note||'').trim();
  const sub=esc(busFrom())+' to '+esc(busTo())+' &middot; about '+p.R+' minutes &middot; '+(p.st==='timer'?'timer':p.st==='land'?'landmarks':'every other landmark')+' &middot; '+(p.each?'a row for each rule':'one '+one+' for all the rules');
  return '<div class="pg port front'+(T?' tsheet':'')+'" data-kind="busplan" style="--s:1"><div class="bp">'+
    '<div class="bp-h"><div class="bp-t">'+who+' Bus Ride Plan</div><div class="bp-s">For the bus staff &middot; '+sub+'</div></div>'+
    busRouteSvg(p)+
    '<div class="bp-cols"><div class="bp-col"><h4>What earns a '+one+'</h4><div class="bp-cards">'+cards+'</div><p>'+earn+'</p></div>'+
    '<div class="bp-col"><h4>When</h4><p>'+when+'</p><h4>The item</h4><p>'+item+'</p></div></div>'+
    '<h4>At each checkpoint</h4><ol class="bp-ol"><li><b>Rules followed:</b> give the '+one+' right away, with brief praise that names the rule (&ldquo;Great job staying in your seat!&rdquo;), and let '+nm+' put it on the board.</li><li><b>Not followed:</b> no '+one+' this time. Calmly name the rule once (&ldquo;Seatbelt on.&rdquo;); the earned '+tok+' stay on the board, and the next checkpoint is a fresh chance.</li><li>The bus aide or monitor runs the board, never the driver while driving. Keep the board and '+tok+' attached (hook-and-loop) so nothing loose drops or goes in a mouth.</li></ol>'+
    '<div class="bp-cols"><div class="bp-col"><h4>Fading</h4><ol class="bp-steps">'+stepHtml+'</ol></div><div class="bp-col">'+(note?'<h4>Notes</h4><p>'+esc(note).replace(/\n/g,'<br>')+'</p>':'<h4>Notes</h4><div class="bp-lines"><i></i><i></i><i></i></div>')+'</div></div>'+
    '<h4>Ride log</h4><table class="bp-log">'+logHead+Array.from({length:7},()=>logRow).join('')+'</table><p class="bp-key">Tick a box for each checkpoint with a '+one+' (leave it empty when there was none); write the '+tok+' earned and whether the item was given.</p>'+
    '</div></div>';}

/* ---------------- the simulator's bus ride (Load simulator on a bus book): nothing in it is real ---------------- */
function busSim(){Object.assign(S.meta,{kind:'bus',site:'Elementary, bus route 12 (sample)',setting:'',bus_min:'25',bus_from:'School',bus_to:'Home',bus_fromA:'',bus_toA:'',bus_rule:'all',bus_time:'spread',bus_lead:'2',bus_every:'5',bus_step:'timer',bus_reward:'arrive',bus_goal:'',
    bus_note:'Sam sits in the second seat on the right, by the window, with the board on the seat back. Mom meets the bus.'});
  S.ch=['sticker','musicfun','ipad','snackfun','cardbubbles','cardbooks'].map(k=>cello(k));
  S.tg=[cello('sitting','Stay in my seat'),cello('quiet','Quiet voice'),cello('safehands','Hands to self'),cello(),cello(),cello()];
  S.lm=[['store','Grocery store','5'],['park','The park','10'],['','Fire station','14'],['libraryplace','Library','18'],['','The bridge','22']].map(([k,l,m])=>Object.assign(cello(k,l),{min:m}));}
/* the ride plan fits its page: the log gives up rows first (down to three), then the type shrinks a little (to 8.5 pt) */
function busFitPlan(root){$$('.pg[data-kind="busplan"] .bp',root||document).filter(bp=>root||!bp.closest('#wkStage')).forEach(bp=>{if(!bp.clientHeight)return;bp.style.fontSize='';const over=()=>bp.scrollHeight>bp.clientHeight+1;
  const rows=[...bp.querySelectorAll('table.bp-log tr')].slice(1);let i=rows.length;while(over()&&i>3)rows[--i].remove();
  let fs=10.5,g=0;while(over()&&fs>8.5&&g++<12){fs-=.25;bp.style.fontSize=fs+'pt';}});}

/* what the walkthrough needs of a bus book (called inside its copy of the state, on the timer step): the ride's checkpoints,
   the landmark steps, the ride plan page, and what to say about a book that is not finished */
function busWalkF(){const p=busPlan(),m=S.meta,keep=m.bus_step,sheets=m.sheets;
  m.bus_step='land';const land=busCps();m.bus_step='fewer';const fewer=busCps();m.bus_step=keep;
  m.sheets='land';let planHtml='';try{planHtml=busPlanPage();}finally{m.sheets=sheets;}
  const gap=p.cps.length?(p.fixed?busNum('bus_every',5,1,30):p.cps[p.cps.length-1].t/p.cps.length)*60:120;
  const notes=['This walkthrough shows the bus ride from this book: its rules, its item, its route and checkpoints; it starts with the timer (Step 1) and then shows the landmarks and the fewer checkpoints.'];
  return{p,each:p.each,n:p.n,k:p.k,R:p.R,fixed:p.fixed,cps:p.cps,land,fewer,gap,planHtml,notes,reward:busReward(),from:busFrom(),to:busTo(),
    rules:p.rules.map(o=>String(lbl(o)||'').trim()),first:String(S.meta.first||'').trim()};}

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
/* v21.44 the avatar a book starts with: the practice's own Boy picture from the library (the drawn boy where the library is
   not beside the form) */
const AV0='faceboy2';
function avKey(){const k=S.meta.avatar||AV0;return /^av:/.test(k)||P[k]?k:'av:boy';}
/* (v21.49) the bus settings have their own defaults, so a book never takes them (or its Book type) from the one shown before */
const BUS0={kind:'',bus_rule:'all',bus_time:'spread',bus_lead:'2',bus_every:'5',bus_step:'timer',bus_reward:'arrive'};
function blank(){return{meta:Object.assign({poss:'s',layout:'ft',avatar:AV0,n:'5',wm:'20',order:'all',sp_card:'ch:0',sp_size:'large',panel:'light',pagesize:'8.82',credit:CREDIT0},BUS0,DEF),chk:{pg_ch:true,pg_tg:true,pg_bd:true,pg_tk:true,pg_how:false,cs_ch:true,cs_tg:true,cs_tk:true,qrframe:true,bus_cap:true,pg_bus:true},photos:[],lm:[],photo:[cello()],tok:[cello('tk:star')],tokL:[cello('tk:medal')],bg:[cello(),cello()],sp:[cello()],ch:Array.from({length:6},()=>cello()),tg:Array.from({length:6},()=>cello()),ft:[cello(),cello()],caps:[],txt:Object.assign({},TXT0)};}
let S=blank();
const nTok=()=>busNTok()||Math.max(3,Math.min(10,Math.round(num(S.meta.n)||5)));   /* (v21.49) a bus ride's landmarks can set it (bus.js) */
function ensure(){
  if(!S.meta||typeof S.meta!=='object')S.meta={};if(!S.chk||typeof S.chk!=='object')S.chk={};if(!Array.isArray(S.photos))S.photos=[];
  const six=k=>{if(!Array.isArray(S[k]))S[k]=[];while(S[k].length<6)S[k].push(cello());S[k].length=6;};six('ch');six('tg');
  const fix=(k,n,def)=>{if(!Array.isArray(S[k])||S[k].length!==n)S[k]=def();};fix('ft',2,()=>[cello(),cello()]);fix('tok',1,()=>[cello('tk:star')]);fix('tokL',1,()=>[cello('tk:medal')]);fix('photo',1,()=>[cello()]);fix('bg',2,()=>[cello(),cello()]);fix('sp',1,()=>[cello()]);
  if(!Array.isArray(S.lm))S.lm=[];S.lm=S.lm.slice(0,10).map(o=>Object.assign(cello(),o&&typeof o==='object'?o:{},{min:String(o&&o.min!=null?o.min:'')}));   /* (v21.49) the bus ride's landmarks */
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
/* (v21.43) a word card from the library (flag w, e.g. "Waiting"): the card prints its label alone, as on the user's card sheets,
   with nothing in the picture area; the picker and the tables still show the drawn word so it can be recognized */
const isWord=o=>!!(o&&!o.ph&&o.k&&P[o.k]&&P[o.k].w);
function lbl(o){if(!o)return '';if(o.l)return o.l;if(o.ph){const p=photo(o.ph);return p?p.label:'';}if(o.k&&o.k.startsWith('tk:')&&TOK[o.k.slice(3)])return TOK[o.k.slice(3)].l;if(o.k&&o.k.startsWith('av:')&&AV[o.k.slice(3)])return AV[o.k.slice(3)].l;return o.k&&P[o.k]?P[o.k].l:'';}
function pickCell(r,i,o){return '<div class="pick" data-r="'+r+'" data-i="'+i+'"><span class="pv">'+pic(o,'')+'</span><button type="button" data-pick="1">'+(has(o)?'Change':'Choose')+'</button></div>';}
let PICK=null;
function pickDlg(){let d=$('#pickDlg');if(d)return d;d=document.createElement('dialog');d.id='pickDlg';
  d.innerHTML='<div class="pd-head"><div class="pd-top"><b id="pdTitle">Choose a picture</b><div class="pd-seg" id="pdMultiLab" role="group" aria-label="How many pictures"><button type="button" id="pdOne" aria-pressed="true">One picture</button><button type="button" id="pdMulti" aria-pressed="false">Several at once</button></div></div><select id="pdCat" aria-label="Picture category"><option value="">All</option><option value="_photos">My photos</option><option value="_own">Tokens and avatars drawn here</option>'+Object.entries(CATS).map(([k,v])=>'<option value="'+k+'">'+esc(v)+'</option>').join('')+'</select><input id="pdQ" placeholder="search" aria-label="Search pictures"><button type="button" id="pdPhoto">Upload a photo</button><button type="button" id="pdNone">No picture</button><button type="button" id="pdClose">Close</button><div class="pd-bar" id="pdBar"><span id="pdCount"></span><button type="button" id="pdUndo">Clear the picks</button><button type="button" class="pd-go" id="pdGo">Put them on the cards</button></div></div><div class="pd-grid" id="pdGrid"></div><div class="pd-foot">'+esc(window.NBH_PICTO_LICENSE||'')+' Photos are resized to thumbnails and saved inside the form’s file. The tokens and avatars are drawn in this form.</div>';
  document.body.appendChild(d);
  const grid=()=>{const c=$('#pdCat').value,q=($('#pdQ').value||'').toLowerCase();let h='';
    const ownList=PICK&&PICK.first==='tok'?[['tk:',TOK],['av:',AV]]:[['av:',AV],['tk:',TOK]];
    if(!c||c==='_photos')h+=S.photos.filter(p=>!q||p.label.toLowerCase().includes(q)).map(p=>'<button type="button" data-ph="'+esc(p.id)+'"><img src="'+p.img+'" alt="">'+esc(p.label||'photo')+'<span class="pd-x" data-phdel="'+esc(p.id)+'" title="Remove this photo" role="button" style="display:block;color:#8E2A2A;font-size:10px">remove</span></button>').join('');
    if(!c||c==='_own')ownList.forEach(([pre,set])=>{h+=Object.entries(set).filter(([k,v])=>!q||v.l.toLowerCase().includes(q)).map(([k,v])=>'<button type="button" data-k="'+pre+k+'">'+own(v,'')+esc(v.l)+'</button>').join('');});
    if(c!=='_photos'&&c!=='_own')h+=KEYS.filter(k=>(!c||P[k].c===c)&&(!q||P[k].l.toLowerCase().includes(q)||k.includes(q))).map(k=>'<button type="button" data-k="'+k+'">'+picto(k,'')+esc(P[k].l)+(P[k].o?'<span class="pd-yours">yours</span>':'')+'</button>').join('');
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
    if(x){e.preventDefault();e.stopPropagation();if(!(await nbhUI.confirm('Remove this photo?\nAnything using it loses the picture.',{ok:'Remove',danger:true})))return;const id=x.dataset.phdel;S.photos=S.photos.filter(p=>p.id!==id);['photo','tok','tokL','bg','sp','ch','tg','ft','lm'].forEach(k=>(S[k]||[]).forEach(o=>{if(o.ph===id)o.ph='';}));grid();renderAll();return;}
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
  busTables();
  renderSetup();
}
function renderSetup(){const m=S.meta,v=$('#setupVerdict');const bl=$('#buildLine');if(bl)bl.textContent='This copy of the form: build '+BUILD+'.';const nch=S.ch.filter(has).length,ntg=S.tg.filter(has).length;
  if(!m.client&&!m.first&&!nch&&!ntg){v.innerHTML='<div class="verdict v-mid"><b>Setup not started.</b> The student and the first name as it prints, the photo, the tokens; then the Choices and Targets pages.'+lkPhrase()+'</div>';return;}
  const miss=[];if(!m.first)miss.push('the first name (the Board prints a line to write on)');if(!has(S.photo[0]))miss.push('a photo (the '+esc(lbl({k:avKey()})||'avatar').toLowerCase()+' avatar prints instead)');if(nch<6)miss.push((6-nch)+' of the six choices');if(isBus()){if(ntg<2)miss.push('at least two bus rules on the Targets page');}else if(ntg<6)miss.push((6-ntg)+' of the six targets');
  /* (v21.42i) the same picture twice among the six is usually a slip of the finger in the picker */
  const twice=(k,name)=>{const seen={},d=[];S[k].forEach((o,i)=>{const id=o.ph?'ph:'+o.ph:o.k;if(!id)return;if(seen[id]!==undefined)d.push(name+' '+(seen[id]+1)+' and '+(i+1));else seen[id]=i;});return d;};
  const dup=twice('ch','choices').concat(twice('tg','targets'));if(dup.length)miss.push('the same picture on '+dup.join(', ')+' (change one, unless that is meant)');
  v.innerHTML='<div class="verdict '+(miss.length?'v-mid':'v-ok')+'"><b>'+(miss.length?'Still open:':'Set up.')+'</b> '+(miss.length?miss.join('; ')+'.':'')+' '+nTok()+' '+esc(plural(tokName()).toLowerCase())+' to earn'+(termOn()?' (the last one marked'+(termMode()==='pic'?': '+esc(lbl(S.tokL[0])||'its own picture').toLowerCase():'')+')':'')+'; '+(isBus()?'Bus-ride board ('+(busEach()?'a row of tokens for each rule':'one token for all the rules')+', '+(busStep()==='timer'?'timer':'landmarks')+')':m.layout==='rules'?'Rules-row':'First-Then')+' board'+(m.qr?'; QR code on every page':'; no QR code')+'.'+lkPhrase()+'</div>';}

/* ---------------- the QR code (qrcode-generator, inlined above; type 0 = automatic, error correction M) ---------------- */
/* the QR code, made here by qrcode-generator. Plain: black modules, level M. Framed (the default, the assessor's style from the
   Choices file): slate modules, rounded slate finder rings with a green core, SCAN ME in a clear square in the middle, level H
   so the words cost nothing. The core is a deeper green than the tab (#6aa55a): a pale core is read as white by decoders. */
/* the build of this copy of the form, shown on Setup and on the Preview so it is easy to check that the uploaded file is the new one */
const BUILD='v21.49b';
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
function canvasH(kind){const mode=pageMode();if(mode==='fill')return 612/scl();return kind==='bd'&&!busEach()?PH-STRIP+strip().band:PH;}
function pgOpen(kind,side,cls){const i=TABS.findIndex(t=>t[0]===kind),t=TABS[i];const col=S.meta[t[2]]||DEF[t[2]];const s=scl(),mode=pageMode();
  const ch=canvasH(kind),wIn=PW*s/72,hIn=ch*s/72,cx=(11-wIn)/2,cy=mode==='fill'?0:(8.5-hIn)/2;
  let trim='';if(mode!=='fill'){const x1=cx+wIn,y1=cy+hIn;[[cx-.3,cy],[x1,cy],[cx-.3,y1],[x1,y1]].forEach(([x,y])=>{trim+='<i class="trim h" style="left:'+IN(x)+';top:'+IN(y)+'"></i>';});[[cx,cy-.3],[x1,cy-.3],[cx,y1],[x1,y1]].forEach(([x,y])=>{trim+='<i class="trim v" style="left:'+IN(x)+';top:'+IN(y)+'"></i>';});}
  const letters=t[1].split('').map(ch=>'<i>'+ch+'</i>').join('');
  return '<div class="pg '+side+(side==='back'?' bk':'')+(s!==1?' big':'')+(cls?' '+cls:'')+'" data-kind="'+kind+'" data-side="'+side+'" style="--s:'+s.toFixed(4)+'">'+trim+'<div class="cv" style="left:'+IN(cx)+';top:'+IN(cy)+';height:'+IN(hIn)+'"><div class="tab" style="top:'+pt(i*104.76)+';background:'+esc(col)+'">'+letters+'</div><div class="band" style="background:'+esc(S.meta.c_frame||DEF.c_frame)+'">';}
const pgClose='</div></div></div>';
function wmHtml(o){if(!has(o))return '';const op=Math.max(5,Math.min(30,num(S.meta.wm)||20))/100;return '<div class="wm" style="opacity:'+op+'">'+pic(o,'').replace('<svg ','<svg preserveAspectRatio="xMidYMid slice" ')+'</div>';}
function cardHtml(o,size,opts){opts=opts||{};const other=opts.other,blank=opts.blank;const st=opts.w?'width:'+IN(opts.w)+';height:'+IN(opts.h):size?'width:'+IN(size)+';height:'+IN(size):'';
  return '<div class="card'+(opts.ul?' ul':'')+(opts.cls?' '+opts.cls:'')+(isWord(o)&&!other&&!blank?' wd':'')+'" style="'+st+'"><div class="cl">'+(blank?'&nbsp;':esc(other?'Other':(lbl(o)||'')))+'</div><div class="cp">'+(other||blank?'<div class="lines"><i></i><i></i><i></i></div>':isWord(o)?'':pic(o,''))+'</div></div>';}
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
    h+=S.caps.slice(r*per,r*per+k).map((c,i)=>'<div class="slot'+(d.sz<100?' sm':'')+(termOn()&&r*per+i===d.n-1?' last':'')+'" style="left:'+pt(left0+i*d.pitch)+';top:'+pt(9.44+r*d.rowPitch)+';width:'+pt(d.sz+2)+';height:'+pt(d.sz+2)+'"><span class="ca">'+esc(c.a)+'</span><span class="dot"></span><span class="cb">'+esc(busSlotLab(r*per+i)??c.b)+'</span></div>').join('');}
  return h+'</div>';}
function nameTitle(){const f=String(S.meta.first||'').trim();const ap=S.meta.poss==='bare'&&/s$/i.test(f)?'’':'’s';const st=String(S.meta.setting||'').trim();
  const st2=isBus()?st||'Bus':S.meta.layout==='rules'?st:'';   /* (v21.49) a bus book's title: Sam's Bus Chart */
  return (f?esc(f)+ap:'<span class="blank"></span>’s')+' '+(st2?esc(st2)+' ':'')+'Chart';}
/* the student's photo is cropped to the circle at the position and size set on Setup (a portrait's face sits above its middle, so it starts at 35 % down) */
function photoFit(){const x=Math.max(0,Math.min(100,num(S.meta.ph_x)??50)),y=Math.max(0,Math.min(100,num(S.meta.ph_y)??35)),z=Math.max(100,Math.min(300,num(S.meta.ph_z)??100))/100;return 'object-position:'+x+'% '+y+'%;transform-origin:'+x+'% '+y+'%;transform:scale('+z+')';}
/* (v21.42i) the two photos face each other: one of them prints mirrored (the samples mirror the right one) */
function flipSide(){const f=S.meta.ph_flip||'r';return f==='l'||f==='none'?f:'r';}
function photoInner(){const o=S.photo[0];return has(o)?(o.ph?pic(o,'',photoFit()):pic(o,'')):pic({k:avKey()},'');}
function photoHtml(side){return '<div class="bd-photo '+side+(flipSide()===side?' flip':'')+'">'+photoInner()+'</div>';}
function presetBox(o,cls,ul,cx){return '<div class="bx ft '+cls+'"'+(cx!=null?' style="left:'+pt(cx-74.94)+'"':'')+'>'+(has(o)?cardHtml(o,0,{ul}):'<span class="dot"></span>')+'</div>';}
function pageBoard(){if(busEach())return busGridBoard();const d=strip();const panelH=pageMode()==='fill'?null:BDH;const rl=S.meta.layout==='rules'||isBus();   /* (v21.49) a bus book: the rules row, or a row for each rule */
  let inner;
  if(rl){const rules=isBus()?busRules():S.tg.filter(has).slice(0,5);while(rules.length<2)rules.push(S.tg[rules.length]||cello());
    const k=rules.length,ph=panelH||(612/scl()-d.band-6.8),avail=ph-100-10,earn=Math.min(146.88,avail-48),rp=Math.min(173,avail-50),cw=(PANW-14-8-(earn+2)-20-(k-1)*10)/k;
    inner=photoHtml('r')+'<div class="ttl rules" data-frac="1"><span class="ul">'+nameTitle()+'</span></div><div class="rulesrow"><div class="rr">'+rules.map(o=>'<div class="rule" style="width:'+pt(cw)+'"><div class="rl"><span>'+esc(lbl(o))+'</span></div><div class="rp" style="height:'+pt(rp)+'">'+(isWord(o)?'':pic(o,''))+'</div></div>').join('')+'</div><div class="earn"><div class="lab">Earn</div><div class="bx ft green" style="width:'+pt(earn+3)+';height:'+pt(earn+3)+'"><span class="dot"></span>'+qrBox().replace('class="qr"','class="qr" style="width:'+pt(Math.min(51.7,(earn+3)/2-21))+';height:'+pt(Math.min(51.7,(earn+3)/2-21))+'"')+'</div>'+busGoalHtml()+'</div></div>';}
  else inner=photoHtml('l')+photoHtml('r')+'<div class="ttl bd" data-frac=".72"><span class="ul">'+nameTitle()+'</span></div><div class="ftlab" style="left:'+pt(163.62)+'">First</div><div class="ftlab" style="left:'+pt(432.04)+'">Then</div>'+presetBox(S.ft[0],'grey',false,163.62)+presetBox(S.ft[1],'green',true,432.04);
  return pgOpen('bd','front')+'<div class="panel" style="bottom:'+pt(d.band)+'">'+inner+(rl?'':qrBox())+'</div>'+stripHtml()+pgClose;}
function parkRows(n){const per=n<=3?n:n<=4?2:n<=6?3:n<=8?4:5;const rows=Math.ceil(n/per);const out=[];let left=n;for(let r=0;r<rows;r++){const k=Math.min(per,Math.ceil(left/(rows-r)));out.push(k);left-=k;}return out;}
function pageTokens(){if(busEach())return busGridTokens();const n=nTok(),rows=parkRows(n);const sz=112.53;
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
function sheetTokens(){const N=tokTotal(),g=busEach(),sz=g?busTokIn():tokIn(),[pw,ph,aw]=sheetDims(),cols=Math.min(g?8:5,Math.max(1,Math.floor((aw+.15)/(sz+.15))));return sheetOpen('cards-tk')+sheetGrid(cols,Math.ceil(N/cols),sz,sz,.15,pw,ph,Array.from({length:N},(_,i)=>tokCard(sz,!g&&i===N-1)).join(''),'top')+'</div>';}
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
  const plan=()=>{if(isBus()&&c.pg_bus!==false)pages.push({label:'Bus ride plan, for the bus staff (portrait)',html:busPlanPage()});};   /* (v21.49) */
  const howto=()=>{if(c.pg_how){const h=pagesHowto().split('</div></div></div>');pages.push({label:'How to use, Steps 1 and 2',html:h[0]+'</div></div></div>'});pages.push({label:'How to use, Step 3',html:h[1]+'</div></div></div>'});}};
  const cards=()=>{const add=(k,name)=>{const h=sheetCards(k);h.forEach((x,i)=>pages.push({label:'Card sheet: '+name+(h.length>1?' ('+(i+1)+' of '+h.length+')':''),html:x}));};if(c.cs_ch)add('ch','the choices');if(c.cs_tg)add('tg','the targets');if(c.cs_tk)pages.push({label:'Card sheet: the tokens',html:sheetTokens()});};
  if(order==='fronts'){fronts();plan();}else if(order==='duplex'){duplex();plan();howto();}else if(order==='cards')cards();else if(order==='spare')pages.push({label:'A sheet of one card (portrait)',html:sheetSpare()});else{duplex();plan();howto();cards();}
  return pages;}
/* a back whose text does not fit at the floor size continues on a second back page; in a duplex order a blank sheet keeps
   every back on the reverse of its front */
/* (v21.43) one back fitted to its page: its text shrinks to the floor size, then the credit line gives way; true when
   it fits on the one page. paginate uses it, and so does the link's schedule row, to say before a take whether the
   Token Economy back will run on to a second page */
function fitBack(pg){const body=pg.querySelector('.bbody');if(!body)return true;
  const cr=pg.querySelector('.credit');const room=()=>{if(cr)body.style.paddingBottom=(cr.offsetHeight+(pg.classList.contains('compact')?14:34)*scl()*96/72)+'px';};room();
  fitOne(body);if(!tooFull(body))return true;
  /* the credit line gives way first: one small line at the foot, and the text gets the room back */
  if(pg.querySelector('.credit')&&!pg.classList.contains('compact')){pg.classList.add('compact');{let f=10.5;const one=13*scl()*96/72*1.4;while(cr.offsetHeight>one&&f>8){f-=.25;cr.style.fontSize=(f*scl())+'pt';}}room();fitOne(body);if(!tooFull(body))return true;}
  return false;}
function paginate(root,dup){let guard=0;
  for(let pg=root.querySelector('.pg.back');pg&&guard++<40;pg=pg.nextElementSibling){
    if(!pg.classList.contains('back'))continue;const body=pg.querySelector('.bbody');if(!body)continue;
    if(fitBack(pg))continue;
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
  busCalc();
  const pages=bookPages(),order=S.meta.order||'all',mode=pageMode();
  $('#book').innerHTML=pages.map(p=>p.html.replace(/^<div class="pg /,'<div data-label="'+esc(p.label)+'" class="pg ')).join('');
  $('#chOut').innerHTML='<div class="book">'+pageGrid('ch')+'</div>';$('#tgOut').innerHTML='<div class="book">'+pageGrid('tg')+'</div>';$('#bdOut').innerHTML='<div class="book">'+pageBoard()+'</div>';
  $('#bkOut').innerHTML='<div class="book">'+TABS.map(t=>pageBack(t[0])).join('')+pagesHowto()+'</div>';
  const n=measured(()=>{fitAll();paginate($('#book'),/^(duplex|all)$/.test(order));paginate($('#bkOut'),false);const r=relabel($('#book'));turnPages();return r;});
  const size=mode==='fill'?'the full 8.5 in height':mode==='11'?'the 11 x 7.26 in page centred with trim marks':'the 8.82 x 5.82 in page centred with trim marks';
  $('#prevLine').textContent=n+' sheet'+(n===1?'':'s')+', '+(order==='fronts'?'the fronts only':order==='duplex'?'fronts and backs interleaved for a duplex printer (long-edge flip)':order==='cards'?'the card sheets only':order==='spare'?'one portrait sheet of a single card':'fronts and backs interleaved, then '+(S.chk.pg_how?'the how-to insert, then ':'')+'the card sheets')+'. Letter'+(order==='spare'?' portrait':turned()?' portrait, each book page turned on its side at full size ('+size.replace(/ centred with trim marks$/,'')+', with trim marks), for Safari on the iPad and iPhone, which prints portrait only':' landscape, '+size)+'; print at 100%. (Form build '+BUILD+'.)';
  const wr=$('#wholeRow');if(wr)wr.style.display=order==='all'?'none':'';
  const pv=(id,v)=>{const e=$(id);if(e)e.textContent=v;};pv('#phXv',(num(S.meta.ph_x)??50)+'%');pv('#phYv',(num(S.meta.ph_y)??35)+'%');pv('#phZv',(num(S.meta.ph_z)??100)+'%');
  const tr=$('#termPicRow');if(tr)tr.style.display=termMode()==='pic'?'':'none';const lk=$('#phLook');if(lk){const one=S.meta.layout==='rules'||isBus();lk.innerHTML=one?photoHtml('r'):photoHtml('l')+photoHtml('r');}
  setTimeout(()=>{scaleBooks();const pl=$('#prevLine'),tc=textCheck();if(pl&&tc&&!/Text check/.test(pl.textContent))pl.textContent+=' Text check '+tc.toFixed(2)+'.';},0);
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
  busFitPlan();   /* (v21.49) the bus ride plan */
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
/* the size text is drawn at on the book's page against its layout (1.00: as set; above it, the browser enlarged the text). Layout sizes,
   not the box on screen: a page turned on its side for the iPad's print (or scaled to fit) would give a nonsense number. 0 when the
   page is not laid out (a view that hides it), and then the Preview line says nothing */
function textCheck(){const pg=$('#book .pg');if(!pg)return 1;const d=document.createElement('div');d.style.cssText='position:absolute;left:0;top:0;width:1in;height:1px;visibility:hidden';const t=document.createElement('span');t.textContent='M';t.style.cssText='position:absolute;left:0;top:0;font:400 72pt/1 Georgia,serif;visibility:hidden';pg.appendChild(d);pg.appendChild(t);const w=d.offsetWidth,r=w?t.offsetHeight/w:0;d.remove();t.remove();return r;}
let tSc=0;window.addEventListener('resize',()=>{clearTimeout(tSc);tSc=setTimeout(scaleBooks,150);});
/* after the sheet of one card has printed, the print order goes back to what it was, so the Preview shows the whole book again */
function restoreOrder(){if(S.meta.order==='spare'&&S.meta.prevOrder){S.meta.order=S.meta.prevOrder;delete S.meta.prevOrder;renderAll();}}
window.addEventListener('afterprint',()=>setTimeout(restoreOrder,300));

/* ---------------- events ---------------- */
let tOut=0;function renderOutSoon(){clearTimeout(tOut);tOut=setTimeout(renderOut,180);}
document.addEventListener('input',e=>{const el=e.target;
  if(el.id==='tkState'){if(!lkQuiet)restoreState(el.value);return;}
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
function bindMeta(){$$('[data-m]').forEach(el=>{const k=el.dataset.m;if(S.meta[k]!==undefined&&(S.meta[k]!==''||k==='credit'||k==='kind'))el.value=S.meta[k];else if(el.tagName==='SELECT'||el.type==='color'||el.type==='range'){S.meta[k]=el.value;}else el.value='';});
  $$('[data-c]').forEach(el=>{el.checked=!!S.chk[el.dataset.c];});$$('[data-b]').forEach(el=>{el.value=S.txt[el.dataset.b]||'';});$$('input[data-r="ft"]').forEach(el=>{el.value=S.ft[+el.dataset.i].l||'';});}
/* (v21.43) while the link with Form TE-1 is on, the record's board summary is brought up to date first (lkBoard, in the
   link block), so the shell's status, snapshots and autosave carry it */
function syncState(){if(S.meta&&S.meta.lk)lkBoard();const t=$('#tkState');if(t)t.value=JSON.stringify(S);}
function restoreState(v){let d=null;try{d=JSON.parse(v);}catch(e){d=null;}const next=d&&fromFile({form:'TK-1',S:d});if(next){S=next;renderAll();}}
function renderAll(){ensure();bindMeta();renderTbls();renderOut();lkPaint();}

/* ---------------- printing ---------------- */
$('#printBtn').addEventListener('click',()=>{setView('preview');setTimeout(()=>{fitAll();window.print();},80);});
/* ---------------- save, load, csv, clear, sim ---------------- */
$('#saveBtn').addEventListener('click',()=>{if(S.meta.lk)lkBoard();const nm=(S.meta.client||'student').replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'TK-1',rev:'2026-10',saved:new Date().toISOString(),S},null,1)],{type:'application/json'}));
  const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');a.download=`TK-1_${nm}_${ymd}.json`;document.body.appendChild(a);a.click();a.remove();});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
function fromFile(d){
  if(!d||typeof d!=='object'||d.form!=='TK-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v),obj=k=>s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])?s[k]:{};
  Object.keys(obj('meta')).forEach(k=>{o.meta[k]=str(s.meta[k]).slice(0,2000);});Object.keys(obj('chk')).forEach(k=>{o.chk[k]=!!s.chk[k];});Object.keys(obj('txt')).forEach(k=>{if(k in TXT0)o.txt[k]=str(s.txt[k]).slice(0,20000);});
  const okImg=v=>/^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<900000;
  /* a photo's id goes into the picker's markup: only the letters, digits, _ and - this form makes ids of (a file made elsewhere could
     carry markup in it); a photo with any other id is left out */
  o.photos=Array.isArray(s.photos)?s.photos.slice(0,60).map(p=>({id:str(p&&p.id).slice(0,20),label:str(p&&p.label).slice(0,30),img:str(p&&p.img)})).filter(p=>/^[A-Za-z0-9_-]{1,20}$/.test(p.id)&&okImg(p.img)):[];
  const ids=new Set(o.photos.map(p=>p.id));const okK=k=>!!(P[k]||(k.startsWith('tk:')&&TOK[k.slice(3)])||(k.startsWith('av:')&&AV[k.slice(3)]));
  const arr=(k,n)=>Array.isArray(s[k])?s[k].slice(0,n).map(x=>{const r={k:str(x&&x.k),ph:str(x&&x.ph),l:str(x&&x.l).slice(0,60)};if(!okK(r.k))r.k='';if(!ids.has(r.ph))r.ph='';return r;}):null;
  const ch=arr('ch',6);if(ch)o.ch=ch;const tg=arr('tg',6);if(tg)o.tg=tg;const ft=arr('ft',2);if(ft&&ft.length===2)o.ft=ft;const tok=arr('tok',1);if(tok&&tok.length)o.tok=tok;const tl=arr('tokL',1);if(tl&&tl.length)o.tokL=tl;const ph=arr('photo',1);if(ph&&ph.length)o.photo=ph;const bg=arr('bg',2);if(bg&&bg.length===2)o.bg=bg;const sp=arr('sp',1);if(sp&&sp.length)o.sp=sp;
  const lm=arr('lm',10);if(lm)o.lm=lm.map((r,i)=>Object.assign(r,{min:str(s.lm[i]&&s.lm[i].min).replace(/[^0-9.]/g,'').slice(0,6)}));   /* (v21.49) the bus ride's landmarks */
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
  const out=[['Page','Position','Picture','Label']];S.ch.forEach((o,i)=>out.push(['Choices',i+1,o.ph?'photo':o.k,lbl(o)]));S.tg.forEach((o,i)=>out.push(['Targets',i+1,o.ph?'photo':o.k,lbl(o)]));S.ft.forEach((o,i)=>out.push(['Board',i?'Then':'First',o.ph?'photo':o.k,lbl(o)]));S.caps.forEach((c,i)=>out.push(['Token slot',i+1,c.a,c.b]));if(isBus())S.lm.forEach((o,i)=>out.push(['Bus landmark',i+1,(o.ph?'photo':o.k)+(o.min?' (at '+o.min+' min)':''),lbl(o)]));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='TK-1_'+(S.meta.client||'student').replace(/[^\w-]+/g,'_')+'.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();renderAll();setView('setup');}});
async function loadSim(){const bus=isBus();   /* (v21.49) a bus book loads the sample bus ride */
  if(!(await nbhUI.confirm(bus?'Load a simulated bus ride?\nEvery page is filled with a sample student and a sample route. Anything already entered will be replaced.':'Load a simulated book?\nEvery page is filled with a sample student. Anything already entered will be replaced.',{ok:'Load'})))return;S=blank();
  Object.assign(S.meta,{client:'SIMULATED – Sample Student',sid:'SIM-000',grade:'2',site:'Elementary, self-contained classroom',first:'Sam',poss:'s',setting:'',layout:'ft',avatar:AV0,n:'5',tokname:'',qr:'https://example.org/token-board/how-to-use',credit:CREDIT0,order:'all',sp_card:'ch:0',sp_size:'large'});
  S.chk.pg_how=true;S.chk.qrframe=true;
  /* the practice's own pictures: the choices and the targets its walkthrough video shows */
  S.ch=['cardcrayons','cardball','cardplayground','cardbreak','youtube','cardipad2'].map(k=>cello(k));S.tg=['cardwriting','cardreading','cardalldone','boyraisehand','cardmath','cardwaiting'].map(k=>cello(k));
  if(bus)busSim();
  renderAll();setView('preview');nbhUI.toast(bus?'Simulator loaded: Sam’s bus ride, 25 minutes from school to home, with three bus rules, five landmarks and five stars.':'Simulator loaded: Sam’s book with six choices, six targets, five stars and a sample QR link.',{kind:'ok'});}
$('#simBtn').addEventListener('click',loadSim);
$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
busWire();
renderAll();

/* v21.42 the case: hooks. The Targets take the case's replacement behaviors (Form TB-1) and acquisition
   objectives (Form GB-1) when all six are empty, the Choices the reinforcer menu (Form PA-1) in its rank order;
   a label that names a library picture gets the picture. The picker adds what is ticked to the empty slots. */
function matchPicto(w){const lw=String(w||'').toLowerCase().trim();if(!lw)return '';let k=KEYS.find(k=>P[k].l.toLowerCase()===lw);if(k)return k;k=KEYS.find(k=>P[k].l.length>3&&lw.includes(P[k].l.toLowerCase()));return k||'';}
function cellFor(w){w=String(w||'').trim();return{k:matchPicto(w),ph:'',l:w.slice(0,40)};}
/* (v21.43) the view dots (the shared nbh-ui block): a Choices or Targets card is filled when it has a picture or a label (the label
   is optional: the picture's own name prints when it is blank), so the dot does not read a picked card as empty */
window.__nbhViewFill=function(v){if(v!=='choices'&&v!=='targets')return null;const a=v==='choices'?S.ch:S.tg;return {filled:a.filter(o=>has(o)||String(o.l||'').trim()).length,total:a.length};};
/* (v21.43) what the case gives the Targets page, as labels a learner's card can carry: each replacement behavior once. The
   forms' own marks come out of the text ("(see target 4)", "(replacement)", "(simulated)", "(see Forms EA-1 and TD-1)"), a
   long one is cut at a word, under 40 characters, with no "from the" left hanging; a problem behavior's replacement that
   names another target ("see target 4") is that target's card; and two that share most of their words ("Hands a break card
   and waits", "hand the break card to an adult") are one card. Labels already on the page count as taken. */
const TSTOP={a:1,an:1,the:1,to:1,and:1,or:1,of:1,for:1,with:1,from:1,in:1,on:1,at:1,by:1,his:1,her:1,their:1,its:1,is:1,are:1,when:1,then:1};
function tgtClean(w){w=String(w||'').replace(/\([^()]*\)/g,' ').replace(/\([^()]*$/,' ').replace(/\[[^\[\]]*\]/g,' ').replace(/\s+/g,' ').trim().replace(/[\s.,;:!?\u2013\u2014-]+$/,'');
  if(w.length>40){w=w.slice(0,41);const sp=w.lastIndexOf(' ');w=(sp>12?w.slice(0,sp):w.slice(0,40)).trim();}
  let ws=w.split(' ');while(ws.length>1&&TSTOP[ws[ws.length-1].toLowerCase()])ws.pop();w=ws.join(' ').replace(/[\s.,;:!?\u2013\u2014-]+$/,'');
  return w?w.charAt(0).toUpperCase()+w.slice(1):'';}
function tgtStems(w){return String(w||'').toLowerCase().split(/[^a-z\u00e0-\u024f]+/).filter(x=>x&&!TSTOP[x]).map(x=>x.length>4?x.replace(/(?:ing|ed|es|s)$/,''):x);}
function tgtSame(A,B){if(!A.length||!B.length)return false;const a=new Set(A),b=new Set(B);let i=0;a.forEach(x=>{if(b.has(x))i++;});const u=a.size+b.size-i;return i/u>.5||i===a.size||i===b.size;}
/* behaviors: the case's target behaviors (Form TB-1); acq: the acquisition goals (Form GB-1); taken: labels already on the page */
function caseTargets(behaviors,acq,taken){const groups=[],out=[];let dup=0,skip=0;
  const groupOf=st=>groups.find(g=>g.some(x=>tgtSame(x,st)));
  (taken||[]).forEach(l=>{if(String(l||'').trim())groups.push([tgtStems(l)]);});
  const add=(raw,alias)=>{const lab=tgtClean(alias||raw);if(!lab)return;const st=tgtStems(lab),st2=alias?tgtStems(tgtClean(raw)):null;
    const g=groupOf(st)||(st2&&groupOf(st2));if(g){if(st2)g.push(st2);g.push(st);dup++;return;}
    groups.push(st2?[st,st2]:[st]);out.push(lab);};
  const B=behaviors||[];
  B.forEach(b=>{if(b.isRep){add(b.label);return;}const w=String(b.rep||'').trim();if(!w){skip++;return;}
    const m=/\bsee\s+target\s+(\d+)\b/i.exec(w),T=m?B[+m[1]-1]:null;add(w,T&&T.isRep?T.label:'');});
  (acq||[]).forEach(g=>{if(String(g&&g.beh||'').trim())add(g.beh);});
  return {list:out,dup,skip};}
window.__nbhFactsIn=function(f){let n=0;const empty=a=>a.every(o=>!has(o)&&!o.l);
  if(empty(S.tg)){caseTargets(f.behaviors,f.goals&&f.goals.acq,[]).list.slice(0,6).forEach((w,i)=>{S.tg[i]=cellFor(w);n++;});}
  if(empty(S.ch)&&(f.menu||[]).length){f.menu.slice().sort((a,b)=>(a.rank==null?99:a.rank)-(b.rank==null?99:b.rank)).slice(0,6).forEach((x,i)=>{S.ch[i]=cellFor(x.name);n++;});}
  if(n)renderAll();return {filled:n,note:n?undefined:'the case holds no replacement behavior, objective or reinforcer menu yet'};};
/* (v21.43) the Targets page holds skills and replacement behaviors only: a problem behavior goes in as its named replacement
   (or not at all), and a reduction goal never; the note says what was left out and why */
window.__nbhFactsPick=function(sel){let n=0,skip=0,full=0;const put=(a,w)=>{w=String(w||'').trim();if(!w)return false;const slot=a.find(o=>!has(o)&&!o.l);if(!slot){full++;return false;}Object.assign(slot,cellFor(w));return true;};
  const ct=caseTargets(sel.behaviors,sel.goals&&sel.goals.acq,S.tg.filter(o=>has(o)||o.l).map(lbl));skip=ct.skip;ct.list.forEach(w=>{if(put(S.tg,w))n++;});skip+=((sel.goals&&sel.goals.red)||[]).length;(sel.menu||[]).forEach(m=>{if(put(S.ch,m.name))n++;});
  renderAll();const notes=[];if(full)notes.push('the six slots are full; empty one first');if(skip)notes.push((skip===1?'1 item was':skip+' items were')+' left out: a problem behavior or a reduction goal is not a teaching target; its replacement behavior goes on the Targets page');
  if(ct.dup)notes.push((ct.dup===1?'1 was':ct.dup+' were')+' the same replacement behavior as a card already there');
  return {filled:n,note:notes.join('; ')};};

/* v21.43 the link with Form TE-1 (the token economy plan for the same student). Off until Link with Form TE-1 is pressed
   on Setup (the band under Tokens); an unlinked book saves, prints and counts its fields as before. The shared core
   (tools/blocks/nbh-link.js, put in above by build.sh, byte for byte the copy Form TE-1 carries) owns the panel, the
   relay ask, the file fallback, the row states, Apply, Leave and Undo; this adapter says what is compared and how a take
   is written. Form TE-1 is the plan of record: its count, backups and schedule are offered to this book, ticked where they
   fill an empty place or have changed on the plan. Its behavior goes on a target card only when ticked by hand, and is
   not offered when it names a behavior to reduce (the case's problem behaviors from Form TB-1, those seen at an earlier
   compare, or the common words for one). The pictures, the token and the last-token marking are this book's own: a take
   keeps a card's picture. Nothing is emptied or deleted (the captions are written again only by a count change, after a
   question when they were edited); class, cost, preference and the RA-1 answer never come into the book, and a backup
   whose RA-1 answer is No is never offered. The record is one JSON string in S.meta.lk, carried by #tkState, so the
   shell's status, snapshots and autosave carry it; while the link is on it also holds a short summary of the board
   (lk.board: the count, the token, the last-token marking, the paired target card and the card labels), which is what
   Form TE-1 reads, since it cannot read the picture library. The paired card (lk.card) is the one a Take or a Keep of the
   card row paired with the plan's behavior, or one found equal to it at a compare; it follows its label when the card is
   moved, and a tap on a card number only chooses the card the table compares. These functions are declarations and var,
   since renderAll and syncState call some of them before this part of the script has run. */
var lkApi=null,lkQuiet=false,lkS={n:null,pick:null,sel:null,took:false},lkPicNames=null;
var LK_SCHED=/^\s*\*\*This book[’']s schedule/;
function lkT(v){return String(v==null?'':v).trim();}
function lkQ(w){return '“'+w+'”';}
function lkAnd(a){return a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];}
function lkOrd(n){return n+(n%100>=11&&n%100<=13?'th':['th','st','nd','rd'][n%10]||'th');}
/* card numbers: "1 to 4", or "2, 4 and 5" */
function lkNums(a){const s=a.slice().sort((x,y)=>x-y);return s.length>2&&s.every((v,i)=>!i||v===s[i-1]+1)?s[0]+' to '+s[s.length-1]:lkAnd(s.map(String));}
function lkRec(){return window.NBHLink?NBHLink.readLk(S.meta.lk||''):null;}
/* the band over the panel says Link until the link is on, then Linked */
function lkBand(){const h=$('#lkBand');if(!h)return;const r=lkRec(),t=(r&&r.on===1?'Linked':'Link')+' with Form TE-1 (the token economy plan)';if(h.textContent!==t)h.textContent=t;}
function lkPaint(){if(lkApi){lkApi.render();lkBand();}}
/* the paired target card: the one a Take or a Keep of the card row paired with the plan's behavior, or one found equal to
   it at a compare (lk.card). It follows its label (lk.base.card[0] is the label's hash) when the card is moved; when the
   label itself has changed, the pairing stays on its place, where the row then reads "changed here". -1: none. */
function lkPaired(lk){if(!lk||!Number.isInteger(lk.card)||!S.tg[lk.card])return -1;const N=NBHLink,b=lk.base&&lk.base.card,h=i=>N.hash(N.norm(lkT(lbl(S.tg[i]))));
  if(b&&h(lk.card)!==b[0]){const j=S.tg.findIndex((o,i)=>!!lkT(lbl(o))&&h(i)===b[0]);if(j>=0)return j;}
  return lk.card;}
/* the board summary Form TE-1 reads (lk.board), written only when it has changed, so an unchanged book keeps its record.
   card and cardLabel: the paired card (paired 1, with the pairing's two hashes in pair), else the first card with a label */
function lkBoard(){const N=window.NBHLink;if(!N)return;const r=N.readLk(S.meta.lk||'');if(!r||r.on!==1)return;
  const l=o=>lkT(lbl(o)).slice(0,40),six=a=>{const o=(Array.isArray(a)?a:[]).slice(0,6).map(l);while(o.length<6)o.push('');return o;};
  const pc=lkPaired(r),first=(S.tg||[]).findIndex(o=>!!lkT(lbl(o))),c=pc>=0?pc:first>=0?first:0,pic=termMode()==='pic'&&Array.isArray(S.tokL)&&has(S.tokL[0]);
  const b={n:String(nTok()),tok:lkT(tokName()).slice(0,40),term:termMode(),last:pic?l(S.tokL[0]):'',card:c,cardLabel:l((S.tg||[])[c]),ch:six(S.ch),tg:six(S.tg),paired:pc>=0?1:0};
  if(pc>=0&&r.base.card)b.pair=r.base.card.slice();
  const moved=pc>=0&&pc!==r.card;if(moved)r.card=pc;
  if(!moved&&JSON.stringify(b)===JSON.stringify(r.board))return;r.board=b;S.meta.lk=N.pack(r);}
/* the last words of the Setup verdict while linked: " Linked with Form TE-1 (compared Oct 3: in step)." */
function lkPhrase(){const r=lkRec();if(!r||r.on!==1)return '';const L=r.last;if(!L)return ' Linked with Form TE-1 (not compared yet).';
  let d='';try{d=new Date(L.when).toLocaleDateString(undefined,{day:'numeric',month:'short'});}catch(e){d='';}
  const res=String(L.res||''),num=re=>{const x=re.exec(res);return x?+x[1]:0;},n=num(/look (\d+)/),k=num(/kept (\d+)/),pt=num(/part (\d+)/);
  const w=res==='step'?'in step':/^look/.test(res)?n+(n===1?' item':' items')+' to look at':res==='empty'?'Form TE-1 held nothing to compare':
    /^(kept|part)/.test(res)?[k?k+(k===1?' difference':' differences')+' kept':'',pt?pt+(pt===1?' item':' items')+' taken in part':''].filter(Boolean).join(', '):res==='who'?'for another student?':'';
  return ' Linked with Form TE-1 (compared '+esc(d)+(w?': '+w:'')+').';}
/* a change to the record is unsaved work: #tkState gets an input event, which the unsaved-work guard counts as an edit
   (this form's own listener lets it pass while lkQuiet is set) */
function lkDirty(){const t=$('#tkState');if(!t)return;lkQuiet=true;try{t.dispatchEvent(new Event('input',{bubbles:true}));}catch(e){}finally{lkQuiet=false;}}
/* the words of a label, for finding the card a behavior is about: small words left out, endings cut ("raises" and "raise",
   "blocks" and "block", "sitting" and "sits") */
var LK_STOP=new Set('a an and or the to of in on at for with from by into onto my his her their your our its is are be it up out then when after before during each every one two all'.split(' '));
function lkStems(s){const out=[];NBHLink.norm(s).split(/[^\p{L}\p{N}]+/u).forEach(w=>{if(!w||LK_STOP.has(w))return;w=w.replace(/(ingly|edly|ly|ing|ed|es|s|e)$/,'').replace(/([b-df-hj-np-tv-z])\1$/,'$1');if(w.length>=3&&!out.includes(w))out.push(w);});return out;}
function lkBest(beh,ls){const b=lkStems(beh);let best=-1,sc=0;ls.forEach((l,i)=>{if(!l)return;const s=lkStems(l).filter(w=>b.includes(w)).length;if(s>sc){sc=s;best=i;}});return best;}
/* the target card compared with the plan's behavior: the one picked with the card buttons in this table, else the card
   whose label matches the behavior, else the paired card, else the card whose label shares the most words with it
   ("Raise my hand" for "Raises hand and waits"), else the first empty card (where the behavior can go), else card 1. With
   no behavior on the plan: the paired card, else the first card that has a label, so Form TE-1 can take it. */
function lkCardN(beh,lk){const N=NBHLink;if(lkS.pick!=null)return lkS.pick;const ls=S.tg.map(o=>lkT(lbl(o)));
  if(beh){const i=ls.findIndex(l=>!!l&&(N.norm(l)===N.norm(beh)||N.near(l,beh)));if(i>=0)return i;}
  const pc=lkPaired(lk);if(pc>=0)return pc;
  if(beh){const w=lkBest(beh,ls);if(w>=0)return w;}
  const e=beh?S.tg.findIndex(o=>!has(o)&&!o.l):ls.findIndex(Boolean);return e>=0?e:0;}
/* the case's behaviors, when the workstation has sent them (Form TB-1's targets and candidates, or Form FS-1's) */
function lkFacts(){const C=window.nbhCase,f=C&&C.facts&&Array.isArray(C.facts.behaviors)?C.facts.behaviors:null;return f&&f.length?f:null;}
/* a behavior to reduce named as the behavior the tokens are earned for (the core's problem()): the case's problem
   behaviors, those seen at an earlier compare (this record's pb, and the plan's), or the common words for one */
function lkProblem(beh,pb){const lk=lkRec()||{};return NBHLink.problem(beh,{facts:lkFacts()||[],seen:[].concat(lk.pb||[],pb||[])});}
/* the library picture a take puts on a card that has none: only one whose name is the label (or its singular), or starts
   it as whole words ("Tablet" for "Tablet, video clips"). A name merely inside the label ("Help" in "Raises a hand to ask
   for help") brings no picture. (The case's own fill, matchPicto, is left as it was.) */
function lkPicFor(w){const N=NBHLink,t=N.norm(w),s=x=>x.replace(/s$/,'');if(!t)return '';
  if(!lkPicNames)lkPicNames=KEYS.map(k=>[k,N.norm(P[k].l)]);
  let e=lkPicNames.find(x=>x[1]===t)||lkPicNames.find(x=>s(x[1])===s(t));if(e)return e[0];
  e=lkPicNames.find(x=>x[1].length>=4&&N.near(x[1],t));return e?e[0]:'';}
/* the six choice cards against the plan's backups. A backup is matched by a card when the two are equal, or near (shown
   as ≈): the shared near() ("Tablet" ≈ "Tablet, video clips"), or the card's words (4 characters or more) standing whole
   inside the backup's name ("Magnetic tiles" ≈ "Five minutes with the magnetic tiles"), the rule Form TE-1 uses, so the
   two panels agree. Unmatched backups are offered in the plan's order onto the empty cards (as many as there are empty
   cards; with fewer cards than backups the names tapped last are the ones taken); one whose RA-1 answer is No and one
   over 40 characters are named instead, and so are all of them when no card is empty (full). seen: the names that are on a
   card once the take is done, for the notice that one has left the plan's menu. */
function lkMenu(p){const N=NBHLink,lk=lkRec()||{},seen=lk.menuSeen||[];
  const eq=(x,y)=>N.norm(x)===N.norm(y),words=x=>' '+N.norm(x).replace(/[^\p{L}\p{N}']+/gu,' ').trim()+' ';
  const inW=(c,n)=>{const a=words(c);return a.trim().length>=4&&!eq(c,n)&&words(n).includes(a);},nr=(c,n)=>N.near(c,n)||inW(c,n);
  const cards=S.ch.map((o,i)=>({i,l:lkT(lbl(o)),empty:!has(o)&&!o.l})),bk=(p.bk||[]).map(b=>({n:lkT(b.n),no:/^no$/i.test(lkT(b.conf))})).filter(b=>b.n);
  const M={cards,bk,near:[],un:[],offer:[],pick:[],to:[],cap:0,skip:[],full:[],noMatch:[],warn:[],seen:[]};
  bk.forEach(b=>{const e=cards.find(c=>c.l&&eq(c.l,b.n)),r=e?null:cards.find(c=>c.l&&nr(c.l,b.n));b.card=e||r||null;
    if(r)M.near.push([r,b]);
    if(b.card&&b.no)M.warn.push('Card '+(b.card.i+1)+', '+b.card.l+', matches a backup Form TE-1 records as not a reinforcer (RA-1).');
    if(!b.card){if(b.no)M.skip.push(lkQ(b.n)+' (not a reinforcer on RA-1)');else if(!M.un.some(x=>eq(x.n,b.n)))M.un.push(b);}});
  const empties=cards.filter(c=>c.empty),fit=[];M.cap=empties.length;
  M.un.forEach(b=>{if(b.n.length>40)M.skip.push(lkQ(b.n)+' (write a short label on Choices)');else fit.push(b.n);});
  if(!M.cap)M.full=fit.slice();
  else{M.offer=fit;M.pick=(lkS.sel?fit.filter(n=>lkS.sel.includes(N.norm(n))):fit).slice(0,M.cap);M.to=empties.slice(0,M.pick.length).map(c=>c.i);}
  M.noMatch=cards.filter(c=>c.l&&!bk.some(b=>eq(c.l,b.n)||nr(c.l,b.n)));
  cards.forEach(c=>{if(c.l&&seen.includes(N.hash(N.norm(c.l)))&&!bk.some(b=>eq(b.n,c.l)))M.warn.unshift('Card '+(c.i+1)+', '+c.l+', is no longer on Form TE-1’s menu.');});
  M.seen=Array.from(new Set(bk.filter(b=>b.card&&eq(b.card.l,b.n)).map(b=>b.n).concat(M.pick).map(n=>N.hash(N.norm(n))))).slice(0,10);
  return M;}
/* the plan's schedule as one paragraph of the Token Economy back: "**This book's schedule (Form TE-1):** " + what earns a
   token + "; " + what opens the exchange + "." + the exchange (when and how long; the delay). The markup characters
   * _ { } are taken out of the plan's words, and a capital that opens one of its parts is made small ("The exchange: end
   of each block"), unless the word is a name (a day, a month, a title); {token} is this book's own placeholder and prints
   the token's name. */
var LK_PROPER=/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|Mr|Mrs|Ms|Dr)\b/;
function lkSchedText(p){const cl=s=>lkT(s).replace(/[*_{}]/g,'').replace(/\s+/g,' ').trim(),stop=s=>s.replace(/[\s.;,:]+$/,''),
    low=s=>/^[A-Z][a-z]/.test(s)&&!LK_PROPER.test(s)?s.charAt(0).toLowerCase()+s.slice(1):s,part=t=>{const d=/\s[—–-]\s/.exec(t);return d?t.slice(d.index+d[0].length).trim():'';};
  const tp=cl(p.tp),tpN=lkT(p.tpN),epN=lkT(p.epN);
  let earn=part(tp);if(!earn)earn=/^\d+(\.\d+)?$/.test(tpN)?(+tpN===1?'each response earns one {token}':'every '+tpN+' responses earn one {token}'):tp;
  let open=part(cl(p.ep));if(!open&&/^[1-9]\d*$/.test(epN))open=+epN===1?'one token opens the exchange':epN+' tokens open the exchange';
  earn=low(stop(earn));open=low(stop(open));const exW=low(stop(cl(p.exWhen))),exD=low(stop(cl(p.exDelay)));if(!earn&&!open&&!exW)return '';
  const head=[earn,open].filter(Boolean).join('; ');
  return '**This book’s schedule (Form TE-1):** '+(head?head+'.':'')+(exW?(head?' ':'')+'The exchange: '+exW+(exD?'; '+exD:'')+'.':'');}
function lkParas(t){return String(t||'').split(/(\n[ \t]*\n\s*)/);}
function lkSchedHere(){const ps=lkParas(S.txt.te);for(let i=0;i<ps.length;i+=2)if(LK_SCHED.test(ps[i]))return ps[i].trim();return '';}
/* the Token Economy back with the paragraph in: it replaces the one there, or goes on as the last paragraph */
function lkSchedTe(raw){const ps=lkParas(S.txt.te);for(let i=0;i<ps.length;i+=2)if(LK_SCHED.test(ps[i])){ps[i]=raw;return ps.join('');}
  const t=String(S.txt.te||'').replace(/\s+$/,'');return (t?t+'\n\n':'')+raw;}
/* the paragraph as it prints, without its bold opening words: what the table shows and compares */
function lkPlain(t){return fill(t).replace(/^\s*\*\*This book[’']s schedule[^*]*\*\*\s*/,'').replace(/\*\*\*|\*\*|__|\*/g,'').replace(/\s+/g,' ').trim();}
/* whether the Token Economy back holds a text on its one page: that back is laid out off screen at the book's size and
   fitted as the Preview fits it (fitBack). null when it cannot be measured (the form is not on screen) */
function lkBackFits(text){const key=BACKT.tk[0],was=S.txt[key],box=document.createElement('div');let r=null;
  try{S.txt[key]=text;box.className='book';box.style.cssText='position:absolute;left:-30000px;top:0;visibility:hidden';box.innerHTML=pageBack('tk');document.body.appendChild(box);
    const pg=box.querySelector('.pg'),b=pg&&pg.querySelector('.bbody');if(b&&b.clientHeight)r=fitBack(pg);}
  catch(e){r=null;}finally{S.txt[key]=was;box.remove();}return r;}
/* the count named in the plan's own words ("the fifth star"), against the slots this book prints */
var LK_ORDW=['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth'];
function lkOrdIn(t){const tw=lkT(tokName()).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),m=new RegExp('\\b('+LK_ORDW.join('|')+')\\s+((?:'+tw+')s?|tokens?)\\b','i').exec(t);
  return m?{n:LK_ORDW.indexOf(m[1].toLowerCase())+1,w:m[1].toLowerCase()+' '+m[2].toLowerCase()}:null;}
/* the pages a take of the count or the token changes, by side: the Board and the Tokens page (both sides when the back
   prints the count or the token's name, else the front), the backs of Targets and Choices when they print it, the sheet
   of token cards, and the how-to insert when it prints and names them */
function lkRp(re){const out=[];[['bd','Board'],['tk','Tokens']].forEach(([k,nm])=>out.push(re.test(S.txt[BACKT[k][0]]||'')?nm:nm+' front'));
  [['tg','Targets'],['ch','Choices']].forEach(([k,nm])=>{if(re.test(S.txt[BACKT[k][0]]||''))out.push(nm+' back');});
  out.push('token-card');if(S.chk.pg_how&&['h1','h2','h3'].some(k=>re.test(S.txt[k]||'')))out.push('how-to');return out;}
/* the reprint line's words for those pages ("Reprint: the Board page (both sides), the front of the Tokens page and the
   sheet of token cards"); it stays until "These pages are reprinted" is pressed, since a browser reports a cancelled print
   as a print */
var LK_RP={Board:'the Board page (both sides)','Board front':'the front of the Board page',Tokens:'the Tokens page (both sides)','Tokens front':'the front of the Tokens page',
  Targets:'the back of the Targets page','Targets back':'the back of the Targets page',Choices:'the back of the Choices page','Choices back':'the back of the Choices page',
  'Token Economy back':'the Token Economy back','Token Economy back 2':'the Token Economy back with its continued page','token-card':'the sheet of token cards',
  'target-card':'the sheet of target cards','choice-card':'the sheet of choice cards','how-to':'the how-to insert'};
function lkRpLine(pages){const has=p=>pages.includes(p),w=[];
  pages.forEach(p=>{if((p==='Board front'&&has('Board'))||(p==='Tokens front'&&has('Tokens'))||(p==='Token Economy back'&&(has('Tokens')||has('Token Economy back 2'))))return;
    const t=LK_RP[p]||'the '+p+' page';if(!w.includes(t))w.push(t);});return lkAnd(w);}
/* the rows of the table, in the order who, card, n, tok, menu, sched, then the information lines (plan 2A) */
function lkRows(p){const N=NBHLink,m=S.meta,lk=lkRec()||{base:{}},base=lk.base||{},out=[],st=(r,k)=>N.stateOf(r,r.nobase?null:base[k],{other:'TE-1'}).st;
  /* the student: client and sid, each compared only when both are filled; the empty ones here are filled */
  out.push(N.whoRow({client:m.client,sid:m.sid},{client:p.client,sid:p.sid},{other:'TE-1',meWhat:'this book'}));
  /* a target card against the behavior the tokens are earned for (40 characters fit on a card). Its Take is never ticked
     for you, and a behavior to reduce is not offered; the record's pairing is used only for the paired card (nobase) */
  const beh=lkT(p.beh),n=lkCardN(beh,lk),o=S.tg[n],cur=lkT(lbl(o)),pc=lkPaired(lk),prob=lkProblem(beh,p.pb),long=beh.length>40;lkS.n=n;
  const card={key:'card',what:'Target card '+(n+1),here:cur,there:beh,same:(x,y)=>N.near(x,y),owner:'',pre:[],can:!!beh&&!long&&!prob,
    mirror:!beh&&!!cur&&!N.problem(cur,{facts:lkFacts()||[]}),idx:n,pb:p.pb,nobase:pc!==n,keptLabel:'paired',choose:{n:6,value:n,label:'Target card'},
    took:'target card '+(n+1)+' from the plan’s behavior'+(cur?' (was '+lkQ(cur.length>24?cur.slice(0,23)+'…':cur)+')':''),rp:['target-card'].concat(m.layout==='rules'?['Board front']:[])};
  if(prob){if(prob.src!=='word')card.keep=false;
    card.warn=N.problemNote(prob,{lead:'Form TE-1’s behavior',text:beh,fix:'correct it on Form TE-1'+(prob.src==='word'?', or, if it is one, write it on Targets card '+(n+1)+' yourself':'')});}
  else{const s=st(card,'card');
    if(long&&s!==1&&s!==4)card.why='Form TE-1’s behavior is '+beh.length+' characters; a card holds 40. '+(cur?'If card '+(n+1)+'’s label stands for it, press Keep to pair them.':'Write a short label on Targets card '+(n+1)+', then compare again and press Keep to pair them.');
    else if(card.can&&s!==1){const k=has(o)?'':lkPicFor(beh);
      card.preview='Writes '+lkQ(beh)+' on target card '+(n+1)+(cur?' in place of '+lkQ(cur):'')+(has(o)?', keeping its picture':k?', with the library picture '+lkQ(P[k].l):', with no picture yet (choose one on Targets)')+'.';
      if(!lkFacts())card.info='This book cannot see Form TB-1’s problem behaviors here (the workstation sends them with the case), so take it only if it is a behavior to increase.';}}
  out.push(card);
  /* the count: 3 to 10 can be taken; 1 or 2 (establishing the token), more than 10 and no number are information */
  const ep=lkT(p.epN),epI=/^[1-9]\d*$/.test(ep)?+ep:0,nn=nTok();
  if(epI>=3&&epI<=10){const def=JSON.stringify(S.caps)===JSON.stringify(defCaps(nn,tokName()));
    out.push({key:'n',what:'Tokens to earn',here:String(nn),there:ep,same:(x,y)=>x!==''&&y!==''&&+x===+y,owner:'there',pre:[],can:true,v:epI,
      preview:epI!==nn?'Prints '+epI+' slots on the Board and '+epI+' boxes on the Tokens page; '+(def?'the captions are written for '+epI+'.':'your edited captions will be replaced by the standard captions for '+epI+' (you are asked first).'):'',
      took:'tokens to earn '+nn+' → '+epI,rp:lkRp(/\{n\}/)});}
  else out.push({info:!ep?'Form TE-1 has no tokens per exchange yet; it can take this book’s '+nn+' when it compares.':
    epI&&epI<3?'Form TE-1 opens the exchange after '+epI+(epI===1?' token':' tokens')+' (establishing the token); the board prints 3 to 10 slots (now '+nn+').':
    epI>10?'Form TE-1 asks for '+epI+' tokens per exchange; the board holds 10 at most (now '+nn+').':'Form TE-1 has no whole number of tokens per exchange yet.'});
  /* the token: the same when the token form names it (its name, the plural or its stem); a drawn token named there can be taken */
  const tf=lkT(p.tokForm),tn=lkT(tokName()),tk=N.tokKey(tf),drawn=!!tk&&!!TOK[tk],tcan=drawn&&S.tok[0].k!=='tk:'+tk;
  const tok={key:'tok',what:'Token',here:tn,there:tf,same:(x,y)=>N.tokSame(y,x),owner:'here',pre:[],can:tcan,mirror:true,tk:drawn?tk:'',
    took:drawn?'the token: '+TOK[tk].l.toLowerCase()+' (was '+tn.toLowerCase()+')':'the token',rp:lkRp(/\{(token|tokens|TOKENS)\}/)};
  const ts=st(tok,'tok');
  if(ts!==1&&ts!==2&&ts!==4){
    if(tcan){const rn=lkT(m.tokname)&&!N.tokSame(tf,m.tokname),nm=rn||!lkT(m.tokname)?TOK[tk].l:lkT(m.tokname);
      tok.preview='Uses the '+TOK[tk].l.toLowerCase()+' token'+(rn?' and its name, '+lkQ(TOK[tk].l)+',':'')+' on the Board, the Tokens page and the token cards; the first slot’s caption becomes “Your First '+nm+'!”.';}
    else tok.why=drawn?'Form TE-1’s token form names the '+TOK[tk].l.toLowerCase()+' this book shows, which this book calls '+lkQ(tn)+' (Token name on Setup); press Keep to leave it so, or change the name there.':
      'Form TE-1’s token form names none of the tokens this book draws (star, smiley, thumbs up, check, coin, medal, trophy, heart); if this book’s '+tn.toLowerCase()+' is the token it describes, press Keep.';}
  out.push(tok);
  /* the Choices against the backup menu */
  const M=lkMenu(p),info=[];
  M.near.forEach(([c,b])=>info.push('Card '+(c.i+1)+' '+lkQ(c.l)+' ≈ backup '+lkQ(b.n)+'.'));
  if(M.skip.length)info.push('Named on Form TE-1 but not offered: '+M.skip.join('; ')+'.');
  if(M.full.length)info.push('Not offered, since no choice card is empty (empty one on Choices first): '+M.full.map(lkQ).join(', ')+'.');
  if(M.noMatch.length)info.push((M.noMatch.length===1?'Card '+(M.noMatch[0].i+1)+' ('+M.noMatch[0].l+') is':'Cards '+lkNums(M.noMatch.map(c=>c.i+1))+' ('+M.noMatch.map(c=>c.l).join(', ')+') are')+
    ' not on Form TE-1’s menu; Form TE-1 can add '+(M.noMatch.length===1?'it':'them')+' when it compares.');
  /* the preview names the library pictures the take brings, and the cards that get none */
  const pics=M.pick.map(nm=>[nm,lkPicFor(nm)]).filter(x=>x[1]),bare=M.pick.length-pics.length;
  out.push({key:'menu',what:'Choices',here:M.cards.filter(c=>c.l).map(c=>c.l),there:M.bk.map(b=>b.n),same:()=>!M.un.length&&M.bk.some(b=>b.card),owner:'there',pre:['any'],can:M.pick.length>0,mirror:true,
    choose:M.offer.length>1?{labels:M.offer,on:M.offer.map((x,i)=>M.pick.includes(x)?i:-1).filter(i=>i>=0),label:'Backups to add'}:null,
    preview:M.offer.length?(M.pick.length?'Puts '+lkAnd(M.pick.map(lkQ))+' on '+(M.to.length===1?'card '+(M.to[0]+1):'cards '+lkNums(M.to.map(i=>i+1)))+'.'+
        (pics.length?' Library picture'+(pics.length===1?': ':'s: ')+lkAnd(pics.map(([nm,k])=>lkQ(P[k].l)+' for '+lkQ(nm)))+(bare?'; the '+(bare===1?'other gets':'others get')+' no picture yet (choose '+(bare===1?'it':'them')+' on Choices).':'.'):
        ' '+(bare===1?'It gets':'They get')+' no picture yet (choose '+(bare===1?'it':'them')+' on Choices).'):'No backup is picked to add.')+
      (M.offer.length>M.cap?' '+(M.cap===1?'One card is':M.cap+' cards are')+' empty: tap the backups to take, above.':M.offer.length>1?' Tap a backup’s name above to leave it out or put it back.':''):'',
    warn:M.warn,info,seen:M.seen,add:M.pick.slice(),took:'choice '+(M.to.length===1?'card ':'cards ')+lkNums(M.to.map(i=>i+1))+' from the backups',rp:['choice-card']});
  /* the schedule paragraph of the Token Economy back (a copy into ordinary text, first taken by hand); the row says before
     the take whether that back then runs on to a second page */
  const raw=lkSchedText(p),hr=lkSchedHere();
  const sc={key:'sched',what:'Token Economy back',here:hr?lkPlain(hr):'',there:raw?lkPlain(raw):'',owner:'there',pre:[],can:!!raw,raw,took:'the schedule paragraph on the Token Economy back',rp:['Token Economy back']};
  const ss=st(sc,'sched');
  if(raw&&ss!==1&&ss!==2&&ss!==4){const fits=lkBackFits(lkSchedTe(raw)),now=lkBackFits(S.txt.te);if(fits===false)sc.rp=['Token Economy back 2'];
    sc.info=[(hr?'Replaces the paragraph “This book’s schedule (Form TE-1)” on the Token Economy back.':'Adds it as the last paragraph of the Token Economy back, after the bold words “This book’s schedule (Form TE-1):”; it is then ordinary text, edited on Backs like the rest.')+' '+
      (fits===true?'It fits on that back.':fits===false&&now!==false?'That back is full, so the paragraph prints on a continued Token Economy back: one more sheet, and two in a duplex print, where a blank sheet keeps the next back on the reverse of its front. To keep the back to one page, shorten its text on Backs.':
        fits===false?'That back already runs on to a continued page, and the paragraph goes there.':'A back that no longer fits goes on to a second back page (the Preview shows it).')];
    const om=lkOrdIn(lkPlain(raw));if(om&&om.n!==nn)sc.info.push('The plan’s words name the '+om.w+', but this book prints '+nn+' slots.');}
  out.push(sc);
  /* information: nothing to take */
  if(/^yes/i.test(lkT(p.loss))){const lr=lkT(p.lossRule).replace(/\s+/g,' '),c=lr.length>120?lr.slice(0,119).replace(/\s+\S*$/,'')+'…':lr.replace(/[\s.]+$/,'');
    out.push({info:'Form TE-1 records token loss'+(c?': '+c:'')+'. The book’s backs do not describe it.'});}
  const nb=v=>/^\d+(\.\d+)?$/.test(lkT(v))?+lkT(v):null,r1=x=>String(Math.round(x*10)/10),tpn=nb(p.tpN),epn=nb(p.epN),ten=nb(p.teN),pr=[];
  if(tpn!=null)pr.push(r1(tpn)+(tpn===1?' response':' responses')+' per token');if(epn!=null)pr.push(r1(epn)+(epn===1?' token':' tokens')+' per exchange');
  if(tpn!=null&&epn!=null){pr.push(r1(tpn*epn)+' responses per exchange');pr.push('unit price '+r1(tpn*epn/(ten||1)));}
  if(pr.length)out.push({info:'Form TE-1: '+pr.join(', ')+'.'});
  const th=p.thinLast,te=th?nb(th.ep):null;
  if(te!=null&&te!==epn)out.push({info:'Form TE-1’s thinning record has '+lkT(th.ep)+(te===1?' token':' tokens')+' per exchange '+(th.d?'on '+th.d:'at its last step')+'; when the book moves to that step, change Tokens to earn on Setup and reprint the Board and Tokens pages.'});
  if(termOn()&&epI>=3&&epI<=10&&epI!==nn)out.push({info:'The book marks its '+lkOrd(nn)+' token as the last, but Form TE-1 opens the exchange after '+epI+'.'});
  if(!p.linkedBack)out.push({info:'Form TE-1 is not linked back; turn on Link with Form TK-1 there to see this book from the plan.'});
  return out;}
/* each take writes into this book only, checking the book as it is now (the core has already set aside a row whose value
   here changed after the compare); false means nothing was written, and the row keeps its base */
async function lkTake(r){const m=S.meta,N=NBHLink;
  if(r.key==='who'){let d=0;Object.keys(r.fillParts||{}).forEach(k=>{if(!lkT(m[k])){m[k]=r.fillParts[k];d++;}});if(!d)return false;}
  else if(r.key==='card'){const i=r.idx,beh=lkT(r.there);if(!Number.isInteger(i)||!S.tg[i]||!beh||beh.length>40||lkProblem(beh,r.pb))return false;
    /* the card keeps its own picture (a photo, or one chosen); a card with none gets a library picture only when its name is the label */
    const o=S.tg[i];S.tg[i]=has(o)?{k:o.k||'',ph:o.ph||'',l:beh}:{k:lkPicFor(beh),ph:'',l:beh};}
  else if(r.key==='n'){const v=r.v,was=nTok();if(!(v>=3&&v<=10)||v===was)return false;
    /* the captions: written again without a question when they are the defaults for the old count */
    const def=JSON.stringify(S.caps)===JSON.stringify(defCaps(was,tokName()));
    if(!def&&!(await N.confirm('Change the board to '+v+' tokens?\nYour edited captions will be replaced by the standard captions for '+v+' slots.',{ok:'Change to '+v})))return false;
    m.n=String(v);ensure();recaps(true);}
  else if(r.key==='tok'){const t=r.tk;if(!t||!TOK[t]||S.tok[0].k==='tk:'+t)return false;S.tok[0]=cello('tk:'+t);
    if(lkT(m.tokname)&&!N.tokSame(r.there,m.tokname))m.tokname=TOK[t].l;recaps(false);}
  else if(r.key==='menu'){let d=0;(r.add||[]).forEach(nm=>{if(S.ch.some(o=>N.norm(lbl(o))===N.norm(nm)))return;const i=S.ch.findIndex(o=>!has(o)&&!o.l);if(i<0)return;S.ch[i]={k:lkPicFor(nm),ph:'',l:lkT(nm).slice(0,40)};d++;});if(!d)return false;}
  else if(r.key==='sched'){if(!r.raw)return false;S.txt.te=lkSchedTe(r.raw);}
  else return false;
  lkS.took=true;}
/* the buttons inside a row: a target card (1 to 6) only chooses the card the table compares ('reset': its tick is let go;
   nothing is written until a Take or a Keep pairs it); a backup's name leaves it out of the take, or puts it back */
function lkChoose(key,i,p){if(key==='card'){if(Number.isInteger(i)&&i>=0&&i<=5){lkS.pick=i;lkS.n=i;}return 'reset';}
  /* a tap leaves a picked backup out, or picks one; with fewer empty cards than backups, the one picked longest ago gives way */
  if(key==='menu'){const N=NBHLink,M=lkMenu(p),nm=M.offer[i];if(!nm)return true;const k=N.norm(nm);let sel=lkS.sel?lkS.sel.slice():M.pick.map(x=>N.norm(x));
    if(sel.includes(k))sel=sel.filter(x=>x!==k);else{sel.push(k);while(sel.length>M.cap)sel.shift();}lkS.sel=sel;return true;}
  return false;}
if(window.NBHLink){
  lkApi=NBHLink.mount({me:'TK-1',other:'TE-1',meWhat:'this book',otherWhat:'the token economy plan',sibling:'TE-1_Token-Economy-Designer_v2026-09.html',host:'#lkPanel',
    get:()=>S.meta.lk||'',
    /* the record as the core writes it. The case's problem behaviors, when the workstation has sent them, go into it as
       hashes (pb), so the guard still knows them with this book on its own; the board summary is brought up to date as
       the record goes into #tkState */
    set:s=>{if(!s){delete S.meta.lk;lkS.n=null;lkS.pick=null;lkS.sel=null;}
      else{const f=lkFacts();if(f){const o=NBHLink.readLk(s),pb=NBHLink.pbOf(f);if(o&&JSON.stringify(o.pb||[])!==JSON.stringify(pb)){if(pb.length)o.pb=pb;else delete o.pb;s=NBHLink.pack(o);}}S.meta.lk=s;}
      syncState();lkDirty();},
    /* the pairing: a target card taken onto, kept, or found equal to the plan's behavior becomes the paired card */
    record:(lk,a)=>{const c=[].concat(a.taken||[],a.kept||[],a.step||[]).find(r=>r&&r.key==='card');if(c&&Number.isInteger(c.idx))lk.card=c.idx;},
    view:o=>{lkS.pick=null;lkS.sel=null;return NBHLink.planOf(o);},
    rows:lkRows,take:lkTake,choose:lkChoose,rpLine:lkRpLine,snapshot:()=>JSON.stringify(S),
    /* Undo: the book exactly as it was a moment before the take (the snapshot is this form's own S) */
    restore:j=>{const o=JSON.parse(j);if(!o||typeof o!=='object'||Array.isArray(o)||!o.meta||typeof o.meta!=='object')throw new Error('not a TK-1 record');S=o;renderAll();lkDirty();},
    /* after a take the whole book is drawn again; a compare, a Keep or the link itself changed only the record */
    after:()=>{if(lkS.took){lkS.took=false;renderAll();}else{renderSetup();lkBand();}}});
  lkBand();
}

/* ===== walk-hands.js ===== */
/* TK-1 walkthrough: hand drawings for the narrated walkthrough (static SVG, made by a small generator script that models
   each finger and the thumb as a tapered limb lit by one light; the script is kept outside the repo, so small fixes can
   be made here).
   WALK_HANDS.<learner|teacher>.<point|pinch|open> = {svg, w, h, tip|grip|palm:[x,y], wrist:[x,y]}
   A top-down view (the camera above the table) of a right hand reaching onto the table from below: we see the back of
   the hand, the thumb on the left; the arm runs off the bottom of the viewBox.
   learner = a child's hand (small and plump, short fingers, soft dimpled knuckles, small nails, light warm skin, a bare
   forearm, slim at the wrist and fuller toward the elbow, a green T-shirt sleeve near the elbow whose hem stands a
   little off the arm); teacher = an adult hand (longer, leaner fingers, visible knuckles and tendons, medium-deep skin,
   a long muted-blue cotton shirt sleeve with soft folds and a buttoned cuff).
   point = the index finger extended, its tip on the card, the other three curled under (their middle knuckles in front,
   smaller from the middle finger to the little finger), the thumb tucked along them; pinch = the index curled down to
   meet the thumb, the two tips together at the card's edge with the table showing through the loop between them, the
   other fingers loosely curled; open = the hand flat on the card, palm down, the fingers relaxed and a little apart,
   the thumb lying on its side along the hand.
   Units: 1 viewBox unit = 1 stage px at scale 1 on the 1280x720 stage (walk.js draws the hands at HS = 1.3 times that).
   From the wrist crease to the tip of the middle finger is about 126 (learner) and 182 (teacher) units; the rest of h is
   forearm and sleeve. tip / grip / palm = the point that touches the card (the index fingertip; where the thumb and
   index tips meet; the middle of the back of the hand): translate and rotate the drawing about it. wrist = the middle
   of the wrist crease.
   Softly shaded, light from the upper left, no outline but a thin edge a few shades darker than the skin: each finger
   and the thumb is filled with a gradient across it (a cylinder in that light, a soft sheen), and a second gradient
   along it fades its base into the back of the hand and darkens its end; soft radial-gradient blobs (highlights,
   hollows, the warmth of the knuckles and fingertips) are clipped to the skin; a part that lies over another casts a
   soft contact shade on it. Built to paint cheaply while walk.js moves and scales the hands: no filters, no group
   opacity (each shape carries its own fill or stroke opacity), every clip path a single element, and nothing drawn
   under the sleeves.
   <g class="wh-shadow"> (drawn first) is the soft table shadow: three fill-only layers cast to the lower right, crisp
   where the hand touches the card (point, pinch) and softer and farther off where it rises; hide it with
   .wh-shadow{display:none} if the stage draws its own. The light and the shadow are part of each drawing, so they turn
   with the hand when walk.js rotates it.
   The ids inside a drawing (outlines, gradients, clip paths) start with that drawing's own prefix (whLp-, whLn-, whLo-,
   whTp-, whTn-, whTo-), so each drawing can be inserted once in a page; a second copy in the same page needs its ids
   renamed. Mirror with scaleX(-1) for a left hand. No external references. */
const WALK_HANDS={
  learner:{
    point:{w:135,h:540,tip:[33.1,6.7],wrist:[58.1,119.8],
      svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 135 540" width="135" height="540"><g class="wh-shadow" fill="#3a2410"><path fill-opacity=".035" d="M32.4 2.8c1.6-.3 3.7-.1 5.1.6s1.5-2.5 3.6 3.1s6.2 25.3 9.1 30.3s6-.9 8.8-.2s5.8 3.7 8.3 4.4s4.4-.6 6.4-.4s3.6.7 5.3 1.6s3.6 2.4 4.9 3.9s1.3 4 2.7 5s4.2.2 6.1 1s3.9 1.6 5.6 3.8s3.5 5.4 4.4 9.2s.7 3 .7 13.4s-1.3 39.3-1.2 48.9s1.4-3.9 2 9s.2 43.3 1.4 68.5s4.7 63.9 5.9 83.3s.9 27 1.1 32.9s-1.1 1.4.4 2.7s6.9 3.4 8.8 5.2s2.5 2.3 2.3 5.4s-3.3 9-3.5 13.1s1.3 1.7 2 11.5s1.1 26.3 2.6 47.3s5.1 58.5 6.4 78.4s1.6 28.2 1.7 40.9s0 25.4-1.2 35.6s-2.6 18.4-5.8 25.3s-7.8 11.6-13.2 15.9s-12.6 7.6-19.4 9.7s-14.1 3.1-21.4 3.1s-15.3-.9-22.2-3.1s-14.1-5.5-19.6-9.8s-10-9-13.1-16.3s-4.7-17-5.8-27.6s-1-23.7-.9-36.1s.4-19.2 1.7-38.4s4.7-54.7 6.4-77.1s3.5-45.2 3.7-57.3s-2.5-12-2.5-15.4s.8-3.6 2.1-5.2s4.5 3.2 5.7-4.4s.1-21.7 1.7-40.8s6.2-53.4 8.1-74s2.4-37.9 3.1-49.8s.9-15.4.7-21.5s-1.1-11.4-2.1-15.4s-2.3-6.5-3.8-8.7s-3.9-2.6-5.5-4.6s-3-4.4-4.2-7.3s-1.9-5-2.9-9.7s-2.7-14-3.2-18.2s0-4.4.4-6.7s1.3-4.6 2.1-6.6s1.5-3.6 2.6-5.2s3.7 3.7 3.9-4.1s-2.8-34.8-2.9-42.6s.9-3.1 2-4.1s3-2.1 4.6-2.4z"/><path fill-opacity=".05" d="M32.4 2.8c1.7-.2 3.6-.1 5.1.9s2.2-1.1 3.9 4.7s4.3 25 6.7 29.7s5.8-1.4 8-1.5s3.3.5 4.9 1.4s2.7 3.1 4.6 3.6s4.8-.7 6.7-.6s3.3.6 4.8 1.4s3.2 2.2 4.2 3.7s.4 4.5 1.9 5.6s4.9.1 6.9.7s3.3 1.3 4.6 3.1s2.9-3.7 3.4 8.1s-1 50.5-.8 62.4s1.4-4.2 2 8.7s.2 43.3 1.4 68.6s4.7 63.1 5.9 83.2s-.3 29.9 1.4 36.9s7 3.2 8.9 4.7s2.5 1.7 2.3 4.6s-3.4 8.7-3.6 12.8s1.4 1.9 2.1 11.8s1.1 26.6 2.6 47.5s5.1 58.4 6.4 78.2s1.6 28 1.7 40.6s0 25.1-1.2 35s-2.6 18.1-5.6 24.7s-7.3 11-12.4 15s-11.8 7.1-18.3 9.1s-14 3-21 3s-14.6-1-21.2-3s-13.2-5.1-18.3-9.1s-9.5-8.2-12.5-15.3s-4.5-16.4-5.6-26.9s-1-23.5-.9-35.8s.4-19 1.7-38.1s4.9-55.6 6.4-76.8s2-40.9 2.6-50.6s1.5-3.8 1.2-7.6s-2.5-11.7-2.6-14.8s.6-2.8 1.9-4.1s4.5 5 5.9-3.8s.5-27.5 2.3-49.2s6.7-57.9 8.6-81s2.9-44.8 2.8-57.7s-2.1-15.1-3.2-19.5s-2.1-5-3.6-6.9s-3.7-2.3-5.3-4.2s-2.2-1.1-3.9-6.7s-4.9-21.3-5.8-26.8s0-4.1.3-6.2s1.3-4.3 2-6.1s1.3-3.2 2.4-4.6s4 3.7 4.1-4s-3.1-34.5-3.3-42.3s.8-3 1.9-4.1s3-2.1 4.6-2.4z"/><path fill-opacity=".075" d="M32.2 3c1.5-.2 3.4-.1 4.9.8s2.3-1.3 3.8 4.6s4.1 26 5.5 30.8s1.7-1.3 3.1-1.6s3.8-.8 5.5-.7s3.1.4 4.6 1.3s2.6 3.7 4.5 4.2s4.8-1.1 6.7-1s3.2.4 4.6 1.3s3.3 2.5 4 4.2s-.6 5.4.5 6.2s4.4-1 6.1-.9s2.9.7 4.1 1.6s2.2 2.1 2.9 3.5s1.3-6 1.4 5.2s-1.1 50.4-.9 62.2s1.3-4.4 1.9 8.5s.2 43.5 1.4 68.8s4.7 62.7 5.9 82.9s-.2 31.3 1.4 38.3s6.4 2.6 8.2 3.9s3.1 1.2 3 4s-3.4 9-3.6 13.1s1.4 2 2.2 11.9s1 26.6 2.5 47.5s5.1 58.2 6.4 77.9s1.6 28 1.7 40.5s0 24.8-1.1 34.6s-2.6 17.8-5.5 24.2s-6.9 10.4-11.8 14.2s-11.3 6.8-17.6 8.7s-13.5 2.9-20.3 2.9s-14.1-.9-20.5-2.9s-12.8-5-17.7-8.8s-8.9-7.6-11.7-14.4s-4.5-15.8-5.5-26s-1-23.2-.9-35.5s.4-19.2 1.7-38.3s4.9-55.4 6.4-76.5s1.9-40.9 2.6-50.7s1.6-4.1 1.4-7.9s-2.6-11.8-2.8-14.7s.1-1.7 1.4-2.8s5.1 4.1 6.4-3.7s0-23 1.7-43.7s6.7-55.8 8.7-80.1s3.3-51.2 3.3-65.5s-2.1-15.8-3.4-20.5s-2.7-6-4.2-7.9s-3.4-1.9-4.8-3.5s-2.1-.8-3.6-6.2s-4.9-20.9-5.8-26.4s.1-4.3.7-6.7s1.5-5.4 2.9-7.5s5.1 2.9 5.4-4.9s-3.6-34.5-4-42.2s.8-2.9 1.8-3.9s2.9-2.1 4.5-2.4z"/></g><defs><path id="whLp-0" d="M23.4 97c-.8-1.2-1.8-2.7-2.5-4.6s-1.5-4.9-1.9-7.1s-.6-4-.9-6.1s-.6-4.5-.8-6.6s-.5-4.5-.5-5.9s0-1.8.2-2.7s.2-1.4.5-2.5s1-2.5 1.6-3.8s1.4-3 2.1-3.9s.9-1.3 1.5-1.8s1.3-1 2-1.4s1.5-.6 2.2-.8s1.6-.2 2.4-.1s1.5.2 2.2.5s1.4.6 2.1 1s1.2 1 1.7 1.6s.9 1.3 1.2 2s.5 1.5.7 2.3s.1 1.6 0 2.4s-.2 1.4-.5 2.4s-1.2 3.1-1.4 3.7s.1-1.2.2.1s.3 4.7.8 7.7s1.6 8.2 2 10s.2.8.2.9s0-.3.1-.3s.1 0 .5.4s1.2 1.5 1.6 2.4s.9 2 .9 3s-.1 2.3-.5 3.4s-1.1 2.2-2 3.1s-1.9 1.9-3 2.5s-2.4 1.2-3.6 1.4s-2.5.4-3.7.2s-2.3-.6-3.2-1.1s-1.4-1.2-2.2-2.3z"/><path id="whLp-1" d="M19.6 341c-12.2-3.8 0-12.2.3-22.4s.6-26.2 1.5-39.2s2.3-26.2 3.6-39.2s3.5-26.4 4.7-39.2s1.9-26.9 2.5-37.8s.8-21 1.1-28s.6-9.6.4-14s-.4-8.6-1.7-12.6s-3.9-8.1-5.7-11.3s-5-5.8-4.7-8s4.8-3.3 6.6-4.9s3.7-2.6 4.3-4.5s.1-2.8-.8-7.1s-3.6-14.9-4.4-18.5s-1.7-2.3-.3-3.5s5.7-4.4 8.4-4.2s6.1 4.7 7.8 4.9s1.3-3.4 2.7-4.1s3.8-.1 5.6-.1s4-.4 5.3.2s1.6 2.7 2.4 3.1s1.3-.5 2.6-.6s3.5-.2 5.2-.2s3.8-1 5 .2s1.3 6.4 2.2 7.5s1.9-.7 3.4-.9s4.1-.4 6 .1s4.7-1.7 5.2 2.7s-1.7 16.7-2.4 24s-1.5 13.5-2 19.6s-1 12.8-1 16.8s.8 4.2.9 7s-.1 3.9 0 9.8s.1 14.7.4 25.2s.7 24.9 1.4 37.8s1.6 26.1 2.5 39.2s2.2 26.1 2.9 39.2s1.2 28.7 1.6 39.2s12.7 19.8.5 23.8s-61.7 3.7-74 0z"/><path id="whLp-2" d="M73.5 61.6c.2-1.5.8-6.1 1-7.6s.3-.9.5-1.3s.5-.8.9-1.1s.5-.5 1.2-.8s2.1-.7 3.2-.7s2.9.5 3.8.8s1 .5 1.5.8s.9.6 1.2 1s.7.8.9 1.2s.3.9.4 1.3s.3 0-.1 1.5s-1.5 5.9-1.9 7.4s-.4 1.1-.8 1.6s-1 .8-1.7 1.1s-1.4.5-2.2.6s-1.6 0-2.4-.2s-1.7-.4-2.4-.8s-1.3-.8-1.8-1.3s-.9-1.1-1.1-1.7s-.3-.2-.2-1.8z"/><path id="whLp-3" d="M58.1 55.4c0-2 .2-8 .3-10s.2-1.2.5-1.7s.5-1 .9-1.5s.9-.8 1.5-1.1s1.1-.6 1.8-.8s1.4-.4 2.1-.5s1.6 0 2.4.1s1.7.2 2.4.4s1.4.5 2 .8s1.2.7 1.7 1.2s.8.9 1.2 1.4s.5 1 .6 1.6s.4-.2.1 1.8s-1.2 7.9-1.6 9.9s-.3 1.4-.8 2s-1.1 1.2-1.9 1.7s-1.7.8-2.7.9s-2.1.3-3.1.2s-2.1-.4-3-.7s-1.8-.9-2.4-1.5s-1.3-1.3-1.6-2s-.4-.1-.4-2.2z"/><path id="whLp-4" d="M42.2 53.4c-.1-2.3-.3-9-.3-11.1s.2-1.4.4-1.9s.5-1.2.9-1.7s1-1 1.5-1.3s1.3-.8 2-1s1.4-.5 2.3-.6s1.7-.2 2.6-.2s1.7.2 2.5.3s1.6.5 2.3.8s1.3.7 1.8 1.1s1.1 1 1.4 1.5s.7 1.1.9 1.7s.4-.3.2 1.9s-.8 8.9-1.1 11.1s-.3 1.6-.7 2.3s-1.2 1.4-2 1.9s-1.8 1-2.9 1.2s-2.2.4-3.3.4s-2.3-.3-3.3-.6s-2-.8-2.8-1.4s-1.4-1.3-1.8-2.1s-.4-.1-.6-2.3z"/><path id="whLp-5" d="M27.2 58.8c-.1-1.3-.1-2.7-.2-5.6s-.1-8.2-.3-11.7s-.5-6.3-.6-9.5s.2-6.2.1-9.4s-.5-7.8-.6-10.1s0-2.6.2-3.5s.3-1.3.6-1.9s.7-1.1 1.2-1.6s.9-1 1.5-1.4s1.1-.6 1.8-.8s1.3-.4 1.9-.4s1.4 0 2 .1s1.3.4 1.9.7s1.2.6 1.7 1.1s.9.9 1.3 1.5s.6.9.9 1.8s.4 1.1.6 3.4s.3 6.9.6 10.2s.8 6.4 1 9.6s.1 5.9.2 9.5s.6 8.8.8 11.7s.3 4.3.2 5.6s-.1 1.6-.5 2.3s-1 1.4-1.7 1.9s-1.7 1.1-2.7 1.4s-2.1.6-3.2.6s-2.2 0-3.2-.3s-2-.6-2.8-1.1s-1.5-1.2-1.9-1.9s-.6-.9-.8-2.2z"/><path id="whLp-6" d="M13 322.2c2.7-3.4 12-4.2 18.2-5.9s13-3.5 19.1-4s11.7.5 17.3 1.1s10.5.7 16.4 2.2s16.7 3.4 19.4 6.9s-2.8 6.1-2.8 14.3s2.2-4.5 3.3 35s18.8 168 3 201.6s-82 33.6-97.7 0s2.4-162.2 3.4-201.6s2.3-26.8 2.4-35s-4.7-11.2-2-14.6z"/><path id="whLp-7" d="M23.4 97c-.8-1.2-1.8-2.7-2.5-4.6s-1.5-4.9-1.9-7.1s-.6-4-.9-6.1s-.6-4.5-.8-6.6s-.5-4.5-.5-5.9s0-1.8.2-2.7s.2-1.4.5-2.5s1-2.5 1.6-3.8s1.4-3 2.1-3.9s.9-1.3 1.5-1.8s1.3-1 2-1.4s1.5-.6 2.2-.8s1.6-.2 2.4-.1s1.5.2 2.2.5s1.4.6 2.1 1s1.2 1 1.7 1.6s.9 1.3 1.2 2s.5 1.5.7 2.3s.1 1.6 0 2.4s-.2 1.4-.5 2.4s-1.2 3.1-1.4 3.7s.1-1.2.2.1s.3 4.7.8 7.7s1.6 8.2 2 10s.2.8.2.9s0-.3.1-.3s.1 0 .5.4s1.2 1.5 1.6 2.4s.9 2 .9 3s-.1 2.3-.5 3.4s-1.1 2.2-2 3.1s-1.9 1.9-3 2.5s-2.4 1.2-3.6 1.4s-2.5.4-3.7.2s-2.3-.6-3.2-1.1s-1.4-1.2-2.2-2.3zM19.6 341c-12.2-3.8 0-12.2.3-22.4s.6-26.2 1.5-39.2s2.3-26.2 3.6-39.2s3.5-26.4 4.7-39.2s1.9-26.9 2.5-37.8s.8-21 1.1-28s.6-9.6.4-14s-.4-8.6-1.7-12.6s-3.9-8.1-5.7-11.3s-5-5.8-4.7-8s4.8-3.3 6.6-4.9s3.7-2.6 4.3-4.5s.1-2.8-.8-7.1s-3.6-14.9-4.4-18.5s-1.7-2.3-.3-3.5s5.7-4.4 8.4-4.2s6.1 4.7 7.8 4.9s1.3-3.4 2.7-4.1s3.8-.1 5.6-.1s4-.4 5.3.2s1.6 2.7 2.4 3.1s1.3-.5 2.6-.6s3.5-.2 5.2-.2s3.8-1 5 .2s1.3 6.4 2.2 7.5s1.9-.7 3.4-.9s4.1-.4 6 .1s4.7-1.7 5.2 2.7s-1.7 16.7-2.4 24s-1.5 13.5-2 19.6s-1 12.8-1 16.8s.8 4.2.9 7s-.1 3.9 0 9.8s.1 14.7.4 25.2s.7 24.9 1.4 37.8s1.6 26.1 2.5 39.2s2.2 26.1 2.9 39.2s1.2 28.7 1.6 39.2s12.7 19.8.5 23.8s-61.7 3.7-74 0zM73.5 61.6c.2-1.5.8-6.1 1-7.6s.3-.9.5-1.3s.5-.8.9-1.1s.5-.5 1.2-.8s2.1-.7 3.2-.7s2.9.5 3.8.8s1 .5 1.5.8s.9.6 1.2 1s.7.8.9 1.2s.3.9.4 1.3s.3 0-.1 1.5s-1.5 5.9-1.9 7.4s-.4 1.1-.8 1.6s-1 .8-1.7 1.1s-1.4.5-2.2.6s-1.6 0-2.4-.2s-1.7-.4-2.4-.8s-1.3-.8-1.8-1.3s-.9-1.1-1.1-1.7s-.3-.2-.2-1.8zM58.1 55.4c0-2 .2-8 .3-10s.2-1.2.5-1.7s.5-1 .9-1.5s.9-.8 1.5-1.1s1.1-.6 1.8-.8s1.4-.4 2.1-.5s1.6 0 2.4.1s1.7.2 2.4.4s1.4.5 2 .8s1.2.7 1.7 1.2s.8.9 1.2 1.4s.5 1 .6 1.6s.4-.2.1 1.8s-1.2 7.9-1.6 9.9s-.3 1.4-.8 2s-1.1 1.2-1.9 1.7s-1.7.8-2.7.9s-2.1.3-3.1.2s-2.1-.4-3-.7s-1.8-.9-2.4-1.5s-1.3-1.3-1.6-2s-.4-.1-.4-2.2zM42.2 53.4c-.1-2.3-.3-9-.3-11.1s.2-1.4.4-1.9s.5-1.2.9-1.7s1-1 1.5-1.3s1.3-.8 2-1s1.4-.5 2.3-.6s1.7-.2 2.6-.2s1.7.2 2.5.3s1.6.5 2.3.8s1.3.7 1.8 1.1s1.1 1 1.4 1.5s.7 1.1.9 1.7s.4-.3.2 1.9s-.8 8.9-1.1 11.1s-.3 1.6-.7 2.3s-1.2 1.4-2 1.9s-1.8 1-2.9 1.2s-2.2.4-3.3.4s-2.3-.3-3.3-.6s-2-.8-2.8-1.4s-1.4-1.3-1.8-2.1s-.4-.1-.6-2.3zM27.2 58.8c-.1-1.3-.1-2.7-.2-5.6s-.1-8.2-.3-11.7s-.5-6.3-.6-9.5s.2-6.2.1-9.4s-.5-7.8-.6-10.1s0-2.6.2-3.5s.3-1.3.6-1.9s.7-1.1 1.2-1.6s.9-1 1.5-1.4s1.1-.6 1.8-.8s1.3-.4 1.9-.4s1.4 0 2 .1s1.3.4 1.9.7s1.2.6 1.7 1.1s.9.9 1.3 1.5s.6.9.9 1.8s.4 1.1.6 3.4s.3 6.9.6 10.2s.8 6.4 1 9.6s.1 5.9.2 9.5s.6 8.8.8 11.7s.3 4.3.2 5.6s-.1 1.6-.5 2.3s-1 1.4-1.7 1.9s-1.7 1.1-2.7 1.4s-2.1.6-3.2.6s-2.2 0-3.2-.3s-2-.6-2.8-1.1s-1.5-1.2-1.9-1.9s-.6-.9-.8-2.2z"/><clipPath id="whLp-8"><use href="#whLp-7"/></clipPath><radialGradient id="whLp-9"><stop offset="0" stop-color="#fff2e6" stop-opacity=".8"/><stop offset=".5" stop-color="#fff2e6" stop-opacity=".3"/><stop offset="1" stop-color="#fff2e6" stop-opacity="0"/></radialGradient><radialGradient id="whLp-a"><stop offset="0" stop-color="#fbd9bf" stop-opacity=".85"/><stop offset=".55" stop-color="#fbd9bf" stop-opacity=".32"/><stop offset="1" stop-color="#fbd9bf" stop-opacity="0"/></radialGradient><radialGradient id="whLp-b"><stop offset="0" stop-color="#b87253" stop-opacity=".6"/><stop offset=".55" stop-color="#b87253" stop-opacity=".2"/><stop offset="1" stop-color="#b87253" stop-opacity="0"/></radialGradient><radialGradient id="whLp-c"><stop offset="0" stop-color="#ee8a78" stop-opacity=".55"/><stop offset=".55" stop-color="#ee8a78" stop-opacity=".2"/><stop offset="1" stop-color="#ee8a78" stop-opacity="0"/></radialGradient><linearGradient id="whLp-d" gradientUnits="userSpaceOnUse" x1="17.2" y1="71.7" x2="35.9" y2="71.4"><stop offset="0" stop-color="#e0a585"/><stop offset=".042" stop-color="#ecb997"/><stop offset=".292" stop-color="#fadac2"/><stop offset=".833" stop-color="#da9a7b"/><stop offset=".917" stop-color="#c37f60"/><stop offset="1" stop-color="#c58162"/></linearGradient><linearGradient id="whLp-e" gradientUnits="userSpaceOnUse" x1="32.1" y1="91.9" x2="31.5" y2="49.7"><stop offset="0" stop-color="#f2c3a0"/><stop offset=".2" stop-color="#f2c3a0"/><stop offset=".549" stop-color="#f2c3a0" stop-opacity="0"/><stop offset=".719" stop-color="#dc9d7e" stop-opacity="0"/><stop offset="1" stop-color="#dc9d7e" stop-opacity=".28"/></linearGradient><linearGradient id="whLp-f" gradientUnits="userSpaceOnUse" x1="24.8" y1="61.5" x2="28.6" y2="51.1"><stop offset="0" stop-color="#ebb7a5"/><stop offset=".35" stop-color="#f8d9cc"/><stop offset=".85" stop-color="#f8d9cc"/><stop offset="1" stop-color="#fdf0e8"/></linearGradient><clipPath id="whLp-g"><use href="#whLp-0"/></clipPath><clipPath id="whLp-h"><use href="#whLp-0"/></clipPath><linearGradient id="whLp-i" gradientUnits="userSpaceOnUse" x1="74.3" y1="56.9" x2="87.1" y2="59.4"><stop offset="0" stop-color="#e4aa8a"/><stop offset=".125" stop-color="#fbe0cc"/><stop offset=".292" stop-color="#fff1e4"/><stop offset=".667" stop-color="#ebb795"/><stop offset=".958" stop-color="#bf7a5b"/><stop offset="1" stop-color="#c48162"/></linearGradient><linearGradient id="whLp-j" gradientUnits="userSpaceOnUse" x1="79.8" y1="62.9" x2="82.2" y2="50.3"><stop offset="0" stop-color="#f2c3a0"/><stop offset=".224" stop-color="#f2c3a0"/><stop offset=".469" stop-color="#f2c3a0" stop-opacity="0"/><stop offset=".513" stop-color="#dc9d7e" stop-opacity="0"/><stop offset="1" stop-color="#dc9d7e" stop-opacity=".42"/></linearGradient><clipPath id="whLp-k"><use href="#whLp-2"/></clipPath><clipPath id="whLp-l"><use href="#whLp-2"/></clipPath><linearGradient id="whLp-m" gradientUnits="userSpaceOnUse" x1="58.4" y1="50.4" x2="74.7" y2="51.9"><stop offset="0" stop-color="#e2a787"/><stop offset=".146" stop-color="#fbe2cd"/><stop offset=".313" stop-color="#fff1e5"/><stop offset=".646" stop-color="#eebc9a"/><stop offset=".979" stop-color="#c27e5f"/><stop offset="1" stop-color="#c48162"/></linearGradient><linearGradient id="whLp-n" gradientUnits="userSpaceOnUse" x1="66.1" y1="56.2" x2="67.6" y2="39.9"><stop offset="0" stop-color="#f2c3a0"/><stop offset=".163" stop-color="#f2c3a0"/><stop offset=".427" stop-color="#f2c3a0" stop-opacity="0"/><stop offset=".488" stop-color="#dc9d7e" stop-opacity="0"/><stop offset="1" stop-color="#dc9d7e" stop-opacity=".42"/></linearGradient><clipPath id="whLp-o"><use href="#whLp-3"/></clipPath><clipPath id="whLp-p"><use href="#whLp-3"/></clipPath><linearGradient id="whLp-q" gradientUnits="userSpaceOnUse" x1="42.2" y1="48.2" x2="60" y2="48.8"><stop offset="0" stop-color="#e1a585"/><stop offset=".125" stop-color="#fadac1"/><stop offset=".313" stop-color="#fff1e5"/><stop offset=".708" stop-color="#ebb694"/><stop offset=".979" stop-color="#c27e5f"/><stop offset="1" stop-color="#c48162"/></linearGradient><linearGradient id="whLp-r" gradientUnits="userSpaceOnUse" x1="50.9" y1="53.7" x2="51.6" y2="35.6"><stop offset="0" stop-color="#f2c3a0"/><stop offset=".144" stop-color="#f2c3a0"/><stop offset=".414" stop-color="#f2c3a0" stop-opacity="0"/><stop offset=".482" stop-color="#dc9d7e" stop-opacity="0"/><stop offset="1" stop-color="#dc9d7e" stop-opacity=".42"/></linearGradient><clipPath id="whLp-s"><use href="#whLp-4"/></clipPath><path id="whLp-t" d="M23.4 97c-.8-1.2-1.8-2.7-2.5-4.6s-1.5-4.9-1.9-7.1s-.6-4-.9-6.1s-.6-4.5-.8-6.6s-.5-4.5-.5-5.9s0-1.8.2-2.7s.2-1.4.5-2.5s1-2.5 1.6-3.8s1.4-3 2.1-3.9s.9-1.3 1.5-1.8s1.3-1 2-1.4s1.5-.6 2.2-.8s1.6-.2 2.4-.1s1.5.2 2.2.5s1.4.6 2.1 1s1.2 1 1.7 1.6s.9 1.3 1.2 2s.5 1.5.7 2.3s.1 1.6 0 2.4s-.2 1.4-.5 2.4s-1.2 3.1-1.4 3.7s.1-1.2.2.1s.3 4.7.8 7.7s1.6 8.2 2 10s.2.8.2.9s0-.3.1-.3s.1 0 .5.4s1.2 1.5 1.6 2.4s.9 2 .9 3s-.1 2.3-.5 3.4s-1.1 2.2-2 3.1s-1.9 1.9-3 2.5s-2.4 1.2-3.6 1.4s-2.5.4-3.7.2s-2.3-.6-3.2-1.1s-1.4-1.2-2.2-2.3zM42.2 53.4c-.1-2.3-.3-9-.3-11.1s.2-1.4.4-1.9s.5-1.2.9-1.7s1-1 1.5-1.3s1.3-.8 2-1s1.4-.5 2.3-.6s1.7-.2 2.6-.2s1.7.2 2.5.3s1.6.5 2.3.8s1.3.7 1.8 1.1s1.1 1 1.4 1.5s.7 1.1.9 1.7s.4-.3.2 1.9s-.8 8.9-1.1 11.1s-.3 1.6-.7 2.3s-1.2 1.4-2 1.9s-1.8 1-2.9 1.2s-2.2.4-3.3.4s-2.3-.3-3.3-.6s-2-.8-2.8-1.4s-1.4-1.3-1.8-2.1s-.4-.1-.6-2.3z"/><clipPath id="whLp-u"><use href="#whLp-t"/></clipPath><linearGradient id="whLp-v" gradientUnits="userSpaceOnUse" x1="26.1" y1="29.5" x2="42.6" y2="28.7"><stop offset="0" stop-color="#e0a384"/><stop offset=".042" stop-color="#ebb896"/><stop offset=".313" stop-color="#f9d8bf"/><stop offset=".854" stop-color="#d69677"/><stop offset=".917" stop-color="#c58162"/><stop offset="1" stop-color="#c58162"/></linearGradient><linearGradient id="whLp-w" gradientUnits="userSpaceOnUse" x1="35.6" y1="58.5" x2="32.8" y2="2.9"><stop offset="0" stop-color="#f2c3a0"/><stop offset=".038" stop-color="#f2c3a0"/><stop offset=".25" stop-color="#f2c3a0" stop-opacity="0"/><stop offset=".823" stop-color="#dc9d7e" stop-opacity="0"/><stop offset="1" stop-color="#dc9d7e" stop-opacity=".3"/></linearGradient><linearGradient id="whLp-x" gradientUnits="userSpaceOnUse" x1="33.5" y1="14" x2="32.9" y2="4.4"><stop offset="0" stop-color="#ebb7a5"/><stop offset=".35" stop-color="#f8d9cc"/><stop offset=".85" stop-color="#f8d9cc"/><stop offset="1" stop-color="#fdf0e8"/></linearGradient><clipPath id="whLp-y"><use href="#whLp-5"/></clipPath><linearGradient id="whLp-z" gradientUnits="userSpaceOnUse" x1="58.1" y1="55.9" x2="58.1" y2="81.1"><stop offset="0" stop-color="#b87253" stop-opacity="0"/><stop offset="1" stop-color="#b87253"/></linearGradient><linearGradient id="whLp-10" gradientUnits="userSpaceOnUse" x1="58.1" y1="100.2" x2="58.1" y2="122.6"><stop offset="0" stop-color="#f9d6bc" stop-opacity="0"/><stop offset="1" stop-color="#f9d6bc"/></linearGradient><clipPath id="whLp-11"><use href="#whLp-6"/></clipPath><radialGradient id="whLp-12"><stop offset="0" stop-color="#2f6644" stop-opacity=".5"/><stop offset=".6" stop-color="#2f6644" stop-opacity=".18"/><stop offset="1" stop-color="#2f6644" stop-opacity="0"/></radialGradient><radialGradient id="whLp-13"><stop offset="0" stop-color="#95d0aa" stop-opacity=".42"/><stop offset=".6" stop-color="#95d0aa" stop-opacity=".14"/><stop offset="1" stop-color="#95d0aa" stop-opacity="0"/></radialGradient><linearGradient id="whLp-14" gradientUnits="userSpaceOnUse" x1="10.6" y1="119.8" x2="105.5" y2="119.8"><stop offset="0" stop-color="#579f72"/><stop offset=".16" stop-color="#6db487"/><stop offset=".4" stop-color="#66ae81"/><stop offset=".62" stop-color="#5ca679"/><stop offset=".86" stop-color="#4d9266"/><stop offset="1" stop-color="#42825a"/></linearGradient></defs><path d="M13 322.2c0 .4.6-.9 1.9-1.5s3.2-1.3 5.9-2.1s7.7-1.6 10.4-2.3s4.3-1.1 6.4-1.6s3.8-1.1 6.4-1.5s6.8-.9 9.3-1s3.4 0 5.8.2s5.7.7 8.5 1s5.8.5 8.1.8s2.9.3 5.4.8s7.1 1.6 10 2.3s5.7 1.6 7.4 2.2s2.1.9 2.9 1.4s2 2 2 1.6s-1.1-3-2-4.1s-1.2-1.6-2.9-2.7s-5-3-7.4-4.2s-4.9-2-7.1-2.8s-3.8-1.2-5.6-1.7s-2.6-.6-5.4-1s-8.7-1.3-11.1-1.6s-1.4-.3-2.8-.4s-3.8-.3-5.8-.2s-4 .3-6.1.7s-4.2 1-6.4 1.6s-3.7 1.2-6.4 2.3s-7.2 2.6-10 3.9s-5.3 2.6-6.8 3.6s-2 1.4-2.7 2.4s-1.9 3.5-1.9 3.9z" fill="#1f482f"/><path d="M13 322.2c.3-.6 1.1-2.8 1.9-3.9s1.1-1.4 2.7-2.4s3.9-2.4 6.8-3.6s7.3-2.9 10-3.9s4.3-1.6 6.4-2.3s4.3-1.2 6.4-1.6s4.1-.6 6.1-.7s4.4.2 5.8.2s.5.1 2.8.4s8.4 1.1 11.1 1.6s3.5.5 5.4 1s3.5 1 5.6 1.7s4.7 1.7 7.1 2.8s5.7 3 7.4 4.2s2.1 1.6 2.9 2.7s1.7 3.4 2 4.1" fill="none" stroke="#4a8e63" stroke-width="1.3" stroke-opacity=".9" stroke-linecap="round" stroke-linejoin="round"/><use href="#whLp-7" fill="none" stroke="#b67455" stroke-width="1.2" stroke-opacity=".75" stroke-linejoin="round"/><use href="#whLp-7" fill="#f2c3a0"/><use href="#whLp-0" fill="url(#whLp-d)"/><use href="#whLp-0" fill="url(#whLp-e)"/><path d="M27.9 67.5c-.2-.1-.8-.2-1.1-.3s-.8-.1-1.2-.1s-.7.1-1.1.1s-.9.3-1.1.3" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".132" stroke-linecap="round" stroke-linejoin="round"/><path d="M26.9 65c-.2 0-.6-.3-.9-.4s-.5-.1-.8-.1s-.5.1-.8.2s-.7.3-.8.4" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".09" stroke-linecap="round" stroke-linejoin="round"/><path d="M27.9 63.1c-.6 0-2.5.2-3.6-.2s-2.4-1.8-2.9-2.1" fill="none" stroke="#f9d6bc" stroke-width="2.1" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M28.6 51.1c-.4-.1-.6-.3-1.1-.2s-1.5.1-2.1.5s-1.3 1.2-1.7 1.6s-.3.5-.5 1.1s-.8 1.9-.9 2.8s-.3 1.7-.2 2.4s.6 1.1 1 1.5s1 .5 1.7.7s2 .6 2.7.4s1.2-.7 1.6-1.1s.4-.6.7-1.3s.8-1.8 1-2.7s.3-1.8.3-2.3s0-.7-.3-1.2s-.9-1.3-1.3-1.7s-.6-.4-.9-.5z" fill="url(#whLp-f)" stroke="#d39a84" stroke-width=".8" stroke-opacity=".45"/><path d="M28.8 61.2c-.2 0-.8.3-1.4.4s-2 0-2.6-.1s-.6-.2-1-.6s-1.6-1.8-1.9-2.2" fill="none" stroke="#c47f62" stroke-width="1.2" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M24.2 57.9c.1-.2.3-.9.5-1.4s.3-.9.5-1.3s.3-.9.4-1.4s.5-1.1.5-1.4" fill="none" stroke="#fff7f2" stroke-width="1.2" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whLp-g)"><ellipse cx="28.7" cy="58.1" rx="8.8" ry="9.7" transform="rotate(19.7 28.7 58.1)" fill="url(#whLp-c)" fill-opacity=".26"/></g><g clip-path="url(#whLp-h)" fill="none" stroke="#b87253"><use href="#whLp-1" stroke-width="1.5" stroke-opacity=".09" transform="translate(.5 .7)"/><use href="#whLp-1" stroke-width="3.4" stroke-opacity=".07" transform="translate(.5 .7)"/><use href="#whLp-1" stroke-width="5.9" stroke-opacity=".05" transform="translate(.5 .7)"/></g><use href="#whLp-1" fill="#f2c3a0"/><path d="M32.1 80.8c.1-.3.5-1 .6-1.8s0-1.4-.3-2.9s-.9-4.4-1.3-5.9s-.2-1-.7-3.3s-2-8.2-2.5-10.3s-.3-1.5-.6-2.3s-.8-2.4-1-2.9" fill="none" stroke="#b67455" stroke-width=".7" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><use href="#whLp-2" fill="url(#whLp-i)"/><use href="#whLp-2" fill="url(#whLp-j)"/><g clip-path="url(#whLp-k)"><ellipse cx="80" cy="56.2" rx="5.7" ry="4.1" transform="rotate(101 80 56.2)" fill="url(#whLp-a)" fill-opacity=".22"/><ellipse cx="81.4" cy="54.7" rx="6.5" ry="4.1" transform="rotate(101 81.4 54.7)" fill="url(#whLp-c)" fill-opacity=".26"/></g><g clip-path="url(#whLp-l)" fill="none" stroke="#b87253"><use href="#whLp-3" stroke-width="1.5" stroke-opacity=".09" transform="translate(.5 .7)"/><use href="#whLp-3" stroke-width="3.4" stroke-opacity=".07" transform="translate(.5 .7)"/><use href="#whLp-3" stroke-width="5.9" stroke-opacity=".05" transform="translate(.5 .7)"/></g><use href="#whLp-3" fill="url(#whLp-m)"/><use href="#whLp-3" fill="url(#whLp-n)"/><g clip-path="url(#whLp-o)"><ellipse cx="65.5" cy="48.1" rx="7.2" ry="5.1" transform="rotate(95.5 65.5 48.1)" fill="url(#whLp-a)" fill-opacity=".22"/><ellipse cx="67.1" cy="45.4" rx="8.2" ry="5.2" transform="rotate(95.5 67.1 45.4)" fill="url(#whLp-c)" fill-opacity=".26"/></g><path d="M74.9 51c-.2 1-.7 5-.9 6" fill="none" stroke="#b67455" stroke-width=".7" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whLp-p)" fill="none" stroke="#b87253"><use href="#whLp-4" stroke-width="1.5" stroke-opacity=".09" transform="translate(.5 .7)"/><use href="#whLp-4" stroke-width="3.4" stroke-opacity=".07" transform="translate(.5 .7)"/><use href="#whLp-4" stroke-width="5.9" stroke-opacity=".05" transform="translate(.5 .7)"/></g><use href="#whLp-4" fill="url(#whLp-q)"/><use href="#whLp-4" fill="url(#whLp-r)"/><g clip-path="url(#whLp-s)"><ellipse cx="49.7" cy="44.9" rx="7.8" ry="5.6" transform="rotate(92 49.7 44.9)" fill="url(#whLp-a)" fill-opacity=".22"/><ellipse cx="51.3" cy="41.6" rx="8.9" ry="5.6" transform="rotate(92 51.3 41.6)" fill="url(#whLp-c)" fill-opacity=".26"/></g><path d="M60.7 42.9c-.1 1.3-.7 6.5-.8 7.8" fill="none" stroke="#b67455" stroke-width=".7" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whLp-u)" fill="none" stroke="#b87253"><use href="#whLp-5" stroke-width="1.5" stroke-opacity=".09" transform="translate(.5 .7)"/><use href="#whLp-5" stroke-width="3.4" stroke-opacity=".07" transform="translate(.5 .7)"/><use href="#whLp-5" stroke-width="5.9" stroke-opacity=".05" transform="translate(.5 .7)"/></g><use href="#whLp-5" fill="url(#whLp-v)"/><use href="#whLp-5" fill="url(#whLp-w)"/><path d="M36.5 32.4c-.2 0-.8-.2-1.3-.2s-.8 0-1.2 0s-.8 0-1.3.1s-1 .3-1.2.3" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".22" stroke-linecap="round" stroke-linejoin="round"/><path d="M35.4 30.3c-.2-.1-.6-.3-.9-.4s-.6-.1-1 0s-.6 0-.9.1s-.7.4-.9.4" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".15" stroke-linecap="round" stroke-linejoin="round"/><path d="M35 17.4c-.1 0-.6-.2-.9-.2s-.6 0-.9 0s-.6 0-.8.1s-.8.2-.9.3" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".121" stroke-linecap="round" stroke-linejoin="round"/><path d="M34.1 15.4c-.1-.1-.4-.3-.6-.3s-.5-.1-.7-.1s-.4.1-.6.1s-.6.4-.7.4" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".083" stroke-linecap="round" stroke-linejoin="round"/><path d="M37.1 14.2c-.6.1-2.3 1-3.5 1.1s-3-.6-3.6-.7" fill="none" stroke="#f9d6bc" stroke-width="1.8" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M32.9 4.4c-.5.1-1.5.5-2 .7s-.6.4-.8.7s-.5.4-.6.9s-.4 1.2-.5 2s.1 1.8.3 2.5s.4 1.5.8 2s1 .7 1.5.8s1.2.1 1.9 0s2.1-.3 2.7-.6s.8-1 1-1.5s.2-.6.2-1.2s0-1.8-.1-2.5s-.3-1.4-.7-2s-1.1-1.1-1.6-1.4s-.6-.2-1-.3s-.6-.2-1.1-.1z" fill="url(#whLp-x)" stroke="#d39a84" stroke-width=".7" stroke-opacity=".45"/><path d="M37.2 12.3c-.2.1-.6.6-1.2.9s-1.9.6-2.5.7s-.6.2-1.2 0s-2.2-1-2.6-1.1" fill="none" stroke="#c47f62" stroke-width="1.1" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M31.5 11.3c0-.2-.1-.8-.1-1.2s0-.8-.1-1.3s0-.8 0-1.2s-.1-1-.1-1.3" fill="none" stroke="#fff7f2" stroke-width="1.1" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whLp-y)"><ellipse cx="34.5" cy="31.7" rx="7.5" ry="9.2" transform="rotate(-2.7 34.5 31.7)" fill="url(#whLp-c)" fill-opacity=".28"/><ellipse cx="33.2" cy="9" rx="8.1" ry="9.2" transform="rotate(-3.6 33.2 9)" fill="url(#whLp-c)" fill-opacity=".3"/></g><path d="M43 40.8c.1.5.2 2.3.2 3.4s.2 2.2.2 3.2s.2 2.4.2 2.8" fill="none" stroke="#b67455" stroke-width=".7" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 61c-.1-.3-.6-.9-.8-2.2s-.1-4.6-.2-5.6" fill="none" stroke="#b67455" stroke-width=".7" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whLp-8)"><path d="M83.6 56.7c.6 0 2.9-.2 3.7 0s.7.3.9.8s.6.2.6 1.9s-.2 5.1-.5 8.3s-1 8.2-1.4 10.8s-.2 2-.5 4.9s-1 9.5-1.3 12.1s-.2 1.3-.4 3.8s-.6 7.7-.9 11.1s-.5 6.6-.4 9.4s.8 4.2.9 7s-.1 6.8 0 9.8s0 5.2 0 8.3s.2 8 .2 10.8s.1 3.9.2 6.1s.1 4.4.2 6.7s.1 4.9.2 7.4s.2 5.2.3 7.9s.2 5.3.3 7.9s.2 5.3.4 7.9s.2 5.1.4 7.7s.3 5.2.5 7.9s.3 5.2.5 7.8s.4 5.3.5 7.9s.4 5.3.6 7.9s.4 5.2.6 7.8s.4 5.2.6 7.9s.4 5.2.6 7.8s.4 5.2.6 7.8s.4 5.2.5 7.9s.3 5.3.4 8.1s.3 5.5.4 8.3s.2 5.6.3 8.2s.2 5.3.3 7.7s-.1 4.7.2 6.9s.4 3.3 1.3 6.1s3.7 8.2 4.4 10.6s.3 2.9-.6 4.1s-3.9 2.5-4.6 3" fill="none" stroke="url(#whLp-z)" stroke-width="30.8" stroke-opacity=".07" stroke-linecap="round" stroke-linejoin="round"/><path d="M83.6 56.7c.6 0 2.9-.2 3.7 0s.7.3.9.8s.6.2.6 1.9s-.2 5.1-.5 8.3s-1 8.2-1.4 10.8s-.2 2-.5 4.9s-1 9.5-1.3 12.1s-.2 1.3-.4 3.8s-.6 7.7-.9 11.1s-.5 6.6-.4 9.4s.8 4.2.9 7s-.1 6.8 0 9.8s0 5.2 0 8.3s.2 8 .2 10.8s.1 3.9.2 6.1s.1 4.4.2 6.7s.1 4.9.2 7.4s.2 5.2.3 7.9s.2 5.3.3 7.9s.2 5.3.4 7.9s.2 5.1.4 7.7s.3 5.2.5 7.9s.3 5.2.5 7.8s.4 5.3.5 7.9s.4 5.3.6 7.9s.4 5.2.6 7.8s.4 5.2.6 7.9s.4 5.2.6 7.8s.4 5.2.6 7.8s.4 5.2.5 7.9s.3 5.3.4 8.1s.3 5.5.4 8.3s.2 5.6.3 8.2s.2 5.3.3 7.7s-.1 4.7.2 6.9s.4 3.3 1.3 6.1s3.7 8.2 4.4 10.6s.3 2.9-.6 4.1s-3.9 2.5-4.6 3" fill="none" stroke="url(#whLp-z)" stroke-width="16.8" stroke-opacity=".09" stroke-linecap="round" stroke-linejoin="round"/><path d="M83.6 56.7c.6 0 2.9-.2 3.7 0s.7.3.9.8s.6.2.6 1.9s-.2 5.1-.5 8.3s-1 8.2-1.4 10.8s-.2 2-.5 4.9s-1 9.5-1.3 12.1s-.2 1.3-.4 3.8s-.6 7.7-.9 11.1s-.5 6.6-.4 9.4s.8 4.2.9 7s-.1 6.8 0 9.8s0 5.2 0 8.3s.2 8 .2 10.8s.1 3.9.2 6.1s.1 4.4.2 6.7s.1 4.9.2 7.4s.2 5.2.3 7.9s.2 5.3.3 7.9s.2 5.3.4 7.9s.2 5.1.4 7.7s.3 5.2.5 7.9s.3 5.2.5 7.8s.4 5.3.5 7.9s.4 5.3.6 7.9s.4 5.2.6 7.8s.4 5.2.6 7.9s.4 5.2.6 7.8s.4 5.2.6 7.8s.4 5.2.5 7.9s.3 5.3.4 8.1s.3 5.5.4 8.3s.2 5.6.3 8.2s.2 5.3.3 7.7s-.1 4.7.2 6.9s.4 3.3 1.3 6.1s3.7 8.2 4.4 10.6s.3 2.9-.6 4.1s-3.9 2.5-4.6 3" fill="none" stroke="url(#whLp-z)" stroke-width="7" stroke-opacity=".11" stroke-linecap="round" stroke-linejoin="round"/><path d="M26.6 341c-.7-.5-3.8-1.7-4.7-2.8s-1.2-1.5-.6-3.8s3.3-7.3 4.2-9.9s1.1-3.8 1.4-5.9s.1-4.4.1-6.8s.2-5 .3-7.7s.2-5.5.3-8.2s.2-5.7.3-8.4s.3-5.5.5-8.1s.4-5.2.6-7.9s.4-5.2.6-7.8s.5-5.2.8-7.8s.5-5.3.8-7.9s.5-5.2.8-7.8s.6-5.3.9-7.9s.7-5.2 1-7.9s.7-5.2 1-7.8s.7-5.3.9-7.9s.6-5.1.9-7.7s.4-5.2.6-7.8s.4-5.3.6-7.9s.3-5.2.5-7.8s.3-5 .4-7.4s.2-3.7.4-6.9s.4-9.6.6-12.6s.1-3.1.2-5.7s.2-6.6.3-9.7s.4-6.4.4-9.2s.1-4.9-.1-7.5s-.5-5.4-.9-7.5s-.5-2.5-1.6-4.8s-4-7.4-4.8-8.9" fill="none" stroke="url(#whLp-10)" stroke-width="12.6" stroke-opacity=".13" stroke-linecap="round" stroke-linejoin="round"/><path d="M25 341c-.8-.5-3.9-1.7-4.8-2.8s-1.2-1.5-.6-3.8s3.3-7.3 4.3-9.9s1-3.8 1.3-5.9s.1-4.4.2-6.8s.1-5 .2-7.7s.2-5.5.3-8.2s.2-5.7.3-8.4s.3-5.5.5-8.1s.4-5.2.6-7.9s.4-5.2.7-7.8s.5-5.2.7-7.8s.6-5.3.8-7.9s.6-5.2.9-7.8s.5-5.3.8-7.9s.7-5.2 1-7.9s.7-5.2 1-7.8s.7-5.3 1-7.9s.5-5.1.8-7.7s.4-5.2.6-7.8s.4-5.3.6-7.9s.3-5.2.5-7.8s.3-5 .4-7.4s.2-3.7.4-6.9s.4-9.6.6-12.6s.1-3.1.2-5.7s.2-6.6.3-9.7s.4-6.4.4-9.2s.1-4.9-.1-7.5s-.5-5.4-.9-7.5s-.5-2.5-1.5-4.8s-4.1-7.4-4.9-8.9" fill="none" stroke="url(#whLp-10)" stroke-width="6.2" stroke-opacity=".16" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.6 341c-.7-.5-3.8-1.7-4.7-2.8s-1.2-1.5-.6-3.8s3.3-7.3 4.2-9.9s1.1-3.8 1.4-5.9s.1-4.4.1-6.8s.2-5 .3-7.7s.2-5.5.3-8.2s.2-5.7.3-8.4s.3-5.5.5-8.1s.4-5.2.6-7.9s.4-5.2.6-7.8s.5-5.2.8-7.8s.5-5.3.8-7.9s.5-5.2.8-7.8s.6-5.3.9-7.9s.7-5.2 1-7.9s.7-5.2 1-7.8s.7-5.3.9-7.9s.6-5.1.9-7.7s.4-5.2.6-7.8s.4-5.3.6-7.9s.3-5.2.5-7.8s.3-5 .4-7.4s.2-3.7.4-6.9s.4-9.6.6-12.6s.1-3.1.2-5.7s.2-6.6.3-9.7s.4-6.4.4-9.2s.1-4.9-.1-7.5s-.5-5.4-.9-7.5s-.5-2.5-1.6-4.8s-4-7.4-4.8-8.9" fill="none" stroke="#dc9d7e" stroke-width="3.1" stroke-opacity=".14" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="51.1" cy="82" rx="23.8" ry="30.8" transform="rotate(-6 51.1 82)" fill="url(#whLp-9)" fill-opacity=".4"/><ellipse cx="46.9" cy="76.4" rx="11.2" ry="16.8" transform="rotate(-8 46.9 76.4)" fill="url(#whLp-9)" fill-opacity=".3"/><ellipse cx="73.2" cy="89" rx="11.2" ry="23.8" transform="rotate(-4 73.2 89)" fill="url(#whLp-b)" fill-opacity=".2"/><ellipse cx="79.4" cy="126.2" rx="5" ry="6.2" fill="url(#whLp-9)" fill-opacity=".16"/><ellipse cx="81.3" cy="133.1" rx="4.2" ry="5" fill="url(#whLp-b)" fill-opacity=".1"/><path d="M46.9 120.3c1.2.2 6.1.9 7.3 1" fill="none" stroke="#c47f62" stroke-width=".6" stroke-opacity=".1" stroke-linecap="round" stroke-linejoin="round"/><path d="M59 121.6c1.1-.1 5.3-.6 6.4-.7" fill="none" stroke="#c47f62" stroke-width=".6" stroke-opacity=".1" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="36" cy="276.6" rx="10.5" ry="36.4" transform="rotate(3 36 276.6)" fill="url(#whLp-9)" fill-opacity=".28"/><ellipse cx="38.2" cy="187" rx="7.7" ry="30.8" transform="rotate(2 38.2 187)" fill="url(#whLp-9)" fill-opacity=".14"/><ellipse cx="70.3" cy="265.4" rx="9.8" ry="47.6" transform="rotate(-3 70.3 265.4)" fill="url(#whLp-b)" fill-opacity=".1"/><ellipse cx="34.6" cy="54.5" rx="10.1" ry="5" transform="rotate(-12.1 34.6 54.5)" fill="url(#whLp-a)" fill-opacity=".2"/><ellipse cx="50.2" cy="51.2" rx="10.1" ry="5" transform="rotate(-1.5 50.2 51.2)" fill="url(#whLp-a)" fill-opacity=".2"/><ellipse cx="65.6" cy="53.7" rx="10.1" ry="5" transform="rotate(17.4 65.6 53.7)" fill="url(#whLp-a)" fill-opacity=".2"/><ellipse cx="79.8" cy="60.4" rx="10.1" ry="5" transform="rotate(25.4 79.8 60.4)" fill="url(#whLp-a)" fill-opacity=".2"/><ellipse cx="43.2" cy="52" rx="1.8" ry="4.2" transform="rotate(-12.1 43.2 52)" fill="url(#whLp-b)" fill-opacity=".08"/><ellipse cx="58.8" cy="51.6" rx="1.8" ry="4.2" transform="rotate(9.3 58.8 51.6)" fill="url(#whLp-b)" fill-opacity=".08"/><ellipse cx="73.5" cy="56.2" rx="1.8" ry="4.2" transform="rotate(25.4 73.5 56.2)" fill="url(#whLp-b)" fill-opacity=".08"/><path d="M33.4 52.2c.3.1 1.3 1.1 2 1.1s1.7-1 2-1.1" fill="none" stroke="#c47f62" stroke-width=".7" stroke-opacity=".28" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="35.4" cy="52.9" rx="8.4" ry="6.7" fill="url(#whLp-c)" fill-opacity=".16"/><ellipse cx="49.3" cy="50.1" rx="8" ry="5.9" transform="rotate(-6 49.3 50.1)" fill="url(#whLp-a)" fill-opacity=".3"/><ellipse cx="51.1" cy="50.1" rx="8.7" ry="6.2" fill="url(#whLp-c)" fill-opacity=".16"/><ellipse cx="64.8" cy="52.6" rx="7.7" ry="5.7" transform="rotate(-6 64.8 52.6)" fill="url(#whLp-a)" fill-opacity=".3"/><ellipse cx="66.5" cy="52.6" rx="8.3" ry="6" fill="url(#whLp-c)" fill-opacity=".16"/><ellipse cx="79.1" cy="59.3" rx="6.8" ry="5" transform="rotate(-6 79.1 59.3)" fill="url(#whLp-a)" fill-opacity=".3"/><ellipse cx="80.6" cy="59.3" rx="7.4" ry="5.3" fill="url(#whLp-c)" fill-opacity=".16"/></g><path d="M14.8 323.1c.3.7.5-.9 1.8-1.5s3.1-1.4 5.7-2.1s6.8-1.5 10-2.3s6.2-1.8 9.2-2.5s6.2-1.3 9.1-1.6s5.7 0 8.5.2s5.5.7 8.1.9s5.6.5 7.8.8s2.7.3 5.2.8s6.8 1.6 9.6 2.3s5.4 1.6 7.1 2.2s2 .9 2.8 1.4s1.6 2.3 1.9 1.6s.3-4.6 0-5.8s-1.1-1.2-1.9-1.7s-1.2-.8-2.8-1.3s-4.3-1.5-7.1-2.2s-7.1-1.8-9.6-2.4s-3.1-.5-5.2-.8s-5.1-.5-7.8-.7s-5.9-.8-8.1-1s-3.2-.4-5.6-.3s-6.4.6-8.9 1s-4.1 1-6.2 1.5s-3.4 1-6.1 1.7s-7.4 1.6-10 2.3s-4.5 1.5-5.7 2.1s-1.5.2-1.8 1.5s-.3 5.1 0 5.9z" fill="#b87253" fill-opacity=".12"/><use href="#whLp-6" fill="none" stroke="#2d6142" stroke-width="1.3" stroke-opacity=".9"/><use href="#whLp-6" fill="url(#whLp-14)"/><g clip-path="url(#whLp-11)"><path d="M13 324.2c.3-.3.6-.9 1.9-1.5s3.2-1.4 5.9-2.1s7.7-1.6 10.4-2.3s4.3-1.2 6.4-1.7s3.8-1 6.4-1.5s6.8-.9 9.3-1s3.4.1 5.8.3s5.7.7 8.5 1s5.8.5 8.1.7s2.9.3 5.4.8s7.1 1.6 10 2.4s5.7 1.6 7.4 2.2s2.1.8 2.9 1.3s1.7 1.4 2 1.7" fill="none" stroke="#95d0aa" stroke-width="2.5" stroke-opacity=".2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.9 328.1c.3-.3.5-.9 1.8-1.5s3.2-1.4 5.9-2.1s7.4-1.6 10.2-2.3s4.1-1.1 6.2-1.7s3.8-1 6.3-1.4s6.6-.9 9.1-1.1s3.3.1 5.7.3s5.6.7 8.3 1s5.7.5 7.9.7s2.8.3 5.4.9s6.9 1.5 9.7 2.3s5.6 1.6 7.3 2.2s2.1.9 2.9 1.4s1.6 1.3 1.9 1.6" fill="none" stroke="#3f8259" stroke-width=".6" stroke-dasharray="1.6 1.3" stroke-opacity=".8"/><path d="M13.9 330.6c.3-.2.5-.9 1.8-1.5s3.2-1.3 5.9-2.1s7.4-1.6 10.2-2.3s4.1-1.1 6.2-1.6s3.8-1.1 6.3-1.5s6.6-.9 9.1-1s3.3 0 5.7.2s5.6.7 8.3 1s5.7.5 7.9.8s2.8.3 5.4.8s6.9 1.6 9.7 2.3s5.6 1.6 7.3 2.2s2.1.9 2.9 1.4s1.6 1.3 1.9 1.6" fill="none" stroke="#3f8259" stroke-width=".6" stroke-dasharray="1.6 1.3" stroke-opacity=".7"/><path d="M14.3 332.9c.3-.3.6-.9 1.9-1.5s3.1-1.4 5.7-2.1s7.4-1.7 10.2-2.3s4-1.2 6.1-1.7s3.7-1.1 6.3-1.5s6.5-.9 8.9-1s3.4.1 5.7.3s5.5.7 8.2.9s5.7.5 7.8.8s2.8.3 5.3.8s6.9 1.6 9.7 2.3s5.5 1.6 7.2 2.2s2 .9 2.8 1.4s1.6 1.4 2 1.6" fill="none" stroke="#2f6644" stroke-width="2.2" stroke-opacity=".12" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="36.4" cy="344.5" rx="20.3" ry="6.2" transform="rotate(31.1 36.4 344.5)" fill="url(#whLp-12)" fill-opacity=".6"/><ellipse cx="40.1" cy="338.4" rx="17.9" ry="4.9" transform="rotate(31.1 40.1 338.4)" fill="url(#whLp-13)" fill-opacity=".57"/><ellipse cx="83.2" cy="354.3" rx="19" ry="5.6" transform="rotate(-28.5 83.2 354.3)" fill="url(#whLp-12)" fill-opacity=".5"/><ellipse cx="80.1" cy="348.6" rx="16.8" ry="4.5" transform="rotate(-28.5 80.1 348.6)" fill="url(#whLp-13)" fill-opacity=".475"/></g></svg>'},
    pinch:{w:139,h:517,grip:[22.8,27],wrist:[65.7,96.9],
      svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 139 517" width="139" height="517"><g class="wh-shadow" fill="#3a2410"><path fill-opacity=".035" d="M44 2.8c3.3-.5.8-.7 1.9.1s3.9 3.3 4.9 4.9s.4 4.2 1.4 4.7s2.8-1.6 4.4-1.9s3.6-.4 5.2-.1s3.1.9 4.3 1.9s1.7 3.6 3 4.1s2.9-1.5 4.8-1.5s4.9.4 6.6 1.2s2.9 2.2 3.5 4s-.3 6 .3 6.9s1.7-1.3 3-1.4s3.4-.1 4.7.3s2.2.8 3.1 1.7s1.6 1.5 2.5 3.7s1.1 2.7 2.3 9.9s3.7 22.9 4.9 33.5s1.5 24.1 2.1 30.1s1.1-6.3 1.6 6s.2 43 1.4 68.3s4.7 63.4 5.9 83.2s0 29.2 1.4 35.8s5.6 3 7.2 4.2s1.9 1.7 2.6 2.8s1.7 1.1 1.4 4s-3.2 9.4-3.4 13.4s1.2 1.2 2 10.9s1 26.3 2.5 47.3s5.1 58.7 6.5 78.5s1.6 27.4 1.6 40.3s0 26.4-1.2 36.7s-2.7 18.1-5.8 25s-7.5 11.6-12.9 15.9s-12.7 7.6-19.4 9.7s-13.5 3.1-20.8 3.1s-16.3-1-23.4-3.1s-13.6-5.2-19-9.6s-10.2-9-13.4-16.5s-4.7-18.3-5.8-28.7s-1-22.1-.8-34.2s.3-19.1 1.6-38.4s4.8-54.8 6.5-77.3s3.5-45.7 3.7-57.9s-2.5-11.8-2.6-15.1s.6-3.4 1.9-5s4.5 4.1 5.9-4.6s.5-26.5 2.3-47.3s6.5-54.2 8.4-77.3s2.8-48.8 3-61.5s-.9-10.9-1.6-14.5s.1-2-2.9-6.7s-9.8-14.9-15.3-21.1s-14-12.6-17.5-16.1s-2.3-2.8-3.1-4.9s-1.7-5.7-1.8-8s.4-4.1 1-5.8s1.6-2.8 3-4.5s3.9-4.4 5.6-5.6s4.2-.7 5-1.7s-.6-2.4-.4-4.7s1.2-7.2 1.7-9.1s.5-1.7 1.7-2.6s1.6-1.5 5.4-2.4s14.2-2.5 17.4-3zM33.8 24.7c-.7-2-1.3 2.2-2.3 3.1s-3.4.8-3.8 2.4s1.3 5.1 1.5 7s-1.6 3-.8 4.3s4.5 3.7 5.8 3.4s1.9-1.7 1.8-5.1s-1.4-13.1-2.2-15.1z"/><path fill-opacity=".05" d="M44.1 2.8c3.1-.4.4-.6 1.4.2s3.7 3.2 4.7 4.8s.5 4.8 1.5 5.3s3-2 4.7-2.4s3.5-.4 5.1-.1s2.9.9 4.1 2s1.8 3.7 3.1 4.1s2.8-1.4 4.4-1.6s3.3-.4 5 .4s4.3 2.3 5.2 4.3s-.4 6.8.2 7.8s2.2-1.5 3.4-1.8s2.7-.3 3.9 0s2.5.8 3.5 1.7s1.8 1.2 2.5 3.7s1.3.1 2.1 11.6s2 46.6 2.8 57.7s1.4-4.1 1.9 8.7s.2 43.1 1.4 68.3s4.7 63.1 5.9 83.2s-.1 30.6 1.4 37.5s5.9 2.4 7.8 3.9s3.4 2.3 3.4 5.4s-3.3 9.1-3.5 13.1s1.3 1.4 2.1 11.2s1.1 26.6 2.6 47.5s5 58.5 6.4 78.2s1.6 27.7 1.6 40.4s0 25.8-1.1 35.8s-2.7 17.8-5.6 24.4s-7.1 11-12.2 15s-11.9 7.1-18.3 9.1s-13.3 3-20.4 3s-15.6-1-22.3-3s-12.8-4.9-17.9-9s-9.7-8.3-12.7-15.6s-4.5-17.5-5.6-27.8s-1-21.9-.8-33.9s.3-18.9 1.6-38.1s5-55.7 6.5-77.1s1.9-41.1 2.5-50.8s1.6-4.1 1.3-7.9s-2.5-11.5-2.7-14.5s.3-2.5 1.6-3.9s4.8 4.5 6.2-4.3s.5-27.7 2.3-48.7s6.4-53.8 8.4-77.1s2.8-49.4 3-62.3s-.8-11-1.7-14.7s-.1-3-3.2-7.7s-10.1-14.8-15.6-20.7s-14-11.5-17.4-14.8s-2.3-2.5-3.1-4.5s-1.6-5-1.7-7.1s.3-3.7.9-5.4s1.7-2.9 3.1-4.6s3.5-4.1 5.3-5.3s4.6-.7 5.4-1.8s-.8-2.3-.6-4.6s1.1-7.3 1.7-9.2s.5-1.7 1.6-2.5s1.4-1.5 5.2-2.4s14.5-2.6 17.7-3.1zM33.6 23.2c-.8-2-1.4 2.8-2.5 3.9s-3.8 1-4.3 2.5s1.4 5 1.4 6.9s-2 3.3-1.1 4.8s5.3 4.5 6.8 4.2s2.4-2.4 2.3-6.2s-1.7-14-2.6-16.1z"/><path fill-opacity=".075" d="M43.8 3c3.2-.5.4-.6 1.3.2s3.5 2.7 4.5 4.5s.4 5.7 1.4 6.3s2.8-2.4 4.5-2.9s3.6-.7 5.2-.4s3.5 1 4.7 2.2s1.4 4.3 2.7 4.7s3.4-2 5-2.4s3.1 0 4.4.4s2.6 1.2 3.5 1.9s1.5.6 1.8 2.5s-.6 7.5 0 8.5s2-1.9 3.2-2.3s2.9-.5 4.1-.3s2.6.6 3.6 1.5s1.9 1.6 2.6 3.8s1.3-1.5 1.6 9.8s-.4 46.8-.1 58s1.4-4.2 1.9 8.7s.2 43.3 1.5 68.5s4.6 62.6 5.8 83s-.2 31.9 1.5 39.1s6.6 2.7 8.5 3.9s2.8.9 2.6 3.7s-3.3 9-3.6 13.1s1.4 1.7 2.2 11.6s1.1 26.6 2.6 47.5s5 58.2 6.4 77.9s1.6 27.7 1.7 40.3s-.1 25.5-1.2 35.4s-2.6 17.5-5.4 23.9s-6.9 10.5-11.8 14.3s-11.2 6.7-17.4 8.6s-12.9 2.9-19.8 2.9s-15.1-1-21.5-2.9s-12.3-4.7-17.2-8.5s-9.1-7.7-12-14.7s-4.4-17-5.5-27.2s-1-21.5-.8-33.5s.3-19.1 1.7-38.3s4.9-55.5 6.4-76.8s1.9-41 2.5-50.9s1.6-4.4 1.4-8.2s-2.6-11.5-2.8-14.5s.7-2.1 2-3.3s4.5 5.4 5.8-3.4s.5-28.7 2.3-49.8s6.5-53.7 8.4-77.1s2.8-50 3.1-63s-.9-10.9-1.8-14.8s-1.3-4.8-3.6-8.5s-7.3-10.5-9.9-13.9s-2-3-5.9-6.3s-13.8-10.7-17.2-13.7s-2.2-2.3-3-4.1s-1.7-4.7-1.8-6.7s.3-3.6 1-5.2s1.5-2.7 2.9-4.3s3.5-4.2 5.4-5.3s4.9-.5 5.7-1.6s-1.1-2.6-.9-4.9s1.1-7.3 1.7-9.3s.6-1.6 1.6-2.4s.4-1.2 4.2-2s15-2.8 18.3-3.3zM33.5 21.4c-.9-2.2-1.1 3.4-2.4 4.6s-4.5 1.2-5.1 2.9s1.5 5.3 1.5 7.3s-2.7 2.9-1.7 4.6s6.2 5.6 7.9 5.3s2.7-2.9 2.7-7.1s-2.1-15.4-2.9-17.6z"/></g><defs><path id="whLn-0" d="M26.7 42c1.8 1.2 5.5 3.5 7.9 5.3s4.9 4.4 6.2 5.8s1.2 1.7 1.5 2.8s.3 2.2.2 3.4s-.7 2.4-1.3 3.4s-1.5 2.2-2.4 3.1s-2.1 1.6-3.2 2.1s-2.5.9-3.6.9s-2.4 0-3.4-.4s-1.8-1-2.6-1.8s-1.3-2-2.1-2.9s-1.1-1.1-2.9-2.5s-6.2-4.5-8-5.9s-2-1.5-3-2.3s-2-1.6-3-2.6s-2-2.1-2.7-3.7s-1.4-3.9-1.4-5.7s.7-3.8 1.3-5.3s.8-1.6 2.2-3.1s4.9-4.7 6.3-5.9s1.4-.9 2.1-1.2s1.5-.5 2.3-.6s1.6-.1 2.4 0s1.5.4 2.2.7s1.4.7 2 1.2s1.1 1 1.5 1.7s.9 1.3 1.1 2s.4 1.5.5 2.3s0 1.6-.1 2.4s-.3 1.5-.7 2.3s-2 2-1.9 2.8s.9.5 2.6 1.7z"/><path id="whLn-1" d="M27.3 318.1c-12.3-3.8-.1-12.2.2-22.4s.6-26.2 1.5-39.2s2.3-26.2 3.6-39.2s3.5-26.4 4.7-39.2s1.9-26.9 2.5-37.8s.8-21 1.1-28s.6-9.6.4-14s.2-8.1-1.7-12.6s-6.5-10.4-9.3-14.6s-7.2-7.8-7.6-10.6s3.3-4.4 4.8-6.7s3-4.4 4.4-7.1s3.5-6.4 4-9.5s-2.5-7.1-1.3-9.4s5.7-4.3 8.4-4.2s6.1 4.8 7.8 4.9s1.3-3.3 2.7-4s3.8-.2 5.6-.2s4-.3 5.3.3s1.6 2.7 2.4 3.1s1.3-.5 2.6-.7s3.5-.2 5.2-.1s3.8-1.1 5 .2s1.3 6.4 2.2 7.5s1.9-.7 3.5-.9s4-.4 5.9.1s4.7-1.7 5.2 2.7s-1.7 16.7-2.4 24s-1.5 13.5-2 19.6s-1 12.8-1 16.8s.8 4.2.9 7s-.1 3.9 0 9.8s.1 14.7.4 25.2s.7 24.9 1.4 37.8s1.6 26.1 2.5 39.2s2.2 26.1 2.9 39.2s1.2 28.7 1.6 39.2s12.7 19.8.5 23.8s-61.7 3.7-73.9 0z"/><path id="whLn-2" d="M81.2 38.9c.2-1.8.9-7.1 1.2-8.7s.2-1 .4-1.5s.6-.8.9-1.2s.8-.6 1.2-.9s1-.5 1.6-.6s.8-.3 1.7-.3s2.7.4 3.5.7s1.1.5 1.5.8s.9.7 1.2 1.1s.7.8.9 1.3s.3.9.4 1.4s.3-.2 0 1.5s-1.5 6.9-1.9 8.6s-.4 1.1-.8 1.6s-1 .9-1.6 1.2s-1.4.5-2.2.5s-1.7.1-2.5 0s-1.6-.5-2.3-.8s-1.4-.8-1.9-1.3s-.9-1.1-1.1-1.7s-.4 0-.2-1.7z"/><path id="whLn-3" d="M65.8 32.7c0-2.3.2-9 .4-11.2s.1-1.3.4-1.9s.5-1.1.9-1.6s.9-.9 1.5-1.3s1.1-.7 1.8-.9s1.3-.4 2.1-.5s1.5-.2 2.3-.1s1.5.2 2.2.4s1.4.5 2 .9s1.2.7 1.7 1.2s.9.9 1.2 1.5s.5 1.1.7 1.7s.3-.2.1 1.9s-1 8.9-1.4 11.1s-.3 1.5-.8 2.1s-1.1 1.2-1.8 1.7s-1.7.8-2.7 1s-2.1.3-3.1.2s-2.1-.3-3-.7s-1.8-.8-2.5-1.4s-1.2-1.3-1.6-2s-.4.1-.4-2.1z"/><path id="whLn-4" d="M50 30.8c-.1-1.3-.1-3.3-.2-5.4s-.4-5.7-.4-7.2s.1-1.4.3-2.1s.6-1.2.9-1.8s.9-1.1 1.5-1.5s1.2-.9 1.9-1.2s1.4-.6 2.2-.7s1.7-.3 2.5-.3s1.7.1 2.5.3s1.5.4 2.2.7s1.3.7 1.9 1.2s1 1 1.4 1.5s.7 1.2.9 1.8s.3.5.3 2.1s-.2 5.1-.3 7.2s-.1 4.1-.2 5.4s-.3 1.6-.7 2.3s-1.1 1.4-1.9 2s-1.8 1-2.8 1.3s-2.2.5-3.3.5s-2.3-.2-3.3-.5s-2.1-.8-2.9-1.3s-1.4-1.3-1.8-2s-.6-1-.7-2.3z"/><path id="whLn-5" d="M35.3 14.6c-.6 2-2.5 7.9-3.3 9.8s-.7 1.2-1.2 1.7s-1 .9-1.6 1.2s-1.2.7-1.8.8s-1.3.3-2 .3s-1.3 0-1.9-.2s-1.3-.4-1.9-.8s-1.1-.7-1.5-1.2s-.9-1.1-1.2-1.6s-.6-1.3-.7-1.9s-.3-1.4-.3-2.1s0-.3.3-2s1.3-6.4 1.8-8.1s.6-1.6 1.2-2.2s1.4-1.2 2.2-1.5s1.9-.7 2.8-.7s2.1 0 3.1.3s2 .7 2.8 1.3s1.6 1.2 2.1 2s1 1.6 1.1 2.4s.6.4 0 2.5z"/><path id="whLn-6" d="M20.2 19.7c-.3-.3-1.5-.5-1.6-2.2s.5-6 1.3-7.7s2.5-2.1 3.4-2.7s1-.4 2.1-.7s1.8-.4 4.2-.7s7.4-.9 9.6-1.2s2.5-.5 3.5-.5s1.7 0 2.5.2s1.6.8 2.3 1.5s1.3 1.4 1.7 2.3s.8 1.9.9 2.9s.1 2.1-.1 3.1s-.5 2-1 2.7s-1.1 1.5-1.8 2s-.1.6-2.3 1s-8.6 1.1-10.7 1.4s-1.1.1-2.3.3s-4.2.9-5.4 1.1s-1.4-.1-2-.2s-1.3-.3-1.8-.6s-1.1-.6-1.6-1s-.9-1.1-1.1-1.3s.4.6.2.3z"/><path id="whLn-7" d="M32.7 14.6c-.2-.6-.4-1.4-.5-2.1s-.2-1.5-.1-2.2s.2-1.3.5-1.9s.5-1.2.9-1.8s1.4-1.3 1.4-1.3s-1.5 1.5-1.7 1.7s0-.2.4-.7s.1-1.6 2-2.2s6.8-1.9 9.2-1.2s3.9 3.7 4.8 5s.6 1.4.8 2.7s.3 2.2.5 5s.2 8.8.4 11.8s.3 5 .4 6.3s.1.7.1 1.2s-.2 1.6-.5 2.3s-1 1.5-1.7 2.1s-1.7 1.1-2.6 1.4s-2.1.6-3.2.7s-2.2 0-3.2-.2s-2.1-.6-2.8-1.1s-1.5-1.1-2-1.8s-.6-.5-.8-2.2s-.4-5.5-.5-7.7s-.3-3.6-.5-5.7s-.4-5.6-.6-6.9s-.4-.7-.7-1.2z"/><path id="whLn-8" d="M20.6 299.3c2.7-3.4 12-4.2 18.3-5.9s12.9-3.5 19-4s11.7.5 17.3 1.1s10.5.7 16.4 2.2s16.7 3.4 19.4 6.9s-2.8 6.1-2.8 14.3s2.2-4.5 3.3 35s18.8 168 3 201.6s-82 33.6-97.7 0s2.4-162.2 3.4-201.6s2.3-26.8 2.4-35s-4.7-11.2-2-14.6z"/><path id="whLn-9" d="M26.7 42c1.8 1.2 5.5 3.5 7.9 5.3s4.9 4.4 6.2 5.8s1.2 1.7 1.5 2.8s.3 2.2.2 3.4s-.7 2.4-1.3 3.4s-1.5 2.2-2.4 3.1s-2.1 1.6-3.2 2.1s-2.5.9-3.6.9s-2.4 0-3.4-.4s-1.8-1-2.6-1.8s-1.3-2-2.1-2.9s-1.1-1.1-2.9-2.5s-6.2-4.5-8-5.9s-2-1.5-3-2.3s-2-1.6-3-2.6s-2-2.1-2.7-3.7s-1.4-3.9-1.4-5.7s.7-3.8 1.3-5.3s.8-1.6 2.2-3.1s4.9-4.7 6.3-5.9s1.4-.9 2.1-1.2s1.5-.5 2.3-.6s1.6-.1 2.4 0s1.5.4 2.2.7s1.4.7 2 1.2s1.1 1 1.5 1.7s.9 1.3 1.1 2s.4 1.5.5 2.3s0 1.6-.1 2.4s-.3 1.5-.7 2.3s-2 2-1.9 2.8s.9.5 2.6 1.7zM27.3 318.1c-12.3-3.8-.1-12.2.2-22.4s.6-26.2 1.5-39.2s2.3-26.2 3.6-39.2s3.5-26.4 4.7-39.2s1.9-26.9 2.5-37.8s.8-21 1.1-28s.6-9.6.4-14s.2-8.1-1.7-12.6s-6.5-10.4-9.3-14.6s-7.2-7.8-7.6-10.6s3.3-4.4 4.8-6.7s3-4.4 4.4-7.1s3.5-6.4 4-9.5s-2.5-7.1-1.3-9.4s5.7-4.3 8.4-4.2s6.1 4.8 7.8 4.9s1.3-3.3 2.7-4s3.8-.2 5.6-.2s4-.3 5.3.3s1.6 2.7 2.4 3.1s1.3-.5 2.6-.7s3.5-.2 5.2-.1s3.8-1.1 5 .2s1.3 6.4 2.2 7.5s1.9-.7 3.5-.9s4-.4 5.9.1s4.7-1.7 5.2 2.7s-1.7 16.7-2.4 24s-1.5 13.5-2 19.6s-1 12.8-1 16.8s.8 4.2.9 7s-.1 3.9 0 9.8s.1 14.7.4 25.2s.7 24.9 1.4 37.8s1.6 26.1 2.5 39.2s2.2 26.1 2.9 39.2s1.2 28.7 1.6 39.2s12.7 19.8.5 23.8s-61.7 3.7-73.9 0zM81.2 38.9c.2-1.8.9-7.1 1.2-8.7s.2-1 .4-1.5s.6-.8.9-1.2s.8-.6 1.2-.9s1-.5 1.6-.6s.8-.3 1.7-.3s2.7.4 3.5.7s1.1.5 1.5.8s.9.7 1.2 1.1s.7.8.9 1.3s.3.9.4 1.4s.3-.2 0 1.5s-1.5 6.9-1.9 8.6s-.4 1.1-.8 1.6s-1 .9-1.6 1.2s-1.4.5-2.2.5s-1.7.1-2.5 0s-1.6-.5-2.3-.8s-1.4-.8-1.9-1.3s-.9-1.1-1.1-1.7s-.4 0-.2-1.7zM65.8 32.7c0-2.3.2-9 .4-11.2s.1-1.3.4-1.9s.5-1.1.9-1.6s.9-.9 1.5-1.3s1.1-.7 1.8-.9s1.3-.4 2.1-.5s1.5-.2 2.3-.1s1.5.2 2.2.4s1.4.5 2 .9s1.2.7 1.7 1.2s.9.9 1.2 1.5s.5 1.1.7 1.7s.3-.2.1 1.9s-1 8.9-1.4 11.1s-.3 1.5-.8 2.1s-1.1 1.2-1.8 1.7s-1.7.8-2.7 1s-2.1.3-3.1.2s-2.1-.3-3-.7s-1.8-.8-2.5-1.4s-1.2-1.3-1.6-2s-.4.1-.4-2.1zM50 30.8c-.1-1.3-.1-3.3-.2-5.4s-.4-5.7-.4-7.2s.1-1.4.3-2.1s.6-1.2.9-1.8s.9-1.1 1.5-1.5s1.2-.9 1.9-1.2s1.4-.6 2.2-.7s1.7-.3 2.5-.3s1.7.1 2.5.3s1.5.4 2.2.7s1.3.7 1.9 1.2s1 1 1.4 1.5s.7 1.2.9 1.8s.3.5.3 2.1s-.2 5.1-.3 7.2s-.1 4.1-.2 5.4s-.3 1.6-.7 2.3s-1.1 1.4-1.9 2s-1.8 1-2.8 1.3s-2.2.5-3.3.5s-2.3-.2-3.3-.5s-2.1-.8-2.9-1.3s-1.4-1.3-1.8-2s-.6-1-.7-2.3zM35.3 14.6c-.6 2-2.5 7.9-3.3 9.8s-.7 1.2-1.2 1.7s-1 .9-1.6 1.2s-1.2.7-1.8.8s-1.3.3-2 .3s-1.3 0-1.9-.2s-1.3-.4-1.9-.8s-1.1-.7-1.5-1.2s-.9-1.1-1.2-1.6s-.6-1.3-.7-1.9s-.3-1.4-.3-2.1s0-.3.3-2s1.3-6.4 1.8-8.1s.6-1.6 1.2-2.2s1.4-1.2 2.2-1.5s1.9-.7 2.8-.7s2.1 0 3.1.3s2 .7 2.8 1.3s1.6 1.2 2.1 2s1 1.6 1.1 2.4s.6.4 0 2.5zM20.2 19.7c-.3-.3-1.5-.5-1.6-2.2s.5-6 1.3-7.7s2.5-2.1 3.4-2.7s1-.4 2.1-.7s1.8-.4 4.2-.7s7.4-.9 9.6-1.2s2.5-.5 3.5-.5s1.7 0 2.5.2s1.6.8 2.3 1.5s1.3 1.4 1.7 2.3s.8 1.9.9 2.9s.1 2.1-.1 3.1s-.5 2-1 2.7s-1.1 1.5-1.8 2s-.1.6-2.3 1s-8.6 1.1-10.7 1.4s-1.1.1-2.3.3s-4.2.9-5.4 1.1s-1.4-.1-2-.2s-1.3-.3-1.8-.6s-1.1-.6-1.6-1s-.9-1.1-1.1-1.3s.4.6.2.3zM32.7 14.6c-.2-.6-.4-1.4-.5-2.1s-.2-1.5-.1-2.2s.2-1.3.5-1.9s.5-1.2.9-1.8s1.4-1.3 1.4-1.3s-1.5 1.5-1.7 1.7s0-.2.4-.7s.1-1.6 2-2.2s6.8-1.9 9.2-1.2s3.9 3.7 4.8 5s.6 1.4.8 2.7s.3 2.2.5 5s.2 8.8.4 11.8s.3 5 .4 6.3s.1.7.1 1.2s-.2 1.6-.5 2.3s-1 1.5-1.7 2.1s-1.7 1.1-2.6 1.4s-2.1.6-3.2.7s-2.2 0-3.2-.2s-2.1-.6-2.8-1.1s-1.5-1.1-2-1.8s-.6-.5-.8-2.2s-.4-5.5-.5-7.7s-.3-3.6-.5-5.7s-.4-5.6-.6-6.9s-.4-.7-.7-1.2z"/><clipPath id="whLn-a"><use href="#whLn-9"/></clipPath><radialGradient id="whLn-b"><stop offset="0" stop-color="#fff2e6" stop-opacity=".8"/><stop offset=".5" stop-color="#fff2e6" stop-opacity=".3"/><stop offset="1" stop-color="#fff2e6" stop-opacity="0"/></radialGradient><radialGradient id="whLn-c"><stop offset="0" stop-color="#fbd9bf" stop-opacity=".85"/><stop offset=".55" stop-color="#fbd9bf" stop-opacity=".32"/><stop offset="1" stop-color="#fbd9bf" stop-opacity="0"/></radialGradient><radialGradient id="whLn-d"><stop offset="0" stop-color="#b87253" stop-opacity=".6"/><stop offset=".55" stop-color="#b87253" stop-opacity=".2"/><stop offset="1" stop-color="#b87253" stop-opacity="0"/></radialGradient><radialGradient id="whLn-e"><stop offset="0" stop-color="#ee8a78" stop-opacity=".55"/><stop offset=".55" stop-color="#ee8a78" stop-opacity=".2"/><stop offset="1" stop-color="#ee8a78" stop-opacity="0"/></radialGradient><linearGradient id="whLn-f" gradientUnits="userSpaceOnUse" x1="10.1" y1="53.1" x2="21.7" y2="38.4"><stop offset="0" stop-color="#b87253"/><stop offset=".083" stop-color="#dc9d7e"/><stop offset=".417" stop-color="#f0c09d"/><stop offset=".646" stop-color="#f2c3a0"/><stop offset=".979" stop-color="#e1a686"/><stop offset="1" stop-color="#d49475"/></linearGradient><linearGradient id="whLn-g" gradientUnits="userSpaceOnUse" x1="33.4" y1="59.9" x2="22.6" y2="23.2"><stop offset="0" stop-color="#f2c3a0"/><stop offset=".212" stop-color="#f2c3a0"/><stop offset=".545" stop-color="#f2c3a0" stop-opacity="0"/><stop offset=".707" stop-color="#dc9d7e" stop-opacity="0"/><stop offset="1" stop-color="#dc9d7e" stop-opacity=".28"/></linearGradient><linearGradient id="whLn-h" gradientUnits="userSpaceOnUse" x1="14.7" y1="36.1" x2="21.7" y2="27.5"><stop offset="0" stop-color="#ebb7a5"/><stop offset=".35" stop-color="#f8d9cc"/><stop offset=".85" stop-color="#f8d9cc"/><stop offset="1" stop-color="#fdf0e8"/></linearGradient><clipPath id="whLn-i"><use href="#whLn-0"/></clipPath><clipPath id="whLn-j"><use href="#whLn-0"/></clipPath><linearGradient id="whLn-k" gradientUnits="userSpaceOnUse" x1="81.9" y1="34" x2="94.8" y2="36.2"><stop offset="0" stop-color="#e3aa89"/><stop offset=".146" stop-color="#fce4d2"/><stop offset=".333" stop-color="#feefe2"/><stop offset=".563" stop-color="#f2c3a0"/><stop offset=".979" stop-color="#c27e5f"/><stop offset="1" stop-color="#c48162"/></linearGradient><linearGradient id="whLn-l" gradientUnits="userSpaceOnUse" x1="87.5" y1="40" x2="90" y2="25.9"><stop offset="0" stop-color="#f2c3a0"/><stop offset=".194" stop-color="#f2c3a0"/><stop offset=".452" stop-color="#f2c3a0" stop-opacity="0"/><stop offset=".505" stop-color="#dc9d7e" stop-opacity="0"/><stop offset="1" stop-color="#dc9d7e" stop-opacity=".58"/></linearGradient><clipPath id="whLn-m"><use href="#whLn-2"/></clipPath><clipPath id="whLn-n"><use href="#whLn-2"/></clipPath><linearGradient id="whLn-o" gradientUnits="userSpaceOnUse" x1="66" y1="27.5" x2="82.3" y2="28.7"><stop offset="0" stop-color="#e2a787"/><stop offset=".146" stop-color="#fbe1cc"/><stop offset=".313" stop-color="#fff1e5"/><stop offset=".667" stop-color="#edba98"/><stop offset=".979" stop-color="#c27e5f"/><stop offset="1" stop-color="#c48162"/></linearGradient><linearGradient id="whLn-p" gradientUnits="userSpaceOnUse" x1="73.8" y1="33.3" x2="75.2" y2="15.2"><stop offset="0" stop-color="#f2c3a0"/><stop offset=".143" stop-color="#f2c3a0"/><stop offset=".414" stop-color="#f2c3a0" stop-opacity="0"/><stop offset=".482" stop-color="#dc9d7e" stop-opacity="0"/><stop offset="1" stop-color="#dc9d7e" stop-opacity=".58"/></linearGradient><clipPath id="whLn-q"><use href="#whLn-3"/></clipPath><clipPath id="whLn-r"><use href="#whLn-3"/></clipPath><linearGradient id="whLn-s" gradientUnits="userSpaceOnUse" x1="49.8" y1="25.4" x2="67.6" y2="25.4"><stop offset="0" stop-color="#e0a484"/><stop offset=".146" stop-color="#fbddc7"/><stop offset=".333" stop-color="#fff1e5"/><stop offset=".688" stop-color="#edba98"/><stop offset=".938" stop-color="#c88667"/><stop offset="1" stop-color="#c48162"/></linearGradient><linearGradient id="whLn-t" gradientUnits="userSpaceOnUse" x1="58.7" y1="30.8" x2="58.7" y2="10.6"><stop offset="0" stop-color="#f2c3a0"/><stop offset=".123" stop-color="#f2c3a0"/><stop offset=".403" stop-color="#f2c3a0" stop-opacity="0"/><stop offset=".478" stop-color="#dc9d7e" stop-opacity="0"/><stop offset="1" stop-color="#dc9d7e" stop-opacity=".58"/></linearGradient><clipPath id="whLn-u"><use href="#whLn-4"/></clipPath><clipPath id="whLn-v"><use href="#whLn-0"/></clipPath><linearGradient id="whLn-w" gradientUnits="userSpaceOnUse" x1="34.6" y1="16.7" x2="19.6" y2="12.7"><stop offset="0" stop-color="#b87253"/><stop offset=".104" stop-color="#b87253"/><stop offset=".292" stop-color="#dd9f80"/><stop offset=".667" stop-color="#f0bf9c"/><stop offset=".979" stop-color="#f0c09d"/><stop offset="1" stop-color="#eab694"/></linearGradient><linearGradient id="whLn-x" gradientUnits="userSpaceOnUse" x1="27.6" y1="12.5" x2="23.5" y2="28.2"><stop offset="0" stop-color="#f2c3a0" stop-opacity="0"/><stop offset=".344" stop-color="#dc9d7e" stop-opacity="0"/><stop offset="1" stop-color="#dc9d7e" stop-opacity=".25"/></linearGradient><linearGradient id="whLn-y" gradientUnits="userSpaceOnUse" x1="25.5" y1="18.3" x2="23.3" y2="26.5"><stop offset="0" stop-color="#ebb7a5"/><stop offset=".35" stop-color="#f8d9cc"/><stop offset=".85" stop-color="#f8d9cc"/><stop offset="1" stop-color="#fdf0e8"/></linearGradient><clipPath id="whLn-z"><use href="#whLn-5"/></clipPath><path id="whLn-10" d="M35.3 14.6c-.6 2-2.5 7.9-3.3 9.8s-.7 1.2-1.2 1.7s-1 .9-1.6 1.2s-1.2.7-1.8.8s-1.3.3-2 .3s-1.3 0-1.9-.2s-1.3-.4-1.9-.8s-1.1-.7-1.5-1.2s-.9-1.1-1.2-1.6s-.6-1.3-.7-1.9s-.3-1.4-.3-2.1s0-.3.3-2s1.3-6.4 1.8-8.1s.6-1.6 1.2-2.2s1.4-1.2 2.2-1.5s1.9-.7 2.8-.7s2.1 0 3.1.3s2 .7 2.8 1.3s1.6 1.2 2.1 2s1 1.6 1.1 2.4s.6.4 0 2.5zM26.7 42c1.8 1.2 5.5 3.5 7.9 5.3s4.9 4.4 6.2 5.8s1.2 1.7 1.5 2.8s.3 2.2.2 3.4s-.7 2.4-1.3 3.4s-1.5 2.2-2.4 3.1s-2.1 1.6-3.2 2.1s-2.5.9-3.6.9s-2.4 0-3.4-.4s-1.8-1-2.6-1.8s-1.3-2-2.1-2.9s-1.1-1.1-2.9-2.5s-6.2-4.5-8-5.9s-2-1.5-3-2.3s-2-1.6-3-2.6s-2-2.1-2.7-3.7s-1.4-3.9-1.4-5.7s.7-3.8 1.3-5.3s.8-1.6 2.2-3.1s4.9-4.7 6.3-5.9s1.4-.9 2.1-1.2s1.5-.5 2.3-.6s1.6-.1 2.4 0s1.5.4 2.2.7s1.4.7 2 1.2s1.1 1 1.5 1.7s.9 1.3 1.1 2s.4 1.5.5 2.3s0 1.6-.1 2.4s-.3 1.5-.7 2.3s-2 2-1.9 2.8s.9.5 2.6 1.7z"/><clipPath id="whLn-11"><use href="#whLn-10"/></clipPath><linearGradient id="whLn-12" gradientUnits="userSpaceOnUse" x1="31.8" y1="21.4" x2="29.6" y2="5.7"><stop offset="0" stop-color="#b87253"/><stop offset=".417" stop-color="#f0bf9d"/><stop offset=".583" stop-color="#fde8d7"/><stop offset=".771" stop-color="#fff2e6"/><stop offset=".938" stop-color="#fbdec8"/><stop offset="1" stop-color="#ebb796"/></linearGradient><linearGradient id="whLn-13" gradientUnits="userSpaceOnUse" x1="43.8" y1="11.8" x2="23.8" y2="25.3"><stop offset="0" stop-color="#f2c3a0" stop-opacity="0"/><stop offset=".569" stop-color="#dc9d7e" stop-opacity="0"/><stop offset="1" stop-color="#dc9d7e" stop-opacity=".35"/></linearGradient><clipPath id="whLn-14"><use href="#whLn-6"/></clipPath><path id="whLn-15" d="M20.2 19.7c-.3-.3-1.5-.5-1.6-2.2s.5-6 1.3-7.7s2.5-2.1 3.4-2.7s1-.4 2.1-.7s1.8-.4 4.2-.7s7.4-.9 9.6-1.2s2.5-.5 3.5-.5s1.7 0 2.5.2s1.6.8 2.3 1.5s1.3 1.4 1.7 2.3s.8 1.9.9 2.9s.1 2.1-.1 3.1s-.5 2-1 2.7s-1.1 1.5-1.8 2s-.1.6-2.3 1s-8.6 1.1-10.7 1.4s-1.1.1-2.3.3s-4.2.9-5.4 1.1s-1.4-.1-2-.2s-1.3-.3-1.8-.6s-1.1-.6-1.6-1s-.9-1.1-1.1-1.3s.4.6.2.3zM50 30.8c-.1-1.3-.1-3.3-.2-5.4s-.4-5.7-.4-7.2s.1-1.4.3-2.1s.6-1.2.9-1.8s.9-1.1 1.5-1.5s1.2-.9 1.9-1.2s1.4-.6 2.2-.7s1.7-.3 2.5-.3s1.7.1 2.5.3s1.5.4 2.2.7s1.3.7 1.9 1.2s1 1 1.4 1.5s.7 1.2.9 1.8s.3.5.3 2.1s-.2 5.1-.3 7.2s-.1 4.1-.2 5.4s-.3 1.6-.7 2.3s-1.1 1.4-1.9 2s-1.8 1-2.8 1.3s-2.2.5-3.3.5s-2.3-.2-3.3-.5s-2.1-.8-2.9-1.3s-1.4-1.3-1.8-2s-.6-1-.7-2.3z"/><clipPath id="whLn-16"><use href="#whLn-15"/></clipPath><linearGradient id="whLn-17" gradientUnits="userSpaceOnUse" x1="33.5" y1="16.9" x2="50.9" y2="15.6"><stop offset="0" stop-color="#dfa283"/><stop offset=".146" stop-color="#f7d0b4"/><stop offset=".333" stop-color="#fde8d8"/><stop offset=".688" stop-color="#ebb695"/><stop offset=".917" stop-color="#cb8869"/><stop offset="1" stop-color="#c58162"/></linearGradient><linearGradient id="whLn-18" gradientUnits="userSpaceOnUse" x1="43.4" y1="35.5" x2="29.2" y2="7.4"><stop offset="0" stop-color="#f2c3a0"/><stop offset=".068" stop-color="#f2c3a0"/><stop offset=".389" stop-color="#f2c3a0" stop-opacity="0"/><stop offset=".73" stop-color="#dc9d7e" stop-opacity="0"/><stop offset="1" stop-color="#dc9d7e" stop-opacity=".35"/></linearGradient><clipPath id="whLn-19"><use href="#whLn-7"/></clipPath><linearGradient id="whLn-1a" gradientUnits="userSpaceOnUse" x1="65.7" y1="33" x2="65.7" y2="58.2"><stop offset="0" stop-color="#b87253" stop-opacity="0"/><stop offset="1" stop-color="#b87253"/></linearGradient><linearGradient id="whLn-1b" gradientUnits="userSpaceOnUse" x1="65.7" y1="77.3" x2="65.7" y2="99.7"><stop offset="0" stop-color="#f9d6bc" stop-opacity="0"/><stop offset="1" stop-color="#f9d6bc"/></linearGradient><clipPath id="whLn-1c"><use href="#whLn-8"/></clipPath><radialGradient id="whLn-1d"><stop offset="0" stop-color="#2f6644" stop-opacity=".5"/><stop offset=".6" stop-color="#2f6644" stop-opacity=".18"/><stop offset="1" stop-color="#2f6644" stop-opacity="0"/></radialGradient><radialGradient id="whLn-1e"><stop offset="0" stop-color="#95d0aa" stop-opacity=".42"/><stop offset=".6" stop-color="#95d0aa" stop-opacity=".14"/><stop offset="1" stop-color="#95d0aa" stop-opacity="0"/></radialGradient><linearGradient id="whLn-1f" gradientUnits="userSpaceOnUse" x1="18.2" y1="96.9" x2="113.1" y2="96.9"><stop offset="0" stop-color="#579f72"/><stop offset=".16" stop-color="#6db487"/><stop offset=".4" stop-color="#66ae81"/><stop offset=".62" stop-color="#5ca679"/><stop offset=".86" stop-color="#4d9266"/><stop offset="1" stop-color="#42825a"/></linearGradient></defs><path d="M20.6 299.3c0 .4.6-.9 1.9-1.5s3.2-1.4 5.9-2.1s7.7-1.6 10.5-2.3s4.2-1.1 6.3-1.7s3.8-1 6.4-1.4s6.8-.9 9.3-1.1s3.4.1 5.8.3s5.7.7 8.5 1s5.8.5 8.1.7s2.9.3 5.4.9s7.1 1.5 10 2.3s5.7 1.6 7.4 2.2s2.1.9 3 1.4s1.9 2 1.9 1.6s-1.1-3-1.9-4.1s-1.3-1.6-3-2.7s-5-3-7.4-4.2s-4.9-2-7.1-2.8s-3.8-1.3-5.6-1.7s-2.6-.6-5.4-1.1s-8.7-1.2-11-1.5s-1.4-.3-2.9-.4s-3.8-.3-5.8-.2s-4 .3-6.1.7s-4.2 1-6.4 1.6s-3.6 1.2-6.4 2.2s-7.2 2.7-10 4s-5.3 2.5-6.8 3.6s-2 1.4-2.7 2.4s-1.9 3.5-1.9 3.9z" fill="#1f482f"/><path d="M20.6 299.3c.3-.6 1.1-2.8 1.9-3.9s1.1-1.4 2.7-2.4s4-2.4 6.8-3.6s7.3-2.9 10-4s4.3-1.6 6.4-2.2s4.3-1.2 6.4-1.6s4.1-.6 6.1-.7s4.4.1 5.8.2s.5 0 2.9.4s8.3 1.1 11 1.5s3.5.6 5.4 1.1s3.5 1 5.6 1.7s4.7 1.7 7.1 2.8s5.7 3 7.4 4.2s2.1 1.6 3 2.7s1.6 3.4 1.9 4.1" fill="none" stroke="#4a8e63" stroke-width="1.3" stroke-opacity=".9" stroke-linecap="round" stroke-linejoin="round"/><use href="#whLn-9" fill="none" stroke="#b67455" stroke-width="1.2" stroke-opacity=".75" stroke-linejoin="round"/><use href="#whLn-9" fill="#f2c3a0"/><use href="#whLn-0" fill="url(#whLn-f)"/><use href="#whLn-0" fill="url(#whLn-g)"/><path d="M14.5 42.3c-.2 0-.8.2-1.1.3s-.7.2-1.1.4s-.6.4-.9.6s-.7.7-.9.8" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".132" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.5 40.6c-.2 0-.6 0-.9 0s-.6.1-.8.3s-.5.3-.7.5s-.4.6-.5.8" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".09" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.4 38.9c-.6-.3-2.6-.8-3.6-1.6s-2-2.7-2.4-3.3" fill="none" stroke="#f9d6bc" stroke-width="2.1" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M21.7 27.5c-.3-.2-.5-.4-1-.6s-1.6-.4-2.4-.3s-1.7.6-2.2.8s-.4.4-.9.9s-1.3 1.5-1.7 2.3s-.9 1.6-.9 2.3s.2 1.3.6 1.8s.8 1 1.5 1.4s1.9 1.4 2.6 1.5s1.5-.3 2-.5s.6-.4 1-.9s1.5-1.5 2-2.2s.8-1.4 1-2.2s-.1-1.8-.3-2.3s-.3-.8-.5-1.1s-.5-.6-.8-.9z" fill="url(#whLn-h)" stroke="#d39a84" stroke-width=".8" stroke-opacity=".45"/><path d="M18.9 37.4c-.5-.1-2.3-.4-3-.6s-.8-.4-1.2-.7s-.6-.4-.9-1s-1-2.4-1.2-2.9" fill="none" stroke="#c47f62" stroke-width="1.2" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.1 32.4c.2-.2.6-.8.9-1.2s.6-.7.9-1.1s.7-.7 1-1.1s.7-.9.9-1.1" fill="none" stroke="#fff7f2" stroke-width="1.2" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whLn-i)"><ellipse cx="18.4" cy="33.3" rx="8.8" ry="9.7" transform="rotate(39.1 18.4 33.3)" fill="url(#whLn-e)" fill-opacity=".26"/></g><g clip-path="url(#whLn-j)" fill="none" stroke="#b87253"><use href="#whLn-1" stroke-width="1.5" stroke-opacity=".09" transform="translate(.5 .7)"/><use href="#whLn-1" stroke-width="3.4" stroke-opacity=".07" transform="translate(.5 .7)"/><use href="#whLn-1" stroke-width="5.9" stroke-opacity=".05" transform="translate(.5 .7)"/></g><use href="#whLn-1" fill="#f2c3a0"/><use href="#whLn-2" fill="url(#whLn-k)"/><use href="#whLn-2" fill="url(#whLn-l)"/><g clip-path="url(#whLn-m)"><ellipse cx="87.7" cy="32.7" rx="5.6" ry="4" transform="rotate(100 87.7 32.7)" fill="url(#whLn-c)" fill-opacity=".22"/><ellipse cx="89.1" cy="30.7" rx="6.4" ry="4.1" transform="rotate(100 89.1 30.7)" fill="url(#whLn-e)" fill-opacity=".26"/></g><g clip-path="url(#whLn-n)" fill="none" stroke="#b87253"><use href="#whLn-3" stroke-width="1.5" stroke-opacity=".09" transform="translate(.5 .7)"/><use href="#whLn-3" stroke-width="3.4" stroke-opacity=".07" transform="translate(.5 .7)"/><use href="#whLn-3" stroke-width="5.9" stroke-opacity=".05" transform="translate(.5 .7)"/></g><use href="#whLn-3" fill="url(#whLn-o)"/><use href="#whLn-3" fill="url(#whLn-p)"/><g clip-path="url(#whLn-q)"><ellipse cx="73.1" cy="24.5" rx="7.1" ry="5" transform="rotate(94.5 73.1 24.5)" fill="url(#whLn-c)" fill-opacity=".22"/><ellipse cx="74.7" cy="21.3" rx="8.1" ry="5.1" transform="rotate(94.5 74.7 21.3)" fill="url(#whLn-e)" fill-opacity=".26"/></g><path d="M82.5 27.6c-.2 1.1-.7 5.3-.8 6.3" fill="none" stroke="#b67455" stroke-width=".7" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whLn-r)" fill="none" stroke="#b87253"><use href="#whLn-4" stroke-width="1.5" stroke-opacity=".09" transform="translate(.5 .7)"/><use href="#whLn-4" stroke-width="3.4" stroke-opacity=".07" transform="translate(.5 .7)"/><use href="#whLn-4" stroke-width="5.9" stroke-opacity=".05" transform="translate(.5 .7)"/></g><use href="#whLn-4" fill="url(#whLn-s)"/><use href="#whLn-4" fill="url(#whLn-t)"/><g clip-path="url(#whLn-u)"><ellipse cx="57.2" cy="21.1" rx="7.7" ry="5.5" transform="rotate(90 57.2 21.1)" fill="url(#whLn-c)" fill-opacity=".22"/><ellipse cx="58.7" cy="17.3" rx="8.8" ry="5.5" transform="rotate(90 58.7 17.3)" fill="url(#whLn-e)" fill-opacity=".26"/></g><path d="M67.9 18.2c0 1.5-.3 7.8-.4 9.3" fill="none" stroke="#b67455" stroke-width=".7" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whLn-v)" fill="none" stroke="#b87253"><use href="#whLn-5" stroke-width="1.5" stroke-opacity=".09" transform="translate(.5 .7)"/><use href="#whLn-5" stroke-width="3.4" stroke-opacity=".07" transform="translate(.5 .7)"/><use href="#whLn-5" stroke-width="5.9" stroke-opacity=".05" transform="translate(.5 .7)"/></g><use href="#whLn-5" fill="url(#whLn-w)"/><use href="#whLn-5" fill="url(#whLn-x)"/><path d="M22.2 17.1c.6 0 2.4-.2 3.6.1s2.6 1.4 3.1 1.7" fill="none" stroke="#f9d6bc" stroke-width="1.8" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M23.3 26.5c.7 0 2.3 0 3-.3s1.2-.9 1.5-1.2s.2-.4.3-.9s.5-1.5.5-2.2s.1-1.3-.1-1.9s-.8-.8-1.3-1.1s-1-.4-1.7-.6s-2.1-.4-2.8-.3s-1 .6-1.3.9s-.3.5-.5 1s-.5 1.4-.6 2.1s-.2 1.3 0 1.9s.8 1.2 1.1 1.6s.6.4.9.6s.3.4 1 .4z" fill="url(#whLn-y)" stroke="#d39a84" stroke-width=".7" stroke-opacity=".45"/><path d="M21.6 18.6c.4 0 2-.4 2.6-.4s.7-.1 1.3.2s1.6.8 2.2 1.1s.8.9 1 1" fill="none" stroke="#c47f62" stroke-width="1.1" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M26.6 21.2c0 .1-.2.7-.3 1s-.2.7-.3 1.1s-.2.7-.2 1.1s-.3.8-.3 1" fill="none" stroke="#fff7f2" stroke-width="1.1" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whLn-z)"><ellipse cx="25.1" cy="22" rx="7.6" ry="8.3" transform="rotate(-165 25.1 22)" fill="url(#whLn-e)" fill-opacity=".28"/></g><path d="M25.4 28.4c-.3 0-1.3 0-1.9-.2s-1.3-.4-1.9-.8s-1.1-.7-1.5-1.2s-1-1.4-1.2-1.6" fill="none" stroke="#b67455" stroke-width=".7" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whLn-11)" fill="none" stroke="#b87253"><use href="#whLn-6" stroke-width="1.5" stroke-opacity=".09" transform="translate(.5 .7)"/><use href="#whLn-6" stroke-width="3.4" stroke-opacity=".07" transform="translate(.5 .7)"/><use href="#whLn-6" stroke-width="5.9" stroke-opacity=".05" transform="translate(.5 .7)"/></g><use href="#whLn-6" fill="url(#whLn-12)"/><use href="#whLn-6" fill="url(#whLn-13)"/><g clip-path="url(#whLn-14)"><ellipse cx="28" cy="13" rx="6.6" ry="4.7" transform="rotate(165 28 13)" fill="url(#whLn-c)" fill-opacity=".24"/><ellipse cx="26.6" cy="15" rx="6.6" ry="4.7" transform="rotate(165 26.6 15)" fill="url(#whLn-e)" fill-opacity=".3"/></g><path d="M31.9 21.4c-.9.2-4.2.9-5.4 1.1s-1.4-.1-2-.2s-1.3-.3-1.8-.6s-1.1-.6-1.6-1s-1.1-1.3-1.1-1.3s1.1 1.5 1.3 1.7s-.5-.4-.6-.4" fill="none" stroke="#b67455" stroke-width=".7" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whLn-16)" fill="none" stroke="#b87253"><use href="#whLn-7" stroke-width="1.5" stroke-opacity=".09" transform="translate(.5 .7)"/><use href="#whLn-7" stroke-width="3.4" stroke-opacity=".07" transform="translate(.5 .7)"/><use href="#whLn-7" stroke-width="5.9" stroke-opacity=".05" transform="translate(.5 .7)"/></g><use href="#whLn-7" fill="url(#whLn-17)"/><use href="#whLn-7" fill="url(#whLn-18)"/><g clip-path="url(#whLn-19)"><ellipse cx="43.2" cy="12.7" rx="7.3" ry="5.2" transform="rotate(-124.9 43.2 12.7)" fill="url(#whLn-c)" fill-opacity=".24"/><ellipse cx="40.5" cy="11.9" rx="7.3" ry="5.2" transform="rotate(-124.9 40.5 11.9)" fill="url(#whLn-e)" fill-opacity=".3"/></g><path d="M50.7 12.9c0 1 .2 3.3.3 5.7s.2 7.3.3 8.8" fill="none" stroke="#b67455" stroke-width=".7" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><path d="M33.8 19.7c-.1-.7-.2-3.1-.4-3.9s-.4-.7-.7-1.2s-.4-1.4-.5-2.1s-.2-1.5-.1-2.2s.2-1.3.5-1.9s.8-1.5.9-1.8" fill="none" stroke="#b67455" stroke-width=".7" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whLn-a)"><path d="M91.2 33.8c.6 0 2.9-.2 3.7 0s.7.3.9.8s.6.2.6 1.9s-.2 5.1-.5 8.3s-1 8.2-1.4 10.8s-.2 2-.5 4.9s-1 9.5-1.3 12.1s-.2 1.3-.4 3.8s-.6 7.6-.9 11.1s-.5 6.6-.4 9.4s.8 4.2.9 7s0 6.7 0 9.8s0 5.1 0 8.3s.2 8 .2 10.8s.1 3.9.2 6.1s.1 4.3.2 6.7s.1 4.9.2 7.4s.2 5.2.3 7.8s.2 5.4.3 8s.2 5.3.4 7.9s.3 5.1.4 7.7s.3 5.2.5 7.8s.3 5.3.5 7.9s.4 5.3.6 7.9s.3 5.2.5 7.9s.4 5.2.6 7.8s.4 5.2.6 7.8s.4 5.3.6 7.9s.5 5.2.6 7.8s.4 5.2.5 7.9s.3 5.3.5 8.1s.2 5.5.3 8.3s.2 5.5.3 8.2s.2 5.3.3 7.7s-.1 4.7.2 6.9s.4 3.3 1.3 6.1s3.7 8.1 4.4 10.6s.3 2.9-.5 4.1s-4 2.5-4.7 3" fill="none" stroke="url(#whLn-1a)" stroke-width="30.8" stroke-opacity=".07" stroke-linecap="round" stroke-linejoin="round"/><path d="M91.2 33.8c.6 0 2.9-.2 3.7 0s.7.3.9.8s.6.2.6 1.9s-.2 5.1-.5 8.3s-1 8.2-1.4 10.8s-.2 2-.5 4.9s-1 9.5-1.3 12.1s-.2 1.3-.4 3.8s-.6 7.6-.9 11.1s-.5 6.6-.4 9.4s.8 4.2.9 7s0 6.7 0 9.8s0 5.1 0 8.3s.2 8 .2 10.8s.1 3.9.2 6.1s.1 4.3.2 6.7s.1 4.9.2 7.4s.2 5.2.3 7.8s.2 5.4.3 8s.2 5.3.4 7.9s.3 5.1.4 7.7s.3 5.2.5 7.8s.3 5.3.5 7.9s.4 5.3.6 7.9s.3 5.2.5 7.9s.4 5.2.6 7.8s.4 5.2.6 7.8s.4 5.3.6 7.9s.5 5.2.6 7.8s.4 5.2.5 7.9s.3 5.3.5 8.1s.2 5.5.3 8.3s.2 5.5.3 8.2s.2 5.3.3 7.7s-.1 4.7.2 6.9s.4 3.3 1.3 6.1s3.7 8.1 4.4 10.6s.3 2.9-.5 4.1s-4 2.5-4.7 3" fill="none" stroke="url(#whLn-1a)" stroke-width="16.8" stroke-opacity=".09" stroke-linecap="round" stroke-linejoin="round"/><path d="M91.2 33.8c.6 0 2.9-.2 3.7 0s.7.3.9.8s.6.2.6 1.9s-.2 5.1-.5 8.3s-1 8.2-1.4 10.8s-.2 2-.5 4.9s-1 9.5-1.3 12.1s-.2 1.3-.4 3.8s-.6 7.6-.9 11.1s-.5 6.6-.4 9.4s.8 4.2.9 7s0 6.7 0 9.8s0 5.1 0 8.3s.2 8 .2 10.8s.1 3.9.2 6.1s.1 4.3.2 6.7s.1 4.9.2 7.4s.2 5.2.3 7.8s.2 5.4.3 8s.2 5.3.4 7.9s.3 5.1.4 7.7s.3 5.2.5 7.8s.3 5.3.5 7.9s.4 5.3.6 7.9s.3 5.2.5 7.9s.4 5.2.6 7.8s.4 5.2.6 7.8s.4 5.3.6 7.9s.5 5.2.6 7.8s.4 5.2.5 7.9s.3 5.3.5 8.1s.2 5.5.3 8.3s.2 5.5.3 8.2s.2 5.3.3 7.7s-.1 4.7.2 6.9s.4 3.3 1.3 6.1s3.7 8.1 4.4 10.6s.3 2.9-.5 4.1s-4 2.5-4.7 3" fill="none" stroke="url(#whLn-1a)" stroke-width="7" stroke-opacity=".11" stroke-linecap="round" stroke-linejoin="round"/><path d="M34.3 318.1c-.8-.5-3.9-1.7-4.8-2.8s-1.2-1.5-.6-3.8s3.3-7.3 4.2-9.9s1.1-3.8 1.4-5.9s.1-4.4.1-6.8s.2-5 .3-7.7s.2-5.5.3-8.2s.2-5.7.3-8.4s.3-5.5.5-8.1s.4-5.3.6-7.9s.4-5.2.7-7.8s.5-5.2.7-7.9s.5-5.2.8-7.8s.6-5.2.8-7.8s.6-5.3.9-7.9s.7-5.3 1-7.9s.7-5.2 1-7.9s.7-5.2 1-7.8s.5-5.1.8-7.7s.4-5.2.6-7.8s.4-5.3.6-7.9s.3-5.3.5-7.8s.3-5 .4-7.4s.3-4.7.4-6.9s.2-4.4.3-6.5s.2-4.1.3-6.1s.1-3.1.2-5.7s.2-6.6.3-9.7s.4-7.3.4-9.2s.1-.3.1-2.3s-.1-7.5-.4-10s-.6-3.3-1.4-5.1s-1.7-3.5-3.2-5.9s-5.1-7.2-6.1-8.7" fill="none" stroke="url(#whLn-1b)" stroke-width="12.6" stroke-opacity=".13" stroke-linecap="round" stroke-linejoin="round"/><path d="M32.6 318.1c-.8-.5-3.9-1.7-4.7-2.8s-1.2-1.5-.6-3.8s3.2-7.3 4.2-9.9s1-3.8 1.3-5.9s.1-4.4.2-6.8s.1-5 .2-7.7s.2-5.5.3-8.2s.2-5.7.4-8.4s.2-5.5.4-8.1s.4-5.3.6-7.9s.4-5.2.7-7.8s.5-5.2.7-7.9s.6-5.2.8-7.8s.6-5.2.9-7.8s.5-5.3.9-7.9s.6-5.3.9-7.9s.7-5.2 1-7.9s.7-5.2 1-7.8s.5-5.1.8-7.7s.4-5.2.6-7.8s.4-5.3.6-7.9s.3-5.3.5-7.8s.3-5 .4-7.4s.3-4.7.4-6.9s.2-4.4.3-6.5s.2-4.1.3-6.1s.1-3.1.2-5.7s.2-6.6.3-9.7s.4-7.3.5-9.2s.1-.3 0-2.3s-.1-7.5-.4-10s-.6-3.3-1.3-5.1s-1.7-3.5-3.3-5.9s-5.1-7.2-6.1-8.7" fill="none" stroke="url(#whLn-1b)" stroke-width="6.2" stroke-opacity=".16" stroke-linecap="round" stroke-linejoin="round"/><path d="M27.3 318.1c-.8-.5-3.9-1.7-4.8-2.8s-1.2-1.5-.6-3.8s3.3-7.3 4.2-9.9s1.1-3.8 1.4-5.9s.1-4.4.1-6.8s.2-5 .3-7.7s.2-5.5.3-8.2s.2-5.7.3-8.4s.3-5.5.5-8.1s.4-5.3.6-7.9s.4-5.2.7-7.8s.5-5.2.7-7.9s.5-5.2.8-7.8s.6-5.2.8-7.8s.6-5.3.9-7.9s.7-5.3 1-7.9s.7-5.2 1-7.9s.7-5.2 1-7.8s.5-5.1.8-7.7s.4-5.2.6-7.8s.4-5.3.6-7.9s.3-5.3.5-7.8s.3-5 .4-7.4s.3-4.7.4-6.9s.2-4.4.3-6.5s.2-4.1.3-6.1s.1-3.1.2-5.7s.2-6.6.3-9.7s.4-7.3.4-9.2s.1-.3.1-2.3s-.1-7.5-.4-10s-.6-3.3-1.4-5.1s-1.7-3.5-3.2-5.9s-5.1-7.2-6.1-8.7" fill="none" stroke="#dc9d7e" stroke-width="3.1" stroke-opacity=".14" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="58.7" cy="59.1" rx="23.8" ry="30.8" transform="rotate(-6 58.7 59.1)" fill="url(#whLn-b)" fill-opacity=".4"/><ellipse cx="54.5" cy="53.5" rx="11.2" ry="16.8" transform="rotate(-8 54.5 53.5)" fill="url(#whLn-b)" fill-opacity=".3"/><ellipse cx="80.8" cy="66.1" rx="11.2" ry="23.8" transform="rotate(-4 80.8 66.1)" fill="url(#whLn-d)" fill-opacity=".2"/><ellipse cx="87" cy="103.3" rx="5" ry="6.2" fill="url(#whLn-b)" fill-opacity=".16"/><ellipse cx="88.9" cy="110.2" rx="4.2" ry="5" fill="url(#whLn-d)" fill-opacity=".1"/><path d="M54.5 97.4c1.2.2 6.1.8 7.3 1" fill="none" stroke="#c47f62" stroke-width=".6" stroke-opacity=".1" stroke-linecap="round" stroke-linejoin="round"/><path d="M66.7 98.7c1-.1 5.2-.6 6.3-.7" fill="none" stroke="#c47f62" stroke-width=".6" stroke-opacity=".1" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="43.6" cy="253.7" rx="10.5" ry="36.4" transform="rotate(3 43.6 253.7)" fill="url(#whLn-b)" fill-opacity=".28"/><ellipse cx="45.8" cy="164.1" rx="7.7" ry="30.8" transform="rotate(2 45.8 164.1)" fill="url(#whLn-b)" fill-opacity=".14"/><ellipse cx="77.9" cy="242.5" rx="9.8" ry="47.6" transform="rotate(-3 77.9 242.5)" fill="url(#whLn-d)" fill-opacity=".1"/><ellipse cx="42.2" cy="31.6" rx="10.1" ry="5" transform="rotate(-12.1 42.2 31.6)" fill="url(#whLn-c)" fill-opacity=".2"/><ellipse cx="57.8" cy="28.3" rx="10.1" ry="5" transform="rotate(-1.5 57.8 28.3)" fill="url(#whLn-c)" fill-opacity=".2"/><ellipse cx="73.2" cy="30.8" rx="10.1" ry="5" transform="rotate(17.4 73.2 30.8)" fill="url(#whLn-c)" fill-opacity=".2"/><ellipse cx="87.4" cy="37.5" rx="10.1" ry="5" transform="rotate(25.4 87.4 37.5)" fill="url(#whLn-c)" fill-opacity=".2"/><ellipse cx="50.8" cy="29.1" rx="1.8" ry="4.2" transform="rotate(-12.1 50.8 29.1)" fill="url(#whLn-d)" fill-opacity=".08"/><ellipse cx="66.4" cy="28.7" rx="1.8" ry="4.2" transform="rotate(9.3 66.4 28.7)" fill="url(#whLn-d)" fill-opacity=".08"/><ellipse cx="81.1" cy="33.3" rx="1.8" ry="4.2" transform="rotate(25.4 81.1 33.3)" fill="url(#whLn-d)" fill-opacity=".08"/><ellipse cx="41.3" cy="30.5" rx="7.7" ry="5.7" transform="rotate(-6 41.3 30.5)" fill="url(#whLn-c)" fill-opacity=".3"/><ellipse cx="43" cy="30.5" rx="8.4" ry="6" fill="url(#whLn-e)" fill-opacity=".16"/><ellipse cx="56.9" cy="27.1" rx="8" ry="5.9" transform="rotate(-6 56.9 27.1)" fill="url(#whLn-c)" fill-opacity=".3"/><ellipse cx="58.7" cy="27.1" rx="8.7" ry="6.2" fill="url(#whLn-e)" fill-opacity=".16"/><ellipse cx="72.4" cy="29.7" rx="7.7" ry="5.7" transform="rotate(-6 72.4 29.7)" fill="url(#whLn-c)" fill-opacity=".3"/><ellipse cx="74.1" cy="29.7" rx="8.3" ry="6" fill="url(#whLn-e)" fill-opacity=".16"/><ellipse cx="86.7" cy="36.4" rx="6.8" ry="5" transform="rotate(-6 86.7 36.4)" fill="url(#whLn-c)" fill-opacity=".3"/><ellipse cx="88.2" cy="36.4" rx="7.4" ry="5.3" fill="url(#whLn-e)" fill-opacity=".16"/></g><path d="M22.4 300.1c.3.8.5-.9 1.8-1.5s3.1-1.3 5.7-2.1s6.8-1.4 10-2.2s6.2-1.8 9.2-2.5s6.2-1.4 9.1-1.6s5.7 0 8.5.2s5.5.6 8.1.9s5.6.5 7.8.8s2.7.3 5.2.8s6.8 1.6 9.6 2.3s5.4 1.6 7.1 2.2s2 .9 2.8 1.4s1.6 2.3 1.9 1.6s.3-4.6 0-5.9s-1.1-1.1-1.9-1.6s-1.2-.8-2.8-1.4s-4.3-1.4-7.1-2.1s-7.1-1.8-9.6-2.4s-3.1-.5-5.2-.8s-5.1-.5-7.8-.8s-5.8-.7-8.1-.9s-3.2-.4-5.6-.3s-6.4.6-8.9 1s-4.1 1-6.2 1.5s-3.4 1-6.1 1.7s-7.4 1.5-10 2.3s-4.5 1.5-5.7 2.1s-1.5.2-1.8 1.5s-.3 5.1 0 5.8z" fill="#b87253" fill-opacity=".12"/><use href="#whLn-8" fill="none" stroke="#2d6142" stroke-width="1.3" stroke-opacity=".9"/><use href="#whLn-8" fill="url(#whLn-1f)"/><g clip-path="url(#whLn-1c)"><path d="M20.6 301.3c.3-.3.6-.9 1.9-1.5s3.2-1.4 5.9-2.1s7.7-1.7 10.5-2.3s4.2-1.2 6.3-1.7s3.8-1.1 6.4-1.5s6.8-.9 9.3-1s3.4.1 5.8.3s5.7.7 8.5.9s5.8.5 8.1.8s2.9.3 5.4.8s7.1 1.6 10 2.4s5.7 1.5 7.4 2.1s2.1.9 3 1.4s1.6 1.4 1.9 1.6" fill="none" stroke="#95d0aa" stroke-width="2.5" stroke-opacity=".2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21.5 305.2c.3-.3.6-.9 1.8-1.5s3.2-1.4 5.9-2.1s7.5-1.6 10.2-2.3s4.1-1.1 6.2-1.7s3.8-1 6.3-1.5s6.6-.9 9.1-1s3.3.1 5.7.3s5.6.7 8.3 1s5.7.5 7.9.7s2.9.3 5.4.9s6.9 1.5 9.7 2.3s5.6 1.6 7.3 2.2s2.1.8 2.9 1.3s1.6 1.4 1.9 1.7" fill="none" stroke="#3f8259" stroke-width=".6" stroke-dasharray="1.6 1.3" stroke-opacity=".8"/><path d="M21.5 307.7c.3-.2.6-.9 1.8-1.5s3.2-1.4 5.9-2.1s7.5-1.6 10.2-2.3s4.1-1.1 6.2-1.7s3.8-1 6.3-1.4s6.6-.9 9.1-1.1s3.3.1 5.7.3s5.6.7 8.3 1s5.7.5 7.9.7s2.9.3 5.4.9s6.9 1.5 9.7 2.3s5.6 1.6 7.3 2.2s2.1.9 2.9 1.4s1.6 1.3 1.9 1.6" fill="none" stroke="#3f8259" stroke-width=".6" stroke-dasharray="1.6 1.3" stroke-opacity=".7"/><path d="M22 309.9c.3-.2.5-.9 1.8-1.5s3.1-1.3 5.7-2.1s7.4-1.6 10.2-2.2s4.1-1.2 6.1-1.7s3.7-1.1 6.3-1.5s6.5-.9 8.9-1s3.4.1 5.7.3s5.5.6 8.2.9s5.7.5 7.9.8s2.7.3 5.2.8s6.9 1.6 9.7 2.3s5.5 1.6 7.2 2.2s2.1.9 2.9 1.4s1.6 1.4 1.9 1.6" fill="none" stroke="#2f6644" stroke-width="2.2" stroke-opacity=".12" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="44" cy="321.6" rx="20.3" ry="6.2" transform="rotate(31.1 44 321.6)" fill="url(#whLn-1d)" fill-opacity=".6"/><ellipse cx="47.7" cy="315.5" rx="17.9" ry="4.9" transform="rotate(31.1 47.7 315.5)" fill="url(#whLn-1e)" fill-opacity=".57"/><ellipse cx="90.8" cy="331.4" rx="19" ry="5.6" transform="rotate(-28.5 90.8 331.4)" fill="url(#whLn-1d)" fill-opacity=".5"/><ellipse cx="87.7" cy="325.7" rx="16.8" ry="4.5" transform="rotate(-28.5 87.7 325.7)" fill="url(#whLn-1e)" fill-opacity=".475"/></g></svg>'},
    open:{w:138,h:549,palm:[55.2,92],wrist:[58.1,128.4],
      svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 138 549" width="138" height="549"><g class="wh-shadow" fill="#3a2410"><path fill-opacity=".035" d="M52.6 3.6c2.2-.2 5.4.8 7.1 1.6s2.3 1.9 3.1 3s.6 3.3 1.6 3.5s3.4-1.9 4.9-2.2s2.6-.2 3.9.1s2.3.5 3.6 1.7s3.1 2.9 3.8 5.7s-.1 9.7.5 11.4s2.1-.9 3.6-1s3.7.1 5.1.6s2.3 1.2 3.2 2.3s2-3.5 2.2 4.6s0 31-.8 44s-3.1 25.4-3.9 33.6s-.8 11.7-.6 15.5s-.8 4.2 1.7 7.2s10.8 7.4 13.4 10.8s1.4-3.1 2.1 9.6s.8 42.6 2.1 66.7s4.4 58.7 5.5 77.6s0 29.1 1.5 35.8s5.9 3.2 7.6 4.3s1.6 1.5 2.2 2.6s1.7.9 1.3 3.8s-3.2 9-3.4 13.7s1.5 5.2 2.3 14.9s.8 23 2.3 43.3s5 58.7 6.4 78.5s1.6 27.3 1.7 40s.1 25.9-1.2 36.4s-3.1 19.5-6.5 26.6s-8.5 11.7-13.9 15.8s-12.2 6.9-18.6 8.8s-12.6 2.8-19.7 2.8s-15.7-.7-22.8-2.8s-14.6-5.5-20.1-9.8s-10-8.8-13.2-16.3s-4.7-18.2-5.8-28.7s-1-22.6-.8-34.8s.3-19.1 1.7-38.3s4.7-54.6 6.4-77.1s3.5-45.7 3.7-57.9s-2.5-11.7-2.6-15.1s.9-3.6 2.2-5.2s4.3 4.2 5.6-4.4s.6-26.4 2.3-47.2s6.5-54.9 8.4-77.7s4-47.3 2.9-59.3s-7.9-8.1-9.6-12.6s-.2-10.5-.6-13.9s-1.2-5-1.9-6.6s-1.1-2.5-2.3-3.4s-3.6-1.2-4.9-2s-.7 1.1-3-3.2s-8.5-18.1-10.7-23.2s-1.9-4.2-2.6-7.3s-1.6-8-1.4-10.9s1.2-4.6 2.6-6.3s4.1-3.2 6.1-3.7s3.9-.4 5.9.3s4.9 7.5 5.7 3.9s-.8-18.1-.7-25.6s.5-16 1.1-19.8s1.2-2.4 2.2-3.4s2.5-1.8 4-2.3s3.3-.5 4.9-.3s3 2.5 4.2 1.6s1.5-5.5 3-7.2s3.8-2.8 6-3.1z"/><path fill-opacity=".05" d="M52 3.9c1.2-.1 2.6 0 3.9.4s2.4.5 3.6 1.9s1.8 6.4 3.3 7s3.9-2.8 5.4-3.4s2.7-.2 3.9.1s2.1.4 3.2 1.5s2.8 2.1 3.4 5.3s-.3 11.6.5 13.5s2.7-2.1 4.2-2.4s3.3-.1 4.7.3s2.3 1 3.2 2.1s1.8-3.9 2 4.1s.1 28.2-.8 43.8s-4.2 40-4.8 49.4s-.9 4.5 1.3 7.2s9.2 6.9 11.4 9.2s.9-7.6 1.5 4.2s.7 41.9 2.1 66.9s4.6 63.1 5.8 83.2s-.2 30.5 1.5 37.5s6.4 2.7 8.3 4.2s2.9 1.8 2.8 4.8s-3.4 8.4-3.6 13.1s1.7 5.6 2.5 15.4s.8 23.3 2.3 43.6s5 58.6 6.4 78.2s1.6 27.2 1.7 39.8s0 25.6-1.2 35.8s-2.9 18.9-6.1 25.6s-7.7 11-12.8 14.9s-11.9 6.7-18 8.6s-12.2 2.7-19 2.7s-15.3-.7-22.1-2.7s-13.6-5-18.8-9.1s-9.6-8.3-12.6-15.5s-4.5-17.2-5.6-27.5s-1-22.6-.8-34.8s.3-18.9 1.7-38s4.9-55.6 6.4-76.9s1.9-41 2.6-50.8s1.5-4.1 1.3-7.9s-2.6-11.4-2.8-14.5s.6-2.8 1.9-4.1s4.6 4.7 6-4.1s.5-27.7 2.2-48.7s6.5-54.2 8.4-77.3s4.2-49.2 3.1-61.3s-8.1-6.3-10.1-11.2s-1-14.1-1.9-18.1s-2.1-4.5-3.5-5.7s-3.6-1-4.9-1.9s-.6 1.3-3-3.4s-9-18.2-11.3-24.8s-2.8-11.6-2.9-15.2s1.6-4.5 2.4-5.8s1.7-1.7 2.8-2.3s2-1.3 3.8-1.2s5.1.9 6.8 1.8s2.2 2.2 3 3.4s1.6 7.6 1.7 3.9s-.9-17.1-.9-25.6s.4-20.3.9-25s1-2.3 2.1-3.2s3.1-2 4.7-2.3s3.6.1 5 .6s2.6 3.4 3.5 2.5s1.2-6 1.9-7.8s1.7-2 2.7-2.6s2.4-1.2 3.7-1.4z"/><path fill-opacity=".075" d="M51 4.4c1.6-.3 3.6-.2 5.1.5s3 2.3 3.8 3.6s.8.5 1 3.8s.3 14.8.4 15.8s-.2-7.3 0-9.7s.5-3.5 1.4-4.8s2.5-2.6 3.9-3.2s3.1-.6 4.5-.3s2.5.9 3.5 1.9s2 .2 2.5 3.9s.1 16.2.4 18.7s.5-2.8 1.5-3.9s3.1-2.5 4.7-2.7s3.5.1 4.9 1.1s2.7-3.3 3.1 4.7s0 30.1-.8 43.4s-3.4 27.3-4.2 36.5s-.6 14.7-.6 18.2s-1 1 .9 2.9s8.5 6.9 10.4 8.6s.6-9.8 1 1.9s.4 43.2 1.7 68.4s4.6 62.7 5.8 83s-.1 31.7 1.5 38.8s6.1 2.3 7.9 3.7s3.3 1.3 3.2 4.2s-3.4 8.4-3.6 13.1s1.7 5.4 2.5 15.2s.9 23.6 2.3 43.9s5.1 58.3 6.4 77.9s1.6 27.5 1.7 40s0 25.2-1.1 35.2s-2.8 18.2-5.8 24.7s-7.3 10.6-12.3 14.3s-11.4 6.5-17.4 8.3s-12 2.6-18.6 2.6s-14.5-.7-21.1-2.6s-13.1-4.8-18.1-8.7s-9.1-7.7-11.9-14.7s-4.4-16.7-5.5-26.9s-.9-22.1-.8-34.2s.3-19.1 1.7-38.3s4.9-55.2 6.4-76.5s1.9-41 2.6-50.9s1.6-4.4 1.3-8.1s-2.6-11.6-2.7-14.5s.3-2 1.6-3.1s4.8 4.3 6.2-3.5s-.1-22.7 1.7-43.3s6.6-56.1 8.6-80.4s4.6-52.8 3.4-65.6s-8.3-6.2-10.3-10.9s-1-13.3-1.9-17.3s-2.6-5.2-4.1-6.6s-3.5-.7-4.8-1.5s-.4 1.3-2.7-3.3s-8.8-17.8-11.2-24.4s-2.6-11.6-2.9-14.8s.5-2.9 1.2-4.1s2.2-2.5 3.3-3.3s2-1.1 3.3-1.2s3-.3 4.6.6s3.2 1.2 4.9 4.3s4.8 14.6 5.3 14.6s-1.7-8.6-2.2-14.8s-.8-14.4-.8-22.1s.2-19.5.7-24s1.2-2.5 2-3.4s1.2-1.5 2.7-1.8s4.6-.4 6.3.2s3 1.7 3.8 3.6s.9 8.8 1.2 7.7s-.2-11.4.2-14.5s1.1-2.7 2.1-3.7s2.8-2 4.3-2.2z"/></g><defs><path id="whLo-0" d="M19.6 349.6c-12.2-3.7 0-12.1.3-22.4s.6-26.1 1.5-39.2s2.3-26.1 3.6-39.2s3.5-26.4 4.7-39.2s1.9-26.8 2.5-37.8s.8-21 1.1-28s.6-9.6.4-14s-.2-8.8-1.7-12.6s-4.8-7.4-7-10.4s-5.7-4.9-5.7-7.2s3.5-4.8 5.6-6.6s6.1-3 6.9-4.3s-1.9-2.8-2.2-3.8s1 2.4.5-1.8s-4-19-3.1-23.7s5.8-3.1 8.4-4.9s4.7-5.6 7.3-6.2s5.7 2.8 8.4 2.8s5.1-3.2 7.7-2.8s5.1 4.6 7.7 5.3s5.5-2 7.9-.7s3.9 6.2 6.2 8.9s6.8 1.9 7.7 7s-1.3 16.1-1.9 23.2s-1.5 13.5-2 19.6s-1 12.8-1 16.8s.8 4.2.9 7s-.1 4 0 9.8s.1 14.7.4 25.2s.7 25 1.4 37.8s1.6 26.1 2.5 39.2s2.2 26.1 2.9 39.2s1.2 28.7 1.6 39.2s12.7 19.8.5 23.8s-61.7 3.7-74 0z"/><path id="whLo-1" d="M21.1 106.8c-1.1-1.9-3-6-4.4-9s-2.7-6.2-3.8-8.6s-2.1-4.5-2.7-5.9s-.7-1.4-1.1-2.5s-.8-2.1-1.2-4.3s-1.3-7.1-1.5-9s.1-1.6.3-2.4s.6-1.5 1-2.2s.8-1.3 1.4-1.8s1.2-1.1 1.8-1.4s1.5-.7 2.2-.9s1.5-.3 2.3-.2s1.5.1 2.3.4s1.5.5 2.1 1s1.3.9 1.8 1.5s1 1 1.4 2s1 2.5 1.3 3.6s.1 1.5.8 3.4s2.6 6.1 3.4 7.9s.9 1.9 1.3 2.8s.5 1 1.5 2.9s3.3 6.6 4.5 8.7s2.1 2.8 2.7 4s.8 2 .9 3.1s-.2 2.2-.6 3.3s-1.1 2.2-2 3.2s-1.9 1.8-3 2.4s-2.4 1.1-3.6 1.4s-2.6.3-3.7.1s-2.3-.6-3.2-1.2s-1.1-.4-2.2-2.3z"/><path id="whLo-2" d="M72.8 72.4c0-1.3.2-3 .4-5.6s.8-7 1.1-9.9s.2-5.2.4-7.8s.7-5.3.9-7.8s.1-5.5.2-7.1s.3-2 .4-2.7s.4-1.1.7-1.6s.7-1 1.1-1.4s.9-.7 1.4-1s1.1-.5 1.6-.7s1.2-.2 1.8-.2s1.1.1 1.7.3s1.1.4 1.6.7s1 .7 1.4 1.1s.7.9 1 1.4s.5.9.6 1.6s.4.8.4 2.5s-.3 5.4-.3 7.7s.1 4.6.1 5.9s.1.5-.1 2.2s-.5 5-.7 8s-.3 7.3-.5 9.9s-.2 4.4-.4 5.6s-.3 1.4-.7 1.9s-1.1 1.2-1.8 1.6s-1.6.8-2.5.9s-1.9.3-2.8.2s-2-.3-2.8-.6s-1.7-.8-2.3-1.3s-1.2-1.2-1.5-1.8s-.4-.8-.4-2z"/><path id="whLo-3" d="M58 66c-.1-1.3 0-2.6.2-5.6s.5-8.8.6-12.6s0-6.8.1-10.1s.6-6.6.7-10s0-7.8.1-10s.2-2.5.3-3.4s.5-1.3.8-1.8s.7-1.1 1.2-1.6s1-.9 1.5-1.2s1.2-.6 1.9-.7s1.3-.3 1.9-.3s1.3.1 2 .2s1.2.5 1.8.8s1.1.7 1.5 1.2s.9 1 1.2 1.5s.6 1 .8 1.9s.4 1 .4 3.3s-.1 6.9-.1 10.3s.4 6.8.4 10.2s-.3 6.4-.4 10.2s-.1 9.5-.1 12.6s0 4.3-.2 5.6s-.2 1.5-.7 2.2s-1 1.3-1.8 1.8s-1.8.9-2.7 1.2s-2.2.4-3.2.4s-2.2-.3-3.2-.6s-2-.8-2.7-1.3s-1.4-1.3-1.7-2s-.5-.9-.6-2.2z"/><path id="whLo-4" d="M42.5 63.8c-.2-1.3-.1-3.1-.1-5.6s.1-7.2.1-9.5s.1-1.4 0-3.9s-.3-7.2-.2-10.8s.4-7.1.4-10.7s-.2-8.5-.2-10.9s.2-2.7.4-3.6s.5-1.3.8-1.9s.8-1.2 1.2-1.7s1.1-.9 1.7-1.2s1.2-.6 1.9-.8s1.3-.3 2-.3s1.4.1 2 .2s1.4.5 1.9.8s1.2.8 1.7 1.2s.9 1.1 1.3 1.7s.6.9.8 1.8s.3 1.2.4 3.6s0 7.3.1 10.9s.6 7.1.7 10.7s-.1 8.4-.1 10.9s.1 1.6.1 3.9s.3 6.9.3 9.4s.2 4.3.1 5.6s-.2 1.6-.6 2.4s-1.1 1.4-1.9 1.9s-1.8 1.1-2.8 1.4s-2.2.5-3.3.5s-2.3-.2-3.3-.4s-2.1-.8-2.9-1.3s-1.4-1.3-1.9-2s-.5-1-.6-2.3z"/><path id="whLo-5" d="M27.3 67.4c-.2-1.3-.2-2.6-.3-5.5s-.2-8.5-.3-12.2s-.6-6.5-.6-9.8s.2-6.6.2-9.8s-.2-7.6-.1-9.8s.2-2.3.4-3.1s.4-1.3.8-1.9s.7-1.1 1.2-1.5s1-.9 1.6-1.3s1.2-.6 1.8-.7s1.4-.3 2-.3s1.4.1 2 .3s1.3.4 1.9.7s1.1.8 1.5 1.3s.9 1 1.3 1.6s.5 1 .7 1.8s.3 1.2.4 3.3s0 6.1.1 9.2s.6 6.4.8 9.6s.1 6 .3 9.7s.6 9.1.8 12.1s.3 4.3.2 5.6s-.1 1.6-.5 2.3s-1 1.4-1.7 2s-1.7 1-2.7 1.3s-2.1.6-3.2.6s-2.2 0-3.2-.3s-2-.6-2.8-1.1s-1.5-1.2-1.9-1.8s-.6-1-.7-2.3z"/><path id="whLo-6" d="M13 330.8c2.7-3.4 12-4.2 18.2-5.8s13-3.6 19.1-4.1s11.7.6 17.3 1.1s10.5.7 16.4 2.3s16.7 3.3 19.4 6.8s-2.8 6.1-2.8 14.3s2.2-4.4 3.3 35s18.8 168 3 201.6s-82 33.6-97.7 0s2.4-162.2 3.4-201.6s2.3-26.7 2.4-35s-4.7-11.2-2-14.6z"/><path id="whLo-7" d="M19.6 349.6c-12.2-3.7 0-12.1.3-22.4s.6-26.1 1.5-39.2s2.3-26.1 3.6-39.2s3.5-26.4 4.7-39.2s1.9-26.8 2.5-37.8s.8-21 1.1-28s.6-9.6.4-14s-.2-8.8-1.7-12.6s-4.8-7.4-7-10.4s-5.7-4.9-5.7-7.2s3.5-4.8 5.6-6.6s6.1-3 6.9-4.3s-1.9-2.8-2.2-3.8s1 2.4.5-1.8s-4-19-3.1-23.7s5.8-3.1 8.4-4.9s4.7-5.6 7.3-6.2s5.7 2.8 8.4 2.8s5.1-3.2 7.7-2.8s5.1 4.6 7.7 5.3s5.5-2 7.9-.7s3.9 6.2 6.2 8.9s6.8 1.9 7.7 7s-1.3 16.1-1.9 23.2s-1.5 13.5-2 19.6s-1 12.8-1 16.8s.8 4.2.9 7s-.1 4 0 9.8s.1 14.7.4 25.2s.7 25 1.4 37.8s1.6 26.1 2.5 39.2s2.2 26.1 2.9 39.2s1.2 28.7 1.6 39.2s12.7 19.8.5 23.8s-61.7 3.7-74 0zM21.1 106.8c-1.1-1.9-3-6-4.4-9s-2.7-6.2-3.8-8.6s-2.1-4.5-2.7-5.9s-.7-1.4-1.1-2.5s-.8-2.1-1.2-4.3s-1.3-7.1-1.5-9s.1-1.6.3-2.4s.6-1.5 1-2.2s.8-1.3 1.4-1.8s1.2-1.1 1.8-1.4s1.5-.7 2.2-.9s1.5-.3 2.3-.2s1.5.1 2.3.4s1.5.5 2.1 1s1.3.9 1.8 1.5s1 1 1.4 2s1 2.5 1.3 3.6s.1 1.5.8 3.4s2.6 6.1 3.4 7.9s.9 1.9 1.3 2.8s.5 1 1.5 2.9s3.3 6.6 4.5 8.7s2.1 2.8 2.7 4s.8 2 .9 3.1s-.2 2.2-.6 3.3s-1.1 2.2-2 3.2s-1.9 1.8-3 2.4s-2.4 1.1-3.6 1.4s-2.6.3-3.7.1s-2.3-.6-3.2-1.2s-1.1-.4-2.2-2.3zM72.8 72.4c0-1.3.2-3 .4-5.6s.8-7 1.1-9.9s.2-5.2.4-7.8s.7-5.3.9-7.8s.1-5.5.2-7.1s.3-2 .4-2.7s.4-1.1.7-1.6s.7-1 1.1-1.4s.9-.7 1.4-1s1.1-.5 1.6-.7s1.2-.2 1.8-.2s1.1.1 1.7.3s1.1.4 1.6.7s1 .7 1.4 1.1s.7.9 1 1.4s.5.9.6 1.6s.4.8.4 2.5s-.3 5.4-.3 7.7s.1 4.6.1 5.9s.1.5-.1 2.2s-.5 5-.7 8s-.3 7.3-.5 9.9s-.2 4.4-.4 5.6s-.3 1.4-.7 1.9s-1.1 1.2-1.8 1.6s-1.6.8-2.5.9s-1.9.3-2.8.2s-2-.3-2.8-.6s-1.7-.8-2.3-1.3s-1.2-1.2-1.5-1.8s-.4-.8-.4-2zM58 66c-.1-1.3 0-2.6.2-5.6s.5-8.8.6-12.6s0-6.8.1-10.1s.6-6.6.7-10s0-7.8.1-10s.2-2.5.3-3.4s.5-1.3.8-1.8s.7-1.1 1.2-1.6s1-.9 1.5-1.2s1.2-.6 1.9-.7s1.3-.3 1.9-.3s1.3.1 2 .2s1.2.5 1.8.8s1.1.7 1.5 1.2s.9 1 1.2 1.5s.6 1 .8 1.9s.4 1 .4 3.3s-.1 6.9-.1 10.3s.4 6.8.4 10.2s-.3 6.4-.4 10.2s-.1 9.5-.1 12.6s0 4.3-.2 5.6s-.2 1.5-.7 2.2s-1 1.3-1.8 1.8s-1.8.9-2.7 1.2s-2.2.4-3.2.4s-2.2-.3-3.2-.6s-2-.8-2.7-1.3s-1.4-1.3-1.7-2s-.5-.9-.6-2.2zM42.5 63.8c-.2-1.3-.1-3.1-.1-5.6s.1-7.2.1-9.5s.1-1.4 0-3.9s-.3-7.2-.2-10.8s.4-7.1.4-10.7s-.2-8.5-.2-10.9s.2-2.7.4-3.6s.5-1.3.8-1.9s.8-1.2 1.2-1.7s1.1-.9 1.7-1.2s1.2-.6 1.9-.8s1.3-.3 2-.3s1.4.1 2 .2s1.4.5 1.9.8s1.2.8 1.7 1.2s.9 1.1 1.3 1.7s.6.9.8 1.8s.3 1.2.4 3.6s0 7.3.1 10.9s.6 7.1.7 10.7s-.1 8.4-.1 10.9s.1 1.6.1 3.9s.3 6.9.3 9.4s.2 4.3.1 5.6s-.2 1.6-.6 2.4s-1.1 1.4-1.9 1.9s-1.8 1.1-2.8 1.4s-2.2.5-3.3.5s-2.3-.2-3.3-.4s-2.1-.8-2.9-1.3s-1.4-1.3-1.9-2s-.5-1-.6-2.3zM27.3 67.4c-.2-1.3-.2-2.6-.3-5.5s-.2-8.5-.3-12.2s-.6-6.5-.6-9.8s.2-6.6.2-9.8s-.2-7.6-.1-9.8s.2-2.3.4-3.1s.4-1.3.8-1.9s.7-1.1 1.2-1.5s1-.9 1.6-1.3s1.2-.6 1.8-.7s1.4-.3 2-.3s1.4.1 2 .3s1.3.4 1.9.7s1.1.8 1.5 1.3s.9 1 1.3 1.6s.5 1 .7 1.8s.3 1.2.4 3.3s0 6.1.1 9.2s.6 6.4.8 9.6s.1 6 .3 9.7s.6 9.1.8 12.1s.3 4.3.2 5.6s-.1 1.6-.5 2.3s-1 1.4-1.7 2s-1.7 1-2.7 1.3s-2.1.6-3.2.6s-2.2 0-3.2-.3s-2-.6-2.8-1.1s-1.5-1.2-1.9-1.8s-.6-1-.7-2.3z"/><clipPath id="whLo-8"><use href="#whLo-7"/></clipPath><radialGradient id="whLo-9"><stop offset="0" stop-color="#fff2e6" stop-opacity=".8"/><stop offset=".5" stop-color="#fff2e6" stop-opacity=".3"/><stop offset="1" stop-color="#fff2e6" stop-opacity="0"/></radialGradient><radialGradient id="whLo-a"><stop offset="0" stop-color="#fbd9bf" stop-opacity=".85"/><stop offset=".55" stop-color="#fbd9bf" stop-opacity=".32"/><stop offset="1" stop-color="#fbd9bf" stop-opacity="0"/></radialGradient><radialGradient id="whLo-b"><stop offset="0" stop-color="#b87253" stop-opacity=".6"/><stop offset=".55" stop-color="#b87253" stop-opacity=".2"/><stop offset="1" stop-color="#b87253" stop-opacity="0"/></radialGradient><radialGradient id="whLo-c"><stop offset="0" stop-color="#ee8a78" stop-opacity=".55"/><stop offset=".55" stop-color="#ee8a78" stop-opacity=".2"/><stop offset="1" stop-color="#ee8a78" stop-opacity="0"/></radialGradient><linearGradient id="whLo-d" gradientUnits="userSpaceOnUse" x1="11.3" y1="85.6" x2="28.7" y2="78.9"><stop offset="0" stop-color="#d08f70"/><stop offset=".021" stop-color="#e1a585"/><stop offset=".146" stop-color="#edba98"/><stop offset=".417" stop-color="#f4c9a9"/><stop offset=".813" stop-color="#e3a888"/><stop offset="1" stop-color="#c58162"/></linearGradient><linearGradient id="whLo-e" gradientUnits="userSpaceOnUse" x1="29.8" y1="101.8" x2="13.1" y2="58.8"><stop offset="0" stop-color="#f2c3a0"/><stop offset=".066" stop-color="#f2c3a0"/><stop offset=".33" stop-color="#f2c3a0" stop-opacity="0"/><stop offset=".722" stop-color="#dc9d7e" stop-opacity="0"/><stop offset="1" stop-color="#dc9d7e" stop-opacity=".28"/></linearGradient><linearGradient id="whLo-f" gradientUnits="userSpaceOnUse" x1="10.9" y1="72.3" x2="8.4" y2="61.9"><stop offset="0" stop-color="#ebb7a5"/><stop offset=".35" stop-color="#f8d9cc"/><stop offset=".85" stop-color="#f8d9cc"/><stop offset="1" stop-color="#fdf0e8"/></linearGradient><clipPath id="whLo-g"><use href="#whLo-1"/></clipPath><linearGradient id="whLo-h" gradientUnits="userSpaceOnUse" x1="74.9" y1="47" x2="89.3" y2="47.8"><stop offset="0" stop-color="#e2a787"/><stop offset=".042" stop-color="#edbb99"/><stop offset=".271" stop-color="#fbddc7"/><stop offset=".708" stop-color="#e5ac8c"/><stop offset=".958" stop-color="#c07b5c"/><stop offset="1" stop-color="#c58162"/></linearGradient><linearGradient id="whLo-i" gradientUnits="userSpaceOnUse" x1="80.2" y1="72.9" x2="82.8" y2="26.6"><stop offset="0" stop-color="#f2c3a0"/><stop offset=".05" stop-color="#f2c3a0"/><stop offset=".274" stop-color="#f2c3a0" stop-opacity="0"/><stop offset=".83" stop-color="#dc9d7e" stop-opacity="0"/><stop offset="1" stop-color="#dc9d7e" stop-opacity=".3"/></linearGradient><linearGradient id="whLo-j" gradientUnits="userSpaceOnUse" x1="82.6" y1="36.1" x2="82.7" y2="28"><stop offset="0" stop-color="#ebb7a5"/><stop offset=".35" stop-color="#f8d9cc"/><stop offset=".85" stop-color="#f8d9cc"/><stop offset="1" stop-color="#fdf0e8"/></linearGradient><clipPath id="whLo-k"><use href="#whLo-2"/></clipPath><linearGradient id="whLo-l" gradientUnits="userSpaceOnUse" x1="59.1" y1="35" x2="75.3" y2="35.3"><stop offset="0" stop-color="#e1a686"/><stop offset=".042" stop-color="#edba98"/><stop offset=".292" stop-color="#fadbc4"/><stop offset=".833" stop-color="#d9997a"/><stop offset=".917" stop-color="#c17d5e"/><stop offset="1" stop-color="#c58162"/></linearGradient><linearGradient id="whLo-m" gradientUnits="userSpaceOnUse" x1="66.3" y1="66.2" x2="67.3" y2="8.7"><stop offset="0" stop-color="#f2c3a0"/><stop offset=".035" stop-color="#f2c3a0"/><stop offset=".252" stop-color="#f2c3a0" stop-opacity="0"/><stop offset=".834" stop-color="#dc9d7e" stop-opacity="0"/><stop offset="1" stop-color="#dc9d7e" stop-opacity=".3"/></linearGradient><linearGradient id="whLo-n" gradientUnits="userSpaceOnUse" x1="67.3" y1="19.3" x2="67.3" y2="10.2"><stop offset="0" stop-color="#ebb7a5"/><stop offset=".35" stop-color="#f8d9cc"/><stop offset=".85" stop-color="#f8d9cc"/><stop offset="1" stop-color="#fdf0e8"/></linearGradient><clipPath id="whLo-o"><use href="#whLo-3"/></clipPath><linearGradient id="whLo-p" gradientUnits="userSpaceOnUse" x1="42.3" y1="31.1" x2="59.2" y2="30.9"><stop offset="0" stop-color="#e0a585"/><stop offset=".042" stop-color="#ecb997"/><stop offset=".292" stop-color="#fadac2"/><stop offset=".833" stop-color="#da9a7b"/><stop offset=".938" stop-color="#bd7859"/><stop offset="1" stop-color="#c58162"/></linearGradient><linearGradient id="whLo-q" gradientUnits="userSpaceOnUse" x1="51.1" y1="63.7" x2="50.5" y2="2.9"><stop offset="0" stop-color="#f2c3a0"/><stop offset=".031" stop-color="#f2c3a0"/><stop offset=".248" stop-color="#f2c3a0" stop-opacity="0"/><stop offset=".834" stop-color="#dc9d7e" stop-opacity="0"/><stop offset="1" stop-color="#dc9d7e" stop-opacity=".3"/></linearGradient><linearGradient id="whLo-r" gradientUnits="userSpaceOnUse" x1="50.6" y1="14" x2="50.5" y2="4.5"><stop offset="0" stop-color="#ebb7a5"/><stop offset=".35" stop-color="#f8d9cc"/><stop offset=".85" stop-color="#f8d9cc"/><stop offset="1" stop-color="#fdf0e8"/></linearGradient><clipPath id="whLo-s"><use href="#whLo-4"/></clipPath><linearGradient id="whLo-t" gradientUnits="userSpaceOnUse" x1="26.1" y1="37.2" x2="42.6" y2="36.8"><stop offset="0" stop-color="#e0a484"/><stop offset=".042" stop-color="#ecb896"/><stop offset=".292" stop-color="#fad9c0"/><stop offset=".75" stop-color="#e2a888"/><stop offset=".958" stop-color="#c07b5c"/><stop offset="1" stop-color="#c58162"/></linearGradient><linearGradient id="whLo-u" gradientUnits="userSpaceOnUse" x1="35.6" y1="67.1" x2="34" y2="11.5"><stop offset="0" stop-color="#f2c3a0"/><stop offset=".037" stop-color="#f2c3a0"/><stop offset=".255" stop-color="#f2c3a0" stop-opacity="0"/><stop offset=".831" stop-color="#dc9d7e" stop-opacity="0"/><stop offset="1" stop-color="#dc9d7e" stop-opacity=".3"/></linearGradient><linearGradient id="whLo-v" gradientUnits="userSpaceOnUse" x1="34" y1="22.4" x2="34" y2="13.1"><stop offset="0" stop-color="#ebb7a5"/><stop offset=".35" stop-color="#f8d9cc"/><stop offset=".85" stop-color="#f8d9cc"/><stop offset="1" stop-color="#fdf0e8"/></linearGradient><clipPath id="whLo-w"><use href="#whLo-5"/></clipPath><linearGradient id="whLo-x" gradientUnits="userSpaceOnUse" x1="58.1" y1="64.6" x2="58.1" y2="89.8"><stop offset="0" stop-color="#b87253" stop-opacity="0"/><stop offset="1" stop-color="#b87253"/></linearGradient><linearGradient id="whLo-y" gradientUnits="userSpaceOnUse" x1="58.1" y1="108.8" x2="58.1" y2="131.2"><stop offset="0" stop-color="#f9d6bc" stop-opacity="0"/><stop offset="1" stop-color="#f9d6bc"/></linearGradient><clipPath id="whLo-z"><use href="#whLo-6"/></clipPath><radialGradient id="whLo-10"><stop offset="0" stop-color="#2f6644" stop-opacity=".5"/><stop offset=".6" stop-color="#2f6644" stop-opacity=".18"/><stop offset="1" stop-color="#2f6644" stop-opacity="0"/></radialGradient><radialGradient id="whLo-11"><stop offset="0" stop-color="#95d0aa" stop-opacity=".42"/><stop offset=".6" stop-color="#95d0aa" stop-opacity=".14"/><stop offset="1" stop-color="#95d0aa" stop-opacity="0"/></radialGradient><linearGradient id="whLo-12" gradientUnits="userSpaceOnUse" x1="10.6" y1="128.4" x2="105.5" y2="128.4"><stop offset="0" stop-color="#579f72"/><stop offset=".16" stop-color="#6db487"/><stop offset=".4" stop-color="#66ae81"/><stop offset=".62" stop-color="#5ca679"/><stop offset=".86" stop-color="#4d9266"/><stop offset="1" stop-color="#42825a"/></linearGradient></defs><path d="M13 330.8c0 .4.6-.9 1.9-1.5s3.2-1.3 5.9-2.1s7.7-1.6 10.4-2.2s4.3-1.2 6.4-1.7s3.8-1.1 6.4-1.5s6.8-.9 9.3-1s3.4.1 5.8.3s5.7.6 8.5.9s5.8.5 8.1.8s2.9.3 5.4.8s7.1 1.6 10 2.3s5.7 1.6 7.4 2.2s2.1.9 2.9 1.4s2 2 2 1.6s-1.1-2.9-2-4.1s-1.2-1.6-2.9-2.7s-5-3-7.4-4.1s-4.9-2.1-7.1-2.8s-3.8-1.3-5.6-1.8s-2.6-.6-5.4-1s-8.7-1.3-11.1-1.6s-1.4-.2-2.8-.3s-3.8-.4-5.8-.3s-4 .3-6.1.7s-4.2 1-6.4 1.6s-3.7 1.2-6.4 2.3s-7.2 2.6-10 3.9s-5.3 2.6-6.8 3.6s-2 1.4-2.7 2.4s-1.9 3.5-1.9 3.9z" fill="#1f482f"/><path d="M13 330.8c.3-.6 1.1-2.8 1.9-3.9s1.1-1.4 2.7-2.4s3.9-2.4 6.8-3.6s7.3-2.9 10-3.9s4.3-1.6 6.4-2.3s4.3-1.2 6.4-1.6s4.1-.6 6.1-.7s4.4.2 5.8.3s.5 0 2.8.3s8.4 1.1 11.1 1.6s3.5.5 5.4 1s3.5 1 5.6 1.8s4.7 1.6 7.1 2.8s5.7 2.9 7.4 4.1s2.1 1.6 2.9 2.7s1.7 3.4 2 4.1" fill="none" stroke="#4a8e63" stroke-width="1.3" stroke-opacity=".9" stroke-linecap="round" stroke-linejoin="round"/><use href="#whLo-7" fill="none" stroke="#b67455" stroke-width="1.2" stroke-opacity=".75" stroke-linejoin="round"/><use href="#whLo-7" fill="#f2c3a0"/><use href="#whLo-1" fill="url(#whLo-d)"/><use href="#whLo-1" fill="url(#whLo-e)"/><path d="M19.7 77.5c-.1.1-.7.1-1.1.2s-.7.2-1.1.3s-.7.3-1 .5s-.8.6-1 .7" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".132" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.9 75.6c-.1 0-.6-.1-.9-.1s-.6.1-.8.2s-.5.3-.7.5s-.5.5-.6.7" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".09" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.7 72.3c-.3.2-.9 1.2-1.5 1.4s-1.5-.5-1.9-.6" fill="none" stroke="#f9d6bc" stroke-width="2.1" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.4 61.9c-.3.2-.9.8-1.1 1.6s-.1 1.9.2 3.2s1.1 3.9 1.5 4.9s.7.7 1 .8s.6.1.9-.1s1-.2 1.2-.8s.2-1.7-.1-3s-.9-3.7-1.4-4.9s-1.3-1.4-1.7-1.7s-.3-.3-.5 0z" fill="url(#whLo-f)" stroke="#d39a84" stroke-width=".8" stroke-opacity=".45"/><path d="M12.3 70.3c-.1.1-.2.6-.4 1s-.6.8-1 .9s-1-.2-1.3-.4s-.7-.6-.8-.7" fill="none" stroke="#c47f62" stroke-width="1.2" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.3 69.5c-.1-.2-.2-.9-.3-1.4s-.3-.9-.4-1.3s-.2-.9-.3-1.4s-.3-1.1-.3-1.3" fill="none" stroke="#fff7f2" stroke-width="1.2" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whLo-g)"><ellipse cx="15.1" cy="67" rx="8.8" ry="9.7" transform="rotate(-13.7 15.1 67)" fill="url(#whLo-c)" fill-opacity=".26"/></g><use href="#whLo-2" fill="url(#whLo-h)"/><use href="#whLo-2" fill="url(#whLo-i)"/><path d="M83.7 50.4c-.2-.1-.7-.2-1.1-.3s-.7-.1-1.1-.2s-.7 0-1.1 0s-.9.2-1.1.2" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".22" stroke-linecap="round" stroke-linejoin="round"/><path d="M82.9 48.4c-.1 0-.5-.2-.7-.3s-.6-.2-.8-.2s-.6 0-.8.1s-.7.2-.9.2" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".15" stroke-linecap="round" stroke-linejoin="round"/><path d="M83.7 37.9c-.1 0-.5-.2-.8-.2s-.5-.1-.7-.1s-.6 0-.8 0s-.7.2-.8.2" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".121" stroke-linecap="round" stroke-linejoin="round"/><path d="M83.1 36.1c-.1 0-.4-.2-.6-.3s-.4-.1-.5-.1s-.4 0-.6 0s-.5.3-.6.3" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".083" stroke-linecap="round" stroke-linejoin="round"/><path d="M85.7 36.4c-.5.2-2.1.8-3.1.7s-2.5-.6-3-.8" fill="none" stroke="#f9d6bc" stroke-width="1.6" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M82.7 28c-.5.1-1.9.4-2.5.9s-.9 1.7-1.1 2.4s-.1 1.5 0 2.2s.3 1.3.6 1.7s.8.6 1.3.8s1 .1 1.6.1s1.9-.1 2.4-.4s.8-.8 1-1.1s.1-.5.2-1s.2-1.5.1-2.2s0-1.1-.5-1.7s-1.6-1.3-2.1-1.6s-.4-.3-1-.1z" fill="url(#whLo-j)" stroke="#d39a84" stroke-width=".6" stroke-opacity=".45"/><path d="M85.9 34.9c-.5.2-2.2 1.1-3.3 1.1s-2.7-1-3.2-1.2" fill="none" stroke="#c47f62" stroke-width=".9" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M81 33.7c0-.2 0-.7.1-1s0-.8 0-1.1s0-.7 0-1.1s0-.8 0-1" fill="none" stroke="#fff7f2" stroke-width=".9" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whLo-k)"><ellipse cx="82" cy="49.5" rx="6.5" ry="8" transform="rotate(3.8 82 49.5)" fill="url(#whLo-c)" fill-opacity=".28"/><ellipse cx="82.7" cy="32" rx="7" ry="8" transform="rotate(.8 82.7 32)" fill="url(#whLo-c)" fill-opacity=".3"/></g><use href="#whLo-3" fill="url(#whLo-l)"/><use href="#whLo-3" fill="url(#whLo-m)"/><path d="M69.1 38.7c-.3 0-.9-.2-1.3-.2s-.8-.1-1.2-.1s-.8 0-1.2 0s-1.1.2-1.3.2" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".22" stroke-linecap="round" stroke-linejoin="round"/><path d="M68.1 36.6c-.1-.1-.6-.3-.9-.4s-.6-.1-.9-.1s-.6 0-.9.1s-.7.3-.9.3" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".15" stroke-linecap="round" stroke-linejoin="round"/><path d="M68.6 22.9c-.2 0-.6-.2-.9-.2s-.6-.1-.8-.1s-.6 0-.9 0s-.7.2-.9.3" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".121" stroke-linecap="round" stroke-linejoin="round"/><path d="M67.8 20.9c-.1-.1-.4-.3-.6-.4s-.4-.1-.6-.1s-.5.1-.7.1s-.5.3-.6.4" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".083" stroke-linecap="round" stroke-linejoin="round"/><path d="M70.8 19.7c-.6.1-2.3.8-3.5.8s-2.8-.7-3.4-.8" fill="none" stroke="#f9d6bc" stroke-width="1.8" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M67.3 10.2c-.3 0-.6-.1-1 .1s-1.4.6-1.9 1s-.8 1.3-1 1.8s-.1.4-.1 1s-.1 1.6 0 2.3s.4 1.5.7 2s.9.7 1.5.8s1.1.2 1.8.1s2.1-.1 2.7-.4s.9-.9 1.1-1.3s.2-.6.2-1.2s.2-1.7.1-2.4s-.2-1.3-.6-1.9s-1-1.1-1.5-1.4s-.6-.3-.9-.4s-.7-.1-1.1-.1z" fill="url(#whLo-n)" stroke="#d39a84" stroke-width=".7" stroke-opacity=".45"/><path d="M71 17.9c-.2.1-.6.5-1.2.8s-1.9.5-2.5.6s-.6.1-1.2-.2s-2-1-2.4-1.2" fill="none" stroke="#c47f62" stroke-width="1.1" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M65.5 16.7c0-.2 0-.8 0-1.2s0-.8 0-1.2s0-.8 0-1.2s0-1 0-1.2" fill="none" stroke="#fff7f2" stroke-width="1.1" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whLo-o)"><ellipse cx="67.1" cy="37.9" rx="7.4" ry="9" transform="rotate(1.3 67.1 37.9)" fill="url(#whLo-c)" fill-opacity=".28"/><ellipse cx="67.3" cy="14.7" rx="7.9" ry="9" transform="rotate(-.1 67.3 14.7)" fill="url(#whLo-c)" fill-opacity=".3"/></g><use href="#whLo-4" fill="url(#whLo-p)"/><use href="#whLo-4" fill="url(#whLo-q)"/><path d="M52.9 34.7c-.2 0-.9-.1-1.3-.2s-.9-.1-1.3-.1s-.8.1-1.3.1s-1 .3-1.2.3" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".22" stroke-linecap="round" stroke-linejoin="round"/><path d="M51.8 32.5c-.1 0-.6-.3-.9-.3s-.6-.2-1-.2s-.6.1-.9.2s-.8.3-.9.4" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".15" stroke-linecap="round" stroke-linejoin="round"/><path d="M52 17.9c-.2 0-.6-.1-.9-.2s-.6-.1-.9-.1s-.6.1-.9.1s-.8.2-.9.3" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".121" stroke-linecap="round" stroke-linejoin="round"/><path d="M51.2 15.9c-.2-.1-.5-.3-.7-.4s-.5-.1-.7-.1s-.4 0-.6.1s-.6.3-.7.4" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".083" stroke-linecap="round" stroke-linejoin="round"/><path d="M54.2 14.4c-.6.1-2.4.9-3.6.9s-3-.7-3.6-.9" fill="none" stroke="#f9d6bc" stroke-width="1.9" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M50.5 4.5c-.4 0-.6-.1-1.1.1s-1.4.6-1.9 1.1s-.9 1.3-1.1 1.8s-.1.4-.1 1s0 1.8.1 2.5s.3 1.6.7 2s1 .8 1.6.9s1.1.2 1.9.1s2.2-.1 2.8-.4s.9-1 1.1-1.5s.2-.5.3-1.2s.1-1.7 0-2.5s-.2-1.4-.6-2s-1.1-1.1-1.6-1.4s-.6-.3-1-.4s-.7-.1-1.1-.1z" fill="url(#whLo-r)" stroke="#d39a84" stroke-width=".7" stroke-opacity=".45"/><path d="M54.4 12.5c-.4.2-1.9 1.1-2.5 1.3s-.9.2-1.3.2s-.6 0-1.3-.2s-2.1-1-2.5-1.2" fill="none" stroke="#c47f62" stroke-width="1.1" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M48.7 11.3c0-.2 0-.9 0-1.3s-.1-.8-.1-1.2s0-.8 0-1.3s0-1 0-1.2" fill="none" stroke="#fff7f2" stroke-width="1.1" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whLo-s)"><ellipse cx="50.8" cy="33.9" rx="7.7" ry="9.4" transform="rotate(-.6 50.8 33.9)" fill="url(#whLo-c)" fill-opacity=".28"/><ellipse cx="50.6" cy="9.2" rx="8.3" ry="9.5" transform="rotate(-.6 50.6 9.2)" fill="url(#whLo-c)" fill-opacity=".3"/></g><use href="#whLo-5" fill="url(#whLo-t)"/><use href="#whLo-5" fill="url(#whLo-u)"/><path d="M36.4 40.4c-.2-.1-.8-.2-1.2-.2s-.9-.1-1.3-.1s-.8.1-1.2.1s-1.1.3-1.3.3" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".22" stroke-linecap="round" stroke-linejoin="round"/><path d="M35.3 38.2c-.1 0-.6-.2-.9-.3s-.6-.1-.9-.1s-.6.1-.9.2s-.8.3-.9.4" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".15" stroke-linecap="round" stroke-linejoin="round"/><path d="M35.3 25.2c-.1 0-.6-.2-.9-.2s-.5-.1-.8-.1s-.6.1-.9.1s-.8.2-.9.3" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".121" stroke-linecap="round" stroke-linejoin="round"/><path d="M34.5 23.2c-.1-.1-.4-.3-.6-.4s-.5-.1-.7-.1s-.4.1-.6.2s-.6.3-.7.3" fill="none" stroke="#c47f62" stroke-width=".5" stroke-opacity=".083" stroke-linecap="round" stroke-linejoin="round"/><path d="M37.5 22.7c-.6.2-2.3.9-3.5.9s-2.9-.7-3.5-.9" fill="none" stroke="#f9d6bc" stroke-width="1.8" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 13.1c-.3 0-.6-.1-1.1.1s-1.4.7-1.8 1s-.5.3-.7.8s-.5 1.2-.5 2s-.1 1.7 0 2.4s.4 1.5.7 2s1 .7 1.5.9s1.1.1 1.9.1s2.1-.2 2.8-.5s.8-.9 1-1.3s.2-.6.3-1.2s.1-1.7.1-2.4s-.4-1.5-.6-2s-.2-.5-.7-.8s-1.3-.8-1.8-1s-.7-.1-1.1-.1z" fill="url(#whLo-v)" stroke="#d39a84" stroke-width=".7" stroke-opacity=".45"/><path d="M37.7 20.9c-.2.2-.6.6-1.2.8s-1.7.6-2.5.6s-1.9-.4-2.5-.6s-1-.6-1.2-.8" fill="none" stroke="#c47f62" stroke-width="1.1" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M32.1 19.7c0-.2 0-.8 0-1.2s0-.9 0-1.3s0-.8 0-1.2s0-1 0-1.2" fill="none" stroke="#fff7f2" stroke-width="1.1" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whLo-w)"><ellipse cx="34.4" cy="39.6" rx="7.5" ry="9.2" transform="rotate(-2.1 34.4 39.6)" fill="url(#whLo-c)" fill-opacity=".28"/><ellipse cx="34" cy="17.7" rx="8.1" ry="9.2" transform="rotate(0 34 17.7)" fill="url(#whLo-c)" fill-opacity=".3"/></g><g clip-path="url(#whLo-8)"><path d="M88.3 68.8c.1.6.3 2.2.3 3.6s-.1 2.2-.4 4.7s-1 7.7-1.3 10.2s-.4 3.2-.5 4.7s-.2 1.5-.5 4.2s-.8 7.9-1.2 11.7s-.6 7.7-.9 11.1s-.5 6.7-.4 9.4s.8 4.2.9 7s-.1 6.8 0 9.8s0 5.2 0 8.4s.2 7.9.2 10.7s.1 4 .2 6.1s.1 4.4.2 6.7s.1 4.9.2 7.4s.2 5.2.3 7.9s.2 5.3.3 7.9s.2 5.3.4 7.9s.2 5.1.4 7.7s.3 5.3.5 7.9s.3 5.2.5 7.8s.4 5.3.5 7.9s.4 5.3.6 7.9s.4 5.2.6 7.8s.4 5.3.6 7.9s.4 5.2.6 7.8s.4 5.2.6 7.9s.4 5.1.5 7.8s.3 5.3.4 8.1s.3 5.6.4 8.3s.2 5.6.3 8.2s.2 5.3.3 7.7s-.1 4.7.2 6.9s.4 3.3 1.3 6.1s3.7 8.2 4.4 10.6s.3 2.9-.6 4.1s-3.9 2.5-4.6 3" fill="none" stroke="url(#whLo-x)" stroke-width="30.8" stroke-opacity=".07" stroke-linecap="round" stroke-linejoin="round"/><path d="M88.3 68.8c.1.6.3 2.2.3 3.6s-.1 2.2-.4 4.7s-1 7.7-1.3 10.2s-.4 3.2-.5 4.7s-.2 1.5-.5 4.2s-.8 7.9-1.2 11.7s-.6 7.7-.9 11.1s-.5 6.7-.4 9.4s.8 4.2.9 7s-.1 6.8 0 9.8s0 5.2 0 8.4s.2 7.9.2 10.7s.1 4 .2 6.1s.1 4.4.2 6.7s.1 4.9.2 7.4s.2 5.2.3 7.9s.2 5.3.3 7.9s.2 5.3.4 7.9s.2 5.1.4 7.7s.3 5.3.5 7.9s.3 5.2.5 7.8s.4 5.3.5 7.9s.4 5.3.6 7.9s.4 5.2.6 7.8s.4 5.3.6 7.9s.4 5.2.6 7.8s.4 5.2.6 7.9s.4 5.1.5 7.8s.3 5.3.4 8.1s.3 5.6.4 8.3s.2 5.6.3 8.2s.2 5.3.3 7.7s-.1 4.7.2 6.9s.4 3.3 1.3 6.1s3.7 8.2 4.4 10.6s.3 2.9-.6 4.1s-3.9 2.5-4.6 3" fill="none" stroke="url(#whLo-x)" stroke-width="16.8" stroke-opacity=".09" stroke-linecap="round" stroke-linejoin="round"/><path d="M88.3 68.8c.1.6.3 2.2.3 3.6s-.1 2.2-.4 4.7s-1 7.7-1.3 10.2s-.4 3.2-.5 4.7s-.2 1.5-.5 4.2s-.8 7.9-1.2 11.7s-.6 7.7-.9 11.1s-.5 6.7-.4 9.4s.8 4.2.9 7s-.1 6.8 0 9.8s0 5.2 0 8.4s.2 7.9.2 10.7s.1 4 .2 6.1s.1 4.4.2 6.7s.1 4.9.2 7.4s.2 5.2.3 7.9s.2 5.3.3 7.9s.2 5.3.4 7.9s.2 5.1.4 7.7s.3 5.3.5 7.9s.3 5.2.5 7.8s.4 5.3.5 7.9s.4 5.3.6 7.9s.4 5.2.6 7.8s.4 5.3.6 7.9s.4 5.2.6 7.8s.4 5.2.6 7.9s.4 5.1.5 7.8s.3 5.3.4 8.1s.3 5.6.4 8.3s.2 5.6.3 8.2s.2 5.3.3 7.7s-.1 4.7.2 6.9s.4 3.3 1.3 6.1s3.7 8.2 4.4 10.6s.3 2.9-.6 4.1s-3.9 2.5-4.6 3" fill="none" stroke="url(#whLo-x)" stroke-width="7" stroke-opacity=".11" stroke-linecap="round" stroke-linejoin="round"/><path d="M26.6 349.6c-.7-.5-3.8-1.7-4.7-2.8s-1.2-1.5-.6-3.7s3.3-7.4 4.2-10s1.1-3.8 1.4-5.9s.1-4.4.1-6.8s.2-5 .3-7.7s.2-5.5.3-8.2s.2-5.7.3-8.4s.3-5.4.5-8.1s.4-5.2.6-7.8s.4-5.3.6-7.9s.5-5.2.8-7.8s.5-5.3.8-7.9s.5-5.2.8-7.8s.6-5.2.9-7.9s.7-5.2 1-7.9s.7-5.2 1-7.8s.7-5.3.9-7.9s.6-5.1.9-7.7s.4-5.2.6-7.8s.4-5.3.6-7.9s.3-5.2.5-7.8s.3-5 .4-7.4s.2-3.7.4-6.9s.4-9.5.6-12.6s.1-3.1.2-5.7s.2-6.6.3-9.7s.4-6 .4-9.2s-.1-7.5-.3-10.1s-.4-3.7-.7-5s-.1-1.2-.7-2.3s-1.3-2.7-2.4-4.5s-3.8-4.9-4.6-5.9" fill="none" stroke="url(#whLo-y)" stroke-width="12.6" stroke-opacity=".13" stroke-linecap="round" stroke-linejoin="round"/><path d="M25 349.6c-.8-.5-3.9-1.7-4.8-2.8s-1.2-1.5-.6-3.7s3.3-7.4 4.3-10s1-3.8 1.3-5.9s.1-4.4.2-6.8s.1-5 .2-7.7s.2-5.5.3-8.2s.2-5.7.3-8.4s.3-5.4.5-8.1s.4-5.2.6-7.8s.4-5.3.7-7.9s.5-5.2.7-7.8s.6-5.3.8-7.9s.6-5.2.9-7.8s.5-5.2.8-7.9s.7-5.2 1-7.9s.7-5.2 1-7.8s.7-5.3 1-7.9s.5-5.1.8-7.7s.4-5.2.6-7.8s.4-5.3.6-7.9s.3-5.2.5-7.8s.3-5 .4-7.4s.2-3.7.4-6.9s.4-9.5.6-12.6s.1-3.1.2-5.7s.2-6.6.3-9.7s.4-6 .4-9.2s-.1-7.5-.2-10.1s-.5-3.7-.7-5s-.2-1.2-.7-2.3s-1.4-2.7-2.5-4.5s-3.8-4.9-4.5-5.9" fill="none" stroke="url(#whLo-y)" stroke-width="6.2" stroke-opacity=".16" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.6 349.6c-.7-.5-3.8-1.7-4.7-2.8s-1.2-1.5-.6-3.7s3.3-7.4 4.2-10s1.1-3.8 1.4-5.9s.1-4.4.1-6.8s.2-5 .3-7.7s.2-5.5.3-8.2s.2-5.7.3-8.4s.3-5.4.5-8.1s.4-5.2.6-7.8s.4-5.3.6-7.9s.5-5.2.8-7.8s.5-5.3.8-7.9s.5-5.2.8-7.8s.6-5.2.9-7.9s.7-5.2 1-7.9s.7-5.2 1-7.8s.7-5.3.9-7.9s.6-5.1.9-7.7s.4-5.2.6-7.8s.4-5.3.6-7.9s.3-5.2.5-7.8s.3-5 .4-7.4s.2-3.7.4-6.9s.4-9.5.6-12.6s.1-3.1.2-5.7s.2-6.6.3-9.7s.4-6 .4-9.2s-.1-7.5-.3-10.1s-.4-3.7-.7-5s-.1-1.2-.7-2.3s-1.3-2.7-2.4-4.5s-3.8-4.9-4.6-5.9" fill="none" stroke="#dc9d7e" stroke-width="3.1" stroke-opacity=".14" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="51.1" cy="90.6" rx="23.8" ry="30.8" transform="rotate(-6 51.1 90.6)" fill="url(#whLo-9)" fill-opacity=".4"/><ellipse cx="46.9" cy="85" rx="11.2" ry="16.8" transform="rotate(-8 46.9 85)" fill="url(#whLo-9)" fill-opacity=".3"/><ellipse cx="73.2" cy="97.6" rx="11.2" ry="23.8" transform="rotate(-4 73.2 97.6)" fill="url(#whLo-b)" fill-opacity=".2"/><ellipse cx="79.4" cy="134.8" rx="5" ry="6.2" fill="url(#whLo-9)" fill-opacity=".16"/><ellipse cx="81.3" cy="141.7" rx="4.2" ry="5" fill="url(#whLo-b)" fill-opacity=".1"/><path d="M46.9 129c1.2.1 6.1.8 7.3.9" fill="none" stroke="#c47f62" stroke-width=".6" stroke-opacity=".1" stroke-linecap="round" stroke-linejoin="round"/><path d="M59 130.2c1.1-.1 5.3-.6 6.4-.7" fill="none" stroke="#c47f62" stroke-width=".6" stroke-opacity=".1" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="36" cy="285.2" rx="10.5" ry="36.4" transform="rotate(3 36 285.2)" fill="url(#whLo-9)" fill-opacity=".28"/><ellipse cx="38.2" cy="195.6" rx="7.7" ry="30.8" transform="rotate(2 38.2 195.6)" fill="url(#whLo-9)" fill-opacity=".14"/><ellipse cx="70.3" cy="274" rx="9.8" ry="47.6" transform="rotate(-3 70.3 274)" fill="url(#whLo-b)" fill-opacity=".1"/><path d="M33.4 60.8c.3.2 1.3 1.1 2 1.1s1.7-.9 2-1.1" fill="none" stroke="#c47f62" stroke-width=".7" stroke-opacity=".28" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="35.4" cy="61.5" rx="8.4" ry="6.7" fill="url(#whLo-c)" fill-opacity=".16"/><path d="M49 57.4c.3.2 1.4 1.1 2.1 1.1s1.7-.9 2.1-1.1" fill="none" stroke="#c47f62" stroke-width=".7" stroke-opacity=".28" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="51.1" cy="58.1" rx="8.7" ry="6.9" fill="url(#whLo-c)" fill-opacity=".16"/><path d="M64.5 59.9c.3.2 1.3 1.2 2 1.2s1.6-1 2-1.2" fill="none" stroke="#c47f62" stroke-width=".7" stroke-opacity=".28" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="66.5" cy="60.6" rx="8.3" ry="6.7" fill="url(#whLo-c)" fill-opacity=".16"/><path d="M78.8 66.7c.3.1 1.2 1.1 1.8 1.1s1.5-1 1.8-1.1" fill="none" stroke="#c47f62" stroke-width=".7" stroke-opacity=".28" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="80.6" cy="67.4" rx="7.4" ry="5.9" fill="url(#whLo-c)" fill-opacity=".16"/></g><path d="M14.8 331.7c.3.7.5-.9 1.8-1.5s3.1-1.4 5.7-2.1s6.8-1.5 10-2.3s6.2-1.8 9.2-2.5s6.2-1.3 9.1-1.6s5.7 0 8.5.2s5.5.7 8.1 1s5.6.4 7.8.7s2.7.3 5.2.8s6.8 1.6 9.6 2.4s5.4 1.6 7.1 2.1s2 .9 2.8 1.4s1.6 2.4 1.9 1.7s.3-4.7 0-5.9s-1.1-1.2-1.9-1.7s-1.2-.7-2.8-1.3s-4.3-1.5-7.1-2.2s-7.1-1.8-9.6-2.3s-3.1-.6-5.2-.9s-5.1-.4-7.8-.7s-5.9-.8-8.1-1s-3.2-.4-5.6-.3s-6.4.6-8.9 1.1s-4.1.9-6.2 1.4s-3.4 1.1-6.1 1.7s-7.4 1.6-10 2.3s-4.5 1.5-5.7 2.1s-1.5.3-1.8 1.5s-.3 5.1 0 5.9z" fill="#b87253" fill-opacity=".12"/><use href="#whLo-6" fill="none" stroke="#2d6142" stroke-width="1.3" stroke-opacity=".9"/><use href="#whLo-6" fill="url(#whLo-12)"/><g clip-path="url(#whLo-z)"><path d="M13 332.8c.3-.3.6-.9 1.9-1.5s3.2-1.4 5.9-2.1s7.7-1.6 10.4-2.3s4.3-1.1 6.4-1.7s3.8-1 6.4-1.4s6.8-1 9.3-1.1s3.4.1 5.8.3s5.7.7 8.5 1s5.8.5 8.1.7s2.9.3 5.4.9s7.1 1.5 10 2.3s5.7 1.6 7.4 2.2s2.1.8 2.9 1.3s1.7 1.4 2 1.7" fill="none" stroke="#95d0aa" stroke-width="2.5" stroke-opacity=".2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.9 336.7c.3-.2.5-.9 1.8-1.5s3.2-1.4 5.9-2.1s7.4-1.6 10.2-2.3s4.1-1.1 6.2-1.6s3.8-1.1 6.3-1.5s6.6-.9 9.1-1.1s3.3.1 5.7.3s5.6.7 8.3 1s5.7.5 7.9.8s2.8.3 5.4.8s6.9 1.6 9.7 2.3s5.6 1.6 7.3 2.2s2.1.9 2.9 1.4s1.6 1.3 1.9 1.6" fill="none" stroke="#3f8259" stroke-width=".6" stroke-dasharray="1.6 1.3" stroke-opacity=".8"/><path d="M13.9 339.2c.3-.2.5-.9 1.8-1.5s3.2-1.3 5.9-2.1s7.4-1.6 10.2-2.2s4.1-1.2 6.2-1.7s3.8-1.1 6.3-1.5s6.6-.9 9.1-1s3.3.1 5.7.3s5.6.6 8.3.9s5.7.5 7.9.8s2.8.3 5.4.8s6.9 1.6 9.7 2.3s5.6 1.6 7.3 2.2s2.1.9 2.9 1.4s1.6 1.3 1.9 1.6" fill="none" stroke="#3f8259" stroke-width=".6" stroke-dasharray="1.6 1.3" stroke-opacity=".7"/><path d="M14.3 341.5c.3-.3.6-.9 1.9-1.5s3.1-1.4 5.7-2.1s7.4-1.6 10.2-2.3s4-1.2 6.1-1.7s3.7-1 6.3-1.5s6.5-.9 8.9-1s3.4.1 5.7.3s5.5.7 8.2 1s5.7.4 7.8.7s2.8.3 5.3.8s6.9 1.6 9.7 2.4s5.5 1.6 7.2 2.1s2 .9 2.8 1.4s1.6 1.4 2 1.7" fill="none" stroke="#2f6644" stroke-width="2.2" stroke-opacity=".12" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="36.4" cy="353.1" rx="20.3" ry="6.2" transform="rotate(31.1 36.4 353.1)" fill="url(#whLo-10)" fill-opacity=".6"/><ellipse cx="40.1" cy="347" rx="17.9" ry="4.9" transform="rotate(31.1 40.1 347)" fill="url(#whLo-11)" fill-opacity=".57"/><ellipse cx="83.2" cy="362.9" rx="19" ry="5.6" transform="rotate(-28.5 83.2 362.9)" fill="url(#whLo-10)" fill-opacity=".5"/><ellipse cx="80.1" cy="357.2" rx="16.8" ry="4.5" transform="rotate(-28.5 80.1 357.2)" fill="url(#whLo-11)" fill-opacity=".475"/></g></svg>'},
  },
  teacher:{
    point:{w:147,h:660,tip:[31.1,7.5],wrist:[62,172.3],
      svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 147 660" width="147" height="660"><g class="wh-shadow" fill="#3a2410"><path fill-opacity=".035" d="M29.6 3.6c1.7-.3 4.5-.3 6.2.6s1-5.3 4.1 4.8s10.3 46.5 14.6 55.8s7.8-1.2 11.3-.2s7.2 5 10 6s4.7-.5 6.9-.3s4.1.8 6.1 1.9s4.3 2.7 5.7 4.8s.6 6.1 2.8 7.8s7.5 1 10 2.4s3.7 0 5 6.1s2.7 14.9 3.1 30.1s-1.7 48.6-.7 61s5.5 6.7 6.9 13.1s.2 19.7 1.3 25.2s4.4 4.9 5.3 7.6s-.6 3.9 0 8.6s3.2 11.5 3.6 19.5s-1.6 11.6-1.1 28.7s3.6 51.4 4.1 73.6s-1.5 28.7-1.1 59.9s1.4 89.8 3.3 127.2s6.3 76.2 7.8 97.5s1.2 20.9 1.1 30.1s-.1 17.4-1.5 24.9s-3.3 14.8-6.8 20.4s-8.7 9.6-14.5 13s-13.1 6-20.3 7.6s-15 2.4-22.6 2.4s-15.6-.7-23-2.4s-15-4.2-20.8-7.7s-10.8-7.3-14.3-13.3s-5.5-14-6.8-22.6s-1.2-19.8-1.2-29s-.2-7.4 1.2-26s6-56.6 7.4-85.6s.4-66.3 1.1-88.5s2.6-25.5 3-45s-.8-55-.7-72.2s.4-21 1.1-30.9s2.7-19.4 2.9-28.2s-1.6-14.4-1.4-24.6s1.3-29.1 2.7-36.7s4.5-3.2 5.7-8.9s.3-19.4 1.5-24.9s5.5-3.3 5.7-8s-2.7-15.6-4.2-20.3s-2.6-5.6-4.6-8.1s-5.2-3.8-7.3-6.4s-3.1-2.1-5.2-9.7s-6.1-28.6-7.3-36.2s-.5-6 0-9.3s1.8-7.3 3-10.4s2.2-5.8 3.9-8s5.8 6.9 6-4.9s-4.2-53.9-4.6-65.6s.9-3.4 1.9-4.5s2.1-2 3.7-2.2z"/><path fill-opacity=".05" d="M29.4 3.7c1.7-.6 4.1-.4 5.8.5s1.4-5.6 4.1 4.8s9.3 48.4 12.2 57.8s3-1.5 5-1.8s4.9-.4 7.1 0s4.4 1.7 6 2.8s1.7 3.3 3.4 3.8s5-.8 7-.7s3 .1 4.9 1.2s4.7 2.7 6 5s-.3 7.3 1.5 8.9s6.4-.7 8.9.3s4.7-.1 6.3 5.8s2.5 14.2 2.9 29.3s-1 49.9-.7 61.4s1.5 5.2 2.7 7.5s3.3.6 4.2 5.8s.3 20 1.4 25.3s4.1 4 5 6.6s-.5 4.3.2 9.1s3.1 11.4 3.6 19.4s-1.6 11.9-1.1 28.9s3.6 51.1 4.1 73.4s-1.5 28.9-1.1 60.2s1.4 90.2 3.3 127.6s6.3 75.7 7.8 96.7s1.2 20.7 1.1 29.8s-.2 17.4-1.5 24.8s-3.2 14.2-6.5 19.4s-8.1 8.9-13.6 12.1s-12.4 5.6-19.3 7.2s-14.7 2.3-22.1 2.3s-15.3-.7-22.3-2.3s-14.1-3.9-19.6-7.2s-10.4-7-13.7-12.7s-5.2-14.2-6.4-21.1s-1.2-10.9-1.2-19.9s-.3-14.6 1.2-34.6s6-56.5 7.4-85.6s.4-66.6 1.1-88.9s2.6-25.1 3-44.6s-.8-55.3-.7-72.5s.4-21 1.1-30.9s2.7-19.2 2.9-28s-1.6-14.3-1.4-24.5s1.9-29.6 2.6-36.3s.5-2.5 1.4-3.7s3.1 1.5 4.1-3.6s.4-21.1 1.7-26.7s5.4-3.6 6.1-7.1s-1.1-10.4-1.9-14.1s-1.3-5.5-2.7-8.5s-3.5-7.2-5.6-9.7s-4.7-3.2-6.7-5.6s-2.9-1.8-4.9-9.2s-6-27.5-7.1-35.2s-.4-7.1.4-10.9s2.7-8.9 3.9-11.6s2-3.4 3.4-4.8s5.3 6.9 5.3-3.8s-4.5-49.1-5.3-60.4s-.3-5.4.6-7.3s2.9-3.3 4.7-3.9z"/><path fill-opacity=".075" d="M29.5 3.8c1.7-.5 4-.3 5.6.7s1.8-5.2 4.1 5.7s7.5 50.5 9.9 59.8s2.6-3.1 4.3-3.9s3.5-1.3 5.8-1s6.1 1.4 8 2.8s1.9 5.1 3.3 5.7s3.5-2 5.5-2.2s4.3-.1 6.3.9s4.6 2 5.6 4.9s-.3 10.7.3 12.3s1.8-2.3 3.3-2.8s4.1-.6 5.7-.4s3 .9 4.1 1.7s1.7-2 2.6 3.4s2.4 13.8 2.7 28.8s-1 49.7-.7 61.3s1.6 6.2 2.8 8.5s3.2-.3 4.2 5.1s.6 22.1 1.6 27.3s3.9 2.1 4.7 4.3s-.5 4.4.2 9.1s3.2 11.3 3.6 19.5s-1.6 12.2-1.1 29.3s3.6 50.7 4.1 72.9s-1.5 29.3-1.1 60.6s1.5 89.9 3.3 127.3s6.3 75.7 7.8 96.7s1.2 20.4 1.1 29.4s-.2 17.3-1.5 24.5s-2.8 13.3-6 18.4s-8 8.6-13.2 11.7s-11.8 5.2-18.5 6.7s-14.6 2.3-21.8 2.3s-14.7-.7-21.5-2.3s-13.7-3.7-19-6.9s-9.8-6.5-13-11.9s-4.9-13.5-6.1-20.3s-1.1-11-1.1-20s-.3-13.9 1.1-33.8s6-56.5 7.4-85.6s.5-66.7 1.1-88.9s2.6-24.8 3-44.3s-.8-55.6-.7-72.9s.4-21.1 1.1-30.8s2.7-18.9 3-27.6s-1.8-16.2-1.5-24.9s2.5-21.5 2.9-27.6s-.4-6.5-.3-8.5s.1-1.7 1-2.9s3.5-1.6 4.5-4.2s1.3-7.3 1.5-11.5s-.5-10.7-.3-13.6s.6-2.6 1.7-3.9s4.8-.4 5.3-3.7s-1.4-12.2-2.3-16.4s-1.3-5.5-2.7-8.8s-4.1-8-6.1-10.6s-4.4-2.7-6.3-5s-2.8-1.5-4.8-8.8s-6-27.4-7.1-34.9s-.3-6.7.4-10.2s2.7-8.7 3.9-11.3s1.7-3.1 3.2-4.3s5.8 8.2 5.8-2.5s-5.2-50.1-6-61.5s-.2-5.4.7-7.2s2.9-3.3 4.6-3.7z"/></g><defs><path id="whTp-0" d="M19 140.4c-.8-1-1.3-1.9-2-3.4s-1.5-2.6-2.2-5.3s-1.4-6.6-2-10.9s-1.4-10.7-1.8-14.6s-.6-6.8-.7-8.9s.1-2.7.3-3.9s-.2-1 .8-3.5s4.1-9.5 5.2-11.8s1.2-1.5 1.8-2.1s1.5-1.1 2.3-1.6s1.7-.7 2.6-.9s1.8-.2 2.7-.2s1.8.3 2.6.5s1.6.8 2.4 1.3s1.4 1.1 1.9 1.8s1.1 1.5 1.5 2.3s.6 1.7.8 2.6s.2 1.9.1 2.8s-.1 1.2-.6 2.8s-2.1 4.5-2.5 6.6s0 3.5.2 5.8s.3 4.3 1 8.2s2.5 12.6 3.2 15.5s.5 1.7.6 1.9s-.2-.6-.1-.6s.1-.1.5.5s1.7 2 2.2 3.2s1 2.3 1 3.6s-.2 2.7-.7 4s-1.3 2.6-2.3 3.7s-2.3 2.2-3.6 2.9s-2.9 1.4-4.4 1.7s-3 .3-4.4.1s-2.7-.7-3.8-1.4s-1.8-1.7-2.6-2.7z"/><path id="whTp-1" d="M31.4 201.2c-10.2-1.7.5-5.8.8-10.3s1.3-11.1 1.1-16.7s-.5-11.3-2.2-16.7s-5.6-11.4-8-15.9s-6.7-8.4-6.5-11.3s5.8-4 7.9-5.9s4.4-2.7 5-5.5s-.8-6.5-1.4-11.8s-1.5-15.8-1.8-20s-1.9-2.9-.4-4.6s6-5.7 9.1-5.6s7.2 6.4 9.4 6.5s2.1-4.9 3.8-6s4.2-.3 6.1-.3s4.2-.5 5.7.4s2.2 4.3 3.4 4.8s2-1.2 3.5-1.6s3.9-.3 5.7-.3s3.7-1.4 5.1.5s2.1 9.6 3.3 11.1s2.6-1.7 4.3-2s4.2-.7 6.2 0s4.6-1.3 5.4 4.4s-.2 20.3-.7 29.6s-1.9 18.1-2.6 26s-1.8 16.6-1.9 21.4s1.5 4.6 1.7 7.3s-.5 4.8-.5 8.5s10.8 11.6.5 14s-51.8 1.7-62 0z"/><path id="whTp-2" d="M80.8 97.7c.3-2.2 1.2-8.8 1.7-11.1s.7-1.8 1.4-2.5s1.8-1.1 2.8-1.3s2.6-.2 3.8 0s2.5.8 3.4 1.4s1.7 1.4 2.1 2.3s.8.5.4 2.8s-2 8.8-2.6 10.9s-.4 1.2-.8 1.7s-1 .9-1.7 1.2s-1.5.5-2.3.5s-1.7.1-2.6-.1s-1.7-.5-2.4-.8s-1.4-.9-1.9-1.4s-.9-1.2-1.1-1.8s-.5.3-.2-1.8z"/><path id="whTp-3" d="M62.9 88.9c0-2.8.5-11.7.7-14.4s.2-1.3.5-1.8s.6-1.1 1-1.6s1-.8 1.5-1.2s.8-.6 2-.8s3.2-.6 4.7-.4s3.6.9 4.6 1.3s1.3.7 1.8 1.2s.9.9 1.2 1.5s.6 1.1.7 1.7s.5-.9.1 1.8s-1.5 11.6-2 14.3s-.3 1.6-.8 2.2s-1.2 1.3-2 1.8s-1.9.8-2.9 1s-2.2.2-3.3.1s-2.2-.3-3.2-.7s-1.9-1-2.6-1.6s-1.3-1.3-1.6-2.1s-.5.5-.4-2.3z"/><path id="whTp-4" d="M44.2 86.1c-.1-3.2-.2-13.2-.1-16.3s.1-1.4.4-2s.6-1.3 1-1.8s1-1 1.6-1.5s1.3-.8 2.1-1s1.6-.5 2.4-.7s1.9-.1 2.8-.1s1.9.1 2.8.3s1.7.5 2.4.8s1.4.8 2 1.2s1.1 1 1.5 1.6s.7 1.2.9 1.8s.4-.9.3 2.1s-1 13.1-1.3 16.2s-.3 1.8-.8 2.5s-1.3 1.5-2.1 2.1s-2 1-3.1 1.3s-2.4.4-3.6.4s-2.5-.3-3.6-.7s-2.2-.9-3-1.5s-1.5-1.4-2-2.2s-.5.6-.6-2.5z"/><path id="whTp-5" d="M26.2 93.1c-.2-1.6-.2-3.8-.3-7.4s-.3-11.1-.3-14.5s-.1-2.2-.3-6s-.9-11.1-1-16.4s.3-11.4.2-15.4s-.4-5.1-.5-9s-.2-11.7-.1-14.4s.3-1.4.6-2s.7-1.3 1.1-1.8s1-1 1.5-1.4s1.2-.7 1.8-1s1.3-.3 1.9-.4s1.4 0 2 .2s1.3.4 1.9.7s1.2.7 1.7 1.2s.9 1 1.3 1.6s.6 1 .9 2s.3 1.3.6 3.7s.8 7.5 1 10.7s.1 4.9.5 9s1.4 10.1 1.8 15.4s.3 12.8.4 16.6s.1 2.6.3 6s.7 10.8.9 14.4s.4 5.8.3 7.4s-.1 1.7-.6 2.5s-1 1.5-1.8 2.1s-1.9 1.2-2.9 1.6s-2.3.5-3.5.6s-2.4-.1-3.5-.3s-2.2-.8-3-1.3s-1.6-1.2-2.1-2s-.6-.7-.8-2.4z"/><path id="whTp-6" d="M27.4 213.3c-12.9 2.7-6.2 8.6-8 16.7s-2.6 23.2-2.8 31.6s1.7 10.2 1.5 18.6s-2.3 15.5-3 31.6s-1.4 48.7-1.5 65.1s1.4 21.1 1.1 33.5s-1.9 18.6-2.6 40.9s-1 50.9-1.5 93s-18.4 133.3-1.1 160s87.6 26.7 104.9 0s-.6-119.4-1.1-160s-1.2-58.9-1.8-83.7s-1.8-48-1.9-65.1s1.5-21.7 1.3-37.2s-1.7-40.9-2.4-55.8s-1.8-24.1-1.9-33.4s1.5-15.5 1.1-22.4s-1.5-13-3.3-18.6s5-12.4-7.8-14.8s-56.4-2.8-69.2 0z"/><path id="whTp-7" d="M27.4 183.7c2.8-3.5 9.8-2.9 15.5-3.7s12.7-1.1 19.1-1.2s13.2.2 19 1s12.8 0 15.6 3.5s.8 10.9 1.1 17.4s3.6 18.9.7 21.9s-12.1-3.3-18.2-4.1s-12.1-1.2-18.2-1.2s-12.2.3-18.3 1.2s-15.3 7-18.2 4.1s.5-15.4.8-21.9s-1.7-13.6 1.1-17z"/><path id="whTp-8" d="M19 140.4c-.8-1-1.3-1.9-2-3.4s-1.5-2.6-2.2-5.3s-1.4-6.6-2-10.9s-1.4-10.7-1.8-14.6s-.6-6.8-.7-8.9s.1-2.7.3-3.9s-.2-1 .8-3.5s4.1-9.5 5.2-11.8s1.2-1.5 1.8-2.1s1.5-1.1 2.3-1.6s1.7-.7 2.6-.9s1.8-.2 2.7-.2s1.8.3 2.6.5s1.6.8 2.4 1.3s1.4 1.1 1.9 1.8s1.1 1.5 1.5 2.3s.6 1.7.8 2.6s.2 1.9.1 2.8s-.1 1.2-.6 2.8s-2.1 4.5-2.5 6.6s0 3.5.2 5.8s.3 4.3 1 8.2s2.5 12.6 3.2 15.5s.5 1.7.6 1.9s-.2-.6-.1-.6s.1-.1.5.5s1.7 2 2.2 3.2s1 2.3 1 3.6s-.2 2.7-.7 4s-1.3 2.6-2.3 3.7s-2.3 2.2-3.6 2.9s-2.9 1.4-4.4 1.7s-3 .3-4.4.1s-2.7-.7-3.8-1.4s-1.8-1.7-2.6-2.7zM31.4 201.2c-10.2-1.7.5-5.8.8-10.3s1.3-11.1 1.1-16.7s-.5-11.3-2.2-16.7s-5.6-11.4-8-15.9s-6.7-8.4-6.5-11.3s5.8-4 7.9-5.9s4.4-2.7 5-5.5s-.8-6.5-1.4-11.8s-1.5-15.8-1.8-20s-1.9-2.9-.4-4.6s6-5.7 9.1-5.6s7.2 6.4 9.4 6.5s2.1-4.9 3.8-6s4.2-.3 6.1-.3s4.2-.5 5.7.4s2.2 4.3 3.4 4.8s2-1.2 3.5-1.6s3.9-.3 5.7-.3s3.7-1.4 5.1.5s2.1 9.6 3.3 11.1s2.6-1.7 4.3-2s4.2-.7 6.2 0s4.6-1.3 5.4 4.4s-.2 20.3-.7 29.6s-1.9 18.1-2.6 26s-1.8 16.6-1.9 21.4s1.5 4.6 1.7 7.3s-.5 4.8-.5 8.5s10.8 11.6.5 14s-51.8 1.7-62 0zM80.8 97.7c.3-2.2 1.2-8.8 1.7-11.1s.7-1.8 1.4-2.5s1.8-1.1 2.8-1.3s2.6-.2 3.8 0s2.5.8 3.4 1.4s1.7 1.4 2.1 2.3s.8.5.4 2.8s-2 8.8-2.6 10.9s-.4 1.2-.8 1.7s-1 .9-1.7 1.2s-1.5.5-2.3.5s-1.7.1-2.6-.1s-1.7-.5-2.4-.8s-1.4-.9-1.9-1.4s-.9-1.2-1.1-1.8s-.5.3-.2-1.8zM62.9 88.9c0-2.8.5-11.7.7-14.4s.2-1.3.5-1.8s.6-1.1 1-1.6s1-.8 1.5-1.2s.8-.6 2-.8s3.2-.6 4.7-.4s3.6.9 4.6 1.3s1.3.7 1.8 1.2s.9.9 1.2 1.5s.6 1.1.7 1.7s.5-.9.1 1.8s-1.5 11.6-2 14.3s-.3 1.6-.8 2.2s-1.2 1.3-2 1.8s-1.9.8-2.9 1s-2.2.2-3.3.1s-2.2-.3-3.2-.7s-1.9-1-2.6-1.6s-1.3-1.3-1.6-2.1s-.5.5-.4-2.3zM44.2 86.1c-.1-3.2-.2-13.2-.1-16.3s.1-1.4.4-2s.6-1.3 1-1.8s1-1 1.6-1.5s1.3-.8 2.1-1s1.6-.5 2.4-.7s1.9-.1 2.8-.1s1.9.1 2.8.3s1.7.5 2.4.8s1.4.8 2 1.2s1.1 1 1.5 1.6s.7 1.2.9 1.8s.4-.9.3 2.1s-1 13.1-1.3 16.2s-.3 1.8-.8 2.5s-1.3 1.5-2.1 2.1s-2 1-3.1 1.3s-2.4.4-3.6.4s-2.5-.3-3.6-.7s-2.2-.9-3-1.5s-1.5-1.4-2-2.2s-.5.6-.6-2.5zM26.2 93.1c-.2-1.6-.2-3.8-.3-7.4s-.3-11.1-.3-14.5s-.1-2.2-.3-6s-.9-11.1-1-16.4s.3-11.4.2-15.4s-.4-5.1-.5-9s-.2-11.7-.1-14.4s.3-1.4.6-2s.7-1.3 1.1-1.8s1-1 1.5-1.4s1.2-.7 1.8-1s1.3-.3 1.9-.4s1.4 0 2 .2s1.3.4 1.9.7s1.2.7 1.7 1.2s.9 1 1.3 1.6s.6 1 .9 2s.3 1.3.6 3.7s.8 7.5 1 10.7s.1 4.9.5 9s1.4 10.1 1.8 15.4s.3 12.8.4 16.6s.1 2.6.3 6s.7 10.8.9 14.4s.4 5.8.3 7.4s-.1 1.7-.6 2.5s-1 1.5-1.8 2.1s-1.9 1.2-2.9 1.6s-2.3.5-3.5.6s-2.4-.1-3.5-.3s-2.2-.8-3-1.3s-1.6-1.2-2.1-2s-.6-.7-.8-2.4z"/><clipPath id="whTp-9"><use href="#whTp-8"/></clipPath><radialGradient id="whTp-a"><stop offset="0" stop-color="#d29a73" stop-opacity=".8"/><stop offset=".5" stop-color="#d29a73" stop-opacity=".3"/><stop offset="1" stop-color="#d29a73" stop-opacity="0"/></radialGradient><radialGradient id="whTp-b"><stop offset="0" stop-color="#c4805a" stop-opacity=".85"/><stop offset=".55" stop-color="#c4805a" stop-opacity=".32"/><stop offset="1" stop-color="#c4805a" stop-opacity="0"/></radialGradient><radialGradient id="whTp-c"><stop offset="0" stop-color="#4c2a17" stop-opacity=".6"/><stop offset=".55" stop-color="#4c2a17" stop-opacity=".2"/><stop offset="1" stop-color="#4c2a17" stop-opacity="0"/></radialGradient><radialGradient id="whTp-d"><stop offset="0" stop-color="#b5503a" stop-opacity=".55"/><stop offset=".55" stop-color="#b5503a" stop-opacity=".2"/><stop offset="1" stop-color="#b5503a" stop-opacity="0"/></radialGradient><linearGradient id="whTp-e" gradientUnits="userSpaceOnUse" x1="10.9" y1="105" x2="32.8" y2="104.8"><stop offset="0" stop-color="#7d482c"/><stop offset=".042" stop-color="#905736"/><stop offset=".292" stop-color="#b47953"/><stop offset=".708" stop-color="#854f30"/><stop offset=".958" stop-color="#552f1b"/><stop offset="1" stop-color="#5b331d"/></linearGradient><linearGradient id="whTp-f" gradientUnits="userSpaceOnUse" x1="29.4" y1="134.4" x2="28.6" y2="73.3"><stop offset="0" stop-color="#9a5e3b"/><stop offset=".19" stop-color="#9a5e3b"/><stop offset=".554" stop-color="#9a5e3b" stop-opacity="0"/><stop offset=".747" stop-color="#764328" stop-opacity="0"/><stop offset="1" stop-color="#764328" stop-opacity=".28"/></linearGradient><linearGradient id="whTp-g" gradientUnits="userSpaceOnUse" x1="18.8" y1="93.3" x2="25.2" y2="74.9"><stop offset="0" stop-color="#9a6650"/><stop offset=".35" stop-color="#bd8b76"/><stop offset=".85" stop-color="#bd8b76"/><stop offset="1" stop-color="#dcbca8"/></linearGradient><clipPath id="whTp-h"><use href="#whTp-0"/></clipPath><clipPath id="whTp-i"><use href="#whTp-0"/></clipPath><linearGradient id="whTp-j" gradientUnits="userSpaceOnUse" x1="81.9" y1="91.3" x2="95.2" y2="93.8"><stop offset="0" stop-color="#834c2f"/><stop offset=".146" stop-color="#c28862"/><stop offset=".313" stop-color="#d09871"/><stop offset=".563" stop-color="#9a5e3b"/><stop offset=".979" stop-color="#57311c"/><stop offset="1" stop-color="#5b331d"/></linearGradient><linearGradient id="whTp-k" gradientUnits="userSpaceOnUse" x1="87.3" y1="98.9" x2="90.5" y2="82.8"><stop offset="0" stop-color="#9a5e3b"/><stop offset=".226" stop-color="#9a5e3b"/><stop offset=".51" stop-color="#9a5e3b" stop-opacity="0"/><stop offset=".567" stop-color="#764328" stop-opacity="0"/><stop offset="1" stop-color="#764328" stop-opacity=".42"/></linearGradient><clipPath id="whTp-l"><use href="#whTp-2"/></clipPath><clipPath id="whTp-m"><use href="#whTp-2"/></clipPath><linearGradient id="whTp-n" gradientUnits="userSpaceOnUse" x1="63.3" y1="82.1" x2="80.6" y2="83.7"><stop offset="0" stop-color="#804a2d"/><stop offset=".146" stop-color="#be845d"/><stop offset=".313" stop-color="#d19972"/><stop offset=".667" stop-color="#915736"/><stop offset=".979" stop-color="#57311c"/><stop offset="1" stop-color="#5b331d"/></linearGradient><linearGradient id="whTp-o" gradientUnits="userSpaceOnUse" x1="71.3" y1="89.7" x2="73.3" y2="68.7"><stop offset="0" stop-color="#9a5e3b"/><stop offset=".164" stop-color="#9a5e3b"/><stop offset=".463" stop-color="#9a5e3b" stop-opacity="0"/><stop offset=".537" stop-color="#764328" stop-opacity="0"/><stop offset="1" stop-color="#764328" stop-opacity=".42"/></linearGradient><clipPath id="whTp-p"><use href="#whTp-3"/></clipPath><clipPath id="whTp-q"><use href="#whTp-3"/></clipPath><linearGradient id="whTp-r" gradientUnits="userSpaceOnUse" x1="44.2" y1="79" x2="63.5" y2="79.7"><stop offset="0" stop-color="#7e492c"/><stop offset=".146" stop-color="#bb805a"/><stop offset=".313" stop-color="#d19972"/><stop offset=".688" stop-color="#905736"/><stop offset=".979" stop-color="#57311c"/><stop offset="1" stop-color="#5b331d"/></linearGradient><linearGradient id="whTp-s" gradientUnits="userSpaceOnUse" x1="53.6" y1="86.4" x2="54.4" y2="62.7"><stop offset="0" stop-color="#9a5e3b"/><stop offset=".141" stop-color="#9a5e3b"/><stop offset=".447" stop-color="#9a5e3b" stop-opacity="0"/><stop offset=".527" stop-color="#764328" stop-opacity="0"/><stop offset="1" stop-color="#764328" stop-opacity=".42"/></linearGradient><clipPath id="whTp-t"><use href="#whTp-4"/></clipPath><path id="whTp-u" d="M19 140.4c-.8-1-1.3-1.9-2-3.4s-1.5-2.6-2.2-5.3s-1.4-6.6-2-10.9s-1.4-10.7-1.8-14.6s-.6-6.8-.7-8.9s.1-2.7.3-3.9s-.2-1 .8-3.5s4.1-9.5 5.2-11.8s1.2-1.5 1.8-2.1s1.5-1.1 2.3-1.6s1.7-.7 2.6-.9s1.8-.2 2.7-.2s1.8.3 2.6.5s1.6.8 2.4 1.3s1.4 1.1 1.9 1.8s1.1 1.5 1.5 2.3s.6 1.7.8 2.6s.2 1.9.1 2.8s-.1 1.2-.6 2.8s-2.1 4.5-2.5 6.6s0 3.5.2 5.8s.3 4.3 1 8.2s2.5 12.6 3.2 15.5s.5 1.7.6 1.9s-.2-.6-.1-.6s.1-.1.5.5s1.7 2 2.2 3.2s1 2.3 1 3.6s-.2 2.7-.7 4s-1.3 2.6-2.3 3.7s-2.3 2.2-3.6 2.9s-2.9 1.4-4.4 1.7s-3 .3-4.4.1s-2.7-.7-3.8-1.4s-1.8-1.7-2.6-2.7zM44.2 86.1c-.1-3.2-.2-13.2-.1-16.3s.1-1.4.4-2s.6-1.3 1-1.8s1-1 1.6-1.5s1.3-.8 2.1-1s1.6-.5 2.4-.7s1.9-.1 2.8-.1s1.9.1 2.8.3s1.7.5 2.4.8s1.4.8 2 1.2s1.1 1 1.5 1.6s.7 1.2.9 1.8s.4-.9.3 2.1s-1 13.1-1.3 16.2s-.3 1.8-.8 2.5s-1.3 1.5-2.1 2.1s-2 1-3.1 1.3s-2.4.4-3.6.4s-2.5-.3-3.6-.7s-2.2-.9-3-1.5s-1.5-1.4-2-2.2s-.5.6-.6-2.5z"/><clipPath id="whTp-v"><use href="#whTp-u"/></clipPath><linearGradient id="whTp-w" gradientUnits="userSpaceOnUse" x1="24.2" y1="44.6" x2="42.1" y2="43.7"><stop offset="0" stop-color="#7c472b"/><stop offset=".042" stop-color="#8f5635"/><stop offset=".313" stop-color="#b27750"/><stop offset=".854" stop-color="#6f3f25"/><stop offset=".917" stop-color="#5b331d"/><stop offset="1" stop-color="#5b331d"/></linearGradient><linearGradient id="whTp-x" gradientUnits="userSpaceOnUse" x1="35.3" y1="92.7" x2="30.8" y2="3.4"><stop offset="0" stop-color="#9a5e3b"/><stop offset=".024" stop-color="#9a5e3b"/><stop offset=".245" stop-color="#9a5e3b" stop-opacity="0"/><stop offset=".856" stop-color="#764328" stop-opacity="0"/><stop offset="1" stop-color="#764328" stop-opacity=".3"/></linearGradient><linearGradient id="whTp-y" gradientUnits="userSpaceOnUse" x1="31.9" y1="19.5" x2="31" y2="5.1"><stop offset="0" stop-color="#9a6650"/><stop offset=".35" stop-color="#bd8b76"/><stop offset=".85" stop-color="#bd8b76"/><stop offset="1" stop-color="#dcbca8"/></linearGradient><clipPath id="whTp-z"><use href="#whTp-5"/></clipPath><linearGradient id="whTp-10" gradientUnits="userSpaceOnUse" x1="62" y1="89.7" x2="62" y2="123.2"><stop offset="0" stop-color="#4c2a17" stop-opacity="0"/><stop offset="1" stop-color="#4c2a17"/></linearGradient><linearGradient id="whTp-11" gradientUnits="userSpaceOnUse" x1="62" y1="146.3" x2="62" y2="176.1"><stop offset="0" stop-color="#b0744e" stop-opacity="0"/><stop offset="1" stop-color="#b0744e"/></linearGradient><clipPath id="whTp-12"><use href="#whTp-6"/></clipPath><clipPath id="whTp-13"><use href="#whTp-7"/></clipPath><radialGradient id="whTp-14"><stop offset="0" stop-color="#33495f" stop-opacity=".5"/><stop offset=".6" stop-color="#33495f" stop-opacity=".18"/><stop offset="1" stop-color="#33495f" stop-opacity="0"/></radialGradient><radialGradient id="whTp-15"><stop offset="0" stop-color="#97b2ca" stop-opacity=".42"/><stop offset=".6" stop-color="#97b2ca" stop-opacity=".14"/><stop offset="1" stop-color="#97b2ca" stop-opacity="0"/></radialGradient><linearGradient id="whTp-16" gradientUnits="userSpaceOnUse" x1="10.1" y1="172.3" x2="113.9" y2="172.3"><stop offset="0" stop-color="#5c7997"/><stop offset=".16" stop-color="#7290ac"/><stop offset=".4" stop-color="#6b89a6"/><stop offset=".62" stop-color="#62809e"/><stop offset=".86" stop-color="#506c8a"/><stop offset="1" stop-color="#455f7a"/></linearGradient><linearGradient id="whTp-17" gradientUnits="userSpaceOnUse" x1="25.5" y1="172.3" x2="98.4" y2="172.3"><stop offset="0" stop-color="#5c7997"/><stop offset=".16" stop-color="#7290ac"/><stop offset=".4" stop-color="#6b89a6"/><stop offset=".62" stop-color="#62809e"/><stop offset=".86" stop-color="#506c8a"/><stop offset="1" stop-color="#455f7a"/></linearGradient></defs><use href="#whTp-8" fill="none" stroke="#4a2814" stroke-width="1" stroke-opacity=".75" stroke-linejoin="round"/><use href="#whTp-8" fill="#9a5e3b"/><use href="#whTp-0" fill="url(#whTp-e)"/><use href="#whTp-0" fill="url(#whTp-f)"/><path d="M21.9 100.9c-.1 0-.5-.2-.8-.2s-.6-.1-.9-.1s-.6 0-.9.1s-.7.2-.9.2" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".084" stroke-linecap="round" stroke-linejoin="round"/><path d="M24.2 98.5c-.3-.1-1.1-.3-1.7-.4s-1.1-.1-1.7-.1s-1.1 0-1.6.1s-1.4.4-1.7.4" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".156" stroke-linecap="round" stroke-linejoin="round"/><path d="M22.8 96.1c-.3-.1-1-.4-1.5-.5s-.9-.2-1.4-.2s-.9.1-1.4.2s-1.1.4-1.4.5" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".132" stroke-linecap="round" stroke-linejoin="round"/><path d="M22.2 93.7c-.2-.1-.6-.3-.8-.3s-.6-.2-.8-.2s-.5.1-.8.2s-.7.2-.8.3" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".072" stroke-linecap="round" stroke-linejoin="round"/><path d="M23.1 95.6c-.6.1-2.7.4-3.6.4s-1-.1-1.6-.3s-.8-.2-1.4-.7s-2.2-2.2-2.6-2.6" fill="none" stroke="#b0744e" stroke-width="2.5" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M25.2 74.9c-.6-.2-1.1-.4-1.9-.4s-2 .3-2.9 1s-1.8 1.9-2.3 2.8s-.6 1.2-1 2.5s-1.3 3.3-1.6 4.8s-.6 3.1-.5 4.2s.8 1.9 1.4 2.4s1.6.8 2.4 1.1s1.8.6 2.5.6s.8.2 1.4-.2s1.7-1.5 2.3-2.2s.6-1 1.1-2.2s1.4-3.2 1.8-4.8s.9-3.2.9-4.5s-.6-2.4-.9-3.1s-.6-.8-1-1.1s-1.1-.7-1.7-.9z" fill="url(#whTp-g)" stroke="#7d4c35" stroke-width=".9" stroke-opacity=".45"/><path d="M24.6 92.2c-.6.2-3.1 1.1-4.1 1.3s-.9.2-1.7-.3s-2.2-1.6-2.8-2.3s-1-1.7-1.1-2.1" fill="none" stroke="#56301c" stroke-width="1.4" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.2 87.1c.1-.4.5-1.6.8-2.4s.6-1.6.9-2.4s.5-1.6.8-2.3s.7-2 .8-2.4" fill="none" stroke="#ecd3c3" stroke-width="1.4" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><path d="M28.6 77.7c-.2-.2-.6-.7-1.4-1.1s-2-.9-3.1-1.2s-2.8-.4-3.3-.4" fill="none" stroke="#ecd3c3" stroke-width="1" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whTp-h)"><ellipse cx="25.4" cy="83" rx="10.2" ry="11.3" transform="rotate(19.2 25.4 83)" fill="url(#whTp-d)" fill-opacity=".2"/></g><g clip-path="url(#whTp-i)" fill="none" stroke="#4c2a17"><use href="#whTp-1" stroke-width="2" stroke-opacity=".09" transform="translate(.7 .9)"/><use href="#whTp-1" stroke-width="4.5" stroke-opacity=".07" transform="translate(.7 .9)"/><use href="#whTp-1" stroke-width="7.8" stroke-opacity=".05" transform="translate(.7 .9)"/></g><use href="#whTp-1" fill="#9a5e3b"/><path d="M29.7 117.4c-.3-1.7-1.2-7.5-1.6-10.3s-.3-3.2-.6-6.6s-.9-10.5-1.2-13.4s-1-2.8-1-3.6s.1-.5.6-1s1.4-1.5 2.3-2.2s2.8-2 3.4-2.4" fill="none" stroke="#4a2814" stroke-width=".8" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><use href="#whTp-2" fill="url(#whTp-j)"/><use href="#whTp-2" fill="url(#whTp-k)"/><g clip-path="url(#whTp-l)"><ellipse cx="88" cy="89.6" rx="5.9" ry="4.2" transform="rotate(101 88 89.6)" fill="url(#whTp-b)" fill-opacity=".26"/><ellipse cx="89.6" cy="87.3" rx="6.7" ry="4.2" transform="rotate(101 89.6 87.3)" fill="url(#whTp-d)" fill-opacity=".22"/></g><g clip-path="url(#whTp-m)" fill="none" stroke="#4c2a17"><use href="#whTp-3" stroke-width="2" stroke-opacity=".09" transform="translate(.7 .9)"/><use href="#whTp-3" stroke-width="4.5" stroke-opacity=".07" transform="translate(.7 .9)"/><use href="#whTp-3" stroke-width="7.8" stroke-opacity=".05" transform="translate(.7 .9)"/></g><use href="#whTp-3" fill="url(#whTp-n)"/><use href="#whTp-3" fill="url(#whTp-o)"/><g clip-path="url(#whTp-p)"><ellipse cx="71" cy="78.3" rx="7.5" ry="5.4" transform="rotate(95.5 71 78.3)" fill="url(#whTp-b)" fill-opacity=".26"/><ellipse cx="72.8" cy="74.5" rx="8.6" ry="5.5" transform="rotate(95.5 72.8 74.5)" fill="url(#whTp-d)" fill-opacity=".22"/></g><path d="M80.2 87.1c0 .1-.1.6-.1.9s-.1.7-.1.8" fill="none" stroke="#4a2814" stroke-width=".8" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whTp-q)" fill="none" stroke="#4c2a17"><use href="#whTp-4" stroke-width="2" stroke-opacity=".09" transform="translate(.7 .9)"/><use href="#whTp-4" stroke-width="4.5" stroke-opacity=".07" transform="translate(.7 .9)"/><use href="#whTp-4" stroke-width="7.8" stroke-opacity=".05" transform="translate(.7 .9)"/></g><use href="#whTp-4" fill="url(#whTp-r)"/><use href="#whTp-4" fill="url(#whTp-s)"/><g clip-path="url(#whTp-t)"><ellipse cx="52.4" cy="73.8" rx="8.4" ry="6" transform="rotate(92 52.4 73.8)" fill="url(#whTp-b)" fill-opacity=".26"/><ellipse cx="54.2" cy="69.1" rx="9.6" ry="6.1" transform="rotate(92 54.2 69.1)" fill="url(#whTp-d)" fill-opacity=".22"/></g><path d="M64.3 70.5c-.2 1.8-.8 8.9-.9 10.7" fill="none" stroke="#4a2814" stroke-width=".8" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whTp-v)" fill="none" stroke="#4c2a17"><use href="#whTp-5" stroke-width="2" stroke-opacity=".09" transform="translate(.7 .9)"/><use href="#whTp-5" stroke-width="4.5" stroke-opacity=".07" transform="translate(.7 .9)"/><use href="#whTp-5" stroke-width="7.8" stroke-opacity=".05" transform="translate(.7 .9)"/></g><use href="#whTp-5" fill="url(#whTp-w)"/><use href="#whTp-5" fill="url(#whTp-x)"/><path d="M34.4 51.4c-.1 0-.6-.1-.9-.2s-.6 0-.9 0s-.6.1-.9.1s-.7.2-.9.3" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".14" stroke-linecap="round" stroke-linejoin="round"/><path d="M36.5 49.3c-.3-.1-1.1-.2-1.7-.3s-1.2 0-1.7 0s-1.2.1-1.8.2s-1.4.3-1.7.4" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".26" stroke-linecap="round" stroke-linejoin="round"/><path d="M35.2 47.4c-.3-.1-1-.3-1.5-.4s-1-.1-1.5-.1s-.9.1-1.4.2s-1.2.4-1.5.5" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".22" stroke-linecap="round" stroke-linejoin="round"/><path d="M34.3 45.4c-.1-.1-.5-.2-.8-.3s-.5 0-.8 0s-.6.1-.8.1s-.7.3-.8.3" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".12" stroke-linecap="round" stroke-linejoin="round"/><path d="M32.7 26.7c-.1 0-.4-.1-.6-.1s-.5-.1-.7 0s-.4 0-.6 0s-.5.2-.6.3" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".077" stroke-linecap="round" stroke-linejoin="round"/><path d="M34.2 24.9c-.2-.1-.8-.2-1.2-.3s-.8 0-1.2 0s-.7.1-1.1.1s-1 .4-1.2.4" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".143" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 23.1c-.1 0-.6-.2-.9-.3s-.7-.1-1-.1s-.7.1-1 .2s-.8.4-1 .4" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".121" stroke-linecap="round" stroke-linejoin="round"/><path d="M32.6 21.4c-.1-.1-.4-.2-.6-.3s-.4 0-.5 0s-.4 0-.6.1s-.4.2-.5.3" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".066" stroke-linecap="round" stroke-linejoin="round"/><path d="M36.2 19.8c-.7.3-2.8 1.5-4.2 1.6s-3.7-.9-4.4-1" fill="none" stroke="#b0744e" stroke-width="1.8" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M31 5.1c-.6 0-1.1 0-1.7.3s-1.5.7-2 1.4s-.8 1.9-1 2.7s0 1 0 2s.1 2.6.3 3.7s.6 2.3 1.1 3s1.2 1.1 1.9 1.3s1.3.2 2.3 0s2.5-.3 3.3-.8s.9-1.6 1.1-2.3s.2-.8.2-1.8s0-2.6-.1-3.8s-.4-2.5-.8-3.3s-1.3-1.5-1.8-1.9s-.7-.4-1.2-.5s-1.1-.1-1.6 0z" fill="url(#whTp-y)" stroke="#7d4c35" stroke-width=".7" stroke-opacity=".45"/><path d="M36.2 17c-.4.4-2.1 1.7-2.9 2.1s-.7.4-1.5.3s-2.3-.4-3-.7s-1.4-.9-1.6-1.1" fill="none" stroke="#56301c" stroke-width="1.1" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M29.3 15.5c0-.3 0-1.3-.1-1.9s-.1-1.3-.1-1.9s-.1-1.2-.1-1.9s-.1-1.5-.1-1.8" fill="none" stroke="#ecd3c3" stroke-width="1.1" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><path d="M34.6 5.9c-.4 0-1.7-.3-2.9-.3s-3.6.7-4.3.8" fill="none" stroke="#ecd3c3" stroke-width=".8" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whTp-z)"><ellipse cx="33.4" cy="48.3" rx="8.2" ry="10" transform="rotate(-2.7 33.4 48.3)" fill="url(#whTp-d)" fill-opacity=".26"/><ellipse cx="31.3" cy="10.1" rx="8" ry="9.2" transform="rotate(-3.6 31.3 10.1)" fill="url(#whTp-d)" fill-opacity=".24"/></g><path d="M43.2 70.5c.1.9.3 3.9.4 5.6s.2 4.1.3 5" fill="none" stroke="#4a2814" stroke-width=".8" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><path d="M27 95.5c-.1-.4-.6.7-.8-2.4s-.4-13.5-.5-16.2" fill="none" stroke="#4a2814" stroke-width=".8" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whTp-9)"><path d="M91.5 90c.6.1 2.9.3 3.7.6s.7.6 1 1.2s.5 1.4.7 2.6s.3 1.6.3 4.4s-.1 8.2-.3 12.4s-.5 9.7-.7 12.8s-.1 2-.4 5.5s-1.2 10.6-1.7 15.7s-1.2 11.2-1.5 14.4s-.3 2.5-.4 4.5s-.4 5.7-.5 7.3s-.1 1.1.2 2.3s1.3 2.7 1.5 5s-.6 6.6-.5 8.5s.2 1.2 1 2.7s3.2 4.9 3.7 6.4s.4 2.1-.3 2.9s-3.2 1.6-3.9 2" fill="none" stroke="url(#whTp-10)" stroke-width="35.3" stroke-opacity=".07" stroke-linecap="round" stroke-linejoin="round"/><path d="M91.5 90c.6.1 2.9.3 3.7.6s.7.6 1 1.2s.5 1.4.7 2.6s.3 1.6.3 4.4s-.1 8.2-.3 12.4s-.5 9.7-.7 12.8s-.1 2-.4 5.5s-1.2 10.6-1.7 15.7s-1.2 11.2-1.5 14.4s-.3 2.5-.4 4.5s-.4 5.7-.5 7.3s-.1 1.1.2 2.3s1.3 2.7 1.5 5s-.6 6.6-.5 8.5s.2 1.2 1 2.7s3.2 4.9 3.7 6.4s.4 2.1-.3 2.9s-3.2 1.6-3.9 2" fill="none" stroke="url(#whTp-10)" stroke-width="18.6" stroke-opacity=".09" stroke-linecap="round" stroke-linejoin="round"/><path d="M91.5 90c.6.1 2.9.3 3.7.6s.7.6 1 1.2s.5 1.4.7 2.6s.3 1.6.3 4.4s-.1 8.2-.3 12.4s-.5 9.7-.7 12.8s-.1 2-.4 5.5s-1.2 10.6-1.7 15.7s-1.2 11.2-1.5 14.4s-.3 2.5-.4 4.5s-.4 5.7-.5 7.3s-.1 1.1.2 2.3s1.3 2.7 1.5 5s-.6 6.6-.5 8.5s.2 1.2 1 2.7s3.2 4.9 3.7 6.4s.4 2.1-.3 2.9s-3.2 1.6-3.9 2" fill="none" stroke="url(#whTp-10)" stroke-width="8.2" stroke-opacity=".11" stroke-linecap="round" stroke-linejoin="round"/><path d="M38.8 201.2c-.6-.3-3.1-.8-3.8-1.3s-1-.7-.4-1.8s3-3.3 3.9-4.5s.8 0 1.2-2.7s1-8.8 1.1-13.3s-.4-10.1-.8-13.5s-1-5-1.5-6.6s.1-.7-1.2-3.3s-5.6-10.5-6.7-12.6" fill="none" stroke="url(#whTp-11)" stroke-width="14" stroke-opacity=".13" stroke-linecap="round" stroke-linejoin="round"/><path d="M37.1 201.2c-.6-.3-3.1-.8-3.8-1.3s-.9-.7-.4-1.8s3.1-3.3 3.9-4.5s.8 0 1.2-2.7s1-8.8 1.1-13.3s-.4-10.1-.8-13.5s-1-5-1.4-6.6s0-.7-1.3-3.3s-5.6-10.5-6.7-12.6" fill="none" stroke="url(#whTp-11)" stroke-width="6.7" stroke-opacity=".16" stroke-linecap="round" stroke-linejoin="round"/><path d="M31.4 201.2c-.7-.3-3.2-.8-3.9-1.3s-.9-.7-.3-1.8s3-3.3 3.8-4.5s.8 0 1.2-2.7s1.1-8.8 1.1-13.3s-.4-10.1-.7-13.5s-1-5-1.5-6.6s.1-.7-1.2-3.3s-5.6-10.5-6.8-12.6" fill="none" stroke="#764328" stroke-width="4.1" stroke-opacity=".14" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="52.7" cy="122.1" rx="27.9" ry="37.2" transform="rotate(-6 52.7 122.1)" fill="url(#whTp-a)" fill-opacity=".45"/><ellipse cx="47.1" cy="114.7" rx="13" ry="20.5" transform="rotate(-8 47.1 114.7)" fill="url(#whTp-a)" fill-opacity=".3"/><ellipse cx="79.7" cy="131.4" rx="14" ry="29.8" transform="rotate(-4 79.7 131.4)" fill="url(#whTp-c)" fill-opacity=".2"/><path d="M37.2 100.2c.9 5.2 3.8 20.9 5.8 31.4s4.8 26.2 5.8 31.4" fill="none" stroke="#d29a73" stroke-width="6" stroke-opacity=".06" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="86.5" cy="177.2" rx="6" ry="7.1" fill="url(#whTp-a)" fill-opacity=".42"/><ellipse cx="89.1" cy="186.1" rx="5.6" ry="6.7" fill="url(#whTp-c)" fill-opacity=".22"/><path d="M47.1 172c1.3.2 6.7 1 8 1.3" fill="none" stroke="#56301c" stroke-width=".7" stroke-opacity=".12" stroke-linecap="round" stroke-linejoin="round"/><path d="M59.1 174c1.2 0 5.7 0 6.9 0" fill="none" stroke="#56301c" stroke-width=".7" stroke-opacity=".12" stroke-linecap="round" stroke-linejoin="round"/><path d="M69.4 173.1c1-.2 4.8-1.1 5.8-1.3" fill="none" stroke="#56301c" stroke-width=".7" stroke-opacity=".12" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="33.9" cy="87.1" rx="11.9" ry="6" transform="rotate(-13.4 33.9 87.1)" fill="url(#whTp-b)" fill-opacity=".24"/><ellipse cx="52.7" cy="82.7" rx="11.9" ry="6" transform="rotate(-1.7 52.7 82.7)" fill="url(#whTp-b)" fill-opacity=".24"/><ellipse cx="70.7" cy="86" rx="11.9" ry="6" transform="rotate(20.1 70.7 86)" fill="url(#whTp-b)" fill-opacity=".24"/><ellipse cx="87.3" cy="95.3" rx="11.9" ry="6" transform="rotate(29.3 87.3 95.3)" fill="url(#whTp-b)" fill-opacity=".24"/><ellipse cx="44.4" cy="83.8" rx="2.2" ry="6.7" transform="rotate(-13.4 44.4 83.8)" fill="url(#whTp-c)" fill-opacity=".14"/><ellipse cx="62.8" cy="83.2" rx="2.2" ry="6.7" transform="rotate(10.5 62.8 83.2)" fill="url(#whTp-c)" fill-opacity=".14"/><ellipse cx="80.1" cy="89.6" rx="2.2" ry="6.7" transform="rotate(29.3 80.1 89.6)" fill="url(#whTp-c)" fill-opacity=".14"/><ellipse cx="33.9" cy="83.1" rx="5.8" ry="4.7" fill="url(#whTp-a)" fill-opacity=".4"/><path d="M31.9 86.6c.5.1 2.1.9 3.1.9s2.6-.8 3.1-.9" fill="none" stroke="#56301c" stroke-width=".7" stroke-opacity=".16" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="35" cy="85.3" rx="9.1" ry="7.3" fill="url(#whTp-d)" fill-opacity=".14"/><ellipse cx="51.9" cy="81" rx="8.6" ry="6.4" transform="rotate(-6 51.9 81)" fill="url(#whTp-b)" fill-opacity=".36"/><ellipse cx="53.8" cy="81.6" rx="9.4" ry="6.8" fill="url(#whTp-d)" fill-opacity=".14"/><ellipse cx="70.1" cy="84.4" rx="8.1" ry="6" transform="rotate(-6 70.1 84.4)" fill="url(#whTp-b)" fill-opacity=".36"/><ellipse cx="71.8" cy="84.9" rx="8.8" ry="6.4" fill="url(#whTp-d)" fill-opacity=".14"/><ellipse cx="86.8" cy="93.7" rx="7.1" ry="5.2" transform="rotate(-6 86.8 93.7)" fill="url(#whTp-b)" fill-opacity=".36"/><ellipse cx="88.4" cy="94.2" rx="7.7" ry="5.6" fill="url(#whTp-d)" fill-opacity=".14"/></g><use href="#whTp-6" fill="none" stroke="#33485e" stroke-width="1.7" stroke-opacity=".9"/><use href="#whTp-6" fill="url(#whTp-16)"/><g clip-path="url(#whTp-12)"><ellipse cx="49" cy="257.9" rx="16.7" ry="44.6" transform="rotate(-4 49 257.9)" fill="url(#whTp-15)" fill-opacity=".32"/><ellipse cx="86.2" cy="343.5" rx="14.9" ry="63.2" transform="rotate(3 86.2 343.5)" fill="url(#whTp-14)" fill-opacity=".26"/><ellipse cx="32.2" cy="261.6" rx="39.4" ry="8.6" transform="rotate(-250.7 32.2 261.6)" fill="url(#whTp-14)" fill-opacity=".7"/><ellipse cx="22.9" cy="258.4" rx="34.7" ry="6.8" transform="rotate(-250.7 22.9 258.4)" fill="url(#whTp-15)" fill-opacity=".665"/><ellipse cx="88.5" cy="245.3" rx="23.6" ry="6.7" transform="rotate(57.9 88.5 245.3)" fill="url(#whTp-14)" fill-opacity=".55"/><ellipse cx="82" cy="249.4" rx="20.8" ry="5.4" transform="rotate(57.9 82 249.4)" fill="url(#whTp-15)" fill-opacity=".523"/><ellipse cx="58.3" cy="377.9" rx="41.6" ry="10" transform="rotate(40.5 58.3 377.9)" fill="url(#whTp-14)" fill-opacity=".6"/><ellipse cx="65.8" cy="369.1" rx="36.6" ry="8" transform="rotate(40.5 65.8 369.1)" fill="url(#whTp-15)" fill-opacity=".57"/><ellipse cx="69.4" cy="509.9" rx="45.4" ry="11.2" transform="rotate(-222.5 69.4 509.9)" fill="url(#whTp-14)" fill-opacity=".46"/><ellipse cx="60.7" cy="500.5" rx="40" ry="8.9" transform="rotate(-222.5 60.7 500.5)" fill="url(#whTp-15)" fill-opacity=".437"/></g><use href="#whTp-7" fill="#33495f" fill-opacity=".25" transform="translate(1.1 2.2)"/><use href="#whTp-7" fill="none" stroke="#33485e" stroke-width="1.7" stroke-opacity=".9"/><use href="#whTp-7" fill="url(#whTp-17)"/><g clip-path="url(#whTp-13)"><path d="M27.4 185.9c.3-.2.6-.9 1.7-1.4s1.6-1 4.9-1.4s10.4-1.2 15-1.5s8.7-.5 13-.5s8.3 0 12.9.3s11.7.9 15 1.3s3.8 1 5 1.4s1.4 1.2 1.7 1.4" fill="none" stroke="#97b2ca" stroke-width="3" stroke-opacity=".2" stroke-linecap="round" stroke-linejoin="round"/><path d="M28.1 188.9c.3-.2.6-1 1.7-1.4s1.5-1 4.8-1.5s10.1-1.1 14.7-1.5s8.4-.4 12.7-.4s8.1 0 12.7.3s11.4.9 14.6 1.3s3.8.9 4.9 1.4s1.4 1.2 1.7 1.4" fill="none" stroke="#4a6480" stroke-width=".7" stroke-dasharray="1.4 1.2" stroke-opacity=".8"/><path d="M97.7 218.5c-.3.1-1.1.7-1.9.7s0 .5-2.7-.3s-9.6-3.6-13.3-4.5s-5.9-.7-8.9-.9s-5.9-.2-8.9-.2s-6 0-9 .2s-5.2 0-8.9.9s-10.6 3.7-13.3 4.5s-1.9.4-2.7.3s-1.5-.6-1.9-.7" fill="none" stroke="#4a6480" stroke-width=".7" stroke-dasharray="1.4 1.2" stroke-opacity=".7"/><path d="M98.4 223.3c-.3.1-1.1.7-1.9.8s0 .5-2.7-.4s-9.8-3.6-13.6-4.5s-6.1-.7-9.1-.9s-6.1-.2-9.1-.2s-6.1 0-9.1.2s-5.4 0-9.2.9s-10.8 3.7-13.5 4.5s-2 .5-2.7.4s-1.7-.7-2-.8" fill="none" stroke="#33495f" stroke-width="3" stroke-opacity=".25" stroke-linecap="round" stroke-linejoin="round"/><path d="M84.5 181.1c.1 2.9.6 11.6.9 17.7s.6 15.8.8 18.9" fill="none" stroke="#33495f" stroke-width="1.3" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M83.4 181.1c.1 2.9.6 11.6.9 17.7s.6 15.8.7 18.9" fill="none" stroke="#97b2ca" stroke-width=".9" stroke-opacity=".25" stroke-linecap="round" stroke-linejoin="round"/></g><ellipse cx="91.4" cy="200.9" rx="3.7" ry="3.5" fill="#33495f" fill-opacity=".25"/><ellipse cx="90.8" cy="200" rx="3.5" ry="3.3" fill="#efebe3" stroke="#8d99a6" stroke-width=".6"/><ellipse cx="89.8" cy="199" rx=".5" ry=".5" fill="#8d99a6"/><ellipse cx="91.8" cy="199" rx=".5" ry=".5" fill="#8d99a6"/><ellipse cx="89.8" cy="200.9" rx=".5" ry=".5" fill="#8d99a6"/><ellipse cx="91.8" cy="200.9" rx=".5" ry=".5" fill="#8d99a6"/><path d="M29.1 181.9c.4-.2 1-.6 2.3-.9s2.6-.5 5.6-.9s7.9-.9 12-1.2s8.7-.4 13-.4s8.3 0 12.9.3s11.7.9 15 1.3s4.1 1.2 5 1.4" fill="none" stroke="#4c2a17" stroke-width="2.6" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/></svg>'},
    pinch:{w:154,h:614,grip:[17.7,28.7],wrist:[74,125.9],
      svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 154 614" width="154" height="614"><g class="wh-shadow" fill="#3a2410"><path fill-opacity=".035" d="M21.9 3.6c4.9-.5 19.6-.4 24.5.9s3.3 2.7 4.8 6.7s3.7 16 4.4 17.6s-.1-6.1.2-8.1s.3-2.5 1.4-3.8s3.6-3 5.6-3.7s4.5-.6 6.6-.1s4.5 1.6 5.8 3.1s1 5.4 2 5.9s2.7-2.1 4.1-2.6s2.8-1.1 4.8-.5s6 2.2 7.5 3.7s1.3 2.2 1.6 5.1s-.2 10.9 0 12.3s.2-2.4 1.1-3.4s2.7-2.5 4.4-2.8s3.7-.1 5.3.7s2.2-5.4 4.6 3.8s7.9 35.5 9.7 51.3s.7 35.2 1.3 43.6s1 4.5 2.2 7s3.9 2.7 4.9 8.1s.4 19.7 1.3 24.4s3 2.8 3.9 4.3s1.4 2.6 1.6 4.7s-.7 3.6-.2 7.8s2.9 10 3.3 17.1s-1.7 7.3-1.1 25.7s3.9 62.9 4.4 84.4s-1.8 13-1.5 44.7s1.9 106.7 3.8 145s6 64.7 7.4 85.2s1.2 28 1.1 38s-.2 14.8-1.6 21.8s-3.5 14.7-7 20.1s-8.4 9.2-14.3 12.6s-13.7 5.8-20.8 7.4s-14.6 2.3-22 2.3s-15.3-.8-22.3-2.3s-13.6-3.5-19.5-6.9s-12-7.9-15.8-13.6s-5.5-12.3-6.9-20.6s-2.7-6.1-1.6-29.4s6.9-75.8 8.6-110.5s.8-75.3 1.5-97.4s2.3-21.9 2.6-35.4s-1.2-28.1-1.1-45.4s.7-43.5 1.5-58s2.6-19 2.9-29s-1.3-20.3-1.1-30.9s1.8-26.4 2.4-32.6s.7-3.2 1.7-4.7s3.1.8 4-4.1s.2-19.7 1.5-25.4s5.6-4.3 6-8.7s-1.3-11.5-3.3-17.4s-6.3-14.4-8.7-18.4s-4-3.7-5.4-5.9s1-2.2-2.8-7.1s-16-16.8-20.4-22.6s-4.8-8.6-5.8-12.3s-.8-6-.4-9.9s2.1-10.4 3.2-13.4s2.9-3.2 3.5-4.7s-1.1-.9-.1-4.3s4.2-12.7 5.9-16s-.1-3 4.8-3.4zM30.4 22.2c-1.1 1-3.6 4.8-3.8 7.1s2.2 3.1 2.6 6.3s-2.9 8.4-.2 12.9s13.9 12.7 16.6 13.9s.2-4.3-.6-6.2s-1.9.3-3.8-5.2s-6.1-23.1-7.9-27.9s-1.7-1.9-2.9-.9z"/><path fill-opacity=".05" d="M21.7 3.7c4.8-.4 19.5-.3 24.3 1s2.9 1.9 4.6 6.5s4.5 20.4 5.5 21.4s0-11.9.7-14.9s1.8-2.5 3.4-3.3s3.9-1.9 6.3-1.6s6.1 1.3 7.8 3s.7 6.7 2.3 7.2s4.8-3.4 7-3.9s4.3.3 5.9.9s2.7 1.5 3.5 2.7s1.2 1.1 1.5 4.8s.2 16 .4 17.6s.5-6.1 1.1-7.9s1.2-2.2 2.7-2.6s4.6-.8 6.4-.1s2.9-4.9 4.8 3.9s5.4 33.5 6.5 49s-.3 35.3.2 44s1.5 6 2.7 8.6s3.9 3.5 4.6 7s-.5 9.5-.3 13.8s.7 9.3 1.6 11.9s3.1 2.3 4 3.5s1.2 1.6 1.4 3.5s-.7 4.7-.2 8.3s2.5 5.9 2.9 13.1s-1.3 11-.7 30s3.9 62.6 4.4 84.1s-1.8 13-1.5 44.6s1.9 106.8 3.8 145.1s5.9 64.5 7.4 84.9s1.1 28 1.1 37.5s.2 12.7-1.2 19.5s-3.4 15.6-6.8 21.1s-7.9 8.6-13.4 11.8s-13.1 5.6-20 7.1s-14.3 2.3-21.5 2.3s-15-.8-21.8-2.3s-13.3-3.5-18.9-6.7s-11-7.3-14.5-12.6s-5.2-11.4-6.5-19.5s-2.7-5.7-1.6-28.8s6.9-75.5 8.6-110.2s.8-75.7 1.5-97.8s2.3-21.2 2.6-34.6s-1.2-28.8-1.1-46.2s.7-43.6 1.5-57.9s2.6-18.4 2.9-28.4s-1.3-22.2-1.1-31.2s2.2-17.3 2.6-22.7s-.4-7.2-.3-9.5s.4-2.6 1.3-3.9s3.4-2.2 4.2-3.9s.8-2.2 1.1-6.5s.1-15.6.5-19.5s.9-2.8 1.9-4s4.4.7 4.5-3.3s-1.5-14.2-3.6-20.8s-6.7-15.1-9.2-19.2s-4.1-3.7-5.4-5.7s1.4-1.7-2.5-6.4s-16.2-16.2-20.6-21.7s-4.8-8.1-5.9-11.6s-.7-5.6-.3-9.4s2.1-10.2 3.2-13.1s2.8-2.9 3.4-4.4s-1.1-1.2-.1-4.5s4.1-12.6 5.9-15.7s-.3-3 4.5-3.4zM29.8 21.6c-1.3 1-3.8 5.1-4 7.4s2.4 3.2 2.7 6.4s-3.7 8-.8 12.7s15.3 14.7 18.3 15.8s0-6.5-.8-8.8s-1.9.4-3.9-5s-6-22.8-8-27.6s-2.3-2-3.5-.9z"/><path fill-opacity=".075" d="M21.8 3.8c4.7-.4 19.1-.2 23.9 1.1s2.5 1.1 4.4 6.5s5.8 24.3 6.8 25.8s-1-13.2-1-16.6s.5-2.5 1.4-3.6s2.5-2.4 4-3.1s2.9-1.3 4.9-1s5.6 1.5 7.2 2.6s2 2.2 2.4 4s-.1 6.5.1 6.9s.6-3.1 1.5-4.2s2.1-1.9 3.5-2.4s3.5-.8 5-.6s3.2.6 4.5 1.6s2.6.2 3.3 4.3s.2 16.9.5 20.3s.6 1.3 1-.2s.6-7 1.5-8.9s2.5-1.9 3.8-2.2s2.6-.3 4 .4s3.6 1.1 4.8 4s1.5 5.9 2.2 13.9s1.7 20.8 1.9 33.8s-1.1 35-.7 44s1.9 7.3 3.1 10s3.6 2.5 4.3 5.8s-.5 9.7-.3 14s.4 8.7 1.5 11.9s4.6 4.3 5.5 6.8s-.8 3.9-.3 8.1s2.9 9.5 3.3 16.7s-1.7 8.1-1.1 26.4s3.9 62.2 4.4 83.7s-1.8 13.7-1.4 45.4s1.8 106.4 3.7 144.7s6 64.7 7.4 84.9s1.1 27 1.1 36.4s.1 13.3-1.2 19.9s-3.1 14.8-6.3 20s-7.6 8.3-12.9 11.3s-12.4 5.3-19.1 6.8s-14.1 2.2-21.2 2.2s-14.9-.7-21.5-2.2s-13-3.5-18.3-6.5s-10.2-6.7-13.5-11.8s-4.9-10.8-6.2-18.6s-2.7-5.2-1.5-28.2s6.8-75.1 8.5-109.7s.8-76.1 1.5-98.2s2.4-21.2 2.6-34.6s-1.2-28.8-1.1-46.2s.7-43.6 1.5-58s2.6-18.4 2.9-28.3s-1.3-22.3-1.1-31.2s2.2-17 2.6-22.3s-.4-7.8-.3-10s.3-2.1 1.2-3.2s3.3-1.5 4.2-3.3s.9-2.8 1.2-7.4s.1-16.1.5-19.9s.6-2.1 1.7-3.1s4.9 1.4 5.1-3s-1.8-15.9-4-23s-7.1-15.5-9.6-19.7s-4-3.3-5.2-5.2s1.4-1.7-2.5-6.2s-16.4-15.6-20.8-20.9s-4.8-7.8-5.8-11.1s-.8-4.9-.4-8.5s2-10.1 3.1-13.1s3-3.2 3.5-4.6s-1.1-.9-.1-4.3s4.2-12.8 6-16s-.4-2.8 4.4-3.1zM29.2 21c-1.4 1.2-4 5.4-4.2 7.9s2.6 3.4 2.9 6.6s-4.2 7.6-1.1 12.6s16.4 16.4 19.5 17.4s-.2-9-1-11.6s-1.8.9-3.8-4.4s-6.1-22.8-8.1-27.6s-2.8-2-4.2-.9z"/></g><defs><path id="whTn-0" d="M30 87.3c-.6-1.1-1-3-1.2-3.7s-.2-.7-.1-.7s.6.8.5.6s-.6-.9-1-1.5s.2.1-1.8-1.9s-7.9-7.7-10.2-10s-2.6-2.5-3.9-3.9s-2.5-2.6-3.6-4s-2.3-3-3.1-4.6s-1.5-3.6-1.9-5.3s-.3-3.6-.3-5.2s0-1.6.7-4.3s2.9-9 3.8-11.3s.9-1.7 1.5-2.4s1.3-1.3 2-1.8s1.6-1 2.4-1.3s1.8-.5 2.7-.6s1.8 0 2.6.2s1.8.5 2.6.9s1.5.9 2.2 1.5s1.2 1.3 1.7 2.1s.9 1.6 1.2 2.5s.4 1.8.5 2.8s.2.7-.2 2.8s-2 7.9-2.4 9.4s-.3-.9.3-.3s2.1 2.6 3.1 3.8s.9.9 3.2 3s8.8 7.5 11.1 9.5s1.9 1.7 3 3.1s3 3.9 3.9 5.2s.9 1.5 1.3 2.5s1.1 2.3 1.4 3.5s.7 2.5.6 3.8s-.5 2.6-1.1 3.8s-1.7 2.5-2.8 3.5s-2.5 1.8-4 2.4s-3 1-4.5 1.2s-3-.1-4.4-.4s-2.6-1.1-3.6-1.9s-1.7-1.9-2.2-3z"/><path id="whTn-1" d="M43.4 154.7c-10.2-1.7.6-5.7.9-10.2s1.3-11.2 1.1-16.8s-.5-10.8-2.2-16.7s-5.8-13.3-8.3-18.7s-6.9-10.3-6.8-13.6s5.3-3.9 7.8-6s6.1-3.3 7.4-6.9s1.1-9.6.2-14.6s-6.1-11.7-5.5-15.2s6-5.7 9.1-5.5s7.2 6.4 9.4 6.5s2.1-5 3.7-6.1s4.2-.3 6.2-.3s4.2-.5 5.7.4s2.2 4.3 3.3 4.8s2-1.2 3.6-1.5s3.8-.3 5.6-.3s3.7-1.5 5.1.4s2.1 9.6 3.4 11.1s2.5-1.7 4.3-2s4.2-.7 6.1.1s4.7-1.3 5.4 4.3s-.1 20.3-.6 29.6s-1.9 18.1-2.6 26s-1.9 16.7-1.9 21.4s1.5 4.7 1.7 7.3s-.6 4.8-.6 8.5s10.8 11.7.6 14s-51.9 1.7-62.1 0z"/><path id="whTn-2" d="M92.9 51.3c.3-2.4 1.5-10.4 2-13s.7-2 1.4-2.7s1.8-1.3 2.8-1.6s2.5-.3 3.7-.1s2.4.7 3.3 1.4s1.7 1.5 2.1 2.4s.8.4.4 3s-2 10.5-2.6 13s-.4 1.1-.8 1.6s-1 .9-1.7 1.3s-1.5.5-2.3.6s-1.7 0-2.5-.1s-1.7-.5-2.5-.8s-1.4-.9-1.9-1.4s-.9-1.1-1.2-1.7s-.5.6-.2-1.9z"/><path id="whTn-3" d="M75 42.6c0-1.1 0-1.5.2-4.3s.5-10.1.7-12.5s.2-1.3.4-2s.6-1.1 1-1.6s1-1 1.5-1.4s.8-.8 1.9-1s3.1-.7 4.7-.6s3.4.9 4.4 1.3s1.3.8 1.8 1.3s.9 1 1.2 1.6s.6 1.2.7 1.8s.4-.4.2 2s-1 9.6-1.3 12.4s-.3 3.2-.5 4.3s-.3 1.6-.8 2.2s-1.2 1.3-2 1.8s-1.8.9-2.8 1.1s-2.2.3-3.3.2s-2.2-.4-3.2-.7s-1.9-.9-2.6-1.5s-1.4-1.4-1.7-2.1s-.4-1.2-.5-2.3z"/><path id="whTn-4" d="M56.5 39.9c-.2-1.1-.1-1-.2-4.2s-.4-11.8-.4-14.6s.1-1.5.4-2.2s.5-1.3.9-1.9s1-1.2 1.6-1.7s1.3-.9 2-1.3s1.5-.6 2.4-.7s1.8-.3 2.7-.3s1.8.1 2.6.3s1.7.4 2.4.7s1.4.8 2 1.3s1.2 1.1 1.6 1.7s.7 1.2 1 1.9s.3-.6.3 2.2s-.3 11.5-.4 14.6s0 3.1-.2 4.2s-.2 1.8-.7 2.6s-1.2 1.5-2 2.1s-1.9 1.1-3 1.4s-2.4.5-3.6.5s-2.5-.2-3.6-.5s-2.2-.8-3.1-1.4s-1.6-1.4-2-2.1s-.6-1.4-.7-2.6z"/><path id="whTn-5" d="M32.6 13.5c-1.2 2.7-5.6 11.1-6.9 13.6s-.4 1.1-1.1 1.8s-2.4 1.9-3.3 2.4s-1.3.4-1.9.4s-1.4.1-2 0s-1.3-.3-1.9-.6s-1.2-.6-1.7-1.1s-.9-.9-1.3-1.4s-.6-1.2-.8-1.8s-.5-1-.4-2s-.4-1 .7-4s4.7-11.4 6-14.1s.9-1.4 1.6-1.9s1.5-1 2.4-1.2s2-.3 3-.2s2.1.5 3 .9s1.9 1.1 2.6 1.7s1.4 1.6 1.8 2.4s.6 1.8.7 2.6s.7-.1-.5 2.5z"/><path id="whTn-6" d="M25.5 20.7c-.9 0-2.8.3-4.1 0s-2.8-1.2-3.6-1.7s-.9-.9-1.2-1.4s-.7-1.1-.8-1.6s-.4-2-.3-1.8s.7 2.7.8 3.1s-.2 0-.4-.6s-1.3-1.7-1-3.3s1.4-5.3 2.5-6.8s3.1-1.8 4.3-2.2s1.3-.3 2.6-.3s1.5 0 4.8.3s11.9 1.3 14.9 1.7s2.1.4 2.9.9s1.4 1.2 1.9 2s.9 1.8 1.1 2.7s.3 2.1.2 3.2s-.4 2.1-.8 3s-1.1 1.8-1.7 2.5s-1.5 1.2-2.3 1.5s.6.6-2.5.3s-13.6-1.6-16.4-1.9s-.1.3-.9.4z"/><path id="whTn-7" d="M32.1 7c.3-.4.3-2.3 2.4-2.8s8-.7 10.3-.1s2.9 2.9 3.7 4.1s.7 1.1 1.2 2.6s1.3 4.8 1.8 6.6s.4 1.5 1 4.2s1.9 8.6 2.8 12.3s2 7.8 2.4 9.9s.2 1.7-.1 2.6s-.7 1.7-1.4 2.5s-1.6 1.5-2.5 2s-2.2 1-3.3 1.3s-2.4.4-3.5.4s-2.3-.3-3.2-.6s-1.8-.9-2.4-1.6s-.8-.6-1.3-2.2s-1-4.2-1.8-7.2s-2-8.3-2.6-10.8s-.6-2.4-1.1-4.2s-1.3-5.3-1.8-6.8s-1-1.3-1.3-2s-.7-1.4-.9-2.2s-.3-1.6-.3-2.3s0-1.6.2-2.3s.4-1.4.7-2s1-1.3 1.2-1.6s-.6.6-.2.2z"/><path id="whTn-8" d="M39.4 166.8c-12.8 2.8-6.2 8.7-8 16.7s-2.5 23.3-2.7 31.6s1.7 10.3 1.4 18.6s-2.2 15.5-2.9 31.7s-1.5 48.6-1.5 65.1s1.3 21 1.1 33.4s-1.9 18.6-2.6 41s-1.1 50.8-1.5 93s-18.4 133.3-1.1 159.9s87.6 26.7 104.9 0s-.6-119.3-1.1-159.9s-1.3-58.9-1.9-83.7s-1.8-48.1-1.8-65.1s1.4-21.7 1.3-37.2s-1.7-41-2.5-55.8s-1.7-24.2-1.8-33.5s1.5-15.5 1.1-22.3s-1.5-13.1-3.4-18.6s5.1-12.4-7.8-14.9s-56.3-2.8-69.2 0z"/><path id="whTn-9" d="M39.4 137.2c2.8-3.4 9.8-2.9 15.6-3.7s12.7-1.1 19-1.1s13.3.2 19.1.9s12.8.1 15.5 3.5s.8 10.9 1.2 17.4s3.6 18.9.7 21.9s-12.2-3.2-18.2-4.1s-12.2-1.1-18.3-1.1s-12.1.2-18.2 1.1s-15.3 7-18.2 4.1s.4-15.4.7-21.9s-1.6-13.5 1.1-17z"/><path id="whTn-a" d="M30 87.3c-.6-1.1-1-3-1.2-3.7s-.2-.7-.1-.7s.6.8.5.6s-.6-.9-1-1.5s.2.1-1.8-1.9s-7.9-7.7-10.2-10s-2.6-2.5-3.9-3.9s-2.5-2.6-3.6-4s-2.3-3-3.1-4.6s-1.5-3.6-1.9-5.3s-.3-3.6-.3-5.2s0-1.6.7-4.3s2.9-9 3.8-11.3s.9-1.7 1.5-2.4s1.3-1.3 2-1.8s1.6-1 2.4-1.3s1.8-.5 2.7-.6s1.8 0 2.6.2s1.8.5 2.6.9s1.5.9 2.2 1.5s1.2 1.3 1.7 2.1s.9 1.6 1.2 2.5s.4 1.8.5 2.8s.2.7-.2 2.8s-2 7.9-2.4 9.4s-.3-.9.3-.3s2.1 2.6 3.1 3.8s.9.9 3.2 3s8.8 7.5 11.1 9.5s1.9 1.7 3 3.1s3 3.9 3.9 5.2s.9 1.5 1.3 2.5s1.1 2.3 1.4 3.5s.7 2.5.6 3.8s-.5 2.6-1.1 3.8s-1.7 2.5-2.8 3.5s-2.5 1.8-4 2.4s-3 1-4.5 1.2s-3-.1-4.4-.4s-2.6-1.1-3.6-1.9s-1.7-1.9-2.2-3zM43.4 154.7c-10.2-1.7.6-5.7.9-10.2s1.3-11.2 1.1-16.8s-.5-10.8-2.2-16.7s-5.8-13.3-8.3-18.7s-6.9-10.3-6.8-13.6s5.3-3.9 7.8-6s6.1-3.3 7.4-6.9s1.1-9.6.2-14.6s-6.1-11.7-5.5-15.2s6-5.7 9.1-5.5s7.2 6.4 9.4 6.5s2.1-5 3.7-6.1s4.2-.3 6.2-.3s4.2-.5 5.7.4s2.2 4.3 3.3 4.8s2-1.2 3.6-1.5s3.8-.3 5.6-.3s3.7-1.5 5.1.4s2.1 9.6 3.4 11.1s2.5-1.7 4.3-2s4.2-.7 6.1.1s4.7-1.3 5.4 4.3s-.1 20.3-.6 29.6s-1.9 18.1-2.6 26s-1.9 16.7-1.9 21.4s1.5 4.7 1.7 7.3s-.6 4.8-.6 8.5s10.8 11.7.6 14s-51.9 1.7-62.1 0zM92.9 51.3c.3-2.4 1.5-10.4 2-13s.7-2 1.4-2.7s1.8-1.3 2.8-1.6s2.5-.3 3.7-.1s2.4.7 3.3 1.4s1.7 1.5 2.1 2.4s.8.4.4 3s-2 10.5-2.6 13s-.4 1.1-.8 1.6s-1 .9-1.7 1.3s-1.5.5-2.3.6s-1.7 0-2.5-.1s-1.7-.5-2.5-.8s-1.4-.9-1.9-1.4s-.9-1.1-1.2-1.7s-.5.6-.2-1.9zM75 42.6c0-1.1 0-1.5.2-4.3s.5-10.1.7-12.5s.2-1.3.4-2s.6-1.1 1-1.6s1-1 1.5-1.4s.8-.8 1.9-1s3.1-.7 4.7-.6s3.4.9 4.4 1.3s1.3.8 1.8 1.3s.9 1 1.2 1.6s.6 1.2.7 1.8s.4-.4.2 2s-1 9.6-1.3 12.4s-.3 3.2-.5 4.3s-.3 1.6-.8 2.2s-1.2 1.3-2 1.8s-1.8.9-2.8 1.1s-2.2.3-3.3.2s-2.2-.4-3.2-.7s-1.9-.9-2.6-1.5s-1.4-1.4-1.7-2.1s-.4-1.2-.5-2.3zM56.5 39.9c-.2-1.1-.1-1-.2-4.2s-.4-11.8-.4-14.6s.1-1.5.4-2.2s.5-1.3.9-1.9s1-1.2 1.6-1.7s1.3-.9 2-1.3s1.5-.6 2.4-.7s1.8-.3 2.7-.3s1.8.1 2.6.3s1.7.4 2.4.7s1.4.8 2 1.3s1.2 1.1 1.6 1.7s.7 1.2 1 1.9s.3-.6.3 2.2s-.3 11.5-.4 14.6s0 3.1-.2 4.2s-.2 1.8-.7 2.6s-1.2 1.5-2 2.1s-1.9 1.1-3 1.4s-2.4.5-3.6.5s-2.5-.2-3.6-.5s-2.2-.8-3.1-1.4s-1.6-1.4-2-2.1s-.6-1.4-.7-2.6zM32.6 13.5c-1.2 2.7-5.6 11.1-6.9 13.6s-.4 1.1-1.1 1.8s-2.4 1.9-3.3 2.4s-1.3.4-1.9.4s-1.4.1-2 0s-1.3-.3-1.9-.6s-1.2-.6-1.7-1.1s-.9-.9-1.3-1.4s-.6-1.2-.8-1.8s-.5-1-.4-2s-.4-1 .7-4s4.7-11.4 6-14.1s.9-1.4 1.6-1.9s1.5-1 2.4-1.2s2-.3 3-.2s2.1.5 3 .9s1.9 1.1 2.6 1.7s1.4 1.6 1.8 2.4s.6 1.8.7 2.6s.7-.1-.5 2.5zM25.5 20.7c-.9 0-2.8.3-4.1 0s-2.8-1.2-3.6-1.7s-.9-.9-1.2-1.4s-.7-1.1-.8-1.6s-.4-2-.3-1.8s.7 2.7.8 3.1s-.2 0-.4-.6s-1.3-1.7-1-3.3s1.4-5.3 2.5-6.8s3.1-1.8 4.3-2.2s1.3-.3 2.6-.3s1.5 0 4.8.3s11.9 1.3 14.9 1.7s2.1.4 2.9.9s1.4 1.2 1.9 2s.9 1.8 1.1 2.7s.3 2.1.2 3.2s-.4 2.1-.8 3s-1.1 1.8-1.7 2.5s-1.5 1.2-2.3 1.5s.6.6-2.5.3s-13.6-1.6-16.4-1.9s-.1.3-.9.4zM32.1 7c.3-.4.3-2.3 2.4-2.8s8-.7 10.3-.1s2.9 2.9 3.7 4.1s.7 1.1 1.2 2.6s1.3 4.8 1.8 6.6s.4 1.5 1 4.2s1.9 8.6 2.8 12.3s2 7.8 2.4 9.9s.2 1.7-.1 2.6s-.7 1.7-1.4 2.5s-1.6 1.5-2.5 2s-2.2 1-3.3 1.3s-2.4.4-3.5.4s-2.3-.3-3.2-.6s-1.8-.9-2.4-1.6s-.8-.6-1.3-2.2s-1-4.2-1.8-7.2s-2-8.3-2.6-10.8s-.6-2.4-1.1-4.2s-1.3-5.3-1.8-6.8s-1-1.3-1.3-2s-.7-1.4-.9-2.2s-.3-1.6-.3-2.3s0-1.6.2-2.3s.4-1.4.7-2s1-1.3 1.2-1.6s-.6.6-.2.2z"/><clipPath id="whTn-b"><use href="#whTn-a"/></clipPath><radialGradient id="whTn-c"><stop offset="0" stop-color="#d29a73" stop-opacity=".8"/><stop offset=".5" stop-color="#d29a73" stop-opacity=".3"/><stop offset="1" stop-color="#d29a73" stop-opacity="0"/></radialGradient><radialGradient id="whTn-d"><stop offset="0" stop-color="#c4805a" stop-opacity=".85"/><stop offset=".55" stop-color="#c4805a" stop-opacity=".32"/><stop offset="1" stop-color="#c4805a" stop-opacity="0"/></radialGradient><radialGradient id="whTn-e"><stop offset="0" stop-color="#4c2a17" stop-opacity=".6"/><stop offset=".55" stop-color="#4c2a17" stop-opacity=".2"/><stop offset="1" stop-color="#4c2a17" stop-opacity="0"/></radialGradient><radialGradient id="whTn-f"><stop offset="0" stop-color="#b5503a" stop-opacity=".55"/><stop offset=".55" stop-color="#b5503a" stop-opacity=".2"/><stop offset="1" stop-color="#b5503a" stop-opacity="0"/></radialGradient><linearGradient id="whTn-g" gradientUnits="userSpaceOnUse" x1="12.4" y1="66.3" x2="28" y2="51"><stop offset="0" stop-color="#4c2a17"/><stop offset=".042" stop-color="#6f3f25"/><stop offset=".229" stop-color="#8c5434"/><stop offset=".604" stop-color="#995d3a"/><stop offset=".979" stop-color="#79452a"/><stop offset="1" stop-color="#623720"/></linearGradient><linearGradient id="whTn-h" gradientUnits="userSpaceOnUse" x1="41" y1="82.6" x2="18.6" y2="24.2"><stop offset="0" stop-color="#9a5e3b"/><stop offset=".198" stop-color="#9a5e3b"/><stop offset=".542" stop-color="#9a5e3b" stop-opacity="0"/><stop offset=".742" stop-color="#764328" stop-opacity="0"/><stop offset="1" stop-color="#764328" stop-opacity=".28"/></linearGradient><linearGradient id="whTn-i" gradientUnits="userSpaceOnUse" x1="13.7" y1="46.6" x2="17.5" y2="27.5"><stop offset="0" stop-color="#9a6650"/><stop offset=".35" stop-color="#bd8b76"/><stop offset=".85" stop-color="#bd8b76"/><stop offset="1" stop-color="#dcbca8"/></linearGradient><clipPath id="whTn-j"><use href="#whTn-0"/></clipPath><clipPath id="whTn-k"><use href="#whTn-0"/></clipPath><linearGradient id="whTn-l" gradientUnits="userSpaceOnUse" x1="94" y1="44.7" x2="107.3" y2="47"><stop offset="0" stop-color="#824c2e"/><stop offset=".146" stop-color="#c28861"/><stop offset=".313" stop-color="#d09871"/><stop offset=".583" stop-color="#985d3a"/><stop offset=".979" stop-color="#57311c"/><stop offset="1" stop-color="#5b331d"/></linearGradient><linearGradient id="whTn-m" gradientUnits="userSpaceOnUse" x1="99.5" y1="52.5" x2="102.8" y2="33.9"><stop offset="0" stop-color="#9a5e3b"/><stop offset=".189" stop-color="#9a5e3b"/><stop offset=".49" stop-color="#9a5e3b" stop-opacity="0"/><stop offset=".56" stop-color="#764328" stop-opacity="0"/><stop offset="1" stop-color="#764328" stop-opacity=".58"/></linearGradient><clipPath id="whTn-n"><use href="#whTn-2"/></clipPath><clipPath id="whTn-o"><use href="#whTn-2"/></clipPath><linearGradient id="whTn-p" gradientUnits="userSpaceOnUse" x1="75.4" y1="35.5" x2="92.7" y2="36.8"><stop offset="0" stop-color="#7f4a2d"/><stop offset=".125" stop-color="#b77c56"/><stop offset=".313" stop-color="#d19972"/><stop offset=".542" stop-color="#a86c47"/><stop offset=".979" stop-color="#57311c"/><stop offset="1" stop-color="#5b331d"/></linearGradient><linearGradient id="whTn-q" gradientUnits="userSpaceOnUse" x1="83.5" y1="43.3" x2="85.4" y2="19.2"><stop offset="0" stop-color="#9a5e3b"/><stop offset=".137" stop-color="#9a5e3b"/><stop offset=".449" stop-color="#9a5e3b" stop-opacity="0"/><stop offset=".533" stop-color="#764328" stop-opacity="0"/><stop offset="1" stop-color="#764328" stop-opacity=".58"/></linearGradient><clipPath id="whTn-r"><use href="#whTn-3"/></clipPath><clipPath id="whTn-s"><use href="#whTn-3"/></clipPath><linearGradient id="whTn-t" gradientUnits="userSpaceOnUse" x1="56.2" y1="32.6" x2="75.5" y2="32.6"><stop offset="0" stop-color="#7d482b"/><stop offset=".146" stop-color="#b97e58"/><stop offset=".313" stop-color="#d19972"/><stop offset=".708" stop-color="#8f5635"/><stop offset=".938" stop-color="#5f351f"/><stop offset="1" stop-color="#5b331d"/></linearGradient><linearGradient id="whTn-u" gradientUnits="userSpaceOnUse" x1="65.9" y1="39.9" x2="65.9" y2="13"><stop offset="0" stop-color="#9a5e3b"/><stop offset=".117" stop-color="#9a5e3b"/><stop offset=".435" stop-color="#9a5e3b" stop-opacity="0"/><stop offset=".524" stop-color="#764328" stop-opacity="0"/><stop offset="1" stop-color="#764328" stop-opacity=".58"/></linearGradient><clipPath id="whTn-v"><use href="#whTn-4"/></clipPath><clipPath id="whTn-w"><use href="#whTn-0"/></clipPath><linearGradient id="whTn-x" gradientUnits="userSpaceOnUse" x1="31" y1="16.5" x2="16.7" y2="9.8"><stop offset="0" stop-color="#4c2a17"/><stop offset=".125" stop-color="#4c2a17"/><stop offset=".292" stop-color="#784529"/><stop offset=".833" stop-color="#aa6e49"/><stop offset=".958" stop-color="#a66a45"/><stop offset="1" stop-color="#925837"/></linearGradient><linearGradient id="whTn-y" gradientUnits="userSpaceOnUse" x1="25.3" y1="10.1" x2="15.5" y2="31.1"><stop offset="0" stop-color="#9a5e3b" stop-opacity="0"/><stop offset=".427" stop-color="#764328" stop-opacity="0"/><stop offset="1" stop-color="#764328" stop-opacity=".25"/></linearGradient><linearGradient id="whTn-z" gradientUnits="userSpaceOnUse" x1="21" y1="17.8" x2="15.6" y2="29.4"><stop offset="0" stop-color="#9a6650"/><stop offset=".35" stop-color="#bd8b76"/><stop offset=".85" stop-color="#bd8b76"/><stop offset="1" stop-color="#dcbca8"/></linearGradient><clipPath id="whTn-10"><use href="#whTn-5"/></clipPath><path id="whTn-11" d="M32.6 13.5c-1.2 2.7-5.6 11.1-6.9 13.6s-.4 1.1-1.1 1.8s-2.4 1.9-3.3 2.4s-1.3.4-1.9.4s-1.4.1-2 0s-1.3-.3-1.9-.6s-1.2-.6-1.7-1.1s-.9-.9-1.3-1.4s-.6-1.2-.8-1.8s-.5-1-.4-2s-.4-1 .7-4s4.7-11.4 6-14.1s.9-1.4 1.6-1.9s1.5-1 2.4-1.2s2-.3 3-.2s2.1.5 3 .9s1.9 1.1 2.6 1.7s1.4 1.6 1.8 2.4s.6 1.8.7 2.6s.7-.1-.5 2.5zM30 87.3c-.6-1.1-1-3-1.2-3.7s-.2-.7-.1-.7s.6.8.5.6s-.6-.9-1-1.5s.2.1-1.8-1.9s-7.9-7.7-10.2-10s-2.6-2.5-3.9-3.9s-2.5-2.6-3.6-4s-2.3-3-3.1-4.6s-1.5-3.6-1.9-5.3s-.3-3.6-.3-5.2s0-1.6.7-4.3s2.9-9 3.8-11.3s.9-1.7 1.5-2.4s1.3-1.3 2-1.8s1.6-1 2.4-1.3s1.8-.5 2.7-.6s1.8 0 2.6.2s1.8.5 2.6.9s1.5.9 2.2 1.5s1.2 1.3 1.7 2.1s.9 1.6 1.2 2.5s.4 1.8.5 2.8s.2.7-.2 2.8s-2 7.9-2.4 9.4s-.3-.9.3-.3s2.1 2.6 3.1 3.8s.9.9 3.2 3s8.8 7.5 11.1 9.5s1.9 1.7 3 3.1s3 3.9 3.9 5.2s.9 1.5 1.3 2.5s1.1 2.3 1.4 3.5s.7 2.5.6 3.8s-.5 2.6-1.1 3.8s-1.7 2.5-2.8 3.5s-2.5 1.8-4 2.4s-3 1-4.5 1.2s-3-.1-4.4-.4s-2.6-1.1-3.6-1.9s-1.7-1.9-2.2-3z"/><clipPath id="whTn-12"><use href="#whTn-11"/></clipPath><linearGradient id="whTn-13" gradientUnits="userSpaceOnUse" x1="27.5" y1="20.4" x2="29.2" y2="4.4"><stop offset="0" stop-color="#4c2a17"/><stop offset=".271" stop-color="#8a5233"/><stop offset=".354" stop-color="#955a38"/><stop offset=".604" stop-color="#d29a73"/><stop offset=".833" stop-color="#c78e67"/><stop offset="1" stop-color="#885031"/></linearGradient><linearGradient id="whTn-14" gradientUnits="userSpaceOnUse" x1="43.6" y1="14.2" x2="17.9" y2="22.7"><stop offset="0" stop-color="#9a5e3b" stop-opacity="0"/><stop offset=".594" stop-color="#764328" stop-opacity="0"/><stop offset="1" stop-color="#764328" stop-opacity=".35"/></linearGradient><clipPath id="whTn-15"><use href="#whTn-6"/></clipPath><path id="whTn-16" d="M25.5 20.7c-.9 0-2.8.3-4.1 0s-2.8-1.2-3.6-1.7s-.9-.9-1.2-1.4s-.7-1.1-.8-1.6s-.4-2-.3-1.8s.7 2.7.8 3.1s-.2 0-.4-.6s-1.3-1.7-1-3.3s1.4-5.3 2.5-6.8s3.1-1.8 4.3-2.2s1.3-.3 2.6-.3s1.5 0 4.8.3s11.9 1.3 14.9 1.7s2.1.4 2.9.9s1.4 1.2 1.9 2s.9 1.8 1.1 2.7s.3 2.1.2 3.2s-.4 2.1-.8 3s-1.1 1.8-1.7 2.5s-1.5 1.2-2.3 1.5s.6.6-2.5.3s-13.6-1.6-16.4-1.9s-.1.3-.9.4zM56.5 39.9c-.2-1.1-.1-1-.2-4.2s-.4-11.8-.4-14.6s.1-1.5.4-2.2s.5-1.3.9-1.9s1-1.2 1.6-1.7s1.3-.9 2-1.3s1.5-.6 2.4-.7s1.8-.3 2.7-.3s1.8.1 2.6.3s1.7.4 2.4.7s1.4.8 2 1.3s1.2 1.1 1.6 1.7s.7 1.2 1 1.9s.3-.6.3 2.2s-.3 11.5-.4 14.6s0 3.1-.2 4.2s-.2 1.8-.7 2.6s-1.2 1.5-2 2.1s-1.9 1.1-3 1.4s-2.4.5-3.6.5s-2.5-.2-3.6-.5s-2.2-.8-3.1-1.4s-1.6-1.4-2-2.1s-.6-1.4-.7-2.6z"/><clipPath id="whTn-17"><use href="#whTn-16"/></clipPath><linearGradient id="whTn-18" gradientUnits="userSpaceOnUse" x1="33.5" y1="22" x2="51.5" y2="17.5"><stop offset="0" stop-color="#734127"/><stop offset=".021" stop-color="#854e30"/><stop offset=".208" stop-color="#aa6e49"/><stop offset=".375" stop-color="#bf855f"/><stop offset=".708" stop-color="#8f5635"/><stop offset="1" stop-color="#5b331d"/></linearGradient><linearGradient id="whTn-19" gradientUnits="userSpaceOnUse" x1="48.9" y1="46" x2="26.4" y2="9.1"><stop offset="0" stop-color="#9a5e3b"/><stop offset=".066" stop-color="#9a5e3b"/><stop offset=".407" stop-color="#9a5e3b" stop-opacity="0"/><stop offset=".785" stop-color="#764328" stop-opacity="0"/><stop offset="1" stop-color="#764328" stop-opacity=".35"/></linearGradient><clipPath id="whTn-1a"><use href="#whTn-7"/></clipPath><linearGradient id="whTn-1b" gradientUnits="userSpaceOnUse" x1="74" y1="43.3" x2="74" y2="76.8"><stop offset="0" stop-color="#4c2a17" stop-opacity="0"/><stop offset="1" stop-color="#4c2a17"/></linearGradient><linearGradient id="whTn-1c" gradientUnits="userSpaceOnUse" x1="74" y1="99.8" x2="74" y2="129.6"><stop offset="0" stop-color="#b0744e" stop-opacity="0"/><stop offset="1" stop-color="#b0744e"/></linearGradient><clipPath id="whTn-1d"><use href="#whTn-8"/></clipPath><clipPath id="whTn-1e"><use href="#whTn-9"/></clipPath><radialGradient id="whTn-1f"><stop offset="0" stop-color="#33495f" stop-opacity=".5"/><stop offset=".6" stop-color="#33495f" stop-opacity=".18"/><stop offset="1" stop-color="#33495f" stop-opacity="0"/></radialGradient><radialGradient id="whTn-1g"><stop offset="0" stop-color="#97b2ca" stop-opacity=".42"/><stop offset=".6" stop-color="#97b2ca" stop-opacity=".14"/><stop offset="1" stop-color="#97b2ca" stop-opacity="0"/></radialGradient><linearGradient id="whTn-1h" gradientUnits="userSpaceOnUse" x1="22.1" y1="125.9" x2="125.9" y2="125.9"><stop offset="0" stop-color="#5c7997"/><stop offset=".16" stop-color="#7290ac"/><stop offset=".4" stop-color="#6b89a6"/><stop offset=".62" stop-color="#62809e"/><stop offset=".86" stop-color="#506c8a"/><stop offset="1" stop-color="#455f7a"/></linearGradient><linearGradient id="whTn-1i" gradientUnits="userSpaceOnUse" x1="37.6" y1="125.9" x2="110.5" y2="125.9"><stop offset="0" stop-color="#5c7997"/><stop offset=".16" stop-color="#7290ac"/><stop offset=".4" stop-color="#6b89a6"/><stop offset=".62" stop-color="#62809e"/><stop offset=".86" stop-color="#506c8a"/><stop offset="1" stop-color="#455f7a"/></linearGradient></defs><use href="#whTn-a" fill="none" stroke="#4a2814" stroke-width="1" stroke-opacity=".75" stroke-linejoin="round"/><use href="#whTn-a" fill="#9a5e3b"/><use href="#whTn-0" fill="url(#whTn-g)"/><use href="#whTn-0" fill="url(#whTn-h)"/><path d="M17.6 55.4c-.1 0-.6.1-.9.2s-.5.2-.8.3s-.5.3-.7.5s-.6.6-.7.7" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".084" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 52.2c-.3.1-1.2.3-1.7.4s-1.1.4-1.5.7s-1 .6-1.5.9s-1 1-1.2 1.2" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".156" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.1 50.8c-.3 0-1 .1-1.5.2s-.9.3-1.3.5s-.8.5-1.2.8s-.8.9-1 1.1" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".132" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.4 48.9c-.1 0-.5 0-.8.1s-.5.1-.8.2s-.4.3-.6.5s-.5.6-.5.7" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".072" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.9 48.3c-.6.2-2.9.8-3.9.9s-1.2-.1-1.8-.2s-.9-.1-1.7-.5s-2.7-1.9-3.3-2.3" fill="none" stroke="#b0744e" stroke-width="2.5" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.5 27.5c-.7-.2-1.2-.4-2.1-.2s-2.1.5-3 1.2s-1.6 2.2-2.1 3.2s-.4 1.3-.7 2.5s-.7 3.5-.8 5.1s-.2 3.1.2 4.2s1.1 1.7 1.9 2.3s1.9.6 2.8.8s2.2.3 2.9.3s.9.1 1.5-.4s1.6-1.7 2.1-2.5s.6-1.1.9-2.3s.9-3.4 1.1-5s.4-3.3.2-4.6s-1.1-2.3-1.5-3s-.8-.7-1.4-1s-1.3-.5-2-.6z" fill="url(#whTn-i)" stroke="#7d4c35" stroke-width=".9" stroke-opacity=".45"/><path d="M20 44.8c-.4.2-1.2.9-2.2 1.2s-3.1.5-4.1.5s-1-.1-1.8-.7s-2.7-2.7-3.3-3.3" fill="none" stroke="#56301c" stroke-width="1.4" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 40.5c.1-.5.3-1.7.5-2.5s.3-1.7.5-2.5s.3-1.7.5-2.5s.4-2.1.5-2.5" fill="none" stroke="#ecd3c3" stroke-width="1.4" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><path d="M21.8 29.8c-.3-.1-.9-.6-1.7-.9s-2.4-.7-3.7-.8s-3.1-.1-3.7-.1" fill="none" stroke="#ecd3c3" stroke-width="1" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whTn-j)"><ellipse cx="17.2" cy="35.1" rx="10.2" ry="11.3" transform="rotate(11.3 17.2 35.1)" fill="url(#whTn-f)" fill-opacity=".2"/></g><g clip-path="url(#whTn-k)" fill="none" stroke="#4c2a17"><use href="#whTn-1" stroke-width="2" stroke-opacity=".09" transform="translate(.7 .9)"/><use href="#whTn-1" stroke-width="4.5" stroke-opacity=".07" transform="translate(.7 .9)"/><use href="#whTn-1" stroke-width="7.8" stroke-opacity=".05" transform="translate(.7 .9)"/></g><use href="#whTn-1" fill="#9a5e3b"/><use href="#whTn-2" fill="url(#whTn-l)"/><use href="#whTn-2" fill="url(#whTn-m)"/><g clip-path="url(#whTn-n)"><ellipse cx="100.2" cy="41.9" rx="5.8" ry="4.1" transform="rotate(100 100.2 41.9)" fill="url(#whTn-d)" fill-opacity=".26"/><ellipse cx="101.9" cy="38.8" rx="6.6" ry="4.2" transform="rotate(100 101.9 38.8)" fill="url(#whTn-f)" fill-opacity=".22"/></g><g clip-path="url(#whTn-o)" fill="none" stroke="#4c2a17"><use href="#whTn-3" stroke-width="2" stroke-opacity=".09" transform="translate(.7 .9)"/><use href="#whTn-3" stroke-width="4.5" stroke-opacity=".07" transform="translate(.7 .9)"/><use href="#whTn-3" stroke-width="7.8" stroke-opacity=".05" transform="translate(.7 .9)"/></g><use href="#whTn-3" fill="url(#whTn-p)"/><use href="#whTn-3" fill="url(#whTn-q)"/><g clip-path="url(#whTn-r)"><ellipse cx="83.1" cy="30.3" rx="7.4" ry="5.3" transform="rotate(94.5 83.1 30.3)" fill="url(#whTn-d)" fill-opacity=".26"/><ellipse cx="84.9" cy="25.6" rx="8.5" ry="5.4" transform="rotate(94.5 84.9 25.6)" fill="url(#whTn-f)" fill-opacity=".22"/></g><g clip-path="url(#whTn-s)" fill="none" stroke="#4c2a17"><use href="#whTn-4" stroke-width="2" stroke-opacity=".09" transform="translate(.7 .9)"/><use href="#whTn-4" stroke-width="4.5" stroke-opacity=".07" transform="translate(.7 .9)"/><use href="#whTn-4" stroke-width="7.8" stroke-opacity=".05" transform="translate(.7 .9)"/></g><use href="#whTn-4" fill="url(#whTn-t)"/><use href="#whTn-4" fill="url(#whTn-u)"/><g clip-path="url(#whTn-v)"><ellipse cx="64.3" cy="25.8" rx="8.3" ry="5.9" transform="rotate(90 64.3 25.8)" fill="url(#whTn-d)" fill-opacity=".26"/><ellipse cx="65.9" cy="20.1" rx="9.4" ry="6" transform="rotate(90 65.9 20.1)" fill="url(#whTn-f)" fill-opacity=".22"/></g><path d="M75.8 23.4c-.1 2.1-.3 10.3-.4 12.3" fill="none" stroke="#4a2814" stroke-width=".8" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whTn-w)" fill="none" stroke="#4c2a17"><use href="#whTn-5" stroke-width="2" stroke-opacity=".09" transform="translate(.7 .9)"/><use href="#whTn-5" stroke-width="4.5" stroke-opacity=".07" transform="translate(.7 .9)"/><use href="#whTn-5" stroke-width="7.8" stroke-opacity=".05" transform="translate(.7 .9)"/></g><use href="#whTn-5" fill="url(#whTn-x)"/><use href="#whTn-5" fill="url(#whTn-y)"/><path d="M17.4 15.6c.7.1 3.1.1 4.3.7s2.8 2.4 3.4 2.9" fill="none" stroke="#b0744e" stroke-width="1.8" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.6 29.4c.5.3.9.5 1.5.6s1.7.1 2.5-.2s1.5-1.1 1.9-1.6s.5-.8.9-1.5s1-2.1 1.3-3.1s.6-2 .4-2.8s-.6-1.4-1.1-1.9s-1.1-.8-2-1.1s-2.4-.9-3.2-.8s-1.5.7-2 1.1s-.5.6-.9 1.4s-1.1 2-1.5 3s-.8 2.1-.8 2.9s.5 1.8.8 2.3s.4.6.8.9s.9.6 1.4.8z" fill="url(#whTn-z)" stroke="#7d4c35" stroke-width=".7" stroke-opacity=".45"/><path d="M16.1 17.7c.3 0 1-.3 1.8-.3s2.2.1 3.1.5s1.8 1.4 2.3 2s.8 1.3 1 1.6" fill="none" stroke="#56301c" stroke-width="1.1" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M21.5 22.1c-.1.3-.5 1-.7 1.5s-.5 1.1-.7 1.6s-.5 1-.7 1.5s-.6 1.2-.7 1.5" fill="none" stroke="#ecd3c3" stroke-width="1.1" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.8 27c.4.3 1.3 1.1 2.4 1.6s3.4 1.2 4.1 1.5" fill="none" stroke="#ecd3c3" stroke-width=".8" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whTn-10)"><ellipse cx="18.2" cy="25.3" rx="7.5" ry="8.3" transform="rotate(-155 18.2 25.3)" fill="url(#whTn-f)" fill-opacity=".22"/></g><path d="M23.1 30.3c-.3.2-1.2.7-1.8 1s-1.3.4-1.9.4s-1.4.1-2 0s-1.3-.3-1.9-.6s-1.2-.6-1.7-1.1s-1-1.2-1.3-1.4" fill="none" stroke="#4a2814" stroke-width=".8" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whTn-12)" fill="none" stroke="#4c2a17"><use href="#whTn-6" stroke-width="2" stroke-opacity=".09" transform="translate(.7 .9)"/><use href="#whTn-6" stroke-width="4.5" stroke-opacity=".07" transform="translate(.7 .9)"/><use href="#whTn-6" stroke-width="7.8" stroke-opacity=".05" transform="translate(.7 .9)"/></g><use href="#whTn-6" fill="url(#whTn-13)"/><use href="#whTn-6" fill="url(#whTn-14)"/><g clip-path="url(#whTn-15)"><ellipse cx="25.4" cy="11.8" rx="6.7" ry="4.7" transform="rotate(179.7 25.4 11.8)" fill="url(#whTn-d)" fill-opacity=".24"/><ellipse cx="23.4" cy="13.4" rx="6.7" ry="4.7" transform="rotate(179.7 23.4 13.4)" fill="url(#whTn-f)" fill-opacity=".26"/></g><path d="M15.8 15.9c0 .3.5 1.3.5 1.4s-.4-.5-.4-.6" fill="none" stroke="#4a2814" stroke-width=".8" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><path d="M27.5 20.5c-.2-.1-.5-.2-1.1-.2s-2.1.5-3 .6s-1.4-.1-2-.2s-1.3-.4-1.9-.7s-1.2-.6-1.7-1s-1-1.2-1.2-1.4" fill="none" stroke="#4a2814" stroke-width=".8" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whTn-17)" fill="none" stroke="#4c2a17"><use href="#whTn-7" stroke-width="2" stroke-opacity=".09" transform="translate(.7 .9)"/><use href="#whTn-7" stroke-width="4.5" stroke-opacity=".07" transform="translate(.7 .9)"/><use href="#whTn-7" stroke-width="7.8" stroke-opacity=".05" transform="translate(.7 .9)"/></g><use href="#whTn-7" fill="url(#whTn-18)"/><use href="#whTn-7" fill="url(#whTn-19)"/><g clip-path="url(#whTn-1a)"><ellipse cx="41.8" cy="14.4" rx="7.8" ry="5.5" transform="rotate(-117.6 41.8 14.4)" fill="url(#whTn-d)" fill-opacity=".24"/><ellipse cx="39.1" cy="13.2" rx="7.8" ry="5.5" transform="rotate(-117.6 39.1 13.2)" fill="url(#whTn-f)" fill-opacity=".26"/></g><path d="M54.4 30.2c.2.6.6 2.6.9 3.7s.5 2.3.6 2.8" fill="none" stroke="#4a2814" stroke-width=".8" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><path d="M32.7 19.2c-.2-.3-1-1.3-1.3-2s-.7-1.4-.9-2.2s-.3-1.6-.3-2.3s0-1.6.2-2.3s.4-1.4.7-2s1.2-1.6 1.2-1.6s-1.2 1.4-1.4 1.6s.4-.8.5-.9" fill="none" stroke="#4a2814" stroke-width=".8" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whTn-b)"><path d="M103.5 43.6c.7.1 3 .3 3.8.6s.7.6 1 1.2s.5 1.4.6 2.5s.3 1.6.3 4.4s-.1 8.2-.2 12.4s-.6 9.8-.7 12.8s-.1 2-.4 5.5s-1.2 10.7-1.7 15.7s-1.2 11.3-1.5 14.4s-.3 2.6-.4 4.5s-.4 5.7-.5 7.3s-.1 1.2.1 2.4s1.4 2.6 1.6 4.9s-.7 6.7-.6 8.5s.3 1.2 1.1 2.7s3.1 4.9 3.7 6.5s.4 2-.3 2.8s-3.3 1.7-3.9 2" fill="none" stroke="url(#whTn-1b)" stroke-width="35.3" stroke-opacity=".07" stroke-linecap="round" stroke-linejoin="round"/><path d="M103.5 43.6c.7.1 3 .3 3.8.6s.7.6 1 1.2s.5 1.4.6 2.5s.3 1.6.3 4.4s-.1 8.2-.2 12.4s-.6 9.8-.7 12.8s-.1 2-.4 5.5s-1.2 10.7-1.7 15.7s-1.2 11.3-1.5 14.4s-.3 2.6-.4 4.5s-.4 5.7-.5 7.3s-.1 1.2.1 2.4s1.4 2.6 1.6 4.9s-.7 6.7-.6 8.5s.3 1.2 1.1 2.7s3.1 4.9 3.7 6.5s.4 2-.3 2.8s-3.3 1.7-3.9 2" fill="none" stroke="url(#whTn-1b)" stroke-width="18.6" stroke-opacity=".09" stroke-linecap="round" stroke-linejoin="round"/><path d="M103.5 43.6c.7.1 3 .3 3.8.6s.7.6 1 1.2s.5 1.4.6 2.5s.3 1.6.3 4.4s-.1 8.2-.2 12.4s-.6 9.8-.7 12.8s-.1 2-.4 5.5s-1.2 10.7-1.7 15.7s-1.2 11.3-1.5 14.4s-.3 2.6-.4 4.5s-.4 5.7-.5 7.3s-.1 1.2.1 2.4s1.4 2.6 1.6 4.9s-.7 6.7-.6 8.5s.3 1.2 1.1 2.7s3.1 4.9 3.7 6.5s.4 2-.3 2.8s-3.3 1.7-3.9 2" fill="none" stroke="url(#whTn-1b)" stroke-width="8.2" stroke-opacity=".11" stroke-linecap="round" stroke-linejoin="round"/><path d="M50.9 154.7c-.7-.2-3.2-.8-3.9-1.3s-.9-.7-.3-1.7s3-3.4 3.8-4.6s.8 0 1.2-2.6s1.1-8.9 1.1-13.3s-.3-10-.7-13.4s-1-5.1-1.5-6.8s.1-.6-1.3-3.7s-5.8-12.5-7-15" fill="none" stroke="url(#whTn-1c)" stroke-width="14" stroke-opacity=".13" stroke-linecap="round" stroke-linejoin="round"/><path d="M49.2 154.7c-.6-.2-3.2-.8-3.9-1.3s-.9-.7-.3-1.7s3-3.4 3.9-4.6s.8 0 1.1-2.6s1.1-8.9 1.1-13.3s-.3-10-.7-13.4s-1-5.1-1.5-6.8s.1-.6-1.3-3.7s-5.8-12.5-6.9-15" fill="none" stroke="url(#whTn-1c)" stroke-width="6.7" stroke-opacity=".16" stroke-linecap="round" stroke-linejoin="round"/><path d="M43.4 154.7c-.6-.2-3.1-.8-3.8-1.3s-.9-.7-.4-1.7s3-3.4 3.9-4.6s.8 0 1.2-2.6s1-8.9 1.1-13.3s-.4-10-.7-13.4s-1.1-5.1-1.5-6.8s.1-.6-1.3-3.7s-5.8-12.5-7-15" fill="none" stroke="#764328" stroke-width="4.1" stroke-opacity=".14" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="64.7" cy="75.6" rx="27.9" ry="37.2" transform="rotate(-6 64.7 75.6)" fill="url(#whTn-c)" fill-opacity=".45"/><ellipse cx="59.2" cy="68.2" rx="13" ry="20.5" transform="rotate(-8 59.2 68.2)" fill="url(#whTn-c)" fill-opacity=".3"/><ellipse cx="91.8" cy="84.9" rx="14" ry="29.8" transform="rotate(-4 91.8 84.9)" fill="url(#whTn-e)" fill-opacity=".2"/><ellipse cx="98.6" cy="130.7" rx="6" ry="7.1" fill="url(#whTn-c)" fill-opacity=".42"/><ellipse cx="101.2" cy="139.6" rx="5.6" ry="6.7" fill="url(#whTn-e)" fill-opacity=".22"/><path d="M59.1 125.5c1.4.2 6.7 1.1 8.1 1.3" fill="none" stroke="#56301c" stroke-width=".7" stroke-opacity=".12" stroke-linecap="round" stroke-linejoin="round"/><path d="M71.2 127.5c1.1 0 5.7 0 6.9 0" fill="none" stroke="#56301c" stroke-width=".7" stroke-opacity=".12" stroke-linecap="round" stroke-linejoin="round"/><path d="M81.5 126.6c.9-.2 4.8-1.1 5.7-1.3" fill="none" stroke="#56301c" stroke-width=".7" stroke-opacity=".12" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="46" cy="40.7" rx="11.9" ry="6" transform="rotate(-13.4 46 40.7)" fill="url(#whTn-d)" fill-opacity=".24"/><ellipse cx="64.7" cy="36.2" rx="11.9" ry="6" transform="rotate(-1.7 64.7 36.2)" fill="url(#whTn-d)" fill-opacity=".24"/><ellipse cx="82.8" cy="39.6" rx="11.9" ry="6" transform="rotate(20.1 82.8 39.6)" fill="url(#whTn-d)" fill-opacity=".24"/><ellipse cx="99.3" cy="48.9" rx="11.9" ry="6" transform="rotate(29.3 99.3 48.9)" fill="url(#whTn-d)" fill-opacity=".24"/><ellipse cx="56.5" cy="37.3" rx="2.2" ry="6.7" transform="rotate(-13.4 56.5 37.3)" fill="url(#whTn-e)" fill-opacity=".14"/><ellipse cx="74.9" cy="36.8" rx="2.2" ry="6.7" transform="rotate(10.5 74.9 36.8)" fill="url(#whTn-e)" fill-opacity=".14"/><ellipse cx="92.2" cy="43.1" rx="2.2" ry="6.7" transform="rotate(29.3 92.2 43.1)" fill="url(#whTn-e)" fill-opacity=".14"/><ellipse cx="45.2" cy="39" rx="8.4" ry="6.2" transform="rotate(-6 45.2 39)" fill="url(#whTn-d)" fill-opacity=".36"/><ellipse cx="47.1" cy="39.6" rx="9.1" ry="6.6" fill="url(#whTn-f)" fill-opacity=".14"/><ellipse cx="64" cy="34.5" rx="8.6" ry="6.4" transform="rotate(-6 64 34.5)" fill="url(#whTn-d)" fill-opacity=".36"/><ellipse cx="65.9" cy="35.1" rx="9.4" ry="6.8" fill="url(#whTn-f)" fill-opacity=".14"/><ellipse cx="82.1" cy="37.9" rx="8.1" ry="6" transform="rotate(-6 82.1 37.9)" fill="url(#whTn-d)" fill-opacity=".36"/><ellipse cx="83.9" cy="38.4" rx="8.8" ry="6.4" fill="url(#whTn-f)" fill-opacity=".14"/><ellipse cx="98.9" cy="47.2" rx="7.1" ry="5.2" transform="rotate(-6 98.9 47.2)" fill="url(#whTn-d)" fill-opacity=".36"/><ellipse cx="100.5" cy="47.7" rx="7.7" ry="5.6" fill="url(#whTn-f)" fill-opacity=".14"/></g><use href="#whTn-8" fill="none" stroke="#33485e" stroke-width="1.7" stroke-opacity=".9"/><use href="#whTn-8" fill="url(#whTn-1h)"/><g clip-path="url(#whTn-1d)"><ellipse cx="61" cy="211.4" rx="16.7" ry="44.6" transform="rotate(-4 61 211.4)" fill="url(#whTn-1g)" fill-opacity=".32"/><ellipse cx="98.2" cy="297" rx="14.9" ry="63.2" transform="rotate(3 98.2 297)" fill="url(#whTn-1f)" fill-opacity=".26"/><ellipse cx="44.3" cy="215.1" rx="39.4" ry="8.6" transform="rotate(-250.7 44.3 215.1)" fill="url(#whTn-1f)" fill-opacity=".7"/><ellipse cx="35" cy="211.9" rx="34.7" ry="6.8" transform="rotate(-250.7 35 211.9)" fill="url(#whTn-1g)" fill-opacity=".665"/><ellipse cx="100.5" cy="198.9" rx="23.6" ry="6.7" transform="rotate(57.9 100.5 198.9)" fill="url(#whTn-1f)" fill-opacity=".55"/><ellipse cx="94" cy="203" rx="20.8" ry="5.4" transform="rotate(57.9 94 203)" fill="url(#whTn-1g)" fill-opacity=".523"/><ellipse cx="70.3" cy="331.4" rx="41.6" ry="10" transform="rotate(40.5 70.3 331.4)" fill="url(#whTn-1f)" fill-opacity=".6"/><ellipse cx="77.8" cy="322.6" rx="36.6" ry="8" transform="rotate(40.5 77.8 322.6)" fill="url(#whTn-1g)" fill-opacity=".57"/><ellipse cx="81.5" cy="463.5" rx="45.4" ry="11.2" transform="rotate(-222.5 81.5 463.5)" fill="url(#whTn-1f)" fill-opacity=".46"/><ellipse cx="72.8" cy="454" rx="40" ry="8.9" transform="rotate(-222.5 72.8 454)" fill="url(#whTn-1g)" fill-opacity=".437"/></g><use href="#whTn-9" fill="#33495f" fill-opacity=".25" transform="translate(1.1 2.2)"/><use href="#whTn-9" fill="none" stroke="#33485e" stroke-width="1.7" stroke-opacity=".9"/><use href="#whTn-9" fill="url(#whTn-1i)"/><g clip-path="url(#whTn-1e)"><path d="M39.4 139.4c.3-.2.7-.9 1.8-1.4s1.6-.9 4.9-1.4s10.3-1.2 15-1.5s8.6-.5 12.9-.5s8.3.1 13 .4s11.6.8 15 1.3s3.8.9 4.9 1.4s1.4 1.1 1.7 1.4" fill="none" stroke="#97b2ca" stroke-width="3" stroke-opacity=".2" stroke-linecap="round" stroke-linejoin="round"/><path d="M40.1 142.4c.3-.2.6-.9 1.7-1.4s1.6-.9 4.9-1.4s10.1-1.2 14.7-1.5s8.4-.5 12.6-.5s8.2.1 12.7.3s11.5.9 14.7 1.4s3.8.9 4.9 1.3s1.4 1.2 1.6 1.5" fill="none" stroke="#4a6480" stroke-width=".7" stroke-dasharray="1.4 1.2" stroke-opacity=".8"/><path d="M109.8 172c-.4.1-1.2.7-1.9.8s-.1.5-2.7-.4s-9.6-3.6-13.3-4.5s-6-.7-8.9-.9s-6-.2-9-.2s-5.9 0-8.9.2s-5.2 0-8.9.9s-10.6 3.7-13.3 4.5s-1.9.5-2.7.4s-1.6-.7-1.9-.8" fill="none" stroke="#4a6480" stroke-width=".7" stroke-dasharray="1.4 1.2" stroke-opacity=".7"/><path d="M110.5 176.8c-.3.2-1.2.7-1.9.8s-.1.5-2.8-.3s-9.8-3.7-13.5-4.6s-6.1-.7-9.1-.8s-6.1-.3-9.2-.3s-6 .1-9.1.3s-5.3-.1-9.1.8s-10.8 3.8-13.5 4.6s-2 .4-2.8.3s-1.6-.6-1.9-.8" fill="none" stroke="#33495f" stroke-width="3" stroke-opacity=".25" stroke-linecap="round" stroke-linejoin="round"/><path d="M96.5 134.6c.2 3 .7 11.7 1 17.8s.6 15.7.7 18.9" fill="none" stroke="#33495f" stroke-width="1.3" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M95.4 134.6c.2 3 .7 11.7 1 17.8s.6 15.7.7 18.9" fill="none" stroke="#97b2ca" stroke-width=".9" stroke-opacity=".25" stroke-linecap="round" stroke-linejoin="round"/></g><ellipse cx="103.4" cy="154.4" rx="3.7" ry="3.5" fill="#33495f" fill-opacity=".25"/><ellipse cx="102.9" cy="153.5" rx="3.5" ry="3.3" fill="#efebe3" stroke="#8d99a6" stroke-width=".6"/><ellipse cx="101.8" cy="152.6" rx=".5" ry=".5" fill="#8d99a6"/><ellipse cx="103.9" cy="152.6" rx=".5" ry=".5" fill="#8d99a6"/><ellipse cx="101.8" cy="154.4" rx=".5" ry=".5" fill="#8d99a6"/><ellipse cx="103.9" cy="154.4" rx=".5" ry=".5" fill="#8d99a6"/><path d="M41.2 135.4c.3-.1.9-.6 2.2-.9s2.7-.5 5.6-.8s7.9-.9 12.1-1.2s8.6-.5 12.9-.5s8.3.1 13 .4s11.6.8 15 1.3s4.1 1.1 4.9 1.3" fill="none" stroke="#4c2a17" stroke-width="2.6" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/></svg>'},
    open:{w:160,h:673,palm:[67.7,136.6],wrist:[71.7,184.9],
      svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 673" width="160" height="673"><g class="wh-shadow" fill="#3a2410"><path fill-opacity=".035" d="M63.5 5.1c1.7-.5 3.9-.8 5.7-.2s4 1.8 5.3 3.3s2 3.2 2.5 6.2s.2 10.7.5 11.4s.2-5.5 1.2-7.4s2.9-3.4 4.7-4.3s4-1.2 5.9-.7s4.4 2.2 5.7 3.7s1.7.8 2.1 5.5s-.1 19.3.5 22.2s1.9-4 3.1-5.2s2.2-1.7 3.9-1.8s4.4.1 6.1 1.1s3.4-1.2 4.1 5.3s.6 23.1.2 33.8s-2.3 21.4-2.6 30.2s1.3 9 .8 22.2s-4.1 46.4-4.4 56.9s-.2 3.5 2.7 6.5s11.2 8.1 14.8 11.4s5.5 2.4 7.1 8.1s1.2 20.4 2.5 26s4.5 5 5.3 7.6s-.6 3.6 0 8.3s3.1 12 3.5 19.9s-1.6 11-1.1 27.9s3.6 51.5 4.1 73.7s-1.5 26-1.1 59.1s1.9 101.9 3.7 139.5s6 66.4 7.5 86s1.2 22.3 1.1 31.6s-.2 16.7-1.6 24.1s-3.2 14.8-6.8 20.4s-8.6 9.6-14.4 13s-14 6-20.7 7.6s-12.3 2-19.6 2.1s-19.6-1.4-24.6-2s-1.9-.4-5.4-1.6s-10.8-3.1-15.4-5.8s-9.5-7.8-12.1-10.2s-2-.5-3.6-4.2s-4.7-11.4-5.9-18.2s-1.6-13.3-1.7-23s-.3-15.2 1.2-35.3s5.9-56.7 7.3-85.6s.5-65.6 1.2-87.8s2.6-33.8 3-45.4s-1.1-9.6-1.2-23.8s0-43.4.8-61.4s3.3-36.3 3.7-46.1s-1.3-7.4-1.5-12.6s0-10.5.4-18.6s1.7-24.7 2.3-30.5s.6-2.9 1.6-4.4s3.2.2 4.1-4.5s.3-18.2 1.1-23.3s5.1-4.4 4.1-7.7s-8.5-7.7-10.3-12.1s-.1-10.6-.6-14.5s-1.4-6.4-2.7-9.1s-3.3-5.6-5.1-7.1s-4.5-.9-6.1-1.8s-1.7-1.1-3.2-3.5s-2.4-3.9-5.5-10.8s-10.5-22-13.2-30.4s-3-15.7-3.2-20s1.2-4.1 2.2-5.7s2.6-3 4.3-3.9s4.1-1.6 6.1-1.5s4.3.6 6.2 1.8s2.7.6 5.1 5.7s8.1 30.1 9.2 25.1s-2.6-39.6-2.9-55.3s.2-31.6.8-39.1s1.3-4.3 2.8-5.8s3.9-2.9 6-3.1s5.1.6 6.9 1.8s3.1 6.7 3.9 5.5s.4-9.7 1-12.4s1.4-3.2 2.5-4.3s2.5-2.1 4.1-2.5z"/><path fill-opacity=".05" d="M63 5.4c1.9-.3 5.3-.4 7.2.6s3.3-1.7 4.3 5.4s1.6 35.7 2.1 37.4s.8-21.9 1.2-27s.4-2.9 1.3-4.1s2.4-2.6 3.8-3.3s3.1-.9 4.5-.8s2.8.7 3.9 1.5s2.2 1.2 2.9 3.4s1.1 1.5 1.4 9.9s0 37.6.4 40.5s1-18.7 1.5-23.3s.8-3.2 1.7-4.4s2.2-2.4 3.5-2.8s3.4-.5 4.8-.1s2.6 1.1 3.5 2.1s1.5-2.8 1.9 3.4s.5 22.8.1 33.4s-2.2 21.4-2.5 30.1s1.3 8.9.7 22.3s-4.2 47.6-4.6 58.3s-.4 2.9 2.4 5.7s10.8 8.3 14.1 11.4s4.7 1.7 6 7.1s.7 20.1 1.9 25.7s4.5 5.1 5.4 7.7s-.7 3.3-.2 7.9s3.2 11.8 3.6 19.8s-1.6 11.3-1.1 28.2s3.6 51.2 4.1 73.3s-1.5 26.3-1.1 59.5s1.9 102.3 3.7 139.9s6 65.8 7.5 85.2s1.2 22 1.1 31.2s-.2 16.8-1.5 24.1s-3.2 14.2-6.5 19.4s-8.1 8.9-13.6 12.1s-13.2 5.7-19.7 7.2s-11.9 1.9-19.1 2s-19.1-1.4-24-1.9s-1.7-.4-5-1.6s-10.5-3-15-5.5s-9.2-7.8-11.6-10s-1.4.3-2.8-3.1s-4.5-11-5.8-17.7s-1.5-12.8-1.6-22.4s-.3-15.1 1.2-35.2s5.9-56.4 7.4-85.3s.4-66 1.1-88.1s2.6-33.6 3-45.1s-1.1-9.9-1.2-24.2s0-43.5.8-61.3s3.3-36 3.7-45.8s-1.3-7.9-1.5-13.1s-.1-11.6.4-18.1s2.2-16.2 2.6-21.3s-.5-6.9-.3-9.1s.5-2.5 1.4-3.7s3.1-1.1 4-3.6s1.4-6.9 1.6-11.1s-.5-10.8-.2-13.8s.8-3 1.7-4.3s5-.5 3.6-3.2s-9.9-8.5-12-12.9s0-9.8-.6-13.6s-1.4-6.5-2.8-9.3s-3.5-6-5.5-7.5s-4.5-.9-6-1.8s-1.5-.8-2.9-3.1s-2.3-3.7-5.4-10.5s-10.4-22.1-13.1-30.4s-3.1-15.5-3.2-19.7s1.1-4 2.4-5.6s3.5-3.2 5.5-3.8s4.4-.5 6.2-.1s3.4 1.4 4.6 2.5s2.1 1.6 3.1 4s.9 5.5 2.9 10.5s7.8 26.5 8.7 19.6s-2.9-44.7-3.3-61.3s.4-31.1.9-38.3s1.1-3.9 2.3-5.2s3.1-2.4 4.7-2.8s3.5-.2 5 .4s3 2 4 3.2s1.1-1.5 1.6 4s1.2 31.1 1.6 29.3s.2-32.7.8-40.5s1.5-4.6 2.6-6.1s2-2.1 3.8-2.4z"/><path fill-opacity=".075" d="M62.8 5.5c1.7-.2 4.8-.5 6.6.8s3.1-5.1 4.1 7s1.3 64.5 2.1 65.8s1.5-47.4 2.4-58s1.9-4.3 3-5.5s2.3-1.5 3.6-1.7s2.9.1 4.2.6s2.3 1.3 3.1 2.4s1.3-7.2 1.7 4.3s-.3 61 .5 64.5s3.2-35.8 4.5-43.6s2.1-2.7 3.4-3.3s2.8-.6 4.1-.4s2.6.9 3.4 1.8s1.5-2.6 1.9 3.4s.5 22.1.1 32.6s-2.3 21.4-2.6 30.1s1.5 8.8.7 22.3s-4.5 48.1-5 58.8s-.6 2.9 2.1 5.8s10.7 8.8 13.9 11.8s3.9.6 5 6.2s.7 22.4 1.9 27.9s4.2 3.2 5.1 5.4s-.8 3.1-.3 7.7s3.2 11.7 3.7 19.7s-1.6 11.7-1.1 28.7s3.5 50.7 4 72.9s-1.5 26.6-1.1 59.9s1.9 102 3.8 139.5s6 65.8 7.4 85.2s1.2 21.7 1.1 30.8s-.2 16.8-1.5 23.8s-2.9 13.4-6.1 18.4s-7.6 8.5-13 11.5s-12.7 5.5-19 7s-11.8 1.9-18.9 1.9s-18.7-1.3-23.3-1.9s-1.6-.4-4.8-1.5s-10.1-2.8-14.4-5.3s-9.1-7.8-11.4-9.8s-.8 1-2.1-2.3s-4.5-10.8-5.7-17.4s-1.5-12.7-1.6-22.2s-.3-14.5 1.2-34.5s6-56.3 7.4-85.2s.4-66.1 1.1-88.2s2.7-33 3-44.6s-1.1-11-1.1-25.3s0-43 .7-60.7s3.3-35.4 3.7-45.4s-1.3-8.8-1.5-14.1s-.1-11.3.4-17.8s2.2-15.9 2.6-20.9s-.4-7.2-.3-9.1s.1-1.7 1-2.7s3.5-1.3 4.4-3.8s1.4-7.3 1.6-11.5s-.6-11-.3-14s.7-2.9 1.9-4.1s6.4-.1 5-2.9s-11.3-9-13.7-13.9s-.2-11.2-1-15.3s-2.4-6.7-3.8-9.2s-2.9-4.8-4.7-6.1s-4.5-.8-5.9-1.5s-1.2-.5-2.5-2.7s-2.3-3.7-5.3-10.3s-10.2-21.3-12.9-29.6s-3.3-15.7-3.5-19.9s.9-3.9 2.2-5.4s3.4-3 5.2-3.6s4-.5 5.7-.1s3.3 1.3 4.5 2.6s1.6 1.1 3.2 5.1s4.1 13.7 6.3 18.9s6.1 21.1 6.7 12.4s-3.2-47.5-3.7-64.5s.3-30.8.8-37.9s1.2-4 2.3-5.2s3.1-2.2 4.6-2.5s3.1-.1 4.5.7s2.5-6.2 3.8 4s3.4 58.3 4.2 56.8s.2-53.5.7-65.4s1.3-4.5 2.3-5.9s2-2 3.7-2.3z"/></g><defs><path id="whTo-0" d="M41.1 213.8c-10.2-1.7.5-5.8.8-10.3s1.4-11.1 1.2-16.7s-.2-11.6-2.3-16.7s-7-10.3-10.1-14.4s-8-6.9-8.3-10s4.1-6 6.5-8.3s7.5-3.2 8.2-5.2s-3.6-5.2-3.6-6.2s3.4 5.1 3.8 0s-2.9-24.7-1.7-30.9s6.2-3.6 9.1-6.5s5.6-10.2 8.7-11s6.9 6.5 10.1 6.5s6-7 9-6.5s6 8.8 9.1 9.9s6.6-5.6 9.4-3.8s4.6 10.9 7.1 14.9s6.7 3 8 9.3s.3 19.6-.2 28.7s-1.8 18.1-2.6 26s-1.8 16.6-1.8 21.4s1.5 4.6 1.6 7.3s-.5 4.8-.5 8.5s10.8 11.6.5 14s-51.8 1.7-62 0z"/><path id="whTo-1" d="M25 155.1c-1.4-2.4-4-7.9-5.9-12.1s-4.1-9.3-5.7-13s-3.1-6.8-4-8.9s-1.1-2.1-1.7-3.9s-1.1-3.1-1.9-6.4s-2-11-2.4-13.8s.2-1.8.4-2.7s.6-1.8 1.1-2.6s1-1.5 1.6-2.1s1.4-1.2 2.1-1.7s1.7-.7 2.5-1s1.8-.3 2.7-.2s1.8.2 2.6.4s1.8.7 2.5 1.2s1.5 1.1 2.1 1.8s.8-.2 1.6 2.2s2.3 8.6 3.7 12.6s3.7 8.8 4.9 11.4s.7 1.6 2.1 4.3s4.9 9.4 6.4 12.3s1.6 3.4 2.6 5.1s2.7 3.7 3.5 5.2s1 2.3 1 3.6s-.1 2.7-.7 4s-1.3 2.6-2.3 3.7s-2.3 2.2-3.6 3s-2.9 1.3-4.3 1.6s-3.1.4-4.4.2s-2.8-.8-3.9-1.4s-1.2-.3-2.6-2.8z"/><path id="whTo-2" d="M89.8 112.9c.1-1.6.3-4.1.6-7.5s1-9.7 1.3-12.6s.3-2 .5-5.3s.5-9.7.9-14.3s1.2-9.7 1.6-13.1s0-4.4.2-7.5s.5-8.7.9-11.1s1-2.3 1.8-3.1s1.8-1.4 2.9-1.7s2.3-.3 3.4 0s2.2 1.4 2.8 1.9s.8 1 1 1.5s.5.7.7 1.7s.2 1 .2 4.1s-.2 10.1-.3 14.8s.3 8.9.1 13.6s-1.1 11.1-1.4 14.4s-.2 2.3-.4 5.3s-.6 9.3-.8 12.7s-.4 5.8-.6 7.4s-.3 1.4-.7 2s-1.1 1.2-1.8 1.6s-1.7.8-2.6 1s-2 .2-3 .2s-2-.3-2.9-.7s-1.8-.8-2.4-1.3s-1.2-1.3-1.6-1.9s-.4-.5-.4-2.1z"/><path id="whTo-3" d="M72.5 103.9c0-1.6.1-3.6.3-7.4s.5-11.7.7-15.4s.2-4.2.2-6.4s.1-3.5.1-6.4s-.1-6.6.1-11.1s1-11.9 1.3-16.1s-.1-5.4 0-9.2s.3-10.9.8-13.9s1.3-2.7 1.9-3.6s1-.9 1.5-1.2s1.2-.7 1.8-.8s1.3-.3 2-.3s1.3.1 1.9.3s1.2.4 1.8.8s1.1.7 1.5 1.2s.9 1.1 1.2 1.7s.5.8.7 1.9s.3 2.7.5 5.1s.3 5.9.3 9s-.3 4.9-.2 9.2s.6 11.7.6 16.3s-.4 8.3-.5 11.2s-.2 4.3-.2 6.4s-.1 2.8-.2 6.5s-.1 11.5-.2 15.3s-.1 5.8-.2 7.5s-.3 1.6-.8 2.3s-1.1 1.4-1.9 2s-1.9.9-2.9 1.2s-2.3.4-3.4.4s-2.4-.3-3.4-.6s-2-.8-2.8-1.4s-1.5-1.3-1.9-2.1s-.5-.7-.6-2.4z"/><path id="whTo-4" d="M54.2 101c-.1-1.7 0-3.5 0-7.5s0-12.4 0-16.3s0-4.5 0-6.8s-.1-3.7-.2-6.8s-.3-9.1-.4-11.9s0-1.9.1-4.8s.6-8.7.7-12.4s-.2-5.7-.1-9.8s.3-12 .6-14.8s.4-1.5.7-2.1s.8-1.3 1.3-1.8s1-1 1.6-1.4s1.2-.7 1.9-.9s1.3-.3 2-.3s1.4.1 2.1.3s1.3.5 1.9.8s1.2.9 1.6 1.4s1 1.1 1.3 1.7s.7 1.4.8 2.1s.2-.3.3 2.2s.6 8.8.7 12.6s-.1 6 .1 9.8s.8 9.5 1 12.4s.2 2 .2 4.8s-.1 8.7-.1 11.9s0 4.5 0 6.8s0 3 .1 6.8s.4 12.3.5 16.3s.2 5.8.1 7.4s-.2 1.8-.7 2.6s-1.1 1.5-2 2.1s-1.9 1.2-3 1.5s-2.4.5-3.6.5s-2.5-.1-3.6-.4s-2.2-.8-3.1-1.4s-1.6-1.4-2-2.1s-.6-.9-.8-2.5z"/><path id="whTo-5" d="M36 105.8c-.2-1.7-.2-3.7-.3-7.5s-.4-11.3-.6-14.9s-.1-4.1-.2-6.2s-.2-3.3-.4-6.2s-.7-6.4-.7-10.8s.4-11.4.5-16s-.3-7.5-.2-11.2s.4-8.9.6-11s.5-1.4.8-2s.7-1.2 1.2-1.7s1-1 1.6-1.3s1.2-.7 1.8-.9s1.3-.3 2-.3s1.3.1 2 .3s1.2.5 1.8.8s1.1.8 1.6 1.3s.9 1.1 1.2 1.7s.6 1.1.8 2s.2 1.5.3 3.6s.4 6.4.5 9.5s-.1 4.8.2 8.9s1.2 11.1 1.5 15.5s.1 7.9.2 10.8s.2 4.1.3 6.1s.1 2.7.3 6.2s.8 11.2 1 14.9s.4 5.8.4 7.5s-.2 1.7-.6 2.4s-1 1.6-1.8 2.2s-1.9 1.2-2.9 1.5s-2.3.6-3.5.7s-2.4-.1-3.5-.3s-2.2-.7-3-1.3s-1.6-1.2-2.1-1.9s-.6-.8-.8-2.4z"/><path id="whTo-6" d="M37.1 225.9c-12.9 2.7-6.2 8.6-8 16.7s-2.6 23.2-2.8 31.6s1.8 10.2 1.5 18.6s-2.2 15.5-3 31.6s-1.4 48.7-1.5 65.1s1.4 21.1 1.2 33.5s-2 18.6-2.6 40.9s-1.1 50.9-1.5 93s-18.4 133.3-1.1 160s87.6 26.7 104.9 0s-.7-119.4-1.2-160s-1.2-58.9-1.8-83.7s-1.8-48-1.9-65.1s1.5-21.7 1.3-37.2s-1.7-40.9-2.4-55.8s-1.7-24.1-1.9-33.4s1.5-15.5 1.2-22.4s-1.5-13-3.4-18.6s5-12.4-7.8-14.8s-56.3-2.8-69.2 0z"/><path id="whTo-7" d="M37.1 196.3c2.8-3.5 9.8-2.9 15.6-3.7s12.7-1.1 19-1.2s13.3.2 19 1s12.8 0 15.6 3.5s.8 10.9 1.1 17.4s3.7 18.9.8 21.9s-12.2-3.3-18.3-4.1s-12.1-1.2-18.2-1.2s-12.1.3-18.2 1.2s-15.3 7-18.2 4.1s.4-15.4.7-21.9s-1.7-13.6 1.1-17z"/><path id="whTo-8" d="M41.1 213.8c-10.2-1.7.5-5.8.8-10.3s1.4-11.1 1.2-16.7s-.2-11.6-2.3-16.7s-7-10.3-10.1-14.4s-8-6.9-8.3-10s4.1-6 6.5-8.3s7.5-3.2 8.2-5.2s-3.6-5.2-3.6-6.2s3.4 5.1 3.8 0s-2.9-24.7-1.7-30.9s6.2-3.6 9.1-6.5s5.6-10.2 8.7-11s6.9 6.5 10.1 6.5s6-7 9-6.5s6 8.8 9.1 9.9s6.6-5.6 9.4-3.8s4.6 10.9 7.1 14.9s6.7 3 8 9.3s.3 19.6-.2 28.7s-1.8 18.1-2.6 26s-1.8 16.6-1.8 21.4s1.5 4.6 1.6 7.3s-.5 4.8-.5 8.5s10.8 11.6.5 14s-51.8 1.7-62 0zM25 155.1c-1.4-2.4-4-7.9-5.9-12.1s-4.1-9.3-5.7-13s-3.1-6.8-4-8.9s-1.1-2.1-1.7-3.9s-1.1-3.1-1.9-6.4s-2-11-2.4-13.8s.2-1.8.4-2.7s.6-1.8 1.1-2.6s1-1.5 1.6-2.1s1.4-1.2 2.1-1.7s1.7-.7 2.5-1s1.8-.3 2.7-.2s1.8.2 2.6.4s1.8.7 2.5 1.2s1.5 1.1 2.1 1.8s.8-.2 1.6 2.2s2.3 8.6 3.7 12.6s3.7 8.8 4.9 11.4s.7 1.6 2.1 4.3s4.9 9.4 6.4 12.3s1.6 3.4 2.6 5.1s2.7 3.7 3.5 5.2s1 2.3 1 3.6s-.1 2.7-.7 4s-1.3 2.6-2.3 3.7s-2.3 2.2-3.6 3s-2.9 1.3-4.3 1.6s-3.1.4-4.4.2s-2.8-.8-3.9-1.4s-1.2-.3-2.6-2.8zM89.8 112.9c.1-1.6.3-4.1.6-7.5s1-9.7 1.3-12.6s.3-2 .5-5.3s.5-9.7.9-14.3s1.2-9.7 1.6-13.1s0-4.4.2-7.5s.5-8.7.9-11.1s1-2.3 1.8-3.1s1.8-1.4 2.9-1.7s2.3-.3 3.4 0s2.2 1.4 2.8 1.9s.8 1 1 1.5s.5.7.7 1.7s.2 1 .2 4.1s-.2 10.1-.3 14.8s.3 8.9.1 13.6s-1.1 11.1-1.4 14.4s-.2 2.3-.4 5.3s-.6 9.3-.8 12.7s-.4 5.8-.6 7.4s-.3 1.4-.7 2s-1.1 1.2-1.8 1.6s-1.7.8-2.6 1s-2 .2-3 .2s-2-.3-2.9-.7s-1.8-.8-2.4-1.3s-1.2-1.3-1.6-1.9s-.4-.5-.4-2.1zM72.5 103.9c0-1.6.1-3.6.3-7.4s.5-11.7.7-15.4s.2-4.2.2-6.4s.1-3.5.1-6.4s-.1-6.6.1-11.1s1-11.9 1.3-16.1s-.1-5.4 0-9.2s.3-10.9.8-13.9s1.3-2.7 1.9-3.6s1-.9 1.5-1.2s1.2-.7 1.8-.8s1.3-.3 2-.3s1.3.1 1.9.3s1.2.4 1.8.8s1.1.7 1.5 1.2s.9 1.1 1.2 1.7s.5.8.7 1.9s.3 2.7.5 5.1s.3 5.9.3 9s-.3 4.9-.2 9.2s.6 11.7.6 16.3s-.4 8.3-.5 11.2s-.2 4.3-.2 6.4s-.1 2.8-.2 6.5s-.1 11.5-.2 15.3s-.1 5.8-.2 7.5s-.3 1.6-.8 2.3s-1.1 1.4-1.9 2s-1.9.9-2.9 1.2s-2.3.4-3.4.4s-2.4-.3-3.4-.6s-2-.8-2.8-1.4s-1.5-1.3-1.9-2.1s-.5-.7-.6-2.4zM54.2 101c-.1-1.7 0-3.5 0-7.5s0-12.4 0-16.3s0-4.5 0-6.8s-.1-3.7-.2-6.8s-.3-9.1-.4-11.9s0-1.9.1-4.8s.6-8.7.7-12.4s-.2-5.7-.1-9.8s.3-12 .6-14.8s.4-1.5.7-2.1s.8-1.3 1.3-1.8s1-1 1.6-1.4s1.2-.7 1.9-.9s1.3-.3 2-.3s1.4.1 2.1.3s1.3.5 1.9.8s1.2.9 1.6 1.4s1 1.1 1.3 1.7s.7 1.4.8 2.1s.2-.3.3 2.2s.6 8.8.7 12.6s-.1 6 .1 9.8s.8 9.5 1 12.4s.2 2 .2 4.8s-.1 8.7-.1 11.9s0 4.5 0 6.8s0 3 .1 6.8s.4 12.3.5 16.3s.2 5.8.1 7.4s-.2 1.8-.7 2.6s-1.1 1.5-2 2.1s-1.9 1.2-3 1.5s-2.4.5-3.6.5s-2.5-.1-3.6-.4s-2.2-.8-3.1-1.4s-1.6-1.4-2-2.1s-.6-.9-.8-2.5zM36 105.8c-.2-1.7-.2-3.7-.3-7.5s-.4-11.3-.6-14.9s-.1-4.1-.2-6.2s-.2-3.3-.4-6.2s-.7-6.4-.7-10.8s.4-11.4.5-16s-.3-7.5-.2-11.2s.4-8.9.6-11s.5-1.4.8-2s.7-1.2 1.2-1.7s1-1 1.6-1.3s1.2-.7 1.8-.9s1.3-.3 2-.3s1.3.1 2 .3s1.2.5 1.8.8s1.1.8 1.6 1.3s.9 1.1 1.2 1.7s.6 1.1.8 2s.2 1.5.3 3.6s.4 6.4.5 9.5s-.1 4.8.2 8.9s1.2 11.1 1.5 15.5s.1 7.9.2 10.8s.2 4.1.3 6.1s.1 2.7.3 6.2s.8 11.2 1 14.9s.4 5.8.4 7.5s-.2 1.7-.6 2.4s-1 1.6-1.8 2.2s-1.9 1.2-2.9 1.5s-2.3.6-3.5.7s-2.4-.1-3.5-.3s-2.2-.7-3-1.3s-1.6-1.2-2.1-1.9s-.6-.8-.8-2.4z"/><clipPath id="whTo-9"><use href="#whTo-8"/></clipPath><radialGradient id="whTo-a"><stop offset="0" stop-color="#d29a73" stop-opacity=".8"/><stop offset=".5" stop-color="#d29a73" stop-opacity=".3"/><stop offset="1" stop-color="#d29a73" stop-opacity="0"/></radialGradient><radialGradient id="whTo-b"><stop offset="0" stop-color="#c4805a" stop-opacity=".85"/><stop offset=".55" stop-color="#c4805a" stop-opacity=".32"/><stop offset="1" stop-color="#c4805a" stop-opacity="0"/></radialGradient><radialGradient id="whTo-c"><stop offset="0" stop-color="#4c2a17" stop-opacity=".6"/><stop offset=".55" stop-color="#4c2a17" stop-opacity=".2"/><stop offset="1" stop-color="#4c2a17" stop-opacity="0"/></radialGradient><radialGradient id="whTo-d"><stop offset="0" stop-color="#b5503a" stop-opacity=".55"/><stop offset=".55" stop-color="#b5503a" stop-opacity=".2"/><stop offset="1" stop-color="#b5503a" stop-opacity="0"/></radialGradient><linearGradient id="whTo-e" gradientUnits="userSpaceOnUse" x1="11.1" y1="124.8" x2="31.4" y2="116.9"><stop offset="0" stop-color="#683b22"/><stop offset=".021" stop-color="#7e492c"/><stop offset=".146" stop-color="#915736"/><stop offset=".417" stop-color="#a16541"/><stop offset=".792" stop-color="#834d2f"/><stop offset="1" stop-color="#5b331d"/></linearGradient><linearGradient id="whTo-f" gradientUnits="userSpaceOnUse" x1="35.4" y1="149.1" x2="11.1" y2="86.9"><stop offset="0" stop-color="#9a5e3b"/><stop offset=".056" stop-color="#9a5e3b"/><stop offset=".323" stop-color="#9a5e3b" stop-opacity="0"/><stop offset=".747" stop-color="#764328" stop-opacity="0"/><stop offset="1" stop-color="#764328" stop-opacity=".28"/></linearGradient><linearGradient id="whTo-g" gradientUnits="userSpaceOnUse" x1="10.2" y1="108.8" x2="5.7" y2="90.5"><stop offset="0" stop-color="#9a6650"/><stop offset=".35" stop-color="#bd8b76"/><stop offset=".85" stop-color="#bd8b76"/><stop offset="1" stop-color="#dcbca8"/></linearGradient><clipPath id="whTo-h"><use href="#whTo-1"/></clipPath><linearGradient id="whTo-i" gradientUnits="userSpaceOnUse" x1="93.5" y1="69.6" x2="108.5" y2="70.5"><stop offset="0" stop-color="#804a2d"/><stop offset=".042" stop-color="#935937"/><stop offset=".271" stop-color="#b97e58"/><stop offset=".646" stop-color="#8c5333"/><stop offset=".958" stop-color="#552f1b"/><stop offset="1" stop-color="#5b331d"/></linearGradient><linearGradient id="whTo-j" gradientUnits="userSpaceOnUse" x1="97.5" y1="113.5" x2="102.2" y2="36.5"><stop offset="0" stop-color="#9a5e3b"/><stop offset=".032" stop-color="#9a5e3b"/><stop offset=".262" stop-color="#9a5e3b" stop-opacity="0"/><stop offset=".865" stop-color="#764328" stop-opacity="0"/><stop offset="1" stop-color="#764328" stop-opacity=".3"/></linearGradient><linearGradient id="whTo-k" gradientUnits="userSpaceOnUse" x1="101.9" y1="49.8" x2="102.2" y2="37.9"><stop offset="0" stop-color="#9a6650"/><stop offset=".35" stop-color="#bd8b76"/><stop offset=".85" stop-color="#bd8b76"/><stop offset="1" stop-color="#dcbca8"/></linearGradient><clipPath id="whTo-l"><use href="#whTo-2"/></clipPath><linearGradient id="whTo-m" gradientUnits="userSpaceOnUse" x1="74.2" y1="52.8" x2="91.5" y2="53.1"><stop offset="0" stop-color="#7e492c"/><stop offset=".042" stop-color="#915836"/><stop offset=".292" stop-color="#b77b55"/><stop offset=".688" stop-color="#875031"/><stop offset=".958" stop-color="#552f1b"/><stop offset="1" stop-color="#5b331d"/></linearGradient><linearGradient id="whTo-n" gradientUnits="userSpaceOnUse" x1="81.3" y1="104.2" x2="83.2" y2="12.1"><stop offset="0" stop-color="#9a5e3b"/><stop offset=".022" stop-color="#9a5e3b"/><stop offset=".248" stop-color="#9a5e3b" stop-opacity="0"/><stop offset=".865" stop-color="#764328" stop-opacity="0"/><stop offset="1" stop-color="#764328" stop-opacity=".3"/></linearGradient><linearGradient id="whTo-o" gradientUnits="userSpaceOnUse" x1="83.2" y1="27.4" x2="83.2" y2="13.7"><stop offset="0" stop-color="#9a6650"/><stop offset=".35" stop-color="#bd8b76"/><stop offset=".85" stop-color="#bd8b76"/><stop offset="1" stop-color="#dcbca8"/></linearGradient><clipPath id="whTo-p"><use href="#whTo-3"/></clipPath><linearGradient id="whTo-q" gradientUnits="userSpaceOnUse" x1="53.7" y1="46.9" x2="72.2" y2="46.7"><stop offset="0" stop-color="#7d482c"/><stop offset=".042" stop-color="#905736"/><stop offset=".292" stop-color="#b47953"/><stop offset=".792" stop-color="#7b472a"/><stop offset=".938" stop-color="#522e1a"/><stop offset="1" stop-color="#5b331d"/></linearGradient><linearGradient id="whTo-r" gradientUnits="userSpaceOnUse" x1="63.6" y1="100.9" x2="62.4" y2="3.4"><stop offset="0" stop-color="#9a5e3b"/><stop offset=".019" stop-color="#9a5e3b"/><stop offset=".244" stop-color="#9a5e3b" stop-opacity="0"/><stop offset=".865" stop-color="#764328" stop-opacity="0"/><stop offset="1" stop-color="#764328" stop-opacity=".3"/></linearGradient><linearGradient id="whTo-s" gradientUnits="userSpaceOnUse" x1="62.6" y1="19.7" x2="62.4" y2="5.1"><stop offset="0" stop-color="#9a6650"/><stop offset=".35" stop-color="#bd8b76"/><stop offset=".85" stop-color="#bd8b76"/><stop offset="1" stop-color="#dcbca8"/></linearGradient><clipPath id="whTo-t"><use href="#whTo-4"/></clipPath><linearGradient id="whTo-u" gradientUnits="userSpaceOnUse" x1="33.8" y1="55.7" x2="51.7" y2="55.1"><stop offset="0" stop-color="#7c482b"/><stop offset=".021" stop-color="#8b5233"/><stop offset=".292" stop-color="#b37751"/><stop offset=".75" stop-color="#814b2e"/><stop offset=".958" stop-color="#552f1b"/><stop offset="1" stop-color="#5b331d"/></linearGradient><linearGradient id="whTo-v" gradientUnits="userSpaceOnUse" x1="45.1" y1="105.3" x2="42.1" y2="15.8"><stop offset="0" stop-color="#9a5e3b"/><stop offset=".023" stop-color="#9a5e3b"/><stop offset=".25" stop-color="#9a5e3b" stop-opacity="0"/><stop offset=".863" stop-color="#764328" stop-opacity="0"/><stop offset="1" stop-color="#764328" stop-opacity=".3"/></linearGradient><linearGradient id="whTo-w" gradientUnits="userSpaceOnUse" x1="42.1" y1="31.5" x2="42.1" y2="17.5"><stop offset="0" stop-color="#9a6650"/><stop offset=".35" stop-color="#bd8b76"/><stop offset=".85" stop-color="#bd8b76"/><stop offset="1" stop-color="#dcbca8"/></linearGradient><clipPath id="whTo-x"><use href="#whTo-5"/></clipPath><linearGradient id="whTo-y" gradientUnits="userSpaceOnUse" x1="71.7" y1="102.3" x2="71.7" y2="135.8"><stop offset="0" stop-color="#4c2a17" stop-opacity="0"/><stop offset="1" stop-color="#4c2a17"/></linearGradient><linearGradient id="whTo-z" gradientUnits="userSpaceOnUse" x1="71.7" y1="158.9" x2="71.7" y2="188.7"><stop offset="0" stop-color="#b0744e" stop-opacity="0"/><stop offset="1" stop-color="#b0744e"/></linearGradient><clipPath id="whTo-10"><use href="#whTo-6"/></clipPath><clipPath id="whTo-11"><use href="#whTo-7"/></clipPath><radialGradient id="whTo-12"><stop offset="0" stop-color="#33495f" stop-opacity=".5"/><stop offset=".6" stop-color="#33495f" stop-opacity=".18"/><stop offset="1" stop-color="#33495f" stop-opacity="0"/></radialGradient><radialGradient id="whTo-13"><stop offset="0" stop-color="#97b2ca" stop-opacity=".42"/><stop offset=".6" stop-color="#97b2ca" stop-opacity=".14"/><stop offset="1" stop-color="#97b2ca" stop-opacity="0"/></radialGradient><linearGradient id="whTo-14" gradientUnits="userSpaceOnUse" x1="19.8" y1="184.9" x2="123.6" y2="184.9"><stop offset="0" stop-color="#5c7997"/><stop offset=".16" stop-color="#7290ac"/><stop offset=".4" stop-color="#6b89a6"/><stop offset=".62" stop-color="#62809e"/><stop offset=".86" stop-color="#506c8a"/><stop offset="1" stop-color="#455f7a"/></linearGradient><linearGradient id="whTo-15" gradientUnits="userSpaceOnUse" x1="35.3" y1="184.9" x2="108.2" y2="184.9"><stop offset="0" stop-color="#5c7997"/><stop offset=".16" stop-color="#7290ac"/><stop offset=".4" stop-color="#6b89a6"/><stop offset=".62" stop-color="#62809e"/><stop offset=".86" stop-color="#506c8a"/><stop offset="1" stop-color="#455f7a"/></linearGradient></defs><use href="#whTo-8" fill="none" stroke="#4a2814" stroke-width="1" stroke-opacity=".75" stroke-linejoin="round"/><use href="#whTo-8" fill="#9a5e3b"/><use href="#whTo-1" fill="url(#whTo-e)"/><use href="#whTo-1" fill="url(#whTo-f)"/><path d="M19.9 116.4c-.1 0-.6.1-.9.1s-.6.2-.8.3s-.6.2-.8.4s-.6.4-.7.5" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".084" stroke-linecap="round" stroke-linejoin="round"/><path d="M21.1 113.4c-.3 0-1.1.1-1.7.2s-1.1.3-1.6.5s-1 .4-1.5.7s-1.2.8-1.4 1" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".156" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.9 111.6c-.2 0-1 0-1.5.1s-.9.2-1.3.3s-.9.4-1.3.7s-.9.8-1.1 1" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".132" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.5 109.6c-.1 0-.6-.1-.9 0s-.5.1-.7.2s-.5.2-.7.4s-.5.5-.6.6" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".072" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.7 108.9c-.3.4-1.2 2.1-1.9 2.3s-2.3-1-2.8-1.1" fill="none" stroke="#b0744e" stroke-width="2.5" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.7 90.5c-.3.1-.6 0-.9.4s-.7.7-.7 2s.2 3.6.7 6s2 6.8 2.6 8.5s1 1.3 1.5 1.5s.9 0 1.3-.1s.9-.3 1.2-.5s.4.2.4-.8s.1-2.8-.4-5.2s-1.6-7.1-2.4-9s-1.8-2.3-2.4-2.8s-.6-.1-.9 0z" fill="url(#whTo-g)" stroke="#7d4c35" stroke-width=".9" stroke-opacity=".45"/><path d="M12 105.4c-.1.3-.2 1.1-.5 1.7s-.8 1.5-1.3 1.6s-1.5-.4-2-.8s-1-1.1-1.2-1.3" fill="none" stroke="#56301c" stroke-width="1.4" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.6 103.8c-.1-.4-.4-1.6-.6-2.4s-.3-1.6-.5-2.4s-.4-1.6-.6-2.4s-.5-1.9-.6-2.3" fill="none" stroke="#ecd3c3" stroke-width="1.4" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 91.4c-.3 0-1.1-.4-1.7-.2s-1.9 1-2.3 1.2" fill="none" stroke="#ecd3c3" stroke-width="1" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whTo-h)"><ellipse cx="13.5" cy="96.4" rx="10.2" ry="11.3" transform="rotate(-13.8 13.5 96.4)" fill="url(#whTo-d)" fill-opacity=".2"/></g><use href="#whTo-2" fill="url(#whTo-i)"/><use href="#whTo-2" fill="url(#whTo-j)"/><path d="M101.3 76.4c-.1 0-.5-.1-.8-.2s-.5-.1-.7-.1s-.5 0-.8 0s-.6.1-.8.1" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".14" stroke-linecap="round" stroke-linejoin="round"/><path d="M103.3 74.9c-.3-.1-1-.3-1.5-.4s-.9-.2-1.4-.2s-1-.1-1.5 0s-1.2.1-1.5.2" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".26" stroke-linecap="round" stroke-linejoin="round"/><path d="M102.3 73.1c-.2-.1-.8-.3-1.2-.4s-.8-.2-1.2-.2s-.8 0-1.2 0s-1.1.2-1.3.3" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".22" stroke-linecap="round" stroke-linejoin="round"/><path d="M101.8 71.4c-.1-.1-.4-.2-.7-.3s-.4-.1-.6-.1s-.5 0-.7 0s-.6.2-.7.2" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".12" stroke-linecap="round" stroke-linejoin="round"/><path d="M102.1 55.2c-.1 0-.4-.1-.5-.2s-.4 0-.6 0s-.3 0-.5 0s-.4.1-.5.1" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".077" stroke-linecap="round" stroke-linejoin="round"/><path d="M103.5 53.8c-.2-.1-.7-.3-1-.3s-.7-.2-1-.2s-.6 0-1 .1s-.8.2-1 .2" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".143" stroke-linecap="round" stroke-linejoin="round"/><path d="M102.7 52.2c-.2-.1-.6-.3-.8-.3s-.6-.2-.9-.2s-.5 0-.8.1s-.7.2-.8.3" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".121" stroke-linecap="round" stroke-linejoin="round"/><path d="M102.4 50.7c-.1-.1-.3-.2-.4-.2s-.3-.1-.5-.1s-.3 0-.5 0s-.4.2-.4.2" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".066" stroke-linecap="round" stroke-linejoin="round"/><path d="M105.6 50.4c-.7.1-2.5 1-3.7 1s-3-1-3.6-1.2" fill="none" stroke="#b0744e" stroke-width="1.6" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M102.2 37.9c-.5 0-.9-.1-1.4.1s-1.4.3-1.9 1.1s-.9 2.6-1.1 3.7s-.1 2.2 0 3.1s.3 2 .6 2.6s1 .9 1.6 1.1s1.1.3 1.9.2s2.2.1 2.9-.5s1.2-1.7 1.4-3.2s0-4.7-.3-5.9s-1-1.4-1.3-1.7s-.7-.4-1.1-.5s-.9-.1-1.3-.1z" fill="url(#whTo-k)" stroke="#7d4c35" stroke-width=".6" stroke-opacity=".45"/><path d="M105.8 48c-.2.2-.6.7-1.3 1s-1.9.6-2.6.7s-.6.1-1.3-.2s-2.1-1.3-2.5-1.6" fill="none" stroke="#56301c" stroke-width=".9" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M100.1 46.3c0-.2 0-1 0-1.5s0-1.1 0-1.6s0-1 .1-1.6s0-1.2 0-1.5" fill="none" stroke="#ecd3c3" stroke-width=".9" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><path d="M105.2 38.8c-.4 0-1.4-.4-2.4-.4s-3.1.3-3.7.3" fill="none" stroke="#ecd3c3" stroke-width=".6" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whTo-l)"><ellipse cx="100.7" cy="73.8" rx="6.9" ry="8.4" transform="rotate(4 100.7 73.8)" fill="url(#whTo-d)" fill-opacity=".26"/><ellipse cx="102.1" cy="42.2" rx="6.8" ry="7.8" transform="rotate(1.2 102.1 42.2)" fill="url(#whTo-d)" fill-opacity=".24"/></g><use href="#whTo-3" fill="url(#whTo-m)"/><use href="#whTo-3" fill="url(#whTo-n)"/><path d="M83.5 60.4c-.1 0-.5-.1-.8-.2s-.6-.1-.9-.1s-.6 0-.9.1s-.7.1-.9.1" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".14" stroke-linecap="round" stroke-linejoin="round"/><path d="M85.7 58.5c-.3 0-1.1-.2-1.7-.3s-1.1-.2-1.6-.2s-1.2 0-1.7.1s-1.4.2-1.7.3" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".26" stroke-linecap="round" stroke-linejoin="round"/><path d="M84.5 56.6c-.2-.1-.9-.4-1.4-.5s-.9-.1-1.4-.1s-.9 0-1.4.1s-1.2.3-1.4.3" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".22" stroke-linecap="round" stroke-linejoin="round"/><path d="M83.9 54.6c-.2 0-.6-.2-.8-.3s-.6-.1-.8-.1s-.5 0-.8.1s-.7.2-.8.2" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".12" stroke-linecap="round" stroke-linejoin="round"/><path d="M83.5 34.7c-.1-.1-.4-.2-.6-.2s-.4-.1-.6-.1s-.4 0-.6.1s-.5.1-.6.1" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".077" stroke-linecap="round" stroke-linejoin="round"/><path d="M85.1 32.9c-.2 0-.8-.2-1.2-.3s-.7-.1-1.1-.1s-.7 0-1.1.1s-1 .2-1.2.3" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".143" stroke-linecap="round" stroke-linejoin="round"/><path d="M84.1 31.2c-.2-.1-.6-.3-1-.4s-.6-.1-.9-.1s-.6 0-1 .1s-.8.3-.9.3" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".121" stroke-linecap="round" stroke-linejoin="round"/><path d="M83.8 29.4c-.1 0-.4-.2-.6-.2s-.3-.1-.5-.1s-.4 0-.5.1s-.5.2-.6.2" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".066" stroke-linecap="round" stroke-linejoin="round"/><path d="M87.3 27.9c-.7.2-2.8 1.3-4.1 1.3s-3.5-1.1-4.2-1.3" fill="none" stroke="#b0744e" stroke-width="1.8" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M83.2 13.7c-.6 0-1-.1-1.6.2s-1.6.6-2.1 1.2s-.9 1.8-1.1 2.5s-.1.9-.2 1.8s0 2.6.1 3.6s.4 2.2.9 2.9s1.1 1.1 1.7 1.3s1.3.3 2.3.2s2.5-.2 3.2-.7s1-1.4 1.3-2s.2-.8.3-1.7s.1-2.4.1-3.6s-.2-2.3-.6-3.2s-1.1-1.5-1.6-1.9s-.7-.3-1.2-.4s-1-.2-1.5-.2z" fill="url(#whTo-o)" stroke="#7d4c35" stroke-width=".7" stroke-opacity=".45"/><path d="M87.6 25.3c-.3.2-.8.8-1.5 1.1s-2 .9-2.9.9s-2.3-.6-3-.9s-1.2-.9-1.5-1.1" fill="none" stroke="#56301c" stroke-width="1" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M80.9 23.4c0-.3 0-1.2 0-1.8s0-1.2 0-1.8s0-1.1 0-1.7s0-1.5 0-1.8" fill="none" stroke="#ecd3c3" stroke-width="1" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><path d="M86.7 14.7c-.5 0-1.7-.4-2.8-.4s-3.6.4-4.3.4" fill="none" stroke="#ecd3c3" stroke-width=".7" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whTo-p)"><ellipse cx="82.7" cy="57.4" rx="7.9" ry="9.7" transform="rotate(1.4 82.7 57.4)" fill="url(#whTo-d)" fill-opacity=".26"/><ellipse cx="83.2" cy="18.6" rx="7.8" ry="8.9" transform="rotate(0 83.2 18.6)" fill="url(#whTo-d)" fill-opacity=".24"/></g><use href="#whTo-4" fill="url(#whTo-q)"/><use href="#whTo-4" fill="url(#whTo-r)"/><path d="M64 54.8c-.2-.1-.6-.2-.9-.2s-.7-.1-1-.1s-.6 0-.9.1s-.8.2-1 .2" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".14" stroke-linecap="round" stroke-linejoin="round"/><path d="M66.2 52.7c-.3-.1-1.2-.3-1.8-.4s-1.2-.1-1.8 0s-1.1 0-1.7.1s-1.5.3-1.8.4" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".26" stroke-linecap="round" stroke-linejoin="round"/><path d="M64.9 50.6c-.3 0-1-.3-1.5-.4s-1-.1-1.5-.1s-1 .1-1.5.2s-1.3.3-1.5.4" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".22" stroke-linecap="round" stroke-linejoin="round"/><path d="M64.1 48.6c-.1-.1-.6-.2-.8-.3s-.6-.1-.9-.1s-.6.1-.8.1s-.7.3-.9.3" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".12" stroke-linecap="round" stroke-linejoin="round"/><path d="M63.1 27.4c-.1 0-.4-.1-.6-.2s-.4 0-.6 0s-.4 0-.7 0s-.5.2-.6.2" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".077" stroke-linecap="round" stroke-linejoin="round"/><path d="M64.8 25.5c-.2 0-.8-.2-1.2-.3s-.8-.1-1.2-.1s-.8.1-1.2.2s-1 .2-1.2.3" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".143" stroke-linecap="round" stroke-linejoin="round"/><path d="M63.7 23.7c-.2-.1-.7-.3-1-.4s-.7-.1-1-.1s-.7.1-1.1.2s-.8.3-1 .4" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".121" stroke-linecap="round" stroke-linejoin="round"/><path d="M63.3 21.9c-.1-.1-.4-.2-.6-.3s-.4-.1-.6-.1s-.3.1-.5.1s-.5.2-.6.3" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".066" stroke-linecap="round" stroke-linejoin="round"/><path d="M67.1 20.2c-.8.2-3 1.4-4.5 1.4s-3.7-1.1-4.4-1.3" fill="none" stroke="#b0744e" stroke-width="1.9" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M62.4 5.1c-.5 0-1 0-1.6.2s-1.7.8-2.2 1.4s-1 1.9-1.2 2.6s-.1 1.1-.1 2s0 2.7.2 3.8s.4 2.4.8 3.1s1.3 1.1 2 1.4s1.4.2 2.3.1s2.7-.3 3.5-.7s1-1.5 1.3-2.2s.2-.9.3-1.8s.1-2.6 0-3.8s-.2-2.5-.6-3.4s-1.2-1.6-1.7-2s-.8-.4-1.3-.5s-1.1-.2-1.7-.2z" fill="url(#whTo-s)" stroke="#7d4c35" stroke-width=".7" stroke-opacity=".45"/><path d="M67.3 17.4c-.5.3-2.3 1.6-3.1 1.9s-.8.4-1.6.3s-2.3-.6-3.1-.9s-1.3-1-1.6-1.2" fill="none" stroke="#56301c" stroke-width="1.1" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M60.2 15.5c0-.3 0-1.3 0-1.9s0-1.3 0-1.9s0-1.3 0-1.9s-.1-1.6-.1-1.9" fill="none" stroke="#ecd3c3" stroke-width="1.1" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><path d="M66.2 6.2c-.7-.1-3.2-.5-4.5-.4s-2.5.4-3 .5" fill="none" stroke="#ecd3c3" stroke-width=".8" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whTo-t)"><ellipse cx="63" cy="51.6" rx="8.5" ry="10.3" transform="rotate(-.7 63 51.6)" fill="url(#whTo-d)" fill-opacity=".26"/><ellipse cx="62.5" cy="10.4" rx="8.3" ry="9.5" transform="rotate(-.7 62.5 10.4)" fill="url(#whTo-d)" fill-opacity=".24"/></g><use href="#whTo-5" fill="url(#whTo-u)"/><use href="#whTo-5" fill="url(#whTo-v)"/><path d="M43.9 62.8c-.1 0-.6-.1-.9-.1s-.6-.1-.9-.1s-.6.1-.9.2s-.8.2-.9.2" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".14" stroke-linecap="round" stroke-linejoin="round"/><path d="M46 60.8c-.3-.1-1.1-.3-1.7-.3s-1.2-.1-1.8-.1s-1.1.1-1.7.2s-1.4.4-1.7.4" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".26" stroke-linecap="round" stroke-linejoin="round"/><path d="M44.7 58.8c-.3-.1-1-.3-1.5-.3s-1-.1-1.5-.1s-.9.1-1.4.2s-1.2.4-1.5.4" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".22" stroke-linecap="round" stroke-linejoin="round"/><path d="M43.8 56.8c-.1 0-.5-.2-.8-.2s-.5-.1-.8-.1s-.5.1-.8.2s-.7.2-.8.3" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".12" stroke-linecap="round" stroke-linejoin="round"/><path d="M42.6 37.9c-.1 0-.4-.1-.6-.2s-.4 0-.6 0s-.4 0-.6.1s-.5.1-.6.2" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".077" stroke-linecap="round" stroke-linejoin="round"/><path d="M44.2 36.1c-.2-.1-.8-.2-1.2-.3s-.7-.1-1.1-.1s-.8.1-1.2.1s-.9.3-1.1.4" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".143" stroke-linecap="round" stroke-linejoin="round"/><path d="M43.1 34.3c-.1 0-.6-.3-.9-.3s-.7-.1-1-.1s-.7 0-1 .1s-.8.3-1 .4" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".121" stroke-linecap="round" stroke-linejoin="round"/><path d="M42.7 32.5c0 0-.3-.2-.5-.2s-.4-.1-.6-.1s-.3.1-.5.1s-.5.2-.6.3" fill="none" stroke="#56301c" stroke-width=".6" stroke-opacity=".066" stroke-linecap="round" stroke-linejoin="round"/><path d="M46.4 32c-.7.3-2.8 1.3-4.3 1.4s-3.5-1.1-4.2-1.3" fill="none" stroke="#b0744e" stroke-width="1.8" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M42.1 17.5c-.6 0-1-.1-1.6.2s-1.6.6-2.2 1.3s-.9 1.8-1.1 2.5s-.1 1-.1 1.9s-.1 2.6.1 3.7s.4 2.2.8 2.9s1.2 1.1 1.9 1.4s1.3.2 2.2.1s2.6-.2 3.4-.6s1-1.5 1.3-2.1s.2-.9.3-1.8s.1-2.5 0-3.6s-.2-2.5-.5-3.3s-1.2-1.5-1.7-2s-.7-.3-1.2-.4s-1.1-.2-1.6-.2z" fill="url(#whTo-w)" stroke="#7d4c35" stroke-width=".7" stroke-opacity=".45"/><path d="M46.7 29.4c-.5.3-2.3 1.5-3 1.8s-.8.3-1.6.2s-2.2-.5-3-.9s-1.3-.9-1.5-1.1" fill="none" stroke="#56301c" stroke-width="1.1" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M39.9 27.5c0-.3 0-1.3 0-1.9s-.1-1.2-.1-1.8s0-1.2 0-1.8s0-1.5 0-1.8" fill="none" stroke="#ecd3c3" stroke-width="1.1" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><path d="M45.7 18.5c-.7 0-3.1-.4-4.3-.4s-2.5.4-2.9.5" fill="none" stroke="#ecd3c3" stroke-width=".8" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/><g clip-path="url(#whTo-x)"><ellipse cx="42.9" cy="59.8" rx="8.2" ry="10" transform="rotate(-2.3 42.9 59.8)" fill="url(#whTo-d)" fill-opacity=".26"/><ellipse cx="42.1" cy="22.6" rx="8" ry="9.2" transform="rotate(-.2 42.1 22.6)" fill="url(#whTo-d)" fill-opacity=".24"/></g><g clip-path="url(#whTo-9)"><path d="M106.1 107.9c.2 1.7.6 7.5.7 10.2s-.1 3.2-.2 6.3s-.4 8.3-.7 12.2s-.5 7.3-.9 10.8s-.9 7.8-1.2 10.3s-.2 1.8-.5 4.9s-1.1 10.5-1.4 14.1s-.4 5.7-.4 7.3s-.2 1.1.1 2.3s1.4 2.7 1.5 5s-.6 6.6-.5 8.5s.2 1.2 1 2.7s3.2 4.9 3.8 6.4s.3 2.1-.4 2.9s-3.2 1.6-3.9 2" fill="none" stroke="url(#whTo-y)" stroke-width="35.3" stroke-opacity=".07" stroke-linecap="round" stroke-linejoin="round"/><path d="M106.1 107.9c.2 1.7.6 7.5.7 10.2s-.1 3.2-.2 6.3s-.4 8.3-.7 12.2s-.5 7.3-.9 10.8s-.9 7.8-1.2 10.3s-.2 1.8-.5 4.9s-1.1 10.5-1.4 14.1s-.4 5.7-.4 7.3s-.2 1.1.1 2.3s1.4 2.7 1.5 5s-.6 6.6-.5 8.5s.2 1.2 1 2.7s3.2 4.9 3.8 6.4s.3 2.1-.4 2.9s-3.2 1.6-3.9 2" fill="none" stroke="url(#whTo-y)" stroke-width="18.6" stroke-opacity=".09" stroke-linecap="round" stroke-linejoin="round"/><path d="M106.1 107.9c.2 1.7.6 7.5.7 10.2s-.1 3.2-.2 6.3s-.4 8.3-.7 12.2s-.5 7.3-.9 10.8s-.9 7.8-1.2 10.3s-.2 1.8-.5 4.9s-1.1 10.5-1.4 14.1s-.4 5.7-.4 7.3s-.2 1.1.1 2.3s1.4 2.7 1.5 5s-.6 6.6-.5 8.5s.2 1.2 1 2.7s3.2 4.9 3.8 6.4s.3 2.1-.4 2.9s-3.2 1.6-3.9 2" fill="none" stroke="url(#whTo-y)" stroke-width="8.2" stroke-opacity=".11" stroke-linecap="round" stroke-linejoin="round"/><path d="M48.6 213.8c-.7-.3-3.2-.8-3.9-1.3s-.9-.7-.4-1.8s3.1-3.3 3.9-4.5s.8 0 1.2-2.7s1-8.8 1.1-13.3s-.2-10.3-.6-13.6s-1.1-4.9-1.6-6.5s.1-.8-1.6-3.1s-7.1-9.4-8.5-11.3" fill="none" stroke="url(#whTo-z)" stroke-width="14" stroke-opacity=".13" stroke-linecap="round" stroke-linejoin="round"/><path d="M46.9 213.8c-.7-.3-3.2-.8-3.9-1.3s-.9-.7-.3-1.8s3-3.3 3.8-4.5s.8 0 1.2-2.7s1-8.8 1.1-13.3s-.2-10.3-.6-13.6s-1.1-4.9-1.6-6.5s.1-.8-1.5-3.1s-7.2-9.4-8.6-11.3" fill="none" stroke="url(#whTo-z)" stroke-width="6.7" stroke-opacity=".16" stroke-linecap="round" stroke-linejoin="round"/><path d="M41.1 213.8c-.6-.3-3.1-.8-3.8-1.3s-1-.7-.4-1.8s3-3.3 3.9-4.5s.8 0 1.1-2.7s1.1-8.8 1.2-13.3s-.3-10.3-.6-13.6s-1.1-4.9-1.7-6.5s.2-.8-1.5-3.1s-7.2-9.4-8.6-11.3" fill="none" stroke="#764328" stroke-width="4.1" stroke-opacity=".14" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="62.4" cy="134.7" rx="27.9" ry="37.2" transform="rotate(-6 62.4 134.7)" fill="url(#whTo-a)" fill-opacity=".45"/><ellipse cx="56.8" cy="127.3" rx="13" ry="20.5" transform="rotate(-8 56.8 127.3)" fill="url(#whTo-a)" fill-opacity=".3"/><ellipse cx="89.5" cy="144" rx="14" ry="29.8" transform="rotate(-4 89.5 144)" fill="url(#whTo-c)" fill-opacity=".2"/><path d="M46.9 112.8c1 5.2 3.9 20.9 5.8 31.4s4.9 26.2 5.8 31.4" fill="none" stroke="#d29a73" stroke-width="6" stroke-opacity=".08" stroke-linecap="round" stroke-linejoin="round"/><path d="M64.2 108.3c.2 5.6.7 22.4 1.1 33.7s.9 28 1.1 33.6" fill="none" stroke="#d29a73" stroke-width="6" stroke-opacity=".08" stroke-linecap="round" stroke-linejoin="round"/><path d="M80.8 111.6c-.6 5.4-2.3 21.4-3.4 32s-2.8 26.7-3.4 32" fill="none" stroke="#d29a73" stroke-width="6" stroke-opacity=".08" stroke-linecap="round" stroke-linejoin="round"/><path d="M96 120.9c-1.2 4.6-5 18.3-7.5 27.4s-6.3 22.8-7.6 27.3" fill="none" stroke="#d29a73" stroke-width="4.8" stroke-opacity=".08" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="96.3" cy="189.8" rx="6" ry="7.1" fill="url(#whTo-a)" fill-opacity=".42"/><ellipse cx="98.9" cy="198.7" rx="5.6" ry="6.7" fill="url(#whTo-c)" fill-opacity=".22"/><path d="M56.8 184.6c1.4.2 6.7 1 8 1.3" fill="none" stroke="#56301c" stroke-width=".7" stroke-opacity=".12" stroke-linecap="round" stroke-linejoin="round"/><path d="M68.8 186.6c1.2 0 5.8 0 6.9 0" fill="none" stroke="#56301c" stroke-width=".7" stroke-opacity=".12" stroke-linecap="round" stroke-linejoin="round"/><path d="M79.2 185.7c.9-.2 4.7-1.1 5.7-1.3" fill="none" stroke="#56301c" stroke-width=".7" stroke-opacity=".12" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="43.6" cy="95.7" rx="5.8" ry="4.7" fill="url(#whTo-a)" fill-opacity=".4"/><path d="M41.6 99.2c.6.1 2.1.9 3.1.9s2.6-.8 3.1-.9" fill="none" stroke="#56301c" stroke-width=".7" stroke-opacity=".16" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="44.7" cy="97.9" rx="9.1" ry="7.3" fill="url(#whTo-d)" fill-opacity=".14"/><ellipse cx="62.4" cy="91.2" rx="6" ry="4.9" fill="url(#whTo-a)" fill-opacity=".4"/><path d="M60.3 94.7c.6.2 2.2 1 3.2 1s2.7-.8 3.2-1" fill="none" stroke="#56301c" stroke-width=".7" stroke-opacity=".16" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="63.5" cy="93.4" rx="9.4" ry="7.5" fill="url(#whTo-d)" fill-opacity=".14"/><ellipse cx="80.5" cy="94.5" rx="5.7" ry="4.6" fill="url(#whTo-a)" fill-opacity=".4"/><path d="M78.6 98.1c.5.1 2 .9 3 .9s2.5-.8 3-.9" fill="none" stroke="#56301c" stroke-width=".7" stroke-opacity=".16" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="81.6" cy="96.8" rx="8.8" ry="7.1" fill="url(#whTo-d)" fill-opacity=".14"/><ellipse cx="97" cy="103.8" rx="4.9" ry="4" fill="url(#whTo-a)" fill-opacity=".4"/><path d="M95.5 107.4c.4.1 1.7.9 2.6.9s2.2-.8 2.6-.9" fill="none" stroke="#56301c" stroke-width=".7" stroke-opacity=".16" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="98.1" cy="106.1" rx="7.7" ry="6.2" fill="url(#whTo-d)" fill-opacity=".14"/></g><use href="#whTo-6" fill="none" stroke="#33485e" stroke-width="1.7" stroke-opacity=".9"/><use href="#whTo-6" fill="url(#whTo-14)"/><g clip-path="url(#whTo-10)"><ellipse cx="58.7" cy="270.5" rx="16.7" ry="44.6" transform="rotate(-4 58.7 270.5)" fill="url(#whTo-13)" fill-opacity=".32"/><ellipse cx="95.9" cy="356.1" rx="14.9" ry="63.2" transform="rotate(3 95.9 356.1)" fill="url(#whTo-12)" fill-opacity=".26"/><ellipse cx="41.9" cy="274.2" rx="39.4" ry="8.6" transform="rotate(-250.7 41.9 274.2)" fill="url(#whTo-12)" fill-opacity=".7"/><ellipse cx="32.7" cy="271" rx="34.7" ry="6.8" transform="rotate(-250.7 32.7 271)" fill="url(#whTo-13)" fill-opacity=".665"/><ellipse cx="98.2" cy="257.9" rx="23.6" ry="6.7" transform="rotate(57.9 98.2 257.9)" fill="url(#whTo-12)" fill-opacity=".55"/><ellipse cx="91.7" cy="262" rx="20.8" ry="5.4" transform="rotate(57.9 91.7 262)" fill="url(#whTo-13)" fill-opacity=".523"/><ellipse cx="68" cy="390.5" rx="41.6" ry="10" transform="rotate(40.5 68 390.5)" fill="url(#whTo-12)" fill-opacity=".6"/><ellipse cx="75.5" cy="381.7" rx="36.6" ry="8" transform="rotate(40.5 75.5 381.7)" fill="url(#whTo-13)" fill-opacity=".57"/><ellipse cx="79.1" cy="522.5" rx="45.4" ry="11.2" transform="rotate(-222.5 79.1 522.5)" fill="url(#whTo-12)" fill-opacity=".46"/><ellipse cx="70.5" cy="513.1" rx="40" ry="8.9" transform="rotate(-222.5 70.5 513.1)" fill="url(#whTo-13)" fill-opacity=".437"/></g><use href="#whTo-7" fill="#33495f" fill-opacity=".25" transform="translate(1.1 2.2)"/><use href="#whTo-7" fill="none" stroke="#33485e" stroke-width="1.7" stroke-opacity=".9"/><use href="#whTo-7" fill="url(#whTo-15)"/><g clip-path="url(#whTo-11)"><path d="M37.1 198.5c.3-.2.6-.9 1.7-1.4s1.7-1 5-1.4s10.3-1.2 15-1.6s8.6-.4 12.9-.4s8.3 0 13 .3s11.6.9 14.9 1.3s3.9.9 5 1.4s1.4 1.2 1.7 1.4" fill="none" stroke="#97b2ca" stroke-width="3" stroke-opacity=".2" stroke-linecap="round" stroke-linejoin="round"/><path d="M37.8 201.5c.3-.3.6-1 1.7-1.4s1.6-1 4.8-1.5s10.2-1.1 14.7-1.5s8.5-.4 12.7-.5s8.1.1 12.7.4s11.4.9 14.7 1.3s3.7.9 4.8 1.4s1.4 1.2 1.7 1.4" fill="none" stroke="#4a6480" stroke-width=".7" stroke-dasharray="1.4 1.2" stroke-opacity=".8"/><path d="M107.4 231.1c-.3.1-1.1.7-1.9.7s0 .5-2.6-.3s-9.6-3.6-13.3-4.5s-6-.7-9-.9s-5.9-.2-8.9-.2s-5.9 0-8.9.2s-5.3 0-9 .9s-10.6 3.7-13.2 4.5s-2 .4-2.7.3s-1.6-.6-1.9-.7" fill="none" stroke="#4a6480" stroke-width=".7" stroke-dasharray="1.4 1.2" stroke-opacity=".7"/><path d="M108.2 235.9c-.4.1-1.2.7-2 .8s0 .5-2.7-.4s-9.8-3.6-13.6-4.5s-6-.7-9.1-.9s-6.1-.2-9.1-.2s-6.1 0-9.1.2s-5.3 0-9.1.9s-10.9 3.7-13.6 4.5s-1.9.5-2.7.4s-1.6-.7-1.9-.8" fill="none" stroke="#33495f" stroke-width="3" stroke-opacity=".25" stroke-linecap="round" stroke-linejoin="round"/><path d="M94.2 193.7c.2 2.9.7 11.6.9 17.7s.7 15.8.8 18.9" fill="none" stroke="#33495f" stroke-width="1.3" stroke-opacity=".4" stroke-linecap="round" stroke-linejoin="round"/><path d="M93.1 193.7c.2 2.9.6 11.6.9 17.7s.6 15.8.8 18.9" fill="none" stroke="#97b2ca" stroke-width=".9" stroke-opacity=".25" stroke-linecap="round" stroke-linejoin="round"/></g><ellipse cx="101.1" cy="213.5" rx="3.7" ry="3.5" fill="#33495f" fill-opacity=".25"/><ellipse cx="100.5" cy="212.6" rx="3.5" ry="3.3" fill="#efebe3" stroke="#8d99a6" stroke-width=".6"/><ellipse cx="99.5" cy="211.6" rx=".5" ry=".5" fill="#8d99a6"/><ellipse cx="101.6" cy="211.6" rx=".5" ry=".5" fill="#8d99a6"/><ellipse cx="99.5" cy="213.5" rx=".5" ry=".5" fill="#8d99a6"/><ellipse cx="101.6" cy="213.5" rx=".5" ry=".5" fill="#8d99a6"/><path d="M38.8 194.5c.4-.2 1-.6 2.3-.9s2.7-.5 5.6-.9s7.9-.9 12.1-1.2s8.6-.4 12.9-.4s8.3 0 13 .3s11.6.9 14.9 1.3s4.2 1.2 5 1.4" fill="none" stroke="#4c2a17" stroke-width="2.6" stroke-opacity=".3" stroke-linecap="round" stroke-linejoin="round"/></svg>'},
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
const SW=1280,SH=720,PX=96/72,PAUSE=.45,CPT=138,TPT=104;
const LIST=['intro','ch_show','ch_pick','tg_show','tg_pick','bd_place','tk_page','rule','start','tok_first','tok_none','tok_more','tok_last','exchange','reset','tips','outro'];
const OPT={tk_page:1,tok_none:1};
const CHOF={intro:'book',ch_show:'choices',ch_pick:'choices',tg_show:'targets',tg_pick:'targets',bd_place:'board',tk_page:'board',rule:'session',start:'session',tok_first:'session',tok_none:'session',tok_more:'session',tok_last:'session',tok_last_term:'session',exchange:'exchange',reset:'exchange',tips:'tips',outro:'tips'};
const CHAPS=[['book','The book'],['choices','Choices'],['targets','Targets'],['board','Board'],['session','Session'],['exchange','Exchange'],['tips','Tips']];
/* (v21.49) a bus book plays its own walkthrough: the board, the route, the ride, the item, fading the timer, the plan for the staff.
   Each scene below is in the order played; a book plays one of each pair (b_spread or b_fixed, b_none or b_each, b_last or
   b_full, b_arrive or b_onbus) as its settings say */
const LIST_BUS=['b_intro','b_rules','b_item','b_route','b_spread','b_fixed','b_start','b_tok','b_none','b_each','b_more','b_last','b_full','b_arrive','b_onbus','b_land','b_fewer','b_plan','b_outro'];
const CHAPS_BUS=[['bboard','The board'],['broute','The route'],['bride','The ride'],['bitem','The item'],['bfade','Fading'],['bstaff','For the staff']];
Object.assign(CHOF,{b_intro:'bboard',b_rules:'bboard',b_item:'bboard',b_route:'broute',b_spread:'broute',b_fixed:'broute',b_start:'bride',b_tok:'bride',b_none:'bride',b_each:'bride',b_more:'bride',b_last:'bride',b_full:'bride',b_arrive:'bitem',b_onbus:'bitem',b_land:'bfade',b_fewer:'bfade',b_plan:'bstaff',b_outro:'bstaff'});
/* the narration as written in walk-script.json, used only when walk-audio.js is not in the build (its texts always win) */
const FB={
  intro:'This is your token board book. Four laminated pages are bound on the left, with a tab for each: Choices, Targets, Board, and Tokens.',
  ch_show:'Page one is the Choices page. Show it before the task begins. Every picture should be something your learner values right now, not something they can get any time, or have just had plenty of.',
  ch_pick:'Your learner looks over the pictures and picks one to work for. If needed, help with the pointing, but let your learner make the choice.',
  tg_show:'Page two is the Targets page, where you choose what to teach: a new skill, or a replacement behavior from the behavior plan. If the target is asking for something, like a break, still give what was asked for, every time.',
  tg_pick:'Choose one target at a time. Agree with the other adults on exactly what counts, so everyone gives tokens for the same thing.',
  bd_place:'Page three is the Board. Place the target under First, and the chosen item under Then. Your learner can now see the plan: first the target, then the item.',
  tk_page:'Page four is the Tokens page, where the tokens wait. The empty slots on the board show your learner how many are left to earn. Make new tokens valuable first; the tips at the end show how.',
  rule:'Before you start, decide how much of the target behavior earns a token: how many times, or how long. Keep it small, so your learner can succeed. This example uses one token for every two minutes.',
  start:'Now start the session. Point to the board and name both pictures: first the target, then the item. The ring counts down each two-minute interval, sped up for this video.',
  tok_first:'The interval is over, and your learner kept up the target behavior the whole time. Give a token right away, with brief praise that names what they did. Let your learner put it in the next slot.',
  tok_none:'If the behavior stops, there is no token for that interval, but the earned tokens stay on the board. Calmly remind your learner what to do right away, and start the interval over when they begin again.',
  tok_more:'Each interval with the target behavior earns another token, given right away with a few words of praise. The board fills up, one slot at a time.',
  tok_last_term:'One more interval earns the last token. It looks different: this is the terminal token, earned just like the others. With practice, it tells your learner that the board is finished and the item comes next.',
  tok_last:'One more interval with the target behavior, and the last token goes in. Now the board is full, and your learner has earned the item they chose.',
  exchange:'The board is full, so trade the tokens for the Then item right away, especially while the board is new. Your learner gets it for the time or amount set before the session.',
  reset:'When the time with the item is up, put it away, and return the pictures to their pages. Then your learner chooses again for the next round.',
  tips:'Three tips. Make the tokens valuable first: give one and trade it for the item right away, again and again, until your learner reaches for the token. Start with a small requirement and few tokens, and raise them slowly; if the behavior falls apart, go back a step. Keep the item available only through the board.',
  outro:'That\'s the whole cycle: choose, set the target, earn the tokens, and exchange. Over time, the target behavior should happen more often; if not, change the item or the requirement. The back of each page tells you more.'
};
Object.assign(FB,{
  b_intro:'This is a token board for the bus ride. It rides along with your learner, and the bus staff use it the same way on every trip.',
  b_rules:'Across the top are the bus rules your learner is working on, such as staying in the seat, a quiet voice, and hands to self. Choose two to four, each with a picture.',
  b_item:'Before the ride, your learner picks something to work for, and it goes in the Earn box, so the goal is in sight the whole way.',
  b_route:'This is the route, drawn simply, from the start of the ride to the stop. The form takes the usual length of the ride, which you can check in Maps.',
  b_spread:'The form spreads the tokens over the ride. It divides the time by the number of tokens, so the last token comes a minute or two before the stop, just as your learner gets close to the item.',
  b_fixed:'Here the tokens come at a set interval, such as every few minutes. On a long ride the board can fill more than once, with an exchange each time it is full.',
  b_start:'To start, the bus staff use a timer set to the checkpoint times on the plan. A vibrating watch is easy to use on a noisy bus. The timer here is sped up for this video.',
  b_tok:'At each checkpoint, if your learner followed the rules since the last one, give a token right away, with brief praise that names the rule. Let your learner put it on the board.',
  b_none:'If a rule is not followed, that checkpoint earns no token, but the earned tokens stay. Calmly name the rule once, and the next checkpoint is a fresh chance.',
  b_each:'With a row for each rule, every rule earns its own token at each checkpoint. A missed rule leaves only its own slot empty, and the other rules still earn.',
  b_more:'The bus rolls on, and each checkpoint with the rules followed earns another token. The board fills up along the way.',
  b_last:'The last token comes just before the stop. The board is full, and your learner has earned the item.',
  b_full:'When the last slot is filled, the board is full, and your learner has earned the item. On a long ride, the board then starts again.',
  b_arrive:'At the stop, the board goes with your learner to the adult who meets the bus. That adult sees the full board and gives the item right away.',
  b_onbus:'When the board is full, your learner gets the item right there on the bus, such as a sticker, a song, or a little time with a tablet. Check the district\u2019s rules before using food on the bus.',
  b_land:'Once the board is working, fade the timer. Use landmarks along the route as the checkpoints instead, such as a store, a park, or a bridge your learner can see from the window.',
  b_fewer:'Then use fewer checkpoints: every other landmark, and later just the stop. If the rides get harder, go back a step.',
  b_plan:'The form prints a ride plan for the bus staff, with the route, the checkpoints, what to say, and a log to fill in after each ride.',
  b_outro:'Same board, same rules, every ride. Over time, the rides should go more smoothly, with fewer tokens needed.'});
/* the simulator's pictures (the practice's own cards), shown when a page's six cards are empty */
const SAMPLE={btg:[['sitting','Stay in my seat'],['quiet','Quiet voice'],['safehands','Hands to self']],bch:[['sticker',''],['musicfun',''],['ipad',''],['cardbubbles',''],['cardbooks',''],['snackfun','']],
  blm:[['store','A store',.2],['park','The park',.4],['','A fire station',.58],['libraryplace','The library',.76],['','A bridge',.9]],ch:[['cardcrayons','Color'],['cardball','Ball'],['cardplayground','Playground'],['cardbreak','Break'],['youtube','YouTube'],['cardipad2','iPad']],
  tg:[['cardwriting','Writing'],['cardreading','Reading'],['cardalldone','All Done'],['boyraisehand','Raise hand'],['cardmath','Math'],['cardwaiting','Waiting']]};
/* brief praise that names the behavior: an ongoing behavior named by its -ing word reads as itself (Sitting: "Great sitting!");
   any other target is named after the praise ("Great job: raise hand!"), so the praise always says what was done */
const NOTGER=/^(bring|sing|ring|string|swing|thing|king|spring|sting|wing|sling|cling|fling|bling|ping)$/;
function gerund(label){const l=String(label||'').trim().toLowerCase();const w=(l.match(/^[a-z]+/)||[''])[0];return w.length>=5&&/ing$/.test(w)&&!NOTGER.test(w)&&l.length<=20;}
function praiseFor(label){const raw=String(label||'').trim().replace(/[.!?]+$/,''),l=raw.toLowerCase(),ger=gerund(l);
  const nm=raw?(/^[A-Z][a-z]/.test(raw)?raw[0].toLowerCase()+raw.slice(1):raw):'';
  if(ger)return{ger,name:l,first:'Great '+l+'!',last:'You did it! Great '+l+'!',
    more:['Nice '+l+'!','Way to keep '+l+'!','Good '+l+'!','You kept '+l+'!','Super '+l+'!','Great job '+l+'!','Nice job '+l+'!','Still '+l+'!']};
  if(!nm)return{ger,name:'',first:'Great job!',last:'You did it! Great job!',more:['Nice work!','Way to go!','Good job!','Keep it up!','Super job!','Great work!','Nice job!','You are doing it!']};
  return{ger,name:nm,first:'Great job: '+nm+'!',last:'You did it! Great job: '+nm+'!',
    more:['Nice work: '+nm+'!','Way to go: '+nm+'!','Good job: '+nm+'!','Super job: '+nm+'!','Great work: '+nm+'!','Nice job: '+nm+'!','Yes: '+nm+'!','Well done: '+nm+'!']};}

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
const handArt=()=>(typeof WALK_HANDS!=='undefined'&&WALK_HANDS&&WALK_HANDS.learner&&WALK_HANDS.teacher)?WALK_HANDS:placeholderHands();
function line(id){const L=audioLines();const l=L&&L[id];const t=String((l&&l.t)||FB[id]||'');const words=t.split(/\s+/).filter(Boolean).length;
  const d=l&&+l.d>0?+l.d:Math.max(1.5,words*.4);return{t,d,a:l&&typeof l.a==='string'?l.a:''};}
/* where each word starts in its recording (seconds from the start of the clip, by the character it starts at), taken from the
   voice's own phoneme lengths for that very clip (a mark at every word, at its audible start); a line whose text has changed since
   falls back to its share of the characters. Made by a script outside the repo; keyed by a hash of the text. */
/* MK:BEGIN */const MK={"intro":{"h":"281d43df","o":[[5,0.36],[8,0.49],[13,0.69],[19,1.14],[25,1.44],[31,2.31],[36,2.64],[46,3.21],[52,3.79],[56,3.96],[62,4.39],[65,4.49],[69,4.61],[75,5.16],[80,5.29],[82,5.36],[86,5.71],[90,5.86],[96,6.76],[105,7.64],[114,8.31],[121,8.76],[125,8.89]]},"ch_show":{"h":"6834c8b5","o":[[5,0.47],[9,0.97],[12,1.12],[16,1.22],[24,1.72],[30,2.77],[35,3.02],[38,3.14],[45,3.42],[49,3.54],[54,3.97],[62,5.12],[68,5.44],[76,5.89],[83,6.02],[86,6.19],[96,6.62],[101,6.79],[109,7.09],[116,7.69],[122,7.97],[127,8.77],[131,9.04],[141,9.42],[146,9.54],[150,9.69],[154,9.84],[158,10.04],[164,10.92],[167,11.27],[172,11.47],[177,11.72],[181,11.94],[188,12.39]]},"ch_pick":{"h":"29e7bff9","o":[[5,0.36],[13,0.73],[19,0.93],[24,1.11],[28,1.21],[37,1.91],[41,2.03],[47,2.33],[51,2.56],[54,2.68],[59,2.96],[64,3.93],[67,4.11],[75,4.83],[80,5.08],[85,5.21],[89,5.31],[99,6.21],[103,6.36],[107,6.56],[112,6.73],[120,7.11],[125,7.33],[129,7.43]]},"tg_show":{"h":"b9767bc2","o":[[5,0.54],[9,0.97],[12,1.12],[16,1.22],[24,1.69],[30,2.49],[36,2.64],[40,2.79],[47,3.17],[52,3.34],[55,3.47],[62,4.49],[64,4.62],[68,4.87],[75,5.54],[78,5.74],[80,5.82],[92,6.44],[101,7.04],[106,7.19],[110,7.29],[119,7.79],[125,8.84],[128,8.97],[132,9.09],[139,9.49],[142,9.69],[149,10.14],[153,10.29],[164,10.94],[169,11.12],[171,11.19],[178,11.99],[184,12.29],[189,12.49],[194,12.59],[198,12.79],[204,13.12],[209,13.57],[215,13.87]]},"tg_pick":{"h":"ff41feb0","o":[[7,0.49],[11,0.76],[18,1.19],[21,1.21],[23,1.36],[29,2.41],[35,2.79],[40,2.91],[44,3.06],[50,3.34],[57,3.79],[60,3.94],[68,4.56],[73,4.76],[81,5.51],[84,5.74],[93,6.26],[99,6.56],[106,7.14],[110,7.24],[114,7.41],[119,7.71]]},"bd_place":{"h":"10b87ff4","o":[[5,0.52],[11,0.92],[14,1.07],[18,1.17],[25,2.02],[31,2.29],[35,2.39],[42,2.77],[48,3.02],[55,3.62],[59,3.72],[63,3.82],[70,4.34],[75,4.69],[81,4.94],[87,5.89],[92,6.12],[100,6.54],[104,6.72],[108,7.04],[112,7.22],[116,7.32],[122,8.24],[128,8.54],[132,8.64],[140,9.27],[145,9.44],[149,9.59]]},"tk_page":{"h":"36a73586","o":[[5,0.49],[10,0.97],[13,1.12],[17,1.24],[24,1.79],[30,2.59],[36,2.72],[40,2.84],[47,3.42],[53,4.32],[57,4.49],[63,4.89],[69,5.34],[72,5.44],[76,5.54],[82,6.02],[87,6.27],[92,6.44],[100,6.89],[104,7.12],[109,7.37],[113,7.52],[118,7.77],[121,7.89],[127,8.92],[132,9.17],[136,9.39],[143,9.89],[152,10.47],[159,11.24],[163,11.34],[168,11.62],[171,11.69],[175,11.84],[179,12.22],[184,12.47]]},"rule":{"h":"f60a2c85","o":[[7,0.44],[11,0.56],[18,1.19],[25,1.69],[29,1.91],[34,2.14],[37,2.24],[41,2.36],[48,2.76],[57,3.34],[63,3.59],[65,3.69],[72,4.61],[76,4.76],[81,4.99],[88,5.69],[91,5.96],[95,6.19],[101,7.16],[106,7.36],[109,7.54],[116,8.19],[119,8.34],[124,8.51],[132,8.89],[136,9.09],[145,10.34],[150,10.54],[158,11.11],[163,11.51],[167,11.76],[173,12.29],[177,12.49],[183,12.81],[187,12.96]]},"start":{"h":"e3ef0808","o":[[4,0.48],[10,0.71],[14,0.81],[23,1.83],[29,2.13],[32,2.21],[36,2.31],[42,2.68],[46,2.78],[51,3.08],[56,3.38],[66,4.43],[72,4.71],[76,4.81],[84,5.46],[89,5.63],[93,5.78],[99,6.88],[103,7.03],[108,7.41],[115,7.81],[120,8.18],[125,8.53],[136,9.03],[146,9.88],[151,10.16],[154,10.36],[158,10.48],[163,10.68]]},"tok_first":{"h":"c0a19047","o":[[4,0.26],[13,0.78],[16,0.93],[22,1.73],[26,1.86],[31,2.03],[39,2.48],[44,2.73],[47,2.88],[51,2.98],[58,3.43],[67,3.93],[71,4.03],[77,4.33],[83,5.46],[88,5.61],[90,5.71],[96,6.36],[102,6.61],[108,7.36],[113,7.56],[119,7.88],[126,8.36],[131,8.53],[137,8.93],[142,9.11],[147,9.33],[152,10.28],[156,10.46],[161,10.61],[169,11.03],[173,11.26],[176,11.38],[179,11.48],[183,11.58],[188,11.86]]},"tok_none":{"h":"2e025844","o":[[3,0.24],[7,0.34],[16,0.84],[23,1.57],[29,1.74],[32,1.92],[35,2.17],[41,2.62],[45,2.77],[50,2.97],[60,3.89],[64,4.02],[68,4.19],[75,4.57],[82,5.14],[87,5.44],[90,5.54],[94,5.64],[101,6.74],[108,7.24],[115,7.67],[120,7.82],[128,8.27],[133,8.44],[136,8.57],[139,8.82],[145,9.09],[151,9.89],[155,10.04],[161,10.29],[165,10.42],[174,10.87],[179,11.22],[184,11.37],[189,11.49],[195,11.82]]},"tok_more":{"h":"bc2e8615","o":[[5,0.35],[14,0.82],[19,0.94],[23,1.04],[30,1.45],[39,2.12],[45,2.42],[53,2.8],[60,3.72],[66,4.07],[72,4.34],[77,4.77],[82,4.9],[84,5.04],[88,5.27],[94,5.54],[97,5.67],[105,6.87],[109,6.97],[115,7.29],[121,7.62],[125,8.19],[129,8.52],[134,8.92],[137,8.94],[139,9.09]]},"tok_last_term":{"h":"66774073","o":[[4,0.37],[9,0.62],[18,1.22],[24,1.54],[28,1.67],[33,2.04],[40,3.09],[43,3.22],[49,3.47],[60,4.49],[65,4.79],[68,4.94],[72,5.09],[81,5.62],[88,6.44],[95,6.87],[100,7.14],[105,7.29],[109,7.44],[117,8.52],[122,8.72],[132,9.67],[135,9.79],[141,10.09],[146,10.24],[154,10.64],[159,10.79],[163,10.94],[169,11.22],[172,11.42],[181,12.02],[185,12.12],[189,12.27],[194,12.62],[200,12.94]]},"tok_last":{"h":"ccaee597","o":[[4,0.37],[9,0.62],[18,1.12],[23,1.24],[27,1.37],[34,1.77],[44,2.74],[48,2.84],[52,2.97],[57,3.37],[63,3.79],[68,4.12],[72,5.09],[76,5.42],[80,5.52],[86,5.84],[89,6.04],[95,6.67],[99,6.79],[104,6.97],[112,7.39],[116,7.62],[123,7.84],[127,7.97],[132,8.29],[137,8.47]]},"exchange":{"h":"61c3812d","o":[[4,0.24],[10,0.54],[13,0.74],[19,1.44],[22,1.64],[28,1.91],[32,2.04],[39,2.61],[43,2.71],[47,2.84],[52,3.06],[57,3.56],[63,3.84],[69,4.69],[80,5.36],[86,5.54],[90,5.66],[96,5.99],[99,6.14],[104,7.14],[109,7.34],[117,7.74],[122,8.01],[125,8.16],[129,8.26],[133,8.44],[138,8.99],[141,9.16],[148,9.79],[152,10.04],[159,10.29],[163,10.39]]},"reset":{"h":"e9ec3a64","o":[[5,0.21],[9,0.34],[14,0.76],[19,0.89],[23,1.04],[28,1.39],[31,1.51],[35,2.04],[39,2.19],[42,2.29],[48,3.09],[52,3.21],[59,3.64],[63,3.74],[72,4.29],[75,4.36],[81,4.54],[88,5.84],[93,6.06],[98,6.24],[106,6.64],[114,7.06],[120,7.44],[124,7.56],[128,7.66],[133,7.96]]},"tips":{"h":"85d784c5","o":[[6,0.46],[12,1.36],[17,1.59],[21,1.71],[28,2.29],[37,2.86],[44,3.86],[49,4.09],[53,4.36],[57,4.51],[63,4.81],[66,4.94],[70,5.04],[74,5.21],[79,5.64],[85,5.89],[91,6.59],[97,7.04],[101,7.14],[108,7.86],[114,8.19],[119,8.36],[127,8.74],[135,9.19],[139,9.29],[143,9.41],[150,10.64],[156,10.94],[161,11.06],[163,11.21],[169,11.61],[181,12.36],[185,12.51],[189,12.71],[197,13.54],[201,13.69],[207,14.01],[212,14.26],[220,15.24],[223,15.34],[227,15.44],[236,16.01],[242,16.29],[249,16.96],[252,17.16],[257,17.41],[259,17.49],[265,18.41],[270,18.61],[274,18.76],[279,19.11],[289,19.69],[294,20.11],[302,20.31],[306,20.41]]},"outro":{"h":"cbf76364","o":[[7,0.38],[11,0.48],[17,0.76],[24,1.66],[32,2.43],[36,2.61],[40,2.73],[48,3.33],[53,3.53],[57,3.63],[65,4.36],[69,4.48],[79,5.91],[84,6.21],[90,6.78],[94,6.91],[101,7.28],[110,7.81],[117,7.96],[124,8.31],[129,8.56],[136,9.48],[139,9.63],[144,10.16],[151,10.48],[155,10.66],[160,11.18],[163,11.41],[167,11.51],[180,12.78],[184,12.88],[189,13.13],[192,13.21],[197,13.43],[202,13.86],[208,14.18],[212,14.31]]},"b_intro":{"h":"64ad00b","o":[[5,0.34],[8,0.44],[10,0.57],[16,1.04],[22,1.52],[26,1.64],[30,1.72],[34,1.99],[40,2.97],[43,3.17],[49,3.57],[55,3.84],[60,3.97],[65,4.09],[74,4.92],[78,5.02],[82,5.12],[86,5.34],[92,5.82],[96,6.04],[99,6.17],[103,6.34],[108,6.69],[112,6.99],[115,7.19],[121,7.49]]},"b_rules":{"h":"e8cee81a","o":[[7,0.58],[11,0.71],[15,1.13],[19,1.23],[23,1.38],[27,1.68],[33,2.06],[38,2.23],[46,2.66],[49,2.81],[57,3.18],[61,3.88],[66,4.08],[69,4.21],[77,4.63],[80,4.73],[84,4.91],[90,5.63],[92,5.76],[98,6.21],[105,6.81],[109,6.93],[115,7.38],[118,7.53],[124,8.63],[131,8.98],[135,9.18],[138,9.33],[144,10.03],[149,10.31],[154,10.43],[156,10.51]]},"b_item":{"h":"f3feaed2","o":[[7,0.36],[11,0.46],[17,1.04],[22,1.21],[30,1.61],[36,1.89],[46,2.19],[49,2.31],[54,2.59],[59,3.29],[63,3.39],[66,3.49],[71,3.89],[74,3.99],[78,4.16],[83,4.41],[88,5.34],[91,5.46],[95,5.56],[100,5.91],[103,6.06],[106,6.26],[112,6.56],[116,6.66],[122,6.96]]},"b_route":{"h":"c6f0bf36","o":[[5,0.41],[8,0.59],[12,0.74],[19,1.41],[25,1.81],[33,2.49],[38,2.64],[42,2.79],[48,3.04],[51,3.11],[55,3.24],[60,3.69],[63,3.76],[67,3.86],[73,5.01],[77,5.16],[82,5.56],[88,5.89],[92,6.06],[98,6.49],[105,6.74],[108,6.84],[112,6.96],[118,7.69],[124,7.89],[128,8.01],[132,8.19],[138,8.46],[141,8.59]]},"b_spread":{"h":"eb4fd866","o":[[4,0.26],[9,0.74],[17,1.14],[21,1.26],[28,1.86],[33,2.04],[37,2.16],[43,3.26],[46,3.39],[54,3.89],[58,4.01],[63,4.51],[66,4.69],[70,4.79],[77,5.04],[80,5.16],[88,6.26],[91,6.41],[95,6.56],[100,7.04],[106,7.51],[112,7.79],[114,7.86],[121,8.09],[124,8.26],[128,8.54],[135,8.81],[139,8.94],[145,9.81],[150,10.11],[153,10.24],[158,10.41],[166,10.81],[171,11.09],[177,11.41],[180,11.49],[184,11.64]]},"b_fixed":{"h":"8e397f41","o":[[5,0.33],[9,0.46],[16,1.03],[21,1.23],[24,1.31],[26,1.43],[30,1.68],[40,2.51],[45,2.68],[48,2.86],[54,3.16],[58,3.33],[67,4.38],[70,4.53],[72,4.66],[77,4.98],[82,5.36],[86,5.46],[92,5.76],[96,5.98],[101,6.26],[106,6.46],[111,6.58],[117,7.31],[122,7.46],[125,7.58],[134,8.38],[139,8.66],[144,9.03],[147,9.13],[150,9.33]]},"b_start":{"h":"dbea4514","o":[[3,0.26],[10,0.86],[14,0.96],[18,1.19],[24,1.66],[28,1.86],[30,1.99],[36,2.59],[40,2.81],[43,2.89],[47,2.99],[58,3.59],[64,4.29],[67,4.39],[71,4.49],[77,5.56],[79,5.69],[89,6.34],[95,6.69],[98,6.91],[103,7.29],[106,7.41],[110,7.79],[113,7.94],[115,8.09],[121,8.56],[126,9.56],[130,9.71],[136,10.14],[141,10.46],[144,10.61],[149,10.89],[152,11.09],[156,11.21],[161,11.41]]},"b_tok":{"h":"99aba9d3","o":[[3,0.36],[8,0.63],[20,1.58],[23,1.71],[28,1.88],[36,2.28],[45,2.68],[49,2.78],[55,3.16],[61,3.38],[65,3.48],[70,3.83],[75,4.43],[80,4.58],[82,4.71],[88,5.28],[94,5.56],[100,6.31],[105,6.53],[111,6.86],[118,7.36],[123,7.53],[129,7.86],[133,7.96],[139,9.03],[143,9.23],[148,9.38],[156,9.78],[160,9.96],[163,10.06],[166,10.16],[170,10.26]]},"b_none":{"h":"72ad28db","o":[[3,0.28],[5,0.41],[10,0.73],[13,0.88],[17,1.16],[27,1.91],[32,2.11],[43,2.71],[49,3.01],[52,3.26],[59,4.13],[63,4.26],[67,4.43],[74,4.76],[81,5.26],[87,6.31],[94,6.73],[99,6.98],[103,7.08],[108,7.36],[114,8.01],[118,8.11],[122,8.21],[127,8.46],[138,9.11],[141,9.21],[143,9.36],[149,9.68]]},"b_each":{"h":"58118845","o":[[5,0.24],[7,0.36],[11,0.69],[15,0.86],[20,1.14],[26,1.84],[32,2.19],[37,2.54],[43,2.79],[47,2.96],[51,3.29],[57,3.76],[60,3.91],[65,4.19],[77,5.49],[79,5.64],[86,5.99],[91,6.36],[98,6.71],[103,7.06],[107,7.24],[111,7.56],[116,7.96],[123,8.84],[127,8.94],[131,9.04],[137,9.29],[143,9.69],[149,9.96]]},"b_more":{"h":"b1c95ec9","o":[[4,0.21],[8,0.54],[14,0.84],[18,1.51],[22,1.71],[27,1.99],[38,2.59],[43,2.71],[47,2.84],[53,3.34],[62,3.81],[68,4.11],[76,4.46],[83,5.59],[87,5.69],[93,6.04],[99,6.31],[102,6.51],[108,6.84],[112,6.94]]},"b_last":{"h":"bdfc0356","o":[[4,0.21],[9,0.59],[15,1.06],[21,1.46],[26,1.76],[33,2.01],[37,2.11],[43,3.09],[47,3.24],[53,3.59],[56,3.79],[62,4.46],[66,4.59],[71,4.76],[79,5.21],[83,5.44],[90,5.64],[94,5.76]]},"b_full":{"h":"4a861d49","o":[[5,0.21],[9,0.31],[14,0.66],[19,1.01],[22,1.21],[30,1.86],[34,2.01],[40,2.31],[43,2.51],[49,3.14],[53,3.26],[58,3.44],[66,3.86],[70,4.06],[77,4.26],[81,4.39],[87,5.46],[90,5.61],[92,5.74],[97,6.06],[103,6.61],[107,6.74],[113,7.06],[118,7.29],[125,7.61]]},"b_arrive":{"h":"b57f4465","o":[[3,0.26],[7,0.38],[13,0.98],[17,1.11],[23,1.41],[28,1.71],[33,1.83],[38,1.98],[46,2.38],[49,2.46],[53,2.61],[59,3.23],[63,3.38],[69,3.68],[73,3.78],[78,4.86],[83,5.06],[89,5.56],[94,5.86],[98,6.01],[103,6.28],[109,7.03],[113,7.18],[119,7.38],[123,7.53],[128,7.96],[134,8.23]]},"b_onbus":{"h":"946b367a","o":[[5,0.21],[9,0.31],[15,0.56],[18,0.76],[24,1.34],[29,1.54],[37,1.89],[42,2.14],[46,2.29],[51,2.66],[57,2.94],[63,3.26],[66,3.36],[70,3.46],[75,4.21],[80,4.41],[83,4.51],[85,4.64],[94,5.46],[96,5.64],[102,6.41],[105,6.59],[107,6.66],[114,6.94],[119,7.39],[124,7.51],[126,7.59],[134,8.86],[140,9.14],[144,9.24],[155,9.69],[161,10.14],[168,10.44],[174,10.84],[179,11.19],[182,11.29],[186,11.39]]},"b_land":{"h":"28d64d44","o":[[5,0.41],[9,0.51],[15,0.76],[18,0.91],[27,1.61],[32,1.86],[36,1.96],[43,3.16],[47,3.41],[57,3.99],[63,4.29],[67,4.39],[73,4.79],[76,4.94],[80,5.04],[92,5.61],[101,6.66],[106,6.86],[109,6.99],[111,7.14],[118,7.91],[120,8.04],[126,8.81],[129,8.99],[131,9.11],[138,9.39],[143,9.51],[151,9.99],[155,10.21],[159,10.44],[164,10.59],[168,10.69]]},"b_fewer":{"h":"1a71d887","o":[[5,0.38],[9,0.63],[15,0.91],[28,1.98],[34,2.26],[40,2.48],[50,3.18],[54,3.31],[60,3.61],[65,3.88],[69,4.01],[75,5.01],[78,5.13],[82,5.26],[88,5.68],[92,5.83],[100,6.38],[103,6.58],[108,6.81],[110,6.88]]},"b_plan":{"h":"9c718c42","o":[[4,0.24],[9,0.61],[16,0.89],[18,1.01],[23,1.39],[28,1.76],[32,1.89],[36,1.96],[40,2.19],[47,3.01],[52,3.14],[56,3.29],[63,3.91],[67,4.01],[80,4.99],[85,5.16],[88,5.31],[93,5.89],[97,5.99],[99,6.11],[103,6.46],[106,6.61],[111,6.84],[114,6.99],[120,7.26],[125,7.51]]},"b_outro":{"h":"f2ceef2d","o":[[5,0.44],[12,0.91],[17,1.19],[24,1.71],[30,2.01],[36,2.96],[41,3.26],[47,3.89],[51,4.04],[57,4.44],[64,4.59],[67,4.79],[72,5.04],[82,5.91],[87,6.14],[93,6.44],[100,6.96]]}};/* MK:END */
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
  DOM={sec:stage.closest('section'),player:g('wkPlayer'),frame:g('wkFrame'),stage,big:g('wkBig'),cap2:g('wkCap2'),play:g('wkPlay'),restart:g('wkRestart'),seek:g('wkSeek'),time:g('wkTime'),cc:g('wkCc'),snd:g('wkSnd'),fs:g('wkFs'),chaps:g('wkChaps'),note:g('wkNote'),tx:g('wkTx')};const sk=DOM.seek;DOM.sfill=sk&&sk.querySelector('.wk-sfill');DOM.sthumb=sk&&sk.querySelector('.wk-sthumb');
  let m=DOM.frame.querySelector('.wk-msg');if(!m){m=div('wk-msg');m.setAttribute('role','status');m.hidden=true;DOM.frame.appendChild(m);}DOM.msg=m;
  wire();return DOM;}

/* ---------------- the build ---------------- */
let B=null;
function emptySix(a){return !a.some(o=>has(o)||String(o.l||'').trim());}
/* (v21.49) the landmarks the walkthrough shows: the book's own when it has two or more inside the ride, else sample ones */
function busWalkLm(saved){const R=Math.max(3,Math.min(120,num(saved.meta.bus_min)||25)),own=(saved.lm||[]).filter(o=>String(lbl(o)||'').trim()&&num(o.min)>0&&num(o.min)<=R);
  return own.length>=2?saved.lm.map(o=>Object.assign({},o)):SAMPLE.blm.map(([k,l,f])=>Object.assign(cello(P[k]?k:'',l),{min:String(Math.round(R*f))}));}
function firstUsed(a){const i=a.findIndex(o=>has(o)||String(o.l||'').trim());return i<0?0:i;}
function sampled(k){return SAMPLE[k].map(([key,l])=>P[key]?cello(key,''):cello('',l));}   /* the library's pictures and labels, as the simulator has them; the words alone when the library is missing */
/* the pages and cards drawn from a copy of the book's state: First-Then, the 8.82 in page, no presets in First and Then */
function forced(fn){const saved=S,bus=!!(saved.meta&&saved.meta.kind==='bus');
  try{S=Object.assign({},saved,{meta:Object.assign({},saved.meta,{layout:'ft',pagesize:'8.82'},bus?{bus_step:'timer'}:{}),ft:[cello(),cello()],
      ch:emptySix(saved.ch)?sampled(bus?'bch':'ch'):saved.ch.map(o=>Object.assign({},o)),tg:emptySix(saved.tg)?(bus?SAMPLE.btg.map(([k,l])=>cello(P[k]?k:'',l)).concat([cello(),cello(),cello()]):sampled('tg')):saved.tg.map(o=>Object.assign({},o)),
      lm:bus?busWalkLm(saved):saved.lm});
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

const CREDIT_WALK='Created by Joshua Newsome, BCBA';
function compose(D){
  const st=D.stage;st.innerHTML='';
  const layer=c=>{const d=div('wk-L '+(c||''));st.appendChild(d);return d;};
  const Lp=layer('wk-pages'),Lveil=layer('wk-veil'),Lfly=layer(),Lhl=layer('wk-hl'),Lht=layer('wk-ht'),Lfx=layer('wk-fx');
  const cap=div('wk-cap');st.appendChild(cap);
  const cred=div('wk-credit');cred.textContent=CREDIT_WALK;st.appendChild(cred);   /* v21.44 the author's credit, on every frame */
  /* the book, drawn from the forced copy of the state */
  /* the demo target: the first one that is an ongoing behavior (an -ing word, which suits a two-minute interval), else the first */
  const F=forced(()=>{const used=o=>has(o)||String(o.l||'').trim();const gi=S.tg.findIndex(o=>used(o)&&gerund(lbl(o)));
    const pk={ch:firstUsed(S.ch),tg:gi>=0?gi:firstUsed(S.tg)},n=nTok(),cpt=CPT/72,tpt=TPT/72;
    return{pg:{ch:pageGrid('ch'),tg:pageGrid('tg'),bd:pageBoard(),tk:pageTokens(),chb:pageBack('ch')},
      ch:S.ch.map(o=>has(o)||String(o.l||'').trim()?cardHtml(o,cpt):''),tg:S.tg.map(o=>has(o)||String(o.l||'').trim()?cardHtml(o,cpt):''),
      tok:Array.from({length:n},(_,i)=>tokCard(tpt,i===n-1)),chipTok:tokCard(.6,false),n,term:termOn(),pick:pk,
      itemPic:pic(S.ch[pk.ch],''),itemLbl:String(lbl(S.ch[pk.ch])||'').trim(),tgLbl:String(lbl(S.tg[pk.tg])||'').trim(),
      bus:isBus()?busWalkF():null};});
  const BUSM=!!F.bus,PR=praiseFor(F.tgLbl);
  const notes=[];
  if(BUSM)notes.push(...F.bus.notes);
  else if(S.meta.layout==='rules')notes.push('This book’s Board uses the Rules row (several targets and an Earn box); the walkthrough shows the First-Then Board. Tokens, praise and the exchange work the same way; agree on exactly what earns each token.');
  const libGone=!!window.NBH_PICTOS_MISSING,sampleWord=libGone?'sample words':'sample pictures';
  if(libGone&&[...S.ch,...S.tg,S.tok&&S.tok[0]].some(o=>o&&o.k&&!/^(tk|av):/.test(o.k)))notes.push('The picture library (nbh-pictos.js) is not beside this form, so its pictures are missing here and in the book; put it in the same folder.');
  if(emptySix(S.ch)&&emptySix(S.tg))notes.push('The Choices and Targets are still empty, so the walkthrough shows '+sampleWord+'.');
  else if(emptySix(S.ch))notes.push('The Choices are still empty, so the walkthrough shows '+sampleWord+' for them.');
  else if(emptySix(S.tg))notes.push('The Targets are still empty, so the walkthrough shows '+sampleWord+' for them.');
  if(!audioLines())notes.push('The recorded narration (nbh-tk1-narration.js) is not beside this form: the captions are read by the device’s own voice where it has one.');
  /* the four pages: the page itself (the canvas), no sheet and no trim marks */
  const PG={};['tk','bd','tg','ch','chb'].forEach(k=>{const el=div('wk-page');el.dataset.pg=k;el.innerHTML=F.pg[k];Lp.appendChild(el);
    const pg=el.querySelector('.pg'),cv=pg.querySelector('.cv');pg.querySelectorAll('.trim').forEach(x=>x.remove());cv.style.left='0';cv.style.top='0';
    const lay=div('wk-lay'),shade=div('wk-shade');cv.appendChild(lay);cv.appendChild(shade);PG[k]={k,el,pg,cv,lay,shade};});
  Object.values(PG).forEach(p=>{p.w=p.cv.offsetWidth;p.h=p.cv.offsetHeight;p.el.style.width=p.w+'px';p.el.style.height=p.h+'px';p.pg.style.width=p.w+'px';p.pg.style.height=p.h+'px';
    if(p.k!=='chb')p.cv.insertAdjacentHTML('beforeend',coilSvg(p.h));});
  const rel=(p,el)=>{const r=el.getBoundingClientRect(),c=p.cv.getBoundingClientRect(),k=c.width/(p.cv.offsetWidth||1)||1;return{x:(r.left-c.left)/k,y:(r.top-c.top)/k,w:r.width/k,h:r.height/k};};
  const ctr=r=>({x:r.x+r.w/2,y:r.y+r.h/2});
  const M={ch:[...PG.ch.cv.querySelectorAll('.bx')].map(e=>rel(PG.ch,e)),tg:[...PG.tg.cv.querySelectorAll('.bx')].map(e=>rel(PG.tg,e)),
    first:rel(PG.bd,PG.bd.cv.querySelector(BUSM?'.rule,.grule':'.bx.ft.grey')),then:rel(PG.bd,PG.bd.cv.querySelector(BUSM?'.earn .bx':'.bx.ft.green')),
    slot:[...PG.bd.cv.querySelectorAll(BUSM?'.slot,.gslot':'.slot')].map(e=>rel(PG.bd,e)),rules:BUSM?[...PG.bd.cv.querySelectorAll('.rule,.grule')].map(e=>rel(PG.bd,e)):[],
    ttl:rel(PG.bd,PG.bd.cv.querySelector('.ttl')),ybx:[...PG.tk.cv.querySelectorAll('.ybx')].map(e=>rel(PG.tk,e)),
    tab:{},band:rel(PG.ch,PG.ch.cv.querySelector('.band'))};
  M.tabCol={};['ch','tg','bd','tk'].forEach(k=>{const e=PG[k].cv.querySelector('.tab');M.tab[k]=rel(PG[k],e);M.tabCol[k]=getComputedStyle(e).backgroundColor||'#1d4a77';});
  const n=BUSM?M.slot.length:F.n,CW=CPT*PX,TW=BUSM&&M.slot.length?Math.min(TPT*PX,M.slot[0].w*.92):TPT*PX;
  /* the in-page copies (a card resting on its page moves and turns with it) */
  const inPage=(p,c,html,w)=>{const e=div('wk-in',html);e.style.left=f2(c.x-w/2)+'px';e.style.top=f2(c.y-w/2)+'px';e.style.width=f2(w)+'px';e.style.height=f2(w)+'px';p.lay.appendChild(e);return e;};
  const cards=[];
  const mkCard=(id,html,w,h,cls)=>{const el=div('wk-fc'+(cls?' '+cls:''),'<div class="wk-sh"></div>'+html);el.dataset.card=id;el.style.width=f2(w)+'px';el.style.height=f2(h)+'px';Lfly.appendChild(el);
    const c={id,el,sh:el.firstChild,w,h,tr:new Track({x:-400,y:-400,s:1,l:0,o:1}),where:new Steps('none'),fol:[],inp:{},pops:{},glow:null};cards.push(c);return c;};
  const CH=[],TG=[],TK=[];
  F.ch.forEach((h,i)=>{if(!h)return;const c=i===F.pick.ch?mkCard('ch'+i,h,CW,CW):{id:'ch'+i,inp:{},pops:{},where:new Steps('ch'),fly:false};c.inp.ch=inPage(PG.ch,ctr(M.ch[i]),h,CW);c.inp.ch.dataset.card='ch'+i;c.where.set(-1e8,'ch');if(!c.el)cards.push(c);CH[i]=c;});
  F.tg.forEach((h,i)=>{if(!h)return;const c=i===F.pick.tg?mkCard('tg'+i,h,CW,CW):{id:'tg'+i,inp:{},pops:{},where:new Steps('tg'),fly:false};c.inp.tg=inPage(PG.tg,ctr(M.tg[i]),h,CW);c.inp.tg.dataset.card='tg'+i;c.where.set(-1e8,'tg');if(!c.el)cards.push(c);TG[i]=c;});
  const cC=CH[F.pick.ch]||mkCard('chx',cardHtml({k:'',ph:'',l:'Item'},CPT/72),CW,CW),cT=TG[F.pick.tg]||mkCard('tgx',cardHtml({k:'',ph:'',l:'Target'},CPT/72),CW,CW);
  const CWE=BUSM?Math.min(CW,M.then.w-10):CW;cC.inp.bd=inPage(PG.bd,ctr(M.then),F.ch[F.pick.ch]||cC.el.lastChild.outerHTML,CWE);cC.inp.bd.dataset.card=cC.id;
  cT.inp.bd=inPage(PG.bd,ctr(M.first),F.tg[F.pick.tg]||cT.el.lastChild.outerHTML,CW);cT.inp.bd.dataset.card=cT.id;
  for(let i=0;i<n;i++){const th=F.tok[i]||F.tok[F.tok.length-1];const c=mkCard('tok'+i,th,TW,TW,'wk-tok');c.inp.tk=inPage(PG.tk,ctr(M.ybx[i]||M.ybx[M.ybx.length-1]),th,TW);c.inp.bd=inPage(PG.bd,ctr(M.slot[i]),th,TW);
    c.inp.tk.dataset.card=c.inp.bd.dataset.card='tok'+i;c.where.set(-1e8,'tk');TK.push(c);}
  const lastTok=TK[n-1];if(F.term&&lastTok&&!(BUSM&&F.bus.each)){lastTok.glow=div('wk-tglow');lastTok.el.insertBefore(lastTok.glow,lastTok.el.children[1]);}
  /* the item (the Then card grown into the thing itself) */
  const itemLabel=F.itemLbl?F.itemLbl+', as agreed':'The item, as agreed';   /* the time or amount is set before the session (no number that echoes the interval) */
  const IW=250;const item=mkCard('item','<div class="wk-ipic">'+(F.itemPic||'<span>'+esc(F.itemLbl||'Item')+'</span>')+'</div><div class="wk-ilbl">'+esc(itemLabel)+'</div>',IW,IW,'wk-item');
  /* the hands */
  const ART=handArt(),hands=[];
  const mkHand=who=>{const root=div('wk-hand wk-'+who);(who==='teacher'?Lht:Lhl).appendChild(root);const h={who,root,poses:{},base:HS[who],tr:new Track({x:640,y:SH+700,s:1,sx:640,sy:SH+800}),pose:new Steps('point'),lifts:[]};
    ['point','pinch','open'].forEach(p=>{const a=ART[who][p];const an=a[ANCH[p]]||[a.w/2,0];const e=div('wk-pose',a.svg);e.style.width=a.w+'px';e.style.height=a.h+'px';e.style.transformOrigin=f2(an[0])+'px '+f2(an[1])+'px';root.appendChild(e);const wr=a.wrist||[a.w/2,a.h*.24];h.poses[p]={el:e,ax:an[0],ay:an[1],wx:wr[0],wy:wr[1],w:a.w,h:a.h};});
    hands.push(h);return h;};
  const HL=mkHand('learner'),HT=mkHand('teacher');
  /* layouts: the closed book centred; the session (the Board large on the left, the Tokens page smaller on the right) */
  const pw=PG.ch.w,ph=PG.ch.h,maxH=Math.max(PG.ch.h,PG.tg.h,PG.bd.h,PG.tk.h);
  const sBk=Math.min(.86,566/maxH),bx=(SW-pw*sBk)/2,by=30;
  const DEPTH={chb:0,ch:0,tg:1,bd:2,tk:3};
  const BOOK=(k,s,x,y)=>{s=s||sBk;const X=x==null?(SW-pw*s)/2:x,Y=y==null?by:y;return{x:X+DEPTH[k]*2.2*s/sBk,y:Y+DEPTH[k]*2.6*s/sBk,s};};
  /* each person keeps one seat for the whole video: the learner on the left, the teacher on the right; a picked card waits on the
     table on its own person's side (the chosen item on the left, the target on the right) */
  const TL={x:bx/2,y:by+ph*sBk*.5},TR={x:SW-bx/2,y:by+ph*sBk*.5};
  const sBd=BUSM?Math.min(.58,330/PG.bd.h):Math.min(.8,520/PG.bd.h),sTk=BUSM?Math.min(.34,190/PG.tk.h):.52;
  const BDS=BUSM?{x:20,y:28,s:sBd}:{x:26,y:30,s:sBd},TKS=BUSM?{x:548,y:300,s:sTk}:{x:SW-26-pw*sTk,y:Math.min(300,604-PG.tk.h*sTk),s:sTk};
  const RC=BUSM?{x:TKS.x+pw*sTk+110,y:TKS.y+88}:{x:TKS.x+pw*sTk/2,y:Math.max(150,TKS.y-112)};
  const HO=BUSM?{x:BDS.x+pw*sBd/2,y:BDS.y+PG.bd.h*sBd+190}:{x:(BDS.x+pw*sBd+TKS.x)/2,y:Math.max(220,TKS.y-24)};   /* where the teacher holds a token out: in the gap between the Board and the Tokens page */
  const at=(L,c)=>({x:L.x+L.s*c.x,y:L.y+L.s*c.y});
  const s0=sBk*.93;
  Object.keys(PG).forEach(k=>{const b=BOOK(k,s0,(SW-pw*s0)/2,by+ph*(sBk-s0)/2);PG[k].tr=new Track({x:b.x,y:b.y,s:b.s,ry:0,o:k==='chb'?0:1,fx:1});PG[k].el.style.zIndex=String(k==='chb'?11:10-DEPTH[k]);});
  /* overlays */
  const fxs=[];
  const mkFx=(cls,html,box,init,parent)=>{const e=div('wk-o '+cls,html);if(box){e.style.left=f2(box.x)+'px';if(box.b!=null){e.style.top='auto';e.style.bottom=f2(SH-box.b)+'px';}else e.style.top=f2(box.y)+'px';if(box.w!=null)e.style.width=f2(box.w)+'px';if(box.h!=null)e.style.height=f2(box.h)+'px';}(parent||Lfx).appendChild(e);
    const fx={el:e,tr:new Track(Object.assign({o:0,s:1,dy:0,dx:0},init||{}))};fxs.push(fx);return fx;};
  const sub=(el,init)=>{const fx={el,tr:new Track(Object.assign({o:0,s:1,dy:0,dx:0},init||{}))};fxs.push(fx);return fx;};
  /* a glow fades in over 0.3 s: callers start it 0.15 s before the word, so it peaks on the word */
  const pulse=(fx,t0,dur,s)=>{fx.tr.move(t0,t0+.3,{o:1,s:s||1});fx.tr.move(t0+Math.max(.35,dur-.4),t0+dur,{o:0});};
  const glowAt=(L,r,pad,t0,dur,round)=>{const p=pad||6;const g=mkFx('wk-glow'+(round?' round':''),'',{x:L.x+L.s*r.x-p,y:L.y+L.s*r.y-p,w:L.s*r.w+2*p,h:L.s*r.h+2*p});pulse(g,t0,dur);return g;};
  const veil={el:Lveil,tr:new Track({o:0,s:1,dy:0,dx:0})};fxs.push(veil);
  /* the four tabs named as they are read: a label in each tab's colour beside it */
  const tabLbl={};[['ch','Choices'],['tg','Targets'],['bd','Board'],['tk','Tokens']].forEach(([k,w])=>{const L=BOOK(k),r=M.tab[k];
    const fx=mkFx('wk-tabl',esc(w),{x:L.x+L.s*(r.x+r.w)+14,y:L.y+L.s*(r.y+r.h/2)-24},{s:.8,dx:-10});fx.el.style.borderColor=M.tabCol[k];fx.el.style.setProperty('--tc',M.tabCol[k]);tabLbl[k]=fx;});
  const ringBox={x:RC.x-74,y:RC.y-74,w:148,h:148};
  const ringEl=mkFx('wk-ring','<svg viewBox="0 0 200 200" aria-hidden="true"><circle class="bg" cx="100" cy="100" r="84"/><circle class="fg" cx="100" cy="100" r="84" transform="rotate(-90 100 100)"/></svg><div class="wk-rt">'+(BUSM?busClock(F.bus.gap):'2:00')+'</div><div class="wk-rl">sped up for this video</div>',ringBox,{s:.7});
  const ring={fx:ringEl,fg:ringEl.el.querySelector('.fg'),t:ringEl.el.querySelector('.wk-rt'),ints:[],C:2*Math.PI*84};
  /* the rule: "1 token for ..." first, then the example filled in */
  const chip=mkFx('wk-chip','<span class="wk-ct">'+F.chipTok+'</span><span class="wk-cst"><span class="wk-c0"><b>1 token</b> for <span class="wk-blank"></span></span><span class="wk-c1"><b>1 token</b> for every<br><b>2 minutes</b> of '+(PR.ger?esc(PR.name):'the target')+'</span></span>',{x:RC.x-185,y:12,w:370},{s:.8});
  const chip0=sub(chip.el.querySelector('.wk-c0'),{o:1}),chip1=sub(chip.el.querySelector('.wk-c1'));
  const ricN=mkFx('wk-ric','<svg viewBox="0 0 64 44" aria-hidden="true"><path d="M8 6v32M18 6v32M28 6v32M38 6v32M2 34L46 10" stroke="#1d4a77" stroke-width="5" stroke-linecap="round" fill="none"/><text x="50" y="40" font-size="0"></text></svg><span>How many times</span>',{x:RC.x-182,y:104,w:172},{s:.7,dy:8});
  const ricL=mkFx('wk-ric','<svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="#fff" stroke="#1d4a77" stroke-width="4.5"/><path d="M22 10v12l8 6" stroke="#ef7d00" stroke-width="4.5" stroke-linecap="round" fill="none"/></svg><span>How long</span>',{x:RC.x+10,y:104,w:172},{s:.7,dy:8});
  const noTok=mkFx('wk-note2','<b>No token</b> this interval.<br>Earned tokens stay.',{x:RC.x-84-262,y:RC.y-44,w:262},{s:.9});
  /* the praise bubble: over the token the teacher holds out (between the Board and the Tokens page), not over the pictures; its
     bottom stays put, so a longer name wraps upward; marked, the words that name the behavior are underlined */
  const bubble=(text,t0,dur,mark)=>{let h=esc(text);if(mark&&PR.name){const e=esc(PR.name),i=h.lastIndexOf(e);if(i>=0)h=h.slice(0,i)+'<span class="wk-nm">'+e+'</span>'+h.slice(i+e.length);}
    const b=mkFx('wk-bub',h,{x:clamp(HO.x-165,10,SW-340),b:HO.y-TW*sBd/2-50,w:330},{s:.6,dy:12});
    b.tr.move(t0,t0+.3,{o:1,s:1,dy:0},0,easeOut);b.tr.move(t0+dur-.3,t0+dur,{o:0,dy:-8});return b;};
  const tipsCard=mkFx('wk-tips','<h3>Three tips</h3>'+'<div class="wk-tip" data-i="0"><b>1</b><p><strong>Make the tokens valuable first.</strong> Give a token and trade it for the item right away, again and again, until your learner reaches for the token.</p></div>'
    +'<div class="wk-tip" data-i="1"><b>2</b><p><strong>Start small.</strong> Ask for a little behavior and use few tokens, then raise them slowly; if the behavior falls apart, go back a step.</p></div>'
    +'<div class="wk-tip" data-i="2"><b>3</b><p><strong>Only through the board.</strong> Keep the Then item put away at other times.</p></div>',{x:520,y:44,w:720},{dy:16});
  const tipRows=[...tipsCard.el.querySelectorAll('.wk-tip')].map(e=>sub(e,{dy:14,h:0}));
  /* tip one, shown under the book: a token given, then traded for the item at once */
  const PDX=212;
  const pair=mkFx('wk-pair','<div class="wk-pt">'+F.chipTok+'</div><div class="wk-pa">→</div><div class="wk-pi">'+(F.itemPic||'<span>'+esc(F.itemLbl||'Item')+'</span>')+'</div>',{x:64,y:478,w:400,h:104});
  const pTok=sub(pair.el.querySelector('.wk-pt')),pItem=sub(pair.el.querySelector('.wk-pi'),{o:1});
  /* tip two, in the same place: the requirement as steps; the token climbs one step at a time, wobbles where the behavior falls apart,
     and goes back a step */
  const STX=86,STY=16;
  const stairs=mkFx('wk-stairs','<svg viewBox="0 0 400 122" aria-hidden="true">'+[0,1,2,3].map(i=>'<rect x="'+(24+i*STX)+'" y="'+(92-i*STY)+'" width="78" height="'+(18+i*STY)+'" rx="5"/>').join('')+'</svg>'
    +'<div class="wk-sbk">&larr; back a step</div><div class="wk-stk">'+F.chipTok+'</div>',{x:64,y:466,w:400,h:122});
  const stTok=sub(stairs.el.querySelector('.wk-stk'),{o:1,s:.7}),stBack=sub(stairs.el.querySelector('.wk-sbk'),{dy:6});
  /* tip three, in the same place: the item is locked away except through the board */
  const lock=mkFx('wk-lock','<div class="wk-lpic"><div class="wk-pi">'+(F.itemPic||'<span>'+esc(F.itemLbl||'Item')+'</span>')+'</div>'
    +'<svg class="wk-lk" viewBox="0 0 40 46" aria-hidden="true"><path d="M11 20v-7a9 9 0 0 1 18 0v7" fill="none" stroke="#1d2b36" stroke-width="5" stroke-linecap="round"/><rect x="5" y="19" width="30" height="24" rx="5" fill="#ef7d00" stroke="#1d2b36" stroke-width="3"/><circle cx="20" cy="30" r="3.4" fill="#1d2b36"/></svg></div>'
    +'<p><b>Only</b> through<br>the board</p>',{x:64,y:478,w:400,h:104});
  /* the Targets page: a target that is a request (asking for a break) still gets what was asked for, every time */
  const fcr=mkFx('wk-fcr','<div class="wk-fq"><svg viewBox="0 0 48 40" aria-hidden="true"><path d="M7 4h34a5 5 0 0 1 5 5v15a5 5 0 0 1-5 5H21l-9 8v-8H7a5 5 0 0 1-5-5V9a5 5 0 0 1 5-5z" fill="#fff" stroke="#1d4a77" stroke-width="3.5" stroke-linejoin="round"/><circle cx="15" cy="16.5" r="2.7" fill="#1d4a77"/><circle cx="24" cy="16.5" r="2.7" fill="#1d4a77"/><circle cx="33" cy="16.5" r="2.7" fill="#1d4a77"/></svg><span>&ldquo;A break, please.&rdquo;</span></div>'
    +'<div class="wk-fa"><b>✓</b><span>Give the break,<br><em>every time</em></span></div>',{x:1004,y:150,w:264},{s:.85,dy:10});
  const fqa=sub(fcr.el.querySelector('.wk-fa'),{dy:8}),fqe=sub(fcr.el.querySelector('.wk-fa em'),{o:1,h:0});
  const cyc=mkFx('wk-cyc','',{x:90,y:478,w:1100});
  const cycArr=[];const cycItems=['Choose','Set the target','Earn the tokens','Exchange'].map((w,i)=>{if(i){const a=div('wk-cya','→');cyc.el.appendChild(a);cycArr[i]=sub(a,{dx:-6});}const e=div('wk-cy','<b>'+(i+1)+'</b>'+esc(w));cyc.el.appendChild(e);return sub(e,{s:.85,dy:10});});

  /* ---- choreography helpers (stage coordinates) ---- */
  /* where a hand holds a card (as a share of the card's size from its centre): the teacher, who reaches from the right, by its right
     edge; the learner, from the left, by its lower left; so at a hand-off the two hands meet on opposite sides */
  const GR={learner:[-.25,.46],teacher:[.46,.05]};
  const grip=(c,p,s,who,g)=>{g=g||GR[who];return{x:p.x+c.w*s*g[0],y:p.y+c.h*s*g[1]};};
  const pointAt=(p,s)=>({x:p.x,y:p.y+CW*s*.12});
  /* a longer move lifts the hand a little off the table (it grows a few per cent and settles) */
  const lift=(h,t0,t1,d)=>{if(d>150&&t1-t0>.25)h.lifts.push([t0,t1-t0]);};
  const handTo=(h,t0,t1,p,arc)=>{const a=h.tr.at(t0);lift(h,t0,t1,Math.hypot(p.x-a.x,p.y-a.y));h.tr.move(t0,t1,{x:p.x,y:p.y},arc==null?.14:arc);};
  /* in and out of the frame: from just below its bottom edge, along the line from the shoulder; the way in takes longer the
     further it goes (0.8 to 1.3 s) and slows down to land; it starts earlier rather than landing later */
  /* the drawing is turned along the arm, so a corner of it can rise above the touch point: the hand parks low enough that its
     highest corner, at that angle, is still 34 px below the frame */
  const offY=(h,pose,p,sx,sy)=>{const P=h.poses[pose],r=Math.atan2(p.x-sx,sy-p.y),sn=Math.sin(r),cs=Math.cos(r);let up=P.ay;
    for(const x of [-P.ax,P.w-P.ax])for(const y of [-P.ay,P.h-P.ay])up=Math.max(up,-(x*sn+y*cs));return SH+34+h.base*up;};
  const offFrom=(p,sx,sy,y)=>{const dx=sx-p.x,dy=sy-p.y,len=Math.hypot(dx,dy)||1,k=(y-p.y)/Math.max(.2,dy/len);return{x:p.x+dx/len*k,y:p.y+dy/len*k};};
  const enter=(h,t0,t1,p,pose,sh)=>{const o=offFrom(p,sh[0],sh[1],offY(h,pose,p,sh[0],sh[1]));const dur=clamp(Math.hypot(p.x-o.x,p.y-o.y)/700,.8,1.3);
    const st=Math.min(t1-.35,Math.max(Math.min(t0,t1-dur),h.tr.last().t+.02));h.tr.set(st,{x:o.x,y:o.y,sx:sh[0],sy:sh[1],s:1});h.pose.set(st,pose);h.tr.move(st,t1,{x:p.x,y:p.y},.04,easeOut);return st;};
  const leave=(h,t0,t1)=>{const s=h.tr.at(t0);const o=offFrom(s,s.sx,s.sy,offY(h,h.pose.at(t0).v,s,s.sx,s.sy));h.tr.move(t0,t1,{x:o.x,y:o.y},0,easeIn);};
  /* a held card keeps the same point under the fingers: the offset from the hand scales with the card */
  const take=(c,h,t)=>{const cp=cardPos(c,t),hp=h.tr.at(t);c.fol.push({t0:t,t1:1e9,h,dx:cp.x-hp.x,dy:cp.y-hp.y,s0:c.tr.at(t).s||1});c.where.set(t,'fly');};
  const release=(c,t)=>{const f=c.fol[c.fol.length-1];if(!f||f.t1<1e9)return;const p=folPos(c,f,t);f.t1=t;c.tr.set(t,{x:p.x,y:p.y});};
  const carryTo=(c,h,t0,t1,dst,arc)=>{const f=c.fol[c.fol.length-1],k=(c.tr.at(t1).s||1)/f.s0;handTo(h,t0,t1,{x:dst.x-f.dx*k,y:dst.y-f.dy*k},arc==null?.18:arc);};
  const cardPos=(c,t)=>cardPosOf(c,t);
  const pageTurn=(k,t0,t1,back)=>{const p=PG[k];if(back){p.tr.set(t0,{o:1});p.tr.move(t0,t1,{ry:0},0,easeOut);}else{p.tr.move(t0,t1,{ry:-90},0,u=>u*u*(3-2*u));p.tr.set(t1,{o:0});}};
  const stackTo=(t0,t1,fn)=>{['tk','bd','tg','ch'].forEach((k,i)=>PG[k].tr.move(t0+(3-i)*.03,t1,fn(k)));};
  let session=false,ringPending=null;
  const toSession=(t0,dur)=>{PG.bd.tr.move(t0,t0+dur,BDS);PG.tk.tr.move(t0+.15,t0+dur,TKS,.05);session=true;};
  const toBook=(t0,dur)=>{PG.bd.tr.move(t0,t0+dur,BOOK('bd'));PG.tk.tr.move(t0,t0+dur-.1,BOOK('tk'),.05);session=false;};
  /* an interval of the ring: it runs from t0 to t1 (to the share f of the ring when the behavior stopped), then holds its ✓ or – until hold */
  const ringInt=(t0,t1,ok,o)=>{o=o||{};ring.ints.push({t0,t1,ok,f:o.f||1,hold:o.hold||t1+.8,secs:o.secs});};
  /* a token from the Tokens page to the Board: the teacher's hand takes it and holds it out with praise; the learner's hand takes it and puts it in its slot */
  const SHT=[1110,SH+480],SHL=[300,SH+480];
  const deliver=(i,o)=>{const c=TK[i],src=at(TKS,ctr(M.ybx[i])),dst=at(BDS,ctr(M.slot[i])),gp=grip(c,src,sTk,'teacher');
    /* o.tIn / o.lIn: that hand is still in the frame from the token before, and moves on from there (empty, it points; it pinches again
       just before it takes); o.stay: both hands stay for the next token */
    if(o.tIn){handTo(HT,o.t0,o.grab,gp,.12);HT.pose.set(Math.max(o.t0,o.grab-.3),'pinch');}else enter(HT,o.t0,o.grab,gp,'pinch',SHT);
    c.tr.set(o.grab,{x:src.x,y:src.y,s:sTk,l:0,o:1});take(c,HT,o.grab);c.tr.move(o.grab,o.grab+.25,{l:1});c.tr.move(o.grab+.25,o.atHO,{s:sBd});
    carryTo(c,HT,o.grab+.05,o.atHO,HO,.16);
    if(o.text)bubble(o.text,o.bub==null?o.atHO:o.bub,o.bubDur||2.2);
    const tk=o.take,hp=grip(c,cardPos(c,tk),sBd,'learner');
    if(o.lIn){handTo(HL,tk-(o.lin||.75),tk,hp,.1);HL.pose.set(tk-.3,'pinch');}else enter(HL,tk-Math.max(.9,o.lin||.9),tk,hp,'pinch',SHL);
    release(c,tk);take(c,HL,tk);if(!o.stay)leave(HT,tk+.08,tk+.8);else HT.pose.set(tk+.06,'point');
    carryTo(c,HL,tk+.05,o.place,dst);release(c,o.place);c.tr.move(o.place,o.place+.22,{l:0});c.where.set(o.place+.22,'bd');
    if(o.stay){HL.pose.set(o.place+.06,'point');return o.place+.3;}leave(HL,o.place+.3,o.place+1);return o.place+1;};

  /* ---- the scenes, one per narration line; each returns the time its animation needs ---- */
  const SC={};
  SC.intro=K=>{stackTo(K.t,K.t+1.6,k=>BOOK(k));
    const names=[['Choices','ch'],['Targets','tg'],['Board','bd'],['Tokens','tk']];let last=K.t+1.8;
    const after=K.text.toLowerCase().indexOf('tab');
    names.forEach(([w,k],j)=>{const t=Math.max(K.t+1.8+j*.3,K.at(w,.62+.1*j,after)-.15);const L=BOOK(k);glowAt(L,M.tab[k],5,t,1.6);
      tabLbl[k].tr.move(t,t+.3,{o:1,s:1,dx:0},0,easeOut);last=Math.max(last,t+1.6);});
    Object.values(tabLbl).forEach(fx=>fx.tr.move(last+.4,last+.8,{o:0}));
    const tb=Math.max(K.t+1.7,K.at('bound',.35)-.15);const L0=BOOK('ch');glowAt({x:L0.x,y:L0.y,s:L0.s},{x:-14,y:0,w:40,h:ph},4,tb,1.8);
    return last+.8-K.t;};
  SC.ch_show=K=>{glowAt(BOOK('ch'),M.tab.ch,5,K.t+.2,1.6);const ids=CH.map((c,i)=>c?i:-1).filter(i=>i>=0);
    ids.forEach((i,j)=>{CH[i].pops.ch=(CH[i].pops.ch||[]).concat(K.t+K.d*(.3+.55*j/Math.max(1,ids.length)));});return K.d;};
  /* the learner looks over two pictures (half-second moves, short stops; the second the one nearer the choice, so the last reach is
     short), then takes the one they chose, as "picks one" is said */
  SC.ch_pick=K=>{const L=BOOK('ch'),c=cC;const P0=at(L,ctr(M.ch[F.pick.ch]));
    const dist=i=>Math.hypot(M.ch[i].x-M.ch[F.pick.ch].x,M.ch[i].y-M.ch[F.pick.ch].y);const scan=[4,2,1,5].filter(i=>CH[i]&&i!==F.pick.ch).slice(0,2).sort((a,b)=>dist(b)-dist(a));const pts=scan.map(i=>pointAt(at(L,ctr(M.ch[i])),L.s));
    const land=Math.max(K.t+.9,K.at('looks over',.1)+.25);let tq=land;
    if(pts.length){enter(HL,K.t,land,pts[0],'point',SHL);for(let j=1;j<pts.length;j++){handTo(HL,tq+.3,tq+.8,pts[j]);tq+=.8;}}
    const gp=grip(c,P0,L.s,'learner'),tp=Math.max(tq+.3+.7,K.at('picks one',.3)+.2);
    if(pts.length){handTo(HL,tp-.7,tp-.05,gp,.12);HL.pose.set(tp-.7,'pinch');}else enter(HL,tp-1,tp-.05,gp,'pinch',SHL);
    c.tr.set(tp,{x:P0.x,y:P0.y,s:L.s,l:0,o:1});take(c,HL,tp);c.tr.move(tp,tp+.35,{l:1});
    carryTo(c,HL,tp+.4,tp+1.5,TL,.2);release(c,tp+1.5);c.tr.move(tp+1.5,tp+1.75,{l:0});
    leave(HL,tp+1.85,tp+2.6);return tp+2.7-K.t;};
  /* the Targets page; as the request is described, a note beside the page: the request, then what is given for it, every time */
  SC.tg_show=K=>{pageTurn('ch',K.t+.15,K.t+1.05);glowAt(BOOK('tg'),M.tab.tg,5,K.t+.9,1.6);
    const ids=TG.map((c,i)=>c?i:-1).filter(i=>i>=0);ids.forEach((i,j)=>{TG[i].pops.tg=(TG[i].pops.tg||[]).concat(K.t+1.2+(K.d*.6-1.2)*(.3+.55*j/Math.max(1,ids.length)));});
    const ta=Math.max(K.t+2.5,K.at('asking for something',.66)-.15);fcr.tr.move(ta,ta+.35,{o:1,s:1,dy:0},0,easeOut);
    const tb=Math.max(ta+1,K.at('still give',.83)-.15);fqa.tr.move(tb,tb+.35,{o:1,dy:0},0,easeOut);
    const te=Math.max(tb+.6,K.at('every time',.94)-.15);fqe.tr.move(te,te+.3,{h:1});
    return Math.max(K.d,te+.5-K.t);};
  /* the teacher picks the target; the target card, waiting beside the book, glows as the line says what counts and the same thing */
  SC.tg_pick=K=>{const L=BOOK('tg'),c=cT;const P0=at(L,ctr(M.tg[F.pick.tg]));fcr.tr.move(K.t,K.t+.35,{o:0});
    const other=[1,3,5,0].filter(i=>TG[i]&&i!==F.pick.tg)[0];const tp=Math.max(K.t+2.2,K.at('one target',.12)+.9);const gp=grip(c,P0,L.s,'teacher');
    if(other!=null){enter(HT,K.t,K.t+1.0,pointAt(at(L,ctr(M.tg[other])),L.s),'point',SHT);handTo(HT,tp-.75,tp-.05,gp,.12);HT.pose.set(tp-.75,'pinch');}
    else enter(HT,tp-1,tp-.05,gp,'pinch',SHT);
    c.tr.set(tp,{x:P0.x,y:P0.y,s:L.s,l:0,o:1});take(c,HT,tp);c.tr.move(tp,tp+.35,{l:1});
    carryTo(c,HT,tp+.4,tp+1.4,TR,.2);release(c,tp+1.4);c.tr.move(tp+1.4,tp+1.65,{l:0});leave(HT,tp+1.75,tp+2.5);
    const cw=CW*L.s,rT={x:TR.x-cw/2,y:TR.y-cw/2,w:cw,h:cw},O={x:0,y:0,s:1};
    const g1=Math.max(tp+1.7,K.at('exactly what counts',.5)-.15);glowAt(O,rT,6,g1,1.6);
    const g2=Math.max(g1+1.9,K.at('the same thing',.9)-.15);glowAt(O,rT,6,g2,1.5);
    return Math.max(tp+2.6,g2+1.5)-K.t;};
  SC.bd_place=K=>{pageTurn('tg',K.t+.15,K.t+1.05);const L=BOOK('bd');glowAt(L,M.tab.bd,5,K.t+.9,1.4);
    const t1=Math.max(K.t+1.9,K.at('target under first',.2)+.2);
    enter(HT,t1-.9,t1,grip(cT,TR,L.s,'teacher'),'pinch',SHT);take(cT,HT,t1);cT.tr.move(t1,t1+.3,{l:1});
    const dF=at(L,ctr(M.first));carryTo(cT,HT,t1+.3,t1+1.3,dF);release(cT,t1+1.3);cT.tr.move(t1+1.3,t1+1.55,{l:0});cT.where.set(t1+1.55,'bd');leave(HT,t1+1.65,t1+2.4);
    const t2=Math.max(t1+1.5,K.at('chosen item',.42)+.1);
    enter(HL,t2-.9,t2,grip(cC,TL,L.s,'learner'),'pinch',SHL);take(cC,HL,t2);cC.tr.move(t2,t2+.3,{l:1});
    const dT=at(L,ctr(M.then));carryTo(cC,HL,t2+.3,t2+1.3,dT);release(cC,t2+1.3);cC.tr.move(t2+1.3,t2+1.55,{l:0});cC.where.set(t2+1.55,'bd');leave(HL,t2+1.65,t2+2.4);
    const g1=Math.max(t2+1.6,K.at('first the target',.8)-.15),g2=Math.max(g1+.7,K.at('then the item',.9)-.15);glowAt(L,M.first,6,g1,1.5);glowAt(L,M.then,6,g2,1.5);
    return Math.max(t2+2.5,g2+1.5)-K.t;};
  SC.tk_page=K=>{toSession(K.t+.15,1.4);const t1=Math.max(K.t+1.7,K.at('where the tokens wait',.4)-.1);
    TK.forEach((c,i)=>{c.pops.tk=[t1+i*.18];});const t2=Math.max(t1+.4+n*.18,K.at('empty slots',.62)-.15);
    const sp=Math.min(.2,1.2/n);M.slot.forEach((r,i)=>glowAt(BDS,r,4,t2+i*sp,1.3));
    /* "how many are left to earn": the whole strip of empty slots at once */
    const U=M.slot.reduce((u,r)=>({x:Math.min(u.x,r.x),y:Math.min(u.y,r.y),r:Math.max(u.r,r.x+r.w),b:Math.max(u.b,r.y+r.h)}),{x:1e9,y:1e9,r:-1e9,b:-1e9});
    const tl=Math.max(t2+n*sp+.8,K.at('how many are left',.55)-.15);glowAt(BDS,{x:U.x,y:U.y,w:U.r-U.x,h:U.b-U.y},7,tl,1.7);
    const t3=Math.max(tl+1.2,K.at('valuable first',.8)-.15);TK.forEach((c,i)=>{c.pops.tk.push(t3+i*.06);});
    return Math.max(K.d,t3+n*.06+.7-K.t);};
  /* the rule: what earns a token (how many times, or how long), then the example filled in */
  SC.rule=K=>{let t=K.t;if(!session){toSession(t+.1,1.4);t+=1.4;}
    const tc=Math.max(t+.3,K.at('decide how much',.2)-.1);chip.tr.move(tc,tc+.4,{o:1,s:1},0,easeOut);
    const ti=Math.max(tc+.5,K.at('how many times',.45)-.15),tl=Math.max(ti+.5,K.at('how long',.52)-.15);
    ricN.tr.move(ti,ti+.35,{o:1,s:1,dy:0},0,easeOut);ricL.tr.move(tl,tl+.35,{o:1,s:1,dy:0},0,easeOut);
    const tk=Math.max(tl+.8,K.at('keep it small',.6)-.15);glowAt(BDS,M.slot[0],4,tk,1.6);
    const tf=Math.max(tk+.6,K.at('this example',.8)-.15);chip0.tr.move(tf,tf+.3,{o:0});chip1.tr.move(tf+.1,tf+.45,{o:1});chip.tr.move(tf,tf+.2,{s:1.06});chip.tr.move(tf+.2,tf+.45,{s:1});
    ricN.tr.move(tf,tf+.4,{o:0,s:.8});glowAt({x:0,y:0,s:1},{x:RC.x+10,y:104,w:172,h:96},4,tf,1.3);ricL.tr.move(tf+1.2,tf+1.6,{o:0,s:.8});
    return tf+1.7-K.t;};
  /* the session starts: the ring shows 2:00; the teacher points to the board and names both pictures; the ring counts down */
  SC.start=K=>{ringEl.tr.move(K.t+.15,K.t+.6,{o:1,s:1},0,easeOut);
    const pF=pointAt(at(BDS,ctr(M.first)),sBd),pT=pointAt(at(BDS,ctr(M.then)),sBd);
    const tp0=Math.max(K.t+1,K.at('point to the board',.25)+.25);enter(HT,tp0-.9,tp0,pF,'point',SHT);
    const tp1=Math.max(tp0,K.at('first the target',.42)),tp2=Math.max(tp1+.9,K.at('then the item',.52));
    handTo(HT,tp2-.5,tp2,pT,.12);leave(HT,tp2+.7,tp2+1.45);
    glowAt(BDS,M.first,6,tp1-.15,1.3);glowAt(BDS,M.then,6,tp2-.15,1.3);
    const tr0=Math.max(tp2+.3,K.at('the ring',.62));ringPending=tr0;const ts=Math.max(tr0+.5,K.at('sped up',.85)-.15);ringEl.tr.move(ts,ts+.2,{s:1.06});ringEl.tr.move(ts+.2,ts+.45,{s:1});
    return tr0+1.2-K.t;};
  /* the first token comes as the interval ends (the reach starts just before), not when the line gets to it; the ring keeps its ✓ until
     the token is in its slot; the praise is shown again with the behavior's name marked as the line says so; the slot glows as it is named */
  SC.tok_first=K=>{const tEnd=K.t+.6,grab=tEnd+.45,atHO=grab+.8,tk=atHO+.9,place=tk+.95;
    ringInt(ringPending==null?K.t-3:ringPending,tEnd,true,{hold:place+.3});ringPending=null;
    deliver(0,{t0:tEnd-.4,grab,atHO,text:PR.first,bub:atHO,bubDur:2.4,take:tk,place,lin:.9});
    const tb=Math.max(atHO+2.5,K.at('brief praise',.5)-.15);bubble(PR.first,tb,2.8,true);
    const ts=Math.max(tb+.5,K.at('put it in the next slot',.85)-.15);glowAt(BDS,M.slot[0],5,ts,1.8);
    return Math.max(place+1,ts+1.8)-K.t;};
  /* the behavior stops part way: the ring stops and turns grey, no token; the reminder comes at once; the earned token stays (it glows);
     the interval starts over when the learner begins again */
  SC.tok_none=K=>{const ts=Math.max(K.t+1.4,K.at('stops',.12)+.35),tn=Math.max(ts+4,K.at('start the interval over',.8)-.1);
    ringInt(K.t+.2,ts,false,{f:.4,hold:tn});noTok.tr.move(ts,ts+.3,{o:1,s:1},0,easeOut);
    const pF=pointAt(at(BDS,ctr(M.first)),sBd);enter(HT,ts-.5,ts+.45,pF,'point',SHT);glowAt(BDS,M.first,6,ts+.3,1.4);
    const te=Math.max(ts+.6,K.at('earned tokens',.5)-.15);glowAt(BDS,M.slot[0],5,te,1.6);
    const tr=Math.max(te+.8,K.at('remind your learner',.62)-.15);glowAt(BDS,M.first,6,tr,1.4);handTo(HT,tr,tr+.18,{x:pF.x,y:pF.y+12},0);handTo(HT,tr+.18,tr+.4,pF,0);
    leave(HT,tn-.3,tn+.5);noTok.tr.move(tn-.5,tn-.1,{o:0});ringPending=tn;
    return Math.max(K.d,tn+.6-K.t);};
  SC.tok_more=K=>{const idx=[];for(let i=1;i<n-1;i++)idx.push(i);if(!idx.length)return K.d;
    const want=(K.d+.4)/idx.length;let T=K.t+.25,end=K.t;
    if(want>=2.4){const cy=Math.min(4,want),ri=cy-1.4;   /* a few tokens: each one in full, the hands come in and go */
      idx.forEach((i,j)=>{ringInt(j===0&&ringPending!=null&&ringPending<T?ringPending:T,T+ri,true);const D=T+ri;end=deliver(i,{t0:D-.4,grab:D+.5,atHO:D+1.1,text:PR.more[j%PR.more.length],bubDur:1.7,take:D+1.3,place:D+2.05,lin:.9});T+=cy;});}
    else{const cy=Math.max(1.75,want),ri=cy-.5;   /* a big board: the intervals follow one another and both hands stay in the frame from token to token */
      idx.forEach((i,j)=>{const last=j===idx.length-1;ringInt(j===0&&ringPending!=null&&ringPending<T?ringPending:T,T+ri,true);const D=T+ri;
        end=deliver(i,{t0:D-.05,grab:D+.45,atHO:D+.95,text:PR.more[j%PR.more.length],bubDur:Math.min(1.6,cy-.1),take:D+1.2,place:D+1.95,lin:.75,tIn:j>0,lIn:j>0,stay:!last});T+=cy;});}
    ringPending=null;
    return end-K.t+.1;};
  /* the last token: given at once; the terminal token goes straight into its slot, and sits there, its round slot glowing, while the line
     says why it looks different; the full board glows as it is named */
  SC.tok_last=K=>{const i=n-1,T=K.t+.2,ri=2.2,D=T+ri,tk=F.term?D+2.2:D+1.6,place=tk+.9;
    ringInt(ringPending!=null&&ringPending<T?ringPending:T,D,true,{hold:place+.3});ringPending=null;
    const end=deliver(i,{t0:D-.4,grab:D+.5,atHO:D+1.2,text:PR.last,bub:D+1.25,bubDur:2.6,take:tk,place,lin:.9});let fin=end;
    if(F.term){TK[i].glowT=[D+.6,place];const ta=Math.max(place,K.at('looks different',.3)-.15);glowAt(BDS,M.slot[i],8,place,Math.max(4.5,ta+3.2-place),true);
      const tf=Math.max(place+4.6,K.at('board is finished',.6)-.15);M.slot.forEach((r,j)=>glowAt(BDS,r,4,tf+j*.08,1.4));fin=Math.max(fin,tf+1.5);}
    else{const tf=Math.max(place+.3,K.at('board is full',.6)-.15);M.slot.forEach((r,j)=>glowAt(BDS,r,4,tf+j*.08,1.4));fin=Math.max(fin,tf+1.5);}
    ringEl.tr.move(end+.2,end+.7,{o:0,s:.9});return Math.max(end+.8,fin)-K.t;};
  /* the exchange: the teacher's hand gathers the tokens off the board and takes them back to the Tokens page (the trade); the Then card
     lifts and grows into the item; the teacher holds it by its right edge, the learner takes it by its left edge and keeps it for the time agreed */
  const GI_T=[.48,-.12],GI_L=[-.48,.12];
  SC.exchange=K=>{const t=K.t;chip.tr.move(t,t+.5,{o:0});
    const tg=Math.max(t+1.1,K.at('trade the tokens',.15)+.15),s0p=at(BDS,ctr(M.slot[0]));
    const g0=grip(TK[0],s0p,sBd,'teacher');enter(HT,tg-.9,tg,g0,'pinch',SHT);
    TK.forEach((c,i)=>{const sp=at(BDS,ctr(M.slot[i]));c.tr.set(tg-.3,{x:sp.x,y:sp.y,s:sBd,l:0,o:1});c.where.set(tg-.3,'fly');
      c.tr.move(tg-.2+i*.03,tg+.45+i*.03,{x:s0p.x+i*2.5,y:s0p.y-i*3,l:.4},.05);});
    const tgT=tg+.5+n*.03;TK.forEach(c=>take(c,HT,tgT));TK.forEach(c=>c.tr.move(tgT,tgT+1.25,{s:sTk,l:.8}));
    const tc=at(TKS,{x:pw/2,y:PG.tk.h*.45});carryTo(TK[0],HT,tgT+.05,tgT+1.25,tc,.16);
    TK.forEach((c,i)=>{const dp=at(TKS,ctr(M.ybx[i])),tr=tgT+1.25+i*.04;release(c,tr);c.tr.move(tr,tr+.45,{x:dp.x,y:dp.y,l:0},.1);c.where.set(tr+.47,'tk');});
    HT.pose.set(tgT+1.3,'point');leave(HT,tgT+1.4,tgT+2.1);
    const c=cC,P0=at(BDS,ctr(M.then)),CEN={x:640,y:292},big=sBd*1.5,tt=Math.max(tgT+1.45,K.at('then item',.4)-.1);
    veil.tr.move(tt-.2,tt+.4,{o:.32});
    c.tr.set(tt,{x:P0.x,y:P0.y,s:sBd,l:0,o:1});c.where.set(tt,'fly');c.tr.move(tt,tt+.35,{l:1});c.tr.move(tt+.35,tt+1.3,{x:CEN.x,y:CEN.y,s:big},.1);
    const is=big*CW/IW;item.tr.set(tt+1.15,{x:CEN.x,y:CEN.y,s:is,l:1,o:0});item.where.set(tt+1.15,'fly');item.tr.move(tt+1.15,tt+1.75,{o:1});c.tr.move(tt+1.15,tt+1.75,{o:0});c.where.set(tt+1.8,'none');
    const tgv=Math.max(tt+1.9,K.at('your learner gets',.62)-.3),HOFF={x:560,y:330},si=.75;
    enter(HT,tgv-.9,tgv,grip(item,CEN,is,'teacher',GI_T),'pinch',SHT);take(item,HT,tgv);item.tr.move(tgv,tgv+1.1,{s:si});carryTo(item,HT,tgv+.1,tgv+1.1,HOFF,.1);
    const tl=tgv+1.15;enter(HL,tl-.95,tl,grip(item,HOFF,si,'learner',GI_L),'pinch',SHL);release(item,tl);take(item,HL,tl);HT.pose.set(tl+.05,'point');leave(HT,tl+.15,tl+.9);
    const tw=Math.max(tl+1.1,K.at('for the time',.6)+.2);leave(HL,tw,tw+1.1);release(item,tw+1.12);item.where.set(tw+1.12,'none');
    return Math.max(K.d,tw+1.2-K.t);};
  /* the reset: the item comes back in the teacher's hand and, as it is put away, turns back into its card; the same hand picks the
     target card up off First as well, holds the two over the book while the Targets page turns back, puts the target card on its box,
     then holds the chosen card while the Choices page turns back and puts it on its box (short, unhurried moves); the learner then
     looks over the choices again */
  SC.reset=K=>{const r=K.t;veil.tr.move(r+.1,r+.7,{o:0});toBook(r+.1,1.1);
    const QI={x:820,y:300},si=.75,ti=r+1.25,gI=grip(item,QI,si,'teacher',GI_T);
    const st=enter(HT,ti-1,ti,gI,'pinch',SHT),h0=HT.tr.at(st);item.tr.set(st,{x:h0.x+QI.x-gI.x,y:h0.y+QI.y-gI.y,s:si,l:1,o:1});item.where.set(st,'fly');take(item,HT,st);
    const ts=Math.max(ti+.35,K.at('put it away',.3)-.2),sc=sBk*CW/IW;item.tr.move(ts,ts+.5,{s:sc});
    const pI={x:QI.x+(gI.x-QI.x)*(1-sc/si),y:QI.y+(gI.y-QI.y)*(1-sc/si)};   /* where the shrinking item's centre ends up (it keeps its point under the fingers) */
    cC.tr.set(ts+.4,{x:pI.x,y:pI.y,s:sBk,l:1,o:0});cC.where.set(ts+.4,'fly');take(cC,HT,ts+.4);cC.tr.move(ts+.4,ts+.6,{o:1});item.tr.move(ts+.4,ts+.6,{o:0});release(item,ts+.62);item.where.set(ts+.62,'none');
    /* the chosen card stays in the hand, a little below the target card the hand picks up next (both held by their right edges) */
    const fB=at(BOOK('bd'),ctr(M.first)),tA=Math.max(ts+.7,K.at('return the pictures',.38)-.75),tB=tA+.65;handTo(HT,tA,tB,grip(cT,fB,sBk,'teacher'),.1);
    cT.tr.set(tB,{x:fB.x,y:fB.y,s:sBk,l:0,o:1});take(cT,HT,tB+.05);cT.tr.move(tB+.05,tB+.25,{l:1});
    const t1=tB+.12;handTo(HT,t1,t1+.6,{x:860,y:300},.08);pageTurn('tg',t1+.05,t1+.75,true);
    const pT=at(BOOK('tg'),ctr(M.tg[F.pick.tg])),t2=t1+.8;carryTo(cT,HT,t2,t2+.7,pT,.12);release(cT,t2+.7);cT.tr.move(t2+.7,t2+.85,{l:0});cT.where.set(t2+.88,'tg');
    const t3=t2+.8;handTo(HT,t3,t3+.6,{x:820,y:300},.08);pageTurn('ch',t3+.05,t3+.75,true);
    const pC=at(BOOK('ch'),ctr(M.ch[F.pick.ch])),t4=t3+.8;carryTo(cC,HT,t4,t4+.7,pC,.12);release(cC,t4+.7);cC.tr.move(t4+.7,t4+.85,{l:0});cC.where.set(t4+.88,'ch');
    leave(HT,t4+.8,t4+1.5);let t=t4+.85;
    /* the learner looks over the choices again, coming in as the teacher's hand is nearly out of the frame (so the arms do not cross) */
    const L=BOOK('ch'),pts=[2,4].filter(i=>CH[i]&&i!==F.pick.ch).concat([F.pick.ch]).slice(0,2).map(i=>pointAt(at(L,ctr(M.ch[i])),L.s));
    if(pts.length){const tl=Math.max(t+1.2,K.at('chooses again',.6)-.2);enter(HL,tl-.9,tl,pts[0],'point',SHL);t=tl;for(let j=1;j<pts.length;j++){handTo(HL,t+.3,t+.8,pts[j]);t+=.8;}t+=.3;leave(HL,t,t+.8);t+=.8;}
    return Math.max(K.d,t-K.t);};
  /* the tips: each tip is lit while it is read; the first is shown under the book, a token given and traded for the item at once, twice */
  SC.tips=K=>{const t=K.t;stackTo(t,t+1,k=>BOOK(k,.52,40,170));tipsCard.tr.move(t+.5,t+1,{o:1,dy:0},0,easeOut);
    const fr=[['valuable',.06],['start with a small',.42],['keep the item',.8]];const ts=fr.map((f,i)=>Math.max(t+.9+i*.4,K.at(f[0],f[1])-.3));
    tipRows.forEach((fx,i)=>{const a=ts[i],b=i<2?ts[i+1]:t+K.d;fx.tr.move(a,a+.45,{o:1,dy:0,h:1},0,easeOut);fx.tr.move(b-.1,b+.3,{h:0});});
    pair.tr.move(ts[0]+.1,ts[0]+.5,{o:1});
    const trade=a=>{pTok.tr.set(a,{o:0,s:.6,dx:0});pTok.tr.move(a,a+.3,{o:1,s:1},0,easeOut);pTok.tr.move(a+.9,a+1.5,{dx:PDX,s:.5},.0);pTok.tr.move(a+1.35,a+1.5,{o:0});
      pItem.tr.move(a+1.45,a+1.7,{s:1.18});pItem.tr.move(a+1.7,a+2,{s:1});};
    const sp=Math.max(2.3,Math.min(3,(ts[1]-ts[0]-.8)/2));trade(ts[0]+.6);trade(ts[0]+.6+sp);
    /* once tip one is done, the demo goes (left on the table it would read as nothing traded for the item) */
    const po=Math.max(ts[1]-.1,ts[0]+.6+sp+2.1);pair.tr.move(po,po+.4,{o:0});
    /* tip two: the token on the first, small step; it climbs a step at a time as the requirement is raised slowly, wobbles as the
       behavior falls apart, and goes back a step */
    const s0=po+.3;stairs.tr.move(s0,s0+.4,{o:1});
    const tsm=Math.max(s0+.5,K.at('small requirement',.55)-.15);stTok.tr.move(tsm,tsm+.25,{s:.84});stTok.tr.move(tsm+.25,tsm+.55,{s:.7});
    const hop=(i,a)=>{stTok.tr.move(a,a+.24,{dx:STX*(i-.5),dy:-STY*i-14},0,easeOut);stTok.tr.move(a+.24,a+.48,{dx:STX*i,dy:-STY*i},0,easeIn);};
    const tr=Math.max(tsm+.8,K.at('raise them slowly',.66)-.15);hop(1,tr);hop(2,tr+.75);hop(3,tr+1.5);
    const tf=Math.max(tr+2.1,K.at('falls apart',.77)-.1);for(let j=0;j<6;j++)stTok.tr.move(tf+j*.1,tf+(j+1)*.1,{dx:STX*3+(j%2?-6:6)});stTok.tr.move(tf+.6,tf+.7,{dx:STX*3});
    const tb=Math.max(tf+.8,K.at('go back a step',.82)-.15);stTok.tr.move(tb,tb+.5,{dx:STX*2,dy:-STY*2});stBack.tr.move(tb,tb+.35,{o:1,dy:0},0,easeOut);
    stairs.tr.move(ts[2]+.25,ts[2]+.6,{o:0});
    /* tip three: the item, locked away except through the board */
    lock.tr.move(ts[2]+.45,ts[2]+.85,{o:1});
    return Math.max(K.d,2.5);};
  /* the end: the book closes, the cycle is named step by step (each arrow comes with the step after it), and the Choices page turns
     over to show its back as the backs are mentioned */
  SC.outro=K=>{const t=K.t,sO=Math.min(.7,430/maxH);tipsCard.tr.move(t,t+.5,{o:0,dy:10});lock.tr.move(t,t+.4,{o:0});stackTo(t+.2,t+1.4,k=>BOOK(k,sO,null,24));cyc.tr.move(t+.6,t+.9,{o:1});
    const after=K.text.toLowerCase().indexOf('cycle');const w=[['choose',.3],['set the target',.42],['earn',.55],['exchange',.68]];let last=t+1;
    cycItems.forEach((fx,i)=>{const tt=Math.max(t+1+i*.35,K.at(w[i][0],w[i][1],after)-.15);fx.tr.move(tt,tt+.4,{o:1,s:1,dy:0},0,easeOut);if(cycArr[i])cycArr[i].tr.move(tt-.05,tt+.3,{o:1,dx:0},0,easeOut);last=tt;});
    /* the steps the next sentence refers to: the target (more often), the item (Choose) and the requirement (Earn the tokens) */
    const bmp=(fx,ta)=>{fx.tr.move(ta,ta+.25,{s:1.14});fx.tr.move(ta+.25,ta+.6,{s:1});};
    const tm=Math.max(last+.8,K.at('more often',.45)-.15),ti=Math.max(tm+.7,K.at('change the item',.6)-.1),tq=Math.max(ti+.7,K.at('the requirement',.7)-.1);
    bmp(cycItems[1],tm);bmp(cycItems[0],ti);bmp(cycItems[2],tq);
    const tb=Math.max(tq+.8,K.at('the back of each page',.86)-.1),B0=BOOK('ch',sO,null,24);
    PG.chb.tr.set(tb,{x:B0.x,y:B0.y,s:B0.s,ry:0,o:0,fx:0});PG.ch.tr.move(tb,tb+.35,{fx:0},0,easeIn);PG.ch.tr.set(tb+.35,{o:0});PG.chb.tr.set(tb+.35,{o:1});PG.chb.tr.move(tb+.35,tb+.75,{fx:1},0,easeOut);
    return Math.max(K.d,tb+2.4-K.t);};

  /* ---- (v21.49) the bus ride: the Board on the left, the route top right (a road from the start to the stop, the checkpoints
     on it where they fall in the ride, the bus moving along it), the Tokens page under it and the timer beside that ---- */
  if(BUSM){const FB_=F.bus,R=FB_.R,NCP=FB_.each?FB_.n:n,NR=FB_.k,cps=FB_.cps;
    const sBig=Math.min(.86,560/PG.bd.h,1200/pw),BIG={x:(SW-pw*sBig)/2,y:22,s:sBig},CHS={x:SW-24-pw*.44,y:40,s:.44};
    Object.keys(PG).forEach(k=>{PG[k].tr=new Track({x:BIG.x,y:BIG.y,s:BIG.s,ry:0,o:k==='bd'?1:0,fx:1});});
    PG.tk.tr=new Track({x:TKS.x,y:TKS.y,s:TKS.s,ry:0,o:0,fx:1});PG.ch.tr=new Track({x:CHS.x,y:CHS.y,s:CHS.s,ry:0,o:0,fx:1});
    /* the slot that checkpoint j fills in row r (one row, or a row for each rule) */
    ring.secs=Math.round(FB_.gap);   /* between checkpoints the ring shows the next one's time */
    const slotOf=(j,r)=>FB_.each?(r||0)*FB_.n+j:j;
    const RSTR=s=>esc(s);
    /* the small route (the ride) and the big one (fading the timer) */
    const routeCard=(box,title)=>{const k=(box.w-24)/770,svgH=190*k;const fx=mkFx('wk-route','<div class="wk-rh">'+title+'</div><svg viewBox="0 0 770 190" width="'+f2(box.w-24)+'" height="'+f2(svgH)+'" style="position:absolute;left:12px;top:48px" aria-hidden="true">'+busRouteBase()+'</svg>',box,{o:0});
      const X=vx=>box.x+12+vx*k,Y=vy=>box.y+48+vy*k;return{fx,k,at:f=>{const vx=BUS_X0+(BUS_X1-BUS_X0)*clamp(f,0,1);return{x:X(vx),y:Y(busRoadY(vx))};},end:f=>{const vx=f?BUS_X1+34:BUS_X0-34;return{x:X(vx),y:Y(busRoadY(f?BUS_X1:BUS_X0)-6)};}};};
    const head='<b>'+RSTR(FB_.from)+'</b> &rarr; <b>'+RSTR(FB_.to)+'</b> &middot; about '+R+' minutes';
    const RT=routeCard({x:548,y:24,w:712,h:262},head),RB=routeCard({x:150,y:40,w:980,h:330},head);
    const clockSvg=sz=>'<svg viewBox="-12 -12 24 24" width="'+sz+'" height="'+sz+'" aria-hidden="true">'+busIcon('clock',0,0,1.15)+'</svg>';
    const pinSvg=sz=>'<svg viewBox="-12 -24 24 26" width="'+sz+'" height="'+f2(sz*26/24)+'" aria-hidden="true">'+busIcon('pin',0,0,1.05)+'</svg>';
    const mkMark=(RTx,f,html,lab,w)=>{const p=RTx.at(f);return mkFx('wk-cpm',html+(lab?'<span>'+RSTR(lab)+'</span>':''),{x:p.x-(w||70)/2,y:p.y-15,w:w||70},{s:.6});};
    /* the ride's checkpoints on the small route: the clock, its time, and over it the token it earns (empty, then earned) */
    const SM=cps.slice(0,16).map((c,i)=>{const f=c.t/R,p=RT.at(f);const mk=mkMark(RT,f,clockSvg(26),busClock(c.t),74);
      const b0=mkFx('wk-cpb','<b>'+(FB_.fixed&&cps.length>FB_.n?i%FB_.n+1:i+1)+'</b>',{x:p.x-14,y:p.y-56,w:28,h:28},{s:.6}),b1=mkFx('wk-cpb on','<b>&#10003;</b>',{x:p.x-14,y:p.y-56,w:28,h:28},{s:.6});return{f,p,mk,b0,b1};});
    const p0=RT.at(0);const busFx=mkFx('wk-busi','<svg viewBox="-30 -26 60 30" width="70" height="35" aria-hidden="true">'+busIcon('bus',0,0,1)+'</svg>',{x:p0.x-35,y:p0.y-33,w:70,h:35},{o:0});
    let busF=0;const driveTo=(t0,t1,f1)=>{const f0=busF,st=Math.max(2,Math.ceil((t1-t0)/.2));
      for(let j=1;j<=st;j++){const f=f0+(f1-f0)*ease(j/st),p=RT.at(f);busFx.tr.move(t0+(t1-t0)*(j-1)/st,t0+(t1-t0)*j/st,{dx:p.x-p0.x,dy:p.y-p0.y},0,u=>u);}busF=f1;};
    /* the big route: the timer's checkpoints, then the landmarks (a picture over the pin when the landmark has one) */
    const BT=cps.slice(0,16).map(c=>mkMark(RB,c.t/R,clockSvg(30),busClock(c.t),80));
    const BL=FB_.land.map(c=>{const f=c.t/R,p=RB.at(f),pc=c.lm&&has(c.lm)?pic(c.lm,''):'';
      const e=mkFx('wk-lm',(pc?'<div class="wk-lmp">'+pc+'</div>':'')+pinSvg(30)+'<span>'+RSTR(c.lab)+'</span><i>about '+busClock(c.t)+'</i>',{x:p.x-60,y:p.y-(pc?96:30),w:120},{s:.6,dy:10});
      return{c,e,keep:FB_.fewer.some(x=>x.t===c.t&&x.lab===c.lab)};});
    const steps=mkFx('wk-steps','',{x:150,y:390,w:980});
    const stepEls=['Timer','Landmarks','Fewer landmarks','Just the stop'].map((w,i)=>{if(i){const a=div('wk-cya','&rarr;');steps.el.appendChild(a);}const e=div('wk-cy','<b>'+(i+1)+'</b>'+esc(w));steps.el.appendChild(e);return sub(e,{o:.45,s:.9,h:0});});
    const backFx=mkFx('wk-note2','&larr; back a step',{x:640,y:470,w:220},{dy:8});
    const stopGlow=()=>{const e=RB.end(1),k=RB.k;return{x:e.x-34*k,y:e.y-50*k,w:68*k,h:66*k};};
    /* the "what if" note at a checkpoint (the ride itself goes on with every rule followed) */
    const ifNote=(x,y,html,w)=>mkFx('wk-if',html,{x:clamp(x-(w||300)/2,10,SW-(w||300)-10),y,w:w||300},{s:.85,dy:8});
    /* the plan page, shown at 60 % */
    const PLS=.82,PX0=640-408*PLS,PY0=16,plan=mkFx('wk-planpg',FB_.planHtml,{x:640-408,y:PY0+528*PLS-528,w:816,h:1056},{s:PLS*.92});
    const planPart=sel=>{const e=plan.el.querySelector(sel),pg=plan.el.querySelector('.pg');if(!e||!pg)return null;const r=e.getBoundingClientRect(),q=pg.getBoundingClientRect(),kk=q.width/816||1;
      return{x:PX0+(r.left-q.left)/kk*PLS,y:PY0+(r.top-q.top)/kk*PLS,w:r.width/kk*PLS,h:r.height/kk*PLS};};
    busFitPlan(plan.el);   /* fitted as the printed page is (on an iPad its type can need the room), then measured */
    const PP={route:planPart('.bp-route'),when:planPart('.bp-cols'),say:planPart('.bp-ol'),log:planPart('.bp-log')};
    const O={x:0,y:0,s:1};
    const rulesAll=M.rules.length?M.rules:[M.first];
    const praise=j=>FB_.each?praiseFor(FB_.rules[0]||'').first:['Great job on the bus!','Nice riding!','Way to follow the rules!','Super bus rider!','Good job, keep going!','Great riding!'][j%6];
    const markEarned=(i,t)=>{const m=SM[i];if(!m)return;m.b0.tr.move(t,t+.25,{o:0});m.b1.tr.move(t,t+.3,{o:1,s:1},0,easeOut);m.mk.tr.move(t,t+.2,{s:1.15});m.mk.tr.move(t+.2,t+.45,{s:1});};
    /* a token straight from the Tokens page into its slot (no hands: the later checkpoints of the ride) */
    const flyTok=(i,t0,dur)=>{const c=TK[i];if(!c)return t0;const src=at(TKS,ctr(M.ybx[i]||M.ybx[0])),dst=at(BDS,ctr(M.slot[i]));c.tr.set(t0,{x:src.x,y:src.y,s:sTk,l:0,o:1});c.where.set(t0,'fly');
      c.tr.move(t0,t0+.25,{l:1});c.tr.move(t0+.05,t0+dur,{x:dst.x,y:dst.y,s:sBd},.2);c.tr.move(t0+dur,t0+dur+.2,{l:0});c.where.set(t0+dur+.2,'bd');return t0+dur+.2;};
    /* checkpoint j: the ring runs out as the bus reaches it, its token badge turns, the tokens of that checkpoint go on the board */
    const ringTo=(t0,t1,j)=>{ringInt(t0,t1,true,{hold:t1+.9,secs:Math.round(((cps[j]?cps[j].t:R)-(j?cps[j-1].t:0))*60)});driveTo(t0,t1,SM[j]?SM[j].f:busF);};
    SC.b_intro=K=>{glowAt(BIG,M.ttl,6,Math.max(K.t+.8,K.at('token board',.2)-.15),1.8);const tb=Math.max(K.t+2.4,K.at('bus staff',.7)-.15);glowAt(BIG,{x:M.slot[0].x,y:M.slot[0].y,w:M.slot[M.slot.length-1].x+M.slot[M.slot.length-1].w-M.slot[0].x,h:M.slot[M.slot.length-1].y+M.slot[M.slot.length-1].h-M.slot[0].y},6,tb,1.8);return K.d;};
    SC.b_rules=K=>{const t0=Math.max(K.t+.3,K.at('bus rules',.15)-.15),ph=['staying in the seat','quiet voice','hands to self'];
      rulesAll.forEach((r,j)=>{const t=Math.max(t0+.6+j*.9,j<3?K.at(ph[j],.4+.12*j)-.15:t0+.6+j*.9);glowAt(BIG,r,6,t,1.5);});
      const tp=Math.max(t0+3,K.at('each with a picture',.85)-.15);rulesAll.forEach((r,j)=>glowAt(BIG,r,4,tp+j*.1,1.3));return Math.max(K.d,tp+1.6-K.t);};
    SC.b_item=K=>{const t=K.t;PG.bd.tr.move(t+.1,t+1.2,BDS);PG.ch.tr.move(t+.5,t+1.1,{o:1});
      const L=CHS,c=cC,P0=at(L,ctr(M.ch[F.pick.ch]));const others=[4,2,1,5].filter(i=>CH[i]&&i!==F.pick.ch).slice(0,2).map(i=>pointAt(at(L,ctr(M.ch[i])),L.s));
      const land=Math.max(t+1.6,K.at('picks something',.2)-.2);let tq=land;if(others.length){enter(HL,t+.8,land,others[0],'point',SHL);if(others[1]){handTo(HL,tq+.3,tq+.8,others[1]);tq+=.8;}}
      const gp=grip(c,P0,L.s,'learner'),tp=Math.max(tq+.9,K.at('to work for',.42)+.1);if(others.length){handTo(HL,tp-.7,tp-.05,gp,.12);HL.pose.set(tp-.7,'pinch');}else enter(HL,tp-1,tp-.05,gp,'pinch',SHL);
      c.tr.set(tp,{x:P0.x,y:P0.y,s:L.s,l:0,o:1});take(c,HL,tp);c.tr.move(tp,tp+.35,{l:1});
      const dE=at(BDS,ctr(M.then)),ti=Math.max(tp+.6,K.at('earn box',.55)-.6);c.tr.move(tp+.4,ti+1,{s:BDS.s*CWE/CW});carryTo(c,HL,ti,ti+1,dE,.2);release(c,ti+1);c.tr.move(ti+1,ti+1.25,{l:0});c.where.set(ti+1.25,'bd');leave(HL,ti+1.35,ti+2.1);
      glowAt(BDS,M.then,6,ti+1.3,1.6);PG.ch.tr.move(ti+1.6,ti+2.2,{o:0});const tg=Math.max(ti+2,K.at('in sight',.85)-.15);glowAt(BDS,M.then,6,tg,1.4);return Math.max(K.d,tg+1.5-K.t);};
    SC.b_route=K=>{const t=K.t;RT.fx.tr.move(t+.2,t+.8,{o:1});PG.tk.tr.move(t+.4,t+1,{o:1});busFx.tr.move(t+.6,t+1,{o:1});
      const e0=RT.end(0),e1=RT.end(1),k=RT.k,gb=e=>({x:e.x-34*k,y:e.y-50*k,w:68*k,h:66*k});
      const ts=Math.max(t+1,K.at('start of the ride',.45)-.15),tt=Math.max(ts+.6,K.at('to the stop',.55)-.15);glowAt(O,gb(e0),6,ts,1.4);glowAt(O,gb(e1),6,tt,1.4);
      const tl=Math.max(tt+.6,K.at('usual length',.7)-.15);glowAt(O,{x:RT.fx.el.offsetLeft+8,y:RT.fx.el.offsetTop+6,w:RT.fx.el.offsetWidth-16,h:40},4,tl,1.6);return K.d;};
    const popMarks=(K,t0,t1)=>{SM.forEach((m,i)=>{const t=t0+(t1-t0)*i/Math.max(1,SM.length-1);m.mk.tr.move(t,t+.35,{o:1,s:1},0,easeOut);m.b0.tr.move(t+.1,t+.4,{o:1,s:1},0,easeOut);});};
    SC.b_spread=K=>{const t0=Math.max(K.t+.6,K.at('divides',.3)-.2),t1=Math.max(t0+1.5,K.at('number of tokens',.5));popMarks(K,t0,t1);
      const last=SM[SM.length-1];if(last){const tl=Math.max(t1+.6,K.at('last token',.62)-.15);glowAt(O,{x:last.p.x-20,y:last.p.y-62,w:40,h:84},5,tl,1.8);
        const e1=RT.end(1),tg=Math.max(tl+.8,K.at('before the stop',.75)-.15);glowAt(O,{x:last.p.x-8,y:Math.min(last.p.y,e1.y)-24,w:e1.x-last.p.x+16,h:Math.abs(e1.y-last.p.y)+48},5,tg,1.6);
        const ti=Math.max(tg+.8,K.at('close to the item',.9)-.15);glowAt(BDS,M.then,6,ti,1.4);return Math.max(K.d,ti+1.5-K.t);}
      return K.d;};
    SC.b_fixed=K=>{const t0=Math.max(K.t+.6,K.at('set interval',.2)-.2),t1=Math.max(t0+1.5,K.at('every few minutes',.4));popMarks(K,t0,t1);
      const tf=Math.max(t1+.6,K.at('more than once',.65)-.15);M.slot.forEach((r,j)=>glowAt(BDS,r,4,tf+j*.05,1.3));return K.d;};
    let watch=null;
    SC.b_start=K=>{const t=K.t;ringEl.tr.move(t+.15,t+.6,{o:1,s:1},0,easeOut);
      watch=mkFx('wk-chip','<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><rect x="13" y="2" width="14" height="9" rx="2" fill="#5d6770"/><rect x="13" y="29" width="14" height="9" rx="2" fill="#5d6770"/><circle cx="20" cy="20" r="12" fill="#fff" stroke="#1d4a77" stroke-width="3"/><path d="M20 13v7l5 3" stroke="#ef7d00" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M4 14q-3 6 0 12M36 14q3 6 0 12" stroke="#1d4a77" stroke-width="2" fill="none" stroke-linecap="round"/></svg><span>Vibrating watch</span>',{x:RC.x+86,y:RC.y-30,w:190},{s:.8});
      const tw=Math.max(t+1.2,K.at('vibrating watch',.5)-.15);watch.tr.move(tw,tw+.35,{o:1,s:1},0,easeOut);
      SM.forEach((m,i)=>{const tc=Math.max(t+.6,K.at('checkpoint times',.3)-.15)+i*.08;m.mk.tr.move(tc,tc+.2,{s:1.18});m.mk.tr.move(tc+.2,tc+.45,{s:1});});
      const tr0=Math.max(t+.8,K.at('sped up',.85)-.3);ringPending=tr0;return Math.max(K.d,tr0+1.2-K.t);};
    /* the first checkpoint, in full: the aide's hand gives the token with praise, the learner's hand puts it on the board */
    SC.b_tok=K=>{const tEnd=K.t+.7,grab=tEnd+.45,atHO=grab+.9,tk=atHO+.9,place=tk+1;ringTo(ringPending==null?K.t-2:ringPending,tEnd,0);ringPending=null;markEarned(0,tEnd);
      if(watch)watch.tr.move(K.t,K.t+.4,{o:0});
      const tb=Math.max(atHO+.2,K.at('brief praise',.5)-.15);deliver(slotOf(0,0),{t0:tEnd-.4,grab,atHO,text:praise(0),bub:tb,bubDur:2.6,take:Math.max(tk,tb+.5),place:Math.max(place,tb+1.5),lin:.9});
      let tz=Math.max(place,tb+1.5)+1;if(FB_.each)for(let r=1;r<NR;r++)tz=flyTok(slotOf(0,r),tz-.5+r*.25,.9);
      const ts=Math.max(tz,K.at('put it on the board',.85)-.15);glowAt(BDS,M.slot[slotOf(0,0)],5,ts,1.6);return Math.max(K.d,ts+1.7-K.t);};
    /* what happens when a rule is broken: shown as a note at the next checkpoint while the bus rides on (this ride goes on well) */
    SC.b_none=K=>{const m=SM[1]||SM[0],t=K.t;ringPending=t+.3;driveTo(t+.3,t+K.d,(m.f+busF)/2);
      const ni=ifNote(1152,300,'<b>If</b> a rule is not followed:<br>no token at this checkpoint.',236),tn=Math.max(t+.6,K.at('no token',.25)-.2);ni.tr.move(tn,tn+.35,{o:1,s:1,dy:0},0,easeOut);
      const te=Math.max(tn+.8,K.at('earned tokens stay',.45)-.15);glowAt(BDS,M.slot[0],5,te,1.7);
      const tr=Math.max(te+.8,K.at('name the rule',.65)-.15);glowAt(BDS,rulesAll[0],6,tr,1.5);
      const tf=Math.max(tr+.8,K.at('fresh chance',.9)-.15);m.mk.tr.move(tf,tf+.2,{s:1.15});m.mk.tr.move(tf+.2,tf+.45,{s:1});ni.tr.move(tf+.6,tf+1,{o:0});return Math.max(K.d,tf+1.1-K.t);};
    /* a row for each rule: checkpoint two fills a token in every row at once; the note says what a missed rule would leave */
    SC.b_each=K=>{const t=K.t,j=Math.min(1,NCP-1),tEnd=t+.8;ringTo(ringPending==null?t-2:ringPending,tEnd,j);ringPending=null;markEarned(j,tEnd);
      let tz=tEnd+.3;for(let r=0;r<NR;r++)tz=Math.max(tz,flyTok(slotOf(j,r),tEnd+.3+r*.35,.9));
      const tr=Math.max(tz,K.at('own token',.4)-.15);for(let r=0;r<NR;r++)glowAt(BDS,M.slot[slotOf(j,r)],4,tr+r*.15,1.3);
      const jn=Math.min(j+1,NCP-1),sl=M.slot[slotOf(jn,1)],sp=at(BDS,ctr(sl));const ni=ifNote(sp.x,BDS.y+PG.bd.h*sBd+12,'<b>If</b> one rule is missed:<br>only its own slot stays empty.',320);
      const tm=Math.max(tr+1,K.at('missed rule',.55)-.15);ni.tr.move(tm,tm+.35,{o:1,s:1,dy:0},0,easeOut);glowAt(BDS,sl,5,tm+.2,1.8);
      const to=Math.max(tm+1.2,K.at('other rules still earn',.85)-.15);[0,2].filter(r=>r<NR).forEach(r=>glowAt(BDS,M.slot[slotOf(jn,r)],4,to,1.4));ni.tr.move(to+1.2,to+1.6,{o:0});ringPending=to+1.4;return Math.max(K.d,to+1.7-K.t);};
    SC.b_more=K=>{const j0=FB_.each?2:1,ids=[];for(let j=j0;j<NCP-1;j++)ids.push(j);if(!ids.length)return K.d;
      const cy=clamp((K.d+.4)/ids.length,1.9,4),ri=cy-1.1;let T=K.t+.2,end=K.t;
      ids.forEach((j,q)=>{const a=q===0&&ringPending!=null&&ringPending<T?ringPending:T;ringTo(a,T+ri,j);markEarned(j,T+ri);let z=T+ri;
        for(let r=0;r<NR;r++)z=Math.max(z,flyTok(slotOf(j,r),T+ri+.1+r*.2,.75));if(!FB_.each)bubble(praise(q+1),T+ri+.1,Math.min(1.6,cy-.3));end=z;T+=cy;});
      ringPending=null;return Math.max(K.d,end-K.t+.1);};
    /* the last checkpoint: just before the stop (spread) or the last slot (a set interval); the full board glows */
    const lastCp=K=>{const j=NCP-1,T=K.t+.2,D=T+2;ringTo(ringPending!=null&&ringPending<T?ringPending:T,D,j);ringPending=null;markEarned(j,D);
      let z=D;for(let r=0;r<NR;r++)z=Math.max(z,flyTok(slotOf(j,r),D+.15+r*.2,.85));if(!FB_.each)bubble(praiseFor('').last,D+.2,2.2);
      const tf=Math.max(z+.2,K.at('the board is full',.6)-.15);M.slot.forEach((r,q)=>glowAt(BDS,r,4,tf+q*.04,1.4));ringEl.tr.move(tf+.8,tf+1.3,{o:0,s:.9});
      const ti=Math.max(tf+1,K.at('earned the item',.85)-.15);glowAt(BDS,M.then,6,ti,1.5);return Math.max(K.d,ti+1.6-K.t);};
    SC.b_last=lastCp;SC.b_full=lastCp;
    /* the item: at the stop (the bus rolls to it first) or right there on the bus; the Earn card grows into the item, an adult's hand
       gives it and the learner's hand takes it */
    const handOver=(K,tt)=>{const c=cC,P0=at(BDS,ctr(M.then)),CEN={x:640,y:300},big=sBd*2.2;veil.tr.move(tt-.2,tt+.4,{o:.32});
      c.tr.set(tt,{x:P0.x,y:P0.y,s:sBd*CWE/CW,l:0,o:1});c.where.set(tt,'fly');c.tr.move(tt,tt+.35,{l:1});c.tr.move(tt+.35,tt+1.3,{x:CEN.x,y:CEN.y,s:big},.1);
      const is=big*CW/IW;item.tr.set(tt+1.15,{x:CEN.x,y:CEN.y,s:is,l:1,o:0});item.where.set(tt+1.15,'fly');item.tr.move(tt+1.15,tt+1.75,{o:1});c.tr.move(tt+1.15,tt+1.75,{o:0});c.where.set(tt+1.8,'none');
      const tg=tt+2,HOFF={x:560,y:330},si=.75;enter(HT,tg-.9,tg,grip(item,CEN,is,'teacher',GI_T),'pinch',SHT);take(item,HT,tg);item.tr.move(tg,tg+1.1,{s:si});carryTo(item,HT,tg+.1,tg+1.1,HOFF,.1);
      const tl=tg+1.15;enter(HL,tl-.95,tl,grip(item,HOFF,si,'learner',GI_L),'pinch',SHL);release(item,tl);take(item,HL,tl);HT.pose.set(tl+.05,'point');leave(HT,tl+.15,tl+.9);
      const tw=Math.max(tl+1.4,K.t+K.d-1.2);leave(HL,tw,tw+1.1);release(item,tw+1.12);item.where.set(tw+1.12,'none');veil.tr.move(tw+.6,tw+1.2,{o:0});
      /* a set interval: the tokens come off the board for the next one, and the item card goes back in the Earn box */
      if(FB_.fixed&&cps.length>NCP){const tb=tw+1.3;TK.forEach((c,i)=>{const sp=at(BDS,ctr(M.slot[i])),dp=at(TKS,ctr(M.ybx[i]||M.ybx[0]));c.tr.set(tb+i*.06,{x:sp.x,y:sp.y,s:sBd,l:0,o:1});c.where.set(tb+i*.06,'fly');c.tr.move(tb+i*.06,tb+.7+i*.06,{x:dp.x,y:dp.y,s:sTk,l:.4},.12);c.tr.move(tb+.7+i*.06,tb+.85+i*.06,{l:0});c.where.set(tb+.86+i*.06,'tk');});
        cC.where.set(tb+.9+TK.length*.06,'bd');return tb+1.2+TK.length*.06;}
      return tw+1.2;};
    SC.b_arrive=K=>{const t=K.t;driveTo(t+.1,t+1.6,1);const e1=RT.end(1),k=RT.k;glowAt(O,{x:e1.x-34*k,y:e1.y-50*k,w:68*k,h:66*k},6,t+1.4,1.6);
      const ts=Math.max(t+2,K.at('sees the full board',.55)-.15);M.slot.forEach((r,q)=>glowAt(BDS,r,4,ts+q*.03,1.3));
      const end=handOver(K,Math.max(ts+1.2,K.at('gives the item',.8)-1));return Math.max(K.d,end+.2-K.t);};
    SC.b_onbus=K=>{const t=K.t,tt=Math.max(t+.8,K.at('right there',.25)-.3);const tag=mkFx('wk-chip','<svg viewBox="-30 -26 60 30" width="52" height="26" aria-hidden="true">'+busIcon('bus',0,0,1)+'</svg><span>on the bus</span>',{x:880,y:500,w:240},{s:.8});
      tag.tr.move(tt+1.4,tt+1.8,{o:1,s:1},0,easeOut);const end=handOver(K,tt);tag.tr.move(end-.6,end-.2,{o:0});return Math.max(K.d,end+.2-K.t);};
    /* fading the timer: the big route; the clocks give way to the landmarks, then every other landmark, then just the stop */
    SC.b_land=K=>{const t=K.t;['bd','tk'].forEach(k=>PG[k].tr.move(t+.1,t+.7,{o:0}));[RT.fx,busFx,ringEl].concat(SM.flatMap(m=>[m.mk,m.b0,m.b1])).forEach(fx=>fx.tr.move(t+.1,t+.6,{o:0}));
      RB.fx.tr.move(t+.5,t+1.1,{o:1});BT.forEach((fx,i)=>fx.tr.move(t+1+i*.06,t+1.3+i*.06,{o:1,s:1}));steps.tr.move(t+.8,t+1.2,{o:1});stepEls[0].tr.move(t+1,t+1.3,{o:1,s:1,h:1});
      const tf=Math.max(t+2,K.at('fade the timer',.3)-.15);BT.forEach(fx=>fx.tr.move(tf,tf+.5,{o:0,s:.7}));stepEls[0].tr.move(tf,tf+.3,{o:.45,s:.9,h:0});stepEls[1].tr.move(tf,tf+.35,{o:1,s:1,h:1});
      const t0=Math.max(tf+.5,K.at('landmarks along',.4)-.15),ex=['a store','a park','a bridge'].map((w,i)=>K.at(w,.7+.08*i));
      BL.forEach((L,i)=>{const tt=Math.max(t0+i*.4,i<3?ex[i]-.15:t0+i*.4);L.e.tr.move(tt,tt+.4,{o:1,s:1,dy:0},0,easeOut);});return Math.max(K.d,t0+BL.length*.4+.6-K.t);};
    SC.b_fewer=K=>{const t=K.t,tf=Math.max(t+.5,K.at('every other',.3)-.15);BL.forEach(L=>{if(!L.keep)L.e.tr.move(tf,tf+.5,{o:0,s:.8});});stepEls[1].tr.move(tf,tf+.3,{o:.45,s:.9,h:0});stepEls[2].tr.move(tf,tf+.35,{o:1,s:1,h:1});
      const tj=Math.max(tf+1.2,K.at('just the stop',.55)-.15);BL.forEach(L=>{if(L.keep)L.e.tr.move(tj,tj+.5,{o:0,s:.8});});glowAt(O,stopGlow(),6,tj+.2,1.8);stepEls[2].tr.move(tj,tj+.3,{o:.45,s:.9,h:0});stepEls[3].tr.move(tj,tj+.35,{o:1,s:1,h:1});
      const tb=Math.max(tj+1.4,K.at('go back a step',.85)-.15);stepEls[3].tr.move(tb,tb+.3,{o:.45,s:.9,h:0});stepEls[2].tr.move(tb,tb+.35,{o:1,s:1,h:1});backFx.tr.move(tb,tb+.35,{o:1,dy:0},0,easeOut);
      BL.forEach(L=>{if(L.keep)L.e.tr.move(tb+.1,tb+.5,{o:1,s:1});});return Math.max(K.d,tb+1.3-K.t);};
    /* the plan at a readable size, moved up the frame part by part as the line names them (each glow drawn where its part is then) */
    SC.b_plan=K=>{const t=K.t;[RB.fx,steps,backFx].concat(BL.map(L=>L.e)).forEach(fx=>fx.tr.move(t+.1,t+.6,{o:0}));plan.tr.move(t+.5,t+1.1,{o:1,s:PLS},0,easeOut);
      let pan=0,last=t+1.1;const room=560;
      [['route',PP.route,'the route'],['when',PP.when,'the checkpoints'],['say',PP.say,'what to say'],['log',PP.log,'a log']].forEach(([k,r,w],i)=>{if(!r)return;const tt=Math.max(last+.5,K.at(w,.35+.15*i)-.15);
        const need=Math.max(0,Math.min(1056*PLS+PY0-room,r.y+r.h-room));if(need>pan+1){plan.tr.move(Math.max(last,tt-.7),tt-.05,{dy:-need});pan=need;}
        glowAt(O,{x:r.x,y:r.y-pan,w:r.w,h:r.h},5,tt,1.6);last=tt+.4;});return Math.max(K.d,last+1.4-K.t);};
    SC.b_outro=K=>{const t=K.t;plan.tr.move(t+.1,t+.6,{o:0});PG.bd.tr.set(t+.4,{o:0,x:BIG.x,y:BIG.y,s:BIG.s});PG.bd.tr.move(t+.5,t+1.2,{o:1});
      const tg=Math.max(t+1.3,K.at('same rules',.3)-.15);rulesAll.forEach((r,j)=>glowAt(BIG,r,5,tg+j*.12,1.4));const ts=Math.max(tg+1,K.at('fewer tokens',.85)-.15);glowAt(BIG,M.ttl,5,ts,1.5);return Math.max(K.d,ts+1.6-K.t);};
  }
  /* ---- the timeline ---- */
  const ids=BUSM?busIds(F.bus):LIST.map(id=>id==='tok_last'&&F.term?'tok_last_term':id).filter(id=>!OPT[id]||present(id));
  let T=0;const cues=[];
  ids.forEach(id=>{const ln=line(id),low=ln.t.toLowerCase(),on=onsetFn(id,ln.t,ln.d),T0=T;
    const K={id,t:T0,d:ln.d,text:ln.t,at:(ph,fr,from)=>{const i=low.indexOf(String(ph).toLowerCase(),from>0?from:0);if(i>=0&&window.__wkMarkLog)window.__wkMarkLog.push([id,i]);return i<0?T0+ln.d*fr:T0+on(i);}};
    const need=(SC[id==='tok_last_term'?'tok_last':id](K))||0;const dur=Math.max(ln.d+PAUSE,need+.1);
    cues.push({id,start:T0,dur,narr:ln.d,text:ln.t,chapter:CHOF[id],chunks:chunks(id,ln.t,T0,on),a:ln.a});T+=dur;});
  const chapters=(BUSM?CHAPS_BUS:CHAPS).map(([id,label])=>{const c=cues.find(q=>q.chapter===id);return{id,label,start:c?c.start:0};});
  return{D:T,cues,chapters,PG,cards,hands,fxs,ring,cap,notes,item,F};
}
/* (v21.49) the lines a bus book plays, in order: one of each pair as its settings say */
function busIds(b){return ['b_intro','b_rules','b_item','b_route',b.fixed?'b_fixed':'b_spread','b_start','b_tok',b.each?'b_each':'b_none',(b.each?b.n>3:b.n>2)?'b_more':'',b.fixed?'b_full':'b_last',b.reward==='bus'?'b_onbus':'b_arrive','b_land','b_fewer','b_plan','b_outro'].filter(id=>id&&(present(id)||id in FB));}
/* captions: a line in pieces of up to two caption lines; each piece shows a moment before the voice reaches its first word */
const CAPLEAD=.12;
function chunks(id,text,T,on){const parts=(text.match(/[^.!?]+[.!?]+["”]?\s*|[^.!?]+$/g)||[text]).map(s=>s.trim()).filter(Boolean);const out=[];
  parts.forEach(p=>{if(p.length<=120){out.push(p);return;}const mid=p.length/2;let best=-1;p.replace(/[,;:] /g,(m,i)=>{if(best<0||Math.abs(i-mid)<Math.abs(best-mid))best=i;return m;});if(best<0){out.push(p);return;}out.push(p.slice(0,best+1));out.push(p.slice(best+2));});
  const merged=[];out.forEach(p=>{const L=merged[merged.length-1];if(L&&(L+' '+p).length<=96)merged[merged.length-1]=L+' '+p;else merged.push(p);});
  let cur=0;return merged.map((p,k)=>{const i=Math.max(cur,text.indexOf(p.slice(0,12),cur));cur=i+1;if(k&&window.__wkMarkLog)window.__wkMarkLog.push([id,i]);return{t:k?T+Math.max(0,on(i)-CAPLEAD):T,text:p};});}

/* ---------------- renderAt: the stage at time t ---------------- */
let RMQ=null;const reduced=()=>{try{RMQ=RMQ||window.matchMedia('(prefers-reduced-motion: reduce)');return !!RMQ.matches;}catch(e){return false;}};
function cueAt(t){if(!B)return null;const c=B.cues;let lo=0,hi=c.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(c[m].start<=t)lo=m;else hi=m-1;}return c[lo];}
function renderAt(t){if(!B)build();if(!B)return;t=clamp(+t||0,0,B.D);const cue=cueAt(t);
  const v=reduced()&&cue?Math.min(B.D,cue.start+cue.dur-.02):t;
  /* a page: placed, scaled, turned over its binding (ry), or flipped over in place (fx: its width shrinks to its middle and back) */
  for(const k in B.PG){const p=B.PG[k],s=p.tr.at(v),fx=s.fx==null?1:clamp(s.fx,0,1);
    css(p.el,'transform','translate('+f2(s.x+p.w*s.s*(1-fx)/2)+'px,'+f2(s.y)+'px) scale('+(fx<1?(s.s*fx).toFixed(4)+','+s.s.toFixed(4):s.s.toFixed(4))+')'+(s.ry?' rotateY('+f2(s.ry)+'deg)':''));
    css(p.el,'opacity',f2(s.o));css(p.el,'visibility',s.o>.001&&s.ry>-89.5?'visible':'hidden');css(p.shade,'opacity',f2(clamp(-s.ry/90,0,1)*.5));}
  for(const c of B.cards){const w=c.where.at(v).v;
    for(const k in c.inp){const e=c.inp[k];const on=w===k;css(e,'opacity',on?'1':'0');let sc=1;const pp=c.pops[k];if(on&&pp)for(const p of pp)sc=Math.max(sc,1+.08*bump(v,p,.6));css(e,'transform',sc!==1?'scale('+sc.toFixed(4)+')':'none');}
    if(!c.el)continue;
    const s=c.tr.at(v),p=cardPosOf(c,v),k=s.s*(1+.07*s.l),fl=w==='fly';
    css(c.el,'visibility',fl?'visible':'hidden');css(c.el,'opacity',fl?f2(s.o):'0');css(c.el,'transform','translate('+f2(p.x-c.w/2)+'px,'+f2(p.y-c.h/2)+'px) scale('+k.toFixed(4)+')');
    css(c.sh,'transform','translate('+f2(4+14*s.l)+'px,'+f2(5+20*s.l)+'px)');css(c.sh,'opacity',f2(.35+.3*s.l));
    if(c.glow){const g=c.glowT;css(c.glow,'opacity',g&&v>=g[0]&&v<=g[1]?f2(.55+.45*Math.sin((v-g[0])*5)):'0');}}
  /* the hands: each pose is drawn about the point that touches; while a pose changes, the new drawing starts with its wrist where the
     old one's wrist is (so the forearms coincide and no second arm shows) and slides onto its own touch point over 0.3 s */
  for(const h of B.hands){const s=h.tr.at(v),ps=h.pose.at(v),ang=Math.atan2(s.x-s.sx,s.sy-s.y)*180/Math.PI,u=clamp(ps.since/.14,0,1);
    let lf=0;for(const L of h.lifts)lf=Math.max(lf,bump(v,L[0],L[1]));const sc=h.base*s.s*(1+.05*lf);
    const vis=s.y<SH+420;let ox=0,oy=0;
    if(ps.prev!==ps.v&&ps.since<.3&&h.poses[ps.prev]){const r=ang*Math.PI/180,cs=Math.cos(r),sn=Math.sin(r),W=P=>{const dx=(P.wx-P.ax)*sc,dy=(P.wy-P.ay)*sc;return[dx*cs-dy*sn,dx*sn+dy*cs];};
      const a=W(h.poses[ps.prev]),b=W(h.poses[ps.v]),k=1-ps.since/.3;ox=(a[0]-b[0])*k;oy=(a[1]-b[1])*k;}
    /* the new drawing is there at once, under the old one, which fades off the top without its shadow: the hand never shows the
       table through it, only the old fingers melt away */
    const sw=ps.prev!==ps.v&&ps.since<.14&&!!h.poses[ps.prev];
    for(const name in h.poses){const P=h.poses[name];const nw=name===ps.v&&ps.prev!==name,old=sw&&name===ps.prev;const o=name===ps.v?1:old?1-u:0;
      css(P.el,'opacity',f2(vis?o:0));css(P.el,'visibility',vis&&o>.001?'visible':'hidden');css(P.el,'zIndex',old?'2':'1');tog(P.el,'wk-out',old);
      css(P.el,'transform','translate('+f2(s.x-P.ax+(nw?ox:0))+'px,'+f2(s.y-P.ay+(nw?oy:0))+'px) rotate('+f2(ang)+'deg) scale('+sc.toFixed(4)+')');}}
  for(const fx of B.fxs){const s=fx.tr.at(v);css(fx.el,'opacity',f2(s.o));css(fx.el,'visibility',s.o>.001?'visible':'hidden');css(fx.el,'transform',s.dy||s.dx||s.s!==1?'translate('+f2(s.dx||0)+'px,'+f2(s.dy)+'px) scale('+s.s.toFixed(4)+')':'none');
    if(s.h!=null)css(fx.el,'backgroundColor',s.h>.01?'rgba(255,205,90,'+f2(.42*s.h)+')':'transparent');}
  /* the timer ring */
  const R=B.ring;let p=0,state='idle',secs=R.secs||120;for(const I of R.ints){if(v>=I.t0&&v<I.t1){p=(v-I.t0)/(I.t1-I.t0)*I.f;state='run';if(I.secs)secs=I.secs;break;}if(v>=I.t1&&v<I.hold){p=I.f;state=I.ok?'ok':'no';}}
  css(R.fg,'strokeDasharray',f2(R.C));css(R.fg,'strokeDashoffset',f2(R.C*(1-p)));css(R.fg,'stroke',state==='ok'?'#2f9e44':state==='no'?'#8c97a1':'#f08c00');
  const rem=Math.round(secs*(1-(state==='idle'?0:p)));txt(R.t,state==='ok'?'✓':state==='no'?'–':Math.floor(rem/60)+':'+String(rem%60).padStart(2,'0'));
  /* captions follow the real time, also with reduced motion */
  let ct='';if(cue){for(const ch of cue.chunks)if(ch.t<=t+.001)ct=ch.text;}
  txt(B.cap,ct);css(B.cap,'visibility',ct?'visible':'hidden');const D=dom();if(D&&D.cap2)txt(D.cap2,ct);
  B.t=t;}
function folPos(c,f,t){const hp=f.h.tr.at(t),k=(c.tr.at(t).s||1)/(f.s0||1);return{x:hp.x+f.dx*k,y:hp.y+f.dy*k};}
function cardPosOf(c,t){for(const f of c.fol)if(t>=f.t0&&t<f.t1)return folPos(c,f,t);return c.tr.at(t);}

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

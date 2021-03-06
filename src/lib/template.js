/************************************************
 * 					JTemplate 					*
 * 					CMSPP.NET					*
 * 				   JTemplate.js					*
 *  	2012-9-2 5:23:37$	ZengOhm@gmail.com	*
 ************************************************/
define([],function(){
    return new function (){
        var _dataList = null;
        var _scanTemplateName = 0;
        var _scanCode = '';
        var _scanCodeIndex = 0;
        var _scanCodeChar = '';
        var _scanCodeLength = 0;
        var _scanCodeLine = 0;
        var _scanCodeCol = 0;
        var _codeConditionNested = 0;
        var _codeBlockNested = 0;
        /*
         * 0	Free						-	When start
         * 1	HTML Block					-	Start with 'First HTML Char' end with '<'
         * 2	HTML to JTemplate border	-	When read '#' after '<'
         * 3	JTemplate Block				-	Start with 'First JTemplate Char' end before '#'
         * 4	JTemplate to HTML border	-	When read '#' and '>' after '#'
         */
        var _codeState = 0;

        var _run = function(){
            _scanCodeIndex = 0;
            _scanCodeLength = _scanCode.length;
            _scanCodeLine = 0;
            _scanCodeCol = 0;
            _codeState = 0;
            var rString = 'var codeString = "";try{';

            while(_readChar()){
                switch(_codeState)	{
                    case 1:
                        rString+= 'codeString += "' + _jsStringEncode(_readHTMLBlock()) + '";';
                        break;
                    case 3:
                        rString+=_readJTemplate()+';';
                        break;
                }
            }
            rString += '}catch(e){console.log(e);}';
            return eval(rString);
        };

        var _readJTemplate = function(){
            if(_codeState==2)_readChar();
            var rString = '';
            do{
                if(_codeState==4)return _decodeVar(rString).replace(/echo/g,'codeString += ');
                rString += _scanCodeChar;
            }while(_readChar());
            throw ('JTemplate code should be end with "#>".');
        };

        var _readHTMLBlock = function(){
            if(_codeState==4)_readChar();
            var rString = '';
            var lastWord = '';
            do{
                if(lastWord=='<' && _scanCodeChar=='#')return rString;
                rString+=lastWord;
                lastWord = _scanCodeChar;
            }while(_readChar());
            rString+=lastWord;
            return rString;
        };

        var _jsStringEncode = function(str){
            return str.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\r/ig,'').replace(/\n/ig,"\\\n");
        };

        var _readChar = function(){
            if(_scanCodeIndex<_scanCodeLength){
                var lastChar = _scanCodeChar;
                _scanCodeChar = _scanCode.substr(_scanCodeIndex,1);

                if(_codeState==0)
                    _codeState = 1;
                else if(_codeState==1 && lastChar=='<' && _scanCodeChar=='#')
                    _codeState = 2;
                else if(_codeState==2)
                    _codeState = 3;
                else if(_codeState==3 && _scanCodeChar=='#')
                    _codeState = 4;
                else if(_codeState==4 && lastChar=='>')
                    _codeState = 1;

                if(_scanCodeChar == "\n"){
                    _scanCodeLine++;
                    _scanCodeCol=0;
                }
                else if(_scanCodeChar == "(")_codeConditionNested++;
                else if(_scanCodeChar == ")")_codeConditionNested--;
                else if(_scanCodeChar == "{")_codeBlockNested++;
                else if(_scanCodeChar == "}")_codeBlockNested--;
                _scanCodeIndex++;
                _scanCodeCol++;

                if(_codeBlockNested<0)
                    _codeError('Code Block Nested Error');
                if(_codeConditionNested<0)
                    _codeError('Code Condition Nested Error');

                return true;
            }else{
                _scanCodeChar = '';
                return false;
            }
        };

        var _codeError = function (info){
            throw ('JTemplate Code Error in Template[' + _scanTemplateName + '] line ' + _scanCodeLine + ' char ' + _scanCodeCol + ': ' + info + '.');
        };

        var _decodeVar = function(varCode){
            return varCode.replace(/\$([a-zA-Z_]+[a-zA-Z_])*?/g,'_dataList._$1');
        };

        return function(template, dataList){
            _scanCode = template;
            _dataList = {};
            if(dataList != null){
                for(var i in dataList){
                    _dataList['_'+i]=dataList[i];
                }
            }
            return _run();
        };
    };
});
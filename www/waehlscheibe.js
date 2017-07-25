function initWaehlscheibe()
{
   checkRegistrationStatus();
   prepareDialling();
   $('#dialform').submit(function() {
       indicateDialling();
   });

   var $number = $('#number');
   $number.change(function() {
       setNumber($number.val());
   });
   $number.focus();

   handleCall();
}

function setNumber(number)
{
    number = number
        // Trim left
        .replace(/^\s+/, '')
        // Remove all non digits but a leading +
        .replace(/(?!^)[^0-9]/g, '')
        // Fix for snom phones; see NRTECH-1406
        .replace(/^(\+|00)49/, '00');
        // Rewrite one leading zero to two leading zeroes
        //.replace(/^(0[1-9])/, '0$1');

    if (number.charAt(0) != 0 && number.length > 3) {
        //NRTECH-1648: leading zero to dial out.
        // number lengths <= 3 mean internal number which do not
        // need a leading zero.
        //number = '0' + number;
    }

    $('#number').val(number);
}

function getHandlerUrl()
{
    var loc = document.location.href;
    var url = loc.replace(/#.*/, '') + '?call=%s';
    return url;
}

function registerHandler()
{
    window.navigator.registerProtocolHandler(
        'tel', getHandlerUrl(), 'Telefonwählscheibe'
    );
    checkRegistrationStatus();
}

function isHandlerRegistered()
{
    if (!window.navigator.isProtocolHandlerRegistered) {
        return 'unknown';
    }

    var state = window.navigator.isProtocolHandlerRegistered('tel', getHandlerUrl());
    return state == 'registered';
}


function registerPhone()
{
    var def = 'ipaddress';
    if (isPhoneRegistered()) {
        def = localStorage.getItem('telUrl')
            .replace('http://', '')
            .replace(/\/$/, '');
    }
    var res = window.prompt(
        "IP deines Telefons",
        def
    );
    if (res == '' || res == null) {
        return false;
    }

    var url = 'http://' + res.toLowerCase() + '/';
    localStorage.setItem('telUrl', url);

    checkRegistrationStatus();
    prepareDialling();
    return true;
}

function isPhoneRegistered()
{
    return localStorage.getItem('telUrl') != null;
}

function checkRegistrationStatus()
{
    if (window.navigator.registerProtocolHandler) {
        $('#register-handler-support-error').hide();
    }

    var hState = isHandlerRegistered();
    if (hState == 'unknown') {
        $('#register-handler-error').hide();
        $('#register-handler-ok').hide();
        $('#register-handler-unknown').show();
    } else if (hState) {
        $('#register-handler-error').hide();
        $('#register-handler-ok').show();
        $('#register-handler-unknown').hide();
    } else {
        $('#register-handler-error').show();
        $('#register-handler-ok').hide();
        $('#register-handler-unknown').hide();
    }

    if (isPhoneRegistered()) {
        $('#register-phone-error').hide();
        $('#register-phone-ok').show();
    } else {
        $('#register-phone-error').show();
        $('#register-phone-ok').hide();
    }
}

function handleCall()
{
    if (!isPhoneRegistered()) {
        return false;
    }

    var oGetVars = {};
    if (window.location.search.length < 1) {
        return false;
    }
    for (var aItKey, nKeyId = 0, aCouples = window.location.search.substr(1).split("&"); nKeyId < aCouples.length; nKeyId++) {
        aItKey = aCouples[nKeyId].split("=");
        oGetVars[unescape(aItKey[0])] = aItKey.length > 1 ? unescape(aItKey[1]) : "";
    }

    if (!oGetVars.call || oGetVars.call == '') {
        return false;
    }

    //double unescape for links from thunderbird, NRTECH-1590
    var number = unescape(oGetVars.call).replace('tel:', '');

    prepareDialling();
    setNumber(number);
    $('#dial').click();
}

function prepareDialling()
{
    $('#dial').attr('action', localStorage.getItem('telUrl'));
}

function indicateDialling()
{
    $('#hangup').focus();
    $('#dialling').show('slow');
    window.setTimeout(
        function() {
            $('#dialling').hide('slow');
        },
        5000
    );
}

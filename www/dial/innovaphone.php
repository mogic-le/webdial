<?php
/**
 * Start/stop calls on an Innovaphone 112.
 * Needs username + password setup in data/innovaphone.php
 * and HTTP_Request2 installed.
 *
 * @author Christian Weiske <weiske@mogic.com>
 */
header('HTTP/1.0 500 Internal Server Error');

$phoneurl = verifyParam('phoneurl');

if (isset($_POST['dial'])) {
    //dial a number
    $number = verifyParam('number');

    callUrl(
        $phoneurl . 'PHONE/APP/mod_cmd.xml'
        . '?xsl=phone_dial.xsl'
        . '&cmd=xml-dial'
        . '&dest=' . urlencode($number)
        . '&op=Dial'
    );

} else if (isset($_POST['hangup'])) {
    //close the current connection

    //get connection ID
    $xml = callUrl(
        $phoneurl . 'PHONE/APP/mod_cmd.xml'
        . '?xsl=phone_calls.xsl'
        . '&cmd=xml-calls'
    );
    $sx = simplexml_load_string($xml);
    if (!isset($sx->call[0]['id'])) {
        header('HTTP/1.0 400 Bad Request');
        echo "No current calls\n";
        exit(1);
    }
    $callid = intval($sx->call[0]['id']);

    $xml = callUrl(
        $phoneurl . 'PHONE/APP/mod_cmd.xml'
        . '?xsl=phone_calls.xsl'
        . '&cmd=xml-calls'
        . '&op=drop'
        . '&id=' . urlencode($callid)
    );
}

header('HTTP/1.0 204 No Content');
exit(0);


function verifyParam($name)
{
    if (!isset($_POST[$name])) {
        header('HTTP/1.0 400 Bad Request');
        echo $name . " parameter missing\n";
        exit(1);
    }
    return $_POST[$name];
}

function callUrl($url)
{
    require __DIR__ . '/../../data/innovaphone.php';
    require_once 'HTTP/Request2.php';
    $req = new HTTP_Request2($url);
    $req->setAuth($user, $pass, HTTP_Request2::AUTH_DIGEST);
    $res = $req->send();
    if (intval($res->getStatus() / 100) !== 2) {
        header('HTTP/1.0 502 Bad Gateway');
        echo "Error from phone:\n";
        echo $res->getReasonPhrase() . "\n";
        exit(1);
    }

    return $res->getBody();
}
?>

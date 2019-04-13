<?php

function sendResponse($data): void {
    ignore_user_abort(true);

    ob_start();
    header('Content-Type: application/json');
    echo json_encode($data);
    $serverProtocol = filter_input(INPUT_SERVER, 'SERVER_PROTOCOL', FILTER_SANITIZE_STRING);
    header($serverProtocol . ' 200 OK');
    // Disable compression (in case content length is compressed).
    header('Content-Encoding: none');
    header('Content-Length: ' . ob_get_length());

    // Close the connection.
    header('Connection: close');

    ob_end_flush();
    ob_flush();
    flush();
}

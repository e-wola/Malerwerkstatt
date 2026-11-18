<?php
// Receives enquiry forms (multipart). Sends one mail incl. optional photos. Returns JSON.
header('Content-Type: application/json; charset=utf-8');
function out($ok, $err = null, $code = 200) { http_response_code($code); echo json_encode(['ok' => $ok, 'error' => $err]); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(false, 'method', 405);
$cfg = require __DIR__ . '/config.php';
if (empty($cfg['to'])) out(false, 'not_configured', 503);
if (!empty($_POST['website'])) out(true);                       // honeypot -> pretend success
$clean = function ($k, $max = 2000) { return mb_substr(trim(strip_tags((string)($_POST[$k] ?? ''))), 0, $max); };
$name = $clean('name', 120); $tel = $clean('telefon', 40); $mail = $clean('email', 160);
if ($name === '' || ($tel === '' && !filter_var($mail, FILTER_VALIDATE_EMAIL))) out(false, 'invalid', 422);
// simple rate limit: 1 request / 20 s per IP
$f = sys_get_temp_dir() . '/aw_rl_' . md5($_SERVER['REMOTE_ADDR'] ?? 'x');
if (is_file($f) && time() - filemtime($f) < 20) out(false, 'rate', 429);
touch($f);
$lines = ["Neue Anfrage über die Website", "",
  "Leistung: " . $clean('leistung', 300), "Objekt: " . $clean('objekt', 60), "Ort: " . $clean('ort', 120),
  "Zeitraum: " . ($clean('zeitraum', 80) ?: 'flexibel'), "", "Nachricht:", $clean('nachricht', 3000) ?: '-', "",
  "Name: $name", "Telefon: " . ($tel ?: '-'), "E-Mail: " . ($mail ?: '-'), "Rückruf: " . ($clean('rueckruf', 40) ?: '-')];
$text = implode("\r\n", $lines);
$boundary = 'aw' . bin2hex(random_bytes(8));
$headers = "From: {$cfg['from']}\r\n" . (filter_var($mail, FILTER_VALIDATE_EMAIL) ? "Reply-To: $mail\r\n" : '') . "MIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=\"$boundary\"";
$body = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n$text\r\n";
$allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
if (!empty($_FILES['fotos']['name'])) {
  $n = min(5, count($_FILES['fotos']['name']));
  for ($i = 0; $i < $n; $i++) {
    if ($_FILES['fotos']['error'][$i] !== UPLOAD_ERR_OK || $_FILES['fotos']['size'][$i] > 8 * 1024 * 1024) continue;
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($_FILES['fotos']['tmp_name'][$i]);
    if (!in_array($mime, $allowed, true)) continue;
    $fn = preg_replace('/[^A-Za-z0-9._-]/', '_', basename($_FILES['fotos']['name'][$i]));
    $body .= "--$boundary\r\nContent-Type: $mime; name=\"$fn\"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"$fn\"\r\n\r\n" . chunk_split(base64_encode(file_get_contents($_FILES['fotos']['tmp_name'][$i]))) . "\r\n";
  }
}
$body .= "--$boundary--";
$subject = '=?UTF-8?B?' . base64_encode($cfg['subject']) . '?=';
if (!mail($cfg['to'], $subject, $body, $headers)) out(false, 'mail', 500);
out(true);

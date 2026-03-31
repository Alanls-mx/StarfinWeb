<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
$input = json_decode(file_get_contents('php://input'), true);
$licenseKey = $input['licenseKey'] ?? null;
$serverIp = $input['serverIp'] ?? null;
if (!$licenseKey) { echo json_encode(['success'=>false,'message'=>'licenseKey required']); exit; }
require_once __DIR__ . '/../db.php';
$stmt = $pdo->prepare('SELECT id, `key`, client_name, plan, expires_at, is_active, allowed_plugins_json FROM licenses WHERE `key` = ? LIMIT 1');
$stmt->execute([$licenseKey]);
$row = $stmt->fetch();
if (!$row) { echo json_encode(['success'=>false,'valid'=>false,'message'=>'License not found']); exit; }
$expiresTs = strtotime($row['expires_at']);
$now = time();
$valid = $row['is_active'] ? ($expiresTs === false ? false : ($expiresTs >= $now)) : false;
$allowed = $row['allowed_plugins_json'];
$plugins = [];
if ($allowed) {
    $decoded = json_decode($allowed, true);
    if (is_array($decoded)) $plugins = $decoded;
}
$response = [
    'success' => true,
    'valid' => $valid,
    'licenseKey' => $row['key'],
    'clientName' => $row['client_name'],
    'plan' => $row['plan'],
    'expiresAt' => gmdate('Y-m-d\TH:i:s\Z', $expiresTs ?: $now),
    'isActive' => (bool)$row['is_active'],
    'allowedPlugins' => $plugins,
    'serverIp' => $serverIp,
];
echo json_encode($response);

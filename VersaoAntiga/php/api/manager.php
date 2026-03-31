<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
require_once __DIR__ . '/../db.php';
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
    $stmt = $pdo->query('SELECT id, `key`, client_name, plan, expires_at, is_active, allowed_plugins_json FROM licenses ORDER BY id DESC');
    $rows = $stmt->fetchAll();
    $out = array_map(function($r){
        $plugins = [];
        if (!empty($r['allowed_plugins_json'])) {
            $decoded = json_decode($r['allowed_plugins_json'], true);
            if (is_array($decoded)) $plugins = $decoded;
        }
        return [
          'id'=>(int)$r['id'],
          'key'=>$r['key'],
          'clientName'=>$r['client_name'],
          'plan'=>$r['plan'],
          'expiresAt'=>gmdate('Y-m-d\TH:i:s\Z', strtotime($r['expires_at'])),
          'isActive'=>(bool)$r['is_active'],
          'allowedPlugins'=>$plugins,
        ];
    }, $rows);
    echo json_encode(['success'=>true,'licenses'=>$out]);
    exit;
}
$input = json_decode(file_get_contents('php://input'), true);
if ($method === 'POST') {
    $key = $input['key'] ?? null;
    $clientName = $input['clientName'] ?? null;
    $plan = $input['plan'] ?? null;
    $expiresAt = $input['expiresAt'] ?? null;
    $isActive = isset($input['isActive']) ? (int)!!$input['isActive'] : 1;
    $allowedPlugins = $input['allowedPlugins'] ?? [];
    if (!$key || !$clientName || !$plan || !$expiresAt) { echo json_encode(['success'=>false,'message'=>'Missing fields']); exit; }
    $expires = date('Y-m-d H:i:s', strtotime($expiresAt));
    $pluginsJson = json_encode(is_array($allowedPlugins) ? $allowedPlugins : []);
    $stmt = $pdo->prepare('INSERT INTO licenses (`key`, client_name, plan, expires_at, is_active, allowed_plugins_json) VALUES (?,?,?,?,?,?)');
    try {
        $stmt->execute([$key,$clientName,$plan,$expires,$isActive,$pluginsJson]);
        echo json_encode(['success'=>true,'license'=>['key'=>$key]]); exit;
    } catch (PDOException $e) {
        echo json_encode(['success'=>false,'message'=>'Insert failed']); exit;
    }
}
if ($method === 'PUT') {
    $key = $input['key'] ?? null;
    if (!$key) { echo json_encode(['success'=>false,'message'=>'key required']); exit; }
    $fields = [];
    $values = [];
    if (isset($input['clientName'])) { $fields[] = 'client_name = ?'; $values[] = $input['clientName']; }
    if (isset($input['plan'])) { $fields[] = 'plan = ?'; $values[] = $input['plan']; }
    if (isset($input['expiresAt'])) { $fields[] = 'expires_at = ?'; $values[] = date('Y-m-d H:i:s', strtotime($input['expiresAt'])); }
    if (isset($input['isActive'])) { $fields[] = 'is_active = ?'; $values[] = (int)!!$input['isActive']; }
    if (isset($input['allowedPlugins'])) { $fields[] = 'allowed_plugins_json = ?'; $values[] = json_encode($input['allowedPlugins']); }
    if (empty($fields)) { echo json_encode(['success'=>false,'message'=>'No fields']); exit; }
    $values[] = $key;
    $stmt = $pdo->prepare('UPDATE licenses SET '.implode(',', $fields).' WHERE `key` = ?');
    $stmt->execute($values);
    echo json_encode(['success'=>true]); exit;
}
if ($method === 'DELETE') {
    $key = $_GET['key'] ?? ($input['key'] ?? null);
    if (!$key) { echo json_encode(['success'=>false,'message'=>'key required']); exit; }
    $stmt = $pdo->prepare('DELETE FROM licenses WHERE `key` = ?');
    $stmt->execute([$key]);
    echo json_encode(['success'=>true]); exit;
}
echo json_encode(['success'=>false,'message'=>'Method not allowed']);

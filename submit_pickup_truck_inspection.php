<?php
// submit_pickup_truck_inspection.php
header('Content-Type: application/json');

try {
  // --- DB connection ---
  // If your db_connection_info.php sets $pdo, this will use it.
  // Otherwise it will try to read constants DB_HOST, DB_NAME, DB_USER, DB_PASS.
  $pdo = null;
  if (file_exists(__DIR__ . '/db_connection_info.php')) {
    require_once __DIR__ . '/db_connection_info.php';
  }
  if (!$pdo) {
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
  }

  // --- Ensure table exists (safe to run each time) ---
  $pdo->exec("
    CREATE TABLE IF NOT EXISTS pickup_truck_inspections (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      inspection_date DATE NOT NULL,
      inspected_by VARCHAR(255) NOT NULL,
      truck_fluids JSON NULL,
      truck_exterior JSON NULL,
      truck_interior JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  ");

  // --- Validate & collect POST body ---
  $inspection_date = isset($_POST['inspection_date']) ? trim($_POST['inspection_date']) : null;
  $inspected_by    = isset($_POST['inspected_by']) ? trim($_POST['inspected_by']) : null;

  // These are checkbox arrays; they may be missing if nothing was checked
  $truck_fluids   = isset($_POST['truck_fluids'])   && is_array($_POST['truck_fluids'])   ? $_POST['truck_fluids']   : [];
  $truck_exterior = isset($_POST['truck_exterior']) && is_array($_POST['truck_exterior']) ? $_POST['truck_exterior'] : [];
  $truck_interior = isset($_POST['truck_interior']) && is_array($_POST['truck_interior']) ? $_POST['truck_interior'] : [];

  if (!$inspection_date || !$inspected_by) {
    http_response_code(422);
    echo json_encode([
      'status'  => 'error',
      'message' => 'inspection_date and inspected_by are required.'
    ]);
    exit;
  }

  // --- Insert ---
  $stmt = $pdo->prepare("
    INSERT INTO pickup_truck_inspections
      (inspection_date, inspected_by, truck_fluids, truck_exterior, truck_interior)
    VALUES
      (:inspection_date, :inspected_by, :truck_fluids, :truck_exterior, :truck_interior)
  ");

  $stmt->execute([
    ':inspection_date' => $inspection_date,
    ':inspected_by'    => $inspected_by,
    ':truck_fluids'    => json_encode($truck_fluids,   JSON_UNESCAPED_UNICODE),
    ':truck_exterior'  => json_encode($truck_exterior, JSON_UNESCAPED_UNICODE),
    ':truck_interior'  => json_encode($truck_interior, JSON_UNESCAPED_UNICODE),
  ]);

  echo json_encode([
    'status'  => 'success',
    'message' => 'Inspection saved.',
    'id'      => $pdo->lastInsertId()
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    'status'  => 'error',
    'message' => 'Server error: ' . $e->getMessage()
  ]);
}

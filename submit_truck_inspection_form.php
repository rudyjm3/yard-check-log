<?php
// submit_truck_inspection_form.php
header('Content-Type: application/json');

try {
  require_once __DIR__ . '/db_connection_info.php'; // must define $conn (PDO)

  // Create table if it doesn't exist yet
  $conn->exec("
    CREATE TABLE IF NOT EXISTS truck_inspections (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      form_type ENUM('pro','rental') NOT NULL,
      inspection_date DATE NOT NULL,
      inspected_by VARCHAR(255) NOT NULL,
      truck_fluids JSON NULL,
      truck_exterior JSON NULL,
      truck_interior JSON NULL,
      inspection_comments TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  ");

  // Collect POST
  $form_type = isset($_POST['form_type']) ? trim($_POST['form_type']) : null;   // 'pro' | 'rental'
  $date      = isset($_POST['inspection_date']) ? trim($_POST['inspection_date']) : null;
  $inspector = isset($_POST['inspected_by']) ? trim($_POST['inspected_by']) : null;

  $fluids    = isset($_POST['truck_fluids'])   && is_array($_POST['truck_fluids'])   ? $_POST['truck_fluids']   : [];
  $exterior  = isset($_POST['truck_exterior']) && is_array($_POST['truck_exterior']) ? $_POST['truck_exterior'] : [];
  $interior  = isset($_POST['truck_interior']) && is_array($_POST['truck_interior']) ? $_POST['truck_interior'] : [];
  $comments  = isset($_POST['inspection_comments']) ? trim($_POST['inspection_comments']) : null;

  // Optional edit support
  $edit_id   = isset($_POST['id']) && ctype_digit($_POST['id']) ? (int)$_POST['id'] : null;

  if (!$form_type || !in_array($form_type, ['pro','rental'], true)) {
    http_response_code(422);
    echo json_encode(['status'=>'error','message'=>'Invalid or missing form_type.']);
    exit;
  }
  if (!$date || !$inspector) {
    http_response_code(422);
    echo json_encode(['status'=>'error','message'=>'inspection_date and inspected_by are required.']);
    exit;
  }

  if ($edit_id) {
    $stmt = $conn->prepare("
      UPDATE truck_inspections SET
        form_type=:form_type,
        inspection_date=:inspection_date,
        inspected_by=:inspected_by,
        truck_fluids=:fluids,
        truck_exterior=:exterior,
        truck_interior=:interior,
        inspection_comments=:comments
      WHERE id=:id
    ");
    $stmt->execute([
      ':form_type'       => $form_type,
      ':inspection_date' => $date,
      ':inspected_by'    => $inspector,
      ':fluids'          => json_encode($fluids, JSON_UNESCAPED_UNICODE),
      ':exterior'        => json_encode($exterior, JSON_UNESCAPED_UNICODE),
      ':interior'        => json_encode($interior, JSON_UNESCAPED_UNICODE),
      ':comments'        => $comments,
      ':id'              => $edit_id
    ]);
    echo json_encode(['status'=>'success','message'=>'Inspection updated.','id'=>$edit_id]);
    exit;
  }

  $stmt = $conn->prepare("
    INSERT INTO truck_inspections
      (form_type, inspection_date, inspected_by, truck_fluids, truck_exterior, truck_interior, inspection_comments)
    VALUES
      (:form_type, :inspection_date, :inspected_by, :fluids, :exterior, :interior, :comments)
  ");
  $stmt->execute([
    ':form_type'       => $form_type,
    ':inspection_date' => $date,
    ':inspected_by'    => $inspector,
    ':fluids'          => json_encode($fluids, JSON_UNESCAPED_UNICODE),
    ':exterior'        => json_encode($exterior, JSON_UNESCAPED_UNICODE),
    ':interior'        => json_encode($interior, JSON_UNESCAPED_UNICODE),
    ':comments'        => $comments
  ]);

  echo json_encode(['status'=>'success','message'=>'Inspection saved.','id'=>$conn->lastInsertId()]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['status'=>'error','message'=>'Server error: '.$e->getMessage()]);
}

<?php
// get_truck_inspections.php
header('Content-Type: application/json');

try {
    require_once __DIR__ . '/db_connection_info.php';

    $stmt = $conn->query("
        SELECT
            id,
            form_type,
            inspection_date,
            inspected_by,
            truck_fluids,
            truck_exterior,
            truck_interior,
            inspection_comments,
            created_at,
            updated_at
        FROM truck_inspections
        ORDER BY created_at DESC
    ");

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $inspections = array_map(static function (array $row): array {
        $decode = static function (?string $json): array {
            if ($json === null || $json === '') {
                return [];
            }
            $decoded = json_decode($json, true);
            return is_array($decoded) ? $decoded : [];
        };

        return [
            'id' => (int) $row['id'],
            'form_type' => $row['form_type'],
            'inspection_date' => $row['inspection_date'],
            'inspected_by' => $row['inspected_by'],
            'truck_fluids' => $decode($row['truck_fluids']),
            'truck_exterior' => $decode($row['truck_exterior']),
            'truck_interior' => $decode($row['truck_interior']),
            'inspection_comments' => $row['inspection_comments'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
        ];
    }, $rows);

    echo json_encode([
        'status' => 'success',
        'data' => $inspections,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage(),
    ]);
}

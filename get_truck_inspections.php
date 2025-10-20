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

    $currentYear = (int) date('Y');
    $currentMonth = (int) date('n'); // 1-12
    $periodLabel = date('F Y');

    $latestByType = [
        'pro' => null,
        'rental' => null,
    ];

    foreach ($rows as $row) {
        $formType = $row['form_type'] ?? null;
        if (!isset($latestByType[$formType])) {
            continue;
        }

        $inspectionDate = $row['inspection_date'] ?? null;
        $hasValidInspectionDate = $inspectionDate && $inspectionDate !== '0000-00-00';
        $dateValue = $hasValidInspectionDate ? $inspectionDate : ($row['created_at'] ?? null);
        $sourceField = $hasValidInspectionDate ? 'inspection_date' : 'created_at';

        if (!$dateValue) {
            continue;
        }

        try {
            $date = new DateTime($dateValue);
        } catch (Exception $e) {
            continue;
        }

        if ((int) $date->format('Y') !== $currentYear || (int) $date->format('n') !== $currentMonth) {
            continue;
        }

        $timestamp = (int) $date->format('U');
        $currentLatest = $latestByType[$formType]['timestamp'] ?? null;
        if ($currentLatest !== null && $currentLatest >= $timestamp) {
            continue;
        }

        $latestByType[$formType] = [
            'record_id' => (int) $row['id'],
            'inspection_date' => $row['inspection_date'],
            'submitted_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'source_field' => $sourceField,
            'timestamp' => $timestamp,
        ];
    }

    $missingFormTypes = [];
    foreach ($latestByType as $type => $info) {
        if ($info === null) {
            $missingFormTypes[] = $type;
        } else {
            unset($latestByType[$type]['timestamp']);
        }
    }

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
        'meta' => [
            'current_year' => $currentYear,
            'current_month' => $currentMonth,
            'period_label' => $periodLabel,
            'missing_form_types' => $missingFormTypes,
            'latest_submissions' => [
                'pro' => $latestByType['pro'],
                'rental' => $latestByType['rental'],
            ],
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage(),
    ]);
}

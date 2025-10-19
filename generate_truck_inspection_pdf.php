<?php
// generate_truck_inspection_pdf.php

require_once __DIR__ . '/db_connection_info.php';
require_once __DIR__ . '/fpdf/fpdf.php';

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$id) {
    http_response_code(400);
    echo 'Invalid inspection id.';
    exit;
}

$stmt = $conn->prepare("
    SELECT
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
    WHERE id = :id
    LIMIT 1
");
$stmt->execute([':id' => $id]);
$inspection = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$inspection) {
    http_response_code(404);
    echo 'Inspection not found.';
    exit;
}

$decode = static function (?string $json): array {
    if ($json === null || $json === '') {
        return [];
    }
    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : [];
};

$CHECKBOX_LABELS = [
    'all_fluids_topped' => 'All fluids are topped off',
    'license_plate_present' => 'License plate present with up-to-date sticker',
    'damage_to_vehicle' => 'Damage to the vehicle',
    'tires_inflation_and_wear' => 'Tires for appropriate inflation, tread wear and cuts',
    'lights_operation_and_lens' => 'Headlights, tail lights and turn signals for cracked lens and operation',
    'glass_and_mirrors' => 'Glass and mirrors for cracks and operation',
    'wipers_operation_and_wear' => 'Windshield wipers for operation and wear',
    'bed_and_tailgate' => 'Truck bed sides and tail gate for operation and broken hinges',
    'load_sensor_checked' => 'Load sensor inspected and activated',
    'decals_condition' => 'Decals are present and in good condition',
    'tow_hitch_locked_or_welded' => 'Tow hitch has a weld or locking mechanism (2015+ models)',
    'seatbelts' => 'Seatbelts for operation, cuts or frays',
    'horn_operation' => 'Steering wheel horn for operation',
    'parking_brake' => 'Parking brake engages',
    'spare_tire_inflated' => 'Spare tire properly inflated (vans only) and tools',
    'ac_heater' => 'AC and heating are operational',
    'registration_insurance' => 'Registration, insurance card, and accident documents in glove box',
    'decals_interior' => 'Interior decals are present and in good condition',
    'toll_transponder' => 'Toll transponder (if applicable)',
    'fire_extinguisher' => 'Fire extinguisher present, charged, inspection current'
];

$mapChecklistValues = static function (array $values) use ($CHECKBOX_LABELS): array {
    return array_map(
        static function ($code) use ($CHECKBOX_LABELS) {
            if (isset($CHECKBOX_LABELS[$code])) {
                return $CHECKBOX_LABELS[$code];
            }
            $label = str_replace('_', ' ', (string) $code);
            return ucwords($label);
        },
        $values
    );
};

$fluids = $mapChecklistValues($decode($inspection['truck_fluids']));
$exterior = $mapChecklistValues($decode($inspection['truck_exterior']));
$interior = $mapChecklistValues($decode($inspection['truck_interior']));

$formTypeLabel = $inspection['form_type'] === 'pro'
    ? 'Load N Go Monthly Inspection Checklist'
    : 'Rental Pickup Truck Monthly Inspection Checklist';

$inspectionNote = "Note: If any item is incorrect or inoperable, please correct. "
    . "If repair cannot be completed onsite and affects safe operation or Load Sensor, "
    . "tag the vehicle \"Out of Service\" and contact Element at 1-888-562-3646 or "
    . "customercareus.fleet@elementcorp.com.";

/**
 * Safely convert UTF-8 text to Windows-1252 for FPDF output.
 */
$encode = static function (?string $text): string {
    $text = $text ?? '';
    $converted = iconv('UTF-8', 'windows-1252//TRANSLIT', $text);
    return $converted !== false ? $converted : $text;
};

$formatDateTime = static function (?string $value): ?string {
    if (!$value) {
        return null;
    }
    try {
        $dateTime = new DateTime($value);
        return $dateTime->format('m/d/Y g:i A');
    } catch (Exception $e) {
        return $value;
    }
};

$pdf = new FPDF();
$leftMargin = 15;
$rightMargin = 15;
$topMargin = 20;
$pdf->SetMargins($leftMargin, $topMargin, $rightMargin);
$pdf->SetAutoPageBreak(true, 20);
$pdf->SetTitle($encode($formTypeLabel));
$pdf->AddPage();
$usableWidth = $pdf->GetPageWidth() - $leftMargin - $rightMargin;
$pdf->SetDrawColor(200, 200, 200);
$pdf->SetFillColor(245, 245, 245);
$pdf->SetLineWidth(0.3);
$pdf->SetFont('Arial', 'B', 16);
$pdf->Cell(0, 12, $encode($formTypeLabel), 0, 1, 'C', true);

$pdf->Ln(2);
$pdf->SetFont('Arial', '', 12);
$pdf->Cell(50, 8, $encode('Form Type:'), 0, 0);
$pdf->Cell(0, 8, $encode($formTypeLabel), 0, 1);

$pdf->Cell(50, 8, $encode('Inspection Date:'), 0, 0);
$pdf->Cell(0, 8, $encode($inspection['inspection_date']), 0, 1);

$pdf->Cell(50, 8, $encode('Inspected By:'), 0, 0);
$pdf->Cell(0, 8, $encode($inspection['inspected_by']), 0, 1);

if (!empty($inspection['created_at'])) {
    $submitted = $formatDateTime($inspection['created_at']);
    $pdf->Cell(50, 8, $encode('Submitted:'), 0, 0);
    $pdf->Cell(0, 8, $encode($submitted ?? $inspection['created_at']), 0, 1);
}

if (!empty($inspection['updated_at'])) {
    $updated = $formatDateTime($inspection['updated_at']);
    $pdf->Cell(50, 8, $encode('Last Updated:'), 0, 0);
    $pdf->Cell(0, 8, $encode($updated ?? $inspection['updated_at']), 0, 1);
}

$pdf->Ln(5);

$printChecklist = static function (FPDF $pdf, string $title, array $items) use ($encode, $leftMargin, $usableWidth): void {
    if (empty($items)) {
        return;
    }

    $startX = $leftMargin;
    $startY = $pdf->GetY();

    $pdf->SetFont('Arial', 'B', 12);
    $pdf->Cell(0, 8, $encode($title), 0, 1);

    $pdf->SetFont('Arial', '', 11);
    foreach ($items as $item) {
        $pdf->SetX($leftMargin + 4);
        $pdf->MultiCell($usableWidth - 8, 6, $encode('[x] ' . (string) $item), 0, 'L');
    }

    $endY = $pdf->GetY();
    $sectionHeight = $endY - $startY;
    $pdf->SetDrawColor(200, 200, 200);
    $pdf->Rect($startX, $startY - 1.5, $usableWidth, $sectionHeight + 3);
    $pdf->Ln(2);
};

$printChecklist($pdf, 'Truck Fluids', $fluids);
$printChecklist($pdf, 'Truck Exterior', $exterior);
$printChecklist($pdf, 'Truck Interior', $interior);

$comments = trim((string) ($inspection['inspection_comments'] ?? ''));
if ($comments !== '') {
    $startX = $leftMargin;
    $startY = $pdf->GetY();

    $pdf->SetFont('Arial', 'B', 12);
    $pdf->Cell(0, 8, $encode('Comments'), 0, 1);

    $pdf->SetFont('Arial', '', 11);
    $pdf->SetX($leftMargin + 4);
    $pdf->MultiCell($usableWidth - 8, 6, $encode($comments), 0, 'L');

    $endY = $pdf->GetY();
    $sectionHeight = $endY - $startY;
    $pdf->SetDrawColor(200, 200, 200);
    $pdf->Rect($startX, $startY - 1.5, $usableWidth, $sectionHeight + 3);
    $pdf->Ln(2);
}

$pdf->Ln(3);
$pdf->SetFont('Arial', 'I', 10);
$pdf->MultiCell(0, 6, $encode($inspectionNote), 0, 'L');

$pdf->Output('I', "inspection-{$id}.pdf");


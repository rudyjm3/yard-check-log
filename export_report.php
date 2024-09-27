<?php
// export_report.php

include 'db_connection.php';

$format = $_GET['format'];
$start_date = $_GET['start_date'];
$end_date = $_GET['end_date'];

// Fetch stats
// (Same as in get_equipment_stats.php, so you may consider refactoring to avoid duplication)

include 'get_equipment_stats.php'; // Reuse the code to get stats

if ($format === 'csv') {
    // Export as CSV
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="equipment_stats.csv"');

    $output = fopen('php://output', 'w');

    // Header
    fputcsv($output, ['Equipment Name', 'Days Rented', 'Estimated Profit', 'Days Out of Service', 'Profit Loss']);

    // Data
    foreach ($equipmentStats as $item) {
        fputcsv($output, [
            $item['equipment_name'],
            $item['days_rented'],
            number_format($item['estimated_profit'], 2),
            $item['days_out_of_service'],
            number_format($item['profit_loss'], 2)
        ]);
    }

    fclose($output);
} elseif ($format === 'pdf') {
    // Export as PDF
    require('fpdf/fpdf.php'); // Use FPDF library

    $pdf = new FPDF();
    $pdf->AddPage();

    // Title
    $pdf->SetFont('Arial', 'B', 16);
    $pdf->Cell(0, 10, 'Equipment Stats Report', 0, 1, 'C');

    // Date Range
    $pdf->SetFont('Arial', '', 12);
    $pdf->Cell(0, 10, "Date Range: $start_date to $end_date", 0, 1, 'C');

    // Table Header
    $pdf->SetFont('Arial', 'B', 12);
    $pdf->Cell(50, 10, 'Equipment Name', 1);
    $pdf->Cell(30, 10, 'Days Rented', 1);
    $pdf->Cell(40, 10, 'Estimated Profit', 1);
    $pdf->Cell(40, 10, 'Days Out of Service', 1);
    $pdf->Cell(30, 10, 'Profit Loss', 1);
    $pdf->Ln();

    // Data
    $pdf->SetFont('Arial', '', 12);
    foreach ($equipmentStats as $item) {
        $pdf->Cell(50, 10, $item['equipment_name'], 1);
        $pdf->Cell(30, 10, $item['days_rented'], 1);
        $pdf->Cell(40, 10, '$' . number_format($item['estimated_profit'], 2), 1);
        $pdf->Cell(40, 10, $item['days_out_of_service'], 1);
        $pdf->Cell(30, 10, '$' . number_format($item['profit_loss'], 2), 1);
        $pdf->Ln();
    }

    $pdf->Output('D', 'equipment_stats.pdf');
} else {
    echo "Invalid format specified.";
}
?>

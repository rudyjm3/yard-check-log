<?php
header('Content-Type: application/json');

// Database connection details
include 'db-conn-info.php';

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    die();
}

// Fetch entries from the database
$sql = "SELECT * FROM maintenance_log";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $entries = [];
    while($row = $result->fetch_assoc()) {
        $entries[] = $row;
    }
    echo json_encode($entries);
} else {
    echo json_encode([]);
}

$conn->close();
?>

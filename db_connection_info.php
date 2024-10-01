<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// db_connection.php
//Database connection details

// Local Development database
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "u207292155_yard_check_db";

// Live server database
// $servername = "localhost";
// $username = "rudyjm33"; // Replace with your actual username
// $password = "Matrix_1645"; // Replace with your actual password
// $dbname = "u207292155_yard_check_db";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    // Set PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Database Connection failed: " . $e->getMessage());
}
?>

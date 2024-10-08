<?php
header("Cache-Control: no-cache, no-store, must-revalidate"); // Forces caches to always check for updates
header("Pragma: no-cache"); // HTTP 1.0 compatibility
header("Expires: 0"); // Ensures the content is always considered expired

// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// **Check if the Database Connection Sets a Time Zone:
//$conn->exec("SET time_zone = 'America/New_York';"); // Replace with your time zone
// **

//Database connection details

// Local Development database
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "u207292155_yard_check_db";

// Live server database
// $servername = "localhost";
// $username = "u207292155_rudyjm33";
// $password = "Matrix_1645";
// $dbname = "u207292155_yard_check_db";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    // Set PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Database Connection failed: " . $e->getMessage());
}
?>

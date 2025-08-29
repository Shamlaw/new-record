<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Include database configuration
require_once '../config/database.php';

try {
    // Get database configuration
    $config = include '../config/database.php';
    
    // Create PDO connection
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']};port={$config['port']}";
    $pdo = new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Get query parameters
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? min(100, max(1, intval($_GET['limit']))) : 20;
    $offset = ($page - 1) * $limit;
    
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $district = isset($_GET['district']) ? trim($_GET['district']) : '';
    $taluk = isset($_GET['taluk']) ? trim($_GET['taluk']) : '';
    $year = isset($_GET['year']) ? trim($_GET['year']) : '';
    
    // Build WHERE clause
    $whereConditions = [];
    $params = [];
    
    if (!empty($search)) {
        $whereConditions[] = "(Office_Name LIKE :search OR File_No LIKE :search OR Sub LIKE :search)";
        $params['search'] = "%{$search}%";
    }
    
    if (!empty($district)) {
        $whereConditions[] = "district_code = :district";
        $params['district'] = $district;
    }
    
    if (!empty($taluk)) {
        $whereConditions[] = "taluk_code = :taluk";
        $params['taluk'] = $taluk;
    }
    
    if (!empty($year)) {
        $whereConditions[] = "Year = :year";
        $params['year'] = $year;
    }
    
    $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
    
    // Get total count
    $countQuery = "SELECT COUNT(*) as total FROM villagedata {$whereClause}";
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->execute($params);
    $totalRecords = $countStmt->fetch()['total'];
    
    // Get data
    $dataQuery = "SELECT * FROM villagedata {$whereClause} ORDER BY Sl_No LIMIT :limit OFFSET :offset";
    $dataStmt = $pdo->prepare($dataQuery);
    
    // Bind parameters
    foreach ($params as $key => $value) {
        $dataStmt->bindValue(":{$key}", $value);
    }
    $dataStmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $dataStmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $dataStmt->execute();
    $data = $dataStmt->fetchAll();
    
    // Get unique values for filters
    $filtersQuery = "SELECT DISTINCT district_code, taluk_code, Year FROM villagedata ORDER BY district_code ASC, taluk_code ASC, Year DESC";
    $filtersStmt = $pdo->prepare($filtersQuery);
    $filtersStmt->execute();
    $filtersData = $filtersStmt->fetchAll();
    
    $districts = array_unique(array_column($filtersData, 'district_code'));
    $taluks = array_unique(array_column($filtersData, 'taluk_code'));
    $years = array_unique(array_column($filtersData, 'Year'));
    
    // Return response
    echo json_encode([
        'success' => true,
        'data' => $data,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $totalRecords,
            'pages' => ceil($totalRecords / $limit)
        ],
        'filters' => [
            'districts' => array_values($districts),
            'taluks' => array_values($taluks),
            'years' => array_values($years)
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed',
        'message' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred',
        'message' => $e->getMessage()
    ]);
}
?>
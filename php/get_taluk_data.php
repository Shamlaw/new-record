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
    $year = isset($_GET['year']) ? trim($_GET['year']) : '';
    $office = isset($_GET['office']) ? trim($_GET['office']) : '';
    
    // Build WHERE clause
    $whereConditions = [];
    $params = [];
    
    if (!empty($search)) {
        $whereConditions[] = "(Office_Name LIKE :search OR File_No LIKE :search OR Sub LIKE :search)";
        $params['search'] = "%{$search}%";
    }
    
    if (!empty($year)) {
        $whereConditions[] = "Year = :year";
        $params['year'] = $year;
    }
    
    if (!empty($office)) {
        $whereConditions[] = "Office_Name = :office";
        $params['office'] = $office;
    }
    
    $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
    
    // Get total count
    $countQuery = "SELECT COUNT(*) as total FROM talukofficedata {$whereClause}";
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->execute($params);
    $totalRecords = $countStmt->fetch()['total'];
    
    // Get data
    $dataQuery = "SELECT * FROM talukofficedata {$whereClause} ORDER BY Sl_No LIMIT :limit OFFSET :offset";
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
    $filtersQuery = "SELECT DISTINCT Year, Office_Name FROM talukofficedata ORDER BY Year DESC, Office_Name ASC";
    $filtersStmt = $pdo->prepare($filtersQuery);
    $filtersStmt->execute();
    $filtersData = $filtersStmt->fetchAll();
    
    $years = array_unique(array_column($filtersData, 'Year'));
    $offices = array_unique(array_column($filtersData, 'Office_Name'));
    
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
            'years' => array_values($years),
            'offices' => array_values($offices)
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
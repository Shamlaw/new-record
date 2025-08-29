# Record Room Data Viewer

A mobile-friendly web application for viewing and searching administrative records from Taluk Offices and Village data.

🌐 **Live Demo**: [https://shamlaw.github.io/new-record/](https://shamlaw.github.io/new-record/)

## Features

- **Responsive Design**: Mobile-friendly interface that works on all devices
- **Search & Filter**: Advanced search and filtering capabilities
- **Data Tables**: Clean, organized display of records with pagination
- **Attractive UI**: Modern Bootstrap-based design with smooth animations
- **Easy Navigation**: Intuitive navigation between different data sections

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Backend**: PHP 8+
- **Database**: MySQL/MariaDB
- **Icons**: Font Awesome

## Setup Instructions

### Prerequisites

- Web server with PHP 8+ support (Apache/Nginx)
- MySQL/MariaDB database server
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shamlaw/new-record.git
   cd new-record
   ```

2. **Database Setup**
   - Import the provided SQL file into your MySQL database:
     ```sql
     mysql -u your_username -p your_database < rccmsin_record_room.sql
     ```

3. **Configure Database Connection**
   - Edit `config/database.php` with your database credentials:
     ```php
     return [
         'host' => 'localhost',
         'username' => 'your_username',
         'password' => 'your_password',
         'database' => 'rccmsin_record_room',
         'charset' => 'utf8mb4',
         'port' => 3306
     ];
     ```

4. **Deploy to Web Server**
   - Upload files to your web server's document root
   - Ensure PHP has read/write permissions for the application directory

5. **Access the Application**
   - Open your web browser and navigate to your domain
   - The application will load with the homepage

## File Structure

```
new-record/
├── index.html              # Main application file
├── css/
│   └── style.css          # Custom styles
├── js/
│   └── app.js             # JavaScript functionality
├── php/
│   ├── get_taluk_data.php # Taluk office data API
│   └── get_village_data.php # Village data API
├── config/
│   └── database.php       # Database configuration
├── rccmsin_record_room.sql # Database schema and data
└── README.md              # This file
```

## Usage

### Home Page
- Clean interface with navigation to different data sections
- Feature cards highlighting main functionality

### Taluk Office Data
- View records from various Taluk offices
- Search by office name, file number, or description
- Filter by year and office
- Paginated results for better performance

### Village Data
- Browse village-level administrative records
- Advanced filtering by district, taluk, and village codes
- Search across multiple fields
- Geographic organization of data

### Mobile Experience
- Fully responsive design
- Touch-friendly interface
- Optimized for mobile devices
- Smooth scrolling and animations

## API Endpoints

### GET /php/get_taluk_data.php
Retrieve Taluk office data with optional filtering.

**Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Records per page (default: 20, max: 100)
- `search` (string): Search term
- `year` (string): Filter by year
- `office` (string): Filter by office name

### GET /php/get_village_data.php
Retrieve village data with optional filtering.

**Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Records per page (default: 20, max: 100)
- `search` (string): Search term
- `district` (string): Filter by district code
- `taluk` (string): Filter by taluk code
- `year` (string): Filter by year

## Database Tables

### talukofficedata
Contains records from Taluk offices with the following key fields:
- `Sl_No`: Serial number
- `Office_Name`: Name of the office
- `File_No`: File number/reference
- `Year`: Year of the record
- `file_id`: Unique file identifier
- `data-category`: Type of record

### villagedata
Contains village-level records with additional geographic information:
- `Sl_No`: Serial number
- `district_code`: District identifier
- `taluk_code`: Taluk identifier
- `village_code`: Village identifier
- `Office_Name`: Name of the office
- `Year`: Year of the record
- `file_id`: Unique file identifier

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For issues or questions, please create an issue in the GitHub repository.
# Ridesharing Analytics Dashboard

A comprehensive web-based analytics dashboard for ridesharing data visualization and reporting.

## Features

- **📊 Real-time Analytics** - Upload CSV files and get instant insights
- **💰 Revenue Metrics** - Track total revenue, average ticket size, and per-driver earnings
- **📅 Calendar View** - Visual driver performance matrix with daily completed trips
- **📈 Interactive Charts** - Status overview, driver performance, and hourly distributions
- **🕐 Live Timestamps** - Perfect for screenshot reporting
- **🔍 Advanced Filters** - Filter by status, driver, and date ranges

## Usage

1. Open `enhanced_ridesharing_dashboard.html` in your web browser
2. Upload your CSV file using the file picker or drag & drop
3. Use filters to analyze specific time periods or drivers
4. Take screenshots for reporting - all charts show data labels and timestamps

## CSV Format

Expected columns:
- `Status` - Ride status (Completed, Cancelled, Driving, etc.)
- `Driver` - Driver name
- `Pickup date` - Format: dd.mm.yyyy hh:mm:ss
- `Completion date` - Format: dd.mm.yyyy hh:mm:ss
- `Fare in Yango Pro` - Revenue amount (NPR)
- `Mileage, km` - Distance traveled
- `Order code` - Unique ride identifier

## Key Metrics

- Total rides and completion rates
- Revenue analysis (total, average, per driver)
- Distance and duration analytics
- Driver performance rankings
- Hourly distribution patterns

## Built With

- HTML5, CSS3, JavaScript
- Chart.js for visualizations
- Responsive design for all devices

---

Built by [Husig.ai](https://husig.ai) for ridesharing analytics and reporting.

DB_URL= DB_CONNECTION=sqlite DB_DATABASE=/Users/sinan/Herd/irshad/backend/database/database.sqlite php artisan app:scrape-ngx-prices
DB_URL= DB_CONNECTION=sqlite DB_DATABASE=/Users/sinan/Herd/irshad/backend/database/database.sqlite php artisan news:aggregate
DB_URL= DB_CONNECTION=sqlite DB_DATABASE=/Users/sinan/Herd/irshad/backend/database/database.sqlite php artisan financials:fetch --skip-existing
DB_URL= DB_CONNECTION=sqlite DB_DATABASE=/Users/sinan/Herd/irshad/backend/database/database.sqlite php artisan data:consolidate

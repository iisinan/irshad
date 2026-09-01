import re

with open('backend/routes/api.php', 'r') as f:
    content = f.read()

import_stmt = "use App\Http\Controllers\SuggestionController;\n"
if "SuggestionController" not in content:
    content = content.replace("use Illuminate\Support\Facades\Route;", "use Illuminate\Support\Facades\Route;\n" + import_stmt)

# user routes
user_route = "\n        // Suggestions\n        Route::post('/suggestions', [SuggestionController::class, 'store']);"
if "/suggestions" not in content:
    content = content.replace("Route::get('/user', function (Request $request) {", user_route + "\n\n        Route::get('/user', function (Request $request) {")

# admin routes
admin_routes = """        // Admin Suggestions
        Route::get('/admin/suggestions', [SuggestionController::class, 'index']);
        Route::put('/admin/suggestions/{id}/status', [SuggestionController::class, 'updateStatus']);
        Route::delete('/admin/suggestions/{id}', [SuggestionController::class, 'destroy']);
"""
if "/admin/suggestions" not in content:
    content = content.replace("Route::get('/admin/dashboard-stats'", admin_routes + "\n        Route::get('/admin/dashboard-stats'")

with open('backend/routes/api.php', 'w') as f:
    f.write(content)

